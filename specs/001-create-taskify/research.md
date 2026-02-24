# Technology Research: Taskify

**Feature Branch**: `001-create-taskify`
**Researched**: 2026-02-24
**Status**: Complete
**Sources**: npm registry, Next.js official docs (nextjs.org), library documentation

---

## 1. Next.js App Router (Frontend Framework)

### Decision: **Next.js 15+ App Router** (monolithic fullstack — no separate backend)

### Key Findings

- **Latest stable version**: Next.js 16.1.6 (as of Feb 2026). Next.js 15 is still fully supported but 16 is current. Recommend targeting **Next.js 15** as specified in the plan, or upgrading to 16 if no breaking changes affect the stack.
- **App Router is the default**: File-based routing via `app/` directory with `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx` conventions is the standard approach.
- **Server Components are the default**: All components in `app/` are Server Components unless marked with `'use client'`. This reduces client-side JavaScript.
- **Client Components for interactivity**: Any component using `useState`, `useEffect`, event handlers (`onClick`, `onChange`), or browser APIs must use `'use client'` directive.
- **Server Actions replace traditional API routes for mutations**: `'use server'` functions handle form submissions and data mutations, eliminating the need for POST/PUT/DELETE API routes in many cases.
- **Route Handlers (`route.ts`)**: Still available for GET endpoints or external API consumption, but Server Actions are preferred for mutations from the same Next.js app.
- **"Backend for Frontend" pattern**: Next.js official docs include a guide specifically for this pattern. Route Handlers + Server Actions can fully serve as the backend for a Next.js frontend.

### Best Practices for Taskify

| Concern                     | Approach                                                                                                             |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Routing**                 | `app/page.tsx` (user selection), `app/projects/page.tsx` (project list), `app/projects/[id]/page.tsx` (kanban board) |
| **Kanban board**            | `'use client'` component — requires drag-and-drop, state management, event handlers                                  |
| **User selection page**     | Server Component fetches users, passes to a thin Client Component for click handling                                 |
| **Project list**            | Server Component fetches projects for current user; minimal client interactivity                                     |
| **Data fetching (reads)**   | Server Components with `async` functions or Route Handlers (`GET`)                                                   |
| **Data mutations (writes)** | Server Actions (`'use server'`) for status updates, comments, assignments                                            |
| **State management**        | React Context + `useState`/`useReducer` — no Redux needed for this scale                                             |
| **Current user state**      | React Context provider wrapping `{children}` in layout, stored as client state                                       |

### State Management Without Redux

For Taskify's scale (5 users, 3 projects, ~20-30 tasks), Redux is excessive:

- **React Context**: For cross-cutting concerns — current user, theme
- **`useState` / `useReducer`**: For local component state — board columns, drag state, comment editing
- **Server-side data**: Fetched directly in Server Components or via Server Actions with `revalidatePath()`
- **Optimistic updates**: Use `useOptimistic()` hook for instant DnD feedback while Server Action processes

### Rationale

Next.js App Router with Server Actions + Route Handlers provides a complete fullstack solution. For a small project with 5 users, 3 projects, and no authentication, adding a separate Express/Fastify backend introduces unnecessary deployment complexity, CORS configuration, and operational overhead with zero architectural benefit.

### Alternatives Considered

| Alternative                 | Why Rejected                                                                                             |
| --------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Next.js Pages Router**    | Legacy pattern; App Router is the current standard with better streaming, Server Components, and layouts |
| **Redux / Zustand / Jotai** | Overkill for this scale — 5 users, 3 projects, no real-time sync. React Context + hooks suffice          |
| **Next.js 16**              | Could upgrade, but 15 is battle-tested and spec-specified. No compelling reason to change                |

---

## 2. Drag-and-Drop Library

### Decision: **@dnd-kit/core** (`@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`)

### npm Data Comparison (as of Feb 2026)

| Library                 | Version | Weekly Downloads | Last Publish | TypeScript | Status                |
| ----------------------- | ------- | ---------------- | ------------ | ---------- | --------------------- |
| **@dnd-kit/core**       | 6.3.1   | **6,915,380**    | ~1 year ago  | Built-in   | **Active** (dominant) |
| **react-beautiful-dnd** | 13.1.1  | 1,671,101        | 3 years ago  | @types/    | **DEPRECATED**        |
| **@hello-pangea/dnd**   | 18.0.1  | 1,259,589        | ~1 year ago  | Built-in   | Active fork           |

### Detailed Comparison

