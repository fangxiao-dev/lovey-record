# Project Context

## Project Summary
- Name: love-recorder
- Project type: relationship record product MVP, currently replatforming to a uni-app-based WeChat Mini Program
- One-sentence purpose: build a relationship-oriented record space whose first MVP module is menstrual tracking, with single-user-first use and same-instance sharing later
- Primary audience: couples who may start from single-user use and later share the same module with a partner
- Current phase: legacy repo freeze; the existing native mini program prototype is now a migration/reference source, while active development moves to the separate uni-app project

## Background
- Why this project exists: the original idea was a menstrual tracking mini program, then expanded into a broader concept for recording small but meaningful details in a relationship
- Real product / prototype / course project / internal tool: prototype intended to validate product direction and the core menstrual-recording loop before broader expansion
- Recent direction change: the repo previously moved forward with native WeChat Mini Program code, but the new mainline is now:
  - Figma as the source of truth for UI structure, component hierarchy, and design language
  - uni-app as the new implementation layer
  - the current native implementation as migration material only

## Product Theme
- Domain or product theme: relationship record space with modular personal-to-shared workflows
- Why this theme fits the project: the product is not meant to be only a menstrual tracker; the menstrual module is the first concrete module inside a broader shared-space concept

## Key User Scenarios
- Scenario 1: a single user starts using the menstrual module alone and completes a full record/view/edit loop without needing a partner account
- Scenario 2: the user later creates or joins a shared space and mounts the same menstrual module into that space so both people can view and maintain the same data
- Scenario 3: the owner withdraws the module from the shared space, preserving the original data while removing partner access

## Goals And Scope
- Current milestone: finish legacy freeze documentation so the separate uni-app project can use this repo as a stable reference source
- Success condition: the prototype supports private use, shared-state labeling, status-first home view, inline day-state editing, range backfill, and a same-instance model between personal and shared entry points
- Minimum usable closed loop: open the mini program, enter the menstrual module, inspect current status, edit today's day state or a historical range, view recent history, and keep the same module identity across private and shared entry points
- Required deliverables:
  - project context document
  - technical investigation document
  - repo-level `AGENTS.md`
  - repo-level `CLAUDE.md`
  - replatform design and implementation plan docs
  - migration inventory covering pages, components, and reusable logic
  - Figma-based structured UI design inputs
  - handoff-ready reference material for the new uni-app project
- In scope:
  - legacy product/design/logic documentation
  - migration inventories and handoff notes
  - screenshot and design-reference preservation
  - business-rule preservation for the menstrual tracking MVP
- Out of scope:
  - production-grade authentication and security hardening
  - full real-time shared editing
  - complex health analytics and charting
  - AI interpretation
  - multi-module expansion beyond placeholders or architecture hooks
  - continuing active feature delivery in this legacy repo
- Constraints:
  - final preview target is still WeChat Mini Program
  - current delivery target is a runnable prototype, not a production launch
  - Figma must describe structure, states, and components, not just polished static screens
  - old native code may inform business logic and information architecture, but its WXML/WXSS/Page structure should not be treated as the target architecture
  - the product must support both private and shared mental models without duplicating module data
- Non-goals:
  - replicating full-featured menstrual apps such as Meiyou
  - building a full relationship operating system in the first milestone
  - solving all backend and cross-device sync concerns before validating the UX
- Risks:
  - leaving the legacy repo role ambiguous and causing new work to land in the wrong place
  - treating screenshots as pixel-reference only instead of extracting structure and states
  - over-scoping the replatform into a full redesign of unrelated modules
  - under-defining the transition from private to shared mode

## Repository Facts
- Key directories:
  - `assets/` for existing screenshots and design reference material
  - `docs/plans/` for approved solution-level plans
  - `pages/`, `services/`, `models/`, `utils/`, and `tests/` for the current native prototype codebase
- Main entrypoints today:
  - the existing native prototype can still run through the current mini program scaffold
  - that code is now reference material for migration planning
- Test entrypoints today:
  - Node-based domain/service tests under `tests/`
  - WeChat DevTools manual verification for the native prototype

## Candidate Technical Direction
- Summary: preserve this repository as a stable legacy reference while a separate uni-app project rebuilds the product around the same business rules and design direction
- Link to `tech-stack-investigate.md`: [tech-stack-investigate.md](tech-stack-investigate.md)

## Confirmed Facts
- The product target remains WeChat Mini Program.
- The long-term direction remains a relationship detail record space.
- The first MVP module remains menstrual tracking.
- The product must support single-user usage before sharing.
- Shared access must point to the same module instance rather than copied data.
- This repository is no longer the active implementation target.
- Figma is now the source of truth for UI structure, component naming, state pages, and design language.
- uni-app is now the preferred frontend implementation direction.
- The current native mini program code is retained as migration reference only.
- Persistence direction remains local-first with a migration path toward cloud-backed sharing.

## Reasonable Inferences
- A uni-app rebuild should reuse domain logic and interaction intent, but not copy the current page-layer code directly.
- The highest-value migration work is extracting page purposes, component boundaries, and reusable data rules before any scaffold rewrite.
- Figma outputs should be structured around component systems and state coverage so MCP and AI can generate useful uni-app skeletons.
- State management can start light if the domain logic is already isolated into services and composables.

## Open Questions
- Whether the first uni-app scaffold should stay JavaScript-only or adopt TypeScript at bootstrap
- Whether a lightweight global store is necessary immediately or can wait until more modules exist
- Whether shared invitation UX should be real or placeholder in the first uni-app prototype
- How Figma design tokens should be exported into the uni-app theme layer (`uni.scss`, CSS variables, or both)
