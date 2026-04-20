# Frontend H5 Live Regression

## Purpose

This document is the single source of truth for the H5 browser regression entry used by Playwright on the frontend delivery line.

Use it when you need to:

- boot local frontend/backend prerequisites for browser verification
- run the fixed menstrual H5 live regression entry
- understand the expected localhost ports for H5 validation

## Fixed Local Ports

- frontend H5 dev server: `http://localhost:5173`
- backend API: `http://localhost:3004`
- backend health check: `http://localhost:3004/health`

These ports are the default local acceptance surface for the current H5 live regression flow.

## Primary Commands

### One-click startup plus regression

```powershell
npm run test:menstrual:live:boot
```

What it does:

- checks Docker/MySQL availability for backend local runtime
- reuses existing frontend `5173` and backend `3004` processes when already running
- starts missing frontend/backend processes in the background when needed
- waits for the frontend root and backend health endpoint to become ready
- runs the fixed Playwright H5 live regression suite

### Regression only

```powershell
npm run test:menstrual:live
```

Use this when frontend `5173` and backend `3004` are already up and healthy.

## Script Location

The one-click startup flow is implemented in:

- `scripts/run-menstrual-live-regression.ps1`

The fixed Playwright suite entry is:

- `frontend/scripts/menstrual-home-batch-live-regression.spec.mjs`

## Expected Result

Successful execution should end with Playwright passing all current H5 live tests.

Current expected suite size:

- `20 passed`

If the suite count changes later, update this document and the release-gate references together.

## When To Reference This Doc

- from frontend verification flow docs and instructions
- from release-gate execution docs
- from session handoffs when asking the next agent to run browser regression
