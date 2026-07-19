import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  LifeBuoy,
  Package,
  PanelLeft,
  ShieldCheck,
  Zap,
  ZoomIn,
} from "lucide-react";

import { AboutMascot } from "@/features/about/components/about-mascot";
import { AboutFaq } from "@/features/about/components/about-faq";
import { AboutShell, NodeMark } from "@/features/about/components/about-shell";
import { AboutStats } from "@/features/about/components/about-stats";
import {
  ScrollReveal,
  SmoothAnchor,
} from "@/features/about/components/scroll-motion";
import { WorkflowExplorer } from "@/features/about/components/workflow-explorer";
import { cn } from "@/lib/utils";

type Feature = {
  copy: string;
  icon: LucideIcon;
  title: string;
};

type RoadmapItem = {
  copy: string;
  dot: string;
  ring: string;
  status: string;
  statusTone: string;
  title: string;
};

const MARQUEE_ITEMS = [
  "MERMAID FLOWCHARTS",
  "SEQUENCE DIAGRAMS",
  "PLANTUML CLASS DIAGRAMS",
  "STATE DIAGRAMS",
  "SVG EXPORT",
  "PNG EXPORT",
  "STANDALONE HTML",
];

const WHY_FEATURES: Feature[] = [
  {
    title: "One tab, both languages",
    copy: "Separate Mermaid and PlantUML workspaces with independent drafts — no more guessing which preview site speaks which syntax.",
    icon: PanelLeft,
  },
  {
    title: "Live, debounced preview",
    copy: "The diagram re-renders as you stop typing. Manual Render and Retry are always one keystroke away.",
    icon: Zap,
  },
  {
    title: "Errors that help",
    copy: "Syntax errors point at the line. Timeouts, bad responses, and outages get plain-language messages — and your last valid preview stays put.",
    icon: LifeBuoy,
  },
  {
    title: "Inspect properly",
    copy: "Zoom 50–200%, reset, fit-to-view, and scroll oversized diagrams instead of squinting at a thumbnail.",
    icon: ZoomIn,
  },
  {
    title: "Export that just works",
    copy: "SVG for documents, PNG for slides, standalone HTML for sharing. Exports lock while the preview is stale, so you never ship the wrong version.",
    icon: Package,
  },
  {
    title: "Safe by default",
    copy: "All generated SVG is treated as untrusted and sanitized. Drafts live in your browser — no account, no server-side storage.",
    icon: ShieldCheck,
  },
];

const ROADMAP_ITEMS: RoadmapItem[] = [
  {
    title: "The workspace",
    status: "Shipping now",
    statusTone:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200",
    dot: "bg-emerald-500",
    ring: "border-emerald-100 dark:border-emerald-400/30",
    copy: "Editor, dual-language rendering, zoom, error handling, local drafts, and SVG / PNG / HTML export.",
  },
  {
    title: "Conversion",
    status: "Planned",
    statusTone:
      "bg-blue-50 text-blue-800 dark:bg-blue-400/10 dark:text-blue-200",
    dot: "bg-blue-600",
    ring: "border-blue-100 dark:border-blue-400/30",
    copy: "Convert Mermaid to PlantUML and back, so you can move diagrams to whichever tool your team uses.",
  },
  {
    title: "AI repair",
    status: "Planned",
    statusTone:
      "bg-blue-50 text-blue-800 dark:bg-blue-400/10 dark:text-blue-200",
    dot: "bg-blue-600",
    ring: "border-blue-100 dark:border-blue-400/30",
    copy: "Detect syntax and compatibility problems, explain them in plain language, and suggest corrected source you can review and apply.",
  },
  {
    title: "Your models",
    status: "Exploring",
    statusTone:
      "bg-amber-50 text-amber-800 dark:bg-amber-400/10 dark:text-amber-200",
    dot: "bg-amber-500",
    ring: "border-amber-100 dark:border-amber-400/30",
    copy: "Configurable hosted or self-hosted LLM providers, integrated through explicit interfaces — never coupled to the editor.",
  },
];

