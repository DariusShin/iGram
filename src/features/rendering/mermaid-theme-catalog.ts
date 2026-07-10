/**
 * Mermaid diagram-type detection and the catalog of editable theme variables.
 *
 * The catalog drives which color controls the theming UI surfaces: Common
 * variables apply to every diagram, while type-specific groups (flowchart,
 * sequence, state, class, pie) only appear for their diagram type. Variable
 * names and documented defaults follow the Mermaid theming reference:
 * https://mermaid.js.org/config/theming.html
 */

export type MermaidDiagramType =
  | "flowchart"
  | "sequence"
  | "state"
  | "class"
  | "pie"
  | "journey"
  | "er"
  | "gantt"
  | "unknown";

export type MermaidVariableKind = "color" | "number" | "text";

export interface MermaidThemeVariable {
  /** Mermaid `themeVariables` key. */
  key: string;
  /** Human-readable control label. */
  label: string;
  /** Display group heading. */
  group: string;
  /** Diagram types this variable affects; "all" for Common variables. */
  appliesTo: "all" | MermaidDiagramType[];
  kind: MermaidVariableKind;
  /** Documented default, when the Mermaid docs specify a literal value. */
  defaultValue?: string;
}

const COMMON_VARIABLES: MermaidThemeVariable[] = [
  {
    key: "primaryColor",
    label: "Primary",
    group: "Common",
    appliesTo: "all",
    kind: "color",
    defaultValue: "#fff4dd",
  },
  {
    key: "primaryTextColor",
    label: "Primary text",
    group: "Common",
    appliesTo: "all",
    kind: "color",
  },
  {
    key: "primaryBorderColor",
    label: "Primary border",
    group: "Common",
    appliesTo: "all",
    kind: "color",
  },
  {
    key: "lineColor",
    label: "Line",
    group: "Common",
    appliesTo: "all",
    kind: "color",
  },
  {
    key: "background",
    label: "Background",
    group: "Common",
    appliesTo: "all",
    kind: "color",
    defaultValue: "#f4f4f4",
  },
  {
    key: "secondaryColor",
    label: "Secondary",
    group: "Common",
    appliesTo: "all",
    kind: "color",
  },
  {
    key: "tertiaryColor",
    label: "Tertiary",
    group: "Common",
    appliesTo: "all",
    kind: "color",
  },
  {
    key: "noteBkgColor",
    label: "Note background",
    group: "Common",
    appliesTo: "all",
    kind: "color",
    defaultValue: "#fff5ad",
  },
  {
    key: "noteTextColor",
    label: "Note text",
    group: "Common",
    appliesTo: "all",
    kind: "color",
    defaultValue: "#333333",
  },
  {
    key: "textColor",
    label: "Text",
    group: "Common",
    appliesTo: "all",
    kind: "color",
  },
  {
    key: "mainBkg",
    label: "Main background",
    group: "Common",
    appliesTo: "all",
    kind: "color",
  },
];

const FLOWCHART_VARIABLES: MermaidThemeVariable[] = [
  {
    key: "nodeBorder",
    label: "Node border",
    group: "Flowchart",
    appliesTo: ["flowchart"],
    kind: "color",
  },
  {
    key: "clusterBkg",
    label: "Subgraph background",
    group: "Flowchart",
    appliesTo: ["flowchart"],
    kind: "color",
  },
  {
    key: "clusterBorder",
    label: "Subgraph border",
    group: "Flowchart",
    appliesTo: ["flowchart"],
    kind: "color",
  },
  {
    key: "defaultLinkColor",
    label: "Link",
    group: "Flowchart",
    appliesTo: ["flowchart"],
    kind: "color",
  },
  {
    key: "titleColor",
    label: "Title",
    group: "Flowchart",
    appliesTo: ["flowchart"],
    kind: "color",
  },
  {
    key: "edgeLabelBackground",
    label: "Edge label background",
    group: "Flowchart",
    appliesTo: ["flowchart"],
    kind: "color",
  },
  {
    key: "nodeTextColor",
    label: "Node text",
    group: "Flowchart",
    appliesTo: ["flowchart"],
    kind: "color",
  },
];

