# KlodJobs Design System

> Based on Voltagent's engineering-first aesthetic. Dark canvas, single green accent, hairline chrome, calm typography.

---

## 1. Principles

1. **Dark canvas only.** No light mode. The app is one continuous dark surface.
2. **Single accent.** Electric green (`#00d992`) for CTAs, active states, and status indicators. Nothing else.
3. **Hairline chrome.** 1px borders, no shadows, no gradients. Cards sit on the canvas with precise edges.
4. **Calm typography.** Inter at regular weight for display. SF Mono for data and code. No shouting.
5. **Engineered feel.** Every element has a purpose. No decorative fluff.

---

## 2. Colors

### Brand & Accent

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#00d992` | CTAs, active indicators, status pills, brand glyph |
| `primary-soft` | `#2fd6a1` | Ghost button hovers, focus rings, tooltip accents |
| `primary-deep` | `#10b981` | Inline links in body copy |

### Surface

| Token | Hex | Usage |
|-------|-----|-------|
| `canvas` | `#101010` | Default page background — the only surface |
| `canvas-soft` | `#1a1a1a` | Code blocks, input fields, elevated surfaces |
| `canvas-raised` | `#1e1e1e` | Modals, dropdown menus, popovers |
| `hairline` | `#3d3a39` | 1px borders — cards, buttons, dividers |
| `hairline-soft` | `#b8b3b0` | Rare secondary dividers |

### Text

| Token | Hex | Usage |
|-------|-----|-------|
| `ink` | `#f2f2f2` | Default body text on dark |
| `ink-strong` | `#ffffff` | Headlines, high-emphasis text |
| `body` | `#bdbdbd` | Secondary text, descriptions |
| `mute` | `#8b949e` | Captions, timestamps, fine print |

### Semantic

| Token | Hex | Usage |
|-------|-----|-------|
| `success` | `#00d992` | Saved jobs, success toasts (same as primary) |
| `warning` | `#f59e0b` | Caution states, pending status |
| `danger` | `#ef4444` | Delete actions, error toasts, rejected status |
| `info` | `#3b82f6` | Informational messages |

---

## 3. Typography

### Font Families

| Role | Family | Fallbacks | Usage |
|------|--------|-----------|-------|
| Sans | Inter | system-ui, sans-serif | All display, body, buttons, labels |
| Mono | SF Mono | Menlo, Monaco, Consolas, Liberation Mono | Code, data counters, timestamps |

### Type Scale

| Token | Size | Weight | Line Height | Tracking | Use |
|-------|------|--------|-------------|----------|-----|
| `display-xl` | 60px | 400 | 60px | -0.65px | Hero headlines |
| `display-lg` | 36px | 400 | 40px | -0.9px | Section headlines |
| `display-md` | 24px | 700 | 32px | -0.6px | Sub-section titles |
| `display-sm` | 20px | 600 | 28px | 0 | Card titles in grids |
| `eyebrow` | 14px | 600 | 20px | 2.52px | UPPERCASE labels above sections |
| `body-lg` | 18px | 400 | 28px | 0 | Lead paragraphs |
| `body-md` | 16px | 400 | 26px | 0 | Default body text |
| `body-sm` | 14px | 400 | 20px | 0 | Secondary body, inputs |
| `caption` | 12px | 400 | 16px | 0 | Fine print, timestamps |
| `code` | 13px | 400 | 18px | 0 | Code blocks, inline snippets |
| `button` | 16px | 600 | 24px | 0 | Button labels |

### Principles

- Display headlines are **regular weight (400)**, not bold. The brand is calm, not loud.
- Uppercase eyebrows use Inter 600 at 14px with 2.52px tracking. This is the signature label style.
- SF Mono is reserved for anything that could be typed at a terminal — timestamps, job counts, code snippets.

---

## 4. Spacing

### Base Unit: 4px

| Token | Value |
|-------|-------|
| `xxs` | 2px |
| `xs` | 4px |
| `sm` | 8px |
| `md` | 12px |
| `lg` | 16px |
| `xl` | 20px |
| `2xl` | 24px |
| `3xl` | 32px |
| `4xl` | 40px |
| `5xl` | 48px |
| `6xl` | 64px |

### Usage

- **Section padding:** `5xl` (48px) top/bottom
- **Card padding:** `2xl` (24px)
- **Input padding:** `md` `lg` (12px 16px)
- **Button padding:** `md` `lg` (12px 16px)
- **Inline tag padding:** `xs` `md` (4px 12px)

---

## 5. Border Radius

| Token | Value | Use |
|-------|-------|-----|
| `none` | 0px | Full-bleed bands |
| `xs` | 4px | Inline code chips, smallest pills |
| `sm` | 6px | Buttons, inputs |
| `md` | 8px | Cards, code blocks, modals |
| `pill` | 9999px | Status tags, badges |
| `full` | 9999px | Circular icon containers |

---

## 6. Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| 0 — Flat | No shadow, no border | Full-bleed background bands |
| 1 — Hairline | 1px solid `hairline` on `canvas` | Default cards, buttons |
| 2 — Glow | `0 0 15px rgba(92, 88, 85, 0.2)` | Hover/focus on cards |
| 3 — Modal | `0 20px 60px rgba(0,0,0,0.7)` + inset ring | Modals, dialogs |

