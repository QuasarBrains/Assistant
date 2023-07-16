# Roadmap

When in the world can I use this to do awesome stuff?

## Goal

To understand this, we have to understand the goal of the project, and the initial features that will be provided. For now, there are going to be two main packages, `@onyx-assistant/core` and `@onyx-assistant/server`. The first will provide the core functionality of the onyx assistant system, and the latter will allow for easy implementation with an express server, and add some additional functionality. Secondarily, it would be very useful to have a template application, which consumes the `@onyx-assistant/core` and `@onyx-assistant/server`, and shows pretty simply how to start using them. Similar to a `create-react-app` or something like that.

### @onyx-assistant/core

The goal of `@onyx-assistant/core` is to a framework for building out complex digital assistants, using language models. More specifically, the package will provide an `Assistant` class, which will provide all of the functionality to build out your assistant in a declarative fashion. My goal here is to have a simple, declarative syntax, which allows predictable flows and functionality.