export function AboutPage() {
  return (
    <AboutShell>
      <main id="main-content">
        <section
          id="hero"
          className="relative isolate overflow-hidden bg-gradient-to-b from-blue-50/60 to-background dark:from-slate-900/60"
          aria-labelledby="about-title"
        >
          <div
            className="pointer-events-none absolute -right-32 -top-32 size-[26rem] rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.10),transparent_70%)]"
            aria-hidden="true"
          />

          <div className="mx-auto flex max-w-7xl flex-col items-center gap-14 px-4 pb-20 pt-20 sm:px-6 lg:flex-row lg:gap-16 lg:px-8 lg:pb-24 lg:pt-24">
            <div className="flex min-w-0 flex-1 flex-col items-start gap-5">
              <ScrollReveal>
                <p className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-[13px] font-semibold text-blue-700 dark:border-blue-400/30 dark:bg-blue-400/10 dark:text-blue-200">
                  About iGram
                </p>
              </ScrollReveal>
              <ScrollReveal delay={80}>
                <h1
                  id="about-title"
                  className="text-5xl font-extrabold leading-[1.08] tracking-tight sm:text-[52px]"
                >
                  <span className="block">Diagram code in.</span>
                  <span className="block">Finished diagram out.</span>
                </h1>
              </ScrollReveal>
              <ScrollReveal delay={160}>
                <p className="max-w-[33rem] text-lg leading-relaxed text-muted-foreground">
                  AI assistants hand you Mermaid or PlantUML source — then leave
                  you juggling preview sites, syntax errors, and export hacks.
                  iGram is one workspace to{" "}
                  <strong className="font-semibold text-foreground">
                    edit, render, inspect, and export
                  </strong>{" "}
                  both languages.
                </p>
              </ScrollReveal>
              <ScrollReveal
                delay={240}
                className="mt-1.5 flex flex-col gap-3.5 sm:flex-row sm:items-center"
              >
                <Link
                  href="/"
                  className="inline-flex h-[46px] items-center justify-center rounded-[11px] bg-blue-600 px-6 text-[15px] font-semibold text-white shadow-[0_10px_24px_-10px_rgba(37,99,235,0.5)] transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-500/40"
                >
                  Try the workspace
                </Link>
                <SmoothAnchor
                  href="#how"
                  className="inline-flex h-[46px] items-center justify-center rounded-[11px] border-[1.5px] border-border bg-background px-6 text-[15px] font-semibold text-foreground transition-colors hover:border-slate-300 dark:hover:border-slate-600 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-blue-500/35"
                >
                  See how it works
                </SmoothAnchor>
              </ScrollReveal>
              <ScrollReveal delay={320}>
                <p className="text-[13px] text-muted-foreground/80">
                  No account · Drafts saved locally · Free
                </p>
              </ScrollReveal>
            </div>

            <ScrollReveal
              delay={200}
              className="w-full max-w-[29rem] shrink-0 lg:w-[29rem]"
            >
              <HeroShowcase />
            </ScrollReveal>
          </div>

          <div
            className="overflow-hidden border-t border-border bg-background py-4"
            aria-label="Supported diagram types and exports"
          >
            <div className="flex w-max gap-12 whitespace-nowrap text-[13px] font-semibold text-muted-foreground/80 motion-safe:animate-[about-marquee_26s_linear_infinite]">
              <MarqueeRow />
              <MarqueeRow ariaHidden />
            </div>
          </div>
        </section>

        <AboutStats />

        <section
          id="why"
          className="py-20 sm:py-24"
          aria-labelledby="why-title"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal className="max-w-2xl">
              <p className="text-[13px] font-bold tracking-[0.1em] text-blue-600 dark:text-blue-300">
                WHY IGRAM
              </p>
              <h2
                id="why-title"
                className="mt-3.5 text-4xl font-extrabold leading-tight tracking-tight sm:text-[38px]"
              >
                The workflow after &ldquo;here&rsquo;s your diagram code&rdquo;
                is broken
              </h2>
              <p className="mt-3.5 text-[16.5px] leading-relaxed text-muted-foreground">
                ChatGPT, Claude, and Gemini answer diagram requests with source
                code. What happens next is a scavenger hunt across preview
                sites. iGram replaces it with one tab.
              </p>
            </ScrollReveal>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {WHY_FEATURES.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <ScrollReveal key={feature.title} delay={index * 60}>
                    <article className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-7 transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1.5 hover:border-blue-200 hover:shadow-[0_20px_40px_-20px_rgba(15,23,42,0.25)] motion-reduce:hover:translate-y-0 dark:hover:border-blue-400/40">
                      <span className="flex size-[42px] items-center justify-center rounded-[11px] bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300">
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                      <h3 className="text-[17px] font-bold tracking-normal">
                        {feature.title}
                      </h3>
                      <p className="text-[14.5px] leading-relaxed text-muted-foreground">
                        {feature.copy}
                      </p>
                    </article>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </section>

        <WorkflowExplorer />

        <section
          id="roadmap"
          className="py-20 sm:py-24"
          aria-labelledby="roadmap-title"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 sm:px-6 lg:flex-row lg:gap-[4.5rem] lg:px-8">
            <div className="max-w-sm shrink-0">
              <ScrollReveal>
                <p className="text-[13px] font-bold tracking-[0.1em] text-blue-600 dark:text-blue-300">
                  ROADMAP
                </p>
              </ScrollReveal>
              <ScrollReveal delay={80}>
                <h2
                  id="roadmap-title"
                  className="mt-3.5 text-4xl font-extrabold leading-tight tracking-tight sm:text-[38px]"
                >
                  Built in phases, shipped honestly
                </h2>
              </ScrollReveal>
              <ScrollReveal delay={160}>
                <p className="mt-3.5 leading-relaxed text-muted-foreground">
                  The workspace nails the editing loop today. Next comes the
                  intelligence: conversion and AI repair through clean
                  interfaces, not bolted on.
                </p>
              </ScrollReveal>
            </div>

            <ol className="flex flex-1 flex-col">
              {ROADMAP_ITEMS.map((item, index) => (
                <ScrollReveal key={item.title} delay={index * 80}>
                  <li className="flex gap-5">
                    <div
                      className="flex flex-col items-center"
                      aria-hidden="true"
                    >
                      <span
                        className={cn(
                          "mt-1 size-3.5 shrink-0 rounded-full border-[3px]",
                          item.dot,
                          item.ring,
                        )}
                      />
                      {index < ROADMAP_ITEMS.length - 1 && (
                        <span className="w-0.5 flex-1 bg-border" />
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 pb-9">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-[16.5px] font-bold tracking-normal">
                          {item.title}
                        </h3>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.05em]",
                            item.statusTone,
                          )}
                        >
                          {item.status}
                        </span>
                      </div>
                      <p className="max-w-xl text-[14.5px] leading-relaxed text-muted-foreground">
                        {item.copy}
                      </p>
                    </div>
                  </li>
                </ScrollReveal>
              ))}
            </ol>
          </div>
        </section>

        <AboutFaq />

        <section
          id="cta"
          className="bg-slate-950 text-white"
          aria-labelledby="cta-title"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-14 px-4 pt-20 sm:px-6 lg:px-8 lg:pt-[5.5rem]">
            <ScrollReveal className="flex flex-col items-center gap-5 text-center">
              <h2
                id="cta-title"
                className="text-4xl font-extrabold leading-tight tracking-tight sm:text-[40px]"
              >
                Your next diagram is one paste away
              </h2>
              <p className="max-w-md text-[16.5px] leading-relaxed text-slate-400">
                Open the workspace, drop in the code your AI wrote, and export a
                clean SVG before your coffee cools.
              </p>
              <Link
                href="/"
                className="inline-flex h-[50px] items-center gap-2 rounded-xl bg-blue-600 px-[30px] text-base font-semibold text-white shadow-[0_12px_32px_-8px_rgba(37,99,235,0.55)] transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white/45"
              >
                Open the workspace
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </ScrollReveal>

            <footer className="flex flex-col gap-5 border-t border-slate-800 py-7 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href="/"
                className="flex w-fit items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white/30"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-[7px] bg-white">
                  <NodeMark
                    className="size-3"
                    strokeColor="#0F172A"
                    dotColor="#2563EB"
                  />
                </span>
                <span className="text-[15px] font-bold text-white">iGram</span>
              </Link>
              <nav
                aria-label="Footer navigation"
                className="flex flex-wrap items-center gap-6 text-[13.5px] font-medium text-slate-400"
              >
                <Link href="/" className="transition-colors hover:text-white">
                  Workspace
                </Link>
                <a href="#why" className="transition-colors hover:text-white">
                  Why iGram
                </a>
                <a
                  href="#roadmap"
                  className="transition-colors hover:text-white"
                >
                  Roadmap
                </a>
                <a href="#faq" className="transition-colors hover:text-white">
                  FAQ
                </a>
              </nav>
            </footer>
          </div>
        </section>
      </main>

      <AboutMascot />
    </AboutShell>
  );
}

