# GUIDE.md — AI Coding Agent Instructions

## 1. Purpose

This file is the operating guide for an AI coding agent building the **Phase 1 prototype** of the web-based Mermaid and PlantUML diagram editor and previewer described in `DESIGN.md`.

The working product name is **DiagramLens**. The name is provisional and must be easy to replace through centralized application metadata.

The agent must deliver a reliable, testable prototype rather than a visual-only mock-up. Every implemented feature must work end to end.

---

## 2. Source of Truth and Priority

When instructions conflict, use this priority order:

1. Explicit instructions from the human project owner.
2. `DESIGN.md` acceptance criteria and functional requirements.
3. This `GUIDE.md` implementation workflow and coding rules.
4. Existing repository conventions and automated tests.
5. Reasonable engineering judgment.

Do not silently change requirements. Record necessary deviations in the completion report and in an Architecture Decision Record under `docs/decisions/`.

### 2.1 Authoritative Phase 1 PlantUML architecture override

For PlantUML deployment and rendering infrastructure, this `GUIDE.md` is authoritative over any earlier self-hosted, Docker, internal-server, or `SANDBOX` statements that remain in `DESIGN.md`.

The Phase 1 implementation must use the official public PlantUML Web Server through the application's Next.js Route Handler. It must not deploy or require a PlantUML container. All other applicable product, UI, functional, and acceptance requirements in `DESIGN.md` remain in effect.

---

## 3. Phase 1 Product Boundary

### 3.1 Features that must be implemented

- A web-based source editor and live diagram previewer.
- Separate Mermaid and PlantUML modes.
- Split-screen layout on desktop: editor on the left, preview on the right.
- Responsive stacked layout on smaller screens.
- Editable starter examples for both diagram languages.
- Automatic debounced rendering after code changes.
- Manual render or retry action.
- Preview zoom from **50% to 200%**.
- Reset zoom and fit-to-view actions.
- Clear loading, success, empty, and error states.
- Export of the current valid diagram as:
  - SVG
  - PNG
  - Standalone HTML
- Local browser draft persistence for each diagram language.
- Keyboard-accessible controls and responsive behavior.
- Unit, component, API, and end-to-end tests for critical flows.

### 3.2 Features that must not be implemented in Phase 1

- LLM or generative AI integration.
- Mermaid-to-PlantUML or PlantUML-to-Mermaid conversion.
- AI-assisted code repair or explanation.
- User accounts, authentication, or authorization.
- Cloud project storage or collaboration.
- Database persistence.
- Real-time multi-user editing.
- Diagram version history.
- Billing, subscriptions, analytics tracking, or advertisements.
- Arbitrary file, URL, or network includes from PlantUML source.

Keep extension points clean for Phase 2, but do not build speculative Phase 2 screens or inactive buttons.

---

## 4. Required Technology Baseline

Use the following baseline unless the human project owner explicitly changes it:

| Area | Required choice |
|---|---|
| Framework | Next.js 16 App Router |
| Language | TypeScript with strict mode |
| UI | React 19, Tailwind CSS 4, shadcn/ui primitives |
| Editor | Monaco Editor through a maintained React wrapper |
| Validation | Zod |
| Client state | Zustand for editor/preview state; component state for isolated UI state |
| Mermaid rendering | `mermaid` package, executed in the browser |
| PlantUML rendering | Official public PlantUML Web Server accessed through a Next.js Route Handler |
| PlantUML encoding | A maintained encoder compatible with PlantUML's encoded URL format |
| External service | `https://www.plantuml.com/plantuml` by default; no self-hosted renderer in Phase 1 |
| SVG sanitization | DOMPurify or an equivalent well-maintained sanitizer |
| Unit/component tests | Vitest and React Testing Library |
| End-to-end tests | Playwright |
| Package manager | pnpm |
| Code quality | ESLint, Prettier, TypeScript checks |
| Local infrastructure | None required for PlantUML; do not add Docker solely for diagram rendering |

Pin dependency versions in the lockfile. Avoid unnecessary libraries when a small, tested utility is clearer.

---

## 5. Required Repository Structure

Prefer the following structure. Small adaptations are allowed when justified.

