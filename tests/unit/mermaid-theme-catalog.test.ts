import { describe, expect, it } from "vitest";

import {
  detectMermaidDiagramType,
  getMermaidColorVariables,
  getMermaidThemeVariables,
} from "@/features/rendering/mermaid-theme-catalog";

describe("detectMermaidDiagramType", () => {
  it("detects flowchart from both flowchart and graph keywords", () => {
    expect(detectMermaidDiagramType("flowchart LR\n A --> B")).toBe(
      "flowchart",
    );
    expect(detectMermaidDiagramType("graph TD\n A --> B")).toBe("flowchart");
  });

  it("detects sequence, state, class, pie, journey, er, and gantt", () => {
    expect(detectMermaidDiagramType("sequenceDiagram\n A->>B: hi")).toBe(
      "sequence",
    );
    expect(detectMermaidDiagramType("stateDiagram-v2\n [*] --> A")).toBe(
      "state",
    );
    expect(detectMermaidDiagramType("stateDiagram\n [*] --> A")).toBe("state");
    expect(detectMermaidDiagramType("classDiagram\n class A")).toBe("class");
    expect(detectMermaidDiagramType('pie title Pets\n  "Dogs" : 1')).toBe(
      "pie",
    );
    expect(detectMermaidDiagramType("journey\n title My day")).toBe("journey");
    expect(detectMermaidDiagramType("erDiagram\n A ||--o{ B : has")).toBe("er");
    expect(detectMermaidDiagramType("gantt\n title Plan")).toBe("gantt");
  });

  it("returns unknown for unrecognized or empty sources", () => {
    expect(detectMermaidDiagramType("")).toBe("unknown");
    expect(detectMermaidDiagramType("   \n\n")).toBe("unknown");
    expect(detectMermaidDiagramType("mindmap\n root")).toBe("unknown");
  });

  it("skips init directives, comments, and frontmatter before the keyword", () => {
    const source = [
      "---",
      "title: Demo",
      "---",
      '%%{init: {"theme":"base","themeVariables":{"primaryColor":"#ff0000"}}}%%',
      "%% a comment",
      "sequenceDiagram",
      "  A->>B: hi",
    ].join("\n");
    expect(detectMermaidDiagramType(source)).toBe("sequence");
  });
});

describe("getMermaidThemeVariables gating", () => {
  it("always includes the Common variables", () => {
    for (const type of ["flowchart", "sequence", "pie", "unknown"] as const) {
      const keys = getMermaidThemeVariables(type).map((v) => v.key);
      expect(keys).toContain("primaryColor");
      expect(keys).toContain("lineColor");
    }
  });

  it("surfaces only the active type's specific group", () => {
    const flowchartKeys = getMermaidThemeVariables("flowchart").map(
      (v) => v.key,
    );
    expect(flowchartKeys).toContain("nodeBorder");
    expect(flowchartKeys).not.toContain("actorBkg");

    const sequenceKeys = getMermaidThemeVariables("sequence").map((v) => v.key);
    expect(sequenceKeys).toContain("actorBkg");
    expect(sequenceKeys).toContain("sequenceNumberColor");
    expect(sequenceKeys).not.toContain("nodeBorder");
  });

  it("exposes twelve pie slice colors plus pie extras for pie charts", () => {
    const pieKeys = getMermaidThemeVariables("pie").map((v) => v.key);
    for (let i = 1; i <= 12; i += 1) {
      expect(pieKeys).toContain(`pie${i}`);
    }
    expect(pieKeys).toContain("pieStrokeColor");
    expect(pieKeys).toContain("pieOpacity");
  });

  it("gives an unknown diagram only the Common variables", () => {
    const keys = getMermaidThemeVariables("unknown").map((v) => v.key);
    expect(keys).toContain("primaryColor");
    expect(keys).not.toContain("nodeBorder");
    expect(keys).not.toContain("actorBkg");
  });

  it("excludes non-color variables from the color-picker set", () => {
    const colorKeys = getMermaidColorVariables("pie").map((v) => v.key);
    expect(colorKeys).toContain("pieStrokeColor");
    expect(colorKeys).not.toContain("pieOpacity");
  });
});
