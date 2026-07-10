/**
 * Mermaid theming model.
 *
 * Mirrors `plantuml-theme.ts`, but targets the Mermaid frontmatter
 * `%%{init}%%` directive instead of a `!theme` line. Colors chosen in the UI
 * are written into this directive at the top of the source so they round-trip
 * into the editor, persist with the draft, and travel with exports.
 *
 * Scope is intentionally limited to the `%%{init: {...}}%%` directive form.
 * The YAML `--- config ---` frontmatter form is out of scope (Phase 2 backlog).
 */

/** Built-in Mermaid themes. Only `base` supports custom `themeVariables`. */
export const MERMAID_THEMES = [
  "default",
  "neutral",
  "dark",
  "forest",
  "base",
] as const;

export type MermaidTheme = (typeof MERMAID_THEMES)[number];

/** The theme that must be active for custom `themeVariables` to take effect. */
export const MERMAID_CUSTOMIZABLE_THEME: MermaidTheme = "base";

export interface MermaidThemeConfig {
  /** The selected built-in theme, when the directive declares one. */
  theme?: string;
  /** Custom theme variables keyed by Mermaid variable name (hex color values). */
  themeVariables: Record<string, string>;
}

// Captures the object passed to `init:` inside a `%%{ init: {...} }%%` block.
// Non-greedy body + `}\s*%%` terminator lets it span the nested closing braces.
const INIT_DIRECTIVE_PATTERN = /%%\{\s*init\s*:\s*([\s\S]*?)\}\s*%%/i;
const HEX_COLOR_PATTERN =
  /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** True when `value` is a valid 3/4/6/8-digit hex color (named colors fail). */
export function isValidHexColor(value: string): boolean {
  return HEX_COLOR_PATTERN.test(value.trim());
}

/** Normalize a hex color to lowercase `#rrggbb` form, or null when invalid. */
export function normalizeHexColor(value: string): string | null {
  const trimmed = value.trim();
  return isValidHexColor(trimmed) ? trimmed.toLowerCase() : null;
}

/**
 * Best-effort parse of the loosely-formatted JSON Mermaid accepts in a
 * directive (single quotes and unquoted keys, as shown in the Mermaid docs).
 * Returns null when the body cannot be understood.
 */
