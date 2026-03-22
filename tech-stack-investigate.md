# Technology Investigation

## Role Of This Document
- Purpose: record how this legacy repo should be interpreted during the Figma + uni-app replatform, and identify which technical choices still matter as reference input
- Relation to `project-context.md`: this document translates the new project split into a reference-oriented interpretation of the old stack and a handoff direction for the new one
- Scope note: this is for the current prototype milestone, not a final production architecture decision

## Selection Principles
- Principle 1: keep Figma and code responsibilities explicit, so design structure is stable before implementation starts
- Principle 2: prefer preserving high-value reference material over extending the legacy stack
- Principle 3: reuse existing business rules and data models where they are still valid, but do not preserve the native page layer for its own sake
- Principle 4: keep the architecture compatible with a later migration from local-only data to shared cloud-backed data

## Candidate Stack
- Design source of truth: Figma file(s) built from the existing screenshots and approved menstrual-module interaction contract
- Design-to-code bridge: Figma MCP plus AI-assisted skeleton generation for page structure, component folders, and token mapping
- Frontend runtime: uni-app with Vue 3 SFC pages/components, targeting WeChat Mini Program first
- Language: JavaScript for the first uni-app scaffold unless the team explicitly upgrades to TypeScript during bootstrap
- State management: start with page-local state plus `composables/` and `services/`; add a global store only if cross-page coordination becomes painful
- Persistence: local-first storage behind a thin wrapper around `uni.*` APIs
- Backend: none for the first prototype; preserve a migration path to WeChat Cloud capabilities later
- Styling system: Figma tokens mapped into a small theme layer, with component-level styles implemented in uni-app
- External integrations: Figma MCP during design/rebuild; no production external service required for the MVP runtime

## Why These Choices Fit The Project
- Match to project goals: Figma gives the team and MCP a single interface truth source, which is more valuable than continuing to iterate on ad hoc native page code in this repo
- Match to scope constraints: uni-app preserves WeChat delivery while reducing lock-in to the current native page primitives
- Match to migration reality: the repo already contains useful domain logic and interaction patterns, so the rebuild can focus on view-layer and structure changes instead of rethinking every business rule
- Match to design workflow: screenshots are better used to rebuild structured frames, components, and states than to drive direct code generation from pixels

## How The Stack Supports Required Features
- Single-user menstrual recording: supported through uni-app pages, local state, and wrapped storage helpers
- Status-first module homepage: fits a componentized uni-app page composed from Figma-defined blocks
- Inline day-state editing and range backfill: supported through reusable composables/services plus gesture-aware page components
- Shared-state labeling: still modeled locally through module-instance metadata before true multi-user sync exists
- Migration path to shared space: preserved by keeping owner, module instance, shared space, and membership as explicit domain concepts

## Migration Interpretation Of Existing Native Code
- Preserve as direct business/domain input:
  - `models/day-record.js`
  - `services/cycle-record-service.js`
  - `services/module-instance-service.js`
  - `utils/date.js`
  - deterministic seed data and service tests
- Preserve as interaction and information-architecture reference only:
  - existing `pages/` JS files
  - screenshot assets under `assets/`
  - current `app.json` page map
- Do not treat as reusable implementation baseline:
  - WXML page structure
  - WXSS visual hierarchy
  - raw `Page({})` lifecycle wiring
  - direct `wx.*` calls scattered through page files

## Status
- Confirmed choices:
  - target platform remains WeChat Mini Program
  - the implementation mainline is now a separate uni-app project rather than native page development in this repo
  - Figma is the UI structure and design-language source of truth
  - the initial prototype remains local-first
  - the current native codebase is reference material, not the target architecture
- Candidate choices:
  - whether to adopt TypeScript during uni-app scaffold
  - whether to introduce Pinia or keep stores implicit for the first rebuild slice
  - whether Figma MCP should generate only skeletons or also token scaffolding
- Open technical questions:
  - how to map Figma component naming cleanly into the uni-app component folder structure
  - how to export and store design tokens for reliable reuse across pages
  - how much of the native service layer can be ported without reshaping its interfaces
