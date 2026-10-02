// backend/model.ts
// OPTIONAL AI path (off unless ANTHROPIC_KEY is set). The Anthropic Messages API. Text arrives as content_block_delta with text_delta; tool arguments
// arrive as input_json_delta fragments concatenated and parsed when the block stops. Prompt caching
// marks the system prompt and tools so they are cached once per lesson.
const ANTHROPIC = "https://api.anthropic.com/v1/messages";
const MODEL = process.env.MODEL ?? "claude-sonnet-4-6"; // pin in config, confirm current string

import type { ModelArgs } from "./modelDemo";
export async function callModelStreaming(
  args: ModelArgs,
  onText: (t: string) => void,
  onTool: (tc: { name: string; input: any }) => void
): Promise<{ text: string }> {
  const resp = await fetch(ANTHROPIC, {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_KEY!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      // cache the expensive, repeated parts: the system prompt and the tool definitions
      system: [{ type: "text", text: args.system, cache_control: { type: "ephemeral" } }],
      tools: args.tools.map((t, i) =>
        i === args.tools.length - 1 ? { ...t, cache_control: { type: "ephemeral" } } : t
      ),
      messages: args.messages,
      tool_choice: { type: "auto" },
      stream: true
    })
  });
  if (!resp.ok || !resp.body) throw new Error(`MODEL_${resp.status}`);

  const reader = resp.body.getReader();
  const dec = new TextDecoder();
  let buffer = "",
    text = "",
    toolName: string | undefined,
    toolJson = "";

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += dec.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const ev of events) {
      const line = ev.split("\n").find((l) => l.startsWith("data: "));
      if (!line) continue;
      const data = JSON.parse(line.slice(6));
      if (data.type === "content_block_start" && data.content_block?.type === "tool_use")
        toolName = data.content_block.name;
      if (data.type === "content_block_delta") {
        if (data.delta.type === "text_delta") {
          text += data.delta.text;
          onText(data.delta.text);
        }
        if (data.delta.type === "input_json_delta") toolJson += data.delta.partial_json;
      }
    }
  }
  if (toolName) onTool({ name: toolName, input: toolJson ? JSON.parse(toolJson) : {} });
  return { text };
}
