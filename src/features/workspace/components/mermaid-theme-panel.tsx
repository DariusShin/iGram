"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Palette, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  applyMermaidBaseTheme,
  applyMermaidThemeVariables,
  clearMermaidTheme,
  getMermaidThemeConfig,
  MERMAID_THEMES,
  normalizeHexColor,
  type MermaidTheme,
} from "@/features/rendering/mermaid-theme";
import {
  detectMermaidDiagramType,
  getMermaidColorVariables,
} from "@/features/rendering/mermaid-theme-catalog";
import { MERMAID_THEME_PRESETS } from "@/features/rendering/mermaid-theme-presets";

interface MermaidThemePanelProps {
  source: string;
  onSourceChange: (next: string) => void;
}

/** Expand any accepted hex form to the `#rrggbb` a native color input needs. */
function toColorInputValue(
  hex: string | undefined,
  fallback = "#888888",
): string {
  if (!hex) return fallback;
  const value = hex.trim().toLowerCase();
  const short = /^#([0-9a-f]{3})[0-9a-f]?$/.exec(value);
  if (short) {
    return `#${short[1]
      .split("")
      .map((char) => char + char)
      .join("")}`;
  }
  const long = /^#([0-9a-f]{6})(?:[0-9a-f]{2})?$/.exec(value);
  if (long) return `#${long[1]}`;
  return fallback;
}

const DIAGRAM_TYPE_LABELS: Record<string, string> = {
  flowchart: "Flowchart",
  sequence: "Sequence",
  state: "State",
  class: "Class",
  pie: "Pie",
  journey: "Journey",
  er: "Entity relationship",
  gantt: "Gantt",
  unknown: "Diagram",
};

