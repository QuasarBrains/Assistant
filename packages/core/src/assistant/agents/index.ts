import Assistant from "..";
import { Agent } from "./agent";

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

  public registerAgent(agent: Agent): void {
    if (this.agents[agent.Name()]) {
      throw new Error(`Agent with name ${agent.Name()} already exists.`);
    }
    agent.registerManager(this);
    this.agents[agent.Name()] = agent;
  }

  public registerAgents(agents: Agent[]): void {
    agents.forEach((agent) => {
      this.registerAgent(agent);
    });
  }

  public getAgent(agentName: string): Agent {
    return this.agents[agentName];
  }

  public getAllAgentsDescribed() {
    const descriptions = Object.values(this.agents).map((agent) => {
      return `- ${agent.Name()}: ${agent.getPlanOfAction().Describe()}`;
    });

    return descriptions;
  }
}
