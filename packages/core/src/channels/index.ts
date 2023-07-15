import { Channel, ChannelOptions } from "./construct";

export class ChannelManager {
  private channels: {
    [key: string]: Channel<any>;
  } = {};

  constructor() {
    this.channels = {};
  }

  public registerChannel<M>(channel: Channel<M>): void {
    this.channels[channel.Name()] = channel;
  }
}
