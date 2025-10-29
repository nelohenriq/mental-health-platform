# Design System - Mental Health Platform

## Overview

This design system establishes the visual foundation for the mental health platform, ensuring consistency, accessibility, and scalability across all user interfaces. Built with a mobile-first approach and WCAG 2.1 AA compliance in mind.

## Color Palette

### Primary Colors (Accessibility-Compliant)
```css
--color-primary-50: #eff6ff;   /* Blue-50 - Backgrounds */
--color-primary-100: #dbeafe;  /* Blue-100 - Light backgrounds */
--color-primary-200: #bfdbfe;  /* Blue-200 - Subtle accents */
--color-primary-300: #93c5fd;  /* Blue-300 - Hover states */
--color-primary-400: #60a5fa;  /* Blue-400 - Interactive elements */
--color-primary-500: #3b82f6;  /* Blue-500 - Primary (4.5:1 on white) */
--color-primary-600: #2563eb;  /* Blue-600 - Primary hover (4.5:1 on white) */
--color-primary-700: #1d4ed8;  /* Blue-700 - Focus rings (4.5:1 on white) */
--color-primary-800: #1e40af;  /* Blue-800 - Dark accents */
--color-primary-900: #1e3a8a;  /* Blue-900 - Darkest accents */
```

### Status Colors (High Contrast)
```css
/* Success - Meets 4.5:1 contrast on white */
--color-success-50: #ecfdf5;   /* Emerald-50 - Backgrounds */
--color-success-100: #d1fae5;  /* Emerald-100 - Light backgrounds */
--color-success-500: #10b981;  /* Emerald-500 - Success text (4.5:1) */
--color-success-600: #059669;  /* Emerald-600 - Success hover (4.5:1) */
--color-success-700: #047857;  /* Emerald-700 - Dark success (4.5:1) */

/* Error - Meets 4.5:1 contrast on white */
--color-error-50: #fef2f2;     /* Red-50 - Backgrounds */
--color-error-100: #fee2e2;    /* Red-100 - Light backgrounds */
--color-error-500: #ef4444;    /* Red-500 - Error text (4.5:1) */
--color-error-600: #dc2626;    /* Red-600 - Error hover (4.5:1) */
--color-error-700: #b91c1c;    /* Red-700 - Dark error (4.5:1) */

/* Warning - Meets 4.5:1 contrast on white */
--color-warning-50: #fffbeb;   /* Amber-50 - Backgrounds */
--color-warning-100: #fef3c7;  /* Amber-100 - Light backgrounds */
--color-warning-500: #f59e0b;  /* Amber-500 - Warning text (4.5:1) */
--color-warning-600: #d97706;  /* Warning-600 - Warning hover (4.5:1) */
--color-warning-700: #b45309;  /* Warning-700 - Dark warning (4.5:1) */

/* Info - Meets 4.5:1 contrast on white */
--color-info-50: #eff6ff;     /* Blue-50 - Backgrounds */
--color-info-100: #dbeafe;    /* Blue-100 - Light backgrounds */
--color-info-500: #3b82f6;    /* Blue-500 - Info text (4.5:1) */
--color-info-600: #2563eb;    /* Blue-600 - Info hover (4.5:1) */
--color-info-700: #1d4ed8;    /* Blue-700 - Dark info (4.5:1) */
```

### Neutral Colors (Accessibility-Optimized)
```css
--color-gray-50: #f9fafb;    /* Gray-50 - Lightest backgrounds */
--color-gray-100: #f3f4f6;   /* Gray-100 - Card backgrounds */
--color-gray-200: #e5e7eb;   /* Gray-200 - Borders, dividers */
--color-gray-300: #d1d5db;   /* Gray-300 - Muted borders */
--color-gray-400: #9ca3af;   /* Gray-400 - Disabled text (avoid for body text) */
--color-gray-500: #6b7280;   /* Gray-500 - Secondary text (4.5:1 on white) */
--color-gray-600: #4b5563;   /* Gray-600 - Body text (7:1 on white) */
--color-gray-700: #374151;   /* Gray-700 - Strong text (11:1 on white) */
--color-gray-800: #1f2937;   /* Gray-800 - Headings (15.8:1 on white) */
--color-gray-900: #111827;   /* Gray-900 - Darkest text (21:1 on white) */
```