| Feature                | @dnd-kit                                                   | @hello-pangea/dnd                                    | react-beautiful-dnd             |
| ---------------------- | ---------------------------------------------------------- | ---------------------------------------------------- | ------------------------------- |
| **Maintenance**        | Active, single maintainer (clauderic), 6.9M downloads/week | Community fork, 2 maintainers                        | **DEPRECATED** by Atlassian     |
| **TypeScript**         | Native, built-in declarations                              | Native (forked with TS)                              | Requires @types/ package        |
| **Keyboard a11y**      | Full support via `KeyboardSensor`                          | Excellent (inherited from rbd)                       | Excellent                       |
| **Screen reader**      | Customizable announcements                                 | Out-of-box English + i18n                            | Out-of-box English + i18n       |
| **Architecture**       | Modular (sensors, modifiers, collision detection)          | Monolithic (DragDropContext → Droppable → Draggable) | Monolithic                      |
| **Performance**        | Excellent — lightweight, tree-shakeable                    | Good — virtual list support (10k items @ 60fps)      | Good — same as @hello-pangea    |
| **Kanban support**     | Yes — via `@dnd-kit/sortable` with multiple containers     | Yes — built-in multi-list support                    | Yes — built-in                  |
| **Bundle size**        | ~7.8kb core (gzipped)                                      | ~30kb (gzipped)                                      | ~30kb (gzipped)                 |
| **React 18/19**        | Compatible                                                 | Compatible                                           | Issues with React 18 StrictMode |
| **Next.js App Router** | Works in Client Components (`'use client'`)                | Works in Client Components                           | SSR issues; deprecated          |
| **Grid layouts**       | Supported                                                  | Not supported                                        | Not supported                   |

### Why @dnd-kit

1. **Dominant adoption**: 6.9M weekly downloads — 4x more than alternatives combined
2. **Modular design**: Import only what you need (`@dnd-kit/core` for base, `@dnd-kit/sortable` for lists)
3. **Framework-agnostic sensors**: Mouse, touch, keyboard sensors are composable and customizable
4. **No deprecated dependency risk**: `react-beautiful-dnd` is officially deprecated; `@hello-pangea/dnd` is a fork that inherits its architectural limitations
5. **TypeScript-first**: Built-in type declarations, no `@types/` needed
6. **Custom collision detection**: Useful for kanban — can use `closestCenter`, `closestCorners`, or custom algorithms
7. **Small bundle**: ~7.8kb vs ~30kb for alternatives

### Integration with Next.js App Router

```tsx
// components/board/Board.tsx
"use client";

import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

export function KanbanBoard({ tasks, columns }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      {/* columns and cards */}
    </DndContext>
  );
}
```

### Alternatives Considered

| Alternative             | Why Rejected                                                                                                           |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **react-beautiful-dnd** | **Officially deprecated** by Atlassian. No new features, no bug fixes. React 18 StrictMode issues.                     |
| **@hello-pangea/dnd**   | Viable fork, but inherits rbd's monolithic architecture. Smaller community (1.26M vs 6.9M downloads). No grid support. |
| **react-dnd**           | Lower-level primitives — requires more boilerplate for kanban. Better for complex custom DnD, not lists.               |

---

## 3. ORM (Database Access Layer)

### Decision: **Prisma ORM**

### npm Data Comparison (as of Feb 2026)

| ORM             | Version | Weekly Downloads | Last Publish | Dependencies |
| --------------- | ------- | ---------------- | ------------ | ------------ |
| **Prisma**      | 7.4.1   | **7,151,805**    | 4 days ago   | 6 deps       |
| **Drizzle ORM** | 0.45.1  | 4,168,154        | 2 months ago | 0 deps       |

### Detailed Comparison

