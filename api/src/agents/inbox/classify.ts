import Anthropic from "@anthropic-ai/sdk";
import { config } from "../../config.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EmailTheme = "tenant" | "hoa" | "bill" | "maintenance" | "other";

export interface ClassificationResult {
  theme: EmailTheme;
  keyPoints: string;
  propertyMatch: string | null;
  showAutoRespond: boolean;
  violationTag: string | null;
}

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

const client = new Anthropic({ apiKey: config.anthropicApiKey });

const classifyTool: Anthropic.Messages.Tool = {
  name: "classify_email",
  description: "Classify a property-related email and extract key information.",
  input_schema: {
    type: "object" as const,
    properties: {
      theme: {
        type: "string",
        enum: ["tenant", "hoa", "bill", "maintenance", "other"],
        description: "The primary theme of the email.",
      },
      key_points: {
        type: "string",
        description: "1-2 sentence summary of the most important information in the email.",
      },
      property_match: {
        type: "string",
        description: "The property address this email is most likely about, based on the content. Null if unclear.",
        nullable: true,
      },
      show_auto_respond: {
        type: "boolean",
        description: "Whether this email is appropriate for an auto-respond draft. True for tenant requests, HOA notices, and maintenance requests. False for bills, tax notices, and automated messages.",
      },
      violation_tag: {
        type: "string",
        description: "A short tag if the email contains a violation, urgent issue, or lease concern. Examples: 'Violation', 'Urgent', 'Lease violation'. Null if not applicable.",
        nullable: true,
      },
    },
    required: ["theme", "key_points", "property_match", "show_auto_respond", "violation_tag"],
  },
};

export async function classifyEmail(
  sender: string,
  subject: string,
  body: string,
  propertyAddresses: string[],
): Promise<ClassificationResult> {
  const propertyList = propertyAddresses.length > 0
    ? `The user owns these properties:\n${propertyAddresses.map((a) => `- ${a}`).join("\n")}`
    : "The user has no properties on file.";

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    tools: [classifyTool],
    tool_choice: { type: "tool", name: "classify_email" },
    messages: [
      {
        role: "user",
        content: `You are classifying a property-related email for a real estate owner/manager.

${propertyList}

Classify this email:

From: ${sender}
Subject: ${subject}

${body}`,
      },
    ],
  });

  // Extract tool use result
  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude did not return a tool use response");
  }

  const input = toolUse.input as Record<string, unknown>;
  return {
    theme: input.theme as EmailTheme,
    keyPoints: input.key_points as string,
    propertyMatch: (input.property_match as string) || null,
    showAutoRespond: input.show_auto_respond as boolean,
    violationTag: (input.violation_tag as string) || null,
  };
}

// ---------------------------------------------------------------------------
// Draft generation
// ---------------------------------------------------------------------------

export async function generateReplyDraft(
  originalEmail: { sender: string; subject: string; body: string; theme: string },
  propertyContext: string,
): Promise<string> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Draft a professional reply from a property owner/manager to this email.

CONSTRAINTS:
- Never reference protected class attributes (Fair Housing Act compliance)
- Keep the reply under 150 words
- Match the formality level of the incoming email
- For maintenance requests: acknowledge the issue, promise follow-up, do NOT commit to specific timelines
- Be helpful and professional

Property context: ${propertyContext}

Original email:
From: ${originalEmail.sender}
Subject: ${originalEmail.subject}

${originalEmail.body}

Write ONLY the reply body text — no subject line, no greeting prefix like "Dear", just start with the greeting naturally.`,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude did not return a text response");
  }
  return textBlock.text;
}