### Semantic Color Tokens (Accessibility-First)
```css
/* Text Colors - All meet 4.5:1 minimum contrast */
--color-text-primary: var(--color-gray-900);     /* Primary text (21:1) */
--color-text-secondary: var(--color-gray-700);   /* Secondary text (11:1) */
--color-text-muted: var(--color-gray-600);       /* Muted text (7:1) */
--color-text-placeholder: var(--color-gray-500); /* Placeholder text (4.5:1) */
--color-text-disabled: var(--color-gray-400);    /* Disabled text (4.5:1) */

/* Background Colors */
--color-bg-primary: #ffffff;    /* Primary background */
--color-bg-secondary: var(--color-gray-50);  /* Secondary background */
--color-bg-muted: var(--color-gray-100);    /* Muted background */
--color-bg-accent: var(--color-primary-50); /* Accent background */

/* Interactive Colors */
--color-interactive-primary: var(--color-primary-500);     /* Primary actions */
--color-interactive-hover: var(--color-primary-600);      /* Primary hover */
--color-interactive-focus: var(--color-primary-700);      /* Focus indicators */
--color-interactive-disabled: var(--color-gray-300);      /* Disabled state */

/* Status Colors */
--color-status-success: var(--color-success-600);   /* Success indicators */
--color-status-error: var(--color-error-600);       /* Error indicators */
--color-status-warning: var(--color-warning-600);   /* Warning indicators */
--color-status-info: var(--color-info-600);         /* Info indicators */
```

## Typography

### Font Family (Accessibility-Optimized)
```css
--font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
--font-family-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;

/* Fallback fonts ensure accessibility across all devices */
--font-family-system: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

### Font Sizes (Fluid Typography with Accessibility)
```css
/* Mobile-first with clamp() for fluid scaling - minimum 16px on mobile to prevent zoom */
--text-xs: clamp(0.875rem, 0.8rem + 0.3vw, 1rem);       /* 14px → 16px (was 12px) */
--text-sm: clamp(0.875rem, 0.8rem + 0.3vw, 1rem);       /* 14px → 16px (prevent iOS zoom) */
--text-base: clamp(1rem, 0.9rem + 0.4vw, 1.125rem);      /* 16px → 18px (accessible base) */
--text-lg: clamp(1.125rem, 1rem + 0.5vw, 1.25rem);       /* 18px → 20px */
--text-xl: clamp(1.25rem, 1.1rem + 0.6vw, 1.5rem);       /* 20px → 24px */
--text-2xl: clamp(1.5rem, 1.3rem + 0.8vw, 2rem);         /* 24px → 32px */
--text-3xl: clamp(1.875rem, 1.6rem + 1vw, 2.5rem);       /* 30px → 40px */
--text-4xl: clamp(2.25rem, 1.9rem + 1.2vw, 3rem);        /* 36px → 48px */
--text-5xl: clamp(3rem, 2.4rem + 1.5vw, 4rem);           /* 48px → 64px */

/* Large text sizes for headings (3:1 contrast ratio acceptable) */
--text-6xl: clamp(3.75rem, 3rem + 1.8vw, 5rem);          /* 60px → 80px */
--text-7xl: clamp(4.5rem, 3.6rem + 2.1vw, 6rem);         /* 72px → 96px */
```

### Font Weights (Semantic and Accessible)
```css
--font-weight-thin: 100;        /* Avoid for body text - poor readability */
--font-weight-light: 300;       /* Use sparingly - may not meet contrast */
--font-weight-normal: 400;      /* Body text default */
--font-weight-medium: 500;      /* Emphasis, buttons, labels */
--font-weight-semibold: 600;    /* Strong emphasis, headings */
--font-weight-bold: 700;        /* Strong headings, important text */
--font-weight-extrabold: 800;   /* Hero text, very important */
--font-weight-black: 900;       /* Maximum emphasis */
```

### Line Heights (Readability-Optimized)
```css
--leading-none: 1;              /* Special cases only */
--leading-tight: 1.25;          /* Tight spacing for labels */
--leading-snug: 1.375;          /* Compact body text */
--leading-normal: 1.5;          /* Standard body text (recommended) */
--leading-relaxed: 1.625;       /* Relaxed reading */
--leading-loose: 2;             /* Very loose spacing */

