# Roadmap

When in the world can I use this to do awesome stuff? Well, I have some big ambitions for the project, but to start it will be small.

## Goals

To understand this, we have to understand the goal of the project, and the initial features that will be provided. For now, there are going to be two main packages, `@onyx-assistant/core` and `@onyx-assistant/server`. The first will provide the core functionality of the onyx assistant system, and the latter will allow for easy implementation with an express server, and add some additional functionality. Secondarily, it would be very useful to have a template application, which consumes the `@onyx-assistant/core` and `@onyx-assistant/server`, and shows pretty simply how to start using them. Similar to a `create-react-app` or something like that.

On top of the core functionality, the idea of having a framework centered around natural language also comes to mind. The goal is to have most interfaces understandable to both consumers and language models. Most modules will require descriptions, names, and other ways of understanding the functionality through natural language. Things like automatic documentation generation, and automatic extension generation come to mind as well.

### @onyx-assistant/core

The goal of `@onyx-assistant/core` is to be a framework for building out complex digital assistants, using language models. More specifically, the package will provide an `Assistant` class, which will provide all of the functionality to build out your assistant in a declarative fashion. My goal here is to have a simple, declarative syntax, which allows predictable flows, functionality, and extension. `@onyx-assistant/core` will provide the core functionality of the assistant, and everything required to be extensible, but the core library will not be extended past that.

