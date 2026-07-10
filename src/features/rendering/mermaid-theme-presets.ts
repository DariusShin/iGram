/**
 * Built-in color presets for Mermaid theming.
 *
 * Each preset is a coherent set of Common theme variables (primary/secondary/
 * tertiary, borders, text, and line colors). Because they use Common variables,
 * every preset renders sensibly across all diagram types. Applying a preset
 * forces the base theme (handled by `applyMermaidThemeVariables`).
 */

export interface MermaidThemePreset {
  name: string;
  variables: Record<string, string>;
}

export const MERMAID_THEME_PRESETS: MermaidThemePreset[] = [
  {
    name: "Ocean",
    variables: {
      primaryColor: "#e0f2fe",
      primaryBorderColor: "#0284c7",
      primaryTextColor: "#0c4a6e",
      lineColor: "#0369a1",
      secondaryColor: "#bae6fd",
      tertiaryColor: "#f0f9ff",
    },
  },
  {
    name: "Sunset",
    variables: {
      primaryColor: "#ffedd5",
      primaryBorderColor: "#ea580c",
      primaryTextColor: "#7c2d12",
      lineColor: "#c2410c",
      secondaryColor: "#fed7aa",
      tertiaryColor: "#fff7ed",
    },
  },
  {
    name: "Forest",
    variables: {
      primaryColor: "#dcfce7",
      primaryBorderColor: "#16a34a",
      primaryTextColor: "#14532d",
      lineColor: "#15803d",
      secondaryColor: "#bbf7d0",
      tertiaryColor: "#f0fdf4",
    },
  },
  {
    name: "Grape",
    variables: {
      primaryColor: "#f3e8ff",
      primaryBorderColor: "#9333ea",
      primaryTextColor: "#581c87",
      lineColor: "#7e22ce",
      secondaryColor: "#e9d5ff",
      tertiaryColor: "#faf5ff",
    },
  },
  {
    name: "Mono",
    variables: {
      primaryColor: "#f1f5f9",
      primaryBorderColor: "#475569",
      primaryTextColor: "#0f172a",
      lineColor: "#334155",
      secondaryColor: "#e2e8f0",
      tertiaryColor: "#f8fafc",
    },
  },
];
