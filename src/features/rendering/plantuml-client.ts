export type PlantUmlPreviewFormat = "svg" | "png";

export type PlantUmlClientErrorCode =
  | "INVALID_REQUEST"
  | "EMPTY_SOURCE"
  | "UNSUPPORTED_FORMAT"
  | "PROHIBITED_DIRECTIVE"
  | "SOURCE_TOO_LARGE"
  | "PLANTUML_SYNTAX_ERROR"
  | "INVALID_RENDER_RESPONSE"
  | "RENDER_SERVICE_UNAVAILABLE"
  | "RENDER_TIMEOUT"
  | "INTERNAL_RENDER_ERROR"
  | "NETWORK_ERROR"
  | "RESPONSE_VALIDATION_FAILED"
  | "IMAGE_DECODE_FAILED";

export class PlantUmlClientError extends Error {
  readonly code: PlantUmlClientErrorCode;

  constructor(code: PlantUmlClientErrorCode, message: string) {
    super(message);
    this.name = "PlantUmlClientError";
    this.code = code;
  }
}

export interface PlantUmlPreviewResult {
  objectUrl: string;
  blob: Blob;
  contentType: "image/svg+xml" | "image/png";
  svgText?: string;
}

interface RenderPlantUmlPreviewOptions {
  source: string;
  format?: PlantUmlPreviewFormat;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
  decodeImage?: (objectUrl: string) => Promise<void>;
  createObjectUrl?: (blob: Blob) => string;
  revokeObjectUrl?: (objectUrl: string) => void;
}

export class PlantUmlRenderCoordinator {
  private requestId = 0;

  nextRequestId(): number {
    this.requestId += 1;
    return this.requestId;
  }

  isLatest(requestId: number): boolean {
    return requestId === this.requestId;
  }
}

export async function renderPlantUmlPreview({
  source,
  format = "svg",
  signal,
  fetchImpl = fetch,
  decodeImage = decodeImageObjectUrl,
  createObjectUrl = URL.createObjectURL.bind(URL),
  revokeObjectUrl = URL.revokeObjectURL.bind(URL),
}: RenderPlantUmlPreviewOptions): Promise<PlantUmlPreviewResult> {
  let response: Response;

  try {
    response = await fetchImpl("/api/plantuml/render", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ source, format }),
      signal,
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw new PlantUmlClientError(
        "RENDER_TIMEOUT",
        "The PlantUML render request was cancelled or timed out.",
      );
    }

    throw new PlantUmlClientError(
      "NETWORK_ERROR",
      "PlantUML rendering failed because the network request could not complete.",
    );
  }

  if (!response.ok) {
    throw await readServerError(response);
  }

  const contentType = normalizeResponseContentType(
    response.headers.get("content-type"),
  );
  if (contentType !== "image/svg+xml" && contentType !== "image/png") {
    throw new PlantUmlClientError(
      "RESPONSE_VALIDATION_FAILED",
      "The PlantUML response was not a supported image.",
    );
  }

  const blob = await response.blob();
  const objectUrl = createObjectUrl(blob);

  try {
    await decodeImage(objectUrl);
  } catch {
    revokeObjectUrl(objectUrl);
    throw new PlantUmlClientError(
      "IMAGE_DECODE_FAILED",
      "The browser could not decode the rendered PlantUML image.",
    );
  }

  return {
    objectUrl,
    blob,
    contentType,
    svgText: contentType === "image/svg+xml" ? await blob.text() : undefined,
  };
}

async function readServerError(
  response: Response,
): Promise<PlantUmlClientError> {
  const fallback = new PlantUmlClientError(
    "INVALID_RENDER_RESPONSE",
    "PlantUML rendering failed.",
  );

  try {
    const payload = (await response.json()) as unknown;
    if (
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      payload.error &&
      typeof payload.error === "object" &&
      "code" in payload.error &&
      "message" in payload.error &&
      typeof payload.error.code === "string" &&
      typeof payload.error.message === "string"
    ) {
      return new PlantUmlClientError(
        payload.error.code as PlantUmlClientErrorCode,
        payload.error.message,
      );
    }
  } catch {
    return fallback;
  }

  return fallback;
}

function normalizeResponseContentType(
  contentType: string | null,
): "image/svg+xml" | "image/png" | "" {
  const normalized = (contentType || "").split(";")[0].trim().toLowerCase();
  if (normalized === "image/svg+xml" || normalized === "image/png") {
    return normalized;
  }

  return "";
}

async function decodeImageObjectUrl(objectUrl: string): Promise<void> {
  const image = new Image();
  image.src = objectUrl;

  if (typeof image.decode === "function") {
    await image.decode();
    return;
  }

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Image decoding failed"));
  });
}

function isAbortError(error: unknown): boolean {
  return (
    (typeof DOMException !== "undefined" &&
      error instanceof DOMException &&
      error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}