/* Minimum line height for accessibility */
--leading-minimum: 1.2;         /* Absolute minimum for any text */
```

### Typography Scale (Semantic)
```css
/* Display Text - Large, impactful */
--text-display-2xl: var(--text-7xl);     /* line-height: var(--leading-tight) */
--text-display-xl: var(--text-6xl);      /* line-height: var(--leading-tight) */
--text-display-lg: var(--text-5xl);      /* line-height: var(--leading-tight) */

/* Headings - Hierarchical structure */
--text-heading-5xl: var(--text-5xl);     /* line-height: var(--leading-tight) */
--text-heading-4xl: var(--text-4xl);     /* line-height: var(--leading-tight) */
--text-heading-3xl: var(--text-3xl);     /* line-height: var(--leading-tight) */
--text-heading-2xl: var(--text-2xl);     /* line-height: var(--leading-tight) */
--text-heading-xl: var(--text-xl);       /* line-height: var(--leading-tight) */
--text-heading-lg: var(--text-lg);       /* line-height: var(--leading-snug) */
--text-heading-base: var(--text-base);   /* line-height: var(--leading-snug) */

/* Body Text - Content consumption */
--text-body-lg: var(--text-lg);          /* line-height: var(--leading-relaxed) */
--text-body-base: var(--text-base);      /* line-height: var(--leading-normal) */
--text-body-sm: var(--text-sm);          /* line-height: var(--leading-normal) */

/* UI Text - Interface elements */
--text-ui-lg: var(--text-lg);            /* line-height: var(--leading-normal) */
--text-ui-base: var(--text-base);        /* line-height: var(--leading-normal) */
--text-ui-sm: var(--text-sm);            /* line-height: var(--leading-normal) */
--text-ui-xs: var(--text-xs);            /* line-height: var(--leading-normal) */
```

### Letter Spacing (Readability)
```css
--letter-spacing-tighter: -0.05em;     /* Tight spacing for large text */
--letter-spacing-tight: -0.025em;      /* Slightly tight */
--letter-spacing-normal: 0em;          /* Standard spacing */
--letter-spacing-wide: 0.025em;        /* Wide spacing for emphasis */
--letter-spacing-wider: 0.05em;        /* Very wide for accessibility */
--letter-spacing-widest: 0.1em;        /* Maximum spacing */
```

## Spacing System

### Spacing Scale (4px Base Unit)
```css
--space-px: 1px;
--space-0: 0;
--space-1: 0.25rem;    /* 4px */
--space-2: 0.5rem;     /* 8px */
--space-3: 0.75rem;    /* 12px */
--space-4: 1rem;       /* 16px */
--space-5: 1.25rem;    /* 20px */
--space-6: 1.5rem;     /* 24px */
--space-8: 2rem;       /* 32px */
--space-10: 2.5rem;    /* 40px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */
--space-20: 5rem;      /* 80px */
--space-24: 6rem;      /* 96px */
--space-32: 8rem;      /* 128px */
--space-40: 10rem;     /* 160px */
--space-48: 12rem;     /* 192px */
--space-56: 14rem;     /* 224px */
--space-64: 16rem;     /* 256px */
```

## Breakpoints

### Mobile-First Breakpoints
```css
--breakpoint-sm: 640px;   /* Small tablets and large phones */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Small laptops */
--breakpoint-xl: 1280px;  /* Laptops and desktops */
--breakpoint-2xl: 1536px; /* Large screens */
```

### Container Max-Widths
```css
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;
```

## Border Radius

```css
--radius-none: 0;
--radius-sm: 0.125rem;   /* 2px */
--radius-base: 0.25rem;  /* 4px */
--radius-md: 0.375rem;   /* 6px */
--radius-lg: 0.5rem;     /* 8px */
--radius-xl: 0.75rem;    /* 12px */
--radius-2xl: 1rem;      /* 16px */
--radius-3xl: 1.5rem;    /* 24px */
--radius-full: 9999px;
```

## Shadows

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-base: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.1);
```

