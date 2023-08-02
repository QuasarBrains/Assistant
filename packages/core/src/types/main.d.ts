import { JSONSchema } from "./jsonschema";

export type GlobalChannelMessage = {
  content: string;
  role: "system" | "user" | "assistant";
  agent?: string;
};

export interface ModuleMethod {
  name: string;
  description: string;
  parameters: JSONSchema;
  performAction: (params: any) => any;
}

export interface Module {
  type: "service" | "channel" | "other";
  name: string;
  description: string;
  schema: {
    methods: ModuleMethod[];
  };
}

export type ModuleList = Module[];

export interface DiscreteAction {
  defined: string;
}

export type DiscreteActionDerivedFromMessage = DiscreteAction & {
  source_text: string;
};
