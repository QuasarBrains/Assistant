export interface PlanOfActionDefinition {
  title: string;
  steps: {
    description: string;
    required: boolean;
  }[];
}

export class PlanOfAction {
  private title: PlanOfActionDefinition["title"];
  private steps: PlanOfActionDefinition["steps"];

  constructor({ title, steps }: PlanOfActionDefinition) {
    this.title = title;
    this.steps = steps;
  }

  public Title() {
    return this.title;
  }

  public Steps() {
    return this.steps;
  }

  public Describe() {
    return `Title: ${this.title}
    Steps:
    ${this.steps
      .map((step) => {
        return `- ${step.description} (${
          step.required ? "REQUIRED" : "OPTIONAL"
        })`;
      })
      .join("\n")}
    `;
  }
}
