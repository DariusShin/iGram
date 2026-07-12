"use client";

import type { PlantUmlTheme } from "@/features/rendering/plantuml-theme";
import { ExportMenu } from "@/features/workspace/components/export-menu";
import { MermaidThemePanel } from "@/features/workspace/components/mermaid-theme-panel";
import { PlantUmlThemeSelect } from "@/features/workspace/components/plantuml-theme-select";
import { StatusPill } from "@/features/workspace/components/status-pill";
import { ZoomControls } from "@/features/workspace/components/zoom-controls";
import type {
  CopiedType,
  DiagramLanguage,
  StatusTone,
} from "@/features/workspace/types";

interface PreviewToolbarProps {
  statusTone: StatusTone;
  statusLabel: string;
  activeLanguage: DiagramLanguage;
  selectedPlantUmlTheme: PlantUmlTheme;
  onPlantUmlThemeChange: (theme: PlantUmlTheme) => void;
  mermaidSource: string;
  onMermaidSourceChange: (next: string) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  exportOpen: boolean;
  onExportOpenChange: (open: boolean) => void;
  hasResult: boolean;
  canExport: boolean;
  copiedType: CopiedType;
  onDownloadSvg: () => void;
  onDownloadPng: () => void;
  onDownloadHtml: () => void;
  onCopySvg: () => void;
}

export function PreviewToolbar({
  statusTone,
  statusLabel,
  activeLanguage,
  selectedPlantUmlTheme,
  onPlantUmlThemeChange,
  mermaidSource,
  onMermaidSourceChange,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  exportOpen,
  onExportOpenChange,
  hasResult,
  canExport,
  copiedType,
  onDownloadSvg,
  onDownloadPng,
  onDownloadHtml,
  onCopySvg,
}: PreviewToolbarProps) {
  return (
    <section className="flex min-h-14 items-center justify-between gap-3 px-4">
      <StatusPill tone={statusTone} label={statusLabel} />

      <div className="flex shrink-0 items-center gap-2">
        {activeLanguage === "plantuml" && (
          <PlantUmlThemeSelect
            value={selectedPlantUmlTheme}
            onValueChange={onPlantUmlThemeChange}
          />
        )}

        {activeLanguage === "mermaid" && (
          <MermaidThemePanel
            source={mermaidSource}
            onSourceChange={onMermaidSourceChange}
          />
        )}

        <ZoomControls
          zoom={zoom}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onReset={onZoomReset}
        />

        <ExportMenu
          open={exportOpen}
          onOpenChange={onExportOpenChange}
          hasResult={hasResult}
          canExport={canExport}
          copiedType={copiedType}
          onDownloadSvg={onDownloadSvg}
          onDownloadPng={onDownloadPng}
          onDownloadHtml={onDownloadHtml}
          onCopySvg={onCopySvg}
        />
      </div>
    </section>
  );
}
