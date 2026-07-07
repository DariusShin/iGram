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
  ShieldAlert,
  Sparkles,
  Sun,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import {
  PlantUmlClientError,
  renderPlantUmlPreview,
} from "@/features/rendering/plantuml-client";
import {
  applyPlantUmlTheme,
  getPlantUmlThemeFromSource,
  PLANTUML_THEME_NONE,
  PLANTUML_THEMES,
  type PlantUmlTheme,
} from "@/features/rendering/plantuml-theme";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type ThemeMode = "light" | "dark";
type DiagramLanguage = "mermaid" | "plantuml";
type RenderState = "idle" | "waiting" | "rendering" | "rendered" | "error";
type CopiedType = "code" | "svg" | null;

interface Template {
  name: string;
  desc: string;
  code: string;
}

interface MermaidPreview {
  language: "mermaid";
  source: string;
  svgHtml: string;
  renderMs: number;
}

interface PlantUmlPreview {
  language: "plantuml";
  source: string;
  objectUrl: string;
  svgText?: string;
  blob: Blob;
  contentType: "image/svg+xml" | "image/png";
  renderMs: number;
}

type PreviewResult = MermaidPreview | PlantUmlPreview;
type Drafts = Record<DiagramLanguage, string>;
type RenderStates = Record<DiagramLanguage, RenderState>;
type RenderErrors = Record<DiagramLanguage, string>;
type RenderResults = Partial<Record<DiagramLanguage, PreviewResult>>;

const DEFAULT_ZOOM = 1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const DRAFT_STORAGE_KEY = "igram-diagram-drafts-v1";

const MERMAID_TEMPLATES: Template[] = [
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
];

const PLANTUML_TEMPLATES: Template[] = [
  {
    name: "PlantUML Sequence",
    desc: "Client, API, and public server flow",
    code: `@startuml
title iGram PlantUML render flow
actor User
participant "iGram Workspace" as UI
participant "POST /api/plantuml/render" as API
participant "PlantUML Public Server" as PUML

User -> UI: Edit PlantUML source
UI -> API: Render request
API -> PUML: Encoded source
PUML --> API: SVG image
API --> UI: Validated SVG
UI --> User: Preview decoded image
@enduml`,
  },
  {
    name: "Component Diagram",
    desc: "Workspace and render boundary",
    code: `@startuml
skinparam componentStyle rectangle
component "Browser Workspace" as Browser
component "Next.js Route Handler" as Route
cloud "Official PlantUML\\nPublic Server" as PlantUML

Browser --> Route : source + format
Route --> PlantUML : encoded request
PlantUML --> Route : rendered media
Route --> Browser : validated image
@enduml`,
  },
];

const DEFAULT_DRAFTS: Drafts = {
  mermaid: MERMAID_TEMPLATES[0].code,
  plantuml: PLANTUML_TEMPLATES[0].code,
};

