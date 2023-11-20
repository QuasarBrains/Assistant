import {
  OpenAIApi,
  Configuration,
  ChatCompletionRequestMessage,
  ChatCompletionFunctions,
  CreateChatCompletionRequest,
  ResponseTypes,
} from "openai-edge";

export type {
  ChatCompletionRequestMessage,
  ChatCompletionFunctions,
  CreateChatCompletionRequest,
  ResponseTypes,
};

export class OpenAIWrapper {
  private OpenAIApi: OpenAIApi;
  public static Configuration = Configuration;

  constructor(config: Configuration) {
    this.OpenAIApi = new OpenAIApi(config);
    if (!config.apiKey) {
      throw new Error("OpenAI API key is required.");
    }
  }

  public getApi(): OpenAIApi {
    return this.OpenAIApi;
  }
}
