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
        methods: [
          {
            name: "recordToContext",
            description:
              "Record a key value pair to the agent's current context which will be accessible to further actions.",
            parameters: {
              type: "object",
              properties: {
                key: {
                  type: "string",
                  description: "The key to record.",
                },
                value: {
                  type: "string",
                  description: "The value to record.",
                },
              },
            },
            performAction: (params: { key: string; value: string }) =>
              this.recordToContext(params),
          },
        ],
      },
    });
    this.agent = agent;
  }

  public recordToContext({ key, value }: { key: string; value: string }) {
    this.agent.addToContext(key, value);
  }
}
