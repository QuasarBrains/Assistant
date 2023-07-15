export interface AssistantOptions {
  name: string;
}

export default class Assistant {
  private name: string;

  constructor({ name }: AssistantOptions) {
    this.name = name;
  }

  public Name(): string {
    return this.name;
  }
}
