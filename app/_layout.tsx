import { useEffect, useState, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { Linking } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';

// react-native-web's ScrollView registers a non-passive 'wheel' listener in
// componentDidMount, which causes a browser performance violation. Patch
// addEventListener at module-load time (before any ScrollView mounts) to
// force passive:true on all wheel events. Making the listener passive means
// the browser no longer has to wait for it before scrolling, eliminating
// the violation. The only side-effect is that event.preventDefault() inside
// the handler becomes a no-op — acceptable because native scroll behaviour
// is what we want on web anyway.
if (typeof window !== 'undefined') {
  const _orig = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (type, listener, options) {
    if (type === 'wheel' || type === 'mousewheel') {
      const patched =
        typeof options === 'object'
          ? { ...options, passive: true }
          : { passive: true, capture: options === true };
      return _orig.call(this, type, listener, patched);
    }
    return _orig.call(this, type, listener, options);
  };
}

export default function RootLayout() {
  const { session, user, activeView, setSession, fetchUser } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();
  const [initialized, setInitialized] = useState(false);
  // Store a pending invite token if app was opened via deep link before auth
  const pendingInviteToken = useRef<string | null>(null);

  // Extract invite token from a tendly:// URL
  function extractInviteToken(url: string | null): string | null {
    if (!url) return null;
    try {
      // tendly://invite?token=XXX  or  tendly://invite/XXX
      const match = url.match(/[?&/]token=([^&]+)/) ?? url.match(/invite\/([^?&]+)/);
      return match?.[1] ?? null;
    } catch {
      return null;
    }
  }

  useEffect(() => {
    // Check if app was opened via a deep link (cold start)
    Linking.getInitialURL().then((url) => {
      if (url?.startsWith('tendly://invite')) {
        pendingInviteToken.current = extractInviteToken(url);
      }
    });

    // Listen for deep links while app is already open
    const sub = Linking.addEventListener('url', ({ url }) => {
      if (url?.startsWith('tendly://invite')) {
        const token = extractInviteToken(url);
        if (token) {
          // If already authenticated as tenant, go straight to onboarding
          if (session) {
            router.push(`/(tenant)/onboarding?token=${token}` as any);
          } else {
            pendingInviteToken.current = token;
          }
        }
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUser(session.user.id);
      setInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        if (session) await fetchUser(session.user.id);
      }
    );

    return () => {
      subscription.unsubscribe();
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (!initialized) return;
    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
      return;
    }

    if (session && inAuthGroup) {
      // Use DB user role if loaded, fall back to JWT metadata set at signup
      const role = user?.role ?? session.user.user_metadata?.role ?? 'landlord';

      if (role === 'tenant') {
        // If there's a pending invite token, go to onboarding first
        if (pendingInviteToken.current) {
          const token = pendingInviteToken.current;
          pendingInviteToken.current = null;
          router.replace(`/(tenant)/onboarding?token=${token}` as any);
          return;
        }
        // Check if tenant has an active lease; if not, send to onboarding
        supabase
          .from('leases')
          .select('id')
          .eq('tenant_id', session.user.id)
          .eq('status', 'active')
          .limit(1)
          .single()
          .then(({ data: lease }) => {
            if (!lease) {
              router.replace('/(tenant)/onboarding' as any);
            } else {
              router.replace('/(tenant)/pay');
            }
          });
      } else {
        // landlord or admin: respect activeView
        router.replace(activeView === 'tenant' ? '/(tenant)/pay' : '/(landlord)/dashboard');
      }
    }
  }, [session, segments, initialized, activeView]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(landlord)" />
      <Stack.Screen name="(tenant)" />
      <Stack.Screen
        name="profile"
        options={{
          presentation: 'modal',
          headerShown: true,
          title: 'Profile',
          headerBackTitle: 'Back',
        }}
      />
    </Stack>
  );
}