There are some core modules of the core that will be used for building out an assistant. Mainly, [`Services`](https://github.com/AidanTilgner/GPT-Assistant/blob/master/documentation/Services.md), [`Events`](https://github.com/AidanTilgner/GPT-Assistant/blob/master/documentation/Events.md), and [`Channels`](https://github.com/AidanTilgner/GPT-Assistant/blob/master/documentation/Channels.md). Definitely go check out the docs for each of those for more information on them, but here we'll talk about what the consumer of the framework will see, and how they should be able to interact with them, at least for the core library and initial release.

#### Services

These are the primary agencies of the assistant, allowing it to perform complex operations, and ultimately be useful. Because the idea of `@onyx-assistant/core` is to provide the ability to extend, that is all we need to build out. There needs to be a `registerService` and subsequent `registerServices` method on the `Assistant`, which takes a `Service` class as an argument, and registers it with the `Assistant`'s `ServiceManager` class. That way the consumer can define services similarly to the `Express.js` framework's http methods, where methods are used to declaratively build out complex applications.

When a service is registered, it will be tracked by the `Assistant`'s `ServiceManager`. When the `Assistant` may need to perform an action, it will be capable of searching through the different services, and picking the most relevant ones (probably through [OpenAI function calls](https://platform.openai.com/docs/api-reference/chat/create#chat/create-functions) or something), based on descriptions and specs. On that note, each `Service` class will be required to produce a spec, which will be used to describe to the language model the different functionalities available to the service, and how to use them. This means that the consumer's descriptions of the different services and specification are just as important as the functionality itself, because it will directly impact the performance of the application.

#### Events

These are comparable to JavaScript [`event listeners`](https://blog.webdevsimplified.com/2022-01/event-listeners/) as an example. However, the implementation will obviously be quite different. They will work very similarly to `Services` mentioned above, as the `Assistant` will have an `EventManager`, and both a `registerEvent` and `registerEvents` class. Essentially, Events will be passive monitors that will attend to some predefined stimulus, and when triggered, will alert the `Assistant`, which will then develop a plan of action as a response. Events will consist of a `Listener`, and a `Dispatcher`, which will do pretty much what it sounds like they would do. The `Listener` will be configured to monitor something, anything. Then, if the `Listener` is triggered, it will evaluate the stimulus based on a consumer-defined evaluation function, and if the evaluation is passed, then it will trigger the `Dispatcher`. When the `Dispatcher` is triggered, it will use a consumer-defined schema to build out an `event` object, which will then be published to the `EventManager`'s priority queue.

Oh yeah, we're gonna need a priority queue. Essentially, every event will have a priority assigned to it, denoting its severity, and how quickly the `Assistant` should respond to it. More on that in the `Priority Queue` section.

#### Channels

These are actually mostly implemented. There are both `registerChannel` and `registerChannels` methods, and the `Assistant` class has a `ChannelManager`. Channels are sort of a combination of a `Service` and an `Event`, but they don't fit neatly in either category, and provide a lot of extra functionality, so they are their own separate module. Where an `Event` is reactive, and a `Service` is proactive, a channel fits neatly in the middle. A channel is effectively a line of communication between the user and the `Assistant`, providing utilities to both recieve and send messages, as well as manage the message history. For example, the `@onyx-assistant/server` package implements a "server" channel, which listens for incoming messages on a specified endpoint, then when a message is recieved, it will alert the assistant, and have the assistant respond to the message, which is then sent back as the response to the http request.

A channel is required to have both a `recieveMessage` and `sendMessage` method implemented. However, for the "server" class, it's a bit more complex to implement a `sendMessage` method, because the web server by default responds to requests, and without a server to send requests back to, there's not much for it to do. However, there's still plenty of flexibility, and we can talk about potential approaches in the section on `@onyx-assistant/server`.

#### Plans of Action

A plan of action is essentially a file which details a set of actions to perform in order to respond to some stimulus. For example, if I ask the assistant through a channel the following:

> "please send an email to John Doe, explaining that I won't be able to make it to the meeting on Thursday"

This is obviously a fairly complex task with an ambiguous program. We've seen agents grow in popularity in the past 6 months as a system configuration for completing complex tasks by allowing LLMs to formulate a plan, and pursue actions because of that. This is the aspect of the digital assistant that will draw the most from the agents. If you're interested more in agents vs assistants, check [this](https://github.com/AidanTilgner/Onyx-Assistant#agents-vs-assistants) out. Anyway, in order to solve this task, here is what the course of action might look like written out:

> Send an email to John Doe explaining User's Absence from a Meeting:
> Steps to Complete:
>
> - STEP 1: Identify John Doe's email address (REQUIRED)
> - STEP 2: Identify the purpose of the meeting on Thursday (OPTIONAL)
> - STEP 3: Identify the reason for the absence of the User (OPTIONAL)
> - STEP 3: Send an email to John Doe's email address, explaining the absence (REQUIRED)

As you can see, this is a very simple plan of action designed to complete the task represented. REQUIRED steps must be considered complete in order to consider the task complete. A REQUIRED step must be completed before the next step can be initiated (although having a concept of concurrency in step completion might be pretty cool), whereas an OPTIONAL step will be attempted an undecided number of times (perhaps user provided in config), until the assistant moves onto the next task.

So how are these plans of action tackled? Well, this is actually where the concept of agents comes in full swing. I've been a bit back and forth on whether or not agents should be utilized in the project, and I've come to the conclusion that their ability to complete tasks should not go unutilized. On top of that, the ability to have multiple agents acting in parallel, while the `Assistant` manages them from a high level, sounds like an excellent plan to me.

#### Agent Management

So how will agents be used? Well, the flow will look something like this:

> 1. stimulus recieved by `Assistant` > 2. `Assistant` forms a plan of action, or task > 3. `Assistant` dispatches a new agent to complete the task, using the `AgentManager` > 4. `Agent` proceeds through each step in the plan of action, until all REQUIRED steps are considered complete > 5. `Agent` shows its work to the `Assistant`, and recieves either confirmation, or further instructions > 6. upon further instructions, the `Agent` goes back to #4, upon confirmation, the Agent records its work, and its process is terminated

#### Priority Queue

It's worth noting that the `Agent` also may communicate with the `Assistant` at any time. It's also worth noting that the `Assistant` will have to implement many forms of priority queues. This was touched on in the section on `Events`, but the priority queue will not just be for events. The priority queue will house all sorts of stimulae that the `Assistant` must attend to, which will include both `Events` and requests from the `Agent`s for more information, among other things. The `Assistant` will go through each item in the priority queue, one at a time, for simplicity until a good concurrency model is devised. Each item will have a rank from 1-5, following a similar structure to the [Emergency Severity Index](https://en.wikipedia.org/wiki/Emergency_Severity_Index) that emergency rooms use, but assumedly with much lower stakes. More on the levels and other info in the `Priority Queue` section.

(5) Immediate Attention Required, Time Sensitive down to the Second
(4) Potentially Time Critical, Time Sensitive down to the Minute
(3) Stable and High Priority, Time Sensitive down to the Hour
(2) Stable and Medium Priority, Time Sensitive down to the Day
(1) Stable and Low Priority, Not Time Sensitive

The priority queue will prioritize by rank first, then first come first serve. Level 1s and 2s will interrupt any lower-level events, and lower level event queues will not be reacted to until the 2 higher levels are complete. Level 1 must be completed before level 2, level 2 must be completed before level 3, and so on and so forth. The reason for these severity levels is mostly due to the implications of the assistant for use with security systems. **The priority queue will be preemptive.**
