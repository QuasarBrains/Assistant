import OpenAI from "openai";
import { ChatModel } from ".";
import {
  DiscreteActionDerivedFromMessage,
  DiscreteActionsGrouped,
  GlobalChannelMessage,
  Module,
  ModuleMethod,
} from "../../types/main";

export type AllowedOpenAIChatModels =
  OpenAI.ChatCompletionCreateParams["model"];

export type Tool = OpenAI.ChatCompletionTool & { method: ModuleMethod };

export interface OpenAIOptions {
  apiKey: string;
  agentModel?: AllowedOpenAIChatModels;
  planningModel?: AllowedOpenAIChatModels;
  baseURL?: string;
}

export class OpenAIChatModel extends ChatModel<Tool> {
  private client: OpenAI;
  private agentModel: AllowedOpenAIChatModels;
  private planningModel: string;
  public static readonly DEFAULT_AGENT_MODEL = "gpt-4";
  public static readonly DEFAULT_PLANNING_MODEL = "gpt-4";

  constructor({ apiKey, agentModel, planningModel, baseURL }: OpenAIOptions) {
    super();
    this.agentModel = agentModel || OpenAIChatModel.DEFAULT_AGENT_MODEL;
    this.planningModel =
      planningModel || OpenAIChatModel.DEFAULT_PLANNING_MODEL;
    this.client = new OpenAI({
      apiKey,
      ...((baseURL && { baseURL }) || {}),
    });
  }

  public AgentModel() {
    return this.agentModel;
  }

  public PlanningModel() {
    return this.planningModel;
  }

  public getCleanedMessages(messages: GlobalChannelMessage[]) {
    return messages.map((m) => ({ content: m.content, role: m.role }));
  }

  public modulesToTools(modules: Module[]): Tool[] {
    const tools: Tool[] = [];

    modules.forEach((m) => {
      m.schema.methods.forEach((method) => {
        tools.push({
          type: "function",
          function: {
            name: method.name,
            description: method.description,
            parameters:
              method.parameters as OpenAI.ChatCompletionTool["function"]["parameters"],
          },
          method,
        });
      });
    });

    return tools;
  }

