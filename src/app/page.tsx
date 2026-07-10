"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import mermaid from "mermaid";

import { renderPlantUmlPreview } from "@/features/rendering/plantuml-client";
import {
  applyPlantUmlTheme,
  getPlantUmlThemeFromSource,
  type PlantUmlTheme,
} from "@/features/rendering/plantuml-theme";
import { EditorPanel } from "@/features/workspace/components/editor-panel";
import { EditorToolbar } from "@/features/workspace/components/editor-toolbar";
import { PreviewPanel } from "@/features/workspace/components/preview-panel";
import { PreviewToolbar } from "@/features/workspace/components/preview-toolbar";
import { WorkspaceFooter } from "@/features/workspace/components/workspace-footer";
import { WorkspaceHeader } from "@/features/workspace/components/workspace-header";
import {
  DEFAULT_DRAFTS,
  DRAFT_STORAGE_KEY,
  MERMAID_TEMPLATES,
  PLANTUML_TEMPLATES,
  THEME_STORAGE_KEY,
} from "@/features/workspace/constants";
import { useCanvasViewport } from "@/features/workspace/use-canvas-viewport";
import type {
  CopiedType,
  DiagramLanguage,
  Drafts,
  PreviewResult,
  RenderErrors,
  RenderResults,
  RenderStates,
  StatusTone,
  ThemeMode,
} from "@/features/workspace/types";
import {
  buildStandaloneHtml,
  downloadBlob,
  getErrorMessage,
  getSvgTextFromResult,
  loadDrafts,
  loadThemeMode,
  rasterizeSvgToPng,
  revokePlantUmlResult,
} from "@/app/helper";
import { cn } from "@/lib/utils";

