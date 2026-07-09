"use client";

import Image from "next/image";
import { Moon, Sun } from "lucide-react";

interface WorkspaceHeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

export function WorkspaceHeader({
  isDark,
  onToggleTheme,
}: WorkspaceHeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-10 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-slate-950">
          <Image
            src="/iGram_logo.png"
            alt="iGram logo"
            width={40}
            height={40}
            priority
            className="size-full object-contain"
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
          onClick={onToggleTheme}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:translate-y-px dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          title={`Switch to ${isDark ? "light" : "dark"} mode`}
        >
          {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          <span className="hidden sm:inline">{isDark ? "Light" : "Dark"}</span>
        </button>
      </div>
    </header>
  );
}
