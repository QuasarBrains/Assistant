import { ChannelManager } from "../channels";
import { Channel } from "../channels/construct";
import { OpenAIChatModel } from "./llm/chat";

export type AvailableModels = OpenAIChatModel;

export interface AssistantOptions {
  name: string;
  model: AvailableModels;
}

export default class Assistant {
  private name: string;
  private channelManager: ChannelManager;
  private model: AvailableModels;
  public Channel = Channel;
  public static ChatModels = {
    OpenAI: OpenAIChatModel,
  };

  constructor({ name, model }: AssistantOptions) {
    this.name = name;
    this.channelManager = new ChannelManager({ assistant: this });
    this.model = model;
  }

  public Name(): string {
    return this.name;
  }

  public registerChannel<M>(channel: Channel<M>): void {
    this.channelManager.registerChannel<M>(channel);
  }

  public async getChannelMessageResponse(message: string): Promise<string> {
    try {
      const response = await this.model.getChatResponseSimple({
        message,
        system_prompt: "You are a helpful assistant.",
      });
      return response;
    } catch (error) {
      console.error(error);
      return "An error occured.";
    }
  }
}
