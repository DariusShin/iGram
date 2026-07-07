"use client";

import { useState, useEffect, useRef } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import initEditor from "monaco-mermaid";
import mermaid from "mermaid";
import {
  Sparkles,
  ChevronDown,
  Copy,
  Check,
  Download,
  ZoomIn,
  ZoomOut,
  AlertCircle,
  FileCode,
  Layers,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// Initialize Mermaid core configurations
mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  suppressErrorRendering: true,
});

const TEMPLATES = [
  {
    name: "Flowchart",
    desc: "Process flows, decision trees, and workflows",
    code: `graph TD
    A[Start Project] --> B{Are requirements clear?}
    B -- Yes --> C[Start Development]
    B -- No --> D[Conduct workshops]
    D --> B
    C --> E[Testing Phase]
    E --> F[Production Release]`,
  },
  {
    name: "Sequence Diagram",
    desc: "Interaction sequence between systems/users",
    code: `sequenceDiagram
    autonumber
    actor User
    participant App as Web Application
    participant API as Backend Service
    participant DB as SQL Database

    User->>App: Click 'Sync Data'
    App->>+API: POST /api/v1/sync
    API->>+DB: INSERT INTO transactions
    DB-->>-API: Complete (ID: 4819)
    API-->>-App: 201 Created (Success)
    App-->>User: Show Sync Success Toast`,
  },
  {
    name: "State Diagram",
    desc: "Lifecycle and transitions of a state machine",
    code: `stateDiagram-v2
    [*] --> Idle
    
    state ActiveSession {
        [*] --> Browsing
        Browsing --> ShoppingCart : Add Item
        ShoppingCart --> Checkout : Place Order
        Checkout --> Browsing : Continue
    }

    Idle --> ActiveSession : User Login
    ActiveSession --> Idle : User Logout
    ActiveSession --> Suspended : Security Timeout
    Suspended --> ActiveSession : Re-authenticate`,
  },
  {
    name: "Class Diagram",
    desc: "Object-oriented structures and relationships",
    code: `classDiagram
    class Vehicle {
        +String brand
        +int year
        +startEngine() void
    }
    class Car {
        +int doorCount
        +openTrunk() void
    }
    class Motorcycle {
        +boolean hasSidecar
        +popWheelie() void
    }
    Vehicle <|-- Car
    Vehicle <|-- Motorcycle`,
  },
  {
    name: "Gantt Chart",
    desc: "Project scheduling, timelines, and milestones",
    code: `gantt
    title Product Launch Timeline
    dateFormat YYYY-MM-DD
    section Strategy
    Market Research  :done, des1, 2026-07-01, 2026-07-05
    Product Design   :active, des2, 2026-07-05, 10d
    section Coding
    Frontend MVP     :after des2, 14d
    Backend Core     :after des2, 12d
    section Launch
    Beta Testing     :2026-07-28, 7d
    Public Launch    :2026-08-05, 1d`,
  },
  {
    name: "Mindmap",
    desc: "Brainstorming and hierarchical nodes",
    code: `mindmap
  root((Developer Tools))
    Editor
      Monaco
      VS Code
      Neovim
    Framework
      Next.js
      React
      Vite
    Styling
      Tailwind CSS
      PostCSS`,
  },
];

