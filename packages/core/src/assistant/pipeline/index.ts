import { format } from "prettier";
import Assistant from "..";
import { Channel } from "../../channels/construct";
import { DiscreteActionsGrouped, GlobalChannelMessage } from "../../types/main";
import { Agent } from "../agents/agent";
import { PROMPTS } from "../llm/prompts";
import { parseFunctionCallOfType } from "../utils/function_calling";

export interface PipelineOptions {
  assistant: Assistant;
  agent?: Agent;
  verbose?: boolean;
}

export type ResponseModes = "converse" | "action";

export class Pipeline {
  private assistant: Assistant;
  private agent: Agent | undefined;
  private verbose: boolean = false;

  constructor({ assistant, verbose, agent }: PipelineOptions) {
    this.assistant = assistant;
    this.verbose = verbose ?? false;
    this.agent = agent;
  }

  public Assistant() {
    return this.assistant;
  }

  public async getDiscreteActions(prompt: string): Promise<DiscreteActionsGrouped | undefined> {
    try {
      const response = await this.assistant.Model()?.createChatCompletion({
        model: this.assistant.Model()?.PlanningModel(),
        messages: [
          {
            role: "system",
            content: PROMPTS.extractDiscreteActions.system.normal,
          },
          {
            role: "user",
            content: `
            The user's message is:
            "${prompt}"
            `,
          },
        ],
        functions: [
          {
            name: "extract_discrete_actions",
            parameters: {
              type: "object",
              properties: {
                groups: {
                  type: "array",
                  description: "A list of action groups.",
                  items: {
                    type: "object",
                    properties: {
                      name: {
                        type: "string",
                        description:
                          "A short name to describe the group, based off the actions in it.",
                      },
                      actions: {
                        type: "array",
                        description:
                          "A list of actions in the group, in the order that they should be taken.",
                        items: {
                          type: "object",
                          properties: {
                            source_text: {
                              type: "string",
                              description:
                                "The text in the user's message that corresponds to this step.",
                            },
                            defined: {
                              type: "string",
                              description: "A description of the action which should be taken.",
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              required: ["groups"],
            },
          },
        ],
        function_call: {
          name: "extract_discrete_actions",
        },
      });

      const firstChoice = response?.choices?.[0].message;

      if (!firstChoice || !firstChoice?.function_call) {
        return undefined;
      }

      const { name, arguments: args } = firstChoice?.function_call;

      if (!name || !args) {
        return undefined;
      }

      const parsedActions = parseFunctionCallOfType<DiscreteActionsGrouped | undefined>(args);

      if (!parsedActions) {
        return undefined;
      }

      return parsedActions;
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  public async getResponseToUserMessage({ messages }: { messages: GlobalChannelMessage[] }) {
    try {
      const response = await this.assistant.Model()?.createChatCompletion({
        model: this.assistant.Model()?.AgentModel(),
        messages: [
          {
            role: "system",
            content: `
             You are an assistant with the following description:
             "${this.assistant.Description()}"
   
             You are to respond to the user's message as an assistant.
             Instructions by the user are automatically parsed and executed by the system, you don't have to worry about them.
             Always respond as if you are capable of performing the actions, even if you are not sure, as the system will handle them.
             You should respond as if you have the intent to follow the instructions in the future.
             `,
          },
          ...this.Assistant().Model().getCleanedMessages(messages),
        ],
      });

      const firstChoice = response?.choices[0].message;

      if (!firstChoice) {
        return undefined;
      }

      return firstChoice.content;
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  public async actionIsCompleteByMessage({
    response,
    actions,
  }: {
    response: string;
    actions: DiscreteActionsGrouped;
  }): Promise<boolean> {
    try {
      const decision = await this.Assistant().Model()?.makeBooleanDecision(`
        Are the following actions properly completed solely by the response?
        You should respond yes if the actions described only require the agent to respond with the given response.
        You should respond no if the actions described require the agent to do something else as well as the initial response.

        Here are the actions that the agent must perform:
        ${actions.groups
          .map((action) => {
            return `${action.name}: \n${action.actions
              .map((a) => `- source: ${a.source_text} | system defined: ${a.defined}`)
              .join("\n")}`;
          })
          .join("\n\n")}

        Here is the response that the agent gave:
        ${response}
      `);

      if (this.verbose) {
        console.info("Decision:", decision?.decision);
        console.info("Reason:", decision?.reason);
      }

      return decision?.decision ?? false;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  public async userMessage({
    messages,
    primaryChannel,
    conversationId,
  }: {
    messages: GlobalChannelMessage[];
    primaryChannel: Channel;
    conversationId: string;
  }) {
    try {
      if (!this.assistant?.Model()) {
        return false;
      }
      const discreteActions = await this.getDiscreteActions(messages[messages.length - 1].content);

      if (!discreteActions) {
        return false;
      }

      if (this.verbose) {
        console.info("Discrete actions:", discreteActions);
        primaryChannel.sendMessageAsAssistant(
          {
            content: "Picked discrete actions.",
            type: "log",
          },
          conversationId
        );
        primaryChannel.sendMessageAsAssistant(
          {
            content: format(JSON.stringify(discreteActions, null, 2), {
              parser: "json",
            }),
            type: "log",
          },
          conversationId
        );
      }

      const response = await this.getResponseToUserMessage({
        messages,
      });

      if (!response) {
        return false;
      }

      if (this.verbose) {
        console.info("Response:", response);
        primaryChannel.sendMessageAsAssistant(
          {
            content: `Picked response: ${response}`,
            type: "log",
          },
          conversationId
        );
      }

      const actionIsComplete = await this.actionIsCompleteByMessage({
        response,
        actions: discreteActions,
      });

      if (this.verbose) {
        console.info("Action is complete:", actionIsComplete);

        primaryChannel.sendMessageAsAssistant(
          {
            content: `Action is complete: ${actionIsComplete}`,
            type: "log",
          },
          conversationId
        );
      }

      if (actionIsComplete) {
        if (this.verbose) {
          console.info("Marking action complete.");
          primaryChannel.sendMessageAsAssistant(
            {
              content: "Marking action completed.",
              type: "log",
            },
            conversationId
          );
        }

        primaryChannel.sendMessageAsAssistant(
          {
            content: response,
          },
          conversationId
        );
        return true;
      }

      // TODO: Complete the action since it's not done yet
      discreteActions.groups.forEach(async (group) => {
        const agent = await this.Assistant()
          ?.AgentManager()
          ?.dispatchAgentForActionGroup(group, primaryChannel, conversationId);

        if (this.verbose) {
          console.info("Dispatched agent for action group: ", group.name, agent?.Name());
          primaryChannel.sendMessageAsAssistant(
            {
              content: `Dispatched agent for action group: ${
                group.name
              }, with name: "${agent?.Name()}"`,
              type: "log",
            },
            conversationId
          );
        }
      });

      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  public async userMessageToAgent({ messages }: { messages: GlobalChannelMessage[] }) {
    try {
      console.log("Handling user message directly to agent.");
      if (!this.assistant?.Model()) {
        throw new Error("No model found.");
      }

      if (!this.agent) {
        throw new Error("No agent found.");
      }
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}
