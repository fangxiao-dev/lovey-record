# Module Home Visual Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refresh the module home page so the hero card, calendar card, legend, and inline editor share one softer visual system while preserving existing mini program behavior.

**Architecture:** Keep the current page structure and data flow, but introduce a richer calendar header view-model and replace the current dense card styling with a unified warm, airy visual system. Store the external React reference and a static concept asset under a dedicated draft directory so the design process remains traceable without leaking into runtime code.

**Tech Stack:** Native WeChat Mini Program WXML/WXSS, existing module-home service tests, static markdown/SVG draft assets

---

### Task 1: Archive the design draft inputs

**Files:**
- Create: `docs/design-drafts/module-home-visual-refresh/README.md`
- Create: `docs/design-drafts/module-home-visual-refresh/reference-react.jsx`
- Create: `docs/design-drafts/module-home-visual-refresh/concept.svg`

**Step 1: Add the draft folder and summary**

Document the purpose of the folder and clarify that it is a non-runtime intermediate draft archive.

**Step 2: Save the React reference snippet**

Persist the provided React visual exploration as a reference artifact.

**Step 3: Add a static concept image**

Create a lightweight static concept asset matching the approved direction closely enough for future reference.

### Task 2: Add failing view-model tests for the refreshed calendar header

**Files:**
- Modify: `tests/services/module-home-service.test.js`
- Modify: `services/module-home-service.js`

**Step 1: Write failing tests**

Add assertions for a split cycle-window header model:
- same-month windows expose `yearLabel` and `monthLabel`
- cross-month windows expose a combined `rangeLabel`
- the same-month header does not collapse into a range-only title

**Step 2: Run test to verify it fails**

Run: `node --test tests/services/module-home-service.test.js`
Expected: FAIL because the new header fields do not exist yet.

**Step 3: Implement the minimal view-model changes**

Expose the header fields required by the new WXML structure.

**Step 4: Run test to verify it passes**

Run: `node --test tests/services/module-home-service.test.js`
Expected: PASS

### Task 3: Rebuild the module-home page styling around the approved visual system

**Files:**
- Modify: `pages/module-home/index.wxml`
- Modify: `pages/module-home/index.wxss`

**Step 1: Update the WXML structure**

Refactor the cycle-window header into:
- arrow-style step buttons
- centered year/month block for same-month windows
- centered range label for cross-month windows

Keep all existing bindings and behaviors intact.

**Step 2: Refresh the card hierarchy**

Bring hero card, calendar card, legend, and inline editor onto the same rounded, airy card system.

**Step 3: Refresh calendar day styling**

Replace the current blocky day cells with lighter cells, connected period bands, softer prediction states, and a subtler today marker.

**Step 4: Refresh inline editor styling**

Update chips, buttons, fields, and textarea chrome so they visually match the new calendar system.

### Task 4: Verify the implementation

**Files:**
- Verify: `tests/services/module-home-service.test.js`

**Step 1: Run automated verification**

Run: `node --test tests/services/module-home-service.test.js`
Expected: PASS

**Step 2: Manual verification in WeChat DevTools**

Check:
- same-month cycle window renders year + month split header
- cross-month window renders a range header
- hero card, calendar card, legend, and panel now look visually unified
- period, prediction, special, and today remain visually distinguishable

**Step 3: Report verification status honestly**

If DevTools verification is not run in this session, report that implementation is complete but manual UI verification remains pending.
