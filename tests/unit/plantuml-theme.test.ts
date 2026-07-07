import { describe, expect, it } from "vitest";

import {
  applyPlantUmlTheme,
  getPlantUmlThemeFromSource,
  PLANTUML_THEME_NONE,
} from "@/features/rendering/plantuml-theme";

describe("PlantUML theme helpers", () => {
  it("defaults to none when no allowed theme line exists", () => {
    expect(getPlantUmlThemeFromSource("@startuml\nAlice -> Bob\n@enduml")).toBe(
      PLANTUML_THEME_NONE,
    );
  });

  it("detects an allowed theme from PlantUML source", () => {
    expect(
      getPlantUmlThemeFromSource(
        "@startuml\n!theme sandstone\nAlice -> Bob\n@enduml",
      ),
    ).toBe("sandstone");
  });

  it("injects the selected theme after @startuml", () => {
    expect(
      applyPlantUmlTheme("@startuml\nAlice -> Bob\n@enduml", "sandstone"),
    ).toBe("@startuml\n!theme sandstone\nAlice -> Bob\n@enduml");
  });

  it("replaces an existing theme line instead of adding another one", () => {
    expect(
      applyPlantUmlTheme(
        "@startuml\n!theme cyborg\nAlice -> Bob\n@enduml",
        "minty",
      ),
    ).toBe("@startuml\n!theme minty\nAlice -> Bob\n@enduml");
  });

  it("removes the theme line when __none__ is selected", () => {
    expect(
      applyPlantUmlTheme(
        "@startuml\n!theme cyborg\nAlice -> Bob\n@enduml",
        PLANTUML_THEME_NONE,
      ),
    ).toBe("@startuml\nAlice -> Bob\n@enduml");
  });

  it("preserves the existing line ending style", () => {
    expect(
      applyPlantUmlTheme("@startuml\r\nAlice -> Bob\r\n@enduml", "plain"),
    ).toBe("@startuml\r\n!theme plain\r\nAlice -> Bob\r\n@enduml");
  });
});
