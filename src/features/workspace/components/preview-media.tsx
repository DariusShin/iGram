"use client";

import { cn } from "@/lib/utils";
import type { PreviewResult } from "@/features/workspace/types";

interface PreviewMediaProps {
  result: PreviewResult;
  stale: boolean;
}

export function PreviewMedia({ result, stale }: PreviewMediaProps) {
  return (
    <div
      className={cn(
        result.language === "mermaid" && "[&_svg]:max-w-none",
        stale && "opacity-45",
      )}
    >
      {result.language === "mermaid" ? (
        <div dangerouslySetInnerHTML={{ __html: result.svgHtml }} />
      ) : (
        // Blob URLs returned by the render lifecycle are already decoded before display.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={result.objectUrl}
          alt="Rendered PlantUML diagram"
          draggable={false}
          className="max-w-none"
        />
      )}
    </div>
  );
}
