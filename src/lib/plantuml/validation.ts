import { z } from "zod";

import { PlantUmlConfig } from "./config";
import { PlantUmlRenderError } from "./errors";

export type PlantUmlRenderFormat = "svg" | "png";

export interface PlantUmlRenderRequest {
  source: string;
  format: PlantUmlRenderFormat;
}

const requestSchema = z
  .object({
    source: z.string(),
    format: z.enum(["svg", "png"]),
  })
  .strict();

const prohibitedSourcePatterns = [
  /^\s*!include(?:url|_many|_once)?\b/im,
  /^\s*!import\b/im,
  /\b(?:https?|ftp|file):\/\//i,
  /\b(?:jar|classpath):/i,
  /<img\s*:/i,
] as const;

export function parsePlantUmlRenderRequest(
  payload: unknown,
  config: PlantUmlConfig,
): PlantUmlRenderRequest {
  const unsupportedFormat = getUnsupportedFormat(payload);
  if (unsupportedFormat) {
    throw new PlantUmlRenderError("UNSUPPORTED_FORMAT");
  }

  const parsed = requestSchema.safeParse(payload);
  if (!parsed.success) {
    throw new PlantUmlRenderError("INVALID_REQUEST");
  }

  const source = parsed.data.source;
  if (!source.trim()) {
    throw new PlantUmlRenderError("EMPTY_SOURCE");
  }

  if (getUtf8ByteLength(source) > config.maxSourceBytes) {
    throw new PlantUmlRenderError("SOURCE_TOO_LARGE");
  }

  if (hasProhibitedPlantUmlDirective(source)) {
    throw new PlantUmlRenderError(
      "PROHIBITED_DIRECTIVE",
      "Remove include, import, URL, and external image references.",
    );
  }

  return parsed.data;
}

export function hasProhibitedPlantUmlDirective(source: string): boolean {
  return prohibitedSourcePatterns.some((pattern) => pattern.test(source));
}

export function getUtf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function getUnsupportedFormat(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const format = (payload as Record<string, unknown>).format;
  return typeof format === "string" && format !== "svg" && format !== "png";
}
