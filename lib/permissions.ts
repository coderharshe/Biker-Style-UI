/**
 * Unified permission manager for Velox.
 * Handles all platform permission flows with proper fallbacks.
 */

import { Alert, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';

// ─── Types ─────────────────────────────────────────────
export type PermissionStatus = 'granted' | 'denied' | 'undetermined' | 'permanently_denied';

interface PermissionResult {
  status: PermissionStatus;
  canAskAgain: boolean;
}

// ─── Settings Redirect ─────────────────────────────────
function openAppSettings(): void {
  if (Platform.OS === 'ios') {
    Linking.openURL('app-settings:');
  } else if (Platform.OS === 'android') {
    Linking.openSettings();
  }
}

function showSettingsAlert(permissionName: string): void {
  Alert.alert(
    `${permissionName} Permission Required`,
    `Velox needs ${permissionName.toLowerCase()} access to work properly. Please enable it in your device settings.`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: openAppSettings },
    ]
  );
}

// ─── Location Permissions ──────────────────────────────

export async function requestForegroundLocation(): Promise<PermissionResult> {
  if (Platform.OS === 'web') {
    return { status: 'granted', canAskAgain: false };
  }

  try {
    const existing = await Location.getForegroundPermissionsAsync();

    if (existing.status === 'granted') {
      return { status: 'granted', canAskAgain: true };
    }

    if (!existing.canAskAgain) {
      showSettingsAlert('Location');
      return { status: 'permanently_denied', canAskAgain: false };
    }

    const result = await Location.requestForegroundPermissionsAsync();

    if (result.status === 'granted') {
      return { status: 'granted', canAskAgain: true };
    }

    if (!result.canAskAgain) {
      showSettingsAlert('Location');
      return { status: 'permanently_denied', canAskAgain: false };
    }

    return { status: 'denied', canAskAgain: true };
  } catch (err) {
    console.error('[Permissions] Foreground location error:', err);
    return { status: 'denied', canAskAgain: false };
  }
}

export async function requestBackgroundLocation(): Promise<PermissionResult> {
  if (Platform.OS === 'web') {
    return { status: 'granted', canAskAgain: false };
  }

  try {
    // Must have foreground first
    const fgResult = await requestForegroundLocation();
    if (fgResult.status !== 'granted') {
      return fgResult;
    }

    const existing = await Location.getBackgroundPermissionsAsync();

    if (existing.status === 'granted') {
      return { status: 'granted', canAskAgain: true };
    }

    // Android 11+ (API 30+): Cannot request background location directly.
    // Must guide user to settings.
    if (Platform.OS === 'android' && Platform.Version >= 30) {
      if (!existing.canAskAgain) {
        showSettingsAlert('Background Location');
        return { status: 'permanently_denied', canAskAgain: false };
      }
    }

    const result = await Location.requestBackgroundPermissionsAsync();

    if (result.status === 'granted') {
      return { status: 'granted', canAskAgain: true };
    }

    if (!result.canAskAgain) {
      showSettingsAlert('Background Location');
      return { status: 'permanently_denied', canAskAgain: false };
    }

    return { status: 'denied', canAskAgain: true };
  } catch (err) {
    console.error('[Permissions] Background location error:', err);
    return { status: 'denied', canAskAgain: false };
  }
}

// ─── Camera / Image Picker Permissions ─────────────────

export async function requestImagePickerPermission(): Promise<PermissionResult> {
  if (Platform.OS === 'web') {
    return { status: 'granted', canAskAgain: false };
  }

  try {
    const existing = await ImagePicker.getMediaLibraryPermissionsAsync();

    if (existing.status === 'granted') {
      return { status: 'granted', canAskAgain: true };
    }

    if (!existing.canAskAgain) {
      showSettingsAlert('Photo Library');
      return { status: 'permanently_denied', canAskAgain: false };
    }

    const result = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (result.status === 'granted') {
      return { status: 'granted', canAskAgain: true };
    }

    if (!result.canAskAgain) {
      showSettingsAlert('Photo Library');
      return { status: 'permanently_denied', canAskAgain: false };
    }

    return { status: 'denied', canAskAgain: true };
  } catch (err) {
    console.error('[Permissions] Image picker error:', err);
    return { status: 'denied', canAskAgain: false };
  }
}

export async function requestCameraPermission(): Promise<PermissionResult> {
  if (Platform.OS === 'web') {
    return { status: 'granted', canAskAgain: false };
  }

  try {
    const existing = await ImagePicker.getCameraPermissionsAsync();

    if (existing.status === 'granted') {
      return { status: 'granted', canAskAgain: true };
    }

    if (!existing.canAskAgain) {
      showSettingsAlert('Camera');
      return { status: 'permanently_denied', canAskAgain: false };
    }

    const result = await ImagePicker.requestCameraPermissionsAsync();

    if (result.status === 'granted') {
      return { status: 'granted', canAskAgain: true };
    }

    if (!result.canAskAgain) {
      showSettingsAlert('Camera');
      return { status: 'permanently_denied', canAskAgain: false };
    }

    return { status: 'denied', canAskAgain: true };
  } catch (err) {
    console.error('[Permissions] Camera error:', err);
    return { status: 'denied', canAskAgain: false };
  }
}

// ─── Media Library (Save) Permission ───────────────────

export async function requestMediaLibrarySavePermission(): Promise<PermissionResult> {
  if (Platform.OS === 'web') {
    return { status: 'granted', canAskAgain: false };
  }

  try {
    const existing = await MediaLibrary.getPermissionsAsync();

    if (existing.status === 'granted') {
      return { status: 'granted', canAskAgain: true };
    }

    if (!existing.canAskAgain) {
      showSettingsAlert('Media Library');
      return { status: 'permanently_denied', canAskAgain: false };
    }

    const result = await MediaLibrary.requestPermissionsAsync();

    if (result.status === 'granted') {
      return { status: 'granted', canAskAgain: true };
    }

    if (!result.canAskAgain) {
      showSettingsAlert('Media Library');
      return { status: 'permanently_denied', canAskAgain: false };
    }

    return { status: 'denied', canAskAgain: true };
  } catch (err) {
    console.error('[Permissions] Media library error:', err);
    return { status: 'denied', canAskAgain: false };
  }
}