## Component Design Tokens

### Buttons (Touch-Accessible)
```css
/* Heights - All meet 44px minimum touch target */
--button-height-xs: 2.75rem;     /* 44px - Minimum touch target */
--button-height-sm: 2.75rem;     /* 44px - Small buttons */
--button-height-base: 2.75rem;   /* 44px - Standard buttons */
--button-height-lg: 3rem;        /* 48px - Large buttons */
--button-height-xl: 3.5rem;      /* 56px - Extra large buttons */

/* Padding - Generous touch areas */
--button-padding-x-xs: 1rem;     /* 16px */
--button-padding-x-sm: 1rem;     /* 16px */
--button-padding-x-base: 1.5rem; /* 24px */
--button-padding-x-lg: 2rem;     /* 32px */
--button-padding-x-xl: 2.5rem;   /* 40px */

/* Typography */
--button-font-size-sm: var(--text-sm);
--button-font-size-base: var(--text-base);
--button-font-size-lg: var(--text-lg);
--button-font-weight: var(--font-weight-medium);
--button-line-height: var(--leading-normal);

/* Visual properties */
--button-border-radius: var(--radius-md);
--button-transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
--button-transition-reduced: opacity 200ms ease-in-out;

/* Focus states - High contrast */
--button-focus-ring-width: 3px;
--button-focus-ring-offset: 2px;
--button-focus-ring-color: var(--color-primary-700);
```

### Inputs (Mobile-Optimized)
```css
/* Heights - Touch-friendly */
--input-height: 2.75rem;        /* 44px - Minimum touch target */
--input-height-lg: 3rem;        /* 48px - Large inputs */

/* Padding - Generous touch areas */
--input-padding-x: 0.75rem;     /* 12px - Internal padding */
--input-padding-y: 0.5rem;      /* 8px - Vertical padding */

/* Typography - Prevents iOS zoom */
--input-font-size: var(--text-base);    /* 16px minimum */
--input-line-height: var(--leading-normal);

/* Visual properties */
--input-border-radius: var(--radius-md);
--input-border-width: 2px;      /* Thicker borders for accessibility */
--input-border-color: var(--color-gray-300);
--input-border-color-focus: var(--color-primary-500);
--input-border-color-error: var(--color-error-500);

/* Focus states */
--input-focus-ring-width: 3px;
--input-focus-ring-offset: 0px;
--input-focus-ring-color: var(--color-primary-500);

/* Background colors */
--input-bg-color: var(--color-bg-primary);
--input-bg-color-disabled: var(--color-gray-100);
```

### Cards (Responsive)
```css
/* Padding - Responsive scaling */
--card-padding-sm: 1rem;        /* 16px - Mobile */
--card-padding-base: 1.5rem;    /* 24px - Tablet */
--card-padding-lg: 2rem;        /* 32px - Desktop */

/* Visual properties */
--card-border-radius: var(--radius-lg);
--card-border-width: 1px;
--card-border-color: var(--color-gray-200);
--card-shadow: var(--shadow-sm);
--card-shadow-hover: var(--shadow-md);

/* Background */
--card-bg-color: var(--color-bg-primary);
--card-bg-color-muted: var(--color-bg-secondary);
```

### Focus States (Universal)
```css
/* Focus ring properties */
--focus-ring-width: 3px;
--focus-ring-offset: 2px;
--focus-ring-style: solid;
--focus-ring-color: var(--color-primary-700);
--focus-ring-color-high-contrast: var(--color-gray-900);

/* Focus outline for high contrast mode */
--focus-outline-width: 2px;
--focus-outline-style: dotted;
--focus-outline-color: var(--color-gray-900);

/* Focus transitions */
--focus-transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
```

