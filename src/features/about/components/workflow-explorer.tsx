"use client";

import { TriangleAlert } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollReveal } from "@/features/about/components/scroll-motion";

type WorkflowMode = {
  id: "mermaid" | "plantuml";
  label: string;
  steps: WorkflowStep[];
};

type WorkflowStep = {
  copy: string;
  title: string;
};

const WORKFLOW_MODES: WorkflowMode[] = [
  {
    id: "mermaid",
    label: "Mermaid — in browser",
    steps: [
      {
        title: "Paste or type",
        copy: "Drop Mermaid source into the Monaco editor. Your draft autosaves locally.",
      },
      {
        title: "Debounced render",
        copy: "Stop typing and iGram renders in your browser — nothing is sent anywhere.",
      },
      {
        title: "Sanitize",
        copy: "The generated SVG is sanitized before it ever touches the preview canvas.",
      },
      {
        title: "Inspect & export",
        copy: "Zoom 50–200%, fit to view, then export SVG, PNG, or standalone HTML.",
      },
    ],
  },
  {
    id: "plantuml",
    label: "PlantUML — via server",
    steps: [
      {
        title: "Paste or type",
        copy: "Drop PlantUML source into the editor. A separate local draft is kept for it.",
      },
      {
        title: "Secure route",
        copy: "The browser posts to /api/plantuml/render and never to the public server directly.",
      },
      {
        title: "Official renderer",
        copy: "The server encodes your source and fetches the image from the official PlantUML server, with timeouts and validation.",
      },
      {
        title: "Inspect & export",
        copy: "The validated result lands in the same preview with the same zoom and export tools.",
      },
    ],
  },
];

export function WorkflowExplorer() {
  return (
    <section
      id="how"
      className="border-y border-border bg-blue-50/40 py-20 sm:py-24 dark:bg-slate-900/40"
      aria-labelledby="workflow-title"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="max-w-2xl">
          <p className="text-[13px] font-bold tracking-[0.1em] text-blue-600 dark:text-blue-300">
            HOW IT WORKS
          </p>
          <h2
            id="workflow-title"
            className="mt-3.5 text-4xl font-extrabold leading-tight tracking-tight sm:text-[38px]"
          >
            Two languages, two pipelines, one preview
          </h2>
          <p className="mt-3.5 text-[16.5px] leading-relaxed text-muted-foreground">
            Mermaid renders instantly in your browser. PlantUML travels through
            a secure server route to the official renderer. Switch below to
            trace each path.
          </p>
        </ScrollReveal>

        <Tabs defaultValue="mermaid" className="mt-10 gap-0">
          <ScrollReveal delay={40}>
            <TabsList
              aria-label="Rendering workflow"
              className="h-auto w-full rounded-xl bg-slate-200/70 p-1 group-data-horizontal/tabs:h-auto sm:w-fit dark:bg-slate-800/70"
            >
              {WORKFLOW_MODES.map((mode) => (
                <TabsTrigger
                  key={mode.id}
                  value={mode.id}
                  className="min-h-10 cursor-pointer rounded-[9px] px-5 py-2 text-sm font-semibold data-active:bg-background data-active:shadow-sm"
                >
                  {mode.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </ScrollReveal>

          {WORKFLOW_MODES.map((mode) => (
            <TabsContent key={mode.id} value={mode.id} className="mt-8">
              <ScrollReveal>
                <ol className="grid overflow-hidden rounded-2xl border border-border bg-card shadow-sm max-lg:divide-y max-lg:divide-border lg:grid-cols-4 lg:divide-x lg:divide-border">
                  {mode.steps.map((step, index) => (
                    <li key={step.title} className="flex flex-col gap-2.5 p-6">
                      <span
                        className="flex size-[30px] items-center justify-center rounded-full bg-slate-950 text-[13px] font-bold text-white dark:bg-white dark:text-slate-950"
                        aria-hidden="true"
                      >
                        {index + 1}
                      </span>
                      <h3 className="text-[15.5px] font-bold tracking-normal">
                        {step.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {step.copy}
                      </p>
                    </li>
                  ))}
                </ol>
              </ScrollReveal>
            </TabsContent>
          ))}
        </Tabs>

        <ScrollReveal delay={80} className="mt-8 max-w-3xl">
          <p className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-relaxed text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
            <TriangleAlert
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <span>
              <strong>Privacy note:</strong> PlantUML rendering uses the public
              PlantUML server. Don&apos;t paste confidential or personal diagram
              content — Mermaid never leaves your browser.
            </span>
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
