import { AgentManager } from ".";
import { Channel } from "..";
import { Module, ModuleMethod } from "../../types/main";
import { ChatModel } from "../llm";
import { PlanOfAction, Step } from "./planofaction";
import { randomBytes } from "crypto";

export interface AssistantOptions {
  name: string;
  model: ChatModel;
  planOfAction: PlanOfAction;
  primaryChannel: Channel;
  primaryConversationId: string;
  verbose?: boolean;
}

export class Agent {
  private name: string;
  private model: ChatModel;
  private planOfAction: PlanOfAction;
  private manager: AgentManager | undefined;
  private primaryChannel: Channel;
  private primaryConversationId: string;
  private verbose: boolean;

  constructor({
    name,
    model,
    planOfAction,
    primaryChannel,
    primaryConversationId,
    verbose,
  }: AssistantOptions) {
    this.name = name;
    this.model = model;
    this.planOfAction = planOfAction;
    this.primaryChannel = primaryChannel;
    this.primaryConversationId = primaryConversationId;
    this.verbose = verbose ?? false;
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
      while (!this.planOfAction.isFinished()) {
        const currentStep = this.planOfAction.getCurrentStep();
        if (this.verbose) {
          this.sendPrimaryChannelMessage(
            `Current Step | ${this.planOfAction.DescribeCurrentStep(true)}`
          );
        }
        const nextAction = await this.getNextActionFromStep(currentStep);
        if (!nextAction) {
          this.planOfAction.markFinished("FAILED");
          break;
        }
        const result = await this.performAction(nextAction);
        console.info("Result", result);
        if (this.verbose) {
          this.sendPrimaryChannelMessage(
            `Result of ${nextAction.name} action: ${JSON.stringify(result)}`
          );
        }
        this.planOfAction.markCurrentStepCompleted();
        this.planOfAction.markCompleted();
      }
      return true;
    } catch (error) {
      console.error(error);
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
}