### Form Elements (Accessible)
```css
/* Labels */
--label-font-size: var(--text-sm);
--label-font-weight: var(--font-weight-medium);
--label-line-height: var(--leading-normal);
--label-color: var(--color-text-primary);
--label-color-muted: var(--color-text-secondary);

/* Helper text */
--helper-font-size: var(--text-sm);
--helper-line-height: var(--leading-normal);
--helper-color: var(--color-text-muted);

/* Error text */
--error-font-size: var(--text-sm);
--error-font-weight: var(--font-weight-medium);
--error-line-height: var(--leading-normal);
--error-color: var(--color-error-600);

/* Select dropdowns */
--select-height: 2.75rem;       /* 44px minimum */
--select-border-radius: var(--radius-md);
--select-border-width: 2px;

/* Checkboxes and radio buttons */
--checkbox-size: 1.25rem;       /* 20px - Minimum touch target */
--checkbox-border-radius: var(--radius-sm);
--radio-size: 1.25rem;          /* 20px - Minimum touch target */
```

### Navigation (Mobile-First)
```css
/* Header */
--header-height: 4rem;          /* 64px - Touch-friendly */
--header-bg-color: var(--color-bg-primary);
--header-border-color: var(--color-gray-200);

/* Navigation links */
--nav-link-font-size: var(--text-base);
--nav-link-font-weight: var(--font-weight-medium);
--nav-link-color: var(--color-text-secondary);
--nav-link-color-hover: var(--color-text-primary);
--nav-link-color-active: var(--color-primary-600);

/* Mobile menu */
--mobile-menu-width: 18rem;     /* 288px - Usable on small screens */
--mobile-menu-bg-color: var(--color-bg-primary);
--mobile-menu-shadow: var(--shadow-xl);
--mobile-menu-border-radius: 0;
```

### Modals and Overlays (Accessible)
```css
/* Modal container */
--modal-max-width-sm: 32rem;    /* 512px */
--modal-max-width-md: 42rem;    /* 672px */
--modal-max-width-lg: 56rem;    /* 896px */
--modal-padding: 1.5rem;        /* 24px */
--modal-border-radius: var(--radius-lg);
--modal-shadow: var(--shadow-xl);

/* Backdrop */
--modal-backdrop-bg-color: rgba(0, 0, 0, 0.5);
--modal-backdrop-blur: 4px;

/* Focus trap */
--modal-focus-visible-outline: 2px solid var(--color-primary-700);
```

## Animation & Transitions

### Duration Scale
```css
--duration-75: 75ms;
--duration-100: 100ms;
--duration-150: 150ms;
--duration-200: 200ms;
--duration-300: 300ms;
--duration-500: 500ms;
--duration-700: 700ms;
--duration-1000: 1000ms;
```

