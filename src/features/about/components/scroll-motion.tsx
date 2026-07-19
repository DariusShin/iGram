"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PropsWithChildren,
  type CSSProperties,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

function prefersReducedMotion() {
  return (
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
  );
}

export function ScrollProgress() {
  const progressRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let frame: number | null = null;

    const updateProgress = () => {
      frame = null;
      const scrollableHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const nextProgress =
        scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;

      if (progressRef.current) {
        const progress = Math.min(1, Math.max(0, nextProgress));
        progressRef.current.style.transform = `scaleX(${progress})`;
      }
    };

    const requestUpdate = () => {
      if (frame === null) {
        frame = window.requestAnimationFrame(updateProgress);
      }
    };

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    requestUpdate();

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[3px] bg-transparent"
      aria-hidden="true"
    >
      <span
        ref={progressRef}
        className="block h-full origin-left bg-gradient-to-r from-blue-600 to-violet-600 transition-transform duration-150 ease-out motion-reduce:transition-none"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}

type RevealPhase = "idle" | "hidden" | "visible";

type ScrollRevealProps = PropsWithChildren<{
  className?: string;
  delay?: number;
  style?: CSSProperties;
}>;

export function ScrollReveal({
  children,
  className,
  delay = 0,
  style,
}: ScrollRevealProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<RevealPhase>("idle");

  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      return;
    }

    if (prefersReducedMotion()) {
      return;
    }

    let observer: IntersectionObserver | null = null;
    const frame = window.requestAnimationFrame(() => {
      const startsInView =
        element.getBoundingClientRect().top <= window.innerHeight * 0.88;

      if (startsInView || !("IntersectionObserver" in window)) {
        setPhase("visible");
        return;
      }

      setPhase("hidden");
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            setPhase("visible");
            observer?.disconnect();
          }
        },
        { rootMargin: "0px 0px -10%", threshold: 0.12 },
      );
      observer.observe(element);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, []);

  return (
    <div
      ref={elementRef}
      className={cn(
        "translate-y-0 opacity-100 transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transform-none motion-reduce:opacity-100 motion-reduce:transition-none",
        phase === "hidden" && "translate-y-6 opacity-0",
        phase === "visible" && "translate-y-0 opacity-100",
        className,
      )}
      style={
        phase === "visible" && delay > 0
          ? { ...style, transitionDelay: `${delay}ms` }
          : style
      }
    >
      {children}
    </div>
  );
}

type SmoothAnchorProps = {
  children: ReactNode;
  className?: string;
  href: `#${string}`;
};

export function SmoothAnchor({ children, className, href }: SmoothAnchorProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById(href.slice(1));
    if (!target) {
      return;
    }

    event.preventDefault();
    target.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
    window.history.pushState(null, "", href);
  };

  return (
    <a href={href} className={className} onClick={handleClick}>
      {children}
    </a>
  );
}
