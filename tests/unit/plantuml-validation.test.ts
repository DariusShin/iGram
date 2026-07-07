import { describe, expect, it } from "vitest";

import { getPlantUmlConfig } from "@/lib/plantuml/config";
import { PlantUmlRenderError } from "@/lib/plantuml/errors";
import {
  hasProhibitedPlantUmlDirective,
  parsePlantUmlRenderRequest,
} from "@/lib/plantuml/validation";

const testConfig = getPlantUmlConfig(
  {
    PLANTUML_SERVER_URL: "http://plantuml.test/plantuml",
    PLANTUML_MAX_SOURCE_BYTES: "102400",
  },
  "test",
);

function expectPlantUmlError(
  run: () => unknown,
  code: PlantUmlRenderError["code"],
) {
  expect(run).toThrow(PlantUmlRenderError);

  try {
    run();
  } catch (error) {
    expect(error).toBeInstanceOf(PlantUmlRenderError);
    expect((error as PlantUmlRenderError).code).toBe(code);
  }
}

describe("PlantUML config validation", () => {
  it("accepts the official HTTPS PlantUML server outside tests", () => {
    const config = getPlantUmlConfig(
      {
        PLANTUML_SERVER_URL: "https://www.plantuml.com/plantuml",
      },
      "production",
    );

    expect(config.serverUrl.toString()).toBe(
      "https://www.plantuml.com/plantuml",
    );
  });

  it("rejects non-official upstream hosts outside tests", () => {
    expectPlantUmlError(
      () =>
        getPlantUmlConfig(
          {
            PLANTUML_SERVER_URL: "https://example.com/plantuml",
          },
          "production",
        ),
      "INTERNAL_RENDER_ERROR",
    );
  });

  it("allows a mock upstream only in tests", () => {
    const config = getPlantUmlConfig(
      {
        PLANTUML_SERVER_URL: "http://plantuml.test/plantuml",
      },
      "test",
    );

    expect(config.serverUrl.origin).toBe("http://plantuml.test");
  });

  it("rejects invalid numeric settings", () => {
    expectPlantUmlError(
      () =>
        getPlantUmlConfig(
          {
            PLANTUML_RENDER_TIMEOUT_MS: "0",
          },
          "test",
        ),
      "INTERNAL_RENDER_ERROR",
    );
  });
});

describe("PlantUML request validation", () => {
  it("accepts non-empty source with svg or png formats", () => {
    expect(
      parsePlantUmlRenderRequest(
        {
          source: "@startuml\nAlice -> Bob\n@enduml",
          format: "svg",
        },
        testConfig,
      ),
    ).toEqual({
      source: "@startuml\nAlice -> Bob\n@enduml",
      format: "svg",
    });

    expect(
      parsePlantUmlRenderRequest(
        {
          source: "@startuml\nAlice -> Bob\n@enduml",
          format: "png",
        },
        testConfig,
      ).format,
    ).toBe("png");
  });

  it("rejects malformed payloads", () => {
    expectPlantUmlError(
      () =>
        parsePlantUmlRenderRequest({ source: 12, format: "svg" }, testConfig),
      "INVALID_REQUEST",
    );
  });

  it("rejects unsupported formats", () => {
    expectPlantUmlError(
      () =>
        parsePlantUmlRenderRequest(
          { source: "@startuml\n@enduml", format: "pdf" },
          testConfig,
        ),
      "UNSUPPORTED_FORMAT",
    );
  });

  it("rejects empty source", () => {
    expectPlantUmlError(
      () =>
        parsePlantUmlRenderRequest(
          { source: "  \n", format: "svg" },
          testConfig,
        ),
      "EMPTY_SOURCE",
    );
  });

  it("rejects oversized source", () => {
    const config = getPlantUmlConfig(
      {
        PLANTUML_SERVER_URL: "http://plantuml.test/plantuml",
        PLANTUML_MAX_SOURCE_BYTES: "10",
      },
      "test",
    );

    expectPlantUmlError(
      () =>
        parsePlantUmlRenderRequest(
          { source: "@startuml\nAlice -> Bob\n@enduml", format: "svg" },
          config,
        ),
      "SOURCE_TOO_LARGE",
    );
  });

  it("rejects include, import, URL, and external image references", () => {
    const unsafeSources = [
      "@startuml\n!include theme.puml\n@enduml",
      "@startuml\n!includeurl https://example.com/theme.puml\n@enduml",
      "@startuml\n!import common\n@enduml",
      "@startuml\nAlice -> Bob: https://example.com\n@enduml",
      "@startuml\n<img:http://example.com/logo.png>\n@enduml",
    ];

    for (const source of unsafeSources) {
      expect(hasProhibitedPlantUmlDirective(source)).toBe(true);
      expectPlantUmlError(
        () => parsePlantUmlRenderRequest({ source, format: "svg" }, testConfig),
        "PROHIBITED_DIRECTIVE",
      );
    }
  });
});
