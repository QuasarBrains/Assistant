import { format } from "prettier";
import Assistant from "..";
import { Channel } from "../../channels/construct";
import { GlobalChannelMessage } from "../../types/main";
import { Agent } from "../agents/agent";

export interface PipelineOptions {
  assistant: Assistant;
  agent?: Agent;
  verbose?: boolean;
}

export type ResponseModes = "converse" | "action";

export class Pipeline {
  private assistant: Assistant;
  private agent: Agent | undefined;
  private verbose: boolean = false;

  constructor({ assistant, verbose, agent }: PipelineOptions) {
    this.assistant = assistant;
    this.verbose = verbose ?? false;
    this.agent = agent;
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
      const discreteActions = await this.Assistant()
        .Model()
        .getDiscreteActions(messages[messages.length - 1].content);

      if (!discreteActions) {
        primaryChannel.sendMessageAsAssistant(
          {
            content: "No discrete actions found.",
            type: "log",
          },
          conversationId
        );
        return false;
      }

      if (this.verbose) {
        primaryChannel.sendMessageAsAssistant(
          {
            content: "Picked discrete actions.",
            type: "log",
          },
          conversationId
        );
        primaryChannel.sendMessageAsAssistant(
          {
            content: format(JSON.stringify(discreteActions, null, 2), {
              parser: "json",
            }),
            type: "log",
          },
          conversationId
        );
      }

      // TODO: Complete the action since it's not done yet
      discreteActions.groups.forEach(async (group) => {
        const agent = await this.Assistant()
          ?.AgentManager()
          ?.dispatchAgentForActionGroup(group, primaryChannel, conversationId);

        if (this.verbose) {
          console.info(
            "Dispatched agent for action group: ",
            group.name,
            agent?.Name()
          );
          primaryChannel.sendMessageAsAssistant(
            {
              content: `Dispatched agent for action group: ${
                group.name
              }, with name: "${agent?.Name()}"`,
              type: "log",
            },
            conversationId
          );
        }
      });

      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
}
