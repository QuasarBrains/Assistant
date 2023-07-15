export interface ChannelOptions<M> {
  name: string;
  init: () => void;
  sendMessage: (message: M) => void;
}

export class Channel<Message> {
  private name: string;
  private messageListeners: Array<
    (message: Message, sendMessage: (message: Message) => void) => void
  > = [];
  public init: () => void;
  public sendMessage: (message: Message) => void;

  constructor({ name, init, sendMessage }: ChannelOptions<Message>) {
    this.name = name;
    this.init = init;
    this.sendMessage = sendMessage;
  }

  public Name(): string {
    return this.name;
  }

  public recieveMessage(message: Message): void {
    console.log("Message recieved:", message);
    this.messageListeners.forEach((cb) => cb(message, this.sendMessage));
  }

  public addMessageListener(
    cb: (message: Message, sendMessage: (message: Message) => void) => void
  ): void {
    this.messageListeners.push(cb);
  }
}
