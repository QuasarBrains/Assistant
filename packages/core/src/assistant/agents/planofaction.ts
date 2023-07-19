import { writeFileSync } from "fs";
import { format } from "prettier";
import { GlobalChannelMessage } from "../../channels/construct";

export interface Step {
  description: string;
  required: boolean;
  completed?: boolean;
}

export interface PlanOfActionDefinition {
  title: string;
  steps: Step[];
  sourceMessages: GlobalChannelMessage[];
}

export class PlanOfAction {
  private title: PlanOfActionDefinition["title"];
  private steps: PlanOfActionDefinition["steps"];
  private currentStep: number;
  private completed: boolean;
  private finished: boolean;
  private finishReason: string | undefined;
  private sourceMessages: GlobalChannelMessage[];

  constructor({ title, steps, sourceMessages }: PlanOfActionDefinition) {
    this.title = title;
    this.sourceMessages = sourceMessages;
    this.steps = steps.map((step) => {
      return {
        ...step,
        completed: step.completed ?? false,
      };
    });
    this.currentStep = 0;
    this.completed = false;
    this.finished = false;
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

  public SourceMessages() {
    return this.sourceMessages;
  }

  public markCompleted() {
    this.completed = true;
    this.finished = true;
    this.finishReason = "COMPLETED";
  }

  public markFinished(reason: "ABORTED" | "FAILED") {
    this.completed = false;
    this.finished = true;
    this.finishReason = reason;
  }

  public getCurrentStep() {
    return this.steps[this.currentStep];
  }

  public DescribeCurrentStep(withTotalCount = false) {
    const step = this.getCurrentStep();
    return `Step ${this.currentStep + 1}${
      withTotalCount ? `/${this.steps.length}` : ""
    }: ${step.description} (${step.required ? "REQUIRED" : "OPTIONAL"})`;
  }

  public getCurrentStepIndex() {
    return this.currentStep;
  }

  public nextStep() {
    this.currentStep++;
  }

  public isCompleted() {
    return this.completed;
  }

  public isFinished() {
    return this.finished;
  }

  public markCurrentStepCompleted() {
    this.steps[this.currentStep].completed = true;
  }

  public recordJSON(to: string) {
    const planOfActionRecord = {
      title: this.title,
      steps: this.steps,
      currentStep: this.currentStep,
      completed: this.completed,
      finished: this.finished,
      finishReason: this.finishReason,
    };

    return writeFileSync(
      to,
      format(JSON.stringify(planOfActionRecord, null, 2), {
        parser: "json",
      })
    );
  }

  public recordMarkdown(to: string) {
    const md = `
    # ${this.title}

    **Completed**: ${this.completed ? "YES" : "NO"}
    **Finished**: ${this.finished ? "YES" : "NO"}
    **Finish Reason**: ${this.finishReason ?? "N/A"}
    
    ## Steps
    ${this.steps
      .map((step, index) => {
        return `### Step ${index + 1}: ${step.description} (${
          step.required ? "REQUIRED" : "OPTIONAL"
        })
        ${step.completed ? "[x]" : "[ ]"}
        `;
      })
      .join("\n")}
    `;

    return writeFileSync(to, md);
  }

  public recordDescription(to: string) {
    const description = this.Describe();

    return writeFileSync(to, description);
  }
}
