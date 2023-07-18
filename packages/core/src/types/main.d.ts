import { JSONSchema } from "./jsonschema";

export interface Module {
  type: "service" | "channel" | "other";
  name: string;
  description: string;
  schema: {
    methods: {
      name: string;
      description: string;
      parameters: JSONSchema;
    }[];
  };
}

export type ModuleList = Module[];
