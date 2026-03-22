# Project Context

## Project Summary
- Name: lovey-record
- Project type: uni-app Vue 3 relationship record product MVP
- One-sentence purpose: build a relationship-oriented record space in uni-app, with the menstrual tracking module as the first complete MVP slice
- Primary audience: couples who may start from single-user use and later share the same module instance with a partner
- Current phase: active mainline implementation in the uni-app repo, using Figma/design docs and the legacy reference repo to drive a runnable prototype

## Background
- Why this project exists: the original idea began as a menstrual tracking mini program, then expanded into a broader concept for recording meaningful relationship details in a shared space
- Real product / prototype / course project / internal tool: prototype intended to validate product direction, core interaction loops, and reusable UI foundations before broader expansion
- Repo role today: this repository is the active mainline implementation repo, not a legacy freeze or handoff-only repo

## Product Theme
- Domain or product theme: relationship record space with modular personal-to-shared workflows
- Why this theme fits the project: the product is not meant to be only a menstrual tracker; the menstrual module is the first concrete module inside a broader shared-space concept

## Key User Scenarios
- Scenario 1: a single user starts using the menstrual module alone and completes a full record/view/edit loop without needing a partner account
- Scenario 2: the user later creates or joins a shared space and mounts the same menstrual module into that space so both people can view and maintain the same data
- Scenario 3: the owner withdraws the module from the shared space, preserving the original data while removing partner access

## Goals And Scope
- Current milestone: build a runnable uni-app prototype that validates the module-space shell, menstrual module entry flow, and the private-to-shared mental model
- Success condition: the prototype supports status-first module entry, same-instance private/shared modeling, tokenized UI foundations, reusable page building blocks, and a clear path toward the menstrual recording loop
- Minimum usable closed loop: open the app, land on the module-space shell, recognize private/shared module placement, enter the target module flow, and keep the information architecture aligned with the approved docs and reference rules
- Required deliverables:
  - updated `project-context.md`
  - updated `tech-stack-investigate.md`
  - repo-level `AGENTS.md`
  - relevant design and implementation plan docs under `docs/plans/`
  - runnable uni-app prototype pages registered in `pages.json`
  - reusable token/foundation styling layer for future page expansion
- In scope:
  - uni-app Vue 3 page and component implementation
  - WeChat Mini Program-first delivery with H5 awareness where practical
  - menstrual module MVP information architecture and page shell
  - single-user-first flow with same-instance sharing model
  - local-first persistence direction and reusable UI foundation work
- Out of scope:
  - production-grade authentication and security hardening
  - full real-time shared editing
  - complex health analytics and charting
  - AI interpretation
  - multi-module expansion beyond placeholders or architecture hooks
  - copying or reviving deprecated `D:\CodeSpace\love-record`
- Constraints:
  - the primary runtime target is WeChat Mini Program
  - the codebase should remain compatible with uni-app Vue 3 conventions
  - shared data must point to the same module instance rather than copied records
  - design tokens should be the default styling entry point instead of scattered hard-coded values
  - browser-only APIs and direct DOM access should not appear in shared code unless clearly limited to H5
- Non-goals:
  - replicating full-featured menstrual apps such as Meiyou
  - building a full relationship operating system in the first milestone
  - solving all backend and cloud-sync concerns before validating the UX and information architecture
- Risks:
  - drifting back into legacy-repo language and confusing where active implementation belongs
  - letting page-level markup grow without reusable components or token discipline
  - treating legacy page code as a migration template instead of a business-rule reference
  - under-defining the private-to-shared transition model while UI shells evolve

## Repository Facts
- Key directories:
  - `pages/` for uni-app pages that must be registered in `pages.json`
  - `styles/tokens/` for primitive and semantic design tokens
  - `styles/foundation/` for shared base, pattern, mixin, and utility layers
  - `docs/` for design references, plans, checklists, and handoff notes
  - `unpackage/` for generated build artifacts, not source-of-truth implementation
- Main entrypoints today:
  - `main.js` as the uni-app app entry
  - `App.vue` as the top-level shell
  - `pages.json` as the page registration source of truth
  - `uni.scss` as the compatibility bridge into the token layer
- Current implementation signals:
  - the repo already contains a tokenized SCSS foundation
  - the module-space shell page exists under `pages/index/index.vue`
  - documentation under `docs/` still contains migration-era material that must be interpreted from the perspective of this repo as the mainline
- Test and verification reality:
  - page availability depends on `pages.json`
  - cross-platform behavior must be checked with uni-app runtime expectations, especially for WeChat Mini Program
  - manual runtime verification is still required for platform-specific UI and navigation behavior

## Legacy Reference Relationship
- Valid reference repo: `D:\CodeSpace\love-recorder`
- Invalid / deprecated source: `D:\CodeSpace\love-record` should not be used for project context, architecture decisions, or implementation guidance
- What to reuse from `love-recorder`:
  - business rules
  - day-state and cycle-state definitions
  - sharing model constraints
  - interaction contract and information architecture
  - migration and design notes that still describe approved behavior
- What not to reuse directly from `love-recorder`:
  - WXML page structure
  - WXSS visual implementation
  - `Page({})` lifecycle wiring
  - old page glue code as a direct scaffold for uni-app pages

## Candidate Technical Direction
- Summary: keep this repository as the single mainline uni-app implementation, with a token-first styling layer, page/component reuse, local-first runtime assumptions, and selective reference to `love-recorder` for business logic and state coverage
- Link to `tech-stack-investigate.md`: [tech-stack-investigate.md](D:\CodeSpace\hbuilder-projects\lovey-record\tech-stack-investigate.md)

## Confirmed Facts
- The product target remains a relationship record experience with menstrual tracking as the first MVP module.
- This repository is the active mainline implementation repo.
- The implementation direction is uni-app with Vue 3 SFC pages/components.
- WeChat Mini Program remains the primary runtime target.
- The product must support single-user usage before sharing.
- Shared access must point to the same module instance rather than copied data.
- The repo already has a token layer and foundation styling structure.
- `D:\CodeSpace\love-recorder` is the only valid legacy/reference repo.

## Reasonable Inferences
- The next implementation slices should continue to build shared UI foundations before adding many page-local variants.
- A lightweight data and service layer can remain local-first until the menstrual module loop is more complete.
- Design and implementation plans under `docs/plans/` should remain the contract for larger UI and architecture moves.
- H5 compatibility should be considered, but WeChat Mini Program constraints should drive implementation choices first.

## Open Questions
- Whether the repo should adopt TypeScript once the uni-app page/component structure stabilizes
- When the project will need a lightweight global store instead of page-local or extracted service state
- Whether shared invitation UX in the first runnable prototype should be a real flow or a placeholder
- How far the first milestone should go beyond the current module-space shell before adding more module pages
