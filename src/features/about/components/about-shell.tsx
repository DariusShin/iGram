"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Moon, Sun } from "lucide-react";

import {
  ScrollProgress,
  SmoothAnchor,
} from "@/features/about/components/scroll-motion";
import { THEME_STORAGE_KEY } from "@/features/workspace/constants";
import type { ThemeMode } from "@/features/workspace/types";
import { cn } from "@/lib/utils";

type NodeMarkProps = {
  className?: string;
  dotColor?: string;
  strokeColor?: string;
};

export function NodeMark({
  className,
  dotColor = "#60A5FA",
  strokeColor = "#FFFFFF",
}: NodeMarkProps) {
  return (
    <svg viewBox="0 0 56 56" aria-hidden="true" className={className}>
      <circle cx="28" cy="12" r="8" fill={strokeColor} />
      <path
        d="M28 26 V40 L40 40"
        stroke={strokeColor}
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="46" cy="40" r="4" fill={dotColor} />
    </svg>
  );
}

export function AboutShell({ children }: { children: ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const isDark = themeMode === "dark";

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === "dark" || savedTheme === "light") {
        setThemeMode(savedTheme);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const toggleTheme = () => {
    setThemeMode((current) => {
      const next = current === "dark" ? "light" : "dark";
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
      return next;
    });
  };

  return (
    <div
      className={cn(
        "min-h-dvh w-full overflow-x-hidden bg-background font-sans text-foreground",
        isDark && "dark",
      )}
    >
      <a
        href="#main-content"
        className="sr-only z-50 bg-background px-4 py-3 font-semibold text-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:ring-3 focus:ring-blue-500/40"
      >
        Skip to main content
      </a>

      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full min-w-0 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-500/35"
            aria-label="iGram workspace"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-slate-950 dark:bg-white">
              <NodeMark
                className="size-4"
                strokeColor={isDark ? "#0F172A" : "#FFFFFF"}
                dotColor={isDark ? "#2563EB" : "#60A5FA"}
              />
            </span>
            <span className="text-lg font-extrabold tracking-tight">iGram</span>
          </Link>

          <div className="flex-1" />

          <nav
            className="hidden items-center gap-6 text-sm font-semibold lg:flex"
            aria-label="Primary navigation"
          >
            <SmoothAnchor
              href="#why"
              className="text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-500/35"
            >
              Why iGram
            </SmoothAnchor>
            <SmoothAnchor
              href="#how"
              className="text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-500/35"
            >
              How it works
            </SmoothAnchor>
            <SmoothAnchor
              href="#roadmap"
              className="text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-500/35"
            >
              Roadmap
            </SmoothAnchor>
            <SmoothAnchor
              href="#faq"
              className="text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-500/35"
            >
              FAQ
            </SmoothAnchor>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex size-10 cursor-pointer items-center justify-center rounded-[10px] border border-border bg-background text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-500/35"
              title={`Switch to ${isDark ? "light" : "dark"} mode`}
              aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
            >
              {isDark ? (
                <Sun className="size-4" aria-hidden="true" />
              ) : (
                <Moon className="size-4" aria-hidden="true" />
              )}
            </button>
            <Link
              href="/"
              className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-500/40"
            >
              <span className="hidden sm:inline">Open workspace</span>
              <span className="sm:hidden">Open</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <ScrollProgress />
      {children}
    </div>
  );
}