export default function DiagramWorkspace() {
  const [activeLanguage, setActiveLanguage] =
    useState<DiagramLanguage>("mermaid");
  // Start from SSR-safe defaults so the server and first client render match,
  // then hydrate from localStorage in an effect after mount.
  const [hydrated, setHydrated] = useState(false);
  const [drafts, setDrafts] = useState<Drafts>(DEFAULT_DRAFTS);
  const [results, setResults] = useState<RenderResults>({});
  const [renderStates, setRenderStates] = useState<RenderStates>({
    mermaid: "waiting",
    plantuml: "idle",
  });
  const [errors, setErrors] = useState<RenderErrors>({
    mermaid: "",
    plantuml: "",
  });
  const viewport = useCanvasViewport();
  const [copiedType, setCopiedType] = useState<CopiedType>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(true);
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");

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

  const statusCopy = useMemo((): {
    pill: string;
    footer: string;
    tone: StatusTone;
  } => {
    if (!code.trim()) {
      return {
        pill: "Idle",
        footer: "Idle - waiting for source",
        tone: "neutral",
      };
    }

    if (activeRenderState === "rendering") {
      return {
        pill: "Rendering",
        footer:
          activeLanguage === "plantuml"
            ? "Rendering with PlantUML public server..."
            : "Rendering preview...",
        tone: "blue",
      };
    }

    if (activeRenderState === "waiting" || isStale) {
      return {
        pill: "Stale - rendering soon",
        footer: "Waiting for you to stop typing - auto-render in 500 ms",
        tone: "amber",
      };
    }

    if (activeRenderState === "error") {
      return {
        pill: "Render failed",
        footer:
          activeLanguage === "plantuml"
            ? "PlantUML render failed - press Retry"
            : "Syntax error - fix the source or press Retry",
        tone: "red",
      };
    }

    const renderMs = activeResult?.renderMs;
    return {
      pill: renderMs ? `Rendered - ${renderMs} ms` : "Rendered",
      footer: renderMs
        ? `Rendered in ${renderMs} ms - ${activeLanguage === "plantuml" ? "PlantUML" : "Mermaid"}`
        : "Rendered",
      tone: "green",
    };
  }, [activeLanguage, activeRenderState, activeResult, code, isStale]);

  // Mount: hydrate persisted state (kept out of the SSR render to avoid a
  // hydration mismatch) and tear down in-flight work / object URLs on unmount.
  useEffect(() => {
    setDrafts(loadDrafts());
    setThemeMode(loadThemeMode());
    setHydrated(true);

    return () => {
      revokePlantUmlResult(resultsRef.current.plantuml);
      plantUmlAbortController.current?.abort();
    };
  }, []);

  // Persist theme + drafts together, but only after hydration so the defaults
  // never clobber saved values on the first render.
  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
  }, [hydrated, themeMode, drafts]);

  const updateResult = useCallback(
    (language: DiagramLanguage, result: PreviewResult): void => {
      setResults((current) => {
        if (language === "plantuml") {
          revokePlantUmlResult(current.plantuml);
        }

        const next = { ...current, [language]: result };
        // Mirror the latest results into a ref so the unmount cleanup can
        // revoke the final PlantUML object URL without a dedicated effect.
        resultsRef.current = next;
        return next;
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
          // Render labels as native SVG <text> instead of HTML <foreignObject>.
          // foreignObject content cannot be drawn onto a <canvas>, which broke
          // PNG export; SVG text rasterizes reliably.
          htmlLabels: false,
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
    viewport.reset();
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

  const handleCopySvg = async () => {
    const svgText = await getSvgTextFromResult(activeResult);
    if (!svgText) return;

    await navigator.clipboard.writeText(svgText);
    setCopiedType("svg");
    window.setTimeout(() => setCopiedType(null), 2000);
  };

  const handleDownloadSvg = async () => {
    const svgText = await getSvgTextFromResult(activeResult);
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

    const svgText = await getSvgTextFromResult(activeResult);
    if (!svgText) return;

    const pngBlob = await rasterizeSvgToPng(svgText, isDark);
    if (!pngBlob) return;

    downloadBlob(pngBlob, "igram-diagram.png");
    setShowExportMenu(false);
  };

  const handleDownloadHtml = async () => {
    const svgText = await getSvgTextFromResult(activeResult);
    if (!svgText) return;

    downloadBlob(
      new Blob([buildStandaloneHtml(svgText, isDark)], {
        type: "text/html;charset=utf-8",
      }),
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

        <WorkspaceHeader
          isDark={isDark}
          onToggleTheme={() =>
            setThemeMode((current) => (current === "dark" ? "light" : "dark"))
          }
        />

        <div className="grid shrink-0 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 md:grid-cols-[minmax(360px,45%)_1fr]">
          <EditorToolbar
            activeLanguage={activeLanguage}
            errors={errors}
            onSwitchLanguage={switchLanguage}
            templates={activeTemplates}
            showTemplates={showTemplates}
            onShowTemplatesChange={setShowTemplates}
            onSelectTemplate={selectTemplate}
            code={code}
            activeRenderState={activeRenderState}
            activeError={activeError}
            isStale={isStale}
            copiedType={copiedType}
            onCopyCode={() => void handleCopyCode()}
            onRender={() => void renderActiveDiagram(activeLanguage, code)}
          />

          <PreviewToolbar
            statusTone={statusCopy.tone}
            statusLabel={statusCopy.pill}
            activeLanguage={activeLanguage}
            selectedPlantUmlTheme={selectedPlantUmlTheme}
            onPlantUmlThemeChange={handlePlantUmlThemeChange}
            zoom={viewport.zoom}
            onZoomIn={viewport.zoomIn}
            onZoomOut={viewport.zoomOut}
            onZoomReset={viewport.reset}
            exportOpen={showExportMenu}
            onExportOpenChange={setShowExportMenu}
            hasResult={Boolean(activeResult)}
            canExport={canExport}
            copiedType={copiedType}
            onDownloadSvg={() => void handleDownloadSvg()}
            onDownloadPng={() => void handleDownloadPng()}
            onDownloadHtml={() => void handleDownloadHtml()}
            onCopySvg={() => void handleCopySvg()}
          />
        </div>

        <main className="grid min-h-0 flex-1 overflow-hidden md:grid-cols-[minmax(360px,45%)_1fr]">
          <EditorPanel
            language={activeLanguage}
            code={code}
            error={activeError}
            onCodeChange={handleCodeChange}
            onRetry={() => void renderActiveDiagram(activeLanguage, code)}
          />

          <PreviewPanel
            language={activeLanguage}
            result={activeResult}
            renderState={activeRenderState}
            isStale={isStale}
            isDark={isDark}
            viewport={viewport}
            onInsertStarter={() => selectTemplate(activeTemplates[0].code)}
            onRetry={
              activeError
                ? () => void renderActiveDiagram(activeLanguage, code)
                : undefined
            }
          />
        </main>

        <WorkspaceFooter
          tone={statusCopy.tone}
          footer={statusCopy.footer}
          line={lineStats.line}
          col={lineStats.col}
          hasDraft={Boolean(code.trim())}
        />
      </div>
    </div>
  );
}
