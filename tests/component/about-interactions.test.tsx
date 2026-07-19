import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { AboutFaq } from "@/features/about/components/about-faq";
import { AboutMascot } from "@/features/about/components/about-mascot";
import { WorkflowExplorer } from "@/features/about/components/workflow-explorer";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("About page interactions", () => {
  it("switches the lifecycle details from Mermaid to PlantUML", async () => {
    render(<WorkflowExplorer />);

    fireEvent.click(screen.getByRole("tab", { name: /PlantUML/ }));

    expect(
      await screen.findByText(
        "The browser posts to /api/plantuml/render and never to the public server directly.",
      ),
    ).toBeTruthy();
    expect(screen.getByText(/official PlantUML server/)).toBeTruthy();
  });

  it("expands a FAQ item and updates the expanded state", () => {
    render(<AboutFaq />);

    const exportButton = screen.getByRole("button", {
      name: /What can I export/,
    });
    fireEvent.click(exportButton);

    expect(exportButton.getAttribute("aria-expanded")).toBe("true");
    expect(
      screen.getByText(/standalone HTML page containing the sanitized diagram/),
    ).toBeTruthy();
  });

  it("cycles Node's message when clicked", () => {
    render(<AboutMascot />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Talk to Node the flowchart buddy",
      }),
    );

    expect(
      screen.getByText("Fun fact: I only connect to well-formed syntax."),
    ).toBeTruthy();
  });
});
