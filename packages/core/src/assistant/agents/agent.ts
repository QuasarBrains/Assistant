import path from "path";
import { AgentManager } from ".";
import { Channel } from "..";
import { Module, ModuleMethod } from "../../types/main";
import { ChatModel } from "../llm";
import { PlanOfAction, Step } from "./planofaction";
import { randomBytes } from "crypto";
import { parseDateYYYYMMDD, parseTimeHHMM } from "../../utils/dates";

export interface AssistantOptions {
  name: string;
  model: ChatModel;
  planOfAction: PlanOfAction;
  primaryChannel: Channel;
  primaryConversationId: string;
  verbose?: boolean;
  maxSectionLength?: number;
  maxStepRetries?: number;
}

export class Agent {
  private name: string;
  private model: ChatModel;
  private planOfAction: PlanOfAction;
  private manager: AgentManager | undefined;
  private primaryChannel: Channel;
  private primaryConversationId: string;
  private verbose: boolean;
  private paused: boolean = false;
  private maxSectionLength: number;
  private maxStepRetries: number;
  private agentContext: { [key: string]: string } = {};

  constructor({
    name,
    model,
    planOfAction,
    primaryChannel,
    primaryConversationId,
    verbose,
    maxSectionLength,
    maxStepRetries,
  }: AssistantOptions) {
    this.name = name;
    this.model = model;
    this.planOfAction = planOfAction;
    this.primaryChannel = primaryChannel;
    this.primaryConversationId = primaryConversationId;
    this.verbose = verbose ?? false;
    this.maxSectionLength = maxSectionLength ?? 100;
    this.maxStepRetries = maxStepRetries ?? 3;
  }

  public static getRandomNewName() {
    const length = 8;
    const bytes = randomBytes(length);
    const asStr = bytes.toString("hex");
    const name = asStr.slice(0, length).toUpperCase();
    return name;
  }

  public Name(): string {
    return this.name;
  }

  public FormattedAgentName(): string {
    return `Agent ${this.Name()}`;
  }

  public isPaused(): boolean {
    return this.paused;
  }

  public pause() {
    this.paused = true;
  }

  public resume() {
    this.paused = false;
    this.run();
  }

  public record() {
    const today = parseDateYYYYMMDD(new Date());
    const now = parseTimeHHMM(new Date());
    const outputLocation = this.manager?.Assistant()?.DatastoreDirectory();
    if (outputLocation) {
      const outputFile = path.join(
        outputLocation ?? "",
        "agents",
        "records",
        `${this.Name()}-${today}-${now}-${this.planOfAction
          .Title()
          .toUpperCase()}.md`
      );
      this.planOfAction.recordMarkdown(outputFile);
    }
  }

  public async kill(reason: "ABORTED" | "FAILED" | "COMPLETED") {
    if (this.verbose) {
      this.sendPrimaryChannelMessage(`I have been killed because: "${reason}"`);
    }
    if (reason === "COMPLETED") {
      await this.planOfAction.markCompleted();
    } else {
      await this.planOfAction.markFinished(reason);
    }
    await this.record();
  }

  public async complete() {
    await this.planOfAction.markCompleted();
    await this.record();
    await this.kill("COMPLETED");
    if (this.verbose) {
      this.sendPrimaryChannelMessage(
        `I have completed the task: "${this.planOfAction.Title()}"`
      );
    }
  }

  public async finish(reason: "ABORTED" | "FAILED") {
    await this.planOfAction.markFinished(reason);
    await this.record();
    await this.kill(reason);
    if (this.verbose) {
      this.sendPrimaryChannelMessage(
        `I have failed to complete the task: "${this.planOfAction.Title()}"`
      );
    }
  }

  public registerManager(manager: AgentManager) {
    this.manager = manager;
  }

  public getPlanOfAction() {
    return this.planOfAction;
  }

  public modulesAvailable(): Module[] {
    const services =
      this.manager?.Assistant()?.ServiceManager().getServiceList() ?? [];
    const channels =
      this.manager
        ?.Assistant()
        ?.ChannelManager()
        .getChannelList()
        .map((c) => {
          if (c.name === this.primaryChannel.Name()) {
            return {
              ...c,
              description: `(*PRIMARY CHANNEL) ${c.description}`,
            };
          }
          return c;
        }) ?? [];

    return [...services, ...channels];
  }

