import Anthropic from "@anthropic-ai/sdk";
import { config } from "../../config.js";
import { TenantDocument } from "../../types.js";
import { Storage } from "../../storage/local.js";
import { EXTRACT_SYSTEM, MODEL_ID } from "./prompts.js";
import { buildDocumentBlocks } from "./build-content.js";
import { parseExtractionJson, ExtractionResult } from "./parse.js";

export async function runExtraction(
  storage: Storage,
  docs: TenantDocument[],
): Promise<ExtractionResult> {
  const client = new Anthropic({ apiKey: config.anthropicApiKey });
  const blocks = await buildDocumentBlocks(storage, docs);

  const message = await client.messages.create({
    model: MODEL_ID,
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: EXTRACT_SYSTEM,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: [
          ...blocks,
          {
            type: "text",
            text: "Extract the basic applicant info as JSON.",
          },
        ],
      },
    ],
  });

  const text = message.content
    .filter((c): c is Anthropic.TextBlock => c.type === "text")
    .map((c) => c.text)
    .join("\n");

  return parseExtractionJson(text);
}
