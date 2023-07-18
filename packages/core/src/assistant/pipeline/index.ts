import Assistant from "..";
import { Channel, GlobalChannelMessage } from "../../channels/construct";

export interface PipelineOptions {
  assistant: Assistant;
  verbose?: boolean;
}

export class Pipeline {
  private assistant: Assistant | undefined;
  private verbose: boolean = false;

  constructor({ assistant, verbose }: PipelineOptions) {
    this.assistant = assistant;
    this.verbose = verbose ?? false;
  }

  public Assistant() {
    return this.assistant;
  }

  public async userMessage({
    messages,
    primaryChannel,
    conversationId,
  }: {
    messages: GlobalChannelMessage[];
    primaryChannel: Channel;
    conversationId: string;
  }) {
    try {
      if (!this.assistant?.Model()) {
        return false;
      }
      const planOfAction = await this.assistant
        ?.Model()
        .generateDummyPlanOfAction(messages);

      if (!planOfAction) {
        return false;
      }
      if (this.verbose) {
        primaryChannel.sendMessageAsAssistant(
          {
            content: "Creating new agent...",
          },
          conversationId
        );
      }
      const newAgent = this.assistant.AgentManager().registerAgent(
        new Assistant.Agent({
          name: Assistant.Agent.getRandomNewName(),
          model: this.assistant?.Model(),
          planOfAction,
          primaryChannel,
          primaryConversationId: conversationId,
          verbose: this.verbose,
        })
      );
      if (this.verbose) {
        primaryChannel.sendMessageAsAssistant(
          {
            content: "Agent created, initializing...",
          },
          conversationId
        );
      }
      await newAgent.initAndStart();
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}
