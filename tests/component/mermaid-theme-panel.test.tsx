import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { MermaidThemePanel } from "@/features/workspace/components/mermaid-theme-panel";

const FLOWCHART = "flowchart LR\n  A --> B";
const SEQUENCE = "sequenceDiagram\n  A->>B: hi";

afterEach(cleanup);

function openPanel() {
  fireEvent.click(screen.getByRole("button", { name: /colors/i }));
}

describe("MermaidThemePanel", () => {
  it("writes a color change into the source as an %%{init}%% directive", () => {
    const onSourceChange = vi.fn();
    render(
      <MermaidThemePanel source={FLOWCHART} onSourceChange={onSourceChange} />,
    );
    openPanel();

    fireEvent.change(screen.getByLabelText("Primary color picker"), {
      target: { value: "#ff0000" },
    });

    expect(onSourceChange).toHaveBeenCalledTimes(1);
    const next = onSourceChange.mock.calls[0][0] as string;
    expect(next).toContain("%%{init:");
    expect(next).toContain('"primaryColor":"#ff0000"');
    expect(next).toContain('"theme":"base"');
  });

  it("commits a valid hex typed into the text field but not an invalid one", () => {
    const onSourceChange = vi.fn();
    render(
      <MermaidThemePanel source={FLOWCHART} onSourceChange={onSourceChange} />,
    );
    openPanel();

    const hexInput = screen.getByLabelText("Line hex value");

    fireEvent.change(hexInput, { target: { value: "red" } });
    expect(onSourceChange).not.toHaveBeenCalled();
    expect(hexInput.getAttribute("aria-invalid")).toBe("true");

    fireEvent.change(hexInput, { target: { value: "#00ff00" } });
    expect(onSourceChange).toHaveBeenCalledTimes(1);
    expect(onSourceChange.mock.calls[0][0]).toContain('"lineColor":"#00ff00"');
  });

  it("surfaces only the active diagram type's specific controls", () => {
    const { rerender } = render(
      <MermaidThemePanel source={FLOWCHART} onSourceChange={vi.fn()} />,
    );
    openPanel();

    // Common + flowchart controls, but not sequence controls.
    expect(screen.getByLabelText("Primary color picker")).toBeTruthy();
    expect(screen.getByLabelText("Node border color picker")).toBeTruthy();
    expect(screen.queryByLabelText("Actor background color picker")).toBeNull();

    rerender(<MermaidThemePanel source={SEQUENCE} onSourceChange={vi.fn()} />);

    expect(screen.getByLabelText("Actor background color picker")).toBeTruthy();
    expect(screen.queryByLabelText("Node border color picker")).toBeNull();
  });

  it("reflects existing directive values in the controls", () => {
    const source = `%%{init: {"theme":"base","themeVariables":{"primaryColor":"#123456"}}}%%\n${FLOWCHART}`;
    render(<MermaidThemePanel source={source} onSourceChange={vi.fn()} />);
    openPanel();

    const hexInput = screen.getByLabelText(
      "Primary hex value",
    ) as HTMLInputElement;
    expect(hexInput.value).toBe("#123456");
  });
});
