import { PlantUmlClientError } from "@/features/rendering/plantuml-client";
import {
  DEFAULT_DRAFTS,
  DRAFT_STORAGE_KEY,
  THEME_STORAGE_KEY,
} from "@/features/workspace/constants";
import type {
  Drafts,
  PreviewResult,
  ThemeMode,
} from "@/features/workspace/types";

export function getErrorMessage(err: unknown): string {
  if (err instanceof PlantUmlClientError) return err.message;
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (
    err &&
    typeof err === "object" &&
    "str" in err &&
    typeof (err as { str: unknown }).str === "string"
  ) {
    return (err as { str: string }).str;
  }
  return "The diagram could not be rendered.";
}

export function loadDrafts(): Drafts {
  if (typeof window === "undefined") return DEFAULT_DRAFTS;

  try {
    const savedDrafts = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!savedDrafts) return DEFAULT_DRAFTS;

    const parsed = JSON.parse(savedDrafts) as Partial<Drafts>;
    return {
      mermaid:
        typeof parsed.mermaid === "string"
          ? parsed.mermaid
          : DEFAULT_DRAFTS.mermaid,
      plantuml:
        typeof parsed.plantuml === "string"
          ? parsed.plantuml
          : DEFAULT_DRAFTS.plantuml,
    };
  } catch {
    return DEFAULT_DRAFTS;
  }
}

export function loadThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "light";

  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return savedTheme === "dark" || savedTheme === "light" ? savedTheme : "light";
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getSvgSize(svgHtml: string): { width: number; height: number } {
  const fallback = { width: 1200, height: 800 };
  const svg = new DOMParser().parseFromString(
    svgHtml,
    "image/svg+xml",
  ).documentElement;
  const viewBox = svg.getAttribute("viewBox");

  if (viewBox) {
    const [, , width, height] = viewBox.split(/\s+/).map(Number);
    if (width > 0 && height > 0) return { width, height };
  }

  const width = Number.parseFloat(svg.getAttribute("width") || "");
  const height = Number.parseFloat(svg.getAttribute("height") || "");
  if (width > 0 && height > 0) return { width, height };

  return fallback;
}

export function revokePlantUmlResult(result: PreviewResult | undefined): void {
  if (result?.language === "plantuml") {
    URL.revokeObjectURL(result.objectUrl);
  }
}

/** Extract the raw SVG markup from a rendered preview, if it has any. */
export async function getSvgTextFromResult(
  result: PreviewResult | undefined,
): Promise<string> {
  if (!result) return "";
  if (result.language === "mermaid") return result.svgHtml;
  if (result.svgText) return result.svgText;
  if (result.contentType === "image/svg+xml") return result.blob.text();
  return "";
}

/** Rasterize SVG markup to a 2x PNG blob on a themed background. */
export function rasterizeSvgToPng(
  svgText: string,
  isDark: boolean,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const { width, height } = getSvgSize(svgText);
    const image = new window.Image();
    const url = URL.createObjectURL(
      new Blob([svgText], { type: "image/svg+xml;charset=utf-8" }),
    );

    image.onload = () => {
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(width * scale);
      canvas.height = Math.ceil(height * scale);

      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(url);
        resolve(null);
        return;
      }

      context.fillStyle = isDark ? "#111827" : "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.scale(scale, scale);
      context.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => resolve(blob), "image/png");
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    image.src = url;
  });
}

/** Build a self-contained, themed HTML document that embeds the given SVG. */
export function buildStandaloneHtml(svgText: string, isDark: boolean): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>iGram Diagram</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: ${isDark ? "#111827" : "#ffffff"};
      color: ${isDark ? "#f8fafc" : "#111827"};
      font-family: ui-sans-serif, system-ui, sans-serif;
    }
    svg { max-width: min(1200px, 92vw); height: auto; }
  </style>
</head>
<body>
${svgText}
</body>
</html>`;
}
