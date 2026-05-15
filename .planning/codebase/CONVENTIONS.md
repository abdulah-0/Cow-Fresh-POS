# Conventions

## Coding Standards
- **TypeScript**: Strict typing is preferred.
- **Naming**:
  - Components: PascalCase.
  - Files: kebab-case (Next.js convention).
  - Variables/Functions: camelCase.
- **Style**: Functional components with React Hooks.

## Styling
- **Utility-First**: Tailwind CSS 4 for all styling.
- **Components**: Radix UI for accessible primitives.
- **Theming**: CSS variables for colors (likely defined in `globals.css`).

## State Management
- **Local State**: `useState` for simple UI toggles.
- **Global State**: Zustand for shared state (e.g., POS cart, user session).

## Database
- **Schema**: Tables are plural (e.g., `items`, `sales`).
- **Keys**: UUIDs for tenants/users, Serial Integers for primary records within tenants (OSPOS style).
