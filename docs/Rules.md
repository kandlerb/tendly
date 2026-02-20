# Tendly Cross-Platform Design Ruleset

**Web · iOS · Android — Unity & Consistency Guidelines**

Version 1.0 | Tendly Engineering

This ruleset defines the non-negotiable standards that keep the Tendly experience unified across web (Next.js), iOS, and Android (React Native / Expo). Every rule below applies to all three platforms unless an explicit platform-specific exception is noted. Rules are organized into eight categories. When in doubt, default to the rule — exceptions require explicit team sign-off.

---

## 1 · Design Tokens

### 01 — All visual values live in /packages/tokens — no exceptions

Colors, spacing, typography sizes, border radii, shadow values, and elevation levels must be defined as tokens in JSON and never hardcoded in component files. Any PR that introduces a literal color hex, pixel value, or font size in a component is rejected in CI.

### 02 — Use semantic naming, not value-based naming

Tokens are named by purpose, not by value. Use `color-surface-primary`, not `blue-700`. Use `spacing-md`, not `16px`. Semantic names survive palette or spacing-scale changes without requiring a find-and-replace across the codebase.

### 03 — Style Dictionary generates all platform outputs

The token JSON is the single source of truth. Style Dictionary transforms it into CSS variables (web), TypeScript/JS objects (React Native for iOS and Android), and any future platform targets. No platform output file is edited by hand.

### 04 — Three-tier token hierarchy is mandatory

Primitive tokens define raw values (`blue-700: #1A56DB`). Semantic tokens map purpose to primitives (`cta-bg-color → blue-700`). Component tokens scope values to components (`button-cta-background → cta-bg-color`). Components reference only component or semantic tokens — never primitives directly.

---

## 2 · Typography

### 05 — Define a semantic type scale — never use literal font sizes

The type scale is: `display`, `heading-xl`, `heading-lg`, `heading-md`, `body-lg`, `body-md`, `body-sm`, `caption`, `label`. Every text element must reference one of these semantic names. Literal font sizes (`18px`, `1.25rem`) in component files are rejected.

### 06 — Let the platform resolve the font family

Do not fight platform defaults. The semantic scale maps to: SF Pro on iOS, Roboto on Android, `system-ui` on web. Brand identity comes from the type scale, weight, and color — not from overriding system fonts unless a custom typeface has been explicitly licensed and bundled.

### 07 — Minimum body font size is 16sp / 16px everywhere

No body text, label, or interactive element text renders below 16sp on mobile or 14px on web. Caption-level text (timestamps, footnotes) floors at 12sp/12px and must pass WCAG AA contrast at that size.

### 08 — Line height for body text is 1.5× the font size

Body-md at 16sp uses 24sp line height. Heading styles use 1.2×. These ratios are defined in the token system and are not overridden per-component without design review.

---

## 3 · Spacing & Layout

### 09 — All spacing uses the 8px base grid

Valid spacing values are multiples of 4 or 8: 4, 8, 12, 16, 24, 32, 48, 64, 96. No half-pixel or arbitrary values (e.g., 10px, 15px, 22px). The token system enforces this — `spacing-xs=4`, `spacing-sm=8`, `spacing-md=16`, `spacing-lg=24`, `spacing-xl=32`, `spacing-2xl=48`, `spacing-3xl=64`.

### 10 — Minimum touch target size is 48×48dp on all platforms

Apple HIG requires 44pt, Material Design requires 48dp, WCAG 2.2 AA requires 24px. Use 48×48dp as the universal floor. Minimum spacing between adjacent touch targets is 8dp. Targets smaller than 44px produce 3× higher error rates — this is a usability floor, not a preference.

### 11 — Screen edge insets are never less than 16dp

Content must not render flush against screen edges. Horizontal padding floors at 16dp on mobile, 24px on tablet breakpoints, and 32px on desktop. Safe area insets (notch, home indicator, navigation bar) are handled by the shared layout wrapper and are never manually calculated per-screen.

### 12 — Responsive breakpoints are defined in tokens and shared across platforms

Breakpoints: `mobile-sm` (375), `mobile-lg` (414), `tablet` (768), `desktop-sm` (1024), `desktop-lg` (1280). Web uses CSS media queries sourced from these tokens. React Native uses `Dimensions` + a shared `useBreakpoint` hook that references the same values.

