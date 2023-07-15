import { ChannelManager } from ".";

export interface ChannelOptions<Message> {
  name: string;
  init: () => void;
  sendMessage: (message: Message) => void;
  parseMessageToString: (message: Message) => Promise<string>;
}

export class Channel<Message> {
  private name: string;
  private messageListeners: Array<
    (message: Message, sendMessage: (message: Message) => void) => void
  > = [];
  private manager: ChannelManager | undefined;
  public init: () => void;
  public sendMessage: (message: Message) => void;
  public parseMessageToString: (message: Message) => Promise<string>;

  constructor({
    name,
    init,
    sendMessage,
    parseMessageToString,
  }: ChannelOptions<Message>) {
    this.name = name;
    this.init = init;
    this.sendMessage = sendMessage;
    this.parseMessageToString = parseMessageToString;
  }

  public Name(): string {
    return this.name;
  }

  public Manager(): ChannelManager | undefined {
    return this.manager;
  }

  public recieveMessage(message: Message): void {
    this.messageListeners.forEach((cb) => cb(message, this.sendMessage));
  }

  public addMessageListener(
    cb: (message: Message, sendMessage: (message: Message) => void) => void
  ): void {
    this.messageListeners.push(cb);
  }

  public registerManager(manager: ChannelManager): void {
    this.manager = manager;
  }

  public async getChannelAssistantResponse(message: Message): Promise<string> {
    try {
      const prompt = await this.parseMessageToString(message);
      const response = await this.Manager()
        ?.Assistant()
        ?.getChannelMessageResponse(prompt);
      return response || "An error occured.";
    } catch (error) {
      console.error(error);
      return "An error occured.";
    }
  }
}
