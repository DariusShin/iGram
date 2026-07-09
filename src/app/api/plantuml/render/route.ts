import {
  plantUmlJsonError,
  PlantUmlRenderError,
  toPlantUmlError,
} from "@/lib/plantuml/errors";
import { renderPlantUmlFromPayload } from "@/lib/plantuml/renderer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return plantUmlJsonError(new PlantUmlRenderError("INVALID_REQUEST"));
  }

  try {
    const result = await renderPlantUmlFromPayload(payload);
    return new Response(toResponseBody(result.body), {
      status: 200,
      headers: {
        "Content-Type": result.contentType,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return plantUmlJsonError(toPlantUmlError(error));
  }
}

function toResponseBody(body: string | Uint8Array): BodyInit {
  if (typeof body === "string") return body;

  return body.buffer.slice(
    body.byteOffset,
    body.byteOffset + body.byteLength,
  ) as ArrayBuffer;
}
