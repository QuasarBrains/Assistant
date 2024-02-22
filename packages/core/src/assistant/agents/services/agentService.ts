import { Service } from "../..";
import { Agent } from "../agent";

interface AgentServiceOptions {
  agent: Agent;
}

export default class AgentService extends Service {
  private agent: Agent;

  constructor({ agent }: AgentServiceOptions) {
    super({
      name: "agent-service",
      description:
        "A generic service for performing common actions such as recording to memory and others.",
      schema: {
        methods: [],
      },
    });
    this.agent = agent;
  }

  public recordToContext({ key, value }: { key: string; value: string }) {
    this.agent.addToContext(key, value);
  }
}
