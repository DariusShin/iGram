export const PLANTUML_ERROR_STATUS = {
  INVALID_REQUEST: 400,
  EMPTY_SOURCE: 400,
  UNSUPPORTED_FORMAT: 400,
  PROHIBITED_DIRECTIVE: 400,
  SOURCE_TOO_LARGE: 413,
  PLANTUML_SYNTAX_ERROR: 422,
  INVALID_RENDER_RESPONSE: 502,
  RENDER_SERVICE_UNAVAILABLE: 502,
  RENDER_TIMEOUT: 504,
  INTERNAL_RENDER_ERROR: 500,
} as const;

export type PlantUmlErrorCode = keyof typeof PLANTUML_ERROR_STATUS;

const SAFE_ERROR_MESSAGES: Record<PlantUmlErrorCode, string> = {
  INVALID_REQUEST: "The PlantUML render request is invalid.",
  EMPTY_SOURCE: "Enter PlantUML source before rendering.",
  UNSUPPORTED_FORMAT: "PlantUML output format must be svg or png.",
  PROHIBITED_DIRECTIVE:
    "PlantUML include, import, and external resource directives are not allowed.",
  SOURCE_TOO_LARGE: "The PlantUML source is too large to render.",
  PLANTUML_SYNTAX_ERROR: "The PlantUML source could not be rendered.",
  INVALID_RENDER_RESPONSE:
    "The PlantUML public server returned an invalid diagram response.",
  RENDER_SERVICE_UNAVAILABLE:
    "The PlantUML public server is unavailable. Try again later.",
  RENDER_TIMEOUT: "The PlantUML public server took too long to respond.",
  INTERNAL_RENDER_ERROR: "PlantUML rendering failed unexpectedly.",
};

export class PlantUmlRenderError extends Error {
  readonly code: PlantUmlErrorCode;
  readonly status: number;
  readonly details?: string;

  constructor(code: PlantUmlErrorCode, details?: string) {
    super(SAFE_ERROR_MESSAGES[code]);
    this.name = "PlantUmlRenderError";
    this.code = code;
    this.status = PLANTUML_ERROR_STATUS[code];
    this.details = details;
  }
}

export function toPlantUmlError(error: unknown): PlantUmlRenderError {
  if (error instanceof PlantUmlRenderError) return error;
  return new PlantUmlRenderError("INTERNAL_RENDER_ERROR");
}

export function plantUmlJsonError(error: PlantUmlRenderError): Response {
  const payload = {
    error: {
      code: error.code,
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
    },
  };

  return Response.json(payload, {
    status: error.status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
