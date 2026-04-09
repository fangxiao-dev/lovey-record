# Frontend Prototype Harness

## Purpose

This document defines the minimum execution harness for frontend tasks that have already been approved to go from structural sketch directly into a coded prototype.

It does not decide whether a task should use Pencil first.

It only answers:

- once the team has decided to go straight to prototype
- how the agent should use the available resources
- how the agent should stay close to the existing design system
- how the result should remain easy to refine instead of drifting into a parallel UI language

## Applicable Scenario

Use this harness only when all of the following are true:

- the task is already approved to skip a fresh Pencil-first design pass
- there is at least a structural sketch, textual structure list, or clear layout description
- the page should inherit the current product language rather than invent a new one
- the expected outcome is a high-quality frontend prototype that may need only limited follow-up adjustment

## Input Packet

Before implementation, gather the smallest sufficient input packet.

The preferred packet is:

1. structure sketch
2. relevant design spec docs
3. nearest Pencil references
4. feature-level text requirements
5. existing runtime components

### 1. Structure sketch

This is the primary composition input.

Accepted forms:

- hand-drawn structure sketch
- block list
- page region outline
- textual hierarchy such as `header -> hero -> list -> detail panel -> actions`

The sketch defines:

- information architecture
- rough grouping
- relative hierarchy

The sketch does not define final visual styling by itself.

### 2. Relevant design spec docs

Always read the minimum matching docs:

- [frontend-design-spec.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/frontend-design-spec.md)
- [2026-03-23-ui-visual-language-guide.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/2026-03-23-ui-visual-language-guide.md)
- [2026-03-22-tokenize-collaboration-rule.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/2026-03-22-tokenize-collaboration-rule.md)

If the task is module-specific, also read the matching module `function-*.md` and `frontend-*.md`.

These docs define:

- visual tone
- stable token semantics
- component boundaries
- page-level contract constraints

### 3. Nearest Pencil references

When skipping a fresh Pencil pass, do not ignore existing Pencil entirely.

The agent should still search for the nearest visual references from current `.pen` files or named nodes that already express:

- similar hero surfaces
- similar cards
- similar date states
- similar action rows
- similar detail panels

Pencil references are used here as style anchors, not as a mandatory full source board for the new page.

### 4. Feature-level text requirements

The text requirements define:

- what the page must do
- what states must exist
- which content is primary
- what can be hidden, collapsed, or delayed

If text requirements conflict with an older visual pattern, preserve semantics first and then reuse the nearest compatible visual pattern.

### 5. Existing runtime components

Always inspect the current frontend runtime before creating new page-local structure.

The first question is not "how should this page look from scratch".

The first question is:

- which existing component or component family is the closest base

## Source Priority

When these inputs disagree, use this order:

1. current task's feature semantics and textual requirements
2. module-level function and frontend design contracts
3. current frontend design spec and visual language rules
4. nearest Pencil references
5. current runtime implementation

Rule:

- semantics decide what must be present
- design contracts decide how the product language should feel
- Pencil helps preserve visual continuity
- runtime code is a reuse source, not the final truth when it conflicts with newer design docs

## Execution Steps

The agent should follow this sequence.

### Step 1: Extract invariant constraints

Write down the non-negotiables before coding:

- must-have sections
- must-have states
- read-only or edit boundaries
- interaction model
- page hierarchy
- required shared components or token families

This prevents the prototype from becoming a visually pretty but semantically wrong page.

### Step 2: Build a reference map

Create a small map from each part of the new page to existing references.

Example:

- top bar -> existing `AppTopBar`
- main hero -> `StatusHeroCard` family
- list row -> nearest management card row
- action strip -> current secondary action row pattern

If a section has no suitable reference, mark it explicitly as a true gap instead of silently inventing a new local pattern.

### Step 3: Recompose before reinventing

Prefer recomposing existing tokens and shared components over creating new page-only styling.

Allowed moves:

- reorder existing sections
- resize within current rhythm
- adjust emphasis within current token language
- merge or simplify existing patterns

Avoid:

- introducing a new hue family without token support
- inventing a new card language for one page
- creating ad hoc spacing rules that do not match current rhythm
- mixing unrelated Pencil styles into one page

### Step 4: Implement the smallest convincing prototype

The first coded prototype should be:

- semantically complete
- visually close to the current system
- structurally easy to adjust

Do not over-polish page-local details before the page proves its structure.

### Step 5: Compare against references

After implementation, compare the result against:

- the structure sketch
- relevant design docs
- the nearest Pencil references
- the current shared component language

The review question is:

- does this look like the same product, only adapted to the new structure

### Step 6: Record intentional deviations

If the page differs from an existing reference, the agent should state whether the difference is:

- required by semantics
- caused by missing shared component support
- a temporary prototype shortcut

This keeps later refinement precise.

## Quality Bar

A direct-to-prototype page is acceptable only if it satisfies all of these:

- the page reads as the same product family
- existing tokens and shared component patterns are visibly reused
- no major section feels imported from a different visual language
- any new structure feels like a recomposition of current assets, not a reset
- follow-up design work would mainly fine-tune, not replace the whole page

## Explicit Anti-Patterns

Do not do these when using this harness:

- treat the structure sketch as full visual specification
- ignore existing Pencil references because the task skipped a fresh Pencil pass
- ignore design docs and follow current runtime code blindly
- invent page-local colors, shadows, spacing, or card styles for convenience
- create a page that works functionally but looks like a different product

## Expected Output Shape

When reporting the result of a prototype task under this harness, the agent should be able to answer:

1. which existing visual references were reused
2. which sections were newly composed
3. which deviations are intentional
4. what would likely need only minor visual adjustment in a later pass

## Relationship To Other Docs

- [frontend-design-spec.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/frontend-design-spec.md) defines the current frontend design baseline
- [2026-03-23-ui-visual-language-guide.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/2026-03-23-ui-visual-language-guide.md) defines the active cross-module visual language
- [2026-03-22-tokenize-collaboration-rule.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/2026-03-22-tokenize-collaboration-rule.md) defines the token-to-component-to-page supply chain
- module `function-*.md` and `frontend-*.md` define feature-level semantics and UI contracts

This harness sits on top of those rules and only defines how to combine them when the work starts from a structural sketch instead of a fresh design pass.
