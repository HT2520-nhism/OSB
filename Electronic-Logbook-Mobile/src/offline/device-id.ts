/**
 * Device-id helper — stable per-install identifier used for sync routing.
 * Stored in SecureStore so it persists across app launches but is per-device.
 *
 * Uses expo-secure-store (always available). expo-application / expo-crypto are
 * optional — we fall back to a UUID generated via uuid package if missing.
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { v4 as uuid } from 'uuid';

const KEY = 'logbook.mobile.deviceId';

let cached: string | null = null;

async function platformId(): Promise<string | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Application: any = require('expo-application');
    if (!Application) return null;
    if (Platform.OS === 'ios') {
      const id = await Application.getIosIdForVendorAsync?.();
      return id ?? null;
    }
    if (Platform.OS === 'android') {
      const id = await Application.getAndroidId?.();
      return id ?? null;
    }
  } catch {
    // expo-application not installed; fall through
  }
  return null;
}

export async function ensureDeviceId(): Promise<string> {
  if (cached) return cached;
  let id: string | null = null;
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.localStorage) {
      id = window.localStorage.getItem(KEY);
    }
  } else {
    try {
      id = await SecureStore.getItemAsync(KEY);
    } catch {
      id = null;
    }
  }
  if (!id) {
    id = (await platformId()) ?? uuid();
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(KEY, id);
      }
    } else {
      try {
        await SecureStore.setItemAsync(KEY, id);
      } catch {
        /* non-fatal — we still have the in-memory cached id */
      }
    }
  }
  cached = id;
  return id;
}

export function getDeviceId(): string {
  if (!cached) {
    // Fallback — should be primed by AppProviders on boot.
    cached = 'unknown-device';
  }
  return cached;
}
