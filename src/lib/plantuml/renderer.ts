import { encode } from "plantuml-encoder";

import { getPlantUmlConfig, PlantUmlConfig } from "./config";
import { PlantUmlRenderError } from "./errors";
import {
  readLimitedResponseBytes,
  validatePlantUmlMediaResponse,
  ValidPlantUmlMedia,
} from "./media";
import {
  parsePlantUmlRenderRequest,
  PlantUmlRenderRequest,
} from "./validation";

export type PlantUmlFetch = typeof fetch;

interface RenderPlantUmlOptions {
  env?: NodeJS.ProcessEnv;
  nodeEnv?: string;
  fetchImpl?: PlantUmlFetch;
}

export async function renderPlantUmlFromPayload(
  payload: unknown,
  options: RenderPlantUmlOptions = {},
): Promise<ValidPlantUmlMedia> {
  const config = getPlantUmlConfig(options.env, options.nodeEnv);
  const request = parsePlantUmlRenderRequest(payload, config);
  const upstreamResponse = await fetchPlantUmlResponse(
    config,
    request,
    options.fetchImpl || fetch,
  );
  const bytes = await readLimitedResponseBytes(
    upstreamResponse,
    config.maxResponseBytes,
  );

  return validatePlantUmlMediaResponse(upstreamResponse, bytes, request.format);
}

export function buildPlantUmlUpstreamUrl(
  config: PlantUmlConfig,
  request: PlantUmlRenderRequest,
): URL {
  const encoded = encode(request.source);
  const url = new URL(config.serverUrl.toString());
  url.pathname = `${config.serverUrl.pathname}/${request.format}/${encoded}`;
  url.search = "";
  url.hash = "";

  if (url.origin !== config.serverUrl.origin) {
    throw new PlantUmlRenderError("INTERNAL_RENDER_ERROR");
  }

  return url;
}

async function fetchPlantUmlResponse(
  config: PlantUmlConfig,
  request: PlantUmlRenderRequest,
  fetchImpl: PlantUmlFetch,
): Promise<Response> {
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, config.timeoutMs);

  try {
    return await fetchImpl(buildPlantUmlUpstreamUrl(config, request), {
      method: "GET",
      headers: {
        Accept: request.format === "svg" ? "image/svg+xml" : "image/png",
      },
      redirect: "manual",
      signal: controller.signal,
    });
  } catch (error) {
    if (timedOut || isAbortError(error)) {
      throw new PlantUmlRenderError("RENDER_TIMEOUT");
    }

    throw new PlantUmlRenderError("RENDER_SERVICE_UNAVAILABLE");
  } finally {
    clearTimeout(timeout);
  }
}

function isAbortError(error: unknown): boolean {
  return (
    (typeof DOMException !== "undefined" &&
      error instanceof DOMException &&
      error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}
