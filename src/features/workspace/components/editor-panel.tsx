"use client";

import Editor, { Monaco } from "@monaco-editor/react";
import initEditor from "monaco-mermaid";
import { AlertCircle, ShieldAlert } from "lucide-react";

import type { DiagramLanguage } from "@/features/workspace/types";

interface EditorPanelProps {
  language: DiagramLanguage;
  code: string;
  error: string;
  onCodeChange: (value?: string) => void;
  onRetry: () => void;
}

function handleEditorWillMount(monaco: Monaco) {
  try {
    initEditor(monaco);
  } catch (err) {
    console.error("Failed to initialize monaco-mermaid syntax:", err);
  }
}

export function EditorPanel({
  language,
  code,
  error,
  onCodeChange,
  onRetry,
}: EditorPanelProps) {
  return (
    <section className="flex min-h-0 flex-col border-b border-slate-200 bg-[#181b22] dark:border-slate-800 md:border-b-0 md:border-r">
      <div className="flex-1 overflow-hidden">
        <Editor
          key={language}
          height="100%"
          defaultLanguage={language === "mermaid" ? "mermaid" : "text"}
          language={language === "mermaid" ? "mermaid" : "text"}
          theme="mermaid-dark"
          value={code}
          onChange={onCodeChange}
          beforeMount={handleEditorWillMount}
          options={{
            minimap: { enabled: false },
            fontSize: 15,
            fontFamily:
              "JetBrains Mono, Fira Code, source-code-pro, Menlo, Monaco, Consolas, Courier New, monospace",
            automaticLayout: true,
            padding: { top: 22, bottom: 22 },
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            lineNumbersMinChars: 3,
            lineHeight: 24,
            wordWrap: "on",
            scrollBeyondLastLine: false,
          }}
        />
      </div>

      {language === "plantuml" && (
        <div className="border-t border-blue-400/20 bg-blue-950/30 px-5 py-3 text-xs leading-5 text-blue-50/85">
          <div className="flex items-start gap-2">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-blue-200" />
            <p>
              PlantUML source is sent through this app to the official public
              PlantUML server. Do not submit confidential diagrams during Phase
              1.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="border-t border-red-500/30 bg-red-950/35 px-5 py-4 text-red-100">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-bold text-red-100">
              <span className="flex size-6 items-center justify-center rounded-full bg-red-500 text-white">
                <AlertCircle className="size-4" />
              </span>
              Render error
            </div>
            <button
              type="button"
              onClick={onRetry}
              className="rounded-md border border-red-200/30 px-2.5 py-1 text-xs font-bold text-red-50 transition hover:bg-red-500/20"
            >
              Retry
            </button>
          </div>
          <p className="mt-2 max-h-24 overflow-auto whitespace-pre-wrap pl-8 font-mono text-xs leading-5 text-red-100/85">
            {error}
          </p>
        </div>
      )}
    </section>
  );
}
