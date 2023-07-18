import { CreateChatCompletionRequest } from "openai-edge";
import { ChannelManager } from ".";
import { Module } from "../types/main";

export type GlobalChannelMessage = {
  content: string;
  role: "system" | "user" | "assistant";
};
export interface ChannelOptions<Message> {
  name: string;
  description: string;
  init: () => void;
  sendMessage: (message: GlobalChannelMessage) => void;
  parseMessageToString: (message: Message) => Promise<string>;
  parseMessageToGlobalMessage: (
    message: Message,
    role: GlobalChannelMessage["role"]
  ) => Promise<GlobalChannelMessage>;
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

export class Channel<Message> {
  private name: string;
  private description: string;
  private messageListeners: Array<
    (
      message: GlobalChannelMessage,
      sendMessage: (message: GlobalChannelMessage) => void
    ) => void
  > = [];
  private manager: ChannelManager | undefined;
  public init: () => void;
  public sendMessage: (message: GlobalChannelMessage) => void;
  public parseMessageToString: (message: Message) => Promise<string>;
  public parseMessageToGlobalMessage: (
    message: Message,
    role: GlobalChannelMessage["role"]
  ) => Promise<GlobalChannelMessage>;
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
    parseMessageToString,
    defineConversationHistory,
    getFullHistory,
    getConversationHistory,
    parseMessageToGlobalMessage,
  }: ChannelOptions<Message>) {
    this.name = name;
    this.description = description;
    this.init = init;
    this.sendMessage = sendMessage;
    this.parseMessageToString = parseMessageToString;
    this.parseMessageToGlobalMessage = parseMessageToGlobalMessage;
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
        },
        {
          name: "get_full_history",
          description: "Returns the full history of the channel.",
          parameters: {
            type: "object",
            properties: {},
            required: [],
          },
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
        },
      ],
    };
  }

  public getActionsMap() {
    return {
      get_conversation_history: this.getConversationHistory,
      get_full_history: this.getFullHistory,
      send_message: this.sendMessageAsAssistant,
    };
  }

  public async recieveMessage(message: Message): Promise<void> {
    const parsed = await this.parseMessageToGlobalMessage(message, "user");
    this.messageListeners.forEach((cb) => cb(parsed, this.sendMessage));
  }

  public async sendMessageAsAssistant(
    message: Omit<GlobalChannelMessage, "role">
  ): Promise<void> {
    const newMessage = {
      ...message,
      role: "assistant" as const,
    };
    this.sendMessage(newMessage);
  }

  public addMessageListener(
    cb: (
      message: GlobalChannelMessage,
      sendMessage: (message: GlobalChannelMessage) => void
    ) => void
  ): void {
    this.messageListeners.push(cb);
  }

  public registerManager(manager: ChannelManager): void {
    this.manager = manager;
  }

  public async getAssistantResponse(
    messages: GlobalChannelMessage[]
  ): Promise<GlobalChannelMessage> {
    try {
      const response = await this.Manager()
        ?.Assistant()
        ?.getAssistantResponse(messages);
      return (
        response || {
          role: "assistant",
          content: "An error occured.",
        }
      );
    } catch (error) {
      console.error(error);
      return {
        role: "assistant",
        content: "An error occured.",
      };
    }
  }

  public async getAssistantResponseAndRecord({
    messages,
    conversation_id,
  }: {
    messages: GlobalChannelMessage[];
    conversation_id: string;
  }): Promise<GlobalChannelMessage> {
    try {
      const response = await this.getAssistantResponse(messages);
      this.defineConversationHistory({
        conversation_id,
        messages: [...messages, response],
      });
      return response;
    } catch (error) {
      console.error(error);
      return {
        role: "assistant",
        content: "An error occured.",
      };
    }
  }
}
