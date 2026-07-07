import { PlantUmlRenderError } from "./errors";

const OFFICIAL_PLANTUML_BASE_URL = "https://www.plantuml.com/plantuml";
const OFFICIAL_ORIGIN = "https://www.plantuml.com";

export const DEFAULT_PLANTUML_MAX_SOURCE_BYTES = 102400;
export const DEFAULT_PLANTUML_RENDER_TIMEOUT_MS = 10000;
export const DEFAULT_PLANTUML_MAX_RESPONSE_BYTES = 5242880;

export interface PlantUmlConfig {
  serverUrl: URL;
  timeoutMs: number;
  maxSourceBytes: number;
  maxResponseBytes: number;
}

interface PlantUmlEnv {
  [key: string]: string | undefined;
  PLANTUML_SERVER_URL?: string;
  PLANTUML_RENDER_TIMEOUT_MS?: string;
  PLANTUML_MAX_SOURCE_BYTES?: string;
  PLANTUML_MAX_RESPONSE_BYTES?: string;
}

export function getPlantUmlConfig(
  env: PlantUmlEnv = process.env,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): PlantUmlConfig {
  const serverUrl = parseServerUrl(
    env.PLANTUML_SERVER_URL || OFFICIAL_PLANTUML_BASE_URL,
    nodeEnv,
  );

  return {
    serverUrl,
    timeoutMs: parsePositiveInteger(
      env.PLANTUML_RENDER_TIMEOUT_MS,
      DEFAULT_PLANTUML_RENDER_TIMEOUT_MS,
    ),
    maxSourceBytes: parsePositiveInteger(
      env.PLANTUML_MAX_SOURCE_BYTES,
      DEFAULT_PLANTUML_MAX_SOURCE_BYTES,
    ),
    maxResponseBytes: parsePositiveInteger(
      env.PLANTUML_MAX_RESPONSE_BYTES,
      DEFAULT_PLANTUML_MAX_RESPONSE_BYTES,
    ),
  };
}

function parseServerUrl(value: string, nodeEnv: string | undefined): URL {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new PlantUmlRenderError("INTERNAL_RENDER_ERROR");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new PlantUmlRenderError("INTERNAL_RENDER_ERROR");
  }

  url.pathname = url.pathname.replace(/\/+$/, "");

  if (!url.pathname) {
    url.pathname = "/plantuml";
  }

  if (nodeEnv !== "test") {
    if (url.protocol !== "https:" || url.origin !== OFFICIAL_ORIGIN) {
      throw new PlantUmlRenderError("INTERNAL_RENDER_ERROR");
    }

    if (url.pathname !== "/plantuml") {
      throw new PlantUmlRenderError("INTERNAL_RENDER_ERROR");
    }
  }

  return url;
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  if (value === undefined || value === "") return fallback;

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new PlantUmlRenderError("INTERNAL_RENDER_ERROR");
  }

  return parsed;
}
