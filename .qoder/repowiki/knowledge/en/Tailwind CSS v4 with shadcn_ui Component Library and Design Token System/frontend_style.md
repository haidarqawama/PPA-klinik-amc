## Styling Architecture

The Hospital Pharmacy Inventory System uses **Tailwind CSS v4** as its core CSS framework, paired with the **shadcn/ui** component library pattern for reusable UI primitives. The styling system is built on a design token architecture using CSS custom properties (CSS variables) that map to Tailwind utility classes.

### Core Technology Stack

- **CSS Framework**: Tailwind CSS v4 (`tailwindcss@^4.3.0`) with `@tailwindcss/postcss` plugin
- **Component Library Pattern**: shadcn/ui — unstyled, copy-paste React components built on Radix UI primitives
- **Utility Functions**: `clsx` + `tailwind-merge` via a `cn()` helper for conditional class composition
- **Icon Library**: Lucide React (`lucide-react@^1.16.0`)
- **Font System**: Geist Sans + Geist Mono (Google Fonts via `next/font`)
- **Dark Mode**: CSS class-based toggle using `.dark` selector variant

## Key Files and Their Roles

### Design Tokens: `frontend/src/app/theme.css`
This file defines the entire visual design system through CSS custom properties:

- **Color Palette**: Primary brand color is `#00B4D8` (cyan/teal), with semantic colors for success (`#38A169`), warning (`#DD6B20`), destructive (`#E53E3E`), and neutral tones from the Chakra UI palette (`#F8FAFB`, `#1A202C`, etc.)
- **Semantic Tokens**: `--background`, `--foreground`, `--card`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--success`, `--warning`, `--border`, `--ring`
- **Sidebar-Specific Tokens**: Dedicated tokens for sidebar theming (`--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, etc.)
- **Chart Colors**: Five-chart palette matching the semantic color scheme
- **Border Radius Scale**: `--radius-sm` through `--radius-xl` derived from base `--radius: 0.75rem`
- **Dark Mode Overrides**: Complete dark theme defined under `.dark` class using OKLCH color space for improved perceptual uniformity

The `@theme inline` block maps CSS variables to Tailwind's internal theme system, enabling usage like `bg-primary`, `text-foreground`, `border-border` in component classNames.

### Global Styles: `frontend/src/app/globals.css`
Minimal entry point that imports Tailwind and the theme:
```css
@import "tailwindcss";
@import "./theme.css";
```

### PostCSS Configuration: `frontend/postcss.config.mjs`
Configures the Tailwind v4 PostCSS plugin:
```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

### Component Utility: `frontend/src/components/ui/utils.ts`
The `cn()` function merges Tailwind classes intelligently:
```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```
This enables safe conditional class composition without specificity conflicts.

## Component Library Pattern (shadcn/ui)

The `frontend/src/components/ui/` directory contains ~40 pre-built UI components following the shadcn/ui convention:

- **Form Controls**: `input.tsx`, `textarea.tsx`, `checkbox.tsx`, `radio-group.tsx`, `select.tsx`, `switch.tsx`, `slider.tsx`
- **Layout**: `card.tsx`, `separator.tsx`, `scroll-area.tsx`, `resizable.tsx`, `tabs.tsx`, `accordion.tsx`
- **Overlays**: `dialog.tsx`, `sheet.tsx`, `popover.tsx`, `dropdown-menu.tsx`, `tooltip.tsx`, `hover-card.tsx`
- **Navigation**: `breadcrumb.tsx`, `pagination.tsx`, `navigation-menu.tsx`, `sidebar.tsx`
- **Feedback**: `alert.tsx`, `alert-dialog.tsx`, `badge.tsx`, `progress.tsx`, `sonner.tsx` (toast notifications)
- **Data Display**: `table.tsx`, `chart.tsx`, `calendar.tsx`, `avatar.tsx`
- **Complex Inputs**: `command.tsx`, `combobox`, `input-otp.tsx`

### Component Structure Convention

Each component follows a consistent pattern:
1. Imports `cn` from `./utils`
2. Uses `data-slot` attributes for styling hooks
3. Accepts `className` prop merged via `cn()`
4. Leverages Tailwind utility classes referencing design tokens (e.g., `bg-primary`, `text-muted-foreground`)
5. Uses `cva` (class-variance-authority) for variant-based styling where applicable (see `button.tsx`)

### Button Variants Example

The `button.tsx` component demonstrates the variant system:
- **Variants**: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
- **Sizes**: `default` (h-9), `sm` (h-8), `lg` (h-10), `icon` (size-9)
- Each variant references design tokens: `bg-primary text-primary-foreground`, `bg-destructive text-white`, etc.

## Layout and Typography

### Root Layout: `frontend/src/app/layout.tsx`
- Applies Geist Sans and Geist Mono font families via CSS variables
- Sets `antialiased` class for smoother text rendering
- Body uses `min-h-full flex flex-col` for full-height layout structure

### Responsive Strategy
No explicit breakpoint overrides found in theme files. The system relies on Tailwind's default responsive breakpoints (`sm`, `md`, `lg`, `xl`, `2xl`) applied directly in component classNames. Components use fluid sizing patterns (e.g., `flex`, `grid`, `gap-*`) rather than fixed dimensions.

## Developer Conventions

1. **Always use `cn()` for class composition**: Never concatenate className strings manually. Use `cn(baseClass, condition && conditionalClass, props.className)` pattern.

2. **Reference design tokens, not hardcoded colors**: Use `bg-primary`, `text-muted-foreground`, `border-border` instead of hex values. Hardcoded colors break dark mode and theme consistency.

3. **Extend components via className prop**: All shadcn/ui components accept `className` for customization. Do not modify source files in `components/ui/` — override via props.

4. **Use cva for new variant-based components**: When creating components with multiple visual states, use `class-variance-authority` to define variants cleanly.

5. **Dark mode compatibility**: Test all new components in both light and dark modes. The `.dark` class on `<html>` toggles the theme; ensure all color references use semantic tokens.

6. **Icon sizing**: Buttons and interactive elements auto-size embedded SVGs via `[&_svg:not([class*='size-'])]:size-4`. Explicitly set icon sizes when needed.

7. **Accessibility**: Components include focus-visible rings (`focus-visible:ring-ring/50`), aria-invalid states, and disabled opacity handling by default. Preserve these patterns.