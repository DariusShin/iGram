import { beforeEach, vi } from "vitest";

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("PLANTUML_SERVER_URL", "http://plantuml.test/plantuml");
  vi.stubEnv("PLANTUML_RENDER_TIMEOUT_MS", "1000");
  vi.stubEnv("PLANTUML_MAX_SOURCE_BYTES", "102400");
  vi.stubEnv("PLANTUML_MAX_RESPONSE_BYTES", "5242880");
});
