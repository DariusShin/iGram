"use client";

import { useEffect, useId, useRef } from "react";
import mermaid from "mermaid";

// Initialize Mermaid configurations globally on the client side
mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
});

interface MermaidProps {
  chart: string;
}

export default function Mermaid({ chart }: MermaidProps) {
  const containerId = useId().replace(/:/g, ""); // Clean ID string for DOM suitability
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!elementRef.current) return;

      try {
        // Clear previous content to prevent race conditions during hot-reloads
        elementRef.current.innerHTML = "";

        // Render chart text to valid SVG elements
        const { svg } = await mermaid.render(`mermaid-${containerId}`, chart);
        elementRef.current.innerHTML = svg;
      } catch (error) {
        console.error("Mermaid rendering failed:", error);
        elementRef.current.innerHTML =
          "<p class='text-red-500 text-sm'>Failed to render diagram.</p>";
      }
    };

    renderDiagram();
  }, [chart, containerId]);

  return <div ref={elementRef} className="w-full flex justify-center my-4" />;
}
