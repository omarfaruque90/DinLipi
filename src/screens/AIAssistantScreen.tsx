import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CalmScreen } from '../components/CalmScreen';
import { DEFAULT_CATEGORIES, ExpenseCategory, TransactionType, useExpenses } from '../context/ExpenseContext';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { palette } from '../theme/palette';

type ChatMessage = {
  id: string;
  sender: 'ai' | 'user';
  text: string;
};
type PendingDetection = {
  amount: number;
  category: ExpenseCategory;
  transactionType: TransactionType;
  sourceText: string;
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Food: ['food', 'cha', 'tea', 'bazar', 'khabar', 'restaurant', 'lunch', 'dinner'],
  Transport: ['transport', 'bus', 'rickshaw', 'cng', 'uber', 'pathao', 'fare'],
  Rent: ['rent', 'basa', 'house', 'vara', 'bhara'],
  Shopping: ['shopping', 'shop', 'mall', 'dress', 'cloth', 'bkash', 'nagad'],
};
const INCOME_KEYWORDS = ['nilam', 'peyechi', 'salary', 'bkash theke', 'nagad theke'];
const BALANCE_QUERIES = ['আমার ব্যালেন্স কত', 'balance', 'balence', 'current balance', 'amar balance'];
const BUDGET_QUERIES = ['budget', 'বাজেট', 'amar budget', 'আমার বাজেট'];
const QUICK_ACTIONS = ['বাজেট পরামর্শ', 'আমার বাজেট কত?', 'এই মাসের খরচ কত?', 'টাকা জমানোর টিপস', 'আমার ব্যালেন্স কত?'];

const extractAmount = (text: string) => {
  const amountMatch = text.match(/(\d+(?:\.\d+)?)/);
  if (!amountMatch) {
    return null;
  }
  const amount = Number.parseFloat(amountMatch[1]);
  return Number.isNaN(amount) ? null : amount;
};

const extractCategory = (text: string) => {
  const normalized = text.toLowerCase();
  for (const category of DEFAULT_CATEGORIES) {
    const matched = CATEGORY_KEYWORDS[category].some((keyword) => normalized.includes(keyword));
    if (matched) {
      return category;
    }
  }
  return null;
};
const detectTransactionType = (text: string): TransactionType => {
  const normalized = text.toLowerCase();
  const isIncome = INCOME_KEYWORDS.some((keyword) => normalized.includes(keyword));
  return isIncome ? 'Income' : 'Expense';
};
const isBalanceQuery = (text: string) => {
  const normalized = text.toLowerCase();
  return BALANCE_QUERIES.some((keyword) => normalized.includes(keyword));
};
const isBudgetQuery = (text: string) => {
  const normalized = text.toLowerCase();
  return BUDGET_QUERIES.some((keyword) => normalized.includes(keyword));
};
const formatMoney = (amount: number) => amount.toLocaleString('en-US', { maximumFractionDigits: 0 });

