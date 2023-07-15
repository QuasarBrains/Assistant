export abstract class ChatModel {
  public abstract getChatResponseSimple({
    message,
    system_prompt,
  }: {
    message: string;
    system_prompt: string;
  }): Promise<string>;
}
