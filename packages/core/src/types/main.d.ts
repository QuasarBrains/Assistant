import { JSONSchema } from "./jsonschema";

export interface Module {
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
