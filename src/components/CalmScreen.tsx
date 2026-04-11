import { ReactNode } from 'react';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View } from 'react-native';
import { palette } from '../theme/palette';

type CalmScreenProps = {
  title: string;
  subtitle: string;
  children?: ReactNode;
};

export function CalmScreen({ title, subtitle, children }: CalmScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#060E20', '#0B1428', palette.background]} style={styles.gradientBackground}>
        <View style={styles.container}>
          <View style={styles.headerBlock}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <BlurView intensity={34} tint="dark" style={styles.card}>
            {children}
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
  gradientBackground: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerBlock: {
    marginBottom: 20,
    gap: 8,
  },
  title: {
    fontSize: 32,
    color: palette.textPrimary,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 15,
    color: palette.textMuted,
    lineHeight: 22,
  },
  card: {
    backgroundColor: 'rgba(15, 25, 48, 0.66)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.glassBorder,
    padding: 18,
    gap: 14,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.38,
    shadowRadius: 24,
    elevation: 10,
  },
});
