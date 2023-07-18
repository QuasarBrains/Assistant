import Assistant from "..";
import { GlobalChannelMessage } from "../../channels/construct";

export class Pipeline {
  private assistant: Assistant | undefined;

  constructor({ assistant }: { assistant: Assistant }) {
    this.assistant = assistant;
  }

  public Assistant() {
    return this.assistant;
  }

  public async userMessage(messages: GlobalChannelMessage[]) {
    try {
      const planOfAction = await this.generatePlanOfAction(messages);
      if (planOfAction) {
        return planOfAction.Describe();
      }
      return "A plan of action was not created.";
    } catch (error) {
      console.error(error);
      return "There was an error processing your message.";
    }
  }

  public async generatePlanOfAction(messages: GlobalChannelMessage[]) {
    try {
      const response = await this.assistant?.Model().createChatCompletion({
        model: this.assistant?.Model().SecondaryModel(),
        messages: [
          {
            role: "system",
            content: `
            You are a plan of action creator.
            Given the user's message and some additonal context, your job is to determine a high-level plan of action.
            The goal of the plan of action is to outline the steps that an agent of some kind should take to respond to the user's message.

            For example -
            User Message: "please send an email to John Doe, explaining that I won't be able to make it to the meeting on Thursday"
            Plan of Action:
            - Title: "Send an email to John Doe explaining User's Absence from a Meeting"
            - STEP 1: Identify John Doe's email address (REQUIRED)
            - STEP 2: Identify the purpose of the meeting on Thursday (OPTIONAL)
            - STEP 3: Identify the reason for the absence of the User (OPTIONAL)
            - STEP 3: Send an email to John Doe's email address, explaining the absence (REQUIRED)
            - STEP 4: Confirm that the email was sent successfully (OPTIONAL)
            - STEP 5: Send a message to the User, confirming that the email was sent successfully (REQUIRED)

            Another example -
            User Message: "Hello there, can you tell me about TypeScript?"
            Plan of Action:
            - Title: "Tell the user about TypeScript"
            - STEP 1: Perform a web search for "TypeScript" (OPTIONAL)
            - STEP 2: Identify the top 3 results from the web search (OPTIONAL)
            - STEP 3: Summarize the top 3 results from the web search (OPTIONAL)
            - STEP 4: Use knowledge to formulate a response to the user's question (REQUIRED)
            - STEP 5: Send the response to the user (REQUIRED)

            * Keep in mind that this formatting is not your expected output, and you should instead follow the function call format below.
            * Keep the descriptions concise, but also descriptive enough to be understood by a human, the (REQUIRED) and (OPTIONAL) tags should not be part of the description.

            A REQUIRED step is one that must be completed in order for the plan of action to be considered complete, and subsequent steps will not be performed until it is complete.
            An OPTIONAL step is one that should be attempted to better respond to the user, but ultimately can be skipped.

            Your job is not to define the exact methods of completing each step, but just to define a high-level plan.
            The order of the steps is important! Steps will be executed in the order that they are defined.
            Also keep in mind that the plan of action should have as many steps as necessary to properly respond, but also as few steps as possible.
            
            Remember, the goal of the plan of action is to outline the steps that an agent will use to accomplish a certain task.
            Therefore, it shouldn't involve more steps than required to accomplish a specific task, and should be designed to terminate after said task is completed.
            `,
          },
          {
            role: "user",
            content: `
            Here is the conversation history, pay the most attention to the last message from the user:
            ${messages
              .map((message) => {
                return `- ${message.role.toUpperCase()}: ${message.content}`;
              })
              .join("\n")}
            `,
          },
        ],
        functions: [
          {
            name: "generate_plan_of_action",
            description:
              "Generates a plan of action given a series of high-level steps.",
            parameters: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                  description: "The title of the plan of action.",
                },
                steps: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      description: {
                        type: "string",
                        description: "A description of the step.",
                      },
                      required: {
                        type: "boolean",
                        description: "Whether or not the step is required.",
                      },
                    },
                  },
                },
              },
              required: ["title", "steps"],
            },
          },
        ],
        function_call: {
          name: "generate_plan_of_action",
        },
      });

      if (!response) {
        return undefined;
      }

      const planOfActionFunctionCall =
        response.choices[0].message?.function_call;

      if (!planOfActionFunctionCall) {
        return undefined;
      }

      const { arguments: args } = planOfActionFunctionCall;

      if (!args) {
        return undefined;
      }

      const parsedArgs = JSON.parse(args);

      const planOfAction = new Assistant.PlanOfAction({
        title: parsedArgs.title,
        steps: parsedArgs.steps,
      });

      return planOfAction;
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  public async makeBooleanDecision(
    messages: GlobalChannelMessage[],
    decisionDescription: string
  ): Promise<{ decision: boolean; reason: string } | undefined> {
    try {
      const response = await this.assistant?.Model().createChatCompletion({
        model: this.assistant?.Model().SecondaryModel(),
        messages: [
          {
            role: "system",
            content: `
            You are a decision maker. Based on the following description of the decision, you will output a boolean value of true or false:
            "${decisionDescription}"
            `,
          },
          {
            role: "user",
            content: `
            Here is the conversation history, pay the most attention to the last message from the user:
            ${messages
              .map((message) => {
                return `- ${message.role.toUpperCase()}: ${message.content}`;
              })
              .join("\n")}
            `,
          },
        ],
        functions: [
          {
            name: "give_boolean_decision",
            description: "Returns a decision object based on a boolean input.",
            parameters: {
              type: "object",
              properties: {
                decision: {
                  type: "boolean",
                  description: "The boolean yes or no decision.",
                },
                reason: {
                  type: "string",
                  description: "The reason for the decision.",
                },
              },
              required: ["boolean", "reason"],
            },
          },
        ],
      });

      if (!response) {
        return undefined;
      }

      const decisionFunctionCall = response.choices[0].message?.function_call;

      if (!decisionFunctionCall) {
        return undefined;
      }

      const { arguments: args } = decisionFunctionCall;

      if (!args) {
        return undefined;
      }

      const parsedArgs = JSON.parse(args);

      return parsedArgs as {
        decision: boolean;
        reason: string;
      };
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }
}
