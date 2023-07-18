/* eslint-disable no-unused-vars */
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
    decisionDescription: string
  ): Promise<{ decision: boolean; reason: string } | undefined>;

  public abstract makeSelectionDecision<T extends number | string>(
    decisionDescription: string,
    options: { label: string; value: T }[]
  ): Promise<{ decision: T; reason: string } | undefined>;
}