| Feature                | Prisma                                                                   | Drizzle                                                                      |
| ---------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| **Type safety**        | Generated types from schema → query results fully typed                  | Schema-as-code in TypeScript → fully typed, slightly more manual             |
| **Schema definition**  | Own DSL (`schema.prisma`)                                                | TypeScript code (`schema.ts`) — no separate language                         |
| **Query API**          | High-level object API (`prisma.task.findMany({ where, include })`)       | SQL-like builder (`db.select().from(tasks).where(eq(...))`) + relational API |
| **Migration workflow** | `prisma migrate dev` — auto-generates SQL migrations from schema changes | `drizzle-kit generate` → `drizzle-kit migrate` — similar workflow            |
| **Seed data**          | Built-in `prisma db seed` command, configured in `package.json`          | No built-in seed command; manual script needed                               |
| **Studio/GUI**         | `prisma studio` — built-in visual data browser                           | `drizzle-kit studio` — newer, less mature                                    |
| **Learning curve**     | Lower — intuitive object-style API, excellent docs                       | Higher — need to know SQL patterns, more verbose for relations               |
| **Performance**        | Slight overhead (query engine layer), but negligible for this scale      | Thinner layer, closer to raw SQL performance                                 |
| **Bundle size**        | Larger (~39MB unpacked, includes engine binaries)                        | ~10MB, 0 dependencies, tree-shakeable                                        |
| **Ecosystem maturity** | 7+ years, massive community, extensive plugins                           | ~3 years, rapidly growing but younger ecosystem                              |
| **Relations**          | Declarative `@relation` in schema, effortless nested queries             | Requires explicit `relations()` definitions                                  |
| **PostgreSQL support** | Full — first-class PostgreSQL support                                    | Full — first-class PostgreSQL support                                        |

### Why Prisma for Taskify

1. **Best-in-class developer experience** for a small project: Define schema once, get types, migrations, and a GUI for free
2. **Built-in seed support**: Critical for Taskify — need to seed 5 users, 3 projects, and sample tasks. `prisma db seed` handles this natively
3. **Simpler relation queries**: Taskify has 4 related tables (User, Project, Task, Comment). Prisma's `include` makes nested queries trivial:
   ```ts
   const tasks = await prisma.task.findMany({
     where: { projectId },
     include: { assignee: true, comments: { include: { author: true } } },
   });
   ```
4. **Schema visualization**: `prisma studio` is valuable during development for inspecting sample data
5. **Team familiarity**: Prisma is the most widely used Node.js ORM — easier for any developer to pick up
6. **Active maintenance**: Published 4 days ago (v7.4.1), very rapid release cycle

### Prisma Schema Preview for Taskify

```prisma
model User {
  id        String   @id @default(cuid())
  name      String
  role      Role
  tasks     Task[]   @relation("AssignedTasks")
  comments  Comment[]
}

model Project {
  id    String @id @default(cuid())
  name  String
  tasks Task[]
}

model Task {
  id         String     @id @default(cuid())
  title      String
  description String?
  status     TaskStatus
  project    Project    @relation(fields: [projectId], references: [id])
  projectId  String
  assignee   User?      @relation("AssignedTasks", fields: [assigneeId], references: [id])
  assigneeId String?
  comments   Comment[]
}

model Comment {
  id        String   @id @default(cuid())
  body      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  task      Task     @relation(fields: [taskId], references: [id])
  taskId    String
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
}

enum Role {
  PRODUCT_MANAGER
  ENGINEER
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  IN_REVIEW
  DONE
}
```

### Alternatives Considered

| Alternative      | Why Rejected                                                                                                                                                                                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Drizzle ORM**  | Excellent choice, but: (1) no built-in seed command — requires manual setup, (2) more verbose for relational queries that Taskify relies on heavily, (3) still pre-1.0 (v0.45), (4) SQL-like API has a higher learning curve for a project that won't benefit from fine-grained SQL control |
| **Kysely**       | Type-safe SQL query builder, but too low-level — no schema management, no migrations, no seed support. Requires pairing with another tool                                                                                                                                                   |
| **TypeORM**      | Older, decorator-based API, less type-safe than Prisma/Drizzle. Declining community momentum                                                                                                                                                                                                |
| **Raw SQL (pg)** | Maximum control but zero developer ergonomics for a small project with 4 tables                                                                                                                                                                                                             |

---

## 4. Backend Architecture

### Decision: **No separate backend — use Next.js Route Handlers + Server Actions**

### Analysis

The original plan specifies "Express.js or Fastify (バックエンド REST API)" with a separate `backend/` directory. After research, this is **not recommended** for Taskify's requirements.

### Why a Separate Backend is Unnecessary

| Concern             | Next.js Fullstack                                             | Separate Express/Fastify                    |
| ------------------- | ------------------------------------------------------------- | ------------------------------------------- |
| **REST endpoints**  | Route Handlers in `app/api/` — same request/response pattern  | Separate server, own routing                |
| **Data mutations**  | Server Actions — zero-boilerplate, framework-integrated       | Manual route handlers + validation          |
| **Type sharing**    | Same codebase — types shared automatically                    | Need shared package or code generation      |
| **Deployment**      | Single deployment unit                                        | Two deployments, two processes              |
| **CORS**            | Not needed (same origin)                                      | Requires CORS configuration                 |
| **Authentication**  | Cookies/headers handled natively                              | Need to pass tokens between services        |
| **Database access** | Prisma in Server Components / Server Actions / Route Handlers | Prisma in Express/Fastify handlers          |
| **Development**     | `next dev` — one command                                      | Two dev servers, proxy configuration        |
| **Performance**     | Co-located — no network hop                                   | Extra HTTP hop between frontend and backend |