---

## 4 · Color

### 13 — Never use color as the only signal

Status indicators, validation errors, and state changes must always pair color with a secondary signal: an icon, a text label, a pattern, or a shape change. Red alone is not sufficient — red + an error icon + error message text is correct. This is both a WCAG requirement and a usability standard.

### 14 — All color pairs must pass WCAG AA contrast at minimum

Body text on background: 4.5:1. Large text (18sp+ or 14sp+ bold) and icons: 3:1. UI component boundaries (input borders, focus rings): 3:1 against adjacent colors. AA is the floor; AAA (7:1) is the target for primary content. Contrast ratios are validated in CI.

### 15 — Dark mode is supported from day one, not retrofitted

Semantic color tokens define both light and dark values. `color-surface-primary` is white in light mode, `#111827` in dark mode. Components never reference raw hex values — they reference tokens that resolve correctly per mode. Platform dark mode detection is handled by the shared theme provider.

### 16 — Brand palette is defined in three layers: neutral, shared, and brand

**Neutral:** grays used for backgrounds, borders, and text hierarchy. **Shared:** semantic colors used across components (`error-red`, `success-green`, `warning-amber`, `info-blue`). **Brand:** Tendly-specific colors used for CTAs, accents, and identity elements. Only brand-layer colors may vary by marketing context.

---

## 5 · Navigation

### 17 — Bottom tab navigation on mobile, sidebar/topnav on web — no hamburgers for primary nav

Primary navigation on iOS and Android uses a bottom tab bar. Research shows hidden hamburger menus are missed by 48% of users over 45 and receive only 57% usage versus 86% for visible navigation. Web uses a left sidebar on desktop and a bottom tab on mobile viewports. Hamburger menus are permitted only for secondary or settings-level navigation.

### 18 — Bottom tabs are limited to 4–5 items, always with icons and labels

More than 5 tabs causes visual crowding and cognitive overload. Every tab must display both an icon and a text label — icon-only tabs fail accessibility and are harder to scan. Tab labels are sentence case, 1–2 words maximum.

### 19 — Android hardware back button must be explicitly handled on every screen

iOS relies on gesture-based back navigation. Android has a hardware/system back button that must be handled with `beforeRemove` in React Navigation or an equivalent explicit handler. Every screen must define its back behavior — defaulting to dismiss is acceptable, but silence is not. Missing handlers cause inconsistent and sometimes destructive behavior on Android.

### 20 — Navigation state uses URLs as the source of truth via Expo Router

Deep linking, browser history, and shareability require URL-based navigation state. Expo Router (or Solito) provides this for both web and native from a single route definition. Screen transitions and modal presentations adapt per platform (slide on iOS, bottom-sheet on Android, overlay on web) using platform-appropriate defaults — not custom animations unless explicitly designed.

---

## 6 · Components & Platform Adaptation

### 21 — The 80/20 rule: 80% brand consistency, 20% platform adaptation

80% of design decisions are enforced through shared tokens and shared components with no platform exceptions. 20% is intentionally platform-native: navigation chrome, system dialogs and pickers, gesture handling, default font stacks, haptic feedback, scrolling physics (iOS rubber-band vs. Android overscroll glow). Never fight the platform on the 20%.

### 22 — Platform-specific variants use file extensions, not inline conditionals

When a component genuinely differs by platform, create separate files: `Component.ios.tsx`, `Component.android.tsx`, `Component.web.tsx`. Inline `Platform.OS === 'ios'` checks scattered throughout shared logic are banned — they make components untestable and cause divergence over time. A shared hook or platform file is always preferred.

### 23 — KeyboardAvoidingView behavior is defined in the shared layout wrapper

`KeyboardAvoidingView` behaves differently per platform: `behavior='height'` on Android, `behavior='padding'` on iOS. This is not decided per-screen. The shared `ScreenLayout` component handles it using `Platform.select()` internally. No screen-level `KeyboardAvoidingView` is written from scratch.

### 24 — StatusBar configuration is explicit on every screen

