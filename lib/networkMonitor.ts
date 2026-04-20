/**
 * Network state monitor for Velox.
 * Keeps Zustand store in sync with device connectivity.
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useEffect } from 'react';
import { useStore } from '@/hooks/useStore';

let unsubscribe: (() => void) | null = null;

/**
 * Initialize the network monitor. Call once at app root.
 * Updates `useStore.isOffline` automatically.
 */
export function initNetworkMonitor(): void {
  if (unsubscribe) return; // Already initialized

  unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    const isOffline = !(state.isConnected ?? true);
    useStore.getState().setIsOffline(isOffline);

    if (__DEV__) {
      console.log(`[Network] ${isOffline ? '🔴 Offline' : '🟢 Online'}`);
    }
  });
}

/**
 * Cleanup the network monitor. Call on app shutdown if needed.
 */
export function destroyNetworkMonitor(): void {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

/**
 * Hook to initialize network monitoring in root layout.
 */
export function useNetworkMonitor(): void {
  useEffect(() => {
    initNetworkMonitor();
    return () => destroyNetworkMonitor();
  }, []);
}