### What the Spec Actually Requires

From the spec: "REST API for projects, tasks, notifications" — but:

1. **No external API consumers**: The only consumer is the Next.js frontend
2. **No notifications in initial phase**: Explicitly out of scope per assumptions
3. **No authentication**: Click-to-select users, no JWT/session management
4. **5 users, 3 projects**: No scaling concerns
5. **No real-time sync**: No WebSocket/SSE requirements

### Recommended Architecture

```
frontend/                     # Single Next.js application
├── src/
│   ├── app/
│   │   ├── api/              # Route Handlers (for any GET APIs if needed)
│   │   │   ├── projects/
│   │   │   │   └── route.ts  # GET /api/projects
│   │   │   └── tasks/
│   │   │       └── route.ts  # GET /api/tasks?projectId=xxx
│   │   ├── actions/          # Server Actions
│   │   │   ├── tasks.ts      # updateTaskStatus(), assignTask()
│   │   │   └── comments.ts   # createComment(), updateComment(), deleteComment()
│   │   ├── page.tsx          # User selection
│   │   ├── projects/
│   │   │   └── page.tsx      # Project list
│   │   └── projects/[id]/
│   │       └── page.tsx      # Kanban board
│   ├── components/
│   ├── lib/
│   │   └── db.ts             # Prisma client singleton
│   └── types/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── tests/
```

### If a Separate Backend Were Needed (Future)

If Taskify evolves to need a separate backend (mobile app, external API consumers, microservices), **Fastify** would be the better choice over Express:

| Feature            | Fastify                      | Express                                      |
| ------------------ | ---------------------------- | -------------------------------------------- |
| Performance        | ~2-3x faster (benchmarks)    | Slower, callback-based                       |
| TypeScript         | First-class support          | Needs @types/express                         |
| Schema validation  | Built-in (JSON Schema + Ajv) | Needs middleware (zod, joi)                  |
| Plugin system      | Encapsulated plugins         | Middleware chain                             |
| Active development | Active, v5.x                 | Maintenance-mode feel, v4.x (v5 in progress) |

### Alternatives Considered

| Alternative                     | Why Rejected                                                                                                                  |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Separate Express.js backend** | Adds deployment complexity, CORS, type sync issues — no benefit for a single-consumer app with 5 users                        |
| **Separate Fastify backend**    | Same as Express but faster — still unnecessary overhead for this project scope                                                |
| **tRPC**                        | Excellent for type-safe APIs between Next.js and a backend, but Server Actions already solve this problem natively in Next.js |
| **GraphQL (Apollo/Yoga)**       | Overkill — 4 entities, simple queries, no complex data graph                                                                  |

---

## 5. Testing Stack

### Decision: **Vitest (unit/component) + Playwright (E2E)**

### Current State

