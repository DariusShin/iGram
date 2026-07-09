"use client";

import { useEffect, useRef } from "react";
import { ChevronDown, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Template } from "@/features/workspace/types";

interface TemplatesDropdownProps {
  templates: Template[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (code: string) => void;
}

export function TemplatesDropdown({
  templates,
  open,
  onOpenChange,
  onSelect,
}: TemplatesDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        onOpenChange(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onOpenChange]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <Sparkles className="size-3.5 text-blue-600 dark:text-blue-300" />
        <span className="hidden lg:inline">Starter</span>
        <ChevronDown
          className={cn("size-3.5 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-10 z-40 w-72 rounded-lg border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-950/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40">
          {templates.map((template) => (
            <button
              key={template.name}
              type="button"
              onClick={() => onSelect(template.code)}
              className="block w-full rounded-md px-3 py-2 text-left transition hover:bg-blue-50 dark:hover:bg-slate-800"
            >
              <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                {template.name}
              </span>
              <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">
                {template.desc}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
