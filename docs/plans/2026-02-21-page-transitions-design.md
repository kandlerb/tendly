# Page Transitions Design — 2026-02-21

## Problem

All route changes on the Tendly web app are instantaneous — no animation. This makes navigation feel jarring, especially on tab switches and when drilling into detail pages. Native iOS is out of scope for now (Expo Router already provides default stack animations there).

## Goals

- Tab switches: subtle fade, 150ms (frequent action, should feel light)
- Stack pushes/pops (detail pages): fade, 200ms (less frequent, slightly more weight)
- Auth screen transitions (login ↔ signup): fade, 200ms
- No new dependencies — Reanimated 4 and `useFocusEffect` are already available via the Expo SDK

## Non-Goals

- iOS-specific animation tuning (deferred until native testing)
- Gesture-driven transitions (swipe-to-go-back etc.)
- Animated tab bar indicator
- Loading/skeleton transitions

---

## Design

### Part 1 — `ScreenFade` Component

**File:** `components/ui/ScreenFade.tsx`

A thin wrapper component using `useFocusEffect` (re-exported by `expo-router`) and the React Native `Animated` API. When a screen gains focus, opacity tweens from 0→1 over 150ms. On blur, it resets to 0 so the next focus-in always starts clean.

```tsx
import { useRef, useCallback } from 'react';
import { Animated } from 'react-native';
import { useFocusEffect } from 'expo-router';

export function ScreenFade({ children }: { children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useFocusEffect(
    useCallback(() => {
      opacity.setValue(0);
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
      return () => opacity.setValue(0);
    }, [])
  );
  return <Animated.View style={{ flex: 1, opacity }}>{children}</Animated.View>;
}
```

**Applied to all top-level tab screens** (these stay mounted between switches, so ScreenFade handles their transition):

| Group | Screens |
|-------|---------|
| Landlord | `dashboard`, `properties/index`, `tenants/index`, `maintenance/index`, `messages/index`, `tend`, `financials/index` |
| Tenant | `pay`, `maintenance`, `messages`, `documents` |

Detail screens within sub-layout stacks do **not** use `ScreenFade` — their Stack navigator's `animation: 'fade'` handles them.

---

### Part 2 — Auth Stack Transition

**File:** `app/(auth)/_layout.tsx`

Add `animation: 'fade'` and `animationDuration: 200` to the existing Stack's `screenOptions`. One-line change.

---

### Part 3 — Landlord Detail Page Sub-Layouts

Currently, detail screens (`properties/[id]/index`, `tenants/[tenantId]`, `maintenance/[id]`, `messages/[threadId]`) are registered as `href: null` flat entries inside the Tabs navigator. Navigation to them is a silent tab switch with no animation.

Fix: add a Stack sub-layout for each group that has detail pages. Each sub-layout is a minimal file:

```tsx
// e.g. app/(landlord)/properties/_layout.tsx
import { Stack } from 'expo-router';
export default function PropertiesLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 200 }} />;
}
```

**New files:**

| File | Manages |
|------|---------|
| `app/(landlord)/properties/_layout.tsx` | `index`, `add`, `[id]/index` |
| `app/(landlord)/tenants/_layout.tsx` | `index`, `[tenantId]` |
| `app/(landlord)/maintenance/_layout.tsx` | `index`, `[id]` |
| `app/(landlord)/messages/_layout.tsx` | `index`, `[threadId]` |

**`app/(landlord)/_layout.tsx` changes:**
- Tab screen names change from individual paths (`properties/index`, `tenants/index`, etc.) to group names (`properties`, `tenants`, `maintenance`, `messages`)
- Remove `href: null` entries for detail screens — they are now owned by their sub-layout

`financials`, `tend`, and `dashboard` have no detail pages, so they remain flat screens in the Tabs navigator (no sub-layout).

---

## File Change Summary

| File | Change |
|------|--------|
| `components/ui/ScreenFade.tsx` | **New** — fade wrapper for tab screens |
| `app/(auth)/_layout.tsx` | Add `animation: 'fade', animationDuration: 200` |
| `app/(landlord)/_layout.tsx` | Update tab screen names to group refs; remove dead `href: null` entries |
| `app/(landlord)/properties/_layout.tsx` | **New** — Stack sub-layout, fade 200ms |
| `app/(landlord)/tenants/_layout.tsx` | **New** — Stack sub-layout, fade 200ms |
| `app/(landlord)/maintenance/_layout.tsx` | **New** — Stack sub-layout, fade 200ms |
| `app/(landlord)/messages/_layout.tsx` | **New** — Stack sub-layout, fade 200ms |
| `app/(landlord)/dashboard.tsx` | Wrap root with `<ScreenFade>` |
| `app/(landlord)/properties/index.tsx` | Wrap root with `<ScreenFade>` |
| `app/(landlord)/tenants/index.tsx` | Wrap root with `<ScreenFade>` |
| `app/(landlord)/maintenance/index.tsx` | Wrap root with `<ScreenFade>` |
| `app/(landlord)/messages/index.tsx` | Wrap root with `<ScreenFade>` |
| `app/(landlord)/tend.tsx` | Wrap root with `<ScreenFade>` |
| `app/(landlord)/financials/index.tsx` | Wrap root with `<ScreenFade>` |
| `app/(tenant)/pay.tsx` | Wrap root with `<ScreenFade>` |
| `app/(tenant)/maintenance.tsx` | Wrap root with `<ScreenFade>` |
| `app/(tenant)/messages.tsx` | Wrap root with `<ScreenFade>` |
| `app/(tenant)/documents.tsx` | Wrap root with `<ScreenFade>` |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Sub-layout refactor breaks existing push navigation | Router paths don't change — `/(landlord)/properties/1` still resolves correctly through the sub-layout Stack |
| `animation: 'fade'` ignored on web in Expo Router v6 | Expo Router v6 Stack uses `@react-navigation/stack` on web which supports `animationEnabled` + `cardStyleInterpolator`; `'fade'` maps correctly |
| `useFocusEffect` fires on native too | Intentional — 150ms opacity fade is appropriate on native tab switches as well |
| Sidebar layout (wide web) doesn't use tabs | `SidebarLayout` uses `router.push()` for navigation, so `useFocusEffect` still fires on each screen mount — ScreenFade works correctly |
