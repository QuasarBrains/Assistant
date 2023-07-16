import { ChannelManager } from "../channels";
import { ServiceManager } from "../services";
import { Channel, GlobalChannelMessage } from "../channels/construct";
import { OpenAIChatModel } from "./llm/chat";
import { Service } from "../services/construct";

export type AvailableModels = OpenAIChatModel;

export interface AssistantOptions {
  name: string;
  model: AvailableModels;
}

export { Service, Channel };

export default class Assistant {
  private name: string;
  private channelManager: ChannelManager;
  private serviceManager: ServiceManager;
  private model: AvailableModels;
  public static Channel = Channel;
  public static Service = Service;
  public static ChatModels = {
    OpenAI: OpenAIChatModel,
  };

  constructor({ name, model }: AssistantOptions) {
    this.name = name;
    this.channelManager = new ChannelManager({ assistant: this });
    this.serviceManager = new ServiceManager({ assistant: this });
    this.model = model;
  }

  public Name(): string {
    return this.name;
  }

  public ChannelManager(): ChannelManager {
    return this.channelManager;
  }

  public ServiceManager(): ServiceManager {
    return this.serviceManager;
  }

  public async getChatResponseSimple(message: string): Promise<string> {
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

  public async getChatResponse(
    messages: GlobalChannelMessage[]
  ): Promise<GlobalChannelMessage> {
    try {
      const response = await this.model.getChatResponse({
        messages,
      });
      return response;
    } catch (error) {
      console.error(error);
      return {
        role: "system",
        content: "An error occured.",
      };
    }
  }
}