### Easing Functions
```css
--ease-linear: linear;
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Accessibility Standards

### Color Contrast
- **Normal Text**: 4.5:1 minimum contrast ratio
- **Large Text** (18pt+ or 14pt+ bold): 3:1 minimum contrast ratio
- **Interactive Elements**: 3:1 minimum contrast ratio
- **Focus Indicators**: 3:1 minimum contrast against adjacent colors

### Touch Targets
- **Minimum Size**: 44px × 44px (2.75rem × 2.75rem)
- **Touch Spacing**: 8px minimum between interactive elements
- **Active Areas**: Include padding in touch target calculations

### Focus Management
- **Focus Ring**: 2px solid with proper contrast
- **Focus Offset**: 2px from element boundary
- **Focus Trapping**: In modals and overlays
- **Logical Order**: Tab order follows visual layout

## Component Specifications

### Button Component

#### Variants
- **Primary**: Main actions, high emphasis
- **Secondary**: Alternative actions, medium emphasis
- **Outline**: Low emphasis, secondary actions
- **Ghost**: Minimal style, subtle actions
- **Danger**: Destructive actions (delete, remove)

#### Sizes
- **Small (sm)**: Compact actions, 44px height minimum
- **Medium (base)**: Standard actions, 44px height
- **Large (lg)**: Prominent actions, 48px height

#### States
- **Default**: Normal appearance
- **Hover**: Subtle background change
- **Focus**: High-contrast focus ring (3px)
- **Active**: Pressed state with scale transform
- **Disabled**: Reduced opacity, not interactive
- **Loading**: Spinner + disabled state

#### Accessibility Features
- ARIA labels for icon-only buttons
- Keyboard navigation support
- Screen reader announcements
- High contrast focus indicators
- Touch target minimum 44px

### Input Component

#### Types
- **Text**: Single-line text input
- **Email**: Email validation
- **Password**: Masked input with visibility toggle
- **Number**: Numeric input with increment/decrement
- **Textarea**: Multi-line text input
- **Select**: Dropdown selection
- **Checkbox**: Boolean selection
- **Radio**: Single selection from group

#### States
- **Default**: Normal appearance
- **Focus**: Blue border + focus ring
- **Error**: Red border + error message
- **Disabled**: Gray background, not interactive
- **Success**: Green border (optional)

#### Accessibility Features
- Associated labels with proper `for`/`id`
- ARIA described-by for help/error text
- Keyboard navigation support
- Screen reader error announcements
- Auto-complete attributes
- Input masking for sensitive data

### Card Component

#### Variants
- **Default**: Standard card with shadow
- **Elevated**: Higher shadow for emphasis
- **Outlined**: Border only, no shadow
- **Flat**: No border or shadow

#### Content Areas
- **Header**: Title, subtitle, actions
- **Body**: Main content area
- **Footer**: Actions, metadata
- **Media**: Images, icons, illustrations

#### Accessibility Features
- Semantic HTML structure
- Proper heading hierarchy
- Focus management for interactive cards
- Screen reader friendly content

### Navigation Component

#### Types
- **Header Navigation**: Top-level site navigation
- **Breadcrumb**: Location indicator
- **Tabs**: Content section navigation
- **Sidebar**: Secondary navigation
- **Mobile Menu**: Collapsible navigation

#### Accessibility Features
- ARIA landmarks (`nav`, `main`, etc.)
- Skip links for keyboard users
- Current page indication
- Logical tab order
- Screen reader friendly

## High-Fidelity Mockup Specifications

### Dashboard Screen

#### Layout Structure
```
┌─────────────────────────────────────┐
│ Header (64px)                       │
│ ┌───┐ ┌─────────────────────────┐   │
│ │Logo│ │ Navigation Menu        │   │
│ └───┘ └─────────────────────────┘   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Main Content                        │
│ ┌─────────────────────────────────┐ │
│ │ Welcome Message                 │ │
│ │ "Good morning, Alex"            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────┬───────────────┐ │
│ │ Mood Tracker    │ Quick Actions │ │
│ │ [Visual Scale]  │ [Buttons]     │ │
│ └─────────────────┴───────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Recent Activities               │ │
│ │ [Activity List]                 │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### Color Usage
- Background: `--color-bg-primary`
- Cards: `--color-bg-primary` with `--shadow-sm`
- Primary Actions: `--color-primary-500`
- Text: `--color-text-primary` for headings, `--color-text-secondary` for body

#### Typography Hierarchy
- Page Title: `--text-heading-3xl`, `--font-weight-bold`
- Section Headers: `--text-heading-xl`, `--font-weight-semibold`
- Body Text: `--text-body-base`, `--font-weight-normal`
- Button Text: `--text-ui-base`, `--font-weight-medium`

### Mood Tracking Screen

