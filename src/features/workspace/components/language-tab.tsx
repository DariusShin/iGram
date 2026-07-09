"use client";

import { cn } from "@/lib/utils";
import type { DiagramLanguage } from "@/features/workspace/types";

interface LanguageTabProps {
  language: DiagramLanguage;
  activeLanguage: DiagramLanguage;
  hasError: boolean;
  onClick: (language: DiagramLanguage) => void;
}

export function LanguageTab({
  language,
  activeLanguage,
  hasError,
  onClick,
}: LanguageTabProps) {
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