export default function MermaidEditor() {
  const [code, setCode] = useState(TEMPLATES[0].code);
  const [svgHtml, setSvgHtml] = useState("");
  const [error, setError] = useState("");
  const [isRendering, setIsRendering] = useState(false);

  // Custom interactive controls
  const [zoom, setZoom] = useState(1.0);
  const [previewBg, setPreviewBg] = useState<
    "grid-dark" | "grid-light" | "white" | "dark"
  >("grid-light");
  const [copiedType, setCopiedType] = useState<"svg" | "code" | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);
  const renderId = useRef(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowTemplates(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Configure Monaco with Mermaid grammar before it mounts
  const handleEditorWillMount = (monaco: Monaco) => {
    try {
      initEditor(monaco); // Registers 'mermaid' language and themes
    } catch (err) {
      console.error("Failed to initialize monaco-mermaid syntax:", err);
    }
  };

  // Dynamically render Mermaid markdown whenever the editor value updates
  useEffect(() => {
    let active = true;
    const renderDiagram = async () => {
      if (!code.trim()) {
        setSvgHtml("");
        setError("");
        return;
      }

      setIsRendering(true);
      try {
        renderId.current += 1;
        const currentId = `mermaid-svg-${renderId.current}`;

        // Render chart text to valid SVG elements
        const { svg } = await mermaid.render(currentId, code);

        if (active) {
          setSvgHtml(svg);
          setError("");
        }
      } catch (err) {
        if (active) {
          // Extract error message reliably
          let errMsg = "Invalid Mermaid syntax";
          if (err instanceof Error) {
            errMsg = err.message;
          } else if (typeof err === "string") {
            errMsg = err;
          } else if (
            err &&
            typeof err === "object" &&
            "str" in err &&
            typeof (err as { str: unknown }).str === "string"
          ) {
            errMsg = (err as { str: string }).str;
          }
          setError(errMsg);
          setSvgHtml(""); // Clear previous preview on syntax error
        }
      } finally {
        if (active) {
          setIsRendering(false);
        }
      }
    };

    // Debounce rendering to prevent extreme UI lag on every keystroke
    const debounceTimeout = setTimeout(renderDiagram, 300);
    return () => {
      active = false;
      clearTimeout(debounceTimeout);
    };
  }, [code]);

  // Actions
  const handleCopySvg = () => {
    if (!svgHtml) return;
    navigator.clipboard.writeText(svgHtml);
    setCopiedType("svg");
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopiedType("code");
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleDownloadSvg = () => {
    if (!svgHtml) return;
    const blob = new Blob([svgHtml], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mermaid-diagram.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const selectTemplate = (templateCode: string) => {
    setCode(templateCode);
    setShowTemplates(false);
    setZoom(1.0); // Reset zoom on new template
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      {/* HEADER BANNER */}
      <header className="flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-900/60 px-6 backdrop-blur-md z-30 select-none">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 shadow-lg shadow-indigo-600/20 text-white font-bold text-lg">
            <Workflow className="size-5" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide text-zinc-100">
              iGram Mermaid
            </h1>
            <p className="text-[10px] text-zinc-400 font-mono">
              Live Collaborative Editor v2
            </p>
          </div>
        </div>

        {/* STATUS BADGE */}
        <div className="flex items-center gap-2">
          {isRendering ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400 border border-amber-500/20 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Rendering...
            </span>
          ) : error ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 border border-red-500/20">
              <AlertCircle className="size-3.5" />
              Syntax Error
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Synced
            </span>
          )}
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-2.5">
          {/* Template Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-1.5 text-xs font-medium text-zinc-200 transition-all hover:bg-zinc-700 hover:border-zinc-600 active:scale-95 cursor-pointer"
            >
              <Sparkles className="size-3.5 text-indigo-400" />
              <span>Templates</span>
              <ChevronDown
                className={cn(
                  "size-3.5 transition-transform duration-200",
                  showTemplates && "rotate-180",
                )}
              />
            </button>

            {showTemplates && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Select Sample
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.name}
                      onClick={() => selectTemplate(tmpl.code)}
                      className="w-full text-left px-3 py-2 rounded-lg text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors flex flex-col gap-0.5 cursor-pointer"
                    >
                      <span className="text-xs font-semibold text-zinc-100">
                        {tmpl.name}
                      </span>
                      <span className="text-[10px] text-zinc-400 truncate max-w-full">
                        {tmpl.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-zinc-800" />

          {/* Copy Code */}
          <button
            onClick={handleCopyCode}
            disabled={!code}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-1.5 text-xs font-medium text-zinc-200 transition-all hover:bg-zinc-700 hover:border-zinc-600 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            title="Copy Source Code"
          >
            {copiedType === "code" ? (
              <>
                <Check className="size-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>

          {/* Copy SVG */}
          <button
            onClick={handleCopySvg}
            disabled={!svgHtml || !!error}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3.5 py-1.5 text-xs font-medium text-zinc-200 transition-all hover:bg-zinc-700 hover:border-zinc-600 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            title="Copy Rendered SVG String"
          >
            {copiedType === "svg" ? (
              <>
                <Check className="size-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied SVG!</span>
              </>
            ) : (
              <>
                <FileCode className="size-3.5 text-indigo-400" />
                <span>Copy SVG</span>
              </>
            )}
          </button>

          {/* Download SVG */}
          <button
            onClick={handleDownloadSvg}
            disabled={!svgHtml || !!error}
            className="flex items-center justify-center h-8 w-8 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 hover:border-zinc-600 text-zinc-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
            title="Download SVG File"
          >
            <Download className="size-4" />
          </button>
        </div>
      </header>

      {/* WORKSPACE */}
      <main className="flex flex-1 flex-col md:flex-row overflow-hidden relative">
        {/* LEFT COLUMN: EDITOR */}
        <section className="w-full md:w-1/2 h-[45vh] md:h-full flex flex-col border-b md:border-b-0 md:border-r border-zinc-800 bg-zinc-950">
          <div className="flex h-10 items-center justify-between bg-zinc-900 border-b border-zinc-800 px-4">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-indigo-500" />
              <span className="text-xs font-mono font-medium text-zinc-300">
                diagram.mermaid
              </span>
            </div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider bg-zinc-800 px-2 py-0.5 rounded">
              Editor
            </span>
          </div>

          <div className="flex-1 overflow-hidden py-2 bg-[#1e1e1e]">
            <Editor
              height="100%"
              defaultLanguage="mermaid"
              theme="mermaid-dark"
              value={code}
              onChange={(value) => setCode(value || "")}
              beforeMount={handleEditorWillMount}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily:
                  "Fira Code, JetBrains Mono, source-code-pro, Menlo, Monaco, Consolas, Courier New, monospace",
                automaticLayout: true,
                padding: { top: 8, bottom: 8 },
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                lineNumbersMinChars: 3,
                wordWrap: "on",
              }}
            />
          </div>
        </section>

        {/* RIGHT COLUMN: LIVE DIAGRAM PREVIEW */}
        <section className="w-full md:w-1/2 h-[55vh] md:h-full flex flex-col bg-zinc-900 relative">
          {/* PREVIEW TOOLBAR */}
          <div className="flex h-10 items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 select-none z-10">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-zinc-400" />
              <span className="text-xs font-medium text-zinc-300">
                Live Preview
              </span>
            </div>

            {/* PREVIEW CONTROLS */}
            <div className="flex items-center gap-4">
              {/* Zoom Buttons */}
              <div className="flex items-center bg-zinc-800 border border-zinc-700 rounded-lg p-0.5 text-zinc-300">
                <button
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                  className="p-1 hover:bg-zinc-700 rounded-md active:scale-95 transition-all cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="size-3.5" />
                </button>
                <button
                  onClick={() => setZoom(1.0)}
                  className="px-2 py-0.5 text-[10px] font-mono hover:bg-zinc-700 rounded-md active:scale-95 transition-all cursor-pointer"
                  title="Reset Zoom"
                >
                  {(zoom * 100).toFixed(0)}%
                </button>
                <button
                  onClick={() => setZoom(Math.min(2.5, zoom + 0.1))}
                  className="p-1 hover:bg-zinc-700 rounded-md active:scale-95 transition-all cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="size-3.5" />
                </button>
              </div>

              {/* Background Theme Selector */}
              <div className="flex items-center bg-zinc-800 border border-zinc-700 rounded-lg p-0.5 text-zinc-300">
                <button
                  onClick={() => setPreviewBg("grid-light")}
                  className={cn(
                    "px-2 py-0.5 text-[10px] font-medium rounded-md cursor-pointer transition-all",
                    previewBg === "grid-light"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "hover:bg-zinc-700 text-zinc-400",
                  )}
                >
                  Grid L
                </button>
                <button
                  onClick={() => setPreviewBg("grid-dark")}
                  className={cn(
                    "px-2 py-0.5 text-[10px] font-medium rounded-md cursor-pointer transition-all",
                    previewBg === "grid-dark"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "hover:bg-zinc-700 text-zinc-400",
                  )}
                >
                  Grid D
                </button>
                <button
                  onClick={() => setPreviewBg("white")}
                  className={cn(
                    "px-2 py-0.5 text-[10px] font-medium rounded-md cursor-pointer transition-all",
                    previewBg === "white"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "hover:bg-zinc-700 text-zinc-400",
                  )}
                >
                  White
                </button>
                <button
                  onClick={() => setPreviewBg("dark")}
                  className={cn(
                    "px-2 py-0.5 text-[10px] font-medium rounded-md cursor-pointer transition-all",
                    previewBg === "dark"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "hover:bg-zinc-700 text-zinc-400",
                  )}
                >
                  Dark
                </button>
              </div>
            </div>
          </div>

          {/* RENDER CANVAS CONTAINER */}
          <div className="flex-1 overflow-auto p-6 md:p-8 flex flex-col items-center justify-center bg-zinc-950 relative">
            {error && (
              <div className="w-full max-w-xl mb-6 animate-in fade-in slide-in-from-top-2 duration-300 z-20">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Syntax Error</AlertTitle>
                  <AlertDescription className="font-mono mt-1.5 whitespace-pre-wrap break-all leading-normal text-[11px] bg-red-950/20 p-2 rounded border border-red-900/30">
                    {error}
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {svgHtml ? (
              <div
                className="overflow-auto max-h-full max-w-full flex items-center justify-center p-4"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "center center",
                  transition: "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              >
                <div
                  ref={previewRef}
                  className={cn(
                    "p-8 rounded-xl border max-w-full flex items-center justify-center transition-all duration-300",
                    previewBg === "grid-light" &&
                      "bg-zinc-50 border-zinc-200 shadow-xl shadow-black/10 `bg-[linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]`",
                    previewBg === "grid-dark" &&
                      "bg-zinc-900/60 border-zinc-800 shadow-2xl `bg-[linear-gradient(to_right,#27272a_0.8px,transparent_0.8px),linear-gradient(to_bottom,#27272a_0.8px,transparent_0.8px)]`",
                    previewBg === "white" &&
                      "bg-white border-zinc-200 shadow-xl shadow-black/5 text-zinc-900",
                    previewBg === "dark" &&
                      "bg-zinc-900 border-zinc-800 shadow-2xl",
                  )}
                  dangerouslySetInnerHTML={{ __html: svgHtml }}
                />
              </div>
            ) : (
              !error && (
                <div className="flex flex-col items-center justify-center gap-3 text-zinc-500 max-w-xs text-center select-none">
                  <Workflow className="size-10 text-zinc-700 animate-pulse" />
                  <p className="text-sm font-medium">No diagram parsed yet.</p>
                  <p className="text-xs text-zinc-600">
                    Start typing in the editor or choose a template to begin
                    rendering.
                  </p>
                </div>
              )
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