---

## 7. Components

### Buttons

**Primary** — the green CTA
```
bg: primary (#00d992)
text: canvas (#101010)
font: button (16px/600)
padding: md lg (12px 16px)
radius: sm (6px)
```

**Outline** — secondary on dark
```
bg: canvas
text: ink
border: 1px solid hairline
font: button
padding: md lg
radius: sm
```

**Ghost** — tertiary, text-only
```
bg: transparent
text: primary-soft (#2fd6a1)
border: none
font: button
padding: md lg
radius: sm
```

**Danger** — destructive action
```
bg: transparent
text: danger (#ef4444)
border: 1px solid danger
font: button
padding: md lg
radius: sm
```

**Tag/Pill** — inline status
```
bg: canvas
text: ink
border: 1px solid hairline
font: body-sm (14px/400)
padding: xs md (4px 12px)
radius: pill (9999px)
```

### Cards

**Feature Card** — the default
```
bg: canvas
border: 1px solid hairline
padding: 2xl (24px)
radius: md (8px)
```

**Emphasized Card** — featured/active
```
Same as feature card but 3px solid hairline border
```

**Active Card** — selected state
```
Same as feature card but 2px solid primary border
```

### Inputs

**Text Input**
```
bg: canvas-soft (#1a1a1a)
text: ink
border: 1px solid hairline
font: body-sm (14px)
padding: md lg (12px 16px)
radius: sm (6px)
focus: 1px solid primary
```

### Modals

**Modal Surface**
```
bg: canvas-raised (#1e1e1e)
border: 1px solid hairline
shadow: 0 20px 60px rgba(0,0,0,0.7) + inset ring
radius: md (8px)
padding: 3xl (32px)
```

### Status Tags

| Status | Bg | Text | Border |
|--------|-----|------|--------|
| New | canvas | ink | hairline |
| Saved | canvas | success | success |
| Rejected | canvas | danger | danger |
| Running | canvas | primary | primary |
| Done | canvas | success | success |
| Failed | canvas | danger | danger |

---

## 8. Layout

### Grid

- **Container:** max-width 1200px, centered
- **Sidebar:** 280px fixed (desktop)
- **Content:** flex-1, fluid
- **Gap:** 2xl (24px) between cards
- **Section gap:** 5xl (48px) between sections

### Breakpoints

| Name | Width | Changes |
|------|-------|---------|
| Mobile | < 768px | Sidebar → drawer, cards 1-up, hero scales down |
| Tablet | 768–1023px | Cards 2-up, sidebar hidden |
| Desktop | ≥ 1024px | Full layout, sidebar visible |

### Touch Targets

All interactive elements: minimum 44px tall. Meets WCAG AAA.

---

## 9. Animation

### Principles

- **Calm transitions.** 150-200ms ease-out. No bouncy springs.
- **No decorative animation.** Only functional feedback (hover, focus, loading).
- **Reduced motion.** All animations respect `prefers-reduced-motion`.

### Tokens

| Token | Duration | Easing | Use |
|-------|----------|--------|-----|
| `fast` | 100ms | ease-out | Button hover, focus ring |
| `normal` | 150ms | ease-out | Card hover, input focus |
| `slow` | 200ms | ease-out | Modal enter/exit, drawer slide |
| `loading` | 800ms | linear | Skeleton shimmer, spinner |

### Allowed Animations

- Button hover: scale(1.01), border-color transition
- Card hover: border-color transition, subtle glow
- Modal enter: opacity 0→1, scale 0.98→1 (150ms)
- Modal exit: opacity 1→0, scale 1→0.98 (100ms)
- Drawer slide: translateX(-100%)→0 (200ms)
- Skeleton: background-position shimmer (800ms loop)
- Spinner: rotate 360deg (800ms loop)

### Forbidden Animations

- No bouncing, elastic, or spring physics
- No parallax scrolling
- No floating/pulsing decorative elements
- No gradient animations
- No particle effects

---

## 10. Icons

- **Library:** Lucide React
- **Size:** 16px (inline), 20px (buttons), 24px (navigation)
- **Stroke:** 1.5px
- **Color:** inherit (matches parent text color)
- **Active state:** primary green

---

## 11. Shadows

The brand uses **hairlines, not shadows**. The only exception:

```css
/* Modal backdrop */
box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7),
            0 0 0 1px rgba(148, 163, 184, 0.1) inset;

/* Card hover glow (optional) */
box-shadow: 0 0 15px rgba(92, 88, 85, 0.2);
```

No other shadows. Cards use borders.

---

## 12. Do's and Don'ts

### Do
- Use `primary` green for CTAs only — not body text, not backgrounds
- Build cards with 1px `hairline` borders — not shadows
- Use Inter at weight 400 for display headlines — calm, not loud
- Pair Inter (narrative) with SF Mono (data/code)
- Use `sm` (6px) radius for buttons, `md` (8px) for cards
- Keep the canvas dark — there is no light mode

### Don't
- Don't introduce light mode
- Don't use green as a body-text fill
- Don't add drop shadows on cards
- Don't render headlines in bold (700+)
- Don't replace Inter or SF Mono
- Don't add decorative animations
- Don't use gradient backgrounds
- Don't use rounded pills for buttons (only for status tags)
