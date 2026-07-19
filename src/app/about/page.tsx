import type { Metadata } from "next";

import { AboutPage } from "@/features/about/about-page";

export const metadata: Metadata = {
  title: "About iGram | Diagram ideas clearly",
  description:
    "Meet iGram, a focused Mermaid and PlantUML workspace built to turn diagram source into clear, shareable visuals.",
  openGraph: {
    title: "About iGram",
    description:
      "A focused Mermaid and PlantUML workspace for clear technical thinking.",
  },
};

export default function About() {
  return <AboutPage />;
}
