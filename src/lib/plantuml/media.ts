import { PlantUmlRenderFormat } from "./validation";
import { PlantUmlRenderError } from "./errors";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const PNG_IEND = [0x49, 0x45, 0x4e, 0x44];
const textDecoder = new TextDecoder();

export interface ValidPlantUmlMedia {
  body: string | Uint8Array;
  contentType: "image/svg+xml; charset=utf-8" | "image/png";
}

export async function readLimitedResponseBytes(
  response: Response,
  maxBytes: number,
): Promise<Uint8Array> {
  if (!response.body) {
    const bytes = new Uint8Array(await response.arrayBuffer());
    ensureResponseSize(bytes.byteLength, maxBytes);
    return bytes;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    totalBytes += value.byteLength;
    ensureResponseSize(totalBytes, maxBytes);
    chunks.push(value);
  }

  const merged = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return merged;
}

export function validatePlantUmlMediaResponse(
  response: Response,
  bytes: Uint8Array,
  format: PlantUmlRenderFormat,
): ValidPlantUmlMedia {
  if (response.status === 400 || response.status === 422) {
    throw new PlantUmlRenderError("PLANTUML_SYNTAX_ERROR");
  }

  if (response.status === 429 || response.status >= 500) {
    throw new PlantUmlRenderError("RENDER_SERVICE_UNAVAILABLE");
  }

  if (!response.ok || isRedirectStatus(response.status)) {
    throw new PlantUmlRenderError("INVALID_RENDER_RESPONSE");
  }

  if (bytes.byteLength === 0) {
    throw new PlantUmlRenderError("INVALID_RENDER_RESPONSE");
  }

  const contentType = normalizeContentType(
    response.headers.get("content-type"),
  );

  if (format === "svg") {
    return validateSvgMedia(contentType, bytes);
  }

  return validatePngMedia(contentType, bytes);
}

function validateSvgMedia(
  contentType: string,
  bytes: Uint8Array,
): ValidPlantUmlMedia {
  if (contentType !== "image/svg+xml") {
    throw new PlantUmlRenderError("INVALID_RENDER_RESPONSE");
  }

  const svg = textDecoder.decode(bytes).trim();
  if (!looksLikeSvg(svg) || containsUnsafeSvg(svg)) {
    throw new PlantUmlRenderError("INVALID_RENDER_RESPONSE");
  }

  if (containsPlantUmlDiagnostic(svg)) {
    throw new PlantUmlRenderError("PLANTUML_SYNTAX_ERROR");
  }

  return {
    body: svg,
    contentType: "image/svg+xml; charset=utf-8",
  };
}

function validatePngMedia(
  contentType: string,
  bytes: Uint8Array,
): ValidPlantUmlMedia {
  if (contentType !== "image/png") {
    throw new PlantUmlRenderError("INVALID_RENDER_RESPONSE");
  }

  if (!hasPngSignature(bytes) || !hasPngEndChunk(bytes)) {
    throw new PlantUmlRenderError("INVALID_RENDER_RESPONSE");
  }

  return {
    body: bytes,
    contentType: "image/png",
  };
}

function ensureResponseSize(totalBytes: number, maxBytes: number) {
  if (totalBytes > maxBytes) {
    throw new PlantUmlRenderError("INVALID_RENDER_RESPONSE");
  }
}

function normalizeContentType(contentType: string | null): string {
  return (contentType || "").split(";")[0].trim().toLowerCase();
}

function isRedirectStatus(status: number): boolean {
  return status >= 300 && status < 400;
}

function looksLikeSvg(svg: string): boolean {
  const normalized = svg.replace(/^\uFEFF/, "").toLowerCase();
  return normalized.includes("<svg") && normalized.includes("</svg>");
}

function containsUnsafeSvg(svg: string): boolean {
  return (
    /<\s*(?:script|foreignobject|iframe|object|embed)\b/i.test(svg) ||
    /\son[a-z]+\s*=/i.test(svg) ||
    /javascript\s*:/i.test(svg) ||
    /data\s*:\s*text\/html/i.test(svg)
  );
}

function containsPlantUmlDiagnostic(svg: string): boolean {
  return /syntax error|error line|no diagram found|some diagram description contains errors|cannot include|cannot import/i.test(
    svg,
  );
}

function hasPngSignature(bytes: Uint8Array): boolean {
  return PNG_SIGNATURE.every((byte, index) => bytes[index] === byte);
}

function hasPngEndChunk(bytes: Uint8Array): boolean {
  if (bytes.byteLength < 12) return false;
  return PNG_IEND.every(
    (byte, index) => bytes[bytes.byteLength - 8 + index] === byte,
  );
}
