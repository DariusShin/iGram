"use client";

import { useEffect, useRef, useState } from "react";

import { ScrollReveal } from "@/features/about/components/scroll-motion";

type StatItem = {
  label: string;
  suffix?: string;
  value: number;
};

const STATS: StatItem[] = [
  { value: 2, label: "Diagram languages" },
  { value: 3, label: "Export formats" },
  { value: 0, label: "Fees — free to use" },
  { value: 0, label: "Accounts required" },
];

function prefersReducedMotion() {
  return (
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
  );
}

export function AboutStats() {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<number | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) {
      return;
    }

    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      frameRef.current = window.requestAnimationFrame(() => setProgress(1));
      return () => {
        if (frameRef.current !== null) {
          window.cancelAnimationFrame(frameRef.current);
        }
      };
    }

    const animate = () => {
      const startedAt = window.performance.now();
      const duration = 1400;

      const tick = (now: number) => {
        const linearProgress = Math.min(1, (now - startedAt) / duration);
        setProgress(1 - Math.pow(1 - linearProgress, 3));

        if (linearProgress < 1) {
          frameRef.current = window.requestAnimationFrame(tick);
        }
      };

      frameRef.current = window.requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          animate();
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -18%", threshold: 0.3 },
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="bg-slate-950"
      aria-label="iGram workspace facts"
    >
      <ScrollReveal className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {STATS.map((stat) => {
          const value = Math.round(stat.value * progress);
          return (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-1.5 text-center"
            >
              <p className="text-5xl font-extrabold leading-none tracking-tight text-white tabular-nums">
                {value}
                {stat.suffix ?? ""}
              </p>
              <p className="text-sm font-medium text-slate-400">{stat.label}</p>
            </div>
          );
        })}
      </ScrollReveal>
    </section>
  );
}
