import Assistant from "..";
import { Channel, GlobalChannelMessage } from "../../channels/construct";

export class Pipeline {
  private assistant: Assistant | undefined;

  constructor({ assistant }: { assistant: Assistant }) {
    this.assistant = assistant;
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
        .generatePlanOfAction(messages);
      if (!planOfAction) {
        return false;
      }
      const newAgent = this.assistant.AgentManager().registerAgent(
        new Assistant.Agent({
          name: Assistant.Agent.getRandomNewName(),
          model: this.assistant?.Model(),
          planOfAction,
          primaryChannel,
          primaryConversationId: conversationId,
        })
      );
      newAgent.init();
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}
