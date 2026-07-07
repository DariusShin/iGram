"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import initEditor from "monaco-mermaid";
import mermaid from "mermaid";
import {
  AlertCircle,
  Check,
  ChevronDown,
  Copy,
  Download,
  FileCode2,
  Loader2,
  Moon,
  RotateCcw,
  Sparkles,
  Sun,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { cn } from "@/lib/utils";

type ThemeMode = "light" | "dark";
type RenderState = "idle" | "waiting" | "rendering" | "rendered" | "error";
type CopiedType = "code" | "svg" | null;

const TEMPLATES = [
  {
    name: "iGram Architecture",
    desc: "Classic workspace flow from source to preview",
    code: `%% iGram architecture
flowchart LR
    User([User]) --> WS[iGram Workspace]
    WS --> R{Renderer}
    R -->|mermaid| PV[Preview Canvas]
    R -->|plantuml| API["/api/plantuml/render/"]
    API --> PV`,
  },
  {
    name: "Flowchart",
    desc: "Process flows, decision trees, and workflows",
    code: `flowchart TD
    A[Start Project] --> B{Are requirements clear?}
    B -- Yes --> C[Start Development]
    B -- No --> D[Conduct workshops]
    D --> B
    C --> E[Testing Phase]
    E --> F[Production Release]`,
  },
  {
    name: "Sequence Diagram",
    desc: "Interaction sequence between systems/users",
    code: `sequenceDiagram
    autonumber
    actor User
    participant App as Web Application
    participant API as Backend Service
    participant DB as SQL Database

    User->>App: Click Sync Data
    App->>+API: POST /api/v1/sync
    API->>+DB: INSERT INTO transactions
    DB-->>-API: Complete
    API-->>-App: 201 Created
    App-->>User: Show success`,
  },
  {
    name: "State Diagram",
    desc: "Lifecycle and transitions of a state machine",
    code: `stateDiagram-v2
    [*] --> Idle
    Idle --> ActiveSession : User login
    ActiveSession --> Suspended : Security timeout
    Suspended --> ActiveSession : Re-authenticate
    ActiveSession --> Idle : User logout`,
  },
  {
    name: "Gantt Chart",
    desc: "Project scheduling, timelines, and milestones",
    code: `gantt
    title Product Launch Timeline
    dateFormat YYYY-MM-DD
    section Strategy
    Market Research  :done, des1, 2026-07-01, 2026-07-05
    Product Design   :active, des2, 2026-07-05, 10d
    section Launch
    Beta Testing     :2026-07-28, 7d
    Public Launch    :2026-08-05, 1d`,
  },
  {
    name: "Mindmap",
    desc: "Brainstorming and hierarchical nodes",
    code: `mindmap
  root((Developer Tools))
    Editor
      Monaco
      VS Code
    Framework
      Next.js
      React
    Styling
      Tailwind CSS`,
  },
];

const DEFAULT_ZOOM = 1;

function getErrorMessage(err: unknown) {
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
  return "Invalid Mermaid syntax";
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getSvgSize(svgHtml: string) {
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

export default function MermaidEditor() {
  const [code, setCode] = useState(TEMPLATES[0].code);
  const [svgHtml, setSvgHtml] = useState("");
  const [error, setError] = useState("");
  const [renderState, setRenderState] = useState<RenderState>("waiting");
  const [renderMs, setRenderMs] = useState<number | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [copiedType, setCopiedType] = useState<CopiedType>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(true);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "light";

    const savedTheme = window.localStorage.getItem("igram-theme");
    return savedTheme === "dark" || savedTheme === "light"
      ? savedTheme
      : "light";
  });

  const templateRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const renderId = useRef(0);

  const isDark = themeMode === "dark";
  const canExport = Boolean(svgHtml) && !error && renderState === "rendered";
  const lineStats = useMemo(() => {
    if (!code) return { line: 1, col: 1 };
    const lines = code.split(/\r\n|\r|\n/);
    return {
      line: lines.length,
      col: (lines.at(-1)?.length ?? 0) + 1,
    };
  }, [code]);

  const statusCopy = useMemo(() => {
    if (!code.trim()) {
      return {
        pill: "Idle",
        footer: "Idle - waiting for source",
        tone: "neutral" as const,
      };
    }
    if (renderState === "rendering") {
      return {
        pill: "Rendering",
        footer: "Rendering preview...",
        tone: "blue" as const,
      };
    }
    if (renderState === "waiting") {
      return {
        pill: "Stale - rendering soon",
        footer: "Waiting for you to stop typing - auto-render in 400 ms",
        tone: "amber" as const,
      };
    }
    if (renderState === "error") {
      return {
        pill: "Render failed",
        footer: "Syntax error - fix the source or press Retry",
        tone: "red" as const,
      };
    }
    return {
      pill: renderMs ? `Rendered - ${renderMs} ms` : "Rendered",
      footer: renderMs
        ? `Rendered in ${renderMs} ms - Mermaid v11 - SVG sanitized`
        : "Rendered - Mermaid v11 - SVG sanitized",
      tone: "green" as const,
    };
  }, [code, renderMs, renderState]);

  useEffect(() => {
    window.localStorage.setItem("igram-theme", themeMode);
  }, [themeMode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (templateRef.current && !templateRef.current.contains(target)) {
        setShowTemplates(false);
      }
      if (exportRef.current && !exportRef.current.contains(target)) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const renderDiagram = useCallback(async () => {
    const source = code.trim();
    if (!source) {
      setSvgHtml("");
      setError("");
      setRenderMs(null);
      setRenderState("idle");
      return;
    }

    const currentId = renderId.current + 1;
    renderId.current = currentId;
    setRenderState("rendering");

    try {
      const startedAt = performance.now();
      mermaid.initialize({
        startOnLoad: false,
        theme: isDark ? "dark" : "default",
        suppressErrorRendering: true,
        securityLevel: "loose",
      });

      const { svg } = await mermaid.render(`mermaid-svg-${currentId}`, code);
      if (renderId.current !== currentId) return;

      setSvgHtml(svg);
      setError("");
      setRenderMs(Math.max(1, Math.round(performance.now() - startedAt)));
      setRenderState("rendered");
      setShowExportMenu(true);
    } catch (err) {
      if (renderId.current !== currentId) return;

      setError(getErrorMessage(err));
      setRenderMs(null);
      setRenderState("error");
    }
  }, [code, isDark]);

  useEffect(() => {
    if (!code.trim()) return;

    const debounceTimeout = window.setTimeout(() => {
      void renderDiagram();
    }, 400);

    return () => window.clearTimeout(debounceTimeout);
  }, [code, renderDiagram]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const usesModifier = event.metaKey || event.ctrlKey;
      if (!usesModifier) return;

      if (event.key === "Enter") {
        event.preventDefault();
        void renderDiagram();
      }

      if (event.key.toLowerCase() === "e") {
        event.preventDefault();
        setShowExportMenu((current) => !current);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [renderDiagram]);

  const handleEditorWillMount = (monaco: Monaco) => {
    try {
      initEditor(monaco);
    } catch (err) {
      console.error("Failed to initialize monaco-mermaid syntax:", err);
    }
  };

  const handleCodeChange = (value?: string) => {
    const nextCode = value || "";
    setCode(nextCode);
    setCopiedType(null);
    setError("");

    if (!nextCode.trim()) {
      setSvgHtml("");
      setRenderMs(null);
      setRenderState("idle");
    } else {
      setRenderState("waiting");
    }
  };

  const selectTemplate = (templateCode: string) => {
    setCode(templateCode);
    setError("");
    setRenderState("waiting");
    setShowTemplates(false);
    setZoom(DEFAULT_ZOOM);
  };

  const handleCopyCode = async () => {
    if (!code) return;

    await navigator.clipboard.writeText(code);
    setCopiedType("code");
    window.setTimeout(() => setCopiedType(null), 2000);
  };

  const handleCopySvg = async () => {
    if (!svgHtml) return;

    await navigator.clipboard.writeText(svgHtml);
    setCopiedType("svg");
    window.setTimeout(() => setCopiedType(null), 2000);
  };

  const handleDownloadSvg = () => {
    if (!svgHtml) return;
    downloadBlob(
      new Blob([svgHtml], { type: "image/svg+xml;charset=utf-8" }),
      "igram-diagram.svg",
    );
    setShowExportMenu(false);
  };

  const handleDownloadPng = () => {
    if (!svgHtml) return;

    const { width, height } = getSvgSize(svgHtml);
    const image = new window.Image();
    const url = URL.createObjectURL(
      new Blob([svgHtml], { type: "image/svg+xml;charset=utf-8" }),
    );

    image.onload = () => {
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(width * scale);
      canvas.height = Math.ceil(height * scale);

      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(url);
        return;
      }

      context.fillStyle = isDark ? "#111827" : "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.scale(scale, scale);
      context.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (!blob) return;
        downloadBlob(blob, "igram-diagram.png");
        setShowExportMenu(false);
      }, "image/png");
    };

    image.src = url;
  };

  const handleDownloadHtml = () => {
    if (!svgHtml) return;

    const html = `<!doctype html>
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
${svgHtml}
</body>
</html>`;

    downloadBlob(
      new Blob([html], { type: "text/html;charset=utf-8" }),
      "igram-diagram.html",
    );
    setShowExportMenu(false);
  };

  return (
    <div
      className={cn(
        "h-screen w-screen overflow-hidden font-sans",
        isDark
          ? "dark bg-slate-950 text-slate-100"
          : "bg-slate-100 text-slate-950",
      )}
    >
      <div className="flex h-full w-full flex-col overflow-hidden border-slate-200 bg-white shadow-2xl shadow-slate-950/10 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/30">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 overflow-hidden rounded-lg border border-slate-900/10 bg-slate-950 shadow-sm dark:border-white/10">
              <Image
                src="/iGram_logo.png"
                alt="iGram logo"
                width={40}
                height={40}
                priority
                className="size-full scale-[2.35] object-contain"
              />
            </span>
            <div className="flex min-w-0 items-center gap-3">
              <h1 className="truncate text-xl font-bold tracking-normal text-slate-950 dark:text-white">
                iGram
              </h1>
              <span className="hidden rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold tracking-wide text-blue-700 ring-1 ring-blue-100 sm:inline-flex dark:bg-blue-500/10 dark:text-blue-200 dark:ring-blue-400/20">
                PHASE 1
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 text-xs font-medium text-slate-500 md:flex dark:text-slate-400">
              <span>Ctrl+Enter Render</span>
              <span aria-hidden="true">-</span>
              <span>Ctrl+E Export</span>
              <span aria-hidden="true">-</span>
              <a
                href="https://mermaid.js.org/"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-300"
              >
                Docs
              </a>
            </div>
            <button
              type="button"
              onClick={() =>
                setThemeMode((current) =>
                  current === "dark" ? "light" : "dark",
                )
              }
              className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:translate-y-px dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              title={`Switch to ${isDark ? "light" : "dark"} mode`}
            >
              {isDark ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
              <span className="hidden sm:inline">
                {isDark ? "Light" : "Dark"}
              </span>
            </button>
          </div>
        </header>

        <div className="grid shrink-0 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 md:grid-cols-[minmax(360px,45%)_1fr]">
          <section className="flex min-h-14 items-center justify-between gap-3 border-b border-slate-200 px-4 dark:border-slate-800 md:border-b-0 md:border-r">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-14 items-end gap-5">
                <button
                  type="button"
                  className="relative h-12 px-1 text-sm font-bold text-slate-950 dark:text-white"
                >
                  Mermaid
                  {error && (
                    <span className="absolute right-[-9px] top-3 size-2 rounded-full bg-red-500" />
                  )}
                  <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-blue-600" />
                </button>
                <button
                  type="button"
                  disabled
                  className="h-12 px-1 text-sm font-semibold text-slate-500 opacity-80 dark:text-slate-400"
                  title="PlantUML rendering is not enabled in this build"
                >
                  PlantUML
                </button>
              </div>

              <div className="relative" ref={templateRef}>
                <button
                  type="button"
                  onClick={() => setShowTemplates((current) => !current)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Sparkles className="size-3.5 text-blue-600 dark:text-blue-300" />
                  <span className="hidden lg:inline">Starter</span>
                  <ChevronDown
                    className={cn(
                      "size-3.5 transition-transform",
                      showTemplates && "rotate-180",
                    )}
                  />
                </button>

                {showTemplates && (
                  <div className="absolute left-0 top-10 z-40 w-72 rounded-lg border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-950/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40">
                    {TEMPLATES.map((template) => (
                      <button
                        key={template.name}
                        type="button"
                        onClick={() => selectTemplate(template.code)}
                        className="block w-full rounded-md px-3 py-2 text-left transition hover:bg-blue-50 dark:hover:bg-slate-800"
                      >
                        <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {template.name}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">
                          {template.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span
                className={cn(
                  "hidden items-center gap-1.5 text-xs font-semibold md:inline-flex",
                  renderState === "waiting"
                    ? "text-amber-700 dark:text-amber-300"
                    : "text-emerald-700 dark:text-emerald-300",
                  renderState === "idle" &&
                    "text-slate-500 dark:text-slate-400",
                  renderState === "error" && "text-red-600 dark:text-red-300",
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    renderState === "waiting" && "bg-amber-500",
                    renderState === "rendering" && "bg-blue-500",
                    renderState === "rendered" && "bg-emerald-500",
                    renderState === "idle" && "bg-slate-400",
                    renderState === "error" && "bg-red-500",
                  )}
                />
                {renderState === "waiting" ? "Unsaved edits" : "Draft saved"}
              </span>
              <button
                type="button"
                onClick={() => void handleCopyCode()}
                disabled={!code}
                className="inline-flex size-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                title="Copy source"
              >
                {copiedType === "code" ? (
                  <Check className="size-4 text-emerald-600" />
                ) : (
                  <Copy className="size-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => void renderDiagram()}
                disabled={!code.trim() || renderState === "rendering"}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-bold shadow-sm transition active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
                  renderState === "waiting"
                    ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
                    : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
                )}
              >
                {renderState === "rendering" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : error ? (
                  <RotateCcw className="size-4" />
                ) : null}
                {error
                  ? "Retry"
                  : renderState === "waiting"
                    ? "Render now"
                    : "Render"}
              </button>
            </div>
          </section>

          <section className="flex min-h-14 items-center justify-between gap-3 px-4">
            <StatusPill tone={statusCopy.tone} label={statusCopy.pill} />

            <div className="flex shrink-0 items-center gap-2">
              <div className="hidden items-center rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:flex">
                <button
                  type="button"
                  onClick={() =>
                    setZoom((current) => Math.max(0.5, current - 0.1))
                  }
                  className="flex size-8 items-center justify-center text-slate-700 transition hover:bg-slate-50 active:translate-y-px dark:text-slate-200 dark:hover:bg-slate-800"
                  title="Zoom out"
                >
                  <ZoomOut className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(DEFAULT_ZOOM)}
                  className="h-8 min-w-16 border-x border-slate-200 px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  title="Reset zoom"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setZoom((current) => Math.min(2.5, current + 0.1))
                  }
                  className="flex size-8 items-center justify-center border-r border-slate-200 text-slate-700 transition hover:bg-slate-50 active:translate-y-px dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  title="Zoom in"
                >
                  <ZoomIn className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(DEFAULT_ZOOM)}
                  className="h-8 px-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                  Fit
                </button>
              </div>

              <div className="relative" ref={exportRef}>
                <button
                  type="button"
                  onClick={() => setShowExportMenu((current) => !current)}
                  disabled={!svgHtml}
                  className={cn(
                    "inline-flex h-9 items-center gap-2 rounded-md px-4 text-sm font-bold shadow-sm transition active:translate-y-px disabled:pointer-events-none disabled:bg-slate-300 disabled:text-white dark:disabled:bg-slate-700",
                    canExport
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-slate-400 text-white",
                  )}
                  title={
                    canExport
                      ? "Open export menu"
                      : "Exports are enabled after a valid render"
                  }
                >
                  <Download className="size-4 sm:hidden" />
                  <span className="hidden sm:inline">Export</span>
                  <ChevronDown className="size-3.5" />
                </button>

                {showExportMenu && canExport && (
                  <div className="absolute right-0 top-11 z-40 w-72 rounded-lg border border-slate-200 bg-white p-2 shadow-xl shadow-slate-950/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40">
                    <ExportMenuItem
                      label="SVG"
                      desc="Vector - documents and editing"
                      onClick={handleDownloadSvg}
                    />
                    <ExportMenuItem
                      label="PNG"
                      desc="Raster at 2x - slides and sharing"
                      onClick={handleDownloadPng}
                    />
                    <ExportMenuItem
                      label="Standalone HTML"
                      desc="Self-contained sanitized page"
                      onClick={handleDownloadHtml}
                    />
                    <div className="mt-1 border-t border-slate-100 pt-1 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={handleCopySvg}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        {copiedType === "svg" ? (
                          <Check className="size-4 text-emerald-600" />
                        ) : (
                          <FileCode2 className="size-4" />
                        )}
                        {copiedType === "svg" ? "Copied SVG" : "Copy SVG"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        <main className="grid min-h-0 flex-1 overflow-hidden md:grid-cols-[minmax(360px,45%)_1fr]">
          <section className="flex min-h-0 flex-col border-b border-slate-200 bg-[#181b22] dark:border-slate-800 md:border-b-0 md:border-r">
            <div className="flex-1 overflow-hidden">
              <Editor
                height="100%"
                defaultLanguage="mermaid"
                theme="mermaid-dark"
                value={code}
                onChange={handleCodeChange}
                beforeMount={handleEditorWillMount}
                options={{
                  minimap: { enabled: false },
                  fontSize: 15,
                  fontFamily:
                    "JetBrains Mono, Fira Code, source-code-pro, Menlo, Monaco, Consolas, Courier New, monospace",
                  automaticLayout: true,
                  padding: { top: 22, bottom: 22 },
                  cursorBlinking: "smooth",
                  cursorSmoothCaretAnimation: "on",
                  lineNumbersMinChars: 3,
                  lineHeight: 24,
                  wordWrap: "on",
                  scrollBeyondLastLine: false,
                }}
              />
            </div>

            {error && (
              <div className="border-t border-red-500/30 bg-red-950/35 px-5 py-4 text-red-100">
                <div className="flex items-center gap-2 text-sm font-bold text-red-100">
                  <span className="flex size-6 items-center justify-center rounded-full bg-red-500 text-white">
                    <AlertCircle className="size-4" />
                  </span>
                  Syntax error
                </div>
                <p className="mt-2 max-h-24 overflow-auto whitespace-pre-wrap pl-8 font-mono text-xs leading-5 text-red-100/85">
                  {error}
                </p>
              </div>
            )}
          </section>

          <section
            className="relative min-h-0 overflow-auto bg-white dark:bg-slate-900"
            style={{
              backgroundImage: isDark
                ? "radial-gradient(circle, rgba(148, 163, 184, 0.22) 1.5px, transparent 1.5px)"
                : "radial-gradient(circle, rgba(100, 116, 139, 0.18) 1.5px, transparent 1.5px)",
              backgroundSize: "24px 24px",
            }}
          >
            {renderState === "error" && svgHtml && (
              <div className="pointer-events-none absolute left-6 top-6 z-10 inline-flex rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                Showing last valid render
              </div>
            )}

            {svgHtml ? (
              <div className="flex min-h-full min-w-full items-center justify-center p-10">
                <div
                  className={cn(
                    "origin-center transition-transform duration-200 [&_svg]:max-w-none",
                    renderState === "error" && "opacity-50",
                  )}
                  style={{
                    transform: `scale(${zoom})`,
                  }}
                  dangerouslySetInnerHTML={{ __html: svgHtml }}
                />
              </div>
            ) : (
              <div className="flex min-h-full items-center justify-center p-8">
                <div className="max-w-lg text-center">
                  <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-200">
                    <FileCode2 className="size-7" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Nothing to preview yet
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Paste diagram source in the editor, or start from a working
                    example to see how iGram renders it.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => selectTemplate(TEMPLATES[0].code)}
                      className="h-10 rounded-md bg-blue-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 active:translate-y-px"
                    >
                      Insert Mermaid starter
                    </button>
                    <button
                      type="button"
                      disabled
                      className="h-10 rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                    >
                      PlantUML starter
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </main>

        <footer
          className={cn(
            "grid h-9 shrink-0 grid-cols-[1fr_auto] items-center gap-4 border-t border-slate-200 bg-white px-5 text-xs font-medium dark:border-slate-800 dark:bg-slate-950",
            statusCopy.tone === "red"
              ? "text-red-600 dark:text-red-300"
              : statusCopy.tone === "amber"
                ? "text-amber-700 dark:text-amber-300"
                : "text-slate-500 dark:text-slate-400",
          )}
        >
          <span className="truncate">{statusCopy.footer}</span>
          <span className="hidden font-mono sm:block">
            Ln {lineStats.line}, Col {lineStats.col} -{" "}
            {code.trim() ? "Draft saved locally" : "No draft yet"}
          </span>
        </footer>
      </div>
    </div>
  );
}

function StatusPill({
  tone,
  label,
}: {
  tone: "neutral" | "blue" | "green" | "amber" | "red";
  label: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm font-bold",
        tone === "neutral" &&
          "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
        tone === "blue" &&
          "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-200",
        tone === "green" &&
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-200",
        tone === "amber" &&
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200",
        tone === "red" &&
          "border-red-200 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-200",
      )}
    >
      {tone === "blue" ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <span
          className={cn(
            "size-1.5 rounded-full",
            tone === "neutral" && "bg-slate-400",
            tone === "green" && "bg-emerald-600",
            tone === "amber" && "bg-amber-600",
            tone === "red" && "bg-red-600",
          )}
        />
      )}
      {label}
    </span>
  );
}

function ExportMenuItem({
  label,
  desc,
  onClick,
}: {
  label: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full rounded-md px-3 py-2.5 text-left transition hover:bg-blue-50 dark:hover:bg-slate-800"
    >
      <span className="block text-sm font-bold text-slate-900 dark:text-slate-100">
        {label}
      </span>
      <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
        {desc}
      </span>
    </button>
  );
}
