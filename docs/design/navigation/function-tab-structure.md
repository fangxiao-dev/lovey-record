# Tab Structure

## Purpose

This document freezes the current product-level tab structure.

## Current Decision

The global bottom navigation uses `2 tabs`:

1. dashboard home
2. module management

## Why This Structure

- It keeps the first landing focused on continuation, not organization.
- It keeps module management available without making it the default burden.
- It avoids inventing a separate shared-space tab before the MVP needs one.

## Rules

- The first tab is the default product entry.
- The second tab is where users browse and manage the full module space.
- Shared access remains a module-instance rule, not a navigation branch that duplicates data.
- Additional tabs should not be added unless the product gains a truly separate, recurring user task.

