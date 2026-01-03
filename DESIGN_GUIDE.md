# Design Guide & Style Reference

This document outlines the core design system tokens and patterns used throughout the application, based on the reference `/perfume` page. Use this as a guide to build new, consistent UI components.

### Typography

The typographic scale relies on three font families to create hierarchy.

- **Serif Font (`font-serif`):** Used for primary headlines and important, evocative text.
  - **Classes:** `font-serif`
  - **Use Cases:** Page titles (`h1`), perfume names, feature descriptions.
  - **Examples:**
    - `text-5xl md:text-6xl` for main page titles.
    - `text-xl` or `text-lg` for card titles and prominent text.

- **Sans-serif Font (`font-sans`):** The workhorse font for all UI elements and body copy.
  - **Classes:** `font-sans` (often default)
  - **Use Cases:** Body text, button labels, input fields, navigation.

- **Mono Font (`font-mono`):** Used sparingly for tertiary, "brand" or "logo" text.
  - **Classes:** `font-mono`
  - **Use Cases:** The "Scentia" wordmark in the header.

**Common Styles:**
- **Section Headers:** `text-[10px] font-bold uppercase tracking-widest text-stone-400`
- **Button Text:** `text-xs font-bold uppercase tracking-[0.2em]` or `tracking-widest`
- **Labels / Meta Text:** `text-[9px]` or `text-xs`, often uppercase with wide tracking.

---

### Color Palette

The palette is minimalist and primarily uses the "Stone" color set from Tailwind CSS.

- **Backgrounds:**
  - **Primary Page:** `bg-stone-50` (`#FAFAF9`)
  - **Cards / Sections:** `bg-white` or `bg-stone-50` / `bg-stone-100`.
  - **Card Hover/Active:** `bg-stone-50` or `bg-stone-100`.

- **Text:**
  - **Primary:** `text-stone-900` (`#1C1917`) - For all major headings and body text.
  - **Secondary:** `text-stone-500` or `text-stone-600` - For less important labels and descriptions.
  - **Tertiary / Disabled:** `text-stone-400` or `text-stone-300` - For subtitles, placeholders, and disabled states.

- **Borders:**
  - **Standard:** `border-stone-200` (`#E7E5E4`) - The most common border for cards, inputs, and dividers.
  - **Interactive (Hover):** `border-stone-300` or `border-stone-400`.
  - **Active / Focused:** `border-stone-900`.

- **Buttons & Accents:**
  - **Primary Action:** `bg-stone-900` with `text-white`.
  - **Secondary Action:** `border-stone-200 text-stone-600`, `hover:border-stone-900 hover:text-stone-900`.
  - **Accent / Verified:** `text-sky-500` (Blue).
  - **Success / Positive:** `text-emerald-700` with `bg-emerald-50` (Green).
  - **Warning / Neutral:** `text-amber-700` with `bg-amber-50` (Yellow/Orange).
  - **Danger / Negative:** `text-red-700` with `bg-red-50` (Red).

---

### Layout & Sizing

- **Max Width:** `max-w-6xl` is the standard for main page content containers.
- **Page Padding:** `px-6` is the standard horizontal padding.
- **Component Padding:** `p-4`, `p-6`, `p-8` are common. `p-6` is a good default for cards.
- **Gaps:** `gap-4`, `gap-8`, `gap-12` are used for grids. `space-y-4` or `space-y-6` for vertical stacking.
- **Border Radius:**
  - **Cards & Inputs:** `rounded-2xl`
  - **Large Containers:** `rounded-[32px]`
  - **Buttons & Pills:** `rounded-full`

---

### Component Recipes

- **Primary Button:**
  ```html
  <button class="px-6 py-3 bg-stone-900 text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-stone-700 transition">
    Action
  </button>
  ```

- **Secondary Button:**
  ```html
  <button class="px-6 py-3 bg-white border border-stone-200 text-stone-600 text-xs font-bold uppercase tracking-widest rounded-full hover:border-stone-900 hover:text-stone-900 transition">
    Action
  </button>
  ```

- **Standard Card:**
  ```html
  <div class="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
    <!-- Content -->
  </div>
  ```

- **Main Section Card (with blur):**
  ```html
  <div class="bg-stone-50/80 backdrop-blur-md rounded-[32px] p-12 shadow-lg">
    <!-- Content -->
  </div>
  ```
