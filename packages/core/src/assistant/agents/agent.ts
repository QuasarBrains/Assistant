import { AgentManager } from ".";
import Assistant from "..";
import { JSONSchema } from "../../types/jsonschema";
import { ChatModel } from "../llm";
import { PlanOfAction } from "./planofaction";

export interface AssistantOptions {
  name: string;
  model: ChatModel;
  planOfAction: PlanOfAction;
}

export class Agent {
  private name: string;
  private model: ChatModel;
  private planOfAction: PlanOfAction;
  private manager: AgentManager | undefined;

  constructor({ name, model, planOfAction }: AssistantOptions) {
    this.name = name;
    this.model = model;
    this.planOfAction = planOfAction;
  }

  public Name(): string {
    return this.name;
  }

  public registerManager(manager: AgentManager) {
    this.manager = manager;
  }

  public getPlanOfAction() {
    return this.planOfAction;
  }

  public actionsAvailable(): JSONSchema[] {
    const services =
      this.manager?.Assistant()?.ServiceManager().getServiceList() ?? [];
    const channels =
      this.manager?.Assistant()?.ChannelManager().getChannelList() ?? [];

    return [...services, ...channels];
  }

  public async run() {}
}
