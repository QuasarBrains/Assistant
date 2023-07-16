import { ServiceManager } from ".";
import { JSONSchema } from "../types/jsonschema";

export interface ServiceSchema {
  methods: {
    name: string;
    description: string;
    parameters: JSONSchema;
  }[];
}

export interface ServiceOptions {
  name: string;
  description: string;
  schema: ServiceSchema;
}

export abstract class Service {
  private name: string;
  private description: string;
  private schema: ServiceSchema;
  private manager: ServiceManager | undefined;

  constructor({ name, description, schema }: ServiceOptions) {
    this.name = name;
    this.description = description;
    this.schema = schema;
  }

  public registerManager(manager: ServiceManager): void {
    this.manager = manager;
  }

  public Name() {
    return this.name;
  }

  public Description() {
    return this.description;
  }

  public Schema() {
    return this.schema;
  }
}
