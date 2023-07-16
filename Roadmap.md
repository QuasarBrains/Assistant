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

Oh yeah, we're gonna need a priority queue. Essentially, every event will have a priority assigned to it, denoting its severity, and how quickly the `Assistant` should respond to it. This will be a rank from 1-5, following a similar structure to the [Emergency Severity Index](https://en.wikipedia.org/wiki/Emergency_Severity_Index) that emergency rooms use, but assumedly with much lower stakes. Basically, the levels will be as follows:

1. Immediate Attention Required, Time Sensitive down to the Second
2. Potentially Time Critical, Time Sensitive down to the Minute
3. Stable and High Priority, Time Sensitive down to the Hour
4. Stable and Medium Priority, Time Sensitive down to the Day
5. Stable and Low Priority, Not Time Sensitive

The priority queue will prioritize by rank first, then first come first serve. Level 1s and 2s will interrupt any lower-level events, and lower level event queues will not be reacted to until the 2 higher levels are complete. Level 1 must be completed before level 2, level 2 must be completed before level 3, and so on and so forth. The reason for these severity levels is mostly due to the implications of the assistant for use with security systems.

#### Channels

These are actually mostly implemented.
