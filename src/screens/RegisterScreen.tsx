import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { palette } from '../theme/palette';

type RegisterScreenProps = {
  onSwitchToLogin: () => void;
};

export function RegisterScreen({ onSwitchToLogin }: RegisterScreenProps) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errorText, setErrorText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorText('Please fill name, email and password');
      return;
    }
    try {
      setSubmitting(true);
      setErrorText('');
      await register(name.trim(), email.trim(), password, phone.trim() || undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      setErrorText(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={[palette.accentSoft, palette.background]} style={styles.backgroundGradient}>
        <View style={styles.container}>
          <View style={styles.brandSection}>
            <Text style={styles.brandName}>DinLipi</Text>
            <Text style={styles.tagline}>Create your account</Text>
          </View>

          <BlurView intensity={34} tint="light" style={styles.formCard}>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={16} color={palette.textMuted} />
              <TextInput value={name} onChangeText={setName} placeholder="Name" placeholderTextColor={palette.textMuted} style={styles.input} />
            </View>
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
              <Ionicons name="call-outline" size={16} color={palette.textMuted} />
              <TextInput value={phone} onChangeText={setPhone} placeholder="Phone (optional)" placeholderTextColor={palette.textMuted} style={styles.input} />
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

            <Pressable onPress={handleRegister} disabled={submitting} style={styles.actionWrap}>
              <LinearGradient colors={[palette.accent, palette.accentSecondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.actionButton}>
                <Text style={styles.actionText}>{submitting ? 'Creating...' : 'Create Account'}</Text>
              </LinearGradient>
            </Pressable>
            {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
            <Pressable onPress={onSwitchToLogin} style={styles.switchBtn}>
              <Text style={styles.switchText}>Already have an account? Login</Text>
            </Pressable>
          </BlurView>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.background },
  backgroundGradient: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', gap: 22 },
  brandSection: { alignItems: 'center', gap: 6 },
  brandName: { fontSize: 44, fontWeight: '900', color: palette.textPrimary, letterSpacing: 0.4 },
  tagline: { fontSize: 14, color: palette.textMuted, fontWeight: '600' },
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
  input: { flex: 1, color: palette.textPrimary, fontSize: 15, fontWeight: '500', paddingVertical: 0 },
  actionWrap: { marginTop: 4, borderRadius: 16, overflow: 'hidden' },
  actionButton: { alignItems: 'center', paddingVertical: 15 },
  actionText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  errorText: { color: '#B3261E', fontSize: 12, fontWeight: '600' },
  switchBtn: { alignItems: 'center', paddingVertical: 6 },
  switchText: { color: palette.accent, fontSize: 13, fontWeight: '700' },
});
