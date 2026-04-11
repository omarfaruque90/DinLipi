import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useExpenses } from '../context/ExpenseContext';
import { useLanguage } from '../context/LanguageContext';
import { palette } from '../theme/palette';

const ACCOUNT_SOURCES = [
  { name: 'bKash', icon: 'wallet-outline' as const, balance: 5000, accent: '#E2136E' },
  { name: 'Nagad', icon: 'card-outline' as const, balance: 3600, accent: '#F97316' },
  { name: 'Islami Bank', icon: 'business-outline' as const, balance: 8200, accent: '#10B981' },
  { name: 'Cash', icon: 'cash-outline' as const, balance: 1400, accent: '#8E2DE2' },
];

export function DashboardScreen() {
  const { logout } = useAuth();
  const { totalBalance, updateBalance, expenses } = useExpenses();
  const { language, cycleLanguage, t } = useLanguage();
  const balanceAnim = useRef(new Animated.Value(0)).current;
  const accountAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [balanceInput, setBalanceInput] = useState(totalBalance.toFixed(2));

  // Calculate spending data
  const today = new Date();
  const isSameDay = (isoDate: string) => {
    const date = new Date(isoDate);
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const todayExpenses = expenses.filter((item) => isSameDay(item.date) && item.transactionType === 'Expense');
  const todaySpent = todayExpenses.reduce((sum, item) => sum + item.amount, 0);

  const monthExpenses = expenses.filter((item) => {
    if (item.transactionType !== 'Expense') {
      return false;
    }
    const d = new Date(item.date);
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth();
  });
  const monthSpent = monthExpenses.reduce((sum, item) => sum + item.amount, 0);

  useEffect(() => {
    Animated.stagger(120, [
      Animated.timing(balanceAnim, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(accountAnim, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(statsAnim, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
    ]).start();
  }, [accountAnim, balanceAnim, statsAnim]);

  const buildEnterStyle = (value: Animated.Value) => ({
    opacity: value,
    transform: [
      {
        translateY: value.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
      {
        scale: value.interpolate({
          inputRange: [0, 1],
          outputRange: [0.98, 1],
        }),
      },
    ],
  });
  const handleOpenBalanceModal = () => {
    setBalanceInput(totalBalance.toFixed(2));
    setShowBalanceModal(true);
  };
  const handleUpdateBalance = () => {
    const parsed = Number.parseFloat(balanceInput);
    if (Number.isNaN(parsed) || parsed < 0) {
      return;
    }
    updateBalance(parsed);
    setShowBalanceModal(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#F6F2FF', palette.background]} style={styles.screenGradient}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerBlock}>
              <Text style={styles.greeting}>{t('greeting')}, ওমর</Text>
              <Text style={styles.title}>{t('dashboard')}</Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable onPress={cycleLanguage} style={styles.languageChip}>
                <Text style={styles.languageChipText}>{language === 'banglish' ? 'BGL' : language.toUpperCase()}</Text>
              </Pressable>
              <Pressable onPress={() => logout()} style={styles.logoutChip}>
                <Ionicons name="log-out-outline" size={14} color={palette.textPrimary} />
              </Pressable>
            </View>
          </View>

          <Animated.View style={[buildEnterStyle(balanceAnim), styles.balanceCardWrapper]}>
            <LinearGradient
              colors={[palette.accent, palette.accentSecondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientCard}
            >
              <View style={styles.cardTopRow}>
                <Text style={styles.balanceLabel}>{t('totalBalance')}</Text>
                <View style={styles.iconPill}>
                  <Ionicons name="sparkles-outline" size={16} color="#FFFFFF" />
                </View>
              </View>
              <Pressable onPress={handleOpenBalanceModal} style={styles.balancePressable}>
                <Text style={styles.balanceValue}>৳ {totalBalance.toFixed(2)}</Text>
              </Pressable>
              <View style={styles.balanceMetaRow}>
                <Text style={styles.metaLabel}>Tap balance for quick add (soon)</Text>
                <Text style={styles.metaValue}>৳ 3,240 saved</Text>
              </View>
            </LinearGradient>
          </Animated.View>

          <Animated.View style={[buildEnterStyle(accountAnim), styles.accountsCardWrapper]}>
            <BlurView intensity={24} tint="light" style={styles.accountsCard}>
              <Text style={styles.accountsTitle}>{t('myAccounts')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.accountsRow}>
                {ACCOUNT_SOURCES.map((account) => (
                  <View key={account.name} style={[styles.accountChip, { borderColor: `${account.accent}55` }]}>
                    <View style={[styles.accountIcon, { backgroundColor: `${account.accent}22` }]}>
                      <Ionicons name={account.icon} size={18} color={account.accent} />
                    </View>
                    <Text style={styles.accountName}>{account.name}</Text>
                    <Text style={styles.accountBalance}>৳ {account.balance.toLocaleString('en-US')}</Text>
                  </View>
                ))}
              </ScrollView>
            </BlurView>
          </Animated.View>

          <Animated.View style={[buildEnterStyle(statsAnim), styles.statsCardWrapper]}>
            <BlurView intensity={20} tint="light" style={styles.floatingCard}>
              <View style={styles.statRow}>
                <Text style={styles.label}>Today spent</Text>
                <Text style={styles.value}>৳ {todaySpent.toFixed(0)}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.label}>This month spent</Text>
                <Text style={styles.value}>৳ {monthSpent.toFixed(0)}</Text>
              </View>
              <Text style={styles.helper}>{todayExpenses.length > 0 ? `You've made ${todayExpenses.length} transaction${todayExpenses.length !== 1 ? 's' : ''} today. Keep tracking your budget!` : 'Add your first expense to begin your calm financial journal.'}</Text>
            </BlurView>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
      <Modal
        visible={showBalanceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBalanceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={28} tint="light" style={styles.modalCard}>
            <Text style={styles.modalTitle}>বর্তমান ব্যালেন্স আপডেট করুন</Text>
            <View style={styles.modalInputWrap}>
              <Text style={styles.modalCurrency}>৳</Text>
              <TextInput
                value={balanceInput}
                onChangeText={setBalanceInput}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={palette.textMuted}
                style={styles.modalInput}
              />
            </View>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowBalanceModal(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>বাতিল (Cancel)</Text>
              </Pressable>
              <Pressable onPress={handleUpdateBalance} style={styles.modalUpdateBtn}>
                <LinearGradient
                  colors={[palette.accent, palette.accentSecondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modalUpdateGradient}
                >
                  <Text style={styles.modalUpdateText}>আপডেট করুন (Update)</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </BlurView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  screenGradient: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
    gap: 16,
  },
  headerBlock: {
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  greeting: {
    color: palette.textMuted,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
    opacity: 1,
  },
  title: {
    color: palette.textPrimary,
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: 0.3,
    opacity: 1,
  },
  languageChip: {
    borderWidth: 1,
    borderColor: palette.glassBorder,
    backgroundColor: palette.glassStrong,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  logoutChip: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: palette.glassBorder,
    backgroundColor: palette.glassStrong,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageChipText: {
    color: palette.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  balanceCardWrapper: {
    marginBottom: 24,
  },
  gradientCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: palette.glassBorder,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.9,
    shadowRadius: 28,
    elevation: 9,
    gap: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  balanceLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    letterSpacing: 0.3,
    opacity: 0.95,
  },
  balanceValue: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  balancePressable: {
    alignSelf: 'flex-start',
  },
  balanceMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  metaLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    opacity: 0.92,
  },
  metaValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  accountsCardWrapper: {
    marginBottom: 24,
  },
  accountsCard: {
    borderRadius: 22,
    backgroundColor: palette.glassStrong,
    borderWidth: 1,
    borderColor: palette.glassBorder,
    padding: 18,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 7,
    gap: 14,
  },
  accountsTitle: {
    color: palette.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  accountsRow: {
    gap: 12,
    paddingRight: 4,
  },
  accountChip: {
    borderRadius: 18,
    backgroundColor: 'rgba(20, 31, 56, 0.8)',
    borderWidth: 1,
    borderColor: palette.glassBorder,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    minWidth: 140,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 2,
  },
  accountName: {
    color: palette.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  accountBalance: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  statsCardWrapper: {
    marginBottom: 24,
  },
  floatingCard: {
    borderRadius: 22,
    backgroundColor: palette.glassStrong,
    borderWidth: 1,
    borderColor: palette.glassBorder,
    padding: 20,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.55,
    shadowRadius: 24,
    elevation: 8,
    gap: 2,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  label: {
    color: palette.textMuted,
    fontSize: 15,
  },
  value: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  helper: {
    marginTop: 8,
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(22, 14, 40, 0.36)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.glassBorder,
    backgroundColor: palette.glassStrong,
    padding: 16,
    gap: 12,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 10,
  },
  modalTitle: {
    color: palette.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  modalInputWrap: {
    borderWidth: 1,
    borderColor: palette.glassBorder,
    borderRadius: 16,
    backgroundColor: 'rgba(25, 37, 64, 0.84)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalCurrency: {
    color: palette.accent,
    fontSize: 28,
    fontWeight: '900',
  },
  modalInput: {
    flex: 1,
    color: palette.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    paddingVertical: 0,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  modalCancelBtn: {
    borderWidth: 1,
    borderColor: palette.glassBorder,
    backgroundColor: 'rgba(25, 37, 64, 0.82)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    justifyContent: 'center',
  },
  modalCancelText: {
    color: palette.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  modalUpdateBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalUpdateGradient: {
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  modalUpdateText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
