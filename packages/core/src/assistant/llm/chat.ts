import {
  Configuration,
  OpenAIApi,
  ResponseTypes,
  CreateChatCompletionRequest,
} from "openai-edge";
import { ChatModel } from ".";
import { GlobalChannelMessage } from "../../channels/construct";

export type AllowedOpenAIChatModels = CreateChatCompletionRequest["model"];

export interface OpenAIOptions {
  apiKey: string;
  defaultModel?: AllowedOpenAIChatModels;
  secondaryModel?: AllowedOpenAIChatModels;
  allowModels?: AllowedOpenAIChatModels[];
}

export class OpenAIChatModel extends ChatModel {
  private configuration: Configuration;
  private allowedModels: string[] | undefined;
  private defaultModel: string;
  private secondaryModel: string;
  private api: OpenAIApi;

  constructor({
    allowModels,
    apiKey,
    defaultModel,
    secondaryModel,
  }: OpenAIOptions) {
    super();
    this.allowedModels = allowModels;
    this.defaultModel = defaultModel || "gpt-4";
    this.secondaryModel = secondaryModel || "gpt-3.5-turbo";
    this.configuration = new Configuration({
      apiKey,
    });
    this.api = new OpenAIApi(this.configuration);
  }

  public getAPI(): OpenAIApi {
    return this.api;
  }

  public DefaultModel() {
    return this.defaultModel;
  }

  public SecondaryModel() {
    return this.secondaryModel;
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
        model: this.defaultModel,
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
        model: this.defaultModel,
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
}
