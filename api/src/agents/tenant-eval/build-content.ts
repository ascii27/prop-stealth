import { TenantDocument } from "../../types.js";
import { Storage } from "../../storage/local.js";
import { PDFParse } from "pdf-parse";

// Anthropic's image input only supports these mime types — heic uploads pass
// our upload filter but get included as text placeholders here, since the
// vision API will reject them.
type ImageMime = "image/jpeg" | "image/png" | "image/webp" | "image/gif";
const SUPPORTED_IMAGE_MIME: readonly ImageMime[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

function isSupportedImageMime(m: string): m is ImageMime {
  return (SUPPORTED_IMAGE_MIME as readonly string[]).includes(m);
}

export type ContentBlock =
  | { type: "text"; text: string }
  | {
      type: "image";
      source: { type: "base64"; media_type: ImageMime; data: string };
    }
  | {
      type: "document";
      source: { type: "base64"; media_type: "application/pdf"; data: string };
    };

export async function buildDocumentBlocks(
  storage: Storage,
  docs: TenantDocument[],
): Promise<ContentBlock[]> {
  const blocks: ContentBlock[] = [];

  for (const doc of docs) {
    blocks.push({
      type: "text",
      text: `--- Document ---\ndocument_id: ${doc.id}\ncategory: ${doc.category}\nfilename: ${doc.filename}`,
    });

    const buf = await storage.get(doc.storage_key);

    if (doc.mime_type === "application/pdf") {
      // Encode for the document block first — PDFParse may take ownership of the
      // underlying ArrayBuffer when handing it to its worker thread.
      const data = buf.toString("base64");

      // Best-effort text extraction. Failure here is fine; the model still gets
      // the raw PDF block below and can read it visually.
      try {
        const parser = new PDFParse({ data: new Uint8Array(buf) });
        try {
          const parsed = await parser.getText();
          if (parsed.text && parsed.text.trim().length > 0) {
            blocks.push({
              type: "text",
              text: `Extracted text from ${doc.filename}:\n${parsed.text.slice(0, 50_000)}`,
            });
          }
        } finally {
          await parser.destroy();
        }
      } catch (err) {
        console.warn(`pdf-parse failed for ${doc.filename}:`, err);
      }

      blocks.push({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data },
      });
    } else if (isSupportedImageMime(doc.mime_type)) {
      blocks.push({
        type: "image",
        source: {
          type: "base64",
          media_type: doc.mime_type,
          data: buf.toString("base64"),
        },
      });
    } else {
      blocks.push({
        type: "text",
        text: `(Unsupported MIME type ${doc.mime_type} for ${doc.filename}; skipping body.)`,
      });
    }
  }

  return blocks;
}
