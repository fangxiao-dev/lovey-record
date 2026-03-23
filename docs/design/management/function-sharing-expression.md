# Sharing Expression

## Purpose

This document defines how shared state should be expressed in management-related surfaces.

## Core Rule

Shared state means access to the same module instance.

It never means:

- cloned module data
- a second copy of the same record set
- parallel private/shared page trees with separate truth

## UI Expectations

- shared state should be visible without dominating the page
- private/shared organization should remain understandable
- lightweight badges or avatar-style indicators are preferred over noisy text-heavy markers where appropriate

## Must Preserve

- same-instance semantics
- owner/shared distinction
- clear module entry

