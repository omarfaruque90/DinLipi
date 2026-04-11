# Design System Specification: The Ethereal Ledger

## 1. Overview & Creative North Star: "The Digital Curator"
This design system moves away from the utilitarian, spreadsheet-like nature of traditional finance. Our Creative North Star is **"The Digital Curator."** We treat a user’s financial data not as a series of rows, but as a collection of precious assets held within a premium, multi-dimensional space.

To achieve this "High-End Editorial" feel, we reject the rigid, boxed-in layouts of legacy banking. We embrace **intentional asymmetry**, where large editorial typography (`display-lg`) anchors the screen, and glass-morphic cards float with an organic, physics-based lightness. This system feels less like software and more like a high-end physical gallery—translucent, deep, and meticulously organized.

---

## 2. Colors & Surface Philosophy
The palette is built on a foundation of "Nocturnal Depth"—deep purples and vibrant violets that provide a canvas for glowing financial data.

### The Foundation
*   **Background (Core):** `#060e20` (Surface)
*   **Primary Accent:** `#ba9eff` (Primary) to `#8455ef` (Primary Dim)
*   **Tertiary (Success):** `#9bffce` (Tertiary) — used for growth and positive balances.
*   **Error:** `#ff6e84` (Error) — used sparingly for critical alerts.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section content. Boundaries must be defined through background shifts or tonal transitions. 
*   Use `surface-container-low` for large background sections.
*   Use `surface-container-high` for interactive card elements.
*   Contrast is achieved through depth, not strokes.

### The "Glass & Gradient" Rule
To create "soul," never use flat fills for primary actions. 
*   **Signature Gradient:** Linear 135°: `primary` (#ba9eff) to `primary_dim` (#8455ef).
*   **Glassmorphism:** For floating overlays (Bottom Sheets, Modals), use `surface_bright` at 60% opacity with a `20px` backdrop-blur.

---

## 3. Typography: Editorial Authority
We pair **Plus Jakarta Sans** for expressive, high-impact headings with **Inter** for clinical, high-readability data.

| Role | Token | Font | Size | Intent |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | `display-lg` | Plus Jakarta Sans | 3.5rem | Hero balances; high-impact "wow" moments. |
| **Headline** | `headline-sm` | Plus Jakarta Sans | 1.5rem | Section headers; conversational UI. |
| **Title** | `title-md` | Inter | 1.125rem | Transaction names; Card titles. |
| **Body** | `body-md` | Inter | 0.875rem | General metadata and descriptions. |
| **Label** | `label-sm` | Inter | 0.6875rem | Micro-data (Timestamps, Tags). |

*Hierarchy Note:* Use `primary` color for `display` text to make financial figures feel like the "hero" of the experience.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are too "heavy" for a premium finance app. We use **Ambient Stacking**.

*   **The Layering Principle:** 
    *   Base: `surface`
    *   Section: `surface-container-low`
    *   Interactive Card: `surface-container-highest`
*   **Ambient Shadows:** When a card must float, use a shadow color tinted with the `on-surface` (#dee5ff) color at 6% opacity, with a blur radius of at least `32px`.
*   **The "Ghost Border":** If a separation is required for accessibility, use the `outline_variant` (#40485d) at **15% opacity**. Never use a 100% opaque stroke.

---

## 5. Signature Components

### Buttons (High-Radius)
*   **Primary:** Gradient fill (`primary` to `primary_dim`). `round-xl` (3rem) corners. White text (`on-primary_fixed`).
*   **Secondary:** Glass-morphic. `surface_bright` at 20% opacity. `outline` at 10% opacity.
*   **States:** On press, scale the button to 0.96x to simulate physical "glass" being pressed into a soft surface.

### Financial Transaction Cards
*   **Design:** No dividers. Use a `1.5rem` (md) vertical gap between items.
*   **Leading Element:** `48px` circular (`round-full`) glass container for brand icons (bKash, Nagad).
*   **Trailing Element:** Positive values in `tertiary`, negative in `on-surface`. Use `title-md` for amounts.

### Input Fields
*   **Surface:** `surface-container-highest`.
*   **Shape:** `round-md` (1.5rem).
*   **Focus State:** Instead of a border, use a subtle `2px` outer glow using the `primary` color at 30% opacity.

### Glass Bottom Navigation
*   **Effect:** Full `backdrop-blur` (30px). 
*   **Color:** `surface_container` at 70% opacity.
*   **Indicator:** An active pill using the signature gradient, placed *behind* the icon.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use extreme whitespace. If you think there is enough space, add 8px more.
*   **Do** use `plusJakartaSans` for any number over 24pt. Finance is about the numbers; let them be beautiful.
*   **Do** overlap elements. Let a glass card sit slightly over a background gradient to show off the blur effect.

### Don’t
*   **Don't** use pure black (#000000) for backgrounds. It kills the depth of the purples. Use `surface` (#060e20).
*   **Don't** use 1px dividers. They make the app look like a legacy banking portal. Use "Negative Space" as your divider.
*   **Don't** use high-contrast borders on error states. Use a soft glow or a background tint change to `error_container` at low opacity.

---

## 7. Iconography & Financial Logos
Icons should be "Friendly-Modern"—linear with a 2px stroke weight and rounded terminals. 
*   **Financial Logos:** When displaying local logos like bKash or Nagad, place them inside a `round-sm` white-glass container to ensure brand colors don't clash with the deep purple theme.
*   **Active State:** Icons should glow slightly using the `surface_tint` when selected.