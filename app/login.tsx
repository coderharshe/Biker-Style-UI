import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/colors';

const BIKE_TYPES = ['Sport', 'Cruiser', 'ADV', 'Touring', 'Naked', 'Cafe Racer'];

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bikeType, setBikeType] = useState('');
  const [showBikeMenu, setShowBikeMenu] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter email and password.');
      return;
    }
    if (isSignup && !bikeType) {
      Alert.alert('Select Bike', 'Please select your bike type.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    await AsyncStorage.setItem(
      'motosphere_user',
      JSON.stringify({ email, bikeType: bikeType || 'Sport', name: 'Ghost Rider' })
    );

    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0) }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 20 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Feather name="shield" size={32} color={Colors.dark.accent} />
          </View>
          <Text style={styles.title}>MOTOSPHERE</Text>
          <Text style={styles.subtitle}>{isSignup ? 'Join the pack' : 'Welcome back, rider'}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputWrap}>
            <Feather name="mail" size={18} color={Colors.dark.textTertiary} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={Colors.dark.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputWrap}>
            <Feather name="lock" size={18} color={Colors.dark.textTertiary} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={Colors.dark.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={Colors.dark.textTertiary} />
            </Pressable>
          </View>

          {isSignup && (
            <View>
              <Pressable
                style={styles.inputWrap}
                onPress={() => setShowBikeMenu(!showBikeMenu)}
              >
                <Feather name="truck" size={18} color={Colors.dark.textTertiary} />
                <Text style={[styles.input, !bikeType && styles.placeholder]}>
                  {bikeType || 'Select bike type'}
                </Text>
                <Feather name={showBikeMenu ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.dark.textTertiary} />
              </Pressable>

              {showBikeMenu && (
                <View style={styles.dropdown}>
                  {BIKE_TYPES.map((type) => (
                    <Pressable
                      key={type}
                      style={[styles.dropdownItem, bikeType === type && styles.dropdownItemActive]}
                      onPress={() => {
                        setBikeType(type);
                        setShowBikeMenu(false);
                        Haptics.selectionAsync();
                      }}
                    >
                      <Text style={[styles.dropdownText, bikeType === type && styles.dropdownTextActive]}>{type}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}

          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
            onPress={handleLogin}
          >
            <Text style={styles.primaryBtnText}>{isSignup ? 'CREATE ACCOUNT' : 'RIDE IN'}</Text>
            <Feather name="arrow-right" size={18} color="#FFF" />
          </Pressable>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable style={({ pressed }) => [styles.googleBtn, pressed && styles.pressed]}>
            <Ionicons name="logo-google" size={20} color={Colors.dark.text} />
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.toggleRow}
          onPress={() => {
            setIsSignup(!isSignup);
            Haptics.selectionAsync();
          }}
        >
          <Text style={styles.toggleText}>
            {isSignup ? 'Already have an account?' : "Don't have an account?"}
          </Text>
          <Text style={styles.toggleLink}>{isSignup ? 'Sign In' : 'Sign Up'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scroll: {
    paddingHorizontal: 24,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    gap: 12,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.dark.accentDim,
    borderWidth: 1,
    borderColor: Colors.dark.accent + '40',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 28,
    color: Colors.dark.text,
    letterSpacing: 5,
  },
  subtitle: {
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 14,
    color: Colors.dark.textSecondary,
    letterSpacing: 0.5,
  },
  form: {
    gap: 14,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.glassBorder,
    paddingHorizontal: 16,
    height: 54,
    gap: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 15,
    color: Colors.dark.text,
  },
  placeholder: {
    color: Colors.dark.textTertiary,
  },
  dropdown: {
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.glassBorder,
    marginTop: 6,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownItemActive: {
    backgroundColor: Colors.dark.accentDim,
  },
  dropdownText: {
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  dropdownTextActive: {
    color: Colors.dark.accent,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.accent,
    borderRadius: 14,
    height: 54,
    gap: 8,
    marginTop: 6,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  primaryBtnText: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 16,
    color: '#FFF',
    letterSpacing: 2,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.dark.glassBorder,
  },
  dividerText: {
    fontFamily: 'Rajdhani_500Medium',
    fontSize: 12,
    color: Colors.dark.textTertiary,
    letterSpacing: 2,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.glassBorder,
    height: 54,
    gap: 10,
  },
  googleBtnText: {
    fontFamily: 'Rajdhani_600SemiBold',
    fontSize: 15,
    color: Colors.dark.text,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 6,
  },
  toggleText: {
    fontFamily: 'Rajdhani_400Regular',
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  toggleLink: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 14,
    color: Colors.dark.accent,
  },
});
