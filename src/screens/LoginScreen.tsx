import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { palette } from '../theme/palette';

type LoginScreenProps = {
  onSwitchToRegister?: () => void;
};

export function LoginScreen({ onSwitchToRegister }: LoginScreenProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorText, setErrorText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorText('Please enter email and password');
      return;
    }
    try {
      setSubmitting(true);
      setErrorText('');
      await login(email.trim(), password);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      setErrorText(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGooglePress = () => {
    setErrorText('Google login will be available soon.');
  };

  const handlePhonePress = () => {
    setErrorText('Phone (OTP) login will be available soon.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={[palette.accentSoft, palette.background]} style={styles.backgroundGradient}>
        <View style={styles.container}>
          <View style={styles.brandSection}>
            <Text style={styles.brandName}>DinLipi</Text>
            <Text style={styles.tagline}>Your private fintech journal</Text>
          </View>

          <BlurView intensity={34} tint="light" style={styles.formCard}>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={16} color={palette.textMuted} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor={palette.textMuted}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={16} color={palette.textMuted} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={palette.textMuted}
                style={styles.input}
                secureTextEntry
              />
            </View>

            <Pressable onPress={handleLogin} disabled={submitting} style={styles.loginButtonWrap}>
              <LinearGradient
                colors={[palette.accent, palette.accentSecondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.loginButton}
              >
                <Text style={styles.loginText}>{submitting ? 'Logging in...' : 'লগইন করুন (Login)'}</Text>
              </LinearGradient>
            </Pressable>
            {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

            <View style={styles.altActions}>
              <Pressable onPress={handleGooglePress} style={({ pressed }) => [styles.altButtonWrap, pressed && styles.altButtonPressed]}>
                <LinearGradient
                  colors={['rgba(142,45,226,0.18)', 'rgba(74,0,224,0.12)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.altButton}
                >
                  <Ionicons name="logo-google" size={15} color={palette.accent} />
                  <Text style={styles.altButtonText}>Google</Text>
                </LinearGradient>
              </Pressable>
              <Pressable onPress={handlePhonePress} style={({ pressed }) => [styles.altButtonWrap, pressed && styles.altButtonPressed]}>
                <LinearGradient
                  colors={['rgba(142,45,226,0.18)', 'rgba(74,0,224,0.12)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.altButton}
                >
                  <Ionicons name="call-outline" size={15} color={palette.accent} />
                  <Text style={styles.altButtonText}>Phone (OTP)</Text>
                </LinearGradient>
              </Pressable>
            </View>
            <Pressable onPress={onSwitchToRegister} style={styles.switchBtn}>
              <Text style={styles.switchText}>Need an account? Register</Text>
            </Pressable>
          </BlurView>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  backgroundGradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 22,
  },
  brandSection: {
    alignItems: 'center',
    gap: 6,
  },
  brandName: {
    fontSize: 48,
    fontWeight: '900',
    color: palette.textPrimary,
    letterSpacing: 0.4,
  },
  tagline: {
    fontSize: 14,
    color: palette.textMuted,
    fontWeight: '600',
  },
  formCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.52)',
    padding: 16,
    gap: 10,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 10,
  },
  inputWrap: {
    borderWidth: 1,
    borderColor: palette.glassBorder,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.58)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: 0,
  },
  loginButtonWrap: {
    marginTop: 4,
    borderRadius: 16,
    overflow: 'hidden',
  },
  loginButton: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  loginText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  errorText: {
    color: '#B3261E',
    fontSize: 12,
    fontWeight: '600',
  },
  altActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  altButtonWrap: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  altButton: {
    borderWidth: 1,
    borderColor: palette.glassBorder,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  altButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  altButtonText: {
    color: palette.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  switchBtn: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  switchText: {
    color: palette.accent,
    fontSize: 13,
    fontWeight: '700',
  },
});
