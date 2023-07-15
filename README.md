# GPT Assistant

An infinately extendable assistant for your computer and life, powered by Large Language Models.

## Roadmap

**Current Version**: pre-release
Currently, this library is pre-release, and not considered functional. Give me a bit of time to get a good demo up and running :)

## Description

GPT Assistant is a virtual assistant, not much new about that. The important thing is the extensibility of the tools that the assistant has access to, and the interfaces that it will exist on. Eventually, the goal is to have an autonomous AI agent, that exists to serve the owner, and doesn't require supervision.

For example, if the owner recieves an email, then it's possible that an event may be dispatched with information to the assistant, which can then parse the email, summarize it, and send a text to the owner. The owner could then reply and say to respond in a certain manner, and the assistant would be able to. This kind of functionality would require a complex, flexible, and extensible architecture, which would be fundamentally different than currently existing agents.

## What about Agents?

There are many projects such as [AutoGPT](https://github.com/Significant-Gravitas/Auto-GPT), [Baby AGI](https://github.com/yoheinakajima/babyagi), and others, which employ a concept known as agents. These agents can be described as follows: a program given a goal (or agency), which it will then develop a plan in order to complete, and then use tools at its disposal to follow its plan. There are a lot of lessons to be learned from agents, and its very possible that they might even be employed as part of the project. However, there is a fundamental difference.

A digital assistant does not have a goal, it has a purpose. It does not have a discrete set of steps in order to fulfill its purpose, but rather must exist in perpetuity, ready to recieve orders, or take initiative, in order to fulfill it. This is the key difference between an agent and an assistant, and why I'm creating this project.

## Architecture

If you're interested in the design of the system, check out [the system architecture](https://github.com/AidanTilgner/GPT-Assistant/blob/master/Architecture.md).
