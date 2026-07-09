"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

import {
  DEFAULT_ZOOM,
  MAX_ZOOM,
  MIN_ZOOM,
} from "@/features/workspace/constants";

interface Offset {
  x: number;
  y: number;
}

const ZOOM_STEP = 0.1;
const WHEEL_ZOOM_SENSITIVITY = 0.0015;

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

export interface CanvasViewport {
  zoom: number;
  offset: Offset;
  isPanning: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
}

/**
 * Figma-style pan + zoom for the preview canvas.
 * - Drag anywhere to pan in every direction.
 * - Scroll/pinch to zoom, anchored on the pointer so the point under the
 *   cursor stays put.
 * The zoom buttons in the toolbar share this state, so their value and the
 * gesture value never diverge.
 */
export function useCanvasViewport(): CanvasViewport {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  // Refs mirror the committed state so the native wheel handler and pointer
  // math can read the latest values without re-subscribing.
  const zoomRef = useRef(zoom);
  const offsetRef = useRef(offset);
  const panOrigin = useRef<{
    pointerX: number;
    pointerY: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  const reset = useCallback(() => {
    setZoom(DEFAULT_ZOOM);
    setOffset({ x: 0, y: 0 });
  }, []);

  const zoomIn = useCallback(() => {
    setZoom((current) => clampZoom(current + ZOOM_STEP));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((current) => clampZoom(current - ZOOM_STEP));
  }, []);

  // Wheel-to-zoom is attached natively so it can be non-passive and call
  // preventDefault, keeping the page from scrolling under the gesture.
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();

      const rect = element.getBoundingClientRect();
      const pointerX = event.clientX - rect.left - rect.width / 2;
      const pointerY = event.clientY - rect.top - rect.height / 2;

      const prevZoom = zoomRef.current;
      const nextZoom = clampZoom(
        prevZoom * Math.exp(-event.deltaY * WHEEL_ZOOM_SENSITIVITY),
      );
      if (nextZoom === prevZoom) return;

      const ratio = nextZoom / prevZoom;
      const prevOffset = offsetRef.current;

      setZoom(nextZoom);
      setOffset({
        x: pointerX - ratio * (pointerX - prevOffset.x),
        y: pointerY - ratio * (pointerY - prevOffset.y),
      });
    };

    element.addEventListener("wheel", handleWheel, { passive: false });
    return () => element.removeEventListener("wheel", handleWheel);
  }, []);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;

    panOrigin.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      offsetX: offsetRef.current.x,
      offsetY: offsetRef.current.y,
    };
    setIsPanning(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const origin = panOrigin.current;
    if (!origin) return;

    setOffset({
      x: origin.offsetX + (event.clientX - origin.pointerX),
      y: origin.offsetY + (event.clientY - origin.pointerY),
    });
  }, []);

  const onPointerUp = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (!panOrigin.current) return;

    panOrigin.current = null;
    setIsPanning(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  return {
    zoom,
    offset,
    isPanning,
    containerRef,
    zoomIn,
    zoomOut,
    reset,
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
}
