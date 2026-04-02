# Playwright MCP Browser Scenarios

## Purpose

This checklist describes the local browser-scenario supplement that is executed by an AI agent through Playwright MCP.

It is not a code-first test suite. The goal is to verify user-visible behavior with browser actions, visible text, and runtime state transitions rather than only asserting internal functions.

Use this supplement when the change affects:

- H5 browser behavior
- page navigation or shell-to-home entry
- drag, long-press, or other gesture-driven interactions
- request routing or live data flow that only becomes obvious in a browser

## Execution Model

- The AI opens the browser, loads the local H5 app, and verifies the page by observing rendered state.
- The AI uses Playwright MCP actions such as navigation, click, drag, keyboard input, screenshots, and DOM inspection when needed.
- The AI should prefer visible user outcomes over brittle implementation details.
- If a scenario is unclear in the browser, the AI should inspect the runtime state first, then choose the smallest interaction that reproduces the behavior.

## Scenario Set

### 1. Module shell entry

Goal:

- verify the module shell loads
- verify private/shared placement is visible
- verify tapping the menstrual module opens the home page

Pass criteria:

- the shell renders without a blank screen
- the visible zone state matches the current module sharing state
- the home page opens with the expected title and live context

### 2. Single-day editing

Goal:

- verify a day can be selected
- verify the day can be marked and cleared
- verify the browser shows the updated state after refresh

Pass criteria:

- the selected date panel updates to the active date
- the period mark appears and disappears as expected
- the state survives a reload

### 3. Batch gesture editing

Goal:

- verify long-press enters batch mode
- verify drag extends and retracts the selected range
- verify save and cancel behave as expected

Pass criteria:

- batch controls appear only after the long-press threshold
- drag feedback matches the selected span
- saved ranges persist after refresh

### 4. Sharing and revoke

Goal:

- verify the same module instance is used for private and shared access
- verify sharing changes state instead of copying data
- verify revoke removes partner access

Pass criteria:

- the browser can show shared state and private state on the same module instance
- partner-visible data remains aligned with the owner data
- revoke removes the partner view of the module

### 5. Settings propagation

Goal:

- verify changing default period duration updates subsequent live behavior
- verify the next first-day record reflects the updated duration

Pass criteria:

- the settings UI reports the new value
- the next day-record flow uses the updated default duration

### 6. Routing and transport diagnostics

Goal:

- verify frontend request routing still matches the dev/prod model
- verify headers and URL selection still match the active environment

Pass criteria:

- dev-mode browser traffic goes to the local API surface
- the browser-visible requests carry the expected auth header
- the cloud-request routing path matches the active environment rules

## Recommended Run Order

1. Run the automated P0/P1 code tests that apply to the changed files.
2. Run the H5 live regression entry.
3. Run this browser-scenario supplement through Playwright MCP.
4. If the change touches sharing or settings, include those scenarios before signoff.

## Expected Output

When an AI agent executes this checklist, it should report:

- which scenarios were run
- which browser observations were verified
- which scenario, if any, remains unverified
- whether the behavior is blocked by a code defect or by missing environment setup

