# Changelog Frontend

## Purpose

This document defines the frontend/UI presentation contract for the changelog feature.

For behavioral rules, state logic, and data semantics, read the paired function doc:

- [function-changelog.md](./function-changelog.md)

The Pencil baseline for this feature is pending (to be added after design draft is reviewed).

---

## Feature Structure

The changelog feature consists of two surfaces:

- an **entry row** embedded at the bottom of the module management page
- a **bottom sheet** that appears over the page when the entry row is tapped

---

## Entry Row

### Placement

The entry row sits at the bottom of the module management page, below the `模块管理` card, using the page-level horizontal padding (`space.page = 16px`). It is not wrapped in a card or any container background.

Bottom clearance from the page edge must be at least `24px`.

If a tab bar is added in the future, the entry row must sit above it.

### Layout

The row uses a horizontal layout with two sides:

**Left side** — vertical stack, `gap: 3px`:

- Line 1: label `更新记录` (`font.size.body = 14px`, `font.weight: 500`, `color.text.primary`) with an unread dot immediately to its right
- Line 2: preview text `最近：{title}` where `{title}` is the `title` field of the most recent changelog entry (`font.size.caption = 12px`, `color.text.muted`)

**Right side**:

- A `chevron-right` icon (`16px`, `color.text.muted`), vertically centered against the left side

### Unread Dot

The dot is a `7px` filled circle (`color.accent.period = #C9786A`) placed inline after the `更新记录` label text, aligned to the center of the label's cap height.

The dot is only rendered when there is an unread update. When the update has been read, the dot is not shown and no placeholder space is left.

### States

| State | Dot | Preview text | Row visibility |
|---|---|---|---|
| Has unread update | Shown | `最近：{title}` of latest entry | Visible |
| All updates read | Hidden | `最近：{title}` of latest entry | Visible |
| No changelog data | — | — | Hidden entirely, no placeholder |

When the entry row is hidden, no empty space is left in its position.

---

## Bottom Sheet

### Trigger and Dismiss

The sheet opens when the entry row is tapped.

Three dismiss paths must be supported:

- Tapping the dim overlay above the sheet
- Downward swipe gesture on the sheet
- An optional close button inside the sheet (implementation may choose to include this)

### Overlay

A dim overlay covers the page behind the sheet: `rgba(0, 0, 0, 0.18)`. The overlay is not fully opaque. It visually establishes a modal boundary without darkening the page aggressively.

### Sheet Dimensions

- Height: 70% of the screen height, fixed. The sheet does not grow or shrink to fit content.
- Width: full screen width
- Top corners: `radius.panel = 14px`
- Bottom corners: no radius (sheet is flush to the screen bottom)
- Background: `color.bg.card = #FFFFFF`

### Sheet Internal Layout

The sheet uses a vertical layout with `20px` horizontal padding throughout.

From top to bottom:

1. **Drag indicator** — centered horizontally, `32px × 4px`, `radius.pill`, `color.border.subtle`, `24px` top margin
2. **Sheet title** `更新记录` — `font.size.title = 18px`, `font.weight: 600`, `color.text.primary`, `16px` top gap after indicator
3. **Section label** `最近更新` — `font.size.caption = 12px`, `color.text.muted`, `20px` top gap
4. **Latest entry summary** — the latest entry shows its `version` and `title` on the left and its `date` right-aligned on the same row before the change bullets
5. **Change list** — one item per `changes` entry, bullet style, `font.size.body = 14px`, `color.text.primary`, `gap: 8px` or tighter
6. **Divider** — `1px` full-width rule, `color.border.subtle`, `20px` top and bottom margin
7. **Section label** `历史版本` — same style as `最近更新`
8. **Accordion list** — one item per entry in the changelog array starting from index 1, `gap: 0`

The sheet content is scrollable. The page behind the sheet is not scrollable while the sheet is open.

### Accordion Items

Each accordion item represents a past changelog entry (all entries except the most recent).

**Collapsed state**:

```
{version} {title}           {date}  ›
```

- Label: `{version} {title}` — `font.size.body = 14px`, `font.weight: 500`, `color.text.primary`
- Date: `{date}` — `font.size.caption = 12px`, `color.text.muted`, right-aligned in the same row
- Chevron: `chevron-right`, `16px`, `color.text.muted`, right-aligned
- Padding: `14px` vertical, `0` horizontal (inherits sheet padding)
- A `1px` top border using `color.border.subtle` separates adjacent items

**Expanded state**:

```
{version} {title}           {date}  ˅
  · change item one
  · change item two
```

- Chevron rotates to point down
- Change list renders below the header with a compact top gap, `12px` left indent, `font.size.body`, `color.text.secondary`

Only one accordion item should be expanded at a time. Expanding a new item collapses the previously expanded one.

---

## Animation

| Event | Style |
|---|---|
| Sheet opening | slide-up from bottom, `ease-out`, `280ms` |
| Sheet closing | slide-down, `ease-in`, `220ms` |
| Overlay appear | `fade-in`, synchronized with sheet opening |
| Overlay disappear | `fade-out`, synchronized with sheet closing |
| Accordion expand | height expand, `ease-out`, `180ms` |
| Accordion collapse | height collapse, `ease-in`, `150ms` |

---

## Visual Direction

The entry row and sheet should feel:

- quiet and secondary — not competing with the module management card above it
- readable and warm — consistent with the rest of the module management page

The entry row should not feel like:

- a notification badge or alert element
- a settings item
- a button that demands attention

The sheet should not feel like:

- a full-page navigation destination
- a release notes dump
- a technical log

### Copy Rule

Changelog bullets must stay on the user side of the product boundary:

- describe new user-visible features
- describe visible UI or behavior changes to existing features
- avoid implementation details, infrastructure notes, or internal service names
