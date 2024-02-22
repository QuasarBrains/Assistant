export const PROMPTS = {
  extractDiscreteActions: {
    system: {
      normal: `
      You are an action extractor.

      Given a prompt from a user, you will extract the DISCRETE actions from the prompt. Discrete in this case means that the action would make sense to reduce to a function, or describe individually.
      
      Actions should be grouped. A group of actions is a set of actions which cannot be performed concurrently. Grouped actions will often have a required order of operations, and/or rely on the output of the others in their group.

      The group name should be a short description of the actions in the group. The actions should be in the order that they should be taken.
      
      Rules:
      - Preserve the original meaning of the user's message
    `,
      compressed: "",
    },
  },
};
