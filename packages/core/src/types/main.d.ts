import { JSONSchema } from "./jsonschema";

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
