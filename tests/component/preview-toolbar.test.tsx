import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { PreviewToolbar } from "@/features/workspace/components/preview-toolbar";
import { PLANTUML_THEME_NONE } from "@/features/rendering/plantuml-theme";
import type { DiagramLanguage } from "@/features/workspace/types";

afterEach(cleanup);

function renderToolbar(activeLanguage: DiagramLanguage) {
  return render(
    <PreviewToolbar
      statusTone="green"
      statusLabel="Rendered"
      activeLanguage={activeLanguage}
      selectedPlantUmlTheme={PLANTUML_THEME_NONE}
      onPlantUmlThemeChange={vi.fn()}
      mermaidSource="flowchart LR\n A --> B"
      onMermaidSourceChange={vi.fn()}
      zoom={1}
      onZoomIn={vi.fn()}
      onZoomOut={vi.fn()}
      onZoomReset={vi.fn()}
      exportOpen={false}
      onExportOpenChange={vi.fn()}
      hasResult={false}
      canExport={false}
      copiedType={null}
      onDownloadSvg={vi.fn()}
      onDownloadPng={vi.fn()}
      onDownloadHtml={vi.fn()}
      onCopySvg={vi.fn()}
    />,
  );
}

describe("PreviewToolbar theme controls gating", () => {
  it("shows the Mermaid Colors panel (and not the PlantUML theme select) for Mermaid", () => {
    renderToolbar("mermaid");
    expect(screen.getByRole("button", { name: /colors/i })).toBeTruthy();
    expect(screen.queryByTitle("PlantUML theme")).toBeNull();
  });

  it("shows the PlantUML theme select (and hides the Mermaid Colors panel) for PlantUML", () => {
    renderToolbar("plantuml");
    expect(screen.queryByRole("button", { name: /colors/i })).toBeNull();
    expect(screen.getByTitle("PlantUML theme")).toBeTruthy();
  });
});
