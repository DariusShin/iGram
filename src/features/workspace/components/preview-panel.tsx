"use client";

import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { CenteredLoading } from "@/features/workspace/components/centered-loading";
import { EmptyPreview } from "@/features/workspace/components/empty-preview";
import { PreviewMedia } from "@/features/workspace/components/preview-media";
import type {
  DiagramLanguage,
  PreviewResult,
  RenderState,
} from "@/features/workspace/types";
import type { CanvasViewport } from "@/features/workspace/use-canvas-viewport";

interface PreviewPanelProps {
  language: DiagramLanguage;
  result?: PreviewResult;
  renderState: RenderState;
  isStale: boolean;
  isDark: boolean;
  viewport: CanvasViewport;
  onInsertStarter: () => void;
  onRetry?: () => void;
}

export function PreviewPanel({
  language,
  result,
  renderState,
  isStale,
  isDark,
  viewport,
  onInsertStarter,
  onRetry,
}: PreviewPanelProps) {
  const { zoom, offset, isPanning, containerRef } = viewport;

  return (
    <section
      ref={containerRef}
      onPointerDown={result ? viewport.onPointerDown : undefined}
      onPointerMove={result ? viewport.onPointerMove : undefined}
      onPointerUp={result ? viewport.onPointerUp : undefined}
      onPointerCancel={result ? viewport.onPointerUp : undefined}
      className={cn(
        "relative min-h-0 touch-none select-none overflow-hidden bg-white dark:bg-slate-900",
        result && (isPanning ? "cursor-grabbing" : "cursor-grab"),
      )}
      style={{
        backgroundImage: isDark
          ? "radial-gradient(circle, rgba(148, 163, 184, 0.22) 1.5px, transparent 1.5px)"
          : "radial-gradient(circle, rgba(100, 116, 139, 0.18) 1.5px, transparent 1.5px)",
        backgroundSize: "24px 24px",
      }}
    >
      {result && (isStale || renderState === "error") && (
        <div className="pointer-events-none absolute left-6 top-6 z-10 inline-flex rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          Showing previous valid render
        </div>
      )}

      {result ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="shrink-0"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            }}
          >
            <PreviewMedia
              result={result}
              stale={isStale || renderState === "error"}
            />
          </div>
        </div>
      ) : renderState === "rendering" ? (
        <div className="absolute inset-0">
          <CenteredLoading language={language} />
        </div>
      ) : (
        <div className="absolute inset-0">
          <EmptyPreview
            language={language}
            onInsert={onInsertStarter}
            onRetry={onRetry}
          />
        </div>
      )}

      {result && renderState === "rendering" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/55 backdrop-blur-[1px] dark:bg-slate-950/45">
          <div className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-bold text-blue-700 shadow-lg dark:border-blue-400/30 dark:bg-slate-900 dark:text-blue-200">
            <Loader2 className="size-4 animate-spin" />
            {language === "plantuml"
              ? "Rendering with PlantUML public server..."
              : "Rendering preview..."}
          </div>
        </div>
      )}
    </section>
  );
}
