import { ChannelManager } from "../channels";
import { Channel } from "../channels/construct";

export interface AssistantOptions {
  name: string;
}

export default class Assistant {
  private name: string;
  private channelManager: ChannelManager;
  public Channel = Channel;

  constructor({ name }: AssistantOptions) {
    this.name = name;
    this.channelManager = new ChannelManager();
  }

  public Name(): string {
    return this.name;
  }

  public registerChannel<M>(channel: Channel<M>): void {
    this.channelManager.registerChannel<M>(channel);
  }
}
