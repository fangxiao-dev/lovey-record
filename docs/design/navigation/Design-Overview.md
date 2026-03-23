# Navigation Design Overview

## Purpose

This document defines the long-lived design contract for product-level navigation.

The current navigation scope is intentionally small:

- bottom-tab structure
- first landing logic
- relationship between dashboard and management

## Current Role

Navigation should help users:

- resume recent work quickly
- understand where to find all modules
- move between the lightweight first entry and the heavier management surface

Navigation should not become:

- a social feed
- a message center
- a multi-layer admin shell

## Active Structure

The current global navigation is a `2-tab` structure:

1. dashboard home
2. module management

The first tab exists to help users continue work quickly.
The second tab exists to expose all modules, organization, and sharing-related management.

## Design Boundaries

- Keep the global tab model small and legible.
- Do not split shared-space concerns into a third tab at this stage.
- Do not overload the first tab with management functions.
- Do not let navigation hide the same-instance shared model.

## Related Function Docs

- [function-tab-structure.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/navigation/function-tab-structure.md)
- [function-dashboard-home.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/navigation/function-dashboard-home.md)

