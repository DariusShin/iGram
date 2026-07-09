"use client";

import { Check, Copy, Loader2, RotateCcw } from "lucide-react";

import { cn } from "@/lib/utils";
import { LanguageTab } from "@/features/workspace/components/language-tab";
import { TemplatesDropdown } from "@/features/workspace/components/templates-dropdown";
import type {
  CopiedType,
  DiagramLanguage,
  RenderErrors,
  RenderState,
  Template,
} from "@/features/workspace/types";

interface EditorToolbarProps {
  activeLanguage: DiagramLanguage;
  errors: RenderErrors;
  onSwitchLanguage: (language: DiagramLanguage) => void;
  templates: Template[];
  showTemplates: boolean;
  onShowTemplatesChange: (open: boolean) => void;
  onSelectTemplate: (code: string) => void;
  code: string;
  activeRenderState: RenderState;
  activeError: string;
  isStale: boolean;
  copiedType: CopiedType;
  onCopyCode: () => void;
  onRender: () => void;
}

export function EditorToolbar({
  activeLanguage,
  errors,
  onSwitchLanguage,
  templates,
  showTemplates,
  onShowTemplatesChange,
  onSelectTemplate,
  code,
  activeRenderState,
  activeError,
  isStale,
  copiedType,
  onCopyCode,
  onRender,
}: EditorToolbarProps) {
  return (
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
            onClick={onSwitchLanguage}
          />
          <LanguageTab
            language="plantuml"
            activeLanguage={activeLanguage}
            hasError={Boolean(errors.plantuml)}
            onClick={onSwitchLanguage}
          />
        </div>

        <TemplatesDropdown
          templates={templates}
          open={showTemplates}
          onOpenChange={onShowTemplatesChange}
          onSelect={onSelectTemplate}
        />
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
            activeRenderState === "error" && "text-red-600 dark:text-red-300",
          )}
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              (activeRenderState === "waiting" || isStale) && "bg-amber-500",
              activeRenderState === "rendering" && "bg-blue-500",
              activeRenderState === "rendered" && !isStale && "bg-emerald-500",
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
          onClick={onCopyCode}
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
          onClick={onRender}
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
  );
}