function MarqueeRow({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <div className="flex gap-12" aria-hidden={ariaHidden || undefined}>
      {MARQUEE_ITEMS.map((item) => (
        <span key={item} className="flex items-center gap-12">
          <span>{item}</span>
          <span aria-hidden="true">·</span>
        </span>
      ))}
    </div>
  );
}

function HeroShowcase() {
  return (
    <div aria-hidden="true">
      <div className="rounded-2xl bg-slate-950 px-5 py-[18px] font-mono text-[12.5px] leading-5 text-slate-300 shadow-[0_32px_64px_-24px_rgba(15,23,42,0.45)] dark:border dark:border-white/10">
        <div className="mb-3 flex gap-1.5">
          <span className="size-2.5 rounded-full bg-red-400" />
          <span className="size-2.5 rounded-full bg-amber-400" />
          <span className="size-2.5 rounded-full bg-emerald-400" />
        </div>
        <p className="text-slate-500">%% paste from your AI chat</p>
        <p className="text-blue-300">flowchart LR</p>
        <p>
          {"  "}Code <span className="text-teal-300">--&gt;</span> iGram
        </p>
        <p>
          {"  "}iGram <span className="text-teal-300">--&gt;</span> Diagram
          <span className="ml-0.5 inline-block h-[13px] w-[7px] translate-y-0.5 bg-blue-300 motion-safe:animate-[about-caret_1.1s_infinite]" />
        </p>
      </div>

      <div className="-my-2 flex justify-center">
        <div className="h-[34px] w-0.5 bg-gradient-to-b from-slate-950 to-blue-600" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_24px_48px_-24px_rgba(15,23,42,0.18)] motion-safe:animate-[about-floaty_5s_ease-in-out_infinite] dark:border-white/10">
        <svg viewBox="0 0 400 150" className="h-[150px] w-full">
          <defs>
            <marker
              id="about-hero-arrow"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L8,4 L0,8 z" fill="#2563EB" />
            </marker>
          </defs>
          <path
            d="M96 75 H150"
            stroke="#2563EB"
            strokeWidth="2"
            fill="none"
            markerEnd="url(#about-hero-arrow)"
            className="about-drawline"
            style={{ animationDelay: "0.4s" }}
          />
          <path
            d="M262 75 H316"
            stroke="#2563EB"
            strokeWidth="2"
            fill="none"
            markerEnd="url(#about-hero-arrow)"
            className="about-drawline"
            style={{ animationDelay: "1s" }}
          />
          <g
            className="about-nodepop"
            style={{ animationDelay: "0.1s", transformOrigin: "58px 75px" }}
          >
            <rect
              x="20"
              y="53"
              width="76"
              height="44"
              rx="22"
              fill="#EFF4FF"
              stroke="#2563EB"
              strokeWidth="1.5"
            />
            <text
              x="58"
              y="80"
              textAnchor="middle"
              fontSize="13"
              fontWeight="600"
              fill="#1E40AF"
              fontFamily="var(--font-ui-sans)"
            >
              Code
            </text>
          </g>
          <g
            className="about-nodepop"
            style={{ animationDelay: "0.7s", transformOrigin: "206px 75px" }}
          >
            <rect
              x="154"
              y="53"
              width="104"
              height="44"
              rx="10"
              fill="#0F172A"
            />
            <text
              x="206"
              y="80"
              textAnchor="middle"
              fontSize="13"
              fontWeight="600"
              fill="#FFFFFF"
              fontFamily="var(--font-ui-sans)"
            >
              iGram
            </text>
          </g>
          <g
            className="about-nodepop"
            style={{ animationDelay: "1.3s", transformOrigin: "349px 75px" }}
          >
            <rect
              x="320"
              y="53"
              width="58"
              height="44"
              rx="8"
              fill="#ECFDF5"
              stroke="#10B981"
              strokeWidth="1.5"
            />
            <text
              x="349"
              y="80"
              textAnchor="middle"
              fontSize="12"
              fontWeight="600"
              fill="#047857"
              fontFamily="var(--font-ui-sans)"
            >
              SVG
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
}
