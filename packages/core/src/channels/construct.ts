export interface ChannelOptions {
  name: string;
}

export abstract class Channel {
  private name: string;

  constructor({ name }: ChannelOptions) {
    this.name = name;
  }

  public Name(): string {
    return this.name;
  }

  public abstract init(): void;

  public abstract sendMessage<M>(message: M): void;

  public abstract onMessageRecieved<M>(cb: (message: M) => void): void;
}
