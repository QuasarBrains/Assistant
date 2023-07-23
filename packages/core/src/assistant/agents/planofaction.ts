import { format } from "prettier";
import { GlobalChannelMessage } from "../../channels/construct";
import Assistant from "..";

export interface Step {
  description: string;
  required: boolean;
  retries: number;
  actionOutput?: any;
  context?: string;
  completed?: boolean;
  finished?: boolean;
  finishReason?: string;
}

export interface PlanOfActionDefinition {
  title: string;
  steps: Step[];
  sourceMessages: GlobalChannelMessage[];
  assistant: Assistant | undefined;
}

export class PlanOfAction {
  private title: PlanOfActionDefinition["title"];
  private steps: PlanOfActionDefinition["steps"];
  private currentStep: number;
  private completed: boolean;
  private finished: boolean;
  private finishReason: string | undefined;
  private sourceMessages: GlobalChannelMessage[];
  private assistant: Assistant | undefined;

  constructor({
    title,
    steps,
    sourceMessages,
    assistant,
  }: PlanOfActionDefinition) {
    this.title = title;
    this.sourceMessages = sourceMessages;
    this.assistant = assistant;
    this.steps = steps.map((step) => {
      return {
        ...step,
        completed: step.completed ?? false,
        retries: step.retries ?? 0,
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

  public Assistant() {
    return this.assistant;
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

  /**
   * Mark the current step as completed.
   * The next step will be executed.
   */
  public markCurrentStepCompleted() {
    this.steps[this.currentStep].completed = true;
    this.steps[this.currentStep].finished = true;
    this.steps[this.currentStep].finishReason = "COMPLETED";
    if (this.currentStep < this.steps.length - 1) {
      this.nextStep();
    } else {
      this.markCompleted();
    }
  }

  /**
   * Mark the current step as finished, but not completed.
   * The next step will be executed.
   */
  public markCurrentStepFinished(reason: "ABORTED" | "FAILED") {
    this.steps[this.currentStep].completed = false;
    this.steps[this.currentStep].finished = true;
    this.steps[this.currentStep].finishReason = reason;
    if (this.currentStep < this.steps.length - 1) {
      this.nextStep();
    } else {
      this.markFinished(reason);
    }
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

    return this.Assistant()?.recordToDatastore(
      to,
      format(JSON.stringify(planOfActionRecord, null, 2), {
        parser: "json",
      })
    );
  }

  public getMarkdown() {
    const md = `
    # ${this.title}
    
    **Completed**: ${this.completed ? "YES" : "NO"}
    **Finished**: ${this.finished ? "YES" : "NO"}
    **Finish Reason**: ${this.finishReason ?? "N/A"}
    
    ## Steps
    ${this.steps
      .map((step, index) => {
        return `- ${step.completed ? "[x]" : "[ ]"} Step ${index + 1}: ${
          step.description
        } (${step.required ? "REQUIRED" : "OPTIONAL"})
        `;
      })
      .join("\n")}
        `;
    return md;
  }

  public recordMarkdown(to: string) {
    const md = this.getMarkdown();

    return this.Assistant()?.recordToDatastore(
      to,
      format(md, {
        parser: "markdown",
      })
    );
  }

  public recordDescription(to: string) {
    const description = this.Describe();

    return this.Assistant()?.recordToDatastore(to, description);
  }
}
