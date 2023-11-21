For a given user message, the flow should look something like this:

## Input

Channels are the main source of input. Whether it's from users or integrations, all input will come from Channels.

## Discrete Action Processing

The input is processed via a pipeline. This pipeline will take user input, and extract discrete actions from it, grouping by dependency.

Essentially, if a user says something like:

> "Turn off the lights in the garage, and send me an email when that's over. Also, set a reminder that I need to take out the trash in the morning."

There are multiple actions, and some can be performed concurrently. In our example, there are 3 discrete actions:

- Turn off the lights in the garage
- Send an email when that's done
- Set a reminder about the trash

Even though these are 3 discrete actions, only two agents will be dispatched. The email being sent requires the lights to be turned off first, and therefore there is a dependency, and these two will be grouped together. Whereas the reminder doesn't depend on any other discrete action, and so it can be on a group of its own.

So the discrete actions object which is generated will look something like this:

Group 1:

- Turn off lights in garage
- Send a confirmation email

Group 2:

- Set a reminder to take out the trash

> [!note]
> It's important that the correct order of dependant actions is preserved, so that the dependency is preserved.

## Agent Dispatch and Action Performance

Now that we have our discrete action groups, we can designate self-contained agents to perform each group of actions. Essentially each agent will be given their list of actions to perform, and they'll each step through each action in order.

The agent will be dispatched and managed through the Assistant's agent manager.

### Agent Initialization

The agent is initialized with a unique identifier, and all if it's required utilities are instantiated. The agent will be given a primary channel, which is the channel by which the input was originally received from.

The agent will also be given its action group, which is its primary task list which it will attempt to complete.

### Agent Context

The agent will have a context object which will useful as it progresses through each action. There will be context recorded for each individual action.

### Action Stepper

For each action in the group, the agent will evaluate how to approach it. The agent will have multiple options available to it:

- Channels
- Services

Essentially, it can use a channel to send a message, or it can use a service to perform an action. Using our previous example, let's assume we have these options available:

Channels:

- Primary Channel
- Email Channel

Services:

- Light manager
- Calendar manager

For now we'll just focus on the agent which is working through the light group:

- turn off the lights in the garage
- send a confirmation email when it's done

#### Action Decision

The agent will evaluate the available options, and decide which to use. For our first action, "Turn off the lights in the garage", the light manager makes the most sense. It's also worth noting that there should be a termination option, which will dissolve the agent. This is so that if feedback mode requires termination, it's an action that the agent can decide to take.

Decision = Lights Manager

This decision is recorded to the agent context. Then, since we've chosen a service, we need to choose which method within that service should be used. Let's say our light service has the following method signatures:

- `toggle_lights_in_location(location: string, desired_state?: boolean)`
- `some_other_method()
`
  Each of these methods will also have specific descriptions of each parameter using json schema. For our sake, the `toggle_lights_in_location` makes the most sense. So that's presumedly what our agent will choose.

This decision is made using the chat model's function call functionality, and therefore it will also return the arguments to pass the method.

It's possible that there wouldn't be an action available which fits the description, at which point a new flow would be entered which indicates to the user that it needs further confirmation as to what to do.

#### Feedback Check

It's possible that at this point the action is selected, but human feedback is required anyway. There needs to be a process by which the agent can pause execution in order to recieve feedback.

If feedback is recieved, then the entire group of feedback will need to be reevaluated. So there needs to be a reevaluation method which can check the actions and rewrite them if necessary. This should only be the current actions and subsequent ones.

After the feedback is recieved, the agent will restart from the current action.

#### Action Execution

The action is then executed by the system using the arguments from the chat model. The response returned from the method execution is then logged in the context of the agent.

#### Action Evaluation

The action is then evaluated to be either a success or a failure. If the action is evaluated to be a success, then the action will be marked complete, and the agent will move onto the next action.

However, if the action is a failure AND is required, then it will be retried `n` times, where `n` is a retry threshold. If it is an optional action, then it will be passed by.

The success of the action will be recorded in context. If the action is evaluated as a total failure, as in its met its retry threshold and also is required, then feedback mode will be initiated again.

If feedback is recieved, it will be evaluated and the current action will be retried, and the rest of the subsequent actions will also be reevaluated.

### Agent Report

After all of the actions have been evaluated, or termination is reached, the agent will use the context its built up to generate a report.

The report will be given to the Assistant, which will then decide if the Agent should be terminated, or should try again with some new instructions.

On termination, the agent will notify the user. The agent will then publish their report, clear all of their memory, and then be destroyed.
