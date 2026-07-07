import Mermaid from "@/components/mermaid";

export default function DraftMermaid() {
  const sampleChart = `
    graph TD;
      subgraph AA [Consumers]
      A[Mobile app];
      B[Web app];
      C[Node.js client];
      end
      subgraph BB [Services]
      E[REST API];
      F[GraphQL API];
      G[SOAP API];
      end
      Z[GraphQL API];
      A --> Z;
      B --> Z;
      C --> Z;
      Z --> E;
      Z --> F;
      Z --> G;
  `;

  return (
    <main className="min-h-screen p-24 bg-slate-50">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Next.js Mermaid.js Implementation
      </h1>
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-md p-6">
        <Mermaid chart={sampleChart} />
      </div>
    </main>
  );
}