const SEQUENCE_VARIABLES: MermaidThemeVariable[] = [
  {
    key: "actorBkg",
    label: "Actor background",
    group: "Sequence",
    appliesTo: ["sequence"],
    kind: "color",
  },
  {
    key: "actorBorder",
    label: "Actor border",
    group: "Sequence",
    appliesTo: ["sequence"],
    kind: "color",
  },
  {
    key: "actorTextColor",
    label: "Actor text",
    group: "Sequence",
    appliesTo: ["sequence"],
    kind: "color",
  },
  {
    key: "actorLineColor",
    label: "Lifeline",
    group: "Sequence",
    appliesTo: ["sequence"],
    kind: "color",
  },
  {
    key: "signalColor",
    label: "Message line",
    group: "Sequence",
    appliesTo: ["sequence"],
    kind: "color",
  },
  {
    key: "signalTextColor",
    label: "Message text",
    group: "Sequence",
    appliesTo: ["sequence"],
    kind: "color",
  },
  {
    key: "labelBoxBkgColor",
    label: "Label box background",
    group: "Sequence",
    appliesTo: ["sequence"],
    kind: "color",
  },
  {
    key: "labelBoxBorderColor",
    label: "Label box border",
    group: "Sequence",
    appliesTo: ["sequence"],
    kind: "color",
  },
  {
    key: "labelTextColor",
    label: "Label text",
    group: "Sequence",
    appliesTo: ["sequence"],
    kind: "color",
  },
  {
    key: "loopTextColor",
    label: "Loop text",
    group: "Sequence",
    appliesTo: ["sequence"],
    kind: "color",
  },
  {
    key: "activationBorderColor",
    label: "Activation border",
    group: "Sequence",
    appliesTo: ["sequence"],
    kind: "color",
  },
  {
    key: "activationBkgColor",
    label: "Activation background",
    group: "Sequence",
    appliesTo: ["sequence"],
    kind: "color",
  },
  {
    key: "sequenceNumberColor",
    label: "Sequence number",
    group: "Sequence",
    appliesTo: ["sequence"],
    kind: "color",
  },
];

const STATE_VARIABLES: MermaidThemeVariable[] = [
  {
    key: "labelColor",
    label: "Label",
    group: "State",
    appliesTo: ["state"],
    kind: "color",
  },
  {
    key: "altBackground",
    label: "Composite background",
    group: "State",
    appliesTo: ["state"],
    kind: "color",
  },
];

const CLASS_VARIABLES: MermaidThemeVariable[] = [
  {
    key: "classText",
    label: "Class text",
    group: "Class",
    appliesTo: ["class"],
    kind: "color",
  },
];

const PIE_SLICE_VARIABLES: MermaidThemeVariable[] = Array.from(
  { length: 12 },
  (_, index): MermaidThemeVariable => ({
    key: `pie${index + 1}`,
    label: `Slice ${index + 1}`,
    group: "Pie",
    appliesTo: ["pie"],
    kind: "color",
  }),
);

const PIE_VARIABLES: MermaidThemeVariable[] = [
  ...PIE_SLICE_VARIABLES,
  {
    key: "pieStrokeColor",
    label: "Slice border",
    group: "Pie",
    appliesTo: ["pie"],
    kind: "color",
    defaultValue: "#000000",
  },
  {
    key: "pieTitleTextColor",
    label: "Title text",
    group: "Pie",
    appliesTo: ["pie"],
    kind: "color",
  },
  {
    key: "pieSectionTextColor",
    label: "Section text",
    group: "Pie",
    appliesTo: ["pie"],
    kind: "color",
  },
  {
    key: "pieOpacity",
    label: "Slice opacity",
    group: "Pie",
    appliesTo: ["pie"],
    kind: "number",
    defaultValue: "0.7",
  },
];

/** The full catalog of editable Mermaid theme variables. */
export const MERMAID_THEME_VARIABLES: MermaidThemeVariable[] = [
  ...COMMON_VARIABLES,
  ...FLOWCHART_VARIABLES,
  ...SEQUENCE_VARIABLES,
  ...STATE_VARIABLES,
  ...CLASS_VARIABLES,
  ...PIE_VARIABLES,
];

function classifyKeyword(firstToken: string): MermaidDiagramType {
  const token = firstToken.toLowerCase();

  if (token === "flowchart" || token === "graph") return "flowchart";
  if (token === "sequencediagram") return "sequence";
  if (token.startsWith("statediagram")) return "state";
  if (token === "classdiagram") return "class";
  if (token === "pie") return "pie";
  if (token === "journey") return "journey";
  if (token === "erdiagram") return "er";
  if (token === "gantt") return "gantt";

  return "unknown";
}

/**
 * Detect the Mermaid diagram type from source, skipping `%%{init}%%` directives,
 * `%%` comments, and a leading YAML `--- ... ---` frontmatter block.
 */
export function detectMermaidDiagramType(source: string): MermaidDiagramType {
  const lines = source.split(/\r\n|\r|\n/);
  let inFrontmatter = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line === "---") {
      inFrontmatter = !inFrontmatter;
      continue;
    }
    if (inFrontmatter) continue;
    if (line.startsWith("%%")) continue;

    const firstToken = line.split(/\s+/)[0];
    return classifyKeyword(firstToken);
  }

  return "unknown";
}

/**
 * The theme variables editable for a given diagram type: Common variables plus
 * that type's specific group. An unknown type yields only the Common variables.
 */
export function getMermaidThemeVariables(
  type: MermaidDiagramType,
): MermaidThemeVariable[] {
  return MERMAID_THEME_VARIABLES.filter(
    (variable) =>
      variable.appliesTo === "all" || variable.appliesTo.includes(type),
  );
}

/** The color-only theme variables for a diagram type (drives color pickers). */
export function getMermaidColorVariables(
  type: MermaidDiagramType,
): MermaidThemeVariable[] {
  return getMermaidThemeVariables(type).filter(
    (variable) => variable.kind === "color",
  );
}
