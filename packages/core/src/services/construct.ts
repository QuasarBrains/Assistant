import { ServiceManager } from ".";
import { JSONSchema } from "../types/jsonschema";
import { Module } from "../types/main";

export interface ServiceOptions {
  name: string;
  description: string;
  schema: Module["schema"];
}

export abstract class Service {
  private name: string;
  private description: string;
  private schema: Module["schema"];
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
