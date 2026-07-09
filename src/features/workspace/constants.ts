import type { Drafts, Template } from "@/features/workspace/types";

export const DEFAULT_ZOOM = 1;
export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 4;
export const DRAFT_STORAGE_KEY = "igram-diagram-drafts-v1";
export const THEME_STORAGE_KEY = "igram-theme";

export const MERMAID_TEMPLATES: Template[] = [
  {
    name: "iGram Architecture",
    desc: "Classic workspace flow from source to preview",
    code: `%% iGram architecture
flowchart LR
    User([User]) --> WS[iGram Workspace]
    WS --> R{Renderer}
    R -->|mermaid| PV[Preview Canvas]
    R -->|plantuml| API["/api/plantuml/render/"]
    API --> PV`,
  },
  {
    name: "Flowchart",
    desc: "Process flows, decision trees, and workflows",
    code: `flowchart TD
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

    User->>App: Click Sync Data
    App->>+API: POST /api/v1/sync
    API->>+DB: INSERT INTO transactions
    DB-->>-API: Complete
    API-->>-App: 201 Created
    App-->>User: Show success`,
  },
  {
    name: "State Diagram",
    desc: "Lifecycle and transitions of a state machine",
    code: `stateDiagram-v2
    [*] --> Idle
    Idle --> ActiveSession : User login
    ActiveSession --> Suspended : Security timeout
    Suspended --> ActiveSession : Re-authenticate
    ActiveSession --> Idle : User logout`,
  },
];

export const PLANTUML_TEMPLATES: Template[] = [
  {
    name: "PlantUML Sequence",
    desc: "Client, API, and public server flow",
    code: `@startuml
title iGram PlantUML render flow
actor User
participant "iGram Workspace" as UI
participant "POST /api/plantuml/render" as API
participant "PlantUML Public Server" as PUML

User -> UI: Edit PlantUML source
UI -> API: Render request
API -> PUML: Encoded source
PUML --> API: SVG image
API --> UI: Validated SVG
UI --> User: Preview decoded image
@enduml`,
  },
  {
    name: "Component Diagram",
    desc: "Workspace and render boundary",
    code: `@startuml
skinparam componentStyle rectangle
component "Browser Workspace" as Browser
component "Next.js Route Handler" as Route
cloud "Official PlantUML\\nPublic Server" as PlantUML

Browser --> Route : source + format
Route --> PlantUML : encoded request
PlantUML --> Route : rendered media
Route --> Browser : validated image
@enduml`,
  },
];

export const DEFAULT_DRAFTS: Drafts = {
  mermaid: MERMAID_TEMPLATES[0].code,
  plantuml: PLANTUML_TEMPLATES[0].code,
};