function parseDirectiveBody(body: string): Record<string, unknown> | null {
  const trimmed = body.trim();
  if (!trimmed) return null;

  try {
    const parsed: unknown = JSON.parse(trimmed);
    return isRecord(parsed) ? parsed : null;
  } catch {
    // Fall through to a lenient normalization pass.
  }

  try {
    const normalized = trimmed
      .replace(/'/g, '"')
      .replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":');
    const parsed: unknown = JSON.parse(normalized);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

interface DirectiveMatch {
  start: number;
  end: number;
  body: string;
}

function findInitDirective(source: string): DirectiveMatch | null {
  const match = INIT_DIRECTIVE_PATTERN.exec(source);
  if (!match) return null;

  return {
    start: match.index,
    end: match.index + match[0].length,
    body: match[1],
  };
}

/** Read the full `init` config object from the source (preserving all keys). */
function readInitConfig(source: string): Record<string, unknown> {
  const directive = findInitDirective(source);
  if (!directive) return {};

  const parsed = parseDirectiveBody(directive.body);
  return parsed ?? {};
}

/** Drop empty/absent theme keys so an empty config serializes to no directive. */
function cleanConfig(config: Record<string, unknown>): Record<string, unknown> {
  const cleaned = { ...config };

  if (
    !isRecord(cleaned.themeVariables) ||
    Object.keys(cleaned.themeVariables).length === 0
  ) {
    delete cleaned.themeVariables;
  }

  if (
    cleaned.theme === undefined ||
    cleaned.theme === null ||
    cleaned.theme === ""
  ) {
    delete cleaned.theme;
  }

  return cleaned;
}

/** Serialize a config to a canonical, single-line `%%{init}%%` directive. */
function serializeDirective(config: Record<string, unknown>): string {
  // Stable key order (theme, themeVariables, then any preserved extras) keeps
  // repeated writes idempotent.
  const ordered: Record<string, unknown> = {};
  if (config.theme !== undefined) ordered.theme = config.theme;
  if (config.themeVariables !== undefined) {
    ordered.themeVariables = config.themeVariables;
  }
  for (const key of Object.keys(config)) {
    if (key !== "theme" && key !== "themeVariables") {
      ordered[key] = config[key];
    }
  }

  return `%%{init: ${JSON.stringify(ordered)}}%%`;
}

function detectLineBreak(source: string): string {
  return source.match(/\r\n|\r|\n/)?.[0] ?? "\n";
}

function removeDirective(source: string, directive: DirectiveMatch): string {
  const before = source.slice(0, directive.start);
  const after = source.slice(directive.end);

  // Collapse the blank line the directive occupied so removal is clean.
  if (/^(\r\n|\r|\n)/.test(after)) {
    return before + after.replace(/^(\r\n|\r|\n)/, "");
  }
  if (/(\r\n|\r|\n)$/.test(before)) {
    return before.replace(/(\r\n|\r|\n)$/, "") + after;
  }
  return before + after;
}

/**
 * Write a config back into the source: replace the existing directive, insert a
 * new one at the top, or remove it entirely when the config has nothing to say.
 */
function writeInitConfig(
  source: string,
  config: Record<string, unknown>,
): string {
  const cleaned = cleanConfig(config);
  const directive = findInitDirective(source);

  if (Object.keys(cleaned).length === 0) {
    return directive ? removeDirective(source, directive) : source;
  }

  const serialized = serializeDirective(cleaned);

  if (directive) {
    return (
      source.slice(0, directive.start) +
      serialized +
      source.slice(directive.end)
    );
  }

  if (source.length === 0) return serialized;
  return `${serialized}${detectLineBreak(source)}${source}`;
}

/**
 * Read the theme + custom theme variables declared by the leading `%%{init}%%`
 * directive. Returns empty values when the source has no directive.
 */
export function getMermaidThemeConfig(source: string): MermaidThemeConfig {
  const config = readInitConfig(source);

  const theme = typeof config.theme === "string" ? config.theme : undefined;
  const themeVariables: Record<string, string> = {};

  if (isRecord(config.themeVariables)) {
    for (const [key, value] of Object.entries(config.themeVariables)) {
      if (typeof value === "string") themeVariables[key] = value;
    }
  }

  return { theme, themeVariables };
}

/**
 * Merge color variables into the source directive.
 *
 * - A valid `#hex` value sets/overwrites the variable (named colors are
 *   rejected and silently skipped).
 * - A null/undefined/empty value removes that variable.
 * - Any remaining custom variable forces `theme: "base"` (only base is
 *   customizable per the Mermaid docs).
 * - When no custom variables remain, the theme customization is cleared; if the
 *   directive then holds no other keys it is removed entirely.
 * - Non-theme keys already present in the directive are preserved.
 */
export function applyMermaidThemeVariables(
  source: string,
  variables: Record<string, string | null | undefined>,
): string {
  const config = readInitConfig(source);
  const nextVariables: Record<string, unknown> = isRecord(config.themeVariables)
    ? { ...config.themeVariables }
    : {};

  for (const [key, value] of Object.entries(variables)) {
    if (value === null || value === undefined || value.trim() === "") {
      delete nextVariables[key];
      continue;
    }

    const normalized = normalizeHexColor(value);
    if (normalized) nextVariables[key] = normalized;
    // Invalid (e.g. named) colors are rejected: leave the variable untouched.
  }

  if (Object.keys(nextVariables).length > 0) {
    config.themeVariables = nextVariables;
    config.theme = MERMAID_CUSTOMIZABLE_THEME;
  } else {
    delete config.themeVariables;
    // Drop a theme that only existed to host the (now removed) variables.
    if (config.theme === MERMAID_CUSTOMIZABLE_THEME) delete config.theme;
  }

  return writeInitConfig(source, config);
}

/**
 * Set (or clear) the built-in base theme in the directive.
 *
 * Passing null/empty removes the theme key. Selecting a non-`base` theme drops
 * any custom variables, since they only apply to the base theme.
 */
export function applyMermaidBaseTheme(
  source: string,
  theme: MermaidTheme | string | null,
): string {
  const config = readInitConfig(source);

  if (!theme) {
    delete config.theme;
  } else {
    config.theme = theme;
    if (theme !== MERMAID_CUSTOMIZABLE_THEME) delete config.themeVariables;
  }

  return writeInitConfig(source, config);
}

/**
 * Remove all theme customization (theme + themeVariables). Other `init` keys are
 * preserved; if none remain, the directive is removed entirely.
 */
export function clearMermaidTheme(source: string): string {
  const directive = findInitDirective(source);
  if (!directive) return source;

  const config = readInitConfig(source);
  delete config.theme;
  delete config.themeVariables;

  return writeInitConfig(source, config);
}
