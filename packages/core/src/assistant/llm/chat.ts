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
}

export class OpenAIChatModel extends ChatModel<Tool> {
  private client: OpenAI;
  private agentModel: AllowedOpenAIChatModels;
  private planningModel: string;
  public static readonly DEFAULT_AGENT_MODEL = "gpt-4";
  public static readonly DEFAULT_PLANNING_MODEL = "gpt-3.5-turbo";

  constructor({ apiKey, agentModel, planningModel }: OpenAIOptions) {
    super();
    this.agentModel = agentModel || OpenAIChatModel.DEFAULT_AGENT_MODEL;
    this.planningModel =
      planningModel || OpenAIChatModel.DEFAULT_PLANNING_MODEL;
    this.client = new OpenAI({
      apiKey,
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
        functions: [
          {
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
                  description: "The value corresponding to the correct option.",
                },
                reason: {
                  type: "string",
                  description: "The reason for the decision.",
                },
              },
              required: ["decision", "reason"],
            },
          },
        ],
        function_call: {
          name: "give_selection_decision",
        },
      });

      if (!response) {
        return undefined;
      }

      const decisionFunctionCall = response.choices[0].message?.function_call;

      if (!decisionFunctionCall) {
        return undefined;
      }

      const { arguments: args } = decisionFunctionCall;

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
    //              You are tasked with extracting discrete actions from the given prompt.
    // A discrete action is the smallest unit of action in a task.
    // A group is a set of dependent actions that should be taken together and in order.
    try {
      const response = await this.client.chat.completions.create({
        model: this.PlanningModel(),
        messages: [
          {
            role: "system",
            content:
              "You are a decision maker. Based on the given prompt, you will output a list of discrete actions.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        tool_choice: {
          type: "function",
          function: {
            name: "extract_discrete_actions",
          },
        },
        // ! MAKE SURE THIS SCHEMA IS VALID
        tools: [
          {
            type: "function",
            function: {
              name: "extract_discrete_actions",
              parameters: {
                type: "object",
                groups: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: {
                        type: "string",
                        description: "The name of the group of actions.",
                      },
                      actions: {
                        type: "array",
                        items: {
                          type: "string",
                          description: "The action to be performed.",
                        },
                      },
                    },
                  },
                  description: "The groups of actions to be performed.",
                },
              },
            },
          },
        ],
      });

      if (!response) {
        return undefined;
      }

      const tc = response.choices[0].message.tool_calls?.[0];

      console.log("Tool call: ", tc);

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
      console.log("Parsed args: ", parsedArgs);
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
            If no tool is suitable for the action, you should output a message to the user indicating that no tool is suitable.
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

      if (!tc) {
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
