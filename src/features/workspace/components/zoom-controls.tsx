"use client";

import { ZoomIn, ZoomOut } from "lucide-react";

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export function ZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
}: ZoomControlsProps) {
  return (
    <div className="hidden items-center rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:flex">
      <button
        type="button"
        onClick={onZoomOut}
        className="flex size-8 items-center justify-center text-slate-700 transition hover:bg-slate-50 active:translate-y-px dark:text-slate-200 dark:hover:bg-slate-800"
        title="Zoom out"
      >
        <ZoomOut className="size-4" />
      </button>
      <button
        type="button"
        onClick={onReset}
        className="h-8 min-w-16 border-x border-slate-200 px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        title="Reset zoom"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        type="button"
        onClick={onZoomIn}
        className="flex size-8 items-center justify-center border-r border-slate-200 text-slate-700 transition hover:bg-slate-50 active:translate-y-px dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        title="Zoom in"
      >
        <ZoomIn className="size-4" />
      </button>
      <button
        type="button"
        onClick={onReset}
        className="h-8 px-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
      >
        Fit
      </button>
    </div>
  );
}
