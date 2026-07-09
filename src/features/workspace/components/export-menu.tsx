"use client";

import { useEffect, useRef } from "react";
import { Check, ChevronDown, Download, FileCode2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { ExportMenuItem } from "@/features/workspace/components/export-menu-item";
import type { CopiedType } from "@/features/workspace/types";

interface ExportMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasResult: boolean;
  canExport: boolean;
  copiedType: CopiedType;
  onDownloadSvg: () => void;
  onDownloadPng: () => void;
  onDownloadHtml: () => void;
  onCopySvg: () => void;
}

export function ExportMenu({
  open,
  onOpenChange,
  hasResult,
  canExport,
  copiedType,
  onDownloadSvg,
  onDownloadPng,
  onDownloadHtml,
  onCopySvg,
}: ExportMenuProps) {
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
        disabled={!hasResult}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-md px-4 text-sm font-bold shadow-sm transition active:translate-y-px disabled:pointer-events-none disabled:bg-slate-300 disabled:text-white dark:disabled:bg-slate-700",
          canExport
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-slate-400 text-white",
        )}
        title={
          canExport
            ? "Open export menu"
            : "Exports are enabled after the latest valid render"
        }
      >
        <Download className="size-4 sm:hidden" />
        <span className="hidden sm:inline">Export</span>
        <ChevronDown className="size-3.5" />
      </button>

      {open && hasResult && (
        <div className="absolute right-0 top-11 z-40 w-72 rounded-lg border border-slate-200 bg-white p-2 shadow-xl shadow-slate-950/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40">
          {!canExport && (
            <div className="mb-1 rounded-md bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">
              Exports are disabled until the latest preview is ready.
            </div>
          )}
          <ExportMenuItem
            label="SVG"
            desc="Vector - documents and editing"
            disabled={!canExport}
            onClick={onDownloadSvg}
          />
          <ExportMenuItem
            label="PNG"
            desc="Raster at 2x - slides and sharing"
            disabled={!canExport}
            onClick={onDownloadPng}
          />
          <ExportMenuItem
            label="Standalone HTML"
            desc="Self-contained sanitized page"
            disabled={!canExport}
            onClick={onDownloadHtml}
          />
          <div className="mt-1 border-t border-slate-100 pt-1 dark:border-slate-800">
            <button
              type="button"
              onClick={onCopySvg}
              disabled={!canExport}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-45 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {copiedType === "svg" ? (
                <Check className="size-4 text-emerald-600" />
              ) : (
                <FileCode2 className="size-4" />
              )}
              {copiedType === "svg" ? "Copied SVG" : "Copy SVG"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