```text
.
├── app/
│   ├── api/
│   │   └── plantuml/
│   │       └── render/
│   │           └── route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── editor/
│   │   ├── code-editor.tsx
│   │   └── editor-toolbar.tsx
│   ├── preview/
│   │   ├── preview-canvas.tsx
│   │   ├── preview-error.tsx
│   │   ├── preview-toolbar.tsx
│   │   └── render-status.tsx
│   ├── workspace/
│   │   ├── diagram-tabs.tsx
│   │   ├── export-menu.tsx
│   │   └── workspace-shell.tsx
│   └── ui/
├── features/
│   ├── diagram/
│   │   ├── diagram.types.ts
│   │   ├── diagram.constants.ts
│   │   ├── diagram.schemas.ts
│   │   └── diagram.store.ts
│   ├── export/
│   │   ├── export-html.ts
│   │   ├── export-png.ts
│   │   └── export-svg.ts
│   └── rendering/
│       ├── mermaid-renderer.client.ts
│       ├── plantuml-client.ts
│       ├── render-error.ts
│       └── sanitize-svg.ts
├── hooks/
│   ├── use-debounced-value.ts
│   ├── use-local-draft.ts
│   └── use-render-diagram.ts
├── lib/
│   ├── download-file.ts
│   ├── environment.ts
│   └── utilities.ts
├── public/
├── tests/
│   ├── e2e/
│   ├── fixtures/
│   └── unit/
├── docs/
│   └── decisions/
├── DESIGN.md
├── GUIDE.md
├── .env.example
└── README.md
```

Do not create generic folders such as `helpers/` or `misc/` without a clear domain purpose.

---

## 6. Agent Work Sequence

Execute the work in vertical slices. Keep the application runnable after every completed slice.

### Step 1 — Inspect and establish the baseline

- Read `GUIDE.md`, `DESIGN.md`, `README.md`, `package.json`, and existing tests.
- Identify existing conventions before adding alternatives.
- Confirm the project runs locally.
- Run lint, type checks, and existing tests before editing.
- Record pre-existing failures separately; do not hide them.

### Step 2 — Set up the application shell

- Create the responsive application frame.
- Add the product header, language tabs, editor pane, preview pane, and toolbar placeholders.
- Implement semantic landmarks and keyboard focus order before visual polishing.

### Step 3 — Implement domain state

- Define the `DiagramLanguage`, `RenderStatus`, `RenderResult`, and `RenderError` types.
- Create independent Mermaid and PlantUML drafts.
- Persist drafts to `localStorage` using versioned keys.
- Preserve each draft when switching tabs.
- Keep zoom and preview state predictable.

### Step 4 — Implement Mermaid rendering

- Load Mermaid only in the browser.
- Initialize it once using strict security settings.
- Parse and render source into SVG.
- Sanitize the SVG before display or export.
- Convert parser failures into the shared error model.
- Prevent stale render responses from replacing newer output.

### Step 5 — Implement PlantUML rendering

- Use the official public PlantUML Web Server documented at `https://plantuml.com/server`.
- Do **not** add a PlantUML Docker container, WAR deployment, Java runtime, or separately hosted rendering service in Phase 1.
- Implement `POST /api/plantuml/render` as a lightweight Next.js Route Handler that is deployed together with the application on Vercel.
- The Route Handler must validate the request, encode the PlantUML source, and fetch only from the configured official PlantUML base URL.
- Build upstream URLs using the documented patterns `/svg/ENCODED` and `/png/ENCODED`.
- Validate request size, source, and output format before contacting the public service.
- Reject remote/local include directives and other externally resolving directives before transmission.
- Apply an upstream timeout, safe error mapping, request cancellation, and bounded retry behavior.
- Do not allow the browser or user input to choose an alternative PlantUML host.
- Do not expose the configured upstream server URL as an editable client setting.
- Display a brief privacy notice explaining that PlantUML source is transmitted to a third-party public rendering service.
- Treat the public server as an external dependency with no application-controlled availability guarantee.

#### Mandatory PlantUML loading behavior

- Set the render state to `rendering` immediately after a valid PlantUML request starts.
- Show the visible status text **“Rendering with PlantUML public server…”** and announce it through a polite `aria-live` region.
- When no previous valid preview exists, show a centered loading indicator or skeleton in the preview canvas.
- When a previous valid preview exists, keep it visible but mark it stale and place a non-blocking loading overlay above it.
- Disable SVG, PNG, and HTML exports while the current PlantUML source is loading or stale.
- Keep the loading state active until both the network response and browser image decoding have completed.
- Clear the loading state only for the latest request; late responses must be ignored.
- On timeout, network failure, malformed media, or image decode failure, show a clear error state with a **Retry** action while preserving the last valid preview when available.

