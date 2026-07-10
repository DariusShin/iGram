import { describe, expect, it } from "vitest";

import {
  applyMermaidBaseTheme,
  applyMermaidThemeVariables,
  clearMermaidTheme,
  getMermaidThemeConfig,
  isValidHexColor,
  normalizeHexColor,
} from "@/features/rendering/mermaid-theme";

const FLOWCHART = "flowchart LR\n  A --> B";

describe("hex color validation", () => {
  it("accepts 3/4/6/8-digit hex colors", () => {
    expect(isValidHexColor("#fff")).toBe(true);
    expect(isValidHexColor("#ffff")).toBe(true);
    expect(isValidHexColor("#ff0000")).toBe(true);
    expect(isValidHexColor("#ff000080")).toBe(true);
  });

  it("rejects named colors and malformed values", () => {
    expect(isValidHexColor("red")).toBe(false);
    expect(isValidHexColor("#ggg")).toBe(false);
    expect(isValidHexColor("rgb(0,0,0)")).toBe(false);
    expect(isValidHexColor("#12345")).toBe(false);
  });

  it("normalizes valid hex to lowercase and rejects the rest", () => {
    expect(normalizeHexColor("#FF0000")).toBe("#ff0000");
    expect(normalizeHexColor("  #ABC ")).toBe("#abc");
    expect(normalizeHexColor("blue")).toBeNull();
  });
});

describe("getMermaidThemeConfig", () => {
  it("returns empty values when no directive exists", () => {
    expect(getMermaidThemeConfig(FLOWCHART)).toEqual({
      theme: undefined,
      themeVariables: {},
    });
  });

  it("parses theme and themeVariables from a canonical directive", () => {
    const source = `%%{init: {"theme":"base","themeVariables":{"primaryColor":"#ff0000"}}}%%\n${FLOWCHART}`;
    expect(getMermaidThemeConfig(source)).toEqual({
      theme: "base",
      themeVariables: { primaryColor: "#ff0000" },
    });
  });

  it("parses the loose single-quoted form shown in the Mermaid docs", () => {
    const source = `%%{init: {'theme':'base', 'themeVariables': {'primaryColor':'#9f51b6'}}}%%\n${FLOWCHART}`;
    expect(getMermaidThemeConfig(source)).toEqual({
      theme: "base",
      themeVariables: { primaryColor: "#9f51b6" },
    });
  });
});

describe("applyMermaidThemeVariables", () => {
  it("inserts a single directive at the top of the source", () => {
    const result = applyMermaidThemeVariables(FLOWCHART, {
      primaryColor: "#ff0000",
    });
    expect(result).toBe(
      `%%{init: {"theme":"base","themeVariables":{"primaryColor":"#ff0000"}}}%%\n${FLOWCHART}`,
    );
  });

  it("forces the base theme when any custom variable is set", () => {
    const result = applyMermaidThemeVariables(FLOWCHART, {
      lineColor: "#00ff00",
    });
    expect(getMermaidThemeConfig(result).theme).toBe("base");
  });

  it("normalizes hex values and rejects named colors", () => {
    const result = applyMermaidThemeVariables(FLOWCHART, {
      primaryColor: "#AABBCC",
      lineColor: "red",
    });
    const { themeVariables } = getMermaidThemeConfig(result);
    expect(themeVariables.primaryColor).toBe("#aabbcc");
    expect(themeVariables.lineColor).toBeUndefined();
  });

  it("merges into an existing directive instead of adding another", () => {
    const first = applyMermaidThemeVariables(FLOWCHART, {
      primaryColor: "#ff0000",
    });
    const second = applyMermaidThemeVariables(first, { lineColor: "#0000ff" });
    expect(second.match(/%%\{init:/g)).toHaveLength(1);
    expect(getMermaidThemeConfig(second).themeVariables).toEqual({
      primaryColor: "#ff0000",
      lineColor: "#0000ff",
    });
  });

  it("removes a variable when its value is empty", () => {
    const withVars = applyMermaidThemeVariables(FLOWCHART, {
      primaryColor: "#ff0000",
      lineColor: "#0000ff",
    });
    const result = applyMermaidThemeVariables(withVars, { lineColor: "" });
    expect(getMermaidThemeConfig(result).themeVariables).toEqual({
      primaryColor: "#ff0000",
    });
  });

  it("removes the directive entirely once all variables are cleared", () => {
    const withVar = applyMermaidThemeVariables(FLOWCHART, {
      primaryColor: "#ff0000",
    });
    const cleared = applyMermaidThemeVariables(withVar, { primaryColor: null });
    expect(cleared).toBe(FLOWCHART);
  });

  it("preserves non-theme init keys", () => {
    const source = `%%{init: {"flowchart":{"curve":"linear"}}}%%\n${FLOWCHART}`;
    const result = applyMermaidThemeVariables(source, {
      primaryColor: "#ff0000",
    });
    expect(result).toContain('"flowchart":{"curve":"linear"}');
    expect(getMermaidThemeConfig(result).themeVariables.primaryColor).toBe(
      "#ff0000",
    );
  });

  it("is idempotent when re-applying the same variables", () => {
    const once = applyMermaidThemeVariables(FLOWCHART, {
      primaryColor: "#ff0000",
    });
    const twice = applyMermaidThemeVariables(once, {
      primaryColor: "#ff0000",
    });
    expect(twice).toBe(once);
  });

  it("preserves CRLF line endings when inserting", () => {
    const crlf = "flowchart LR\r\n  A --> B";
    const result = applyMermaidThemeVariables(crlf, {
      primaryColor: "#ff0000",
    });
    expect(result).toBe(
      `%%{init: {"theme":"base","themeVariables":{"primaryColor":"#ff0000"}}}%%\r\n${crlf}`,
    );
  });
});

describe("applyMermaidBaseTheme", () => {
  it("sets a base theme without variables", () => {
    const result = applyMermaidBaseTheme(FLOWCHART, "forest");
    expect(result).toBe(`%%{init: {"theme":"forest"}}%%\n${FLOWCHART}`);
  });

  it("drops custom variables when switching to a non-base theme", () => {
    const withVars = applyMermaidThemeVariables(FLOWCHART, {
      primaryColor: "#ff0000",
    });
    const result = applyMermaidBaseTheme(withVars, "dark");
    const config = getMermaidThemeConfig(result);
    expect(config.theme).toBe("dark");
    expect(config.themeVariables).toEqual({});
  });

  it("removes the theme key (and empty directive) when cleared", () => {
    const withTheme = applyMermaidBaseTheme(FLOWCHART, "dark");
    expect(applyMermaidBaseTheme(withTheme, null)).toBe(FLOWCHART);
  });
});

describe("clearMermaidTheme", () => {
  it("strips the directive entirely when it only held theme data", () => {
    const withVars = applyMermaidThemeVariables(FLOWCHART, {
      primaryColor: "#ff0000",
    });
    expect(clearMermaidTheme(withVars)).toBe(FLOWCHART);
  });

  it("keeps other init keys while removing theme data", () => {
    const source = `%%{init: {"theme":"base","themeVariables":{"primaryColor":"#ff0000"},"flowchart":{"curve":"linear"}}}%%\n${FLOWCHART}`;
    const result = clearMermaidTheme(source);
    expect(result).toContain('"flowchart":{"curve":"linear"}');
    expect(result).not.toContain("themeVariables");
    expect(result).not.toContain('"theme"');
  });

  it("is a no-op when there is no directive", () => {
    expect(clearMermaidTheme(FLOWCHART)).toBe(FLOWCHART);
  });
});