  public async getChatResponseSimple({
    message,
    system_prompt,
  }: {
    message: string;
    system_prompt: string;
  }): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.agentModel,
        messages: [
          {
            role: "system",
            content: system_prompt,
          },
          {
            role: "user",
            content: message,
          },
        ],
      });

      const content = response.choices[0].message?.content;

      if (!content) {
        return "An error occured.";
      }

      return content;
    } catch (error) {
      console.error(error);
      return "An error occured.";
    }
  }

  public async getChatResponse({
    messages,
  }: {
    messages: GlobalChannelMessage[];
  }): Promise<GlobalChannelMessage> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.agentModel,
        messages: this.getCleanedMessages(messages),
      });

      const content = response.choices[0].message?.content;

      if (!content) {
        return {
          role: "assistant",
          content: "An error occured.",
        };
      }

      return {
        role: "assistant",
        content,
      };
    } catch (error) {
      console.error(error);
      return {
        role: "assistant",
        content: "An error occured.",
      };
    }
  }

  public async makeBooleanDecision(
    decisionDescription: string
  ): Promise<{ decision: boolean; reason: string } | undefined> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.PlanningModel(),
        messages: [
          {
            role: "system",
            content: `
            You are a decision maker. Based on the given description of the decision to be made, you will output a boolean value of true or false.
            `,
          },
          {
            role: "user",
            content: `
            Here is the description of the decision to be made:
            ${decisionDescription}
            `,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "boolean_decision",
              parameters: {
                type: "object",
                properties: {
                  decision: {
                    type: "boolean",
                    description: "The boolean yes or no decision.",
                  },
                  reason: {
                    type: "string",
                    description: "The reason for the decision.",
                  },
                },
                required: ["decision", "reason"],
              },
            },
          },
        ],
        tool_choice: {
          type: "function",
          function: {
            name: "boolean_decision",
          },
        },
      });

      if (!response) {
        return undefined;
      }

      const tc = response.choices[0].message.tool_calls?.[0];

      if (!tc) {
        return undefined;
      }

      const {
        function: { arguments: args },
      } = tc;

      if (!args) {
        return undefined;
      }

      const parsedArgs = JSON.parse(args);

      return parsedArgs as {
        decision: boolean;
        reason: string;
      };
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  public async makeSelectionDecision<T extends number | string>(
    decisionDescription: string,
    options: { label: string; value: T }[]
  ): Promise<{ decision: T; reason: string } | undefined> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.PlanningModel(),
        messages: [
          {
            role: "system",
            content: `
              You are a decision maker.
              Based on the given description of the decision to be made, you will output the value corresponding to the selected option.
              The value could be either a number or a string.
            `,
          },
          {
            role: "user",
            content: `
            Here is the description of the decision to be made:
            ${decisionDescription}

            Here are the options to choose from:
            ${options
              .map((option) => {
                return `- ${option.value}: ${option.label}`;
              })
              .join("\n")}
            `,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "give_selection_decision",
              description:
                "Returns a decision object based on a selection input.",
              parameters: {
                type: "object",
                properties: {
                  decision: {
                    anyOf: [
                      {
                        type: "number",
                      },
                      {
                        type: "string",
                      },
                    ],
                    description:
                      "The value corresponding to the correct option.",
                  },
                  reason: {
                    type: "string",
                    description: "The reason for the decision.",
                  },
                },
                required: ["decision", "reason"],
              },
            },
          },
        ],
        tool_choice: {
          type: "function",
          function: {
            name: "give_selection_decision",
          },
        },
      });

      if (!response) {
        return undefined;
      }

      const tc = response.choices[0].message?.tool_calls?.[0];

      if (!tc) {
        return undefined;
      }

      const {
        function: { arguments: args },
      } = tc;

      if (!args) {
        return undefined;
      }

      const parsedArgs = JSON.parse(args);

      return parsedArgs as {
        decision: T;
        reason: string;
      };
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  public async getDiscreteActions(
    prompt: string
  ): Promise<DiscreteActionsGrouped | undefined> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.PlanningModel(),
        messages: [
          {
            role: "system",
            content: `
            # Purpose
            You are a discrete action extractor, and your role is to take user input and transform it into a structured format.

            # Context
            A group is an ordered set of discrete actions, which upon completion will fulfill a request.
            A discrete action is the smallest indivisible unit of action within a group.
            Even if the user input does not contain an explicit request, you should still define an action to be performed in response.
            Think of groups as being sets of dependent actions, so independent actions should be in different groups.
            Each group will be given to an individual agent for completion, so only define as many groups as agents which should be dispatched.

            # Rules
            - Be conservative in the number of groups you define, but always define as many as necessary.
            - Define as many actions per group as necessary to fully complete the request.
            - Do not take initiative, only extract actions directly in the prompt.
            `,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        tool_choice: {
          type: "function",
          function: {
            name: "extractDiscreteActions",
          },
        },
        tools: [
          {
            type: "function",
            function: {
              name: "extractDiscreteActions",
              parameters: {
                type: "object",
                properties: {
                  groups: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: {
                          type: "string",
                          description:
                            "A name which describes the action group.",
                        },
                        actions: {
                          type: "array",
                          items: {
                            type: "object",
                            description: "The discrete action to be performed.",
                            properties: {
                              defined: {
                                type: "string",
                                description:
                                  "The description of the discrete action.",
                              },
                              source_text: {
                                type: "string",
                                description:
                                  "The part of the prompt that led to this action being described.",
                              },
                            },
                          },
                        },
                      },
                      required: ["name", "actions"],
                    },
                    description: "The groups of actions to be performed.",
                  },
                },
                required: ["groups"],
              },
            },
          },
        ],
      });

      if (!response) {
        return undefined;
      }

      const tc = response.choices[0].message.tool_calls?.[0];

      if (!tc) {
        return undefined;
      }

      const {
        function: { arguments: args },
      } = tc;

      if (!args) {
        return undefined;
      }

      const parsedArgs = JSON.parse(args);
      return parsedArgs as DiscreteActionsGrouped;
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  public async getActionToPerformForDiscreteAction(
    discreteAction: DiscreteActionDerivedFromMessage,
    tools: Tool[],
    additionalInfo: string
  ): Promise<(ModuleMethod & { arguments: string }) | undefined> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.PlanningModel(),
        messages: [
          {
            role: "system",
            content: `
            Given a description of an action to take, you should select the best tool to perform the action.
            If no tool is suitable for the action, use a channel to notify the user.

            RULES:
            - Always use tools
            `,
          },
          {
            role: "user",
            content: `
            Here is the discrete action to be performed:
            ${discreteAction.defined}
            `,
          },
          {
            role: "user",
            content: `
            Here is some additional information to help you complete the task:
            ${additionalInfo}
            `,
          },
        ],
        tools,
      });

      if (!response) {
        return undefined;
      }

      const tc = response.choices[0].message.tool_calls?.[0];
      const message = response.choices[0].message.content;

      if (!tc) {
        if (message) {
          return {
            name: "usePrimaryChannel",
            description: "Notify the user using the primary channel.",
            arguments: JSON.stringify({
              message,
            }),
            parameters: {
              type: "object",
              properties: {
                message: {
                  type: "string",
                  description: "The message to send to the user.",
                },
              },
              required: ["message"],
            },
            performAction: () => {},
          } satisfies ModuleMethod & { arguments: string };
        }
        return undefined;
      }

      const {
        function: { arguments: args, name },
      } = tc;

      if (!args || !name) {
        return undefined;
      }

      const foundMethod = tools.find((t) => t.function.name === name);

      if (!foundMethod) {
        return undefined;
      }

      const parsedArgs = JSON.parse(args);

      return {
        ...foundMethod.method,
        arguments: JSON.stringify(parsedArgs),
      };
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }
}
