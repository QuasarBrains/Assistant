import { ServiceManager } from ".";

export interface ServiceSchema {}

export interface ServiceOptions {
  name: string;
  description: string;
  schematic: ServiceSchema;
}

export class Service {
  private name: string;
  private description: string;
  private schematic: ServiceSchema;
  private manager: ServiceManager | undefined;

  constructor({ name, description, schematic }: ServiceOptions) {
    this.name = name;
    this.description = description;
    this.schematic = schematic;
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

  public Schematic() {
    return this.schematic;
  }
}
