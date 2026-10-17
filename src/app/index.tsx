import { useEffect, useState } from 'react';
import {
  AppState,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Session } from '@supabase/supabase-js';

import { supabase, supabaseConfigurationError } from '@/lib/supabase';

type FormErrors = {
  email?: string;
  password?: string;
};

type AuthMode = 'signIn' | 'signUp';
type AuthMessage = {
  text: string;
  type: 'error' | 'success';
};

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const [session, setSession] = useState<Session | null>(null);
  const [sessionStatePending, setSessionStatePending] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>('signIn');
  const [busyAction, setBusyAction] = useState<AuthMode | 'signOut' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [authMessage, setAuthMessage] = useState<AuthMessage | null>(null);
  const isRestoringSession = Boolean(supabase) && sessionStatePending;
  const visibleAuthMessage: AuthMessage | null =
    authMessage ??
    (!supabase && supabaseConfigurationError
      ? { text: supabaseConfigurationError, type: 'error' }
      : null);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    let isMounted = true;
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;
      setSession(nextSession);
      setSessionStatePending(false);
      if (nextSession) {
        setPassword('');
        setAuthMessage(null);
      }
    });
    const appStateSubscription =
      Platform.OS === 'web'
        ? null
        : AppState.addEventListener('change', (state) => {
            if (state === 'active') {
              client.auth.startAutoRefresh();
            } else {
              client.auth.stopAutoRefresh();
            }
          });
    if (Platform.OS !== 'web' && AppState.currentState === 'active') {
      client.auth.startAutoRefresh();
    }

    void client.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          setAuthMessage({ text: error.message, type: 'error' });
        } else {
          setSession(data.session);
        }
        setSessionStatePending(false);
      })
      .catch((error: unknown) => {
        if (!isMounted) return;
        setAuthMessage({
          text:
            error instanceof Error
              ? `Could not restore your session: ${error.message}`
              : 'Could not restore your session. Please try again.',
          type: 'error',
        });
        setSessionStatePending(false);
      });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      appStateSubscription?.remove();
      if (Platform.OS !== 'web') {
        client.auth.stopAutoRefresh();
      }
    };
  }, []);

  function validateForm() {
    const nextErrors: FormErrors = {};
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      nextErrors.email = 'Enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!password.trim()) {
      nextErrors.password = 'Enter your password.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function updateEmail(value: string) {
    setEmail(value);
    setErrors((current) => ({ ...current, email: undefined }));
    setAuthMessage(null);
  }

  function updatePassword(value: string) {
    setPassword(value);
    setErrors((current) => ({ ...current, password: undefined }));
    setAuthMessage(null);
  }

  async function handleAuthAction() {
    if (!validateForm()) return;
    if (!supabase) {
      setAuthMessage({
        text: supabaseConfigurationError ?? 'Supabase is not configured.',
        type: 'error',
      });
      return;
    }

    setAuthMessage(null);
    setBusyAction(authMode);
    const normalizedEmail = email.trim();

    try {
      if (authMode === 'signIn') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (error) {
          setAuthMessage({ text: error.message, type: 'error' });
          return;
        }
        if (!data.session) {
          setAuthMessage({
            text: 'Sign-in did not return a session. Please try again.',
            type: 'error',
          });
          return;
        }
        setSession(data.session);
        setPassword('');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
        });
        if (error) {
          setAuthMessage({ text: error.message, type: 'error' });
          return;
        }
        setPassword('');
        if (data.session) {
          setSession(data.session);
        } else {
          setAuthMessage({
            text: 'If this email can be registered, check your inbox for a confirmation link. Then sign in.',
            type: 'success',
          });
        }
      }
    } catch (error: unknown) {
      setAuthMessage({
        text:
          error instanceof Error
            ? error.message
            : 'The authentication request failed. Please try again.',
        type: 'error',
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleSignOut() {
    if (!supabase) {
      setAuthMessage({
        text: supabaseConfigurationError ?? 'Supabase is not configured.',
        type: 'error',
      });
      return;
    }

    setAuthMessage(null);
    setBusyAction('signOut');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setAuthMessage({ text: error.message, type: 'error' });
      } else {
        setSession(null);
        setPassword('');
      }
    } catch (error: unknown) {
      setAuthMessage({
        text:
          error instanceof Error
            ? error.message
            : 'Sign-out failed. Please try again.',
        type: 'error',
      });
    } finally {
      setBusyAction(null);
    }
  }

  function toggleAuthMode() {
    setAuthMode((current) => (current === 'signIn' ? 'signUp' : 'signIn'));
    setErrors({});
    setAuthMessage(null);
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}>
            <View style={styles.heading}>
              <Text style={[styles.title, { color: colors.text }]}>Welcome to my world</Text>
              <Text style={[styles.subtitle, { color: colors.mutedText }]}>
                {session
                  ? 'You are signed in to your account.'
                  : authMode === 'signIn'
                    ? 'Sign in to continue to your account.'
                    : 'Create an account with your email and password.'}
              </Text>
            </View>

            {isRestoringSession ? (
              <View style={styles.loadingState}>
                <ActivityIndicator color="#6545c2" />
                <Text style={[styles.subtitle, { color: colors.mutedText }]}>
                  Restoring your session...
                </Text>
              </View>
            ) : session ? (
              <View style={styles.form}>
                <Text style={[styles.accountEmail, { color: colors.text }]}>
                  {session.user.email ?? 'Email address unavailable'}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  disabled={busyAction !== null}
                  onPress={handleSignOut}
                  style={({ pressed }) => [
                    styles.loginButton,
                    pressed && busyAction === null && styles.loginButtonPressed,
                    busyAction !== null && styles.buttonDisabled,
                  ]}>
                  {busyAction === 'signOut' ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.loginButtonText}>Sign Out</Text>
                  )}
                </Pressable>
                {visibleAuthMessage ? (
                  <Text
                    accessibilityLiveRegion="polite"
                    style={[
                      styles.authMessage,
                      visibleAuthMessage.type === 'error'
                        ? styles.authError
                        : styles.authSuccess,
                    ]}>
                    {visibleAuthMessage.text}
                  </Text>
                ) : null}
              </View>
            ) : (
              <View style={styles.form}>
                <View style={styles.field}>
                  <Text style={[styles.label, { color: colors.text }]}>Email</Text>
                  <TextInput
                    accessibilityLabel="Email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect={false}
                    editable={busyAction === null}
                    keyboardType="email-address"
                    onChangeText={updateEmail}
                    placeholder="you@example.com"
                    placeholderTextColor={colors.placeholder}
                    returnKeyType="next"
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.input,
                        borderColor: errors.email ? colors.error : colors.border,
                        color: colors.text,
                      },
                    ]}
                    textContentType="emailAddress"
                    value={email}
                  />
                  {errors.email ? (
                    <Text
                      accessibilityLiveRegion="polite"
                      style={[styles.error, { color: colors.error }]}>
                      {errors.email}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.field}>
                  <Text style={[styles.label, { color: colors.text }]}>Password</Text>
                  <View
                    style={[
                      styles.passwordRow,
                      {
                        backgroundColor: colors.input,
                        borderColor: errors.password ? colors.error : colors.border,
                      },
                    ]}>
                    <TextInput
                      accessibilityLabel="Password"
                      autoCapitalize="none"
                      autoComplete={authMode === 'signUp' ? 'new-password' : 'current-password'}
                      editable={busyAction === null}
                      onChangeText={updatePassword}
                      onSubmitEditing={handleAuthAction}
                      placeholder="Enter your password"
                      placeholderTextColor={colors.placeholder}
                      returnKeyType="done"
                      secureTextEntry={!showPassword}
                      style={[styles.passwordInput, { color: colors.text }]}
                      textContentType={authMode === 'signUp' ? 'newPassword' : 'password'}
                      value={password}
                    />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                      disabled={busyAction !== null}
                      onPress={() => setShowPassword((visible) => !visible)}
                      style={styles.toggleButton}>
                      <Text style={styles.toggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
                    </Pressable>
                  </View>
                  {errors.password ? (
                    <Text
                      accessibilityLiveRegion="polite"
                      style={[styles.error, { color: colors.error }]}>
                      {errors.password}
                    </Text>
                  ) : null}
                </View>

                <Pressable
                  accessibilityRole="button"
                  disabled={busyAction !== null || isRestoringSession}
                  onPress={handleAuthAction}
                  style={({ pressed }) => [
                    styles.loginButton,
                    pressed && busyAction === null && styles.loginButtonPressed,
                    busyAction !== null && styles.buttonDisabled,
                  ]}>
                  {busyAction === authMode ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.loginButtonText}>
                      {authMode === 'signIn' ? 'Sign In' : 'Create Account'}
                    </Text>
                  )}
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  disabled={busyAction !== null}
                  onPress={toggleAuthMode}
                  style={styles.modeButton}>
                  <Text style={styles.modeButtonText}>
                    {authMode === 'signIn'
                      ? "Don't have an account? Sign Up"
                      : 'Already have an account? Sign In'}
                  </Text>
                </Pressable>

                {visibleAuthMessage ? (
                  <Text
                    accessibilityLiveRegion="polite"
                    style={[
                      styles.authMessage,
                      visibleAuthMessage.type === 'error'
                        ? styles.authError
                        : styles.authSuccess,
                    ]}>
                    {visibleAuthMessage.text}
                  </Text>
                ) : null}
              </View>
            )}

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const lightColors = {
  background: '#f4f3f8',
  card: '#ffffff',
  border: '#e4e2ec',
  input: '#fbfaff',
  text: '#201d2b',
  mutedText: '#716d7d',
  placeholder: '#a19cad',
  error: '#b4233b',
};

const darkColors = {
  background: '#17151d',
  card: '#211e29',
  border: '#393443',
  input: '#191720',
  text: '#f6f3fc',
  mutedText: '#b0aaba',
  placeholder: '#837d8d',
  error: '#ff8c9c',
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    borderWidth: 1,
    borderRadius: 24,
    padding: 28,
    gap: 28,
    shadowColor: '#252039',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 3,
  },
  heading: {
    gap: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.7,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  form: {
    gap: 20,
  },
  loadingState: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  accountEmail: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  passwordRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
  },
  passwordInput: {
    flex: 1,
    minHeight: 50,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  toggleButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  toggleText: {
    color: '#6545c2',
    fontSize: 14,
    fontWeight: '700',
  },
  error: {
    fontSize: 13,
  },
  loginButton: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#6545c2',
  },
  loginButtonPressed: {
    opacity: 0.82,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  modeButton: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  modeButtonText: {
    color: '#6545c2',
    fontSize: 14,
    fontWeight: '600',
  },
  authMessage: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  authError: {
    color: '#b4233b',
  },
  authSuccess: {
    color: '#167647',
  },
});