### Step 6 — Implement preview controls

- Support zoom levels from 50% through 200%.
- Use accessible buttons for zoom in, zoom out, reset, and fit.
- Clamp all zoom values.
- Keep the preview centered and scrollable.
- Do not scale the surrounding toolbar or error message.

### Step 7 — Implement exports

- Enable exports only when the latest render is valid.
- Generate SVG from the sanitized render result.
- Generate PNG at readable resolution using an off-screen canvas or server response.
- Generate standalone HTML with no remote scripts and no executable user source.
- Use predictable, safe filenames.
- Revoke temporary object URLs after download.

### Step 8 — Add resilience and accessibility

- Add empty, loading, success, stale, and error states.
- Include an `aria-live` status region.
- Ensure all icon-only controls have accessible names and tooltips.
- Verify full keyboard operation.
- Add clear error messages without exposing internal stack traces.

### Step 9 — Test and harden

- Add unit tests for schemas, zoom clamping, filename generation, sanitizer behavior, and error mapping.
- Add component tests for tab preservation, error display, render status, and disabled export states.
- Add API tests for valid requests, invalid payloads, oversized input, public-server timeout, diagnostic responses, malformed media, and upstream failure.
- Add Playwright tests for the primary Mermaid and PlantUML journeys.
- Run production build and inspect browser/server consoles.

### Step 10 — Document and report

- Update `README.md` with setup, environment, public PlantUML service behavior, privacy limitations, and test instructions.
- Add `.env.example` without secrets.
- Record design deviations as ADRs.
- Provide a concise completion report using the format in Section 18.

---

## 7. Domain Model and State Rules

Use explicit discriminated unions rather than loosely related optional fields.

```ts
export type DiagramLanguage = "mermaid" | "plantuml";
export type ExportFormat = "svg" | "png" | "html";
export type RenderStatus = "idle" | "debouncing" | "rendering" | "success" | "error";

export interface DiagramDraft {
  language: DiagramLanguage;
  source: string;
  updatedAt: number;
}

export interface SuccessfulRender {
  status: "success";
  language: DiagramLanguage;
  sourceHash: string;
  svg: string;
  renderedAt: number;
}

export interface FailedRender {
  status: "error";
  language: DiagramLanguage;
  sourceHash: string;
  error: RenderError;
  renderedAt: number;
}

export type RenderResult = SuccessfulRender | FailedRender;
```

### Mandatory state invariants

- Mermaid and PlantUML source values are stored independently.
- The active preview must correspond to the active language.
- An export must correspond to the latest successfully rendered source hash.
- Editing after a successful render marks the displayed preview as stale until a new render succeeds.
- A failed render must not erase the last valid diagram; show the previous preview with a visible stale/error state when practical.
- A late async response must not overwrite a newer response.
- Zoom is always clamped to `[0.5, 2.0]`.

---

## 8. Rendering Rules

### 8.1 Debounce and concurrency

- Default auto-render debounce: **500 ms** after the most recent source change.
- Do not render whitespace-only source.
- Use `AbortController`, a monotonically increasing request ID, or both.
- The newest request is authoritative.
- Manual render bypasses the remaining debounce delay.

### 8.2 Mermaid

- Import dynamically in a client-only module.
- Initialize once.
- Use a strict security configuration.
- Disable automatic page scanning; call the programmatic render API explicitly.
- Use deterministic identifiers when supported to improve stable tests and exports.
- Sanitize the returned SVG.
- Do not execute source-provided scripts or unsafe HTML.

### 8.3 PlantUML

- Browser requests the application endpoint, never the public PlantUML server directly.
- The application endpoint calls only the configured and allowlisted official PlantUML public-server origin.
- Encode the source using PlantUML's encoded URL format and request `/svg/ENCODED` or `/png/ENCODED`.
- Set a conservative input limit; default **100 KiB** UTF-8.
- Set a default upstream timeout of **10 seconds**.
- Prefer SVG for preview, validation, HTML export, and scalable display.
- Sanitize SVG before DOM insertion or export.
- Reject known local/remote include, import, and external-resource directives before sending source to the public server.
- Reject unsupported output formats, unexpected content types, empty responses, oversized responses, and malformed media.
- Do not assume that an HTTP `200` response always represents a valid diagram; PlantUML can return a diagnostic image for invalid source.
- For SVG preview responses, detect known PlantUML diagnostic/error content and normalize it into the shared render-error model. Keep this detection isolated and tested because public-server diagnostics may evolve.
- Cache or deduplicate identical source-hash and format requests when practical to reduce unnecessary calls to the public service.
- Do not automatically retry syntax errors. A single bounded retry is acceptable only for transient network or `5xx` failures.

