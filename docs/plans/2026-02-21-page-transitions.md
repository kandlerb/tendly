# Page Transitions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add smooth 150ms fade transitions on tab switches and 200ms fade on stack push/pop throughout the Tendly web app.

**Architecture:** A shared `ScreenFade` wrapper component handles tab-switch fades via `useFocusEffect`. Stack push/pop fades use Expo Router's built-in `animation: 'fade'` screenOption. Landlord detail pages currently lack a Stack navigator — four sub-layout files are added to give them proper push/pop behaviour.

**Tech Stack:** Expo Router v6, React Native `Animated` API, `useFocusEffect` from `expo-router`, no new dependencies.

---

### Task 1: Create `ScreenFade` component + auth layout animation

**Files:**
- Create: `components/ui/ScreenFade.tsx`
- Modify: `app/(auth)/_layout.tsx`

**Step 1: Create ScreenFade**

Create `components/ui/ScreenFade.tsx` with exactly this content:

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

How it works: `useFocusEffect` fires each time the screen becomes the active tab. It tweens opacity 0→1 over 150ms. The cleanup function (the return value) resets opacity to 0 on blur, so the next focus-in always starts fresh.

**Step 2: Add animation to auth Stack**

`app/(auth)/_layout.tsx` currently reads:
```tsx
import { Stack } from 'expo-router';
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

Change it to:
```tsx
import { Stack } from 'expo-router';
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 200 }} />;
}
```

**Step 3: Type-check**

```bash
cd C:/Users/kandl.AABC-2LT/Projects/Tendly && npm run type-check
```

Expected: 0 errors.

**Step 4: Commit**

```bash
git add components/ui/ScreenFade.tsx "app/(auth)/_layout.tsx"
git commit -m "feat: add ScreenFade component and auth stack fade animation"
```

---

### Task 2: Add four landlord sub-layout Stack files

Detail pages (`properties/[id]`, `tenants/[tenantId]`, `maintenance/[id]`, `messages/[threadId]`) currently live as flat `href: null` entries in the Tabs navigator. Adding a `_layout.tsx` in each group promotes them to a proper Stack with push/pop animation.

**Files:**
- Create: `app/(landlord)/properties/_layout.tsx`
- Create: `app/(landlord)/tenants/_layout.tsx`
- Create: `app/(landlord)/maintenance/_layout.tsx`
- Create: `app/(landlord)/messages/_layout.tsx`

**Step 1: Create properties sub-layout**

`app/(landlord)/properties/_layout.tsx`:
```tsx
import { Stack } from 'expo-router';
export default function PropertiesLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 200 }} />;
}
```

**Step 2: Create tenants sub-layout**

`app/(landlord)/tenants/_layout.tsx`:
```tsx
import { Stack } from 'expo-router';
export default function TenantsLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 200 }} />;
}
```

**Step 3: Create maintenance sub-layout**

`app/(landlord)/maintenance/_layout.tsx`:
```tsx
import { Stack } from 'expo-router';
export default function MaintenanceLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 200 }} />;
}
```

**Step 4: Create messages sub-layout**

`app/(landlord)/messages/_layout.tsx`:
```tsx
import { Stack } from 'expo-router';
export default function MessagesLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 200 }} />;
}
```

**Step 5: Type-check**

```bash
npm run type-check
```

Expected: 0 errors.

**Step 6: Commit**

```bash
git add "app/(landlord)/properties/_layout.tsx" "app/(landlord)/tenants/_layout.tsx" "app/(landlord)/maintenance/_layout.tsx" "app/(landlord)/messages/_layout.tsx"
git commit -m "feat: add Stack sub-layouts for landlord detail page groups"
```

---

### Task 3: Update `app/(landlord)/_layout.tsx` tab screen names

Now that each group has its own Stack sub-layout, the Tabs navigator references the **group** (`properties`) rather than the index file (`properties/index`), and the detail screen `href: null` entries are removed — the sub-layout owns them.

**Files:**
- Modify: `app/(landlord)/_layout.tsx`

**Step 1: Update the four main tab Tabs.Screen names**

Find these four lines (inside the `<Tabs>` return):
```tsx
<Tabs.Screen name="properties/index" options={{ title: 'Properties', tabBarIcon: ({ color }) => <Building2 size={22} color={color} /> }} />
<Tabs.Screen name="tenants/index" options={{ title: 'Tenants', tabBarIcon: ({ color }) => <Users size={22} color={color} /> }} />
<Tabs.Screen name="maintenance/index" options={{ title: 'Maintenance', tabBarIcon: ({ color }) => <Wrench size={22} color={color} /> }} />
<Tabs.Screen name="messages/index" options={{ title: 'Messages', tabBarIcon: ({ color }) => <MessageSquare size={22} color={color} /> }} />
```

Change each `name` from `xxx/index` to `xxx`:
```tsx
<Tabs.Screen name="properties" options={{ title: 'Properties', tabBarIcon: ({ color }) => <Building2 size={22} color={color} /> }} />
<Tabs.Screen name="tenants" options={{ title: 'Tenants', tabBarIcon: ({ color }) => <Users size={22} color={color} /> }} />
<Tabs.Screen name="maintenance" options={{ title: 'Maintenance', tabBarIcon: ({ color }) => <Wrench size={22} color={color} /> }} />
<Tabs.Screen name="messages" options={{ title: 'Messages', tabBarIcon: ({ color }) => <MessageSquare size={22} color={color} /> }} />
```

**Step 2: Update financials hidden screen name**

Find:
```tsx
<Tabs.Screen name="financials/index" options={{ href: null }} />
```

Change to:
```tsx
<Tabs.Screen name="financials" options={{ href: null }} />
```

**Step 3: Remove the five now-redundant `href: null` detail screen entries**

Delete these five lines entirely (the sub-layouts now own these screens):
```tsx
{/* Hide sub-routes from tab bar */}
<Tabs.Screen name="properties/add" options={{ href: null }} />
<Tabs.Screen name="properties/[id]/index" options={{ href: null }} />
<Tabs.Screen name="tenants/[tenantId]" options={{ href: null }} />
<Tabs.Screen name="maintenance/[id]" options={{ href: null }} />
<Tabs.Screen name="messages/[threadId]" options={{ href: null }} />
```

**Step 4: Type-check**

```bash
npm run type-check
```

Expected: 0 errors.

**Step 5: Smoke-test navigation in browser**

Run `npx expo export -p web --dev` or use the live GitHub Pages deploy after push. Navigate: Dashboard → Properties → tap a property card → detail page should load. Back navigation should also work. If push navigation breaks, the sub-layout file is not being picked up — double-check the file was saved at the exact path `app/(landlord)/properties/_layout.tsx`.

**Step 6: Commit**

```bash
git add "app/(landlord)/_layout.tsx"
git commit -m "feat: update landlord tab screen names to group refs, remove redundant href:null entries"
```

---

### Task 4: Apply `ScreenFade` to the 7 landlord tab screens

These are the top-level screens that stay **mounted** between tab switches. `ScreenFade` wraps each one so its content fades in when the tab is focused.

Pattern for every screen below — add the import and wrap the `return` value:

```tsx
// Add import (adjust relative path as noted per file)
import { ScreenFade } from '../../components/ui/ScreenFade';

