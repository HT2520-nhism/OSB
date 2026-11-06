/**
 * Root index — renders splash during hydration, then redirects based on auth state.
 */

import { Redirect } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';

import { ActivityIndicator } from '@/components/nativewindui/ActivityIndicator';
import { Text } from '@/components/nativewindui/Text';

import { useAuthStore } from '@/src/auth/store/auth.store';

export default function Index() {
  const status = useAuthStore((s) => s.status);
  const hydrate = useAuthStore((s) => s.hydrate);

  React.useEffect(() => {
    void hydrate();
    const timer = setTimeout(() => {
      const current = useAuthStore.getState().status;
      if (current === 'initializing') {
        useAuthStore.setState({ status: 'unauthenticated' });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [hydrate]);

  // While hydrating (initial state), show splash briefly
  if (status === 'initializing' || status === 'authenticating') {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" />
        <Text variant="subhead" className="mt-3 text-muted-foreground">
          Đang khởi động...
        </Text>
      </View>
    );
  }

  // Hydration complete — redirect based on auth state
  if (status === 'authenticated') {
    return <Redirect href={'/(app)/(tabs)' as any} />;
  }

  // unauthenticated / error — go to login
  return <Redirect href="/(auth)/login" />;
}
