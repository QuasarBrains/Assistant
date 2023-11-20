import { unzip } from "zlib";
import Assistant from "..";
import { DiscreteActionGroup, GlobalChannelMessage } from "../../types/main";
import { Agent } from "./agent";
import { ChatModel } from "../llm";
import { Channel } from "../../channels/construct";

export interface AgentManagerOptions {
  assistant: Assistant;
}

export class AgentManager {
  private agents: {
    [key: string]: Agent;
  } = {};
  private assistant: Assistant | undefined;

  constructor({ assistant }: AgentManagerOptions) {
    this.agents = {};
    this.assistant = assistant;
  }

  public Assistant(): Assistant | undefined {
    return this.assistant;
  }

  public registerAgent(agent: Agent) {
    if (this.agents[agent.Name()]) {
      throw new Error(`Agent with name ${agent.Name()} already exists.`);
    }
    agent.registerManager(this);
    this.agents[agent.Name()] = agent;
    return agent;
  }

  public registerAgents(agents: Agent[]) {
    agents.forEach((agent) => {
      this.registerAgent(agent);
    });
    return this.agents;
  }

  public initAndStartAgent(agentName: string) {
    const agent = this.agents[agentName];
    if (!agent) {
      throw new Error(`Agent with name ${agentName} not found.`);
    }
    agent.init();
    agent.start();
  }

  public getAgent(agentName: string): Agent {
    return this.agents[agentName];
  }

  public getAllAgentsDescribed() {
    const descriptions = Object.values(this.agents).map((agent) => {
      return `- ${agent.Name()}`;
    });

    return descriptions;
  }

  public messageBelongsToAgent(message: GlobalChannelMessage) {
    try {
      const messageAgent = message.agent;
      if (!messageAgent || !this.agents[messageAgent]) {
        return false;
      }
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  public recieveAgentMessage(message: GlobalChannelMessage) {
    try {
      const messageAgent = message.agent;
      if (!messageAgent || !this.agents[messageAgent]) {
        return false;
      }
      this.agents[messageAgent].recieveMessage();
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  public async dispatchAgentForActionGroup(
    actionGroup: DiscreteActionGroup,
    primaryChannel: Channel,
    primaryConversationId: string
  ) {
    try {
      if (!this.Assistant()) {
        return undefined;
      }
      const name = Agent.getRandomNewName();
      const agent = new Agent({
        name,
        model: this.Assistant()?.Model() as ChatModel,
        primaryChannel,
        actionGroup,
        primaryConversationId,
      });

      this.registerAgent(agent);
      this.initAndStartAgent(agent.Name());

      return agent;
    } catch (err) {
      console.error(err);
      return undefined;
    }
  }
}
