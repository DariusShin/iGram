import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/plantuml/render/route";

const VALID_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg"><text>Rendered</text></svg>';

const SYNTAX_ERROR_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg"><text>Syntax Error?</text></svg>';

const VALID_PNG = Uint8Array.from(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
    "base64",
  ),
);

function renderRequest(payload: unknown): Request {
  return new Request("http://localhost/api/plantuml/render", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

function upstreamResponse(
  body: BodyInit,
  status: number,
  contentType: string,
): Response {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": contentType,
    },
  });
}

async function jsonError(response: Response) {
  return (await response.json()) as {
    error: { code: string; message: string; details?: string };
  };
}

describe("POST /api/plantuml/render", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(upstreamResponse(VALID_SVG, 200, "image/svg+xml")),
    );
  });

  it("renders valid SVG through an encoded upstream request", async () => {
    const response = await POST(
      renderRequest({
        source: "@startuml\nAlice -> Bob\n@enduml",
        format: "svg",
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "image/svg+xml; charset=utf-8",
    );
    expect(await response.text()).toContain("<svg");
    expect(fetch).toHaveBeenCalledTimes(1);

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toMatch(/^http:\/\/plantuml\.test\/plantuml\/svg\//);
    expect(String(url)).not.toContain("@startuml");
    expect(init?.method).toBe("GET");
    expect(init?.redirect).toBe("manual");
  });

  it("renders valid PNG media", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      upstreamResponse(VALID_PNG, 200, "image/png"),
    );

    const response = await POST(
      renderRequest({
        source: "@startuml\nAlice -> Bob\n@enduml",
        format: "png",
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(new Uint8Array(await response.arrayBuffer()).slice(0, 8)).toEqual(
      VALID_PNG.slice(0, 8),
    );
  });

  it("rejects invalid JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/plantuml/render", {
        method: "POST",
        body: "{",
      }),
    );
    const payload = await jsonError(response);

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("INVALID_REQUEST");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects invalid payloads", async () => {
    const response = await POST(renderRequest({ source: 123, format: "svg" }));
    const payload = await jsonError(response);

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("INVALID_REQUEST");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects unsupported formats", async () => {
    const response = await POST(
      renderRequest({ source: "@startuml\n@enduml", format: "pdf" }),
    );
    const payload = await jsonError(response);

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("UNSUPPORTED_FORMAT");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects oversized source before contacting upstream", async () => {
    vi.stubEnv("PLANTUML_MAX_SOURCE_BYTES", "10");

    const response = await POST(
      renderRequest({
        source: "@startuml\nAlice -> Bob\n@enduml",
        format: "svg",
      }),
    );
    const payload = await jsonError(response);

    expect(response.status).toBe(413);
    expect(payload.error.code).toBe("SOURCE_TOO_LARGE");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects prohibited directives before contacting upstream", async () => {
    const response = await POST(
      renderRequest({
        source: "@startuml\n!includeurl https://example.com/x.puml\n@enduml",
        format: "svg",
      }),
    );
    const payload = await jsonError(response);

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("PROHIBITED_DIRECTIVE");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("maps PlantUML diagnostic SVG responses to syntax errors", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      upstreamResponse(SYNTAX_ERROR_SVG, 200, "image/svg+xml"),
    );

    const response = await POST(
      renderRequest({
        source: "@startuml\nAlice ->\n@enduml",
        format: "svg",
      }),
    );
    const payload = await jsonError(response);

    expect(response.status).toBe(422);
    expect(payload.error.code).toBe("PLANTUML_SYNTAX_ERROR");
  });

  it("maps upstream timeout and abort failures to a timeout", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(
      new DOMException("The operation was aborted.", "AbortError"),
    );

    const response = await POST(
      renderRequest({
        source: "@startuml\nAlice -> Bob\n@enduml",
        format: "svg",
      }),
    );
    const payload = await jsonError(response);

    expect(response.status).toBe(504);
    expect(payload.error.code).toBe("RENDER_TIMEOUT");
  });

  it("maps upstream failures to service unavailable", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      upstreamResponse("upstream error", 500, "text/plain"),
    );

    const response = await POST(
      renderRequest({
        source: "@startuml\nAlice -> Bob\n@enduml",
        format: "svg",
      }),
    );
    const payload = await jsonError(response);

    expect(response.status).toBe(502);
    expect(payload.error.code).toBe("RENDER_SERVICE_UNAVAILABLE");
  });

  it("rejects unexpected content types", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      upstreamResponse("<html></html>", 200, "text/html"),
    );

    const response = await POST(
      renderRequest({
        source: "@startuml\nAlice -> Bob\n@enduml",
        format: "svg",
      }),
    );
    const payload = await jsonError(response);

    expect(response.status).toBe(502);
    expect(payload.error.code).toBe("INVALID_RENDER_RESPONSE");
  });

  it("rejects malformed SVG and PNG media", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      upstreamResponse(
        "<svg><script>alert(1)</script></svg>",
        200,
        "image/svg+xml",
      ),
    );

    const svgResponse = await POST(
      renderRequest({
        source: "@startuml\nAlice -> Bob\n@enduml",
        format: "svg",
      }),
    );
    expect((await jsonError(svgResponse)).error.code).toBe(
      "INVALID_RENDER_RESPONSE",
    );

    vi.mocked(fetch).mockResolvedValueOnce(
      upstreamResponse(new Uint8Array([1, 2, 3]), 200, "image/png"),
    );

    const pngResponse = await POST(
      renderRequest({
        source: "@startuml\nAlice -> Bob\n@enduml",
        format: "png",
      }),
    );
    expect((await jsonError(pngResponse)).error.code).toBe(
      "INVALID_RENDER_RESPONSE",
    );
  });

  it("rejects responses larger than the configured cap", async () => {
    vi.stubEnv("PLANTUML_MAX_RESPONSE_BYTES", "5");

    const response = await POST(
      renderRequest({
        source: "@startuml\nAlice -> Bob\n@enduml",
        format: "svg",
      }),
    );
    const payload = await jsonError(response);

    expect(response.status).toBe(502);
    expect(payload.error.code).toBe("INVALID_RENDER_RESPONSE");
  });

  it("does not leak internal details from thrown upstream failures", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(
      new Error("C:\\secret\\path https://internal.example.local"),
    );

    const response = await POST(
      renderRequest({
        source: "@startuml\nAlice -> Bob\n@enduml",
        format: "svg",
      }),
    );
    const body = await response.text();

    expect(response.status).toBe(502);
    expect(body).not.toContain("C:\\secret");
    expect(body).not.toContain("internal.example");
    expect(body).not.toContain("plantuml.test");
  });
});