  public modulesMap(): { [key: string]: Module } {
    const modules = this.modulesAvailable();
    const map: { [key: string]: Module } = {};
    modules.forEach((m) => {
      map[m.name] = m;
    });
    return map;
  }

  public async sendPrimaryChannelMessage(message: string) {
    try {
      await this.primaryChannel.sendMessageAsAssistant(
        {
          content: `${this.FormattedAgentName()}: ${message}`,
        },
        this.primaryConversationId
      );
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  public async sendGreetingMessage() {
    try {
      await this.sendPrimaryChannelMessage(
        `Hello! I'm ${this.FormattedAgentName()}!
        
        I have been initialized to complete the following task:
        "${this.planOfAction.Title()}"
        `
      );
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  public async init() {
    try {
      this.sendGreetingMessage();
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  public async start() {
    try {
      if (this.verbose) {
        await this.sendPrimaryChannelMessage("Starting agent loop...");
      }
      this.run();
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  public async initAndStart() {
    try {
      await this.init();
      this.start();
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  public async run() {
    try {
      this.runStep();
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  public addToContext(key: string, value: string) {
    this.agentContext[key] = value;
  }

  public getContextAsString() {
    let str = "";
    Object.keys(this.agentContext).forEach((key) => {
      str += `${key}: ${this.getShortenedString(this.agentContext[key])}\n`;
    });
    return str;
  }

  public getPostActions() {
    return [
      {
        name: "add_to_context",
        description:
          "Add information to the current context, allowing for subsequent steps to read it.",
        parameters: {
          type: "object",
          properties: {
            key: {
              type: "string",
              description:
                "the name that the value will be stored under in the context",
            },
            value: {
              type: "string",
              description: "the value to store in the context",
            },
          },
          required: ["key", "value"],
        },
      },
      {
        name: "none",
        description: "Do nothing. Nothing is required to be done.",
        parameters: {},
      },
    ];
  }

  public getFinishActions = () => {
    return [
      {
        name: "mark_completed_and_move_on",
        description:
          "Mark the current step as completed, and move on to the next step.",
        parameters: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "mark_failed_and_move_on",
        description:
          "Mark the current step as failed, and move on to the next step.",
        parameters: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "retry_current_step",
        description: "Retry the current step.",
        parameters: {
          type: "object",
          properties: {},
          required: [],
        },
      },
    ];
  };

  public async runStep(): Promise<boolean> {
    try {
      if (this.planOfAction.isCompleted()) {
        this.complete();
        return true;
      }
      if (this.planOfAction.isFinished()) {
        this.finish("FAILED");
        return true;
      }
      if (this.isPaused()) {
        if (this.verbose) {
          this.sendPrimaryChannelMessage(
            `Agent is paused, not running step ${this.planOfAction.DescribeCurrentStep()}`
          );
        }
        return false;
      }
      if (this.planOfAction.getCurrentStep().retries > this.maxStepRetries) {
        this.planOfAction.markCurrentStepFinished("FAILED");
        if (this.verbose) {
          this.sendPrimaryChannelMessage(
            `Marked step ${this.planOfAction.DescribeCurrentStep()} as failed for too many retries, and moving on to the next step...`
          );
        }
        return this.runStep();
      }
      if (this.verbose) {
        this.sendPrimaryChannelMessage(
          `Running current step: ${this.planOfAction.DescribeCurrentStep(true)}`
        );
      }
      const currentStep = this.planOfAction.getCurrentStep();
      const nextAction = await this.getNextActionFromStep(currentStep);
      if (!nextAction) {
        this.finish("FAILED");
        return false;
      }
      const result = await this.performAction(nextAction);
      if (this.verbose) {
        this.sendPrimaryChannelMessage(
          `Result of ${nextAction.name} action: ${JSON.stringify(result)}`
        );
      }
      this.planOfAction.getCurrentStep().actionOutput = result;
      const postActionDecision = await this.getPostActionDecision();
      if (postActionDecision) {
        switch (postActionDecision.function_to_perform) {
          case "add_to_context":
            this.addToContext(
              postActionDecision.withArgs.key,
              postActionDecision.withArgs.value
            );
            this.planOfAction.getCurrentStep().context +=
              "\nAction result added to agent context successfully.";
            if (this.verbose) {
              this.sendPrimaryChannelMessage(
                `Added ${
                  postActionDecision.withArgs.key
                } to context with value for step ${this.planOfAction.DescribeCurrentStep()}`
              );
            }
            break;
          case "none":
            break;
          default:
            throw new Error(
              `Unknown post action decision: ${postActionDecision.function_to_perform}`
            );
        }
      }
      const finishDecision = await this.getFinishDecision();
      if (finishDecision) {
        switch (finishDecision.function_to_perform) {
          case "mark_completed_and_move_on":
            this.planOfAction.markCurrentStepCompleted();
            if (this.verbose) {
              this.sendPrimaryChannelMessage(
                `Marked step ${this.planOfAction.DescribeCurrentStep()} as completed, and moving on to the next step...`
              );
            }
            return this.runStep();
          case "mark_failed_and_move_on":
            this.planOfAction.markCurrentStepFinished("FAILED");
            if (this.verbose) {
              this.sendPrimaryChannelMessage(
                `Marked step ${this.planOfAction.DescribeCurrentStep()} as failed, and moving on to the next step...`
              );
            }
            return this.runStep();
          case "retry_current_step":
            if (this.verbose) {
              this.sendPrimaryChannelMessage("Retrying current step...");
            }
            this.planOfAction.getCurrentStep().retries =
              (this.planOfAction.getCurrentStep().retries || 0) + 1;
            return this.runStep();
        }
      } else {
        if (this.verbose) {
          this.sendPrimaryChannelMessage(
            `No finish decision made for step ${this.planOfAction.DescribeCurrentStep()}`
          );
        }
        this.finish("FAILED");
        return false;
      }

      return true;
    } catch (error) {
      console.error(error);
      this.sendPrimaryChannelMessage(
        `An error occurred while trying to run step ${this.planOfAction.DescribeCurrentStep(
          true
        )}`
      );
      this.finish("FAILED");
      return false;
    }
  }

  public async getNextActionFromStep(step: Step) {
    try {
      const moduleDecision = await this.model.makeSelectionDecision<string>(
        `
        The decision is what module to use, given a set of options and the current task to be completed.
        Each module has a "type", a "name" and a "description" which will help you determine which one is the most relavent.

        Keep in mind the different module types available to you: Channels and Services.
        A "Channel" is used to communicate with the user, whereas a "Service" is used to perform some action.
        Channels should always be used for direct communication with the user, and almost never other than that. 
        Services can be used for anything else.
        Also, keep in mind that the (*PRIMARY CHANNEL) is the channel that the user is currently communicating with you on, so usually it should be used unless another channel makes more sense.

        The most important thing is that the Channel or Service chosen is relavent and suitable to completing the task.
        If no modules seem suitable to complete the task, you should choose "none".

        Tasks are a high-level description of what needs to be done, whereas steps are a more granular sub-task that needs to be completed as part of the greater task.
        You should focus on the current step, but the task is provided for context.

        The current task is: "${this.planOfAction.Title()}"
        The current step is: "${step.description}"

        The source messages of this generated task are:
        ${this.planOfAction
          .SourceMessages()
          .map((m) => {
            return `- ${m.role}: ${m.content}`;
          })
          .join("\n")}
        `,
        this.modulesAvailable().map((a) => {
          return {
            label: `[${a.type.toUpperCase()}] ${a.name} - ${a.description}`,
            value: a.name,
          };
        })
      );

      if (!moduleDecision) {
        return null;
      }

      const { decision, reason } = moduleDecision;

      if (this.verbose) {
        this.sendPrimaryChannelMessage(
          `${decision} was chosen because "${reason}"`
        );
      }

      if (decision === "none") {
        return null;
      }

      const map = this.modulesMap();

      const module = map[decision];

      const moduleAction = await this.model.makeSelectionDecision<string>(
        `
        The action is what to do with the module, given a set of options and the current task to be completed.
        Each module has a set of actions that can be performed, which will help you determine which one is the most relavent.

        The most important thing is that the action chosen is relavent and suitable to completing the task.
        If no actions seem suitable to complete the task, you should choose "none".

        Tasks are a high-level description of what needs to be done, whereas steps are a more granular sub-task that needs to be completed as part of the greater task.
        You should focus on the current step, but the task is provided for context.

        The current task is: "${this.planOfAction.Title()}"
        The current step is: "${step.description}"

        The source messages of this generated task are:
        ${this.planOfAction
          .SourceMessages()
          .map((m) => {
            return `- ${m.role}: ${m.content}`;
          })
          .join("\n")}
        `,
        module.schema.methods.map((a) => {
          return {
            label: a.description,
            value: a.name,
          };
        })
      );

      if (!moduleAction) {
        return null;
      }

      const { decision: actionDecision, reason: actionReason } = moduleAction;

      if (this.verbose) {
        this.sendPrimaryChannelMessage(
          `${actionDecision} was chosen because "${actionReason}"`
        );
      }

      if (actionDecision === "none") {
        return null;
      }

      const actionableMethod = module["schema"]["methods"].find(
        (m) => m.name === actionDecision
      );

      if (!actionableMethod) {
        throw new Error(
          `Could not find module with name ${decision} and type ${module.type}`
        );
      }

      return actionableMethod;
    } catch (error) {
      console.error(error);
      this.sendPrimaryChannelMessage(
        `An error occurred while trying to get the next action from step ${step.description}`
      );
      return null;
    }
  }

  public async performAction(action: ModuleMethod) {
    try {
      const planningModel = this.manager?.Assistant()?.Model().PlanningModel();

      if (!planningModel) {
        throw new Error("No assistant found");
      }

      const response = await this.manager
        ?.Assistant()
        ?.Model()
        .createChatCompletion({
          model: planningModel,
          messages: [
            {
              role: "system",
              content: `
            You are an action caller.
            Based on the context provided to you, and a task description, you will provide arguments to a given function.

            Keep in mind that the task is the overarching goal, whereas the step is the current sub-task that needs to be completed.
            You should pay the most attention to the current step, as the function to call has been chosen to complete it.
            `,
            },
            {
              role: "user",
              content: `
            The current task to perform is:
            ${this.planOfAction.Title()}

            The current step to perform is:
            ${this.planOfAction.DescribeCurrentStep(true)}

            The source messages of this task are:
            ${this.planOfAction
              .SourceMessages()
              .map((m) => {
                return `- ${m.role}: ${m.content}`;
              })
              .join("\n")}
            `,
            },
          ],
          functions: [
            {
              name: action.name,
              description: action.description,
              parameters: action.parameters,
            },
          ],
          function_call: {
            name: action.name,
          },
        });

      if (!response) {
        throw new Error("No response received from model");
      }

      const args = response.choices[0].message?.function_call?.arguments;

      if (!args) {
        throw new Error("No arguments received from model");
      }

      const parsedArgs = JSON.parse(args);

      const result = await action.performAction(parsedArgs);

      return result;
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  public getShortenedString(str: string) {
    if (!str) {
      return str;
    }
    const maxLength = this.maxSectionLength;
    if (str.length > maxLength) {
      return `${str.slice(0, maxLength)}...`;
    }
    return str;
  }

  public async getPostActionDecision() {
    try {
      const planningModel = this.manager?.Assistant()?.Model().PlanningModel();

      if (!planningModel) {
        throw new Error("No assistant found");
      }

      const actions = this.getPostActions();

      const actionDecision = await this.manager
        ?.Assistant()
        ?.Model()
        .createChatCompletion({
          model: planningModel,
          messages: [
            {
              role: "system",
              content: `
              Given the result of an action in relation to a task, you will decide what to do with the result.
              The most important thing is that the action chosen is relavent and suitable to completing the task.
              If no actions seem suitable to complete the task, you should choose "none".

              Tasks are a high-level description of what needs to be done, whereas steps are a more granular sub-task that needs to be completed as part of the greater task.
              You should focus on the current step, but the task is provided for context.
              `,
            },
            {
              role: "user",
              content: `
              The current task is: "${this.planOfAction.Title()}"
              The current step is: "${this.planOfAction.DescribeCurrentStep(
                true
              )}"
              The full task list is:
              ${this.planOfAction
                .Steps()
                .map((s) => {
                  return `- ${s.description}`;
                })
                .join("\n")}
              The output of the action performed for the current step was: ${this.getShortenedString(
                JSON.stringify(this.planOfAction.getCurrentStep().actionOutput)
              )}

              The source messages of this generated task are:
              ${this.planOfAction
                .SourceMessages()
                .map((m) => {
                  return `- ${m.role}: ${m.content}`;
                })
                .join("\n")}
        `,
            },
          ],
          functions: actions.map((a) => {
            return {
              ...a,
            };
          }),
        });

      if (!actionDecision) {
        return {
          function_to_perform: "none",
          withArgs: undefined,
        };
      }

      const function_call = actionDecision.choices[0]?.message?.function_call;

      if (this.verbose) {
        this.sendPrimaryChannelMessage(
          `Post action decision for ${
            this.planOfAction.getCurrentStep().description
          }: ${function_call?.name}`
        );
      }

      if (function_call?.name === "none") {
        return {
          function_to_perform: "none",
          withArgs: undefined,
        };
      }

      const withArgs = function_call?.arguments
        ? JSON.parse(function_call?.arguments)
        : undefined;

      return {
        function_to_perform: function_call?.name,
        withArgs,
      };
    } catch (error) {
      console.error(error);
      return {
        function_to_perform: "none",
        withArgs: undefined,
      };
    }
  }

  public async getFinishDecision() {
    try {
      const planningModel = this.manager?.Assistant()?.Model().PlanningModel();

      if (!planningModel) {
        throw new Error("No assistant found");
      }

      const actions = this.getFinishActions();
      // ! THIS SHOULD JUST BE A DECISION SELECTION SINCE IT DOESN'T NEED TO PROVIDE ARGS
      const actionDecision = await this.manager
        ?.Assistant()
        ?.Model()
        .createChatCompletion({
          model: planningModel,
          messages: [
            {
              role: "system",
              content: `
              Given the result of an action in relation to a task, you will decide what to do with the result.
              The most important thing is that the action chosen reflects the result of the action in relation to the task.

              Tasks are a high-level description of what needs to be done, whereas steps are a more granular sub-task that needs to be completed as part of the greater task.
              You should focus on the current step, but the task is provided for context.

              Even if the task is complete, a function is required to be called that will mark the step as finished.
              A function should ALWAYS be called.
              `,
            },
            {
              role: "user",
              content: `
              The current task is: "${this.planOfAction.Title()}"
              The current step is: "${this.planOfAction.DescribeCurrentStep(
                true
              )}"
              The full task list is:
              ${this.planOfAction
                .Steps()
                .map((s) => {
                  return `- ${s.description}`;
                })
                .join("\n")}
              The output of the action performed for the current step was: ${this.getShortenedString(
                JSON.stringify(this.planOfAction.getCurrentStep().actionOutput)
              )}

              Here is some context about the current step:
              ${this.planOfAction.getCurrentStep().context}

              The source messages of this generated task are:
              ${this.planOfAction
                .SourceMessages()
                .map((m) => {
                  return `- ${m.role}: ${m.content}`;
                })
                .join("\n")}
            `,
            },
          ],
          functions: actions.map((a) => {
            return {
              ...a,
            };
          }),
        });

      if (!actionDecision) {
        return {
          function_to_perform: "mark_failed_and_move_on",
          withArgs: undefined,
        };
      }

      const function_call = actionDecision.choices[0].message?.function_call;

      if (this.verbose) {
        this.sendPrimaryChannelMessage(
          `Finish decision for ${
            this.planOfAction.getCurrentStep().description
          }: ${function_call?.name}`
        );
      }

      if (function_call?.name === "none") {
        return {
          function_to_perform: "mark_failed_and_move_on",
          withArgs: undefined,
        };
      }

      const withArgs = function_call?.arguments
        ? JSON.parse(function_call?.arguments)
        : undefined;

      return {
        function_to_perform: function_call?.name,
        withArgs,
      };
    } catch (error) {
      console.error(error);
      return {
        function_to_perform: "mark_failed_and_move_on",
        withArgs: undefined,
      };
    }
  }
}
