# Technology Investigation

## Role Of This Document
- Purpose: record why the active mainline repo is organized around uni-app, tokenized styling, and reusable page/component foundations
- Relation to `project-context.md`: this document translates the current product milestone into an implementation-oriented technical direction for this repo
- Scope note: this is for the current prototype milestone and immediate architecture direction, not a final production architecture decision

## Selection Principles
- Principle 1: prefer a structure that is native to uni-app Vue 3 rather than adapting generic web-app assumptions
- Principle 2: keep WeChat Mini Program as the primary runtime target while avoiding choices that unnecessarily break H5 compatibility
- Principle 3: invest in reusable tokens, foundation styles, and shared components before multiplying page-local UI patterns
- Principle 4: preserve the business-rule and sharing-model knowledge from the legacy repo without importing its page-layer implementation
- Principle 5: keep the data and state architecture light until the MVP proves where cross-page complexity actually exists

## Current Stack Direction
- Frontend runtime: uni-app with Vue 3 SFC pages and components
- Primary target platform: WeChat Mini Program
- Secondary compatibility awareness: H5 should remain possible where uni-app support is natural, but it is not the main optimization target
- Language: JavaScript for the current scaffold
- Styling entrypoints:
  - `uni.scss` as the compatibility bridge for uni variables
  - `styles/tokens/` for primitive and semantic tokens
  - `styles/foundation/` for base, mixins, patterns, and utility layers
- Routing/navigation model: `pages.json` plus uni-app navigation APIs, not Vue Router
- Persistence direction: local-first through `uni.*` capabilities and wrappers that can later evolve toward shared/cloud-backed behavior
- State direction: page-local state first, then extracted `utils` or service/composable-style helpers where reuse becomes real

## Why This Stack Fits The Project
- Match to project goals: uni-app allows the product to target WeChat Mini Program while building on Vue 3 component structure and a scalable styling layer
- Match to current repo state: the repo already has `uni.scss`, token files, foundation styles, and a page shell, so the technical direction should explain and strengthen that path rather than describe a separate migration target
- Match to delivery constraints: lightweight local-first architecture is enough to validate information architecture, module entry, and shared-state modeling before backend investment
- Match to design workflow: Figma/Pencil-derived page structure and component boundaries can be translated into uni-app pages and reusable components more cleanly than into revived native mini program page code

## How The Stack Supports Required Features
- Module-space shell: implemented as uni-app pages registered in `pages.json`
- Menstrual module MVP: can be layered in as additional pages/components using the same token and foundation system
- Same-instance private/shared model: should live in data structures and interaction rules, not duplicated page trees
- WeChat Mini Program-first UI: supported by `rpx` sizing, uni components, and avoiding DOM-only assumptions
- Future page growth: supported by the existing token and foundation directories, which reduce repeated styling and improve refactorability

## Styling System Direction
- Token model:
  - primitives define raw color, spacing, typography, radius, shadow, z-index, and motion values
  - semantic tokens map those primitives to product meaning such as page background, text hierarchy, action colors, and menstrual-state colors
- Foundation model:
  - base styles normalize page shell and text behavior
  - mixins and patterns provide reusable layout and UI structures
  - utilities support small shared helpers without hard-coding values repeatedly
- `uni.scss` role:
  - expose the repo's semantic choices to uni-app compatibility variables
  - keep uni defaults aligned with the custom token system
- Styling rule:
  - prefer semantic tokens and shared patterns first
  - add new tokens when a value becomes conceptually meaningful or repeated
  - avoid inline styles and one-off hard-coded values unless the usage is truly local and temporary

## State, Logic, And Persistence Direction
- State model:
  - start with page-local state for isolated shells and interaction stubs
  - extract logic into shared helpers only when multiple pages or components reuse the same behavior
  - avoid introducing a heavy store before there is clear cross-page coordination pressure
- Logic organization:
  - prefer `utils/` or future service/composable-style modules for pure data transforms, date handling, record-state interpretation, and persistence wrappers
  - keep presentational components as dumb as practical
- Persistence model:
  - use `uni.*` APIs or thin wrappers around them for local-first storage behavior
  - keep data shape compatible with a future shared/cloud-backed migration path

## Legacy Reference Interpretation
- Canonical reference repo: `D:\CodeSpace\love-recorder`
- Worth reusing from the legacy repo:
  - menstrual business rules
  - day-state and cycle-state definitions
  - module-instance and sharing concepts
  - information architecture and state coverage
  - migration and design notes already copied into this repo's `docs/`
- Not valid as implementation templates:
  - WXML page trees
  - WXSS styling structure
  - native mini program lifecycle glue
  - direct page-level code copying into uni-app pages

## Status
- Confirmed choices:
  - uni-app + Vue 3 is the active implementation direction
  - WeChat Mini Program is the primary runtime target
  - JavaScript remains the current scaffold language
  - the token/foundation styling system is part of the intended architecture, not temporary scaffolding
  - local-first persistence is sufficient for the current prototype stage
- Candidate choices:
  - when to add shared components under `components/` beyond the current page shell
  - whether to extract reusable state helpers into `utils/` only or into a more explicit service/composable layer
  - whether to introduce a lightweight global store after more pages land
- Open technical questions:
  - when or whether to adopt TypeScript
  - what threshold should trigger introduction of a global store
  - whether shared invitation UX should be a real first-milestone flow or remain a placeholder
  - how far the first runnable prototype should go before adding backend/cloud-backed behavior
