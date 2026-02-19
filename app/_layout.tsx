import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
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
  const { session, setSession, fetchUser } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
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

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!initialized) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(landlord)/dashboard');
    }
  }, [session, segments, initialized]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(landlord)" />
      <Stack.Screen name="(tenant)" />
    </Stack>
  );
}
