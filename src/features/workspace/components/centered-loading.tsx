"use client";

import { Loader2 } from "lucide-react";

import type { DiagramLanguage } from "@/features/workspace/types";

export function CenteredLoading({ language }: { language: DiagramLanguage }) {
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
