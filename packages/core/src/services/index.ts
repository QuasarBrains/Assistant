import { Service } from "./construct";
import Assistant from "../assistant";

export interface ServiceManagerOptions {
  assistant: Assistant;
}

export class ServiceManager {
  private services: {
    [key: string]: Service;
  } = {};
  private assistant: Assistant | undefined;

  constructor({ assistant }: ServiceManagerOptions) {
    this.services = {};
    this.assistant = assistant;
  }

  public Assistant() {
    return this.assistant;
  }

  public registerService(service: Service): void {
    if (this.services[service.Name()]) {
      throw new Error(`Service with name ${service.Name()} already exists.`);
    }
    service.registerManager(this);
    this.services[service.Name()] = service;
  }

  public registerServices(services: Service[]): void {
    services.forEach((service) => {
      this.registerService(service);
    });
  }
}