- **Vitest**: The standard unit testing framework for Vite-based and modern TypeScript projects. Next.js has an [official Vitest guide](https://nextjs.org/docs/app/guides/testing/vitest).
- **Playwright**: The standard E2E testing framework. Next.js has an [official Playwright guide](https://nextjs.org/docs/app/guides/testing/playwright).
- Both are explicitly recommended in Next.js documentation for App Router testing.

### Testing Strategy for Taskify

| Layer               | Tool                           | What to Test                                                              |
| ------------------- | ------------------------------ | ------------------------------------------------------------------------- |
| **Unit tests**      | Vitest + React Testing Library | Server Actions (business logic), utility functions, data transformations  |
| **Component tests** | Vitest + React Testing Library | Individual components (Card, Column, CommentForm), user interaction flows |
| **E2E tests**       | Playwright                     | Full user journeys (US1-US4), cross-page navigation, drag-and-drop        |
| **API tests**       | Vitest (integration)           | Route Handlers with mocked/test database                                  |

### Testing Drag-and-Drop with Playwright

Playwright supports testing drag-and-drop natively. @dnd-kit also provides a keyboard sensor, enabling keyboard-based E2E testing (more reliable than mouse simulation):

```ts
// e2e/kanban-board.spec.ts
import { test, expect } from "@playwright/test";

test("move task between columns via drag and drop", async ({ page }) => {
  await page.goto("/projects/sample-1");

  const taskCard = page.getByTestId("task-card-1");
  const targetColumn = page.getByTestId("column-in-progress");

  // Option 1: Mouse-based drag
  await taskCard.dragTo(targetColumn);

  // Option 2: Keyboard-based (more reliable, tests a11y)
  await taskCard.focus();
  await page.keyboard.press("Space"); // Start drag
  await page.keyboard.press("ArrowRight"); // Move to next column
  await page.keyboard.press("Space"); // Drop

  await expect(targetColumn).toContainText("Task 1 title");
});

test("keyboard accessibility for drag and drop", async ({ page }) => {
  await page.goto("/projects/sample-1");

  // Tab to task card
  await page.keyboard.press("Tab");
  // Activate drag with Space
  await page.keyboard.press("Space");
  // Screen reader announcement should appear
  await expect(page.getByRole("status")).toContainText("picked up");
});
```

### Vitest Configuration for Next.js App Router

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 },
    },
  },
});
```

### Key Testing Best Practices

1. **Server Actions**: Test as plain async functions — mock Prisma, call the action, assert DB state
2. **Client Components**: Use React Testing Library's `render()` + user events, mock Server Actions
3. **DnD components**: Test drag logic via keyboard events (more reliable in JSDOM than mouse simulation)
4. **E2E**: Test the 4 main user stories; use `page.getByTestId()` or `page.getByRole()` for selectors
5. **Test database**: Use a separate PostgreSQL database (or in-memory) for integration tests, reset between runs with `prisma migrate reset`
6. **Naming convention**: `describe("KanbanBoard")` > `it("should move task to in-progress column when dropped")`

### Alternatives Considered

| Alternative                       | Why Rejected                                                                                                                                             |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Jest**                          | Works but slower startup, heavier config for ESM/TypeScript. Vitest is faster and Next.js-recommended                                                    |
| **Cypress**                       | Full-featured but heavier, slower. Playwright is lighter, faster, and better at testing DnD. Next.js recommends both, but Playwright has better DnD APIs |
| **Testing Library only (no E2E)** | Insufficient — DnD interactions and multi-page user journeys need real browser testing                                                                   |

---

## 6. Revised Architecture Recommendation

### Summary of Changes from Original Plan

| Original Plan                     | Recommended                             | Reason                                                                  |
| --------------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| Separate `backend/` + `frontend/` | Single Next.js app                      | No external API consumers; eliminates deployment complexity             |
| Express.js or Fastify             | Next.js Route Handlers + Server Actions | Same capability, zero overhead, type-safe by default                    |
| `@dnd-kit`                        | `@dnd-kit` (confirmed)                  | Research validates: dominant adoption, best TypeScript support, modular |
| Prisma                            | Prisma (confirmed)                      | Research validates: best DX for small projects, built-in seed support   |
| Vitest + Playwright               | Vitest + Playwright (confirmed)         | Research validates: both officially recommended by Next.js              |

### Revised Project Structure

```text
taskify/                          # Single Next.js application (monorepo not needed)
├── prisma/
│   ├── schema.prisma             # Data model (User, Project, Task, Comment)
│   └── seed.ts                   # Sample data (5 users, 3 projects, tasks)
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout + UserProvider context
│   │   ├── page.tsx              # User selection (Server Component)
│   │   ├── projects/
│   │   │   ├── page.tsx          # Project list (Server Component)
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Kanban board page (Server Component shell)
│   │   ├── actions/
│   │   │   ├── tasks.ts          # Server Actions: updateStatus, assignUser
│   │   │   └── comments.ts       # Server Actions: create, update, delete
│   │   └── api/                  # Route Handlers (optional, for GETs)
│   ├── components/
│   │   ├── ui/                   # Generic UI (Button, Card, Avatar)
│   │   ├── board/                # KanbanBoard, Column, TaskCard ('use client')
│   │   └── comments/             # CommentList, CommentForm ('use client')
│   ├── hooks/                    # useCurrentUser, useTasks
│   ├── lib/
│   │   └── db.ts                 # Prisma client singleton
│   └── types/                    # Shared type definitions
├── tests/
│   ├── unit/                     # Vitest unit + component tests
│   └── e2e/                      # Playwright E2E tests
├── vitest.config.ts
├── playwright.config.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### Impact on Plan

The plan's Phase 0 research is now complete. Key architectural decision: **collapsing the backend into Next.js** simplifies Phase 1 (data model design) and Phase 2 (implementation tasks) significantly. The plan's `backend/` directory structure should be updated to reflect the monolithic Next.js approach.
