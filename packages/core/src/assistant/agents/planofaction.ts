export interface PlanOfActionDefinition {
  name: string;
  steps: {
    description: string;
    required: boolean;
  }[];
}

export class PlanOfAction {
  private name: PlanOfActionDefinition["name"];
  private steps: PlanOfActionDefinition["steps"];

  constructor({ name, steps }: PlanOfActionDefinition) {
    this.name = name;
    this.steps = steps;
  }

  public Name() {
    return this.name;
  }

  public Steps() {
    return this.steps;
  }

  public Describe() {
    return `
    Name: ${this.name}
    Steps: ${this.steps
      .map((step) => {
        return `${step.description} (${
          step.required ? "REQUIRED" : "OPTIONAL"
        })`;
      })
      .join("\n")}
    `;
  }
}
