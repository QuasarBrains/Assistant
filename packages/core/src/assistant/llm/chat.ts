import {
  Configuration,
  OpenAIApi,
  ResponseTypes,
  CreateChatCompletionRequest,
} from "openai-edge";
import { ChatModel } from ".";
import { GlobalChannelMessage } from "../../channels/construct";
import Assistant from "..";

export type AllowedOpenAIChatModels = CreateChatCompletionRequest["model"];

export interface OpenAIOptions {
  apiKey: string;
  agentModel?: AllowedOpenAIChatModels;
  planningModel?: AllowedOpenAIChatModels;
}

export class OpenAIChatModel extends ChatModel {
  private configuration: Configuration;
  private agentModel: AllowedOpenAIChatModels;
  private planningModel: string;
  private api: OpenAIApi;
  public static readonly DEFAULT_AGENT_MODEL = "gpt-4";
  public static readonly DEFAULT_PLANNING_MODEL = "gpt-3.5-turbo";

  constructor({ apiKey, agentModel, planningModel }: OpenAIOptions) {
    super();
    this.agentModel = agentModel || OpenAIChatModel.DEFAULT_AGENT_MODEL;
    this.planningModel =
      planningModel || OpenAIChatModel.DEFAULT_PLANNING_MODEL;
    this.configuration = new Configuration({
      apiKey,
    });
    this.api = new OpenAIApi(this.configuration);
  }

  public getAPI(): OpenAIApi {
    return this.api;
  }

  public AgentModel() {
    return this.agentModel;
  }

  public PlanningModel() {
    return this.planningModel;
  }

  public async getChatResponseSimple({
    message,
    system_prompt,
  }: {
    message: string;
    system_prompt: string;
  }): Promise<string> {
    try {
      const response = await this.api.createChatCompletion({
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

      const result =
        (await response.json()) as ResponseTypes["createChatCompletion"];

      const content = result.choices[0].message?.content;

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
      const response = await this.api.createChatCompletion({
        model: this.agentModel,
        messages,
      });

      const result =
        (await response.json()) as ResponseTypes["createChatCompletion"];

      const content = result.choices[0].message?.content;

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

  public async createChatCompletion(req: CreateChatCompletionRequest) {
    try {
      const res = await this.api.createChatCompletion(req);

      const data = (await res.json()) as ResponseTypes["createChatCompletion"];

      return data;
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  public async generatePlanOfAction(messages: GlobalChannelMessage[]) {
    try {
      const response = await this.createChatCompletion({
        model: this.PlanningModel(),
        messages: [
          {
            role: "system",
            content: `
            🅰️📄⚙️Umsg+ctx=🗒️💡,💼⮕POA.🚀Roadmap, not detailed guide, code mention⬜️goal-linked. Ex1:"📧John,🚫🤝Thurs."➡️"POA:📧John, explain abs."💠1:Find JD's 📧💠2:Thurs. meet. purpose💠3:User abs. reason💠4:📧John, explain abs.💠5:📧success?💠6:User, 📧 sent? Ex2:"ℹ️TypeScript?"➡️"POA:ℹ️User on TS"💠1:🌐🔍TS💠2:Top3 🌐💠3:Summary of top3💠4:💡reply to user💠5:Send reply. 🅱️POA⚙️📄💡, short+human clear, no Req./Opt. labels. REQUIRED=🔒, OPTIONAL=🔓. POA➡️agent tasks. Balanced steps, order matters! K.I.S.S. No msg parse.
            `,
          },
          {
            role: "user",
            content: `
            Here is the conversation history, pay the most attention to the last message from the user:
            ${messages
              .map((message) => {
                return `- ${message.role.toUpperCase()}: ${message.content}`;
              })
              .join("\n")}
            `,
          },
        ],
        functions: [
          {
            name: "generate_plan_of_action",
            description:
              "Generates a plan of action given a series of high-level steps.",
            parameters: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                  description: "The title of the plan of action.",
                },
                steps: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      description: {
                        type: "string",
                        description: "A description of the step.",
                      },
                      required: {
                        type: "boolean",
                        description: "Whether or not the step is required.",
                      },
                    },
                  },
                },
              },
              required: ["title", "steps"],
            },
          },
        ],
        function_call: {
          name: "generate_plan_of_action",
        },
      });

      if (!response) {
        return undefined;
      }

      const planOfActionFunctionCall =
        response.choices[0].message?.function_call;

      if (!planOfActionFunctionCall) {
        return undefined;
      }

      const { arguments: args } = planOfActionFunctionCall;

      if (!args) {
        return undefined;
      }

      const parsedArgs = JSON.parse(args);

      const planOfAction = new Assistant.PlanOfAction({
        title: parsedArgs.title,
        steps: parsedArgs.steps,
        sourceMessages: messages,
      });

      return planOfAction;
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  // eslint-disable-next-line no-unused-vars
  public async generateDummyPlanOfAction(messages: GlobalChannelMessage[]) {
    try {
      const planOfAction = new Assistant.PlanOfAction({
        title: "Respond to the User's Greeting",
        steps: [
          {
            description: "Send a greeting message to the user.",
            required: true,
            retries: 0,
          },
        ],
        sourceMessages: messages,
      });

      return planOfAction;
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  public async makeBooleanDecision(
    decisionDescription: string
  ): Promise<{ decision: boolean; reason: string } | undefined> {
    try {
      const response = await this.createChatCompletion({
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
        functions: [
          {
            name: "give_boolean_decision",
            description: "Returns a decision object based on a boolean input.",
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
              required: ["boolean", "reason"],
            },
          },
        ],
        function_call: {
          name: "give_boolean_decision",
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
      const response = await this.createChatCompletion({
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
}
