# System Architecture

So how will this system work? Here's my kinda sorta plan. The system will consistent of a few high level components.

## Channels

A channel is a wrapper around a service or application, such as Slack, Discord, SMS, or something like that, which acts as an interface between a user or service, and the assistant. For example, if I wanted to send the chatbot a text message, or an email, I could do that through a channel. The exact structure here will be necessarily a bit ambiguous, but essentially would consist of a wrapper class that has the ability to both listen to incoming messages, and send outbound messages. A channel is designed for specifically communication.

## Services

A service will be an interface for the assistant to use in order to make things happen. Essentially, the service will provide a spec, and a description, and when the assistant decides that it needs to do something other than send a message through a channel, it will choose a service, and based on the spec, make something happen through the service. Services are where the main extensibility of the assistant will be, as they can seriously be and do anything. A service is designed specifically for performing actions.

## Events

An event will be a packet of information, predefined in schema, which will be published to a priority queue, and interpreted by the assistant. The assistant will then decide a course of action based on the event, such as using a channel to send a message, or using a service to perform an action, or both. The event could contain instructions on what to do when it is dispatched, and any metadata required to perform an action.

### Schema

Each event will have a shape, or schema, which will be used by the dispatcher to build an event before it is published. That way, if you not only want the direct event information, but also want to know other things about the current state of the system, or the world at the time, they can be provided in the schema. Then, when the event is published, the information will be available to the assistant reading the event.

### Listener

An event listener would be a background process which watched a channel, or service, or some other stream of data, and activated a dispatcher when it encounters something that matches what it is supposed to listen for. For example, it could be the weather, the listener could call a weather service every hour, and if a certain criteria is triggered, such as an alert, the listener would notify the event type manager that a "weather alert" was detected. The listener would have an evaluation function, which, if passed, the event would trigger the dispatcher.

### Dispatcher

The event dispatcher would exist as the other half to every listener. They are two sides of the same coin. The dispatcher will be responsible for publishing a given event to the global event priority queue, along with any metadata, or important information that should be provided. When the listener triggers the dispatcher, the dispatcher will build the event based on the schema, and publish it.

## Assistant

The assistant itself is the core of the system, and has access to each individual component. It is responsible for creating the connections between them. The events are its information about the real world, the channels are its mouth and ears, and the services are its limbs, allowing it to take action. The assistant has different modes, reactive, proactive, and instructable. It also has various components that it will use to function.

### Reactive Mode

The reactionary side of the assistant is where it will monitor the event priority queue, and continually go through the events as they are published. This will be the primary focus of the assistant, as it will iteratively respond to events as they come in, and until every task has been responded to, there isn't anything else to do.

### Proactive Mode

This will be a lot more experimental. The idea here is that a good assistant shouldn't just do exactly what you tell it, and respond to things happening in the world, but rather should take action in order to make your life easier, even when it may not be specifically instructed. Essentially my idea here is that when there aren't events to respond to, the assistant could take a look at the user profile, and based on that profile, will decide on an action to take which may improve the life of the user. There are going to be a lot of considerations here in order to mitigate risk, etc.

### Instructable

Basically, this can be activated any time that information is recieved from a channel, and

## Actions

How will the assistant actually take actions? Well, the idea here is that a there would be a "course of action" document cooked up by the assistant, which will be very similar to the way agents make a plan. Then, based on the "course of action", the assistant will execute functions and send messages until the criteria described in the CoA document are completed.

### Course of Action
Here is an example "Course of Action" document, generated by the assistant after interpreting an event describing a weather alert:

```json
{
  "id": 1,
  "title": "Respond to weather alert",
  "mode": "reactive",
  "event_id": "123456",
  "knowledge_acquired": "",
  "plan": [
    {
      "title": "Search for more information about the weather alert",
      "action_type": "service",
      "action_to_use": "weather",
      "method_to_call": "retrieve_current_weather_alerts_for_area",
      "args": {
        "location": "Salem, Oregon"
      },
      "completed_if": "returned_truthy",
      "completed": false,
      "on_completion": "add_to_knowledge",
      "returned_with": null
    },
    {
      "title": "Message the user based on the information recieved",
      "action_type": "channel",
      "action_to_use": "text",
      "method_to_call": "send_text_message_to_user",
      "args": {
        "message": "[AUTOFILL]"
      },
      "completed_if": "returned_truthy",
      "completed": false,
      "on_completion": "end",
      "returned_with": null
    }
  ],
  "completed": false,
  "finished": false,
}
```

This would be the initial state of the course of action document. Essentially, it would be a document containing all of the information needed in order to respond to a given event or something like that. After course of action has been followed, it may look something like this instead:

```json
{
  "id": 1,
  "title": "Weather Alert Response",
  "mode": "reactive",
  "event_id": "123456",
  "knowledge_acquired": "There is currently a thunderstorm advisory in place for Salem Oregon, from Friday night to Saturday morning.",
  "plan": [
    {
      "title": "Search for more information about the weather alert",
      "action_type": "service",
      "action_to_use": "weather",
      "method_to_call": "retrieve_current_weather_alerts_for_area",
      "args": {
        "location": "Salem, Oregon"
      },
      "completed_if": "returned_truthy",
      "completed": true,
      "on_completion": "add_to_knowledge",
      "returned_with": "'[{\"sender_name\":\"NWS Philadelphia - Mount Holly (New Jersey,..."
    },
    {
      "title": "Message the user based on the information recieved",
      "action_type": "channel",
      "action_to_use": "text",
      "method_to_call": "send_text_message_to_user",
      "args": {
        "message": "Hello Aidan! I've become aware of a thunderstorm advisory in Salem, and I thought you would want to know."
      },
      "completed_if": "returned_truthy",
      "completed": true,
      "on_completion": "end"
    }
  ],
  "completed": true,
  "finished": true,
}
```

This would essentially be the assistant's go to whenever there is a chance that something needs to be done, whether this is in Reactive, Proactive, or Instructable modes.

### Manager
The actions manager will be responsible for keeping track of all of the courses of action, and allowing multiple actions to be performed concurrently. This is kind of where agents come in, because there isn't just going to be one Assistant in charge of doing everything, but rather, a separate agent will be created for every individual course of action. The agent will be given the Course of Action, and it will own it until completion. Then, when the task is considered complete, the agent will be destroyed. 

For example, with the weather alert course of action, a new agent would be created called "Weather Alert Response". The agent would start with the first step in the plan, which is to use the weather service to retrieve the current weather alerts for the area. Then, based on the response, the `on_completion` intruction will be used. If the instruction is to `add_to_knowledge`, the agent will take the response, send a request to an LLM, and have it translated into natural language. Then, it would append it as a new section to the `knowledge_acquired` property. Then, it will move onto the next instruction. In this case, the agent will use the text channel to send a text message to the user. The args will require an autofill, as indicated by the `[AUTOFILL]` directive, and so the agent will use a natural language helper (such as an LLM) to autofill the message based on the `knowledge_acquired`.