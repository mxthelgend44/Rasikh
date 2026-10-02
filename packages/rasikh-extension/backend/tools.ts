// backend/tools.ts
// Each action is a tool with a JSON schema. Only teaching tools exist: the model is physically
// unable to ask for a click, type, select, submit or navigate.
export const ALL_TOOLS = [
  {
    name: "explain",
    description: "Send a short explanation to the person. No page change.",
    input_schema: { type: "object", properties: { message: { type: "string" } }, required: ["message"] }
  },
  {
    name: "highlight",
    description: "Draw a coach mark on a control and explain it. The person does the action. No page change.",
    input_schema: {
      type: "object",
      properties: { ref: { type: "string" }, message: { type: "string" } },
      required: ["ref", "message"]
    }
  },
  {
    name: "ask",
    description: "Ask the person to do the step themselves, optionally with a structural verify condition.",
    input_schema: {
      type: "object",
      properties: { prompt: { type: "string" }, verify: { type: "string" } },
      required: ["prompt"]
    }
  },
  {
    name: "checkUnderstanding",
    description: "Pose a quick question to confirm the person understands.",
    input_schema: {
      type: "object",
      properties: { question: { type: "string" }, choices: { type: "array", items: { type: "string" } } },
      required: ["question"]
    }
  },
  {
    name: "scrollTo",
    description: "Scroll a control into view. No semantic change.",
    input_schema: { type: "object", properties: { ref: { type: "string" } }, required: ["ref"] }
  }
];

export function toolsForStep(_mode?: string, _allowDemo?: boolean) {
  return ALL_TOOLS;
}
