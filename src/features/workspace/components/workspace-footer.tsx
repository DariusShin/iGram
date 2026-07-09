"use client";

import { cn } from "@/lib/utils";
import type { StatusTone } from "@/features/workspace/types";

interface WorkspaceFooterProps {
  tone: StatusTone;
  footer: string;
  line: number;
  col: number;
  hasDraft: boolean;
}

export function WorkspaceFooter({
  tone,
  footer,
  line,
  col,
  hasDraft,
}: WorkspaceFooterProps) {
  return (
    <footer
      className={cn(
        "grid h-9 shrink-0 grid-cols-[1fr_auto] items-center gap-4 border-t border-slate-200 bg-white px-5 text-xs font-medium dark:border-slate-800 dark:bg-slate-950",
        tone === "red"
          ? "text-red-600 dark:text-red-300"
          : tone === "amber"
            ? "text-amber-700 dark:text-amber-300"
            : "text-slate-500 dark:text-slate-400",
      )}
    >
      <span className="truncate">{footer}</span>
      <span className="hidden font-mono sm:block">
        Ln {line}, Col {col} -{" "}
        {hasDraft ? "Draft saved locally" : "No draft yet"}
      </span>
    </footer>
  );
}