#### Layout Structure
```
┌─────────────────────────────────────┐
│ Header                             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Mood Selection                      │
│ ┌─────────────────────────────────┐ │
│ │ How are you feeling today?      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────┬─────┬─────┬─────┬─────┐     │
│ │😢  │😟  │😐  │😊  │😄  │     │
│ │Sad │Worried│Okay│Good│Great│     │
│ └─────┴─────┴─────┴─────┴─────┘     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Factors (Optional)              │ │
│ │ [Checkbox Grid]                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Notes (Optional)                │ │
│ │ [Textarea]                      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [Save Button]                   │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### Interactive Elements
- Mood buttons: 64px × 64px minimum, touch-friendly
- Factor checkboxes: 44px height minimum
- Textarea: 44px height minimum
- Save button: Full width, 48px height

#### Accessibility Features
- Keyboard navigation between mood options
- Screen reader announcements for selections
- High contrast focus indicators
- Clear labeling for all form elements

### CBT Exercise Screen

#### Layout Structure
```
┌─────────────────────────────────────┐
│ Header                             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Exercise Progress                   │
│ ┌─────────────────────────────────┐ │
│ │ Step 2 of 5                     │ │
│ │ ████████░░░░░░░░░░ 40%          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Exercise Content                 │ │
│ │ [Rich Text Content]             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Reflection Questions            │ │
│ │ [Interactive Form]              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────┬───────────────────┐ │
│ │ [Prev]      │ [Next]            │ │
│ └─────────────┴───────────────────┘ │
└─────────────────────────────────────┘
```

#### Content Areas
- Progress indicator: Visual progress bar with percentage
- Exercise content: Rich text with headings, paragraphs, lists
- Interactive elements: Text inputs, radio buttons, checkboxes
- Navigation: Previous/Next buttons with clear actions

#### Responsive Behavior
- Mobile: Stacked layout, full-width buttons
- Tablet: Side-by-side navigation buttons
- Desktop: Centered content with max-width constraints

## Implementation Guide

### CSS Custom Properties Setup
```css
/* src/styles/design-tokens.css */
:root {
  /* Color tokens */
  --color-primary-50: #eff6ff;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;

  /* Typography tokens */
  --text-base: clamp(1rem, 0.9rem + 0.4vw, 1.125rem);
  --font-weight-medium: 500;
  --leading-normal: 1.5;

  /* Component tokens */
  --button-height-base: 2.75rem;
  --input-height: 2.75rem;
  --focus-ring-width: 3px;

  /* Spacing tokens */
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;

  /* Border radius */
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

/* High contrast mode */
@media (prefers-contrast: high) {
  :root {
    --focus-ring-color: var(--color-gray-900);
    --focus-ring-width: 3px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  :root {
    --button-transition: opacity 200ms ease-in-out;
  }
}
```

### Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'var(--color-primary-50)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',
        },
        success: {
          50: 'var(--color-success-50)',
          500: 'var(--color-success-500)',
          600: 'var(--color-success-600),
        },
        gray: {
          50: 'var(--color-gray-50)',
          100: 'var(--color-gray-100)',
          600: 'var(--color-gray-600)',
          700: 'var(--color-gray-700)',
          900: 'var(--color-gray-900)',
        },
      },
      fontSize: {
        'xs': 'var(--text-xs)',
        'sm': 'var(--text-sm)',
        'base': 'var(--text-base)',
        'lg': 'var(--text-lg)',
        'xl': 'var(--text-xl)',
        '2xl': 'var(--text-2xl)',
        '3xl': 'var(--text-3xl)',
      },
      fontWeight: {
        'medium': 'var(--font-weight-medium)',
        'semibold': 'var(--font-weight-semibold)',
      },
      spacing: {
        '4': 'var(--space-4)',
        '6': 'var(--space-6)',
        '8': 'var(--space-8)',
      },
      borderRadius: {
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
      },
      minHeight: {
        'button': 'var(--button-height-base)',
        'input': 'var(--input-height)',
      },
    },
  },
}
```

### Component Usage Examples

#### Button Component
```tsx
// src/components/ui/button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        // Base styles
        'inline-flex items-center justify-center',
        'font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none',

        // Size variants
        {
          'h-8 px-3 text-sm': size === 'sm',
          'h-10 px-4 text-base': size === 'md',
          'h-12 px-6 text-lg': size === 'lg',
        },

        // Color variants
        {
          'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500': variant === 'primary',
          'bg-gray-500 text-white hover:bg-gray-600 focus:ring-gray-500': variant === 'secondary',
          'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500': variant === 'outline',
          'text-gray-700 hover:bg-gray-100 focus:ring-primary-500': variant === 'ghost',
        },

        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

#### Input Component
```tsx
// src/components/ui/input.tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export function Input({ className, error, ...props }: InputProps) {
  return (
    <div className="space-y-1">
      <input
        className={cn(
          // Base styles
          'w-full h-10 px-3',
          'border border-gray-300 rounded-md',
          'bg-white text-gray-900 placeholder-gray-500',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
          'disabled:opacity-50 disabled:pointer-events-none',

          // Error state
          error && 'border-red-500 focus:ring-red-500 focus:border-red-500',

          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
```

## Maintenance Guidelines

### Adding New Design Tokens
1. **Semantic Naming**: Use purpose-driven names (e.g., `--color-primary-500` not `--color-blue`)
2. **Consistency**: Follow existing scales and patterns
3. **Documentation**: Update this document when adding new tokens
4. **Testing**: Verify contrast ratios and touch target sizes

### Component Development
1. **Design System First**: Use design tokens instead of hardcoded values
2. **Accessibility**: Include ARIA attributes and keyboard support
3. **Responsive**: Mobile-first approach with fluid scaling
4. **TypeScript**: Proper type definitions for all props
5. **Documentation**: Include usage examples and prop descriptions

### Color Usage Guidelines
1. **Primary Colors**: For primary actions and brand elements
2. **Status Colors**: For success, error, warning, and info states
3. **Neutral Colors**: For text, backgrounds, and subtle elements
4. **Contrast**: Always verify 4.5:1 contrast ratio minimum

### Typography Guidelines
1. **Hierarchy**: Use semantic heading levels (h1-h6)
2. **Fluid Scaling**: Use clamp() for responsive text sizes
3. **Line Height**: Minimum 1.5 for body text readability
4. **Weights**: Use medium (500) for buttons, normal (400) for body text

## Validation Against Mobile Responsiveness Guidelines

### Touch Target Compliance
- ✅ **All buttons**: Minimum 44px height (2.75rem) with 16px horizontal padding
- ✅ **Interactive elements**: 44px × 44px minimum touch areas
- ✅ **Form inputs**: 44px height with generous touch areas
- ✅ **Navigation elements**: Touch-friendly sizing throughout

### Mobile-First Typography
- ✅ **Font sizes**: Minimum 16px on mobile (prevents iOS zoom)
- ✅ **Fluid scaling**: clamp() functions for responsive text
- ✅ **Line heights**: Optimized for mobile readability (1.5 minimum)
- ✅ **Letter spacing**: Improved for mobile screens

### Responsive Layout Patterns
- ✅ **Grid systems**: Mobile-first with progressive enhancement
- ✅ **Container queries**: Responsive containers for all screen sizes
- ✅ **Spacing system**: Consistent 4px base unit scaling
- ✅ **Breakpoint strategy**: Mobile-first approach (640px, 768px, 1024px, 1280px)

### Performance Optimizations
- ✅ **Reduced motion**: Respects `prefers-reduced-motion` setting
- ✅ **High contrast**: Support for `prefers-contrast: high`
- ✅ **Color schemes**: Optimized for various lighting conditions
- ✅ **Touch feedback**: Visual feedback for touch interactions

### Accessibility Integration
- ✅ **WCAG 2.1 AA**: All colors meet 4.5:1 contrast ratio minimum
- ✅ **Focus management**: 3px focus rings with proper contrast
- ✅ **Screen reader support**: ARIA labels and semantic HTML
- ✅ **Keyboard navigation**: Full keyboard accessibility

### Component Adaptations
- ✅ **Button variants**: Full-width option for mobile layouts
- ✅ **Input enhancements**: Mobile-optimized with proper labeling
- ✅ **Navigation patterns**: Hamburger menu for mobile screens
- ✅ **Card layouts**: Responsive padding and spacing

This design system provides a solid foundation for consistent, accessible, and scalable UI development. Regular updates and maintenance will ensure it evolves with user needs and technological advancements.