### 8.4 PlantUML loading lifecycle

The client must model network fetching and image decoding as one render operation:

1. Mark the current request as authoritative and set status to `rendering`.
2. Show **“Rendering with PlantUML public server…”** in the status region.
3. Fetch the application Route Handler using an `AbortController`.
4. Validate the returned content type and create a Blob/object URL for the image.
5. Keep the loading indicator visible until the preview image fires `load` or `decode()` resolves.
6. Revoke the previous temporary object URL only after the replacement image is ready.
7. Set status to `success` only when the latest image is fully decoded.
8. On failure, revoke unused object URLs, preserve the last valid preview, set status to `error`, and expose Retry.

Exports remain disabled until the current source hash has a fully loaded successful render.

---

## 9. PlantUML API Contract

### Endpoint

`POST /api/plantuml/render`

This is a serverless application proxy to the official public PlantUML Web Server. It does not require Docker or a dedicated backend deployment.

### Request

```json
{
  "source": "@startuml\nAlice -> Bob: Hello\n@enduml",
  "format": "svg"
}
```

### Supported formats

- `svg`
- `png`

HTML export is assembled by the application from a successful SVG result. It is not a PlantUML server output format.

### Successful SVG response

- Status: `200`
- Header: `Content-Type: image/svg+xml; charset=utf-8`
- Body: SVG text

### Successful PNG response

- Status: `200`
- Header: `Content-Type: image/png`
- Body: PNG bytes

### Application error response

```json
{
  "error": {
    "code": "PLANTUML_SYNTAX_ERROR",
    "message": "The PlantUML source could not be rendered.",
    "details": "Optional safe parser detail"
  }
}
```

### Upstream request construction

For an encoded source value named `ENCODED`, the Route Handler uses only these documented upstream URL shapes:

```text
https://www.plantuml.com/plantuml/svg/ENCODED
https://www.plantuml.com/plantuml/png/ENCODED
```

The base URL must come from validated server-side configuration. Never concatenate a host, protocol, or base path supplied by the user.

### Required status mapping

| Condition | HTTP status | Error code |
|---|---:|---|
| Invalid JSON or schema | 400 | `INVALID_REQUEST` |
| Empty source | 400 | `EMPTY_SOURCE` |
| Unsupported format | 400 | `UNSUPPORTED_FORMAT` |
| Source exceeds limit | 413 | `SOURCE_TOO_LARGE` |
| PlantUML diagnostic/syntax response | 422 | `PLANTUML_SYNTAX_ERROR` |
| Public server returns malformed or unexpected media | 502 | `INVALID_RENDER_RESPONSE` |
| Public server timeout | 504 | `RENDER_TIMEOUT` |
| Public server unavailable or rate-limited | 502 | `RENDER_SERVICE_UNAVAILABLE` |
| Unexpected server failure | 500 | `INTERNAL_RENDER_ERROR` |

Do not return stack traces, internal hostnames, filesystem paths, or environment values.

---

## 10. UI and UX Rules

- The editor and preview are equally important; neither should be hidden by default on desktop.
- Use a draggable divider only if it is implemented accessibly. A fixed 50/50 split is acceptable for the prototype.
- Show Mermaid and PlantUML as clear tabs with visible selected state.
- Preserve code on tab changes.
- Display a compact status near the preview: `Ready`, `Rendering`, `Rendered`, `Error`, or `Stale`.
- During PlantUML requests, display **“Rendering with PlantUML public server…”** rather than a generic indefinite spinner.
- Show a skeleton or centered progress indicator when the PlantUML canvas has no previous successful output.
- Preserve and visually dim the previous valid PlantUML diagram while a replacement is loading.
- Keep Retry visible after PlantUML timeout, service, response-validation, or image-decoding failures.
- Disable export actions when no valid current render exists.
- Use a non-blocking error panel with a retry action.
- Do not use browser `alert()` for normal application feedback.
- Do not hide important functions inside hover-only controls.
- Use a neutral professional interface suitable for students, lecturers, analysts, and developers.
- Support light and dark system preference if it can be implemented without delaying core behavior.