export function MermaidThemePanel({
  source,
  onSourceChange,
}: MermaidThemePanelProps) {
  const [open, setOpen] = useState(false);
  // In-progress hex text keyed by variable, so partial typing isn't clobbered
  // by the source-derived value on every keystroke.
  const [hexDrafts, setHexDrafts] = useState<Record<string, string>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const headingId = useId();

  const diagramType = useMemo(() => detectMermaidDiagramType(source), [source]);
  const config = useMemo(() => getMermaidThemeConfig(source), [source]);
  const colorVariables = useMemo(
    () => getMermaidColorVariables(diagramType),
    [diagramType],
  );

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // The base-theme select renders its options in a portal outside this
      // panel; clicks on them must not count as "outside" or the panel
      // unmounts before the selection is committed.
      const element =
        target instanceof Element ? target : (target.parentElement ?? null);
      if (element?.closest('[data-slot="select-content"]')) return;

      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const selectedTheme = MERMAID_THEMES.includes(
    (config.theme ?? "") as MermaidTheme,
  )
    ? (config.theme as MermaidTheme)
    : null;

  const customizedCount = Object.keys(config.themeVariables).length;
  const hasCustomization = customizedCount > 0 || config.theme !== undefined;

  const commitVariable = (key: string, value: string | null) => {
    onSourceChange(applyMermaidThemeVariables(source, { [key]: value }));
  };

  const handleColorInput = (key: string, value: string) => {
    setHexDrafts((current) => ({ ...current, [key]: value }));
    commitVariable(key, value);
  };

  const handleHexTextChange = (key: string, value: string) => {
    setHexDrafts((current) => ({ ...current, [key]: value }));
    if (normalizeHexColor(value)) commitVariable(key, value);
  };

  const clearDraft = (key: string) => {
    setHexDrafts((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const handleThemeChange = (theme: MermaidTheme | null) => {
    onSourceChange(applyMermaidBaseTheme(source, theme));
  };

  const resetVariable = (key: string) => {
    commitVariable(key, null);
    clearDraft(key);
  };

  const resetAllColors = () => {
    const keys = Object.keys(config.themeVariables);
    if (keys.length === 0) return;
    const cleared = Object.fromEntries(keys.map((key) => [key, null]));
    onSourceChange(applyMermaidThemeVariables(source, cleared));
    setHexDrafts({});
  };

  const clearTheme = () => {
    onSourceChange(clearMermaidTheme(source));
    setHexDrafts({});
  };

  const applyPreset = (variables: Record<string, string>) => {
    onSourceChange(applyMermaidThemeVariables(source, variables));
    setHexDrafts({});
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Mermaid theme colors"
        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:translate-y-px dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <Palette className="size-4 text-blue-600 dark:text-blue-300" />
        <span className="hidden lg:inline">Colors</span>
        {customizedCount > 0 && (
          <span
            className="inline-flex min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white"
            aria-label={`${customizedCount} customized`}
          >
            {customizedCount}
          </span>
        )}
        <ChevronDown
          className={cn("size-3.5 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-labelledby={headingId}
          className="absolute right-0 top-11 z-40 w-80 rounded-lg border border-slate-200 bg-white p-3 shadow-xl shadow-slate-950/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40"
        >
          <div className="mb-3">
            <h2
              id={headingId}
              className="text-sm font-bold text-slate-900 dark:text-slate-100"
            >
              Theme &amp; colors
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {DIAGRAM_TYPE_LABELS[diagramType] ?? "Diagram"} diagram · changes
              are written into the source
            </p>
          </div>

          <div className="mb-3 flex items-center justify-between gap-2">
            <label
              htmlFor={`${headingId}-theme`}
              className="text-xs font-semibold text-slate-600 dark:text-slate-300"
            >
              Base theme
            </label>
            <Select<MermaidTheme>
              value={selectedTheme}
              onValueChange={(theme) => handleThemeChange(theme)}
            >
              <SelectTrigger
                id={`${headingId}-theme`}
                className="w-40"
                title="Base theme"
              >
                <SelectValue>
                  {(theme: MermaidTheme | null) => theme ?? "Auto (app theme)"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent sideOffset={6} align="end">
                {MERMAID_THEMES.map((theme) => (
                  <SelectItem key={theme} value={theme} label={theme}>
                    {theme}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div
            role="group"
            aria-label="Theme colors"
            className="max-h-72 space-y-1 overflow-y-auto pr-1"
          >
            {colorVariables.map((variable) => {
              const sourceValue = config.themeVariables[variable.key];
              const draft = hexDrafts[variable.key];
              const textValue = draft ?? sourceValue ?? "";
              const colorValue = toColorInputValue(
                normalizeHexColor(textValue) ??
                  sourceValue ??
                  variable.defaultValue,
              );
              const colorInputId = `${headingId}-${variable.key}`;
              const isSet = sourceValue !== undefined;

              return (
                <div
                  key={variable.key}
                  className="flex items-center justify-between gap-2 rounded-md px-1 py-1"
                >
                  <label
                    htmlFor={colorInputId}
                    className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700 dark:text-slate-300"
                    title={`${variable.label} (${variable.key})`}
                  >
                    {variable.label}
                    {isSet && (
                      <span
                        className="ml-1 text-blue-600 dark:text-blue-300"
                        aria-hidden="true"
                      >
                        ●
                      </span>
                    )}
                  </label>
                  <input
                    id={colorInputId}
                    type="color"
                    value={colorValue}
                    onChange={(event) =>
                      handleColorInput(variable.key, event.target.value)
                    }
                    aria-label={`${variable.label} color picker`}
                    title={`${variable.label} color picker`}
                    className="size-7 shrink-0 cursor-pointer rounded border border-slate-200 bg-transparent p-0.5 dark:border-slate-600"
                  />
                  <input
                    type="text"
                    inputMode="text"
                    spellCheck={false}
                    value={textValue}
                    placeholder={variable.defaultValue ?? "#rrggbb"}
                    onChange={(event) =>
                      handleHexTextChange(variable.key, event.target.value)
                    }
                    onBlur={() => clearDraft(variable.key)}
                    aria-label={`${variable.label} hex value`}
                    aria-invalid={
                      textValue !== "" && !normalizeHexColor(textValue)
                    }
                    className={cn(
                      "w-20 shrink-0 rounded border bg-white px-2 py-1 font-mono text-xs text-slate-800 outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20 dark:bg-slate-950 dark:text-slate-100",
                      textValue !== "" && !normalizeHexColor(textValue)
                        ? "border-red-400 dark:border-red-500"
                        : "border-slate-200 dark:border-slate-700",
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => resetVariable(variable.key)}
                    disabled={!isSet}
                    aria-label={`Reset ${variable.label}`}
                    title={`Reset ${variable.label} to default`}
                    className="flex size-6 shrink-0 items-center justify-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:pointer-events-none disabled:opacity-30 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  >
                    <RotateCcw className="size-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
            <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Presets
            </span>
            <div className="flex flex-wrap gap-1.5">
              {MERMAID_THEME_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset.variables)}
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            <button
              type="button"
              onClick={resetAllColors}
              disabled={customizedCount === 0}
              className="rounded-md px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Reset colors
            </button>
            <button
              type="button"
              onClick={clearTheme}
              disabled={!hasCustomization}
              className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Clear theme
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
