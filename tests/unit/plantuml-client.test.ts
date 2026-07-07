import { describe, expect, it, vi } from "vitest";

import {
  PlantUmlClientError,
  PlantUmlRenderCoordinator,
  renderPlantUmlPreview,
} from "@/features/rendering/plantuml-client";

const SVG = '<svg xmlns="http://www.w3.org/2000/svg"></svg>';

function okSvgResponse() {
  return new Response(SVG, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
    },
  });
}

async function expectClientError(
  promise: Promise<unknown>,
  code: PlantUmlClientError["code"],
) {
  await expect(promise).rejects.toMatchObject({
    name: "PlantUmlClientError",
    code,
  });
}

describe("renderPlantUmlPreview", () => {
  it("posts only to the internal render endpoint and waits for browser decode", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(okSvgResponse());
    const decodeImage = vi.fn().mockResolvedValue(undefined);
    const createObjectUrl = vi.fn().mockReturnValue("blob:preview");

    const result = await renderPlantUmlPreview({
      source: "@startuml\nAlice -> Bob\n@enduml",
      format: "svg",
      fetchImpl,
      decodeImage,
      createObjectUrl,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "/api/plantuml/render",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: "@startuml\nAlice -> Bob\n@enduml",
          format: "svg",
        }),
      }),
    );
    expect(decodeImage).toHaveBeenCalledWith("blob:preview");
    expect(result.objectUrl).toBe("blob:preview");
    expect(result.svgText).toBe(SVG);
  });

  it("maps server JSON errors to client errors", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      Response.json(
        {
          error: {
            code: "RENDER_TIMEOUT",
            message: "The PlantUML public server took too long to respond.",
          },
        },
        { status: 504 },
      ),
    );

    await expectClientError(
      renderPlantUmlPreview({
        source: "@startuml\n@enduml",
        fetchImpl,
      }),
      "RENDER_TIMEOUT",
    );
  });

  it("rejects unexpected response content types", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response("not an image", {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
        },
      }),
    );

    await expectClientError(
      renderPlantUmlPreview({
        source: "@startuml\n@enduml",
        fetchImpl,
      }),
      "RESPONSE_VALIDATION_FAILED",
    );
  });

  it("revokes object URLs when browser image decoding fails", async () => {
    const revokeObjectUrl = vi.fn();

    await expectClientError(
      renderPlantUmlPreview({
        source: "@startuml\n@enduml",
        fetchImpl: vi.fn().mockResolvedValue(okSvgResponse()),
        createObjectUrl: vi.fn().mockReturnValue("blob:broken"),
        revokeObjectUrl,
        decodeImage: vi.fn().mockRejectedValue(new Error("decode failed")),
      }),
      "IMAGE_DECODE_FAILED",
    );

    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:broken");
  });

  it("surfaces network failures without leaking low-level details", async () => {
    await expectClientError(
      renderPlantUmlPreview({
        source: "@startuml\n@enduml",
        fetchImpl: vi
          .fn()
          .mockRejectedValue(new Error("C:\\secret\\plantuml.test")),
      }),
      "NETWORK_ERROR",
    );
  });
});

describe("PlantUML render request ordering", () => {
  it("marks earlier responses as outdated after a newer request starts", () => {
    const coordinator = new PlantUmlRenderCoordinator();
    const first = coordinator.nextRequestId();
    const second = coordinator.nextRequestId();

    expect(coordinator.isLatest(first)).toBe(false);
    expect(coordinator.isLatest(second)).toBe(true);
  });
});
