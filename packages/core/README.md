# QuasarBrains Assistant Framework

An infinitely extendable assistant framework to automate your life.

## Pre-Release

**Assistant is currently pre-release!** There is some core functionality, but there's still a long way to go until it's ready to be used. No garuntee of backward's compatibility can be given at this time, as the kinks are worked out and the framework is stress tested. If you're interested in helping out, testing it pre-release, or have questions, [reach out to me](mailto:aidantilgner02@gmail.com), or leave an issue.

Check out [the roadmap](https://github.com/QuasarBrains/Assistant/blob/master/Roadmap.md) for more info.

## Description

Assistant is a declarative framework for building out complex, powerful digital assistants. Acting as a wrapper around a language model of choice, most noteably `gpt-4`, or `gpt-3.5-turbo`, the Assistant framework provides additional functionality and utilities to extend the model. Most noteably, the model will have access to [`Services`](https://github.com/QuasarBrains/Assistant/blob/master/documentation/Services.md), [`Events`](https://github.com/QuasarBrains/Assistant/blob/master/documentation/Events.md), and [`Channels`](https://github.com/QuasarBrains/Assistant/blob/master/documentation/Channels.md). Through a combination of these core utilities, your assistant will be able to communicate with you (channels), pay attentiont to the world (events), and take action in any way possible through software (services).

There will be prebuilt services, channels, and events, as well as other helpful functionality to get off the ground easily. However, the infinitely extendable aspect of Assistant is the ability to easily add your own functionality. You can add Channels to let your assistant communicate with you in new ways. Services will let you connect your assistant to any API, shell script, or other application you're willing to build an implementation for. And Events will let you define things that may happen which your assistant should pay attention to, as well as how to react.

## Agents vs Assistants

There are many projects such as [AutoGPT](https://github.com/Significant-Gravitas/Auto-GPT), [Baby AGI](https://github.com/yoheinakajima/babyagi), and others, which employ a concept known as agents. These agents can be described as follows: a program given a goal (or agency), which it will then develop a plan in order to complete, and then use tools at its disposal to follow its plan. There are a lot of lessons to be learned from agents, and its very possible that they might even be employed as part of the project. However, there is a fundamental difference between an agent and an assistant.

An assistant does not have a goal, it has a purpose. It does not have a discrete set of steps in order to fulfill its purpose, but rather must exist in perpetuity, ready to recieve orders, or take initiative, in order to fulfill it. This is the key difference between an agent and an assistant, and why I'm creating this project. An assistant will be capable of dispatching agents, however, the agents ultimately only exist to fulfill one task, hence their "agency". The assistant exists to continuously provide service to the user.

## Creating an Assistant

---

> [!note]
> Code seen here is subject to change as the project progresses towards 1.0.0, some things here may not work as expected. If you have questions please [reach out](mailto:aidantilgner02@gmail.com) to me directly or [leave an issue](https://github.com/QuasarBrains/Assistant/issues/new)!

---

Install with your package manager of choice, here we'll use npm:

```bash
npm install @quasarbrains/assistant
```

You can see a more concrete example in the [Test Server](https://github.com/QuasarBrains/Assistant/blob/master/apps/test-server/src/index.ts), but here's a simple demonstration of usage:

```ts
import Assistant from "@quasarbrains/assistant";

// * Initialize an OpenAI-based Assistant
const assistant = new Assistant({
  name: "Onyx",
  model: new Assistant.ChatModels.OpenAI({
    apiKey: OPENAI_API_KEY, // ! REPLACE WITH YOUR OPENAI API KEY
    agentModel: "gpt-4",
    planningModel: "gpt-4",
  }),
  datastoreDirectory: path.join(__dirname, "datastore"),
  verbose: false, // set to true for additional logging
});

// * Declare a service and register it, you can register many services
export class FileService extends Assistant.Service {
  constructor() {
    super({
      name: "file-service",
      description: "Performs file operations using node's FS module",
      schema: {
        methods: [
          {
            name: "readFileAsString",
            description: "read a file and get a string as a response",
            parameters: {
              type: "object",
              properties: {
                path: {
                  type: "string",
                  description: "The path to the file that should be read",
                },
              },
              required: ["path"],
            },
            performAction: (params: { path: string }) => {
              return this.readFileAsString(params);
            },
          },
        ],
      },
    });
  }

  public readFileAsString({ path }: { path: string }) {
    const file = this.readFile({ path });
    const asString = file.toString();
    return asString;
  }
}

// * Now you'll need to register the service, so that the assistant has access to them
assistant.ServiceManager().registerServices([new FileService()]);
```

This is a demo of creating an assistant, but doesn't include concepts like `Channels` yet. As mentioned above, you can find a more concrete working example in the [Test Server](https://github.com/QuasarBrains/Assistant/blob/master/apps/test-server/src/index.ts).
