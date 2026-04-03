# Sharing Expression Frontend

## Purpose

This document defines the durable frontend/UI presentation contract for how private/shared state is expressed on management-related surfaces.

For feature semantics and same-instance meaning, read:

- [function-sharing-expression.md](./function-sharing-expression.md)

## UI Expectations

- shared state should be visible without dominating the page
- private/shared organization should remain understandable
- lightweight badges or avatar-style indicators are preferred over noisy text-heavy markers where appropriate

## Presentation Rules

- sharing signals should help orientation first, not become the primary content of a module card
- ownership and shared-state cues should stay readable in both quiet and dense layouts
- sharing indicators should not imply duplicated module data or a second module tree

## UI Dependency

This file defines the UI contract only.

Behavioral rules for what shared/private actually means must be maintained in [function-sharing-expression.md](./function-sharing-expression.md).
