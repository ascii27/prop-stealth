import Anthropic from "@anthropic-ai/sdk";
import { config } from "../../config.js";
import { Tenant, TenantDocument, Property } from "../../types.js";
import { Storage } from "../../storage/local.js";
import { EVALUATE_SYSTEM, MODEL_ID } from "./prompts.js";
import { buildDocumentBlocks } from "./build-content.js";
import { parseEvaluationJson, EvaluationResult } from "./parse.js";

export async function runEvaluation(
  storage: Storage,
  tenant: Tenant,
  property: Property,
  docs: TenantDocument[],
): Promise<{ result: EvaluationResult; modelUsed: string }> {
  const client = new Anthropic({ apiKey: config.anthropicApiKey });
  const blocks = await buildDocumentBlocks(storage, docs);

  const summary = `Applicant: ${tenant.applicant_name || "(unspecified)"}
Stated employer: ${tenant.employer || "(unspecified)"}
Stated monthly income: ${tenant.monthly_income ?? "(unspecified)"}
Target move-in: ${tenant.move_in_date ?? "(unspecified)"}
Property: ${property.address}, ${property.city}, ${property.state}
Beds/baths: ${property.beds}/${property.baths}
Monthly rent target: ${property.monthly_rent_target ?? "(unspecified)"}`;

  const message = await client.messages.create({
    model: MODEL_ID,
    max_tokens: 4096,
    system: [
      {
        type: "text",
        text: EVALUATE_SYSTEM,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: summary },
          ...blocks,
          { type: "text", text: "Produce the evaluation JSON now." },
        ],
      },
    ],
  });

  const text = message.content
    .filter((c): c is Anthropic.TextBlock => c.type === "text")
    .map((c) => c.text)
    .join("\n");

  return { result: parseEvaluationJson(text), modelUsed: MODEL_ID };
}
