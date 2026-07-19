"use client";

import { useId, useState } from "react";
import { Minus, Plus } from "lucide-react";

import { ScrollReveal } from "@/features/about/components/scroll-motion";
import { cn } from "@/lib/utils";

type FaqItem = {
  answer: string;
  question: string;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Is iGram free?",
    answer:
      "Yes — completely free: no account, no sign-up, no server-side storage. Your drafts live in your own browser.",
  },
  {
    question: "Where does my diagram code go?",
    answer:
      "Mermaid renders entirely in your browser — the source never leaves your machine. PlantUML source is sent through our server route to the official public PlantUML server, so avoid confidential content in PlantUML diagrams.",
  },
  {
    question: "What can I export?",
    answer:
      "SVG (vector, best for documents), PNG (raster, best for slides), and a standalone HTML page containing the sanitized diagram. Exports are only enabled when the preview matches your current source.",
  },
  {
    question: "Will I lose work if I close the tab?",
    answer:
      "No. iGram keeps an independent local draft for each language and restores both when you return — no account needed.",
  },
  {
    question: "Can iGram fix my broken diagram code?",
    answer:
      "Not yet. iGram shows precise, friendly error messages so you can fix issues yourself. AI-assisted repair and Mermaid to PlantUML conversion are planned next.",
  },
];

export function AboutFaq() {
  const [openIndex, setOpenIndex] = useState(0);
  const baseId = useId();

  return (
    <section
      id="faq"
      className="border-t border-border bg-blue-50/40 py-20 sm:py-24 dark:bg-slate-900/40"
      aria-labelledby="faq-title"
    >
      <div className="mx-auto max-w-[820px] px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <p className="text-[13px] font-bold tracking-[0.1em] text-blue-600 dark:text-blue-300">
            FAQ
          </p>
          <h2
            id="faq-title"
            className="mt-3 text-4xl font-extrabold tracking-tight sm:text-[38px]"
          >
            Common questions
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={60} className="mt-9 flex flex-col gap-3">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            const panelId = `${baseId}-panel-${index}`;
            const buttonId = `${baseId}-button-${index}`;

            return (
              <article
                key={item.question}
                className={cn(
                  "overflow-hidden rounded-[14px] border bg-card shadow-sm transition-colors",
                  isOpen
                    ? "border-blue-200 dark:border-blue-400/40"
                    : "border-border",
                )}
              >
                <button
                  id={buttonId}
                  type="button"
                  className="flex min-h-16 w-full cursor-pointer items-center gap-4 px-6 py-5 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-blue-500/35"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                >
                  <span className="flex-1 text-[15.5px] font-semibold tracking-normal">
                    {item.question}
                  </span>
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full transition-colors",
                      isOpen
                        ? "bg-blue-600 text-white"
                        : "bg-muted text-muted-foreground",
                    )}
                    aria-hidden="true"
                  >
                    {isOpen ? (
                      <Minus className="size-3.5" />
                    ) : (
                      <Plus className="size-3.5" />
                    )}
                  </span>
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={cn(
                    "grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 text-[14.5px] leading-relaxed text-muted-foreground">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </ScrollReveal>
      </div>
    </section>
  );
}
