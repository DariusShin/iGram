"use client";

import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { StatusTone } from "@/features/workspace/types";

interface StatusPillProps {
  tone: StatusTone;
  label: string;
}

export function StatusPill({ tone, label }: StatusPillProps) {
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