Android and iOS `StatusBar` components behave differently. Every screen must include explicit `StatusBar` configuration via the shared `ScreenLayout` wrapper — implicit defaults cause visual inconsistency between platforms, particularly in modal contexts and after navigation transitions.

### 25 — Elevation vs. shadow: use the elevation token system

iOS uses `shadowColor`, `shadowOffset`, `shadowRadius`, and `shadowOpacity`. Android uses `elevation`. Both map to the same token (`elevation-card`, `elevation-modal`, etc.). Style Dictionary emits the correct platform-specific properties. No component writes shadow/elevation properties directly.

### 26 — All shared components in /packages/ui must render correctly on all three platforms

Before a component is merged to `/packages/ui`, it must be tested on iOS simulator, Android emulator, and web. Platform-specific rendering bugs are fixed in the shared package, not worked around in individual apps. If a component genuinely cannot be universal, it lives in the platform-specific app directory, not in the shared package.

---

## 7 · Accessibility

### 27 — Every interactive element has an accessibility label

On web, semantic HTML (`button`, `nav`, `main`, `label`) provides implicit accessibility. In React Native, a `View` has no semantic meaning — every touchable element requires an explicit `accessibilityRole`, `accessibilityLabel`, and `accessibilityState`. Icon-only buttons must have `accessibilityLabel` set to the action they perform, not the icon name.

### 28 — Focus order follows reading order on all platforms

Keyboard and screen reader navigation must follow a logical top-to-bottom, left-to-right order. Navigation transitions must restore focus to a predictable element. Focus traps in modals are intentional and required — focus must not escape to background content while a modal is open.

### 29 — Accessibility is verified on Android first, then iOS

VoiceOver on iOS is forgiving of hierarchy issues that TalkBack on Android will catch. Testing Android first surfaces more issues earlier. Both platforms are tested before any component is marked accessible. Automated accessibility checks run in CI using `eslint-plugin-jsx-a11y` (web) and `react-native-a11y` (native).

### 30 — Dynamic text sizing is supported — layouts must not break at 200% font scale

iOS and Android both allow users to increase system font size. All layouts must accommodate up to 200% text scaling without truncation, overflow, or broken layout. Fixed-height containers that clip text at large font scales are a bug, not an edge case.

---

## 8 · Performance & Quality Gates

### 31 — Animations run on the native thread — never on the JS thread

Scroll-linked animations, gesture-driven transitions, and UI feedback animations must use `useNativeDriver: true` or Reanimated worklets. JS-thread animations stutter on low-end Android devices when the JS thread is under load. Any animation that cannot be moved to the native thread requires explicit design team approval and a documented justification.

### 32 — Initial app load must reach interactive state within 3 seconds on a mid-range device

53% of mobile users abandon apps that take over 3 seconds to load. The target baseline device is a mid-range Android (Snapdragon 6xx equivalent). Time-to-interactive is measured in CI using Maestro or Detox. Regressions above 200ms from baseline block merge.

### 33 — Web JS bundle is audited in CI — regressions block merge

The median Next.js production site ships over 1MB of JavaScript, which takes over 1 second to parse on older devices. Bundle size is measured with `@next/bundle-analyzer` on every build. A PR that increases the initial JS bundle by more than 10KB requires justification. Use `next/dynamic` for lazy imports wherever possible.

### 34 — Hardcoded token values in component files fail CI

A custom ESLint rule enforces that no component file contains hardcoded color hex values, pixel values outside the spacing scale, or literal font sizes. The rule runs on pre-commit hooks and in CI. This is the primary enforcement mechanism for Rules 1–4.

### 35 — Offline states are first-class UI, not afterthoughts

Every screen that requires network data must have an explicit offline/error state defined in the component. Blank screens, unhandled promise rejections, and spinner loops are bugs. The shared `useNetworkState` hook provides connectivity status. Optimistic updates with rollback are the standard pattern for user actions.

---

## Governance

These rules are enforced through a combination of CI checks (ESLint, bundle analysis, accessibility linting, Detox/Maestro tests), code review, and token system architecture. Rules can be amended by any team member via a documented proposal — the test is whether the change improves product quality or developer experience without introducing platform divergence. When in doubt, open a discussion before writing code.

*Last updated: February 2026 | Owner: Tendly Engineering*