---

## 11. Accessibility Requirements

The prototype must aim for WCAG 2.2 AA behavior.

- Use semantic buttons, tabs, menus, headings, and landmarks.
- Implement tabs using correct roles and keyboard behavior.
- Maintain a visible focus indicator.
- Provide accessible names for all icon buttons.
- Do not use color as the only status indicator.
- Announce render completion and errors through a polite `aria-live` region.
- Maintain sufficient contrast.
- Ensure the layout remains usable at 200% browser zoom.
- Respect reduced-motion preferences.
- Make the code editor reachable and escapable by keyboard.

---

## 12. Security and Privacy Rules

These rules are mandatory.

- Treat all diagram source and renderer output as untrusted.
- Set Mermaid to strict security mode.
- Sanitize every SVG before DOM insertion and HTML export.
- Never use unsanitized `dangerouslySetInnerHTML`.
- Route PlantUML requests through the application Route Handler and allowlist only the official public-server origin.
- Do not support `!include`, `!includeurl`, `!import`, local file access, arbitrary URL proxying, server-side file paths, or user-selected rendering hosts.
- Treat PlantUML source as data shared with a third-party service; show a visible privacy notice and advise users not to submit confidential diagrams during Phase 1.
- Limit request and upstream response sizes.
- Apply an upstream render timeout and request cancellation.
- Add basic rate limiting or abuse protection for public deployment because the application depends on a shared public service.
- Avoid logging full source, encoded diagram URLs, or returned diagram contents in production by default.
- Do not add telemetry without explicit approval.
- HTML exports must contain sanitized static output, not executable source.
- Use a restrictive Content Security Policy when deploying publicly.

---

## 13. Coding Standards

### TypeScript

- Enable `strict` mode.
- Avoid `any`; use `unknown` with explicit narrowing.
- Define public function return types.
- Prefer discriminated unions for state and errors.
- Keep domain types independent from UI components.

### React and Next.js

- Default to Server Components; add `"use client"` only where browser APIs or interaction require it.
- Keep rendering engines and Monaco in client-only boundaries.
- Use Route Handlers for the PlantUML proxy.
- Avoid storing derived values that can be calculated safely.
- Keep effects small and dependency-correct.
- Do not suppress hydration warnings to hide design problems.

### Components

- Keep components focused.
- Separate orchestration from presentational components.
- Prefer composition over large option-heavy components.
- Do not pass the entire global store to leaf components.
- Use consistent empty/loading/error handling.

### Styling

- Use design tokens through CSS variables.
- Avoid scattered literal colors and spacing values.
- Preserve usable overflow behavior in both panes.
- Test common desktop and mobile widths.

### Error handling

- Convert library-specific errors into `RenderError` at system boundaries.
- Provide user-friendly messages and optional safe technical detail.
- Log only information useful for diagnosis.
- Never swallow an error silently.

---

## 14. Environment Variables

Create `.env.example` with at least:

```dotenv
# Official public PlantUML Web Server base URL, used by Next.js server code only.
PLANTUML_SERVER_URL=https://www.plantuml.com/plantuml

# Maximum accepted UTF-8 source size in bytes.
PLANTUML_MAX_SOURCE_BYTES=102400

# Public-server request timeout in milliseconds.
PLANTUML_RENDER_TIMEOUT_MS=10000

# Maximum accepted upstream image size in bytes.
PLANTUML_MAX_RESPONSE_BYTES=5242880
```

Rules:

- Validate the URL at startup or first use.
- Require HTTPS outside local tests.
- Allow only the expected official PlantUML host unless the human project owner explicitly approves another fixed host.
- Never prefix the PlantUML service URL with `NEXT_PUBLIC_`; browser code must call the application Route Handler.
- The URL is configuration rather than a secret, but it must not be user-editable.
- Do not commit secrets or machine-specific values.

---

## 15. Public PlantUML Service Integration Requirements

