import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

import { supabase } from '@/lib/supabase';

// ─── Constants ───────────────────────────────────────────
const BIKE_TYPES = ['Sport', 'Cruiser', 'ADV', 'Touring', 'Naked', 'Cafe Racer'];
const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;
const MIN_PASSWORD_LENGTH = 6;

// ─── Helpers ─────────────────────────────────────────────
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── Auth Screen Steps ───────────────────────────────────
type AuthStep = 'login' | 'signup' | 'otp';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [bikeType, setBikeType] = useState('');
  const [showBikeMenu, setShowBikeMenu] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // UI state
  const [step, setStep] = useState<AuthStep>('login');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Resend cooldown timer ────────────────────────────
  useEffect(() => {
    if (resendCooldown > 0) {
      cooldownRef.current = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            if (cooldownRef.current) clearInterval(cooldownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, [resendCooldown]);

  // ── Validation ───────────────────────────────────────
  const validateSignupFields = (): string | null => {
    if (!name.trim()) return 'Please enter your full name.';
    if (!email.trim()) return 'Please enter your email address.';
    if (!isValidEmail(email.trim())) return 'Please enter a valid email address.';
    if (!password.trim()) return 'Please enter a password.';
    if (password.length < MIN_PASSWORD_LENGTH)
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    if (!bikeType) return 'Please select your bike type.';
    return null;
  };

  const validateLoginFields = (): string | null => {
    if (!email.trim()) return 'Please enter your email address.';
    if (!isValidEmail(email.trim())) return 'Please enter a valid email address.';
    if (!password.trim()) return 'Please enter a password.';
    return null;
  };

  // ── Sign Up ──────────────────────────────────────────
  const handleSignup = async () => {
    const error = validateSignupFields();
    if (error) {
      Alert.alert('Validation Error', error);
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            username: name.trim(),
            bike_model: bikeType,
          },
        },
      });

      if (signUpError) throw signUpError;

      // Supabase returns a user with empty identities array if email is already registered
      // (when "Confirm email" is enabled and prevent sign-up is not set)
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        Alert.alert(
          'Email Already Registered',
          'This email is already associated with an account. Please sign in instead.',
        );
        setStep('login');
        return;
      }

      // If no session → email confirmation required → show OTP screen
      if (!data.session) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Verification Code Sent',
          'We sent a 6-digit code to your email. Please enter it below to verify your account.',
        );
        setStep('otp');
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
      } else {
        // If session is returned immediately (confirm email disabled)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      const message = err?.message || 'Something went wrong. Please try again.';
      Alert.alert('Sign Up Failed', message);
    } finally {
      setLoading(false);
    }
  };

  // ── Sign In ──────────────────────────────────────────
  const handleLogin = async () => {
    const error = validateLoginFields();
    if (error) {
      Alert.alert('Validation Error', error);
      return;
    }

    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) throw signInError;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (err: any) {
      console.error('Login error:', err);
      let message = err?.message || 'Invalid credentials. Please try again.';
      
      // Specially handle 400 errors which are common for unconfirmed emails
      if (err?.status === 400 || message.toLowerCase().includes('confirm')) {
        message = 'Invalid login credentials. If you just signed up, please check your email for a verification link.';
      }
      
      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  // ── Verify OTP ───────────────────────────────────────
  const handleVerifyOtp = async () => {
    const trimmedOtp = otpCode.trim();
    if (trimmedOtp.length !== OTP_LENGTH) {
      Alert.alert('Invalid Code', `Please enter the ${OTP_LENGTH}-digit code from your email.`);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: trimmedOtp,
        type: 'signup',
      });

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (err: any) {
      const message = err?.message || 'Invalid or expired code. Please try again.';
      Alert.alert('Verification Failed', message);
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ───────────────────────────────────────
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
      });

      if (error) throw error;

      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      Alert.alert('Code Resent', 'A new verification code has been sent to your email.');
    } catch (err: any) {
      Alert.alert('Resend Failed', err?.message || 'Could not resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Submit handler (routes to correct action) ────────
  const handleSubmit = () => {
    if (step === 'signup') handleSignup();
    else if (step === 'login') handleLogin();
    else if (step === 'otp') handleVerifyOtp();
  };

  // ── Render: OTP Verification Screen ──────────────────
  const renderOtpStep = () => (
    <View style={styles.form}>
      <View style={styles.otpHeader}>
        <View style={styles.otpIconCircle}>
          <Feather name="mail" size={28} color={Colors.dark.accent} />
        </View>
        <Text style={styles.otpTitle}>CHECK YOUR EMAIL</Text>
        <Text style={styles.otpSubtitle}>
          We sent a {OTP_LENGTH}-digit verification code to{'\n'}
          <Text style={styles.otpEmail}>{email.trim().toLowerCase()}</Text>
        </Text>
      </View>

      <View style={styles.inputWrap}>
        <Feather name="key" size={18} color={Colors.dark.textTertiary} />
        <TextInput
          style={[styles.input, styles.otpInput]}
          placeholder={`Enter ${OTP_LENGTH}-digit code`}
          placeholderTextColor={Colors.dark.textTertiary}
          value={otpCode}
          onChangeText={(text) => setOtpCode(text.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH))}
          keyboardType="number-pad"
          maxLength={OTP_LENGTH}
          autoFocus
        />
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.primaryBtn,
          pressed && styles.pressed,
          (loading || otpCode.trim().length !== OTP_LENGTH) && styles.btnDisabled,
        ]}
        onPress={handleVerifyOtp}
        disabled={loading || otpCode.trim().length !== OTP_LENGTH}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" size="small" />
        ) : (
          <>
            <Text style={styles.primaryBtnText}>VERIFY & CONTINUE</Text>
            <Feather name="check-circle" size={18} color="#FFF" />
          </>
        )}
      </Pressable>

      <View style={styles.resendRow}>
        <Text style={styles.resendLabel}>Didn't get the code?</Text>
        <Pressable onPress={handleResendOtp} disabled={resendCooldown > 0 || loading}>
          <Text
            style={[
              styles.resendLink,
              (resendCooldown > 0 || loading) && styles.resendDisabled,
            ]}
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
          </Text>
        </Pressable>
      </View>

      <Pressable
        style={styles.toggleRow}
        onPress={() => {
          setStep('signup');
          setOtpCode('');
        }}
      >
        <Feather name="arrow-left" size={14} color={Colors.dark.textSecondary} />
        <Text style={styles.toggleText}>Back to Sign Up</Text>
      </Pressable>
    </View>
  );

  // ── Render: Login / Signup Form ──────────────────────
  const renderAuthForm = () => (
    <View style={styles.form}>
      {step === 'signup' && (
        <View style={styles.inputWrap}>
          <Feather name="user" size={18} color={Colors.dark.textTertiary} />
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor={Colors.dark.textTertiary}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>
      )}

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
          autoCorrect={false}
        />
      </View>

      <View style={styles.inputWrap}>
        <Feather name="lock" size={18} color={Colors.dark.textTertiary} />
        <TextInput
          style={styles.input}
          placeholder={step === 'signup' ? `Password (min ${MIN_PASSWORD_LENGTH} chars)` : 'Password'}
          placeholderTextColor={Colors.dark.textTertiary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <Pressable onPress={() => setShowPassword(!showPassword)}>
          <Feather
            name={showPassword ? 'eye-off' : 'eye'}
            size={18}
            color={Colors.dark.textTertiary}
          />
        </Pressable>
      </View>

      {step === 'signup' && (
        <View>
          <Pressable
            style={styles.inputWrap}
            onPress={() => setShowBikeMenu(!showBikeMenu)}
          >
            <Feather name="truck" size={18} color={Colors.dark.textTertiary} />
            <Text style={[styles.input, !bikeType && styles.placeholder]}>
              {bikeType || 'Select bike type'}
            </Text>
            <Feather
              name={showBikeMenu ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={Colors.dark.textTertiary}
            />
          </Pressable>

          {showBikeMenu && (
            <View style={styles.dropdown}>
              {BIKE_TYPES.map((type) => (
                <Pressable
                  key={type}
                  style={[
                    styles.dropdownItem,
                    bikeType === type && styles.dropdownItemActive,
                  ]}
                  onPress={() => {
                    setBikeType(type);
                    setShowBikeMenu(false);
                    Haptics.selectionAsync();
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownText,
                      bikeType === type && styles.dropdownTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.primaryBtn,
          pressed && styles.pressed,
          loading && styles.btnDisabled,
        ]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" size="small" />
        ) : (
          <>
            <Text style={styles.primaryBtnText}>
              {step === 'signup' ? 'CREATE ACCOUNT' : 'RIDE IN'}
            </Text>
            <Feather name="arrow-right" size={18} color="#FFF" />
          </>
        )}
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
  );

  // ── Main Render ──────────────────────────────────────
  const subtitle =
    step === 'otp'
      ? 'Verify your identity'
      : step === 'signup'
        ? 'Join the pack'
        : 'Welcome back, rider';

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0) },
      ]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 0) + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Feather name="shield" size={32} color={Colors.dark.accent} />
          </View>
          <Text style={styles.title}>MOTOSPHERE</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        {step === 'otp' ? renderOtpStep() : renderAuthForm()}

        {step !== 'otp' && (
          <Pressable
            style={styles.toggleRow}
            onPress={() => {
              setStep(step === 'signup' ? 'login' : 'signup');
              setShowBikeMenu(false);
              Haptics.selectionAsync();
            }}
          >
            <Text style={styles.toggleText}>
              {step === 'signup'
                ? 'Already have an account?'
                : "Don't have an account?"}
            </Text>
            <Text style={styles.toggleLink}>
              {step === 'signup' ? 'Sign In' : 'Sign Up'}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────
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

  // ─ Form ─
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

  // ─ Dropdown ─
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

  // ─ Buttons ─
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
  btnDisabled: {
    opacity: 0.5,
  },
  primaryBtnText: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 16,
    color: '#FFF',
    letterSpacing: 2,
  },

  // ─ Divider ─
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

  // ─ Google ─
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

  // ─ Toggle ─
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

  // ─ OTP Screen ─
  otpHeader: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  otpIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.dark.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.accent + '30',
  },
  otpTitle: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 18,
    color: Colors.dark.text,
    letterSpacing: 3,
  },
  otpSubtitle: {
    fontFamily: 'Rajdhani_400Regular',
    fontSize: 13,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  otpEmail: {
    fontFamily: 'Rajdhani_600SemiBold',
    color: Colors.dark.accent,
  },
  otpInput: {
    letterSpacing: 8,
    fontSize: 22,
    fontFamily: 'Rajdhani_700Bold',
    textAlign: 'center',
  },

  // ─ Resend ─
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  resendLabel: {
    fontFamily: 'Rajdhani_400Regular',
    fontSize: 13,
    color: Colors.dark.textTertiary,
  },
  resendLink: {
    fontFamily: 'Rajdhani_700Bold',
    fontSize: 13,
    color: Colors.dark.accent,
  },
  resendDisabled: {
    color: Colors.dark.textTertiary,
  },
});