function getErrorMessage(err: unknown): string {
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

function loadDrafts(): Drafts {
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

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getSvgSize(svgHtml: string): { width: number; height: number } {
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

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

function revokePlantUmlResult(result: PreviewResult | undefined): void {
  if (result?.language === "plantuml") {
    URL.revokeObjectURL(result.objectUrl);
  }
}

export default function DiagramWorkspace() {
  const [activeLanguage, setActiveLanguage] =
    useState<DiagramLanguage>("mermaid");
  const [drafts, setDrafts] = useState<Drafts>(() => loadDrafts());
  const [results, setResults] = useState<RenderResults>({});
  const [renderStates, setRenderStates] = useState<RenderStates>({
    mermaid: "waiting",
    plantuml: "idle",
  });
  const [errors, setErrors] = useState<RenderErrors>({
    mermaid: "",
    plantuml: "",
  });
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
  const mermaidRenderId = useRef(0);
  const plantUmlRenderId = useRef(0);
  const plantUmlAbortController = useRef<AbortController | null>(null);
  const resultsRef = useRef<RenderResults>(results);

  const isDark = themeMode === "dark";
  const code = drafts[activeLanguage];
  const activeResult = results[activeLanguage];
  const activeRenderState = renderStates[activeLanguage];
  const activeError = errors[activeLanguage];
  const activeTemplates =
    activeLanguage === "mermaid" ? MERMAID_TEMPLATES : PLANTUML_TEMPLATES;
  const selectedPlantUmlTheme = useMemo(
    () => getPlantUmlThemeFromSource(drafts.plantuml),
    [drafts.plantuml],
  );
  const isStale = Boolean(activeResult && activeResult.source !== code);
  const isPlantUmlLoading =
    activeLanguage === "plantuml" && activeRenderState === "rendering";
  const canExport = Boolean(
    activeResult &&
    activeResult.source === code &&
    activeRenderState === "rendered" &&
    !activeError &&
    !isPlantUmlLoading,
  );

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

    if (activeRenderState === "rendering") {
      return {
        pill: "Rendering",
        footer:
          activeLanguage === "plantuml"
            ? "Rendering with PlantUML public server..."
            : "Rendering preview...",
        tone: "blue" as const,
      };
    }

    if (activeRenderState === "waiting" || isStale) {
      return {
        pill: "Stale - rendering soon",
        footer: "Waiting for you to stop typing - auto-render in 500 ms",
        tone: "amber" as const,
      };
    }

    if (activeRenderState === "error") {
      return {
        pill: "Render failed",
        footer:
          activeLanguage === "plantuml"
            ? "PlantUML render failed - press Retry"
            : "Syntax error - fix the source or press Retry",
        tone: "red" as const,
      };
    }

    const renderMs = activeResult?.renderMs;
    return {
      pill: renderMs ? `Rendered - ${renderMs} ms` : "Rendered",
      footer: renderMs
        ? `Rendered in ${renderMs} ms - ${activeLanguage === "plantuml" ? "PlantUML" : "Mermaid"}`
        : "Rendered",
      tone: "green" as const,
    };
  }, [activeLanguage, activeRenderState, activeResult, code, isStale]);

  useEffect(() => {
    resultsRef.current = results;
  }, [results]);

  useEffect(() => {
    window.localStorage.setItem("igram-theme", themeMode);
  }, [themeMode]);

  useEffect(() => {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
  }, [drafts]);

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

  useEffect(() => {
    return () => {
      revokePlantUmlResult(resultsRef.current.plantuml);
      plantUmlAbortController.current?.abort();
    };
  }, []);

  const updateResult = useCallback(
    (language: DiagramLanguage, result: PreviewResult): void => {
      setResults((current) => {
        if (language === "plantuml") {
          revokePlantUmlResult(current.plantuml);
        }

        return {
          ...current,
          [language]: result,
        };
      });
    },
    [],
  );

  const renderMermaidDiagram = useCallback(
    async (source: string): Promise<void> => {
      const currentId = mermaidRenderId.current + 1;
      mermaidRenderId.current = currentId;
      const startedAt = performance.now();

      setRenderStates((current) => ({ ...current, mermaid: "rendering" }));
      setErrors((current) => ({ ...current, mermaid: "" }));

      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? "dark" : "default",
          suppressErrorRendering: true,
          securityLevel: "strict",
        });

        const { svg } = await mermaid.render(
          `mermaid-svg-${currentId}`,
          source,
        );
        if (mermaidRenderId.current !== currentId) return;

        updateResult("mermaid", {
          language: "mermaid",
          source,
          svgHtml: svg,
          renderMs: Math.max(1, Math.round(performance.now() - startedAt)),
        });
        setRenderStates((current) => ({ ...current, mermaid: "rendered" }));
        setShowExportMenu(true);
      } catch (err) {
        if (mermaidRenderId.current !== currentId) return;

        setErrors((current) => ({ ...current, mermaid: getErrorMessage(err) }));
        setRenderStates((current) => ({ ...current, mermaid: "error" }));
      }
    },
    [isDark, updateResult],
  );

  const renderPlantUmlDiagram = useCallback(
    async (source: string): Promise<void> => {
      plantUmlAbortController.current?.abort();

      const currentId = plantUmlRenderId.current + 1;
      plantUmlRenderId.current = currentId;
      const controller = new AbortController();
      plantUmlAbortController.current = controller;
      const startedAt = performance.now();

      setRenderStates((current) => ({ ...current, plantuml: "rendering" }));
      setErrors((current) => ({ ...current, plantuml: "" }));

      try {
        const preview = await renderPlantUmlPreview({
          source,
          format: "svg",
          signal: controller.signal,
        });

        if (plantUmlRenderId.current !== currentId) {
          URL.revokeObjectURL(preview.objectUrl);
          return;
        }

        updateResult("plantuml", {
          language: "plantuml",
          source,
          objectUrl: preview.objectUrl,
          blob: preview.blob,
          contentType: preview.contentType,
          svgText: preview.svgText,
          renderMs: Math.max(1, Math.round(performance.now() - startedAt)),
        });
        setRenderStates((current) => ({ ...current, plantuml: "rendered" }));
        setShowExportMenu(true);
      } catch (err) {
        if (plantUmlRenderId.current !== currentId) return;

        setErrors((current) => ({
          ...current,
          plantuml: getErrorMessage(err),
        }));
        setRenderStates((current) => ({ ...current, plantuml: "error" }));
      } finally {
        if (plantUmlRenderId.current === currentId) {
          plantUmlAbortController.current = null;
        }
      }
    },
    [updateResult],
  );

  const renderActiveDiagram = useCallback(
    async (
      language: DiagramLanguage = activeLanguage,
      source: string = drafts[activeLanguage],
    ): Promise<void> => {
      if (!source.trim()) {
        setRenderStates((current) => ({ ...current, [language]: "idle" }));
        setErrors((current) => ({ ...current, [language]: "" }));
        return;
      }

      if (language === "mermaid") {
        await renderMermaidDiagram(source);
      } else {
        await renderPlantUmlDiagram(source);
      }
    },
    [activeLanguage, drafts, renderMermaidDiagram, renderPlantUmlDiagram],
  );

  useEffect(() => {
    if (!code.trim()) return;
    if (activeResult?.source === code && activeRenderState === "rendered") {
      return;
    }

    const debounceTimeout = window.setTimeout(() => {
      void renderActiveDiagram(activeLanguage, code);
    }, 500);

    return () => window.clearTimeout(debounceTimeout);
  }, [
    activeLanguage,
    activeRenderState,
    activeResult?.source,
    code,
    renderActiveDiagram,
  ]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const usesModifier = event.metaKey || event.ctrlKey;
      if (!usesModifier) return;

      if (event.key === "Enter") {
        event.preventDefault();
        void renderActiveDiagram(activeLanguage, code);
      }

      if (event.key.toLowerCase() === "e") {
        event.preventDefault();
        setShowExportMenu((current) => !current);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeLanguage, code, renderActiveDiagram]);

  const handleEditorWillMount = (monaco: Monaco) => {
    try {
      initEditor(monaco);
    } catch (err) {
      console.error("Failed to initialize monaco-mermaid syntax:", err);
    }
  };

  const handleCodeChange = (value?: string) => {
    const nextCode = value || "";

    setDrafts((current) => ({
      ...current,
      [activeLanguage]: nextCode,
    }));
    setCopiedType(null);
    setErrors((current) => ({ ...current, [activeLanguage]: "" }));

    setRenderStates((current) => ({
      ...current,
      [activeLanguage]: nextCode.trim() ? "waiting" : "idle",
    }));
  };

  const selectTemplate = (templateCode: string) => {
    setDrafts((current) => ({
      ...current,
      [activeLanguage]: templateCode,
    }));
    setErrors((current) => ({ ...current, [activeLanguage]: "" }));
    setRenderStates((current) => ({ ...current, [activeLanguage]: "waiting" }));
    setShowTemplates(false);
    setZoom(DEFAULT_ZOOM);
  };

  const handlePlantUmlThemeChange = useCallback(
    (theme: PlantUmlTheme) => {
      const nextCode = applyPlantUmlTheme(drafts.plantuml, theme);

      setDrafts((current) => ({
        ...current,
        plantuml: nextCode,
      }));
      setCopiedType(null);
      setErrors((current) => ({ ...current, plantuml: "" }));
      setRenderStates((current) => ({
        ...current,
        plantuml: nextCode.trim() ? "waiting" : "idle",
      }));
    },
    [drafts.plantuml],
  );

  const switchLanguage = (language: DiagramLanguage) => {
    setActiveLanguage(language);
    setCopiedType(null);
    setShowTemplates(false);
    setShowExportMenu(true);

    const nextCode = drafts[language];
    if (!nextCode.trim()) {
      setRenderStates((current) => ({ ...current, [language]: "idle" }));
    } else if (results[language]?.source !== nextCode) {
      setRenderStates((current) => ({ ...current, [language]: "waiting" }));
    }
  };

  const handleCopyCode = async () => {
    if (!code) return;

    await navigator.clipboard.writeText(code);
    setCopiedType("code");
    window.setTimeout(() => setCopiedType(null), 2000);
  };

  const getCurrentSvgText = async (): Promise<string> => {
    if (!activeResult) return "";
    if (activeResult.language === "mermaid") return activeResult.svgHtml;
    if (activeResult.svgText) return activeResult.svgText;
    if (activeResult.contentType === "image/svg+xml") {
      return activeResult.blob.text();
    }
    return "";
  };

  const handleCopySvg = async () => {
    const svgText = await getCurrentSvgText();
    if (!svgText) return;

    await navigator.clipboard.writeText(svgText);
    setCopiedType("svg");
    window.setTimeout(() => setCopiedType(null), 2000);
  };

  const handleDownloadSvg = async () => {
    const svgText = await getCurrentSvgText();
    if (!svgText) return;

    downloadBlob(
      new Blob([svgText], { type: "image/svg+xml;charset=utf-8" }),
      "igram-diagram.svg",
    );
    setShowExportMenu(false);
  };

  const handleDownloadPng = async () => {
    if (!activeResult) return;

    if (
      activeResult.language === "plantuml" &&
      activeResult.contentType === "image/png"
    ) {
      downloadBlob(activeResult.blob, "igram-diagram.png");
      setShowExportMenu(false);
      return;
    }

    const svgText = await getCurrentSvgText();
    if (!svgText) return;

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

    image.onerror = () => URL.revokeObjectURL(url);
    image.src = url;
  };

  const handleDownloadHtml = async () => {
    const svgText = await getCurrentSvgText();
    if (!svgText) return;

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
${svgText}
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
        <div className="sr-only" aria-live="polite">
          {statusCopy.footer}
        </div>

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
              <div
                className="flex h-14 items-end gap-5"
                role="tablist"
                aria-label="Diagram language"
              >
                <LanguageTab
                  language="mermaid"
                  activeLanguage={activeLanguage}
                  hasError={Boolean(errors.mermaid)}
                  onClick={switchLanguage}
                />
                <LanguageTab
                  language="plantuml"
                  activeLanguage={activeLanguage}
                  hasError={Boolean(errors.plantuml)}
                  onClick={switchLanguage}
                />
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
                    {activeTemplates.map((template) => (
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

              {activeLanguage === "plantuml" && (
                <PlantUmlThemeSelect
                  value={selectedPlantUmlTheme}
                  onValueChange={handlePlantUmlThemeChange}
                />
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span
                className={cn(
                  "hidden items-center gap-1.5 text-xs font-semibold md:inline-flex",
                  activeRenderState === "waiting" || isStale
                    ? "text-amber-700 dark:text-amber-300"
                    : "text-emerald-700 dark:text-emerald-300",
                  activeRenderState === "idle" &&
                    "text-slate-500 dark:text-slate-400",
                  activeRenderState === "error" &&
                    "text-red-600 dark:text-red-300",
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    (activeRenderState === "waiting" || isStale) &&
                      "bg-amber-500",
                    activeRenderState === "rendering" && "bg-blue-500",
                    activeRenderState === "rendered" &&
                      !isStale &&
                      "bg-emerald-500",
                    activeRenderState === "idle" && "bg-slate-400",
                    activeRenderState === "error" && "bg-red-500",
                  )}
                />
                {activeRenderState === "waiting" || isStale
                  ? "Unsaved edits"
                  : "Draft saved"}
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
                onClick={() => void renderActiveDiagram(activeLanguage, code)}
                disabled={!code.trim() || activeRenderState === "rendering"}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-bold shadow-sm transition active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
                  activeRenderState === "waiting" || isStale
                    ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
                    : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
                )}
              >
                {activeRenderState === "rendering" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : activeError ? (
                  <RotateCcw className="size-4" />
                ) : null}
                {activeError
                  ? "Retry"
                  : activeRenderState === "waiting" || isStale
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
                  onClick={() => setZoom((current) => clampZoom(current - 0.1))}
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
                  onClick={() => setZoom((current) => clampZoom(current + 0.1))}
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
                  disabled={!activeResult}
                  className={cn(
                    "inline-flex h-9 items-center gap-2 rounded-md px-4 text-sm font-bold shadow-sm transition active:translate-y-px disabled:pointer-events-none disabled:bg-slate-300 disabled:text-white dark:disabled:bg-slate-700",
                    canExport
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-slate-400 text-white",
                  )}
                  title={
                    canExport
                      ? "Open export menu"
                      : "Exports are enabled after the latest valid render"
                  }
                >
                  <Download className="size-4 sm:hidden" />
                  <span className="hidden sm:inline">Export</span>
                  <ChevronDown className="size-3.5" />
                </button>

                {showExportMenu && activeResult && (
                  <div className="absolute right-0 top-11 z-40 w-72 rounded-lg border border-slate-200 bg-white p-2 shadow-xl shadow-slate-950/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40">
                    {!canExport && (
                      <div className="mb-1 rounded-md bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">
                        Exports are disabled until the latest preview is ready.
                      </div>
                    )}
                    <ExportMenuItem
                      label="SVG"
                      desc="Vector - documents and editing"
                      disabled={!canExport}
                      onClick={() => void handleDownloadSvg()}
                    />
                    <ExportMenuItem
                      label="PNG"
                      desc="Raster at 2x - slides and sharing"
                      disabled={!canExport}
                      onClick={() => void handleDownloadPng()}
                    />
                    <ExportMenuItem
                      label="Standalone HTML"
                      desc="Self-contained sanitized page"
                      disabled={!canExport}
                      onClick={() => void handleDownloadHtml()}
                    />
                    <div className="mt-1 border-t border-slate-100 pt-1 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => void handleCopySvg()}
                        disabled={!canExport}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-45 dark:text-slate-200 dark:hover:bg-slate-800"
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
                key={activeLanguage}
                height="100%"
                defaultLanguage={
                  activeLanguage === "mermaid" ? "mermaid" : "text"
                }
                language={activeLanguage === "mermaid" ? "mermaid" : "text"}
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

            {activeLanguage === "plantuml" && (
              <div className="border-t border-blue-400/20 bg-blue-950/30 px-5 py-3 text-xs leading-5 text-blue-50/85">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="mt-0.5 size-4 shrink-0 text-blue-200" />
                  <p>
                    PlantUML source is sent through this app to the official
                    public PlantUML server. Do not submit confidential diagrams
                    during Phase 1.
                  </p>
                </div>
              </div>
            )}

            {activeError && (
              <div className="border-t border-red-500/30 bg-red-950/35 px-5 py-4 text-red-100">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-red-100">
                    <span className="flex size-6 items-center justify-center rounded-full bg-red-500 text-white">
                      <AlertCircle className="size-4" />
                    </span>
                    Render error
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      void renderActiveDiagram(activeLanguage, code)
                    }
                    className="rounded-md border border-red-200/30 px-2.5 py-1 text-xs font-bold text-red-50 transition hover:bg-red-500/20"
                  >
                    Retry
                  </button>
                </div>
                <p className="mt-2 max-h-24 overflow-auto whitespace-pre-wrap pl-8 font-mono text-xs leading-5 text-red-100/85">
                  {activeError}
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
            {activeResult && (isStale || activeRenderState === "error") && (
              <div className="pointer-events-none absolute left-6 top-6 z-10 inline-flex rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                Showing previous valid render
              </div>
            )}

            {activeResult ? (
              <div className="flex min-h-full min-w-full items-center justify-center p-10">
                <PreviewMedia
                  result={activeResult}
                  stale={isStale || activeRenderState === "error"}
                  zoom={zoom}
                />
              </div>
            ) : activeRenderState === "rendering" ? (
              <CenteredLoading language={activeLanguage} />
            ) : (
              <EmptyPreview
                language={activeLanguage}
                onInsert={() => selectTemplate(activeTemplates[0].code)}
                onRetry={
                  activeError
                    ? () => void renderActiveDiagram(activeLanguage, code)
                    : undefined
                }
              />
            )}

            {activeResult && activeRenderState === "rendering" && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/55 backdrop-blur-[1px] dark:bg-slate-950/45">
                <div className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-bold text-blue-700 shadow-lg dark:border-blue-400/30 dark:bg-slate-900 dark:text-blue-200">
                  <Loader2 className="size-4 animate-spin" />
                  {activeLanguage === "plantuml"
                    ? "Rendering with PlantUML public server..."
                    : "Rendering preview..."}
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

function PlantUmlThemeSelect({
  value,
  onValueChange,
}: {
  value: PlantUmlTheme;
  onValueChange: (theme: PlantUmlTheme) => void;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="hidden text-xs font-bold text-slate-500 dark:text-slate-400 xl:inline">
        Theme
      </span>
      <Select<PlantUmlTheme>
        value={value}
        onValueChange={(nextTheme) =>
          onValueChange(nextTheme ?? PLANTUML_THEME_NONE)
        }
      >
        <SelectTrigger className="w-36 sm:w-44 lg:w-52" title="PlantUML theme">
          <SelectValue>
            {(theme: PlantUmlTheme | null) => theme ?? PLANTUML_THEME_NONE}
          </SelectValue>
        </SelectTrigger>
        <SelectContent sideOffset={8}>
          {PLANTUML_THEMES.map((theme) => (
            <SelectItem key={theme} value={theme} label={theme}>
              {theme}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function LanguageTab({
  language,
  activeLanguage,
  hasError,
  onClick,
}: {
  language: DiagramLanguage;
  activeLanguage: DiagramLanguage;
  hasError: boolean;
  onClick: (language: DiagramLanguage) => void;
}) {
  const active = language === activeLanguage;
  const label = language === "mermaid" ? "Mermaid" : "PlantUML";

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => onClick(language)}
      className={cn(
        "relative h-12 px-1 text-sm font-bold",
        active
          ? "text-slate-950 dark:text-white"
          : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
      )}
    >
      {label}
      {hasError && (
        <span className="absolute right-[-9px] top-3 size-2 rounded-full bg-red-500" />
      )}
      {active && (
        <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-blue-600" />
      )}
    </button>
  );
}

function PreviewMedia({
  result,
  stale,
  zoom,
}: {
  result: PreviewResult;
  stale: boolean;
  zoom: number;
}) {
  return (
    <div
      className={cn(
        "origin-center transition-transform duration-200",
        result.language === "mermaid" && "[&_svg]:max-w-none",
        stale && "opacity-45",
      )}
      style={{ transform: `scale(${zoom})` }}
    >
      {result.language === "mermaid" ? (
        <div dangerouslySetInnerHTML={{ __html: result.svgHtml }} />
      ) : (
        // Blob URLs returned by the render lifecycle are already decoded before display.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={result.objectUrl}
          alt="Rendered PlantUML diagram"
          className="max-w-none"
        />
      )}
    </div>
  );
}

function CenteredLoading({ language }: { language: DiagramLanguage }) {
  return (
    <div className="flex min-h-full items-center justify-center p-8">
      <div className="inline-flex items-center gap-3 rounded-lg border border-blue-200 bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-sm dark:border-blue-400/30 dark:bg-slate-900 dark:text-blue-200">
        <Loader2 className="size-5 animate-spin" />
        {language === "plantuml"
          ? "Rendering with PlantUML public server..."
          : "Rendering preview..."}
      </div>
    </div>
  );
}

function EmptyPreview({
  language,
  onInsert,
  onRetry,
}: {
  language: DiagramLanguage;
  onInsert: () => void;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-full items-center justify-center p-8">
      <div className="max-w-lg text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-200">
          <FileCode2 className="size-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Nothing to preview yet
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
          Paste diagram source in the editor, or start from a working example to
          see how iGram renders it.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={onInsert}
            className="h-10 rounded-md bg-blue-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 active:translate-y-px"
          >
            Insert {language === "mermaid" ? "Mermaid" : "PlantUML"} starter
          </button>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="h-10 rounded-md border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Retry
            </button>
          )}
        </div>
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
  disabled,
  onClick,
}: {
  label: string;
  desc: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="block w-full rounded-md px-3 py-2.5 text-left transition hover:bg-blue-50 disabled:pointer-events-none disabled:opacity-45 dark:hover:bg-slate-800"
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
