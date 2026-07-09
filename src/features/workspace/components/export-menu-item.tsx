"use client";

interface ExportMenuItemProps {
  label: string;
  desc: string;
  disabled: boolean;
  onClick: () => void;
}

export function ExportMenuItem({
  label,
  desc,
  disabled,
  onClick,
}: ExportMenuItemProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="block w-full rounded-md px-3 py-2.5 text-left transition hover:bg-blue-50 disabled:pointer-events-none disabled:opacity-45 dark:hover:bg-slate-800"
    >
      <span className="block text-sm font-bold text-slate-900 dark:text-slate-100">
        {label}
      </span>
      <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
        {desc}
      </span>
    </button>
  );
}
