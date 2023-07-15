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
  }

  public getApi(): OpenAIApi {
    return this.OpenAIApi;
  }
}
