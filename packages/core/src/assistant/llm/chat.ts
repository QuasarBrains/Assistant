import {
  Configuration,
  OpenAIApi,
  ResponseTypes,
  CreateChatCompletionRequest,
} from "openai-edge";
import { ChatModel } from ".";

export type AllowedOpenAIChatModels = CreateChatCompletionRequest["model"];

export interface OpenAIOptions {
  apiKey: string;
  defaultModel?: AllowedOpenAIChatModels;
  allowModels?: AllowedOpenAIChatModels[];
}

export class OpenAIChatModel extends ChatModel {
  private configuration: Configuration;
  private allowedModels: string[] | undefined;
  private defaultModel: string;
  private api: OpenAIApi;

  constructor({ allowModels, apiKey, defaultModel }: OpenAIOptions) {
    super();
    this.allowedModels = allowModels;
    this.defaultModel = defaultModel || "gpt-4";
    this.configuration = new Configuration({
      apiKey,
    });
    this.api = new OpenAIApi(this.configuration);
  }

  public getAPI(): OpenAIApi {
    return this.api;
  }

  public async getChatResponseSimple({
    message,
    system_prompt,
  }: {
    message: string;
    system_prompt: string;
  }): Promise<string> {
    try {
      console.log("Sending message to OpenAI API", message, system_prompt);

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

      console.log("Got response from OpenAI API", result);

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
}
