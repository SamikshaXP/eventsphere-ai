# ADR-0002: JavaScript for Initial MVP Version

## Status
Accepted

## Context
The project team consists of 3 student developers aiming to build a high-quality MVP for resume and portfolio showcase. Speed of initial delivery and team familiarity with the stack are critical factors.

## Decision
The initial version of EventSphere AI will use JavaScript across both the Node.js/Express backend and the React frontend, rather than TypeScript. TypeScript migration may be evaluated in a future iteration.

## Consequences
### Positive
- Maximizes development velocity by leveraging the team's existing core expertise.
- Eliminates transpilation step overhead and static type setup complexity during initial prototyping.
- Simplifies early iteration on API contracts and data models.

### Trade-offs
- Absence of static compile-time type checking.
- Requires disciplined manual validation, runtime schema checks, and automated tests to catch type mismatch errors.
