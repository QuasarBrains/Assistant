import { ChannelManager } from ".";
import { Module } from "../types/main";

export type GlobalChannelMessage = {
  content: string;
  role: "system" | "user" | "assistant";
};
export interface ChannelOptions {
  name: string;
  description: string;
  init: () => void;
  sendMessage: (message: GlobalChannelMessage, conversation_id: string) => void;
  defineConversationHistory: (history: {
    conversation_id: string;
    messages: GlobalChannelMessage[];
  }) => void;
  addToHistory: (history: Record<string, GlobalChannelMessage[]>) => void;
  getFullHistory: () => Record<string, GlobalChannelMessage[]>;
  getConversationHistory: (
    conversation_id: string,
    count?: number
  ) => GlobalChannelMessage[];
}

export class Channel {
  private name: string;
  private description: string;
  private messageListeners: Array<
    (
      message: GlobalChannelMessage,
      sendMessage: (
        message: GlobalChannelMessage,
        conversation_id: string
      ) => void
    ) => void
  > = [];
  private manager: ChannelManager | undefined;
  private sendMessage: (
    message: GlobalChannelMessage,
    conversation_id: string
  ) => void;
  public init: () => void;
  public defineConversationHistory: (history: {
    conversation_id: string;
    messages: GlobalChannelMessage[];
  }) => void;
  public getFullHistory: () => Record<string, GlobalChannelMessage[]>;
  public getConversationHistory: (
    conversation_id: string,
    count?: number
  ) => GlobalChannelMessage[];

  constructor({
    name,
    description,
    init,
    sendMessage,
    defineConversationHistory,
    getFullHistory,
    getConversationHistory,
  }: ChannelOptions) {
    this.name = name;
    this.description = description;
    this.init = init;
    this.sendMessage = sendMessage;
    this.defineConversationHistory = defineConversationHistory;
    this.getFullHistory = getFullHistory;
    this.getConversationHistory = getConversationHistory;
  }

  public Name(): string {
    return this.name;
  }

  public Description(): string {
    return this.description;
  }

  public Manager(): ChannelManager | undefined {
    return this.manager;
  }

  public Schema(): Module["schema"] {
    return {
      methods: [
        {
          name: "get_conversation_history",
          description: "Returns the conversation history.",
          parameters: {
            type: "object",
            properties: {
              conversation_id: {
                type: "string",
                description: "The conversation id.",
              },
              count: {
                type: "number",
                description: "The number of messages to return.",
              },
            },
            required: ["conversation_id"],
          },
          performAction: (params: {
            conversation_id: string;
            count?: number;
          }) =>
            this.getConversationHistory(params.conversation_id, params.count),
        },
        {
          name: "get_full_history",
          description: "Returns the full history of the channel.",
          parameters: {
            type: "object",
            properties: {},
            required: [],
          },
          performAction: () => this.getFullHistory(),
        },
        {
          name: "send_message",
          description: "Sends a message to the channel.",
          parameters: {
            type: "object",
            properties: {
              message: {
                type: "object",
                description: "The message to send.",
                properties: {
                  content: {
                    type: "string",
                    description: "The content of the message.",
                  },
                },
              },
            },
            required: ["message"],
          },
          performAction: (params: { message: GlobalChannelMessage }) =>
            this.sendMessageAsAssistant(params.message, "default"),
        },
      ],
    };
  }

  public getActionsMap() {
    return {
      get_conversation_history: ({
        conversation_id,
        count,
      }: {
        conversation_id: string;
        count?: number;
      }) => this.getConversationHistory,
      get_full_history: this.getFullHistory,
      send_message: this.sendMessageAsAssistant,
    };
  }

  public async recieveMessage(
    message: GlobalChannelMessage,
    conversation_id: string
  ): Promise<void> {
    this.defineConversationHistory({
      conversation_id,
      messages: [...this.getConversationHistory(conversation_id), message],
    });
    this.messageListeners.forEach((cb) =>
      cb(message, (msg: GlobalChannelMessage) =>
        this.sendMessage(msg, conversation_id)
      )
    );
  }

  public async sendMessageAsAssistant(
    message: Omit<GlobalChannelMessage, "role">,
    conversation_id: string
  ): Promise<void> {
    const newMessage = {
      ...message,
      role: "assistant" as const,
    };
    this.recieveMessage(newMessage, conversation_id);
    return this.sendMessage(newMessage, conversation_id);
  }

  public addMessageListener(
    cb: (
      message: GlobalChannelMessage,
      sendMessage: (
        message: GlobalChannelMessage,
        conversation_id: string
      ) => void
    ) => void
  ): void {
    this.messageListeners.push(cb);
  }

  public registerManager(manager: ChannelManager): void {
    this.manager = manager;
  }

  /**
   * Recieves the message, sends it to the assistant, and records and sends the response.
   */
  public async startAssistantResponse({
    message,
    conversation_id,
  }: {
    message: GlobalChannelMessage;
    conversation_id: string;
  }): Promise<boolean> {
    try {
      this.recieveMessage(message, conversation_id);
      const history = this.getConversationHistory(conversation_id);
      const response = await this.manager?.Assistant()?.startAssistantResponse({
        messages: [...history, message],
        channel: this,
        conversation_id,
      });

      return !!response;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}
