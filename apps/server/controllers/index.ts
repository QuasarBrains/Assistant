import { entities, dataSource, Entities } from "../database";
import { Repository } from "typeorm";
import Logger from "../utils/logger";

export default abstract class Controller<
  E extends Entities | undefined = undefined
> {
  private dataSource = dataSource;
  private repository!: E extends Entities ? Repository<E> : undefined;
  private model: keyof typeof entities | undefined = undefined;
  private logger: Logger | undefined = undefined;
  private name: string | undefined = undefined;

  constructor({
    model,
    name,
  }: {
    model?: keyof typeof entities;
    name: string;
  }) {
    this.dataSource = dataSource;
    if (model) {
      this.model = model;
      this.repository = this.dataSource.getRepository(
        entities[model]
      ) as E extends Entities ? Repository<E> : undefined;
    }
    this.name = name;
    this.logger = new Logger({ name: `${name} Controller` });
  }

  public getDataSource() {
    return this.dataSource;
  }

  public getRepository() {
    return this.repository;
  }

  public getModel() {
    return entities[this.model as keyof typeof entities];
  }

  public getLogger() {
    return this.logger;
  }

  public getName() {
    return this.name;
  }

  public log = (...args: any[]) => {
    this.logger?.log(...args);
  };

  public error = (...args: any[]) => {
    this.logger?.error(...args);
  };

  public warn = (...args: any[]) => {
    this.logger?.warn(...args);
  };

  public info = (...args: any[]) => {
    this.logger?.info(...args);
  };

  public abstract list?(): Promise<E[] | undefined | null>;

  public abstract create?(data: any): Promise<E | undefined | null>;

  public abstract read?(id: string): Promise<E | undefined | null>;

  public abstract update?(id: string, data: any): Promise<E | undefined | null>;

  public abstract delete?(id: string): Promise<boolean | undefined | null>;
}
