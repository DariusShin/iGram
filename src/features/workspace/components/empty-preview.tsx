"use client";

import { FileCode2 } from "lucide-react";

import type { DiagramLanguage } from "@/features/workspace/types";

interface EmptyPreviewProps {
  language: DiagramLanguage;
  onInsert: () => void;
  onRetry?: () => void;
}

export function EmptyPreview({
  language,
  onInsert,
  onRetry,
}: EmptyPreviewProps) {
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
