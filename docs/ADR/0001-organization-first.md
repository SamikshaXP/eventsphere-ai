# ADR-0001: Organization-First Architecture

## Status
Accepted

## Context
EventSphere AI is designed to serve multiple entity types, including colleges, companies, NGOs, startups, and community groups. In many existing systems, events are tied directly to individual user accounts, which creates friction when managing permissions, event ownership transitions, and collaborative management across team members.

## Decision
EventSphere AI will adopt an organization-first architecture. 
- A user can belong to multiple organizations.
- Organizations own events rather than individual users directly owning events.
- For the MVP version, a simplified organization model will be used without introducing a nested "Teams" layer inside organizations.

## Consequences
### Positive
- Clear ownership structure for all events and assets.
- Flexible access control allowing users to participate in or manage events across different organizations.
- Simplifies permission management and audit trails for organizational operations.

### Trade-offs
- Creating events requires establishing or selecting an organization context, even for standalone/individual organizers.
- Additional data modeling required early in the development lifecycle.
