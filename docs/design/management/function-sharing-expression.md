# Sharing Expression

## Purpose

This document defines the durable feature semantics for how shared state is represented on management-related surfaces.

For the frontend/UI presentation contract, read:

- [frontend-sharing-expression.md](./frontend-sharing-expression.md)

## Core Rule

Shared state means access to the same module instance.

It never means:

- cloned module data
- a second copy of the same record set
- parallel private/shared page trees with separate truth

## Must Preserve

- same-instance semantics
- owner/shared distinction
- clear module entry

## Related Docs

- [frontend-sharing-expression.md](./frontend-sharing-expression.md)
