import Assistant from "../assistant";
import { Channel, ChannelOptions } from "./construct";

export interface ChannelManagerOptions {
  assistant: Assistant;
}

export class ChannelManager {
  private channels: {
    [key: string]: Channel<any>;
  } = {};
  private assistant: Assistant | undefined;

  constructor({ assistant }: ChannelManagerOptions) {
    this.channels = {};
    this.assistant = assistant;
  }

  public Assistant(): Assistant | undefined {
    return this.assistant;
  }

  public registerChannel<M>(channel: Channel<M>): void {
    if (this.channels[channel.Name()]) {
      throw new Error(`Channel with name ${channel.Name()} already exists.`);
    }
    channel.registerManager(this);
    this.channels[channel.Name()] = channel;
  }

  public registerChannels<M>(channels: Channel<M>[]): void {
    channels.forEach((channel) => {
      this.registerChannel(channel);
    });
  }

  public getChannel<M>(channelName: string): Channel<M> {
    return this.channels[channelName];
  }

  public getAllChannelsDescribed() {
    const descriptions = Object.values(this.channels).map((channel) => {
      return `- ${channel.Name()}: ${channel.Description()}`;
    });

    return descriptions;
  }
}
