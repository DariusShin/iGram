import Mermaid from "@/components/mermaid";

export default function DraftMermaid({ chart }: { chart: string }) {
  return (
    <main className="min-h-screen p-24 bg-slate-50">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Next.js Mermaid.js Implementation
      </h1>
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-md p-6">
        <Mermaid chart={chart} />
      </div>
    </main>
  );
}
