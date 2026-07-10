import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { MermaidThemePanel } from "@/features/workspace/components/mermaid-theme-panel";
import { getMermaidThemeConfig } from "@/features/rendering/mermaid-theme";

const FLOWCHART = "flowchart LR\n  A --> B";
const CUSTOMIZED = `%%{init: {"theme":"base","themeVariables":{"primaryColor":"#111111","lineColor":"#222222"}}}%%\n${FLOWCHART}`;

afterEach(cleanup);

function openPanel() {
  fireEvent.click(screen.getByRole("button", { name: /colors/i }));
}

describe("MermaidThemePanel reset / preset / clear", () => {
  it("applies a preset as a coherent set of base theme variables", () => {
    const onSourceChange = vi.fn();
    render(
      <MermaidThemePanel source={FLOWCHART} onSourceChange={onSourceChange} />,
    );
    openPanel();

    fireEvent.click(screen.getByRole("button", { name: "Ocean" }));

    const next = onSourceChange.mock.calls[0][0] as string;
    const config = getMermaidThemeConfig(next);
    expect(config.theme).toBe("base");
    expect(config.themeVariables.primaryColor).toBe("#e0f2fe");
    expect(config.themeVariables.lineColor).toBe("#0369a1");
  });

  it("applies the Draw.io preset (white fills, black borders and text)", () => {
    const onSourceChange = vi.fn();
    render(
      <MermaidThemePanel source={FLOWCHART} onSourceChange={onSourceChange} />,
    );
    openPanel();

    fireEvent.click(screen.getByRole("button", { name: "Draw.io" }));

    const next = onSourceChange.mock.calls[0][0] as string;
    const config = getMermaidThemeConfig(next);
    expect(config.theme).toBe("base");
    expect(config.themeVariables.primaryColor).toBe("#ffffff");
    expect(config.themeVariables.mainBkg).toBe("#ffffff");
    expect(config.themeVariables.primaryBorderColor).toBe("#000000");
    expect(config.themeVariables.primaryTextColor).toBe("#000000");
    expect(config.themeVariables.lineColor).toBe("#000000");
  });

  it("stays open when clicking inside the portaled base-theme select popup", () => {
    render(<MermaidThemePanel source={FLOWCHART} onSourceChange={vi.fn()} />);
    openPanel();
    expect(screen.getByRole("dialog")).toBeTruthy();

    // Base UI portals the select options to <body>, outside the panel DOM.
    const portaledOption = document.createElement("div");
    portaledOption.setAttribute("data-slot", "select-content");
    document.body.appendChild(portaledOption);
    fireEvent.mouseDown(portaledOption);

    expect(screen.queryByRole("dialog")).toBeTruthy();

    // A genuine outside mousedown still closes the panel.
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("dialog")).toBeNull();

    portaledOption.remove();
  });

  it("resets a single variable to its default (removes the override)", () => {
    const onSourceChange = vi.fn();
    render(
      <MermaidThemePanel source={CUSTOMIZED} onSourceChange={onSourceChange} />,
    );
    openPanel();

    fireEvent.click(screen.getByRole("button", { name: "Reset Primary" }));

    const next = onSourceChange.mock.calls[0][0] as string;
    const { themeVariables } = getMermaidThemeConfig(next);
    expect(themeVariables.primaryColor).toBeUndefined();
    expect(themeVariables.lineColor).toBe("#222222");
  });

  it("resets all colors, removing the directive", () => {
    const onSourceChange = vi.fn();
    render(
      <MermaidThemePanel source={CUSTOMIZED} onSourceChange={onSourceChange} />,
    );
    openPanel();

    fireEvent.click(screen.getByRole("button", { name: "Reset colors" }));

    expect(onSourceChange.mock.calls[0][0]).toBe(FLOWCHART);
  });

  it("clears the theme entirely back to the app default", () => {
    const onSourceChange = vi.fn();
    render(
      <MermaidThemePanel source={CUSTOMIZED} onSourceChange={onSourceChange} />,
    );
    openPanel();

    fireEvent.click(screen.getByRole("button", { name: "Clear theme" }));

    expect(onSourceChange.mock.calls[0][0]).toBe(FLOWCHART);
  });

  it("disables reset/clear when there is no customization", () => {
    render(<MermaidThemePanel source={FLOWCHART} onSourceChange={vi.fn()} />);
    openPanel();

    expect(
      (
        screen.getByRole("button", {
          name: "Reset colors",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(
      (screen.getByRole("button", { name: "Clear theme" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });
});