export function AIAssistantScreen() {
  const { expenses, addExpense, categories, totalBalance, monthlyBudget } = useExpenses();
  const { token, user, apiOnline } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [pendingDetection, setPendingDetection] = useState<PendingDetection | null>(null);
  const [sending, setSending] = useState(false);

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
  const todayTotal = todayExpenses.reduce((sum, item) => sum + item.amount, 0);
  const monthExpenses = expenses.filter((item) => {
    if (item.transactionType !== 'Expense') {
      return false;
    }
    const d = new Date(item.date);
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth();
  });
  const currentMonthSpent = monthExpenses.reduce((sum, item) => sum + item.amount, 0);

  const aiGreeting =
    todayTotal > 0
      ? `ওমর, আপনি আজ ৳${todayTotal.toFixed(
          0,
        )} টাকা খরচ করেছেন। বাজেট ঠিক রাখতে আজ একটু সাশ্রয়ী থাকুন, আমি আপনার সাথে আছি।`
      : 'আসসালামু আলাইকুম ওমর, আজ এখনো কোনো খরচ যোগ হয়নি। দারুণ শুরু - আমি আপনার বাজেট দেখে রাখছি।';

  const openingMessage =
    todayTotal > 0
      ? `ওমর, আপনি আজ ৳${todayTotal.toFixed(
          0,
        )} টাকা খরচ করেছেন। বাজেট ঠিক রাখতে আজ একটু সাশ্রয়ী থাকুন, আমি আপনার সাথে আছি।`
      : aiGreeting;

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 'opening-ai', sender: 'ai', text: openingMessage },
  ]);

  const addFriendlyFallbackReply = (userText: string) => {
    const normalized = userText.toLowerCase();
    const userName = user?.name?.trim() || 'বন্ধু';
    
    // Check for specific keywords
    if (normalized.includes('tip') || normalized.includes('টিপস')) {
      return `💡 Savings tip: দৈনিক খরচের জন্য ছোট limit সেট করুন, আর অপ্রয়োজনীয় subscription গুলো মাসে 1 বার review করুন।`;
    }
    
    if (normalized.includes('food') || normalized.includes('খাবার') || normalized.includes('cha')) {
      return `🍜 খাবার খরচ কমানোর টিপস: বাড়িতে রান্না করুন, রেস্তোরাঁয় যাওয়া কমান। এক সপ্তাহে বা দুই সপ্তাহে বাজার করে রেখে দিন।`;
    }
    
    if (normalized.includes('transport') || normalized.includes('যাতায়াত')) {
      return `🚗 যাতায়াত খরচ কমানোর টিপস: একসাথে গাড়িতে চড়ুন (carpooling), সাইকেল ব্যবহার করুন অথবা পাবলিক ট্রান্সপোর্ট ব্যবহার করুন।`;
    }

    const suggestions = [
      `ধন্যবাদ ${userName}! আপনি চাইলে amount + category লিখে দিন (যেমন: "120 food"), আমি সাথে সাথে হিসাব করে দিবো।`,
      `ভালো প্রশ্ন ${userName}। ছোট খরচগুলো নোট করলে মাসের শেষে savings অনেক স্পষ্ট দেখা যায়।`,
      `আমি আছি ${userName}। এখনো আপনার খরচ count করলে সেভিংস গোল আরো easy হবে।`,
      `${userName}, আপনার প্রতিটি টাকার মূল্য আছে। নিয়মিত খরচ ট্র্যাক করলে perfect balance পাবেন।`,
    ];
    return suggestions[Math.floor(Math.random() * suggestions.length)];
  };

  const generateSpendingInsight = (): string => {
    const avgDailySpend = todayExpenses.length > 0 ? todayTotal / todayExpenses.length : 0;
    const daysInMonth = 30;
    const remainingDays = Math.max(1, daysInMonth - new Date().getDate());
    const projectedMonthlySpend = currentMonthSpent + (todayTotal * remainingDays);
    
    if (projectedMonthlySpend > monthlyBudget * 1.2) {
      return ` আপনার খরচের গতিতে মাস শেষে বাজেট ${Math.round(projectedMonthlySpend - monthlyBudget)}৳ ছাড়িয়ে যাবে। এখনই সাশ্রয় শুরু করুন!`;
    }
    if (projectedMonthlySpend > monthlyBudget) {
      return ` বর্তমান গতিতে চললে বাজেটের সীমায় থাকবেন, তবে একটু সাবধানী থাকুন।`;
    }
    if (currentMonthSpent < monthlyBudget * 0.3) {
      return ` দুর্দান্ত! এই মাসে আপনি এখনো বাজেটের ৩০% খরচ করেননি। এই গতি বজায় রাখুন!`;
    }
    return ` আপনার খরচ নিয়ন্ত্রণে আছে। বাজেট সচেতনতা বজায় রাখুন।`;
  };

  const handleAIReply = (userText: string) => {
    if (isBalanceQuery(userText)) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `আপনার বর্তমান ব্যালেন্স ৳${totalBalance.toFixed(
            2,
          )}।${generateSpendingInsight()}`,
        },
      ]);
      return;
    }
    if (isBudgetQuery(userText)) {
      const remainingBudget = monthlyBudget - currentMonthSpent;
      const baseText = `আপনার এই মাসের বাজেট ${formatMoney(monthlyBudget)}৳। আপনি এ পর্যন্ত ${formatMoney(
        currentMonthSpent,
      )}৳ খরচ করেছেন। আপনার হাতে এখনো ${formatMoney(Math.max(remainingBudget, 0))}৳ আছে।`;
      const warningText =
        remainingBudget <= monthlyBudget * 0.2
          ? ' ⚠️ সতর্কতা: আপনি আপনার বাজেটের কাছাকাছি চলে এসেছেন!'
          : '';
      const crossedText =
        remainingBudget < 0 ? ` ⚠️ সতর্কতা: আপনি বাজেট ${formatMoney(Math.abs(remainingBudget))}৳ ছাড়িয়ে গিয়েছেন!` : '';
      const spendingInsight = generateSpendingInsight();

      setChatMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `${baseText}${crossedText || warningText}${spendingInsight}`,
        },
      ]);
      return;
    }

    const amount = extractAmount(userText);
    const category = extractCategory(userText) ?? categories[0] ?? 'Shopping';
    const transactionType = detectTransactionType(userText);

    if (amount) {
      setPendingDetection({
        amount,
        category,
        transactionType,
        sourceText: userText,
      });
      setChatMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `আপনি কি ${category} খাতে ${amount}৳ ${transactionType} যোগ করতে চাচ্ছেন?`,
        },
      ]);
      return;
    }

    setChatMessages((prev) => [
      ...prev,
      {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: 'আমি পাশে আছি। আপনি চাইলে খরচের ধরন বা পরিমাণ আরেকটু বিস্তারিত বলুন, আমি সাথে সাথে সাজেস্ট করবো।',
      },
    ]);
  };

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || sending) {
      return;
    }

    setInputValue('');
    setChatMessages((prev) => [...prev, { id: `user-${Date.now()}`, sender: 'user', text }]);
    setSending(true);

    const canAttemptBackend = Boolean(token) && apiOnline;
    if (canAttemptBackend) {
      try {
        const response = await apiRequest<{ reply?: string }>('/ai/chat', {
          method: 'POST',
          token: token ?? undefined,
          body: { message: text },
        });
        const backendReply = response.reply?.trim();
        if (backendReply) {
          setChatMessages((prev) => [
            ...prev,
            { id: `ai-${Date.now()}`, sender: 'ai', text: backendReply },
          ]);
          setSending(false);
          return;
        }
      } catch {
        // AI backend may not be available yet; continue with local logic
      }
    }

    setTimeout(() => {
      if (isBalanceQuery(text) || isBudgetQuery(text) || extractAmount(text)) {
        handleAIReply(text);
      } else {
        setChatMessages((prev) => [
          ...prev,
          { id: `ai-${Date.now()}`, sender: 'ai', text: addFriendlyFallbackReply(text) },
        ]);
      }
      setSending(false);
    }, 1000);
  };

  const handleConfirm = (confirmed: boolean) => {
    if (!pendingDetection) {
      return;
    }
    if (confirmed) {
      addExpense({
        amount: pendingDetection.amount,
        category: pendingDetection.category,
        transactionType: pendingDetection.transactionType,
        date: new Date().toISOString(),
        note: pendingDetection.sourceText,
      });
      const updatedBalance =
        pendingDetection.transactionType === 'Income'
          ? totalBalance + pendingDetection.amount
          : totalBalance - pendingDetection.amount;
      setChatMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `সফলভাবে যোগ করা হয়েছে! আপনার বর্তমান ব্যালেন্স এখন ${updatedBalance.toFixed(2)}৳।`,
        },
      ]);
    } else {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: 'ঠিক আছে, আমি বাতিল করেছি।',
        },
      ]);
    }
    setPendingDetection(null);
  };

  return (
    <CalmScreen
      title="AI Assistant"
      subtitle="Your supportive finance friend, always watching your DinLipi with care."
    >
      <View style={styles.pulseRow}>
        <View style={styles.pulseOuter}>
          <View style={styles.pulseInner}>
            <Ionicons name="sparkles" size={14} color="#FFFFFF" />
          </View>
        </View>
        <Text style={styles.pulseText}>DinLipi AI is listening</Text>
      </View>
      <View style={styles.quickActionsRow}>
        {QUICK_ACTIONS.map((item) => (
          <Pressable
            key={item}
            onPress={() => {
              setChatMessages((prev) => [...prev, { id: `user-${Date.now()}`, sender: 'user', text: item }]);
              setTimeout(() => handleAIReply(item), 220);
            }}
            style={styles.quickActionChip}
          >
            <Text style={styles.quickActionText}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={styles.chatList} contentContainerStyle={styles.chatListContent} showsVerticalScrollIndicator={false}>
        {chatMessages.map((message) => (
          <View
            key={message.id}
            style={[styles.messageBubble, message.sender === 'ai' ? styles.aiBubble : styles.userBubble]}
          >
            {message.sender === 'ai' ? <Text style={styles.messageLabel}>DinLipi AI</Text> : null}
            <Text style={message.sender === 'ai' ? styles.messageText : styles.userText}>{message.text}</Text>
          </View>
        ))}
        {pendingDetection ? (
          <View style={styles.confirmationRow}>
            <Pressable onPress={() => handleConfirm(true)} style={styles.confirmationChip}>
              <Text style={styles.confirmationChipText}>হ্যাঁ (Yes)</Text>
            </Pressable>
            <Pressable onPress={() => handleConfirm(false)} style={styles.confirmationChipMuted}>
              <Text style={styles.confirmationChipTextMuted}>না (No)</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          value={inputValue}
          onChangeText={setInputValue}
          placeholder="যেমন লিখুন: 50 taka cha"
          placeholderTextColor={palette.textMuted}
          style={styles.input}
        />
        <Pressable onPress={handleSend} style={styles.sendButton}>
          <Ionicons name={sending ? 'time-outline' : 'send'} size={16} color="#FFFFFF" />
        </Pressable>
      </View>
    </CalmScreen>
  );
}

const styles = StyleSheet.create({
  messageBubble: {
    borderRadius: 18,
    padding: 14,
    gap: 8,
    borderWidth: 1,
  },
  chatList: {
    flex: 1,
    marginTop: 4,
  },
  quickActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickActionChip: {
    borderWidth: 1,
    borderColor: palette.glassBorder,
    borderRadius: 999,
    backgroundColor: palette.glassStrong,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickActionText: {
    color: palette.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  chatListContent: {
    gap: 12,
    paddingVertical: 6,
  },
  confirmationRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 2,
  },
  confirmationChip: {
    backgroundColor: palette.accent,
    borderWidth: 1,
    borderColor: palette.accentSecondary,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 14,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  confirmationChipMuted: {
    backgroundColor: palette.glassStrong,
    borderWidth: 1,
    borderColor: palette.glassBorder,
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 14,
  },
  confirmationChipText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  confirmationChipTextMuted: {
    color: palette.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  aiBubble: {
    backgroundColor: palette.glassStrong,
    borderColor: palette.glassBorder,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 5,
  },
  userBubble: {
    backgroundColor: palette.accent,
    borderColor: palette.accentSecondary,
    alignSelf: 'flex-end',
    maxWidth: '88%',
  },
  messageLabel: {
    color: palette.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  messageText: {
    color: palette.textPrimary,
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  pulseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pulseOuter: {
    backgroundColor: 'rgba(142, 45, 226, 0.22)',
    borderRadius: 999,
    padding: 5,
  },
  pulseInner: {
    backgroundColor: palette.accentSecondary,
    borderRadius: 999,
    padding: 8,
  },
  pulseText: {
    color: palette.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: palette.glassBorder,
    borderRadius: 16,
    backgroundColor: palette.glassStrong,
    padding: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: palette.textPrimary,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accent,
  },
});
