import { GlobalChannelMessage } from "../../channels/construct";
import { PlanOfAction } from "../agents/planofaction";

export abstract class ChatModel {
  public abstract getChatResponseSimple({
    message,
    system_prompt,
  }: {
    message: string;
    system_prompt: string;
  }): Promise<string>;

  public abstract getChatResponse({
    messages,
  }: {
    messages: GlobalChannelMessage[];
  }): Promise<GlobalChannelMessage>;

  public abstract generatePlanOfAction(
    messages: GlobalChannelMessage[]
  ): Promise<PlanOfAction | undefined>;

  public abstract makeBooleanDecision(
    messages: GlobalChannelMessage[],
    decisionDescription: string
  ): Promise<{ decision: boolean; reason: string } | undefined>;
}