- Phase 1 must not require Docker, Java, a PlantUML WAR file, or a separately deployed rendering container.
- The Next.js Route Handler is deployed as part of the same Vercel application.
- The Route Handler must call the documented public SVG and PNG URL endpoints using encoded diagram source.
- Use a fixed, validated upstream origin and reject redirects to a different origin.
- Apply timeouts, response-size limits, content-type validation, safe error mapping, and request cancellation.
- Prefer deterministic request URLs so browser, Vercel, and upstream caching can reduce repeat renders.
- Do not depend on public-server uptime for automated unit, component, API, or end-to-end tests; mock upstream responses in normal CI.
- Provide a documented manual smoke test, or an opt-in live integration test, against the official server.
- Clearly document that the public PlantUML server is a third-party dependency without an application-controlled SLA and that submitted source leaves the application boundary.

---

## 16. Testing Requirements

### 16.1 Unit tests

Cover at least:

- Zod request validation.
- Input byte-size validation.
- Zoom clamping.
- Safe filename generation.
- Source hashing.
- Error normalization.
- Standalone HTML escaping and generation.
- Sanitizer removal of unsafe SVG content.

### 16.2 Component tests

Cover at least:

- Switching tabs preserves separate drafts.
- Rendering status is shown correctly.
- Export actions are disabled when the current source is stale or invalid.
- Zoom controls stop at 50% and 200%.
- Error messages and retry actions are keyboard accessible.

### 16.3 API tests

Cover at least:

- Valid SVG request.
- Valid PNG request.
- Empty source.
- Unsupported format.
- Oversized source.
- Public-server diagnostic/syntax response.
- Public-server timeout.
- Public-server unavailable or rate-limited.
- Unexpected content type, malformed media, and oversized response.
- Internal details are not leaked.

### 16.4 End-to-end tests

At minimum:

1. Open the app and render the default Mermaid example.
2. Edit Mermaid source and observe an updated preview.
3. Enter invalid Mermaid source and receive a clear error.
4. Switch to PlantUML and retain the Mermaid draft.
5. Render valid PlantUML through the application API and verify the loading status remains visible until image decoding completes.
6. Zoom to minimum and maximum values.
7. Export SVG, PNG, and HTML from valid diagrams.
8. Confirm export is unavailable for invalid or stale output.
9. Reload and confirm local drafts are restored.

Mock the public PlantUML dependency in normal automated tests to avoid network flakiness and accidental service load. Include a documented manual smoke test or opt-in live integration test against the official public server; do not make that live test a required default CI gate.

---

## 17. Definition of Done

A feature is done only when all applicable conditions are met:

- Behavior matches `DESIGN.md`.
- Types, lint, unit tests, component tests, API tests, and end-to-end tests pass.
- Production build succeeds.
- No unexpected browser or server console errors occur in core flows.
- Empty, loading, success, stale, and failure states are handled.
- Keyboard and screen-reader semantics are reasonable.
- Security rules are followed.
- Documentation is updated.
- No placeholder TODO remains in the completed path unless linked to a documented future issue.

Recommended final commands:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

Use the actual repository scripts if their names differ.

---

## 18. Completion Report Format

At the end of the task, report:

```markdown
## Completed
- Feature or module delivered

## Important implementation decisions
- Decision and rationale

## Verification
- Commands run and outcomes

## Known limitations
- Honest remaining limitation

## Files changed
- Key file paths

## Follow-up work
- Only concrete next steps that remain outside the requested scope
```

Do not claim a test passed unless it was executed successfully.

---

## 19. Prohibited Shortcuts

Do not:

- Build only a static mock-up.
- Call the public PlantUML service directly from the browser instead of the validated application Route Handler.
- Expose the configured public-server base URL as a user-editable client setting.
- Inject unsanitized SVG.
- Use Mermaid loose security mode.
- Allow arbitrary remote or local includes.
- Erase the user's draft after a render error.
- Couple export logic directly to DOM selectors when a typed render result is available.
- Add authentication or database infrastructure in Phase 1.
- Add AI placeholders presented as working features.
- Disable lint or TypeScript checks to make the build pass.
- remove failing tests without a documented reason.

---

## 20. Reference Documentation

Use primary documentation when implementation details are uncertain:

- Next.js App Router and Route Handlers: https://nextjs.org/docs/app
- Mermaid usage and configuration: https://mermaid.js.org/config/usage.html
- Mermaid configuration API: https://mermaid.js.org/config/setup/mermaid/interfaces/MermaidConfig.html
- PlantUML Server: https://plantuml.com/server
- Monaco Editor: https://microsoft.github.io/monaco-editor/
- Playwright: https://playwright.dev/docs/intro
- WCAG 2.2: https://www.w3.org/TR/WCAG22/

