import { format } from "prettier";
import Assistant from "..";
import { Channel } from "../../channels/construct";
import {
  DiscreteActionDerivedFromMessage,
  GlobalChannelMessage,
} from "../../types/main";
import { Agent } from "../agents/agent";
import { PROMPTS } from "../llm/prompts";

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

  public async getDiscreteActions(
    prompt: string
  ): Promise<Record<string, DiscreteActionDerivedFromMessage[]> | undefined> {
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
                      group_name: {
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
                              description:
                                "The action defined by the user's message.",
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

      const firstChoice = response?.choices[0].message;

      if (!firstChoice || !firstChoice?.function_call) {
        return undefined;
      }

      const { name, arguments: args } = firstChoice?.function_call;

      if (!name || !args) {
        return undefined;
      }

      const extractDiscreteActions = (args: {
        groups: {
          group_name: string;
          actions: {
            source_text: string;
            defined: string;
          }[];
        }[];
      }): Record<string, DiscreteActionDerivedFromMessage[]> => {
        const actions: Record<string, DiscreteActionDerivedFromMessage[]> = {};

        args.groups.forEach((group) => {
          actions[group.group_name] = group.actions.map((action) => {
            return {
              ...action,
              source_text: action.source_text,
            };
          });
        });

        return actions;
      };

      const actions = extractDiscreteActions(JSON.parse(args) as any);

      return actions;
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  public async getResponseToUserMessage({
    messages,
  }: {
    messages: GlobalChannelMessage[];
  }) {
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
          ...messages,
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
      const discreteActions = await this.getDiscreteActions(
        messages[messages.length - 1].content
      );

      if (!discreteActions) {
        return false;
      }

      if (this.verbose) {
        console.info("Discrete actions:");
        console.info(discreteActions);
        primaryChannel.sendMessageAsAssistant(
          {
            content: "Picked discrete actions.",
          },
          conversationId
        );
        primaryChannel.sendMessageAsAssistant(
          {
            content: format(JSON.stringify(discreteActions, null, 2), {
              parser: "json",
            }),
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

      primaryChannel.sendMessageAsAssistant(
        {
          content: response,
        },
        conversationId
      );

      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  public async userMessageToAgent({
    messages,
  }: {
    messages: GlobalChannelMessage[];
  }) {
    try {
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
