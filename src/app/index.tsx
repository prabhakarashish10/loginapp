import { useState } from 'react';
import {
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

type FormErrors = {
  email?: string;
  password?: string;
};

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  function handleLogin() {
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
    const isValid = Object.keys(nextErrors).length === 0;
    setSubmitted(isValid);
    if (isValid) {
      setPassword('');
    }
  }

  function updateEmail(value: string) {
    setEmail(value);
    setErrors((current) => ({ ...current, email: undefined }));
    setSubmitted(false);
  }

  function updatePassword(value: string) {
    setPassword(value);
    setErrors((current) => ({ ...current, password: undefined }));
    setSubmitted(false);
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
                Sign in to continue to your account.
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.text }]}>Email</Text>
                <TextInput
                  accessibilityLabel="Email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
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
                    autoComplete="current-password"
                    onChangeText={updatePassword}
                    onSubmitEditing={handleLogin}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.placeholder}
                    returnKeyType="done"
                    secureTextEntry={!showPassword}
                    style={[styles.passwordInput, { color: colors.text }]}
                    textContentType="password"
                    value={password}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
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
                onPress={handleLogin}
                style={({ pressed }) => [
                  styles.loginButton,
                  pressed && styles.loginButtonPressed,
                ]}>
                <Text style={styles.loginButtonText}>Login</Text>
              </Pressable>

              {submitted ? (
                <Text accessibilityLiveRegion="polite" style={styles.success}>
                  Login successful
                </Text>
              ) : null}
            </View>

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
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  success: {
    color: '#167647',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