// Wrap return value:
return (
  <ScreenFade>
    <SafeAreaView style={styles.safe}>
      {/* existing content unchanged */}
    </SafeAreaView>
  </ScreenFade>
);
```

**Files to modify (one at a time):**

| File | Import path |
|------|-------------|
| `app/(landlord)/dashboard.tsx` | `'../../components/ui/ScreenFade'` |
| `app/(landlord)/properties/index.tsx` | `'../../../components/ui/ScreenFade'` |
| `app/(landlord)/tenants/index.tsx` | `'../../../components/ui/ScreenFade'` |
| `app/(landlord)/maintenance/index.tsx` | `'../../../components/ui/ScreenFade'` |
| `app/(landlord)/messages/index.tsx` | `'../../../components/ui/ScreenFade'` |
| `app/(landlord)/tend.tsx` | `'../../components/ui/ScreenFade'` |
| `app/(landlord)/financials/index.tsx` | `'../../../components/ui/ScreenFade'` |

**Step 1: Modify each file**

For each file: add the import line at the top and wrap the root `<SafeAreaView>` in `<ScreenFade>…</ScreenFade>`. Do not change anything else.

Note for `tend.tsx` specifically — its root element is already `<SafeAreaView style={styles.safe}>`. Wrap that.

**Step 2: Type-check**

```bash
npm run type-check
```

Expected: 0 errors.

**Step 3: Commit**

```bash
git add "app/(landlord)/dashboard.tsx" "app/(landlord)/tend.tsx" "app/(landlord)/properties/index.tsx" "app/(landlord)/tenants/index.tsx" "app/(landlord)/maintenance/index.tsx" "app/(landlord)/messages/index.tsx" "app/(landlord)/financials/index.tsx"
git commit -m "feat: apply ScreenFade to landlord tab screens"
```

---

### Task 5: Apply `ScreenFade` to the 4 tenant tab screens

Same pattern as Task 4. All tenant screens are flat (no detail sub-routes), so every tenant tab screen gets `ScreenFade`.

**Files to modify:**

| File | Import path |
|------|-------------|
| `app/(tenant)/pay.tsx` | `'../../components/ui/ScreenFade'` |
| `app/(tenant)/maintenance.tsx` | `'../../components/ui/ScreenFade'` |
| `app/(tenant)/messages.tsx` | `'../../components/ui/ScreenFade'` |
| `app/(tenant)/documents.tsx` | `'../../components/ui/ScreenFade'` |

**Step 1: Modify each file**

Add the import. Wrap the root `<SafeAreaView>` with `<ScreenFade>`.

**Step 2: Type-check**

```bash
npm run type-check
```

Expected: 0 errors.

**Step 3: Commit**

```bash
git add "app/(tenant)/pay.tsx" "app/(tenant)/maintenance.tsx" "app/(tenant)/messages.tsx" "app/(tenant)/documents.tsx"
git commit -m "feat: apply ScreenFade to tenant tab screens"
```

---

### Task 6: Push and verify CI

**Step 1: Push**

```bash
git push
```

**Step 2: Watch CI**

```bash
gh run watch $(gh run list --limit 1 --json databaseId --jq '.[0].databaseId') --exit-status
```

Expected: both `quality` and `deploy` jobs green. Exit 0.

**Step 3: Manual visual check on GitHub Pages**

Open `https://kandlerb.github.io/tendly/` in a browser. Do a hard refresh (Ctrl+Shift+R).

- [ ] Login page loads without green flash
- [ ] Click "Sign up" → login fades out, signup fades in
- [ ] Log in as a landlord → dashboard fades in
- [ ] Click Properties tab → content fades in (~150ms)
- [ ] Click a property card → detail page fades in (~200ms)
- [ ] Back navigation → list fades in
- [ ] Click Tenants tab → fades in
- [ ] Click a tenant card → detail fades in
- [ ] Log in as a tenant → Pay Rent fades in on first load
- [ ] Click Requests tab → fades in

If any transition is missing, check that:
1. The screen file has the `ScreenFade` import and wrapper
2. The sub-layout file exists at the exact path
3. The tab screen `name` in `_layout.tsx` matches the group folder name exactly
