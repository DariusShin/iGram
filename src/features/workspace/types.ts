export type ThemeMode = "light" | "dark";
export type DiagramLanguage = "mermaid" | "plantuml";
export type RenderState =
  "idle" | "waiting" | "rendering" | "rendered" | "error";
export type CopiedType = "code" | "svg" | null;
export type StatusTone = "neutral" | "blue" | "green" | "amber" | "red";

export interface Template {
  name: string;
  desc: string;
  code: string;
}

export interface MermaidPreview {
  language: "mermaid";
  source: string;
  svgHtml: string;
  renderMs: number;
}

export interface PlantUmlPreview {
  language: "plantuml";
  source: string;
  objectUrl: string;
  svgText?: string;
  blob: Blob;
  contentType: "image/svg+xml" | "image/png";
  renderMs: number;
}

export type PreviewResult = MermaidPreview | PlantUmlPreview;
export type Drafts = Record<DiagramLanguage, string>;
export type RenderStates = Record<DiagramLanguage, RenderState>;
export type RenderErrors = Record<DiagramLanguage, string>;
export type RenderResults = Partial<Record<DiagramLanguage, PreviewResult>>;
