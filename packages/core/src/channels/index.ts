import { Channel, ChannelOptions } from "./construct";
import { defaultChannels } from "./defaults";

export class ChannelManager {
  private channels: {
    [key: string]: Channel;
  };

  constructor() {
    this.channels = {};
  }

  public addChannel(channel: Channel): void {
    this.channels[channel.Name()] = channel;
  }

  public initDefaultChannels(): void {
    this.channels = {
      ...this.channels,
      ...defaultChannels,
    };
  }
}
