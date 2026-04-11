import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CalmScreen } from '../components/CalmScreen';
import { DEFAULT_CATEGORIES, useExpenses } from '../context/ExpenseContext';
import { palette } from '../theme/palette';

const formatDate = (date: Date) =>
  date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

const CALCULATOR_KEYS = [
  ['C', '%', '÷', '⌫'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', '+'],
  ['0', '.', '='],
];

const evaluateExpression = (rawExpression: string) => {
  const expression = rawExpression.replace(/×/g, '*').replace(/÷/g, '/');
  if (!expression.trim() || !/^[0-9+\-*/%.()\s]+$/.test(expression)) {
    return null;
  }
  try {
    const result = Function(`"use strict"; return (${expression});`)();
    return typeof result === 'number' && Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
};

export function AddExpenseScreen() {
  const { addExpense, categories, addCategory, editCategory, deleteCategory } = useExpenses();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [pendingDeleteCategory, setPendingDeleteCategory] = useState<string | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorExpression, setCalculatorExpression] = useState('');

  const isSaveDisabled = useMemo(() => !amount.trim() || !category, [amount, category]);

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') {
      setShowDatePicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleSave = () => {
    if (isSaveDisabled) {
      return;
    }
    const parsedAmount = Number.parseFloat(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0 || !category) {
      return;
    }

    addExpense({
      amount: parsedAmount,
      category,
      transactionType: 'Expense',
      note: note.trim() || undefined,
      date: date.toISOString(),
    });

    setSuccessMessage('খরচ সফলভাবে যোগ করা হয়েছে।');
    setAmount('');
    setCategory('');
    setNote('');
    setDate(new Date());
    setTimeout(() => setSuccessMessage(''), 2200);
  };
  const handleSaveCategory = () => {
    const next = newCategoryName.trim();
    if (!next) {
      return;
    }
    addCategory(next);
    setCategory(next);
    setNewCategoryName('');
    setShowNewCategoryInput(false);
  };
  const customCategories = categories.filter(
    (item) => !DEFAULT_CATEGORIES.some((base) => base.toLowerCase() === item.toLowerCase()),
  );
  const startEditingCategory = (name: string) => {
    setEditingCategory(name);
    setEditingName(name);
  };
  const saveEditedCategory = () => {
    if (!editingCategory) {
      return;
    }
    editCategory(editingCategory, editingName);
    if (category.toLowerCase() === editingCategory.toLowerCase()) {
      setCategory(editingName.trim() || category);
    }
    setEditingCategory(null);
    setEditingName('');
  };
  const removeCategory = (name: string) => {
    setPendingDeleteCategory(name);
  };
  const confirmDeleteCategory = () => {
    if (!pendingDeleteCategory) {
      return;
    }
    deleteCategory(pendingDeleteCategory);
    if (category.toLowerCase() === pendingDeleteCategory.toLowerCase()) {
      setCategory('');
    }
    if (editingCategory?.toLowerCase() === pendingDeleteCategory.toLowerCase()) {
      setEditingCategory(null);
      setEditingName('');
    }
    setPendingDeleteCategory(null);
  };
  const handleCalculatorPress = (key: string) => {
    if (key === 'C') {
      setCalculatorExpression('');
      return;
    }
    if (key === '⌫') {
      setCalculatorExpression((prev) => prev.slice(0, -1));
      return;
    }
    if (key === '=') {
      const result = evaluateExpression(calculatorExpression);
      if (result === null) {
        return;
      }
      setCalculatorExpression(result.toString());
      return;
    }
    setCalculatorExpression((prev) => `${prev}${key}`);
  };
  const handleUseCalculatedAmount = () => {
    const result = evaluateExpression(calculatorExpression);
    if (result === null) {
      return;
    }
    setAmount(result.toFixed(2));
    setShowCalculator(false);
  };

  return (
    <CalmScreen
      title="Add Expense"
      subtitle="Capture a moment of spending quickly, then return to calm."
    >
      {successMessage ? (
        <View style={styles.successToast}>
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      ) : null}

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Amount</Text>
        <View style={styles.amountWrap}>
          <Text style={styles.currency}>৳</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={palette.textMuted}
            keyboardType="decimal-pad"
            style={styles.amountInput}
          />
          <Pressable
            onPress={() => setShowCalculator(true)}
            style={({ pressed }) => [styles.calculatorTrigger, pressed && styles.calculatorTriggerPressed]}
          >
            <Ionicons name="calculator-outline" size={18} color={palette.accent} />
          </Pressable>
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Category</Text>
        <View style={styles.chipsRow}>
          {categories.map((item) => {
            const selected = category === item;
            return (
              <Pressable
                key={item}
                onPress={() => setCategory(item)}
                style={[styles.chip, selected && styles.chipActive]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextActive]}>{item}</Text>
              </Pressable>
            );
          })}
          <Pressable onPress={() => setShowNewCategoryInput((prev) => !prev)} style={styles.newChip}>
            <Text style={styles.newChipText}>+ নতুন (New)</Text>
          </Pressable>
        </View>
        {showNewCategoryInput ? (
          <View style={styles.newCategoryRow}>
            <TextInput
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="নতুন ক্যাটাগরি লিখুন"
              placeholderTextColor={palette.textMuted}
              style={styles.newCategoryInput}
            />
            <Pressable onPress={handleSaveCategory} style={styles.newCategorySave}>
              <Ionicons name="checkmark" size={15} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : null}
        {customCategories.length > 0 ? (
          <View style={styles.manageWrap}>
            <Text style={styles.manageTitle}>Custom Categories</Text>
            {customCategories.map((item) => (
              <View key={item} style={styles.manageRow}>
                {editingCategory?.toLowerCase() === item.toLowerCase() ? (
                  <>
                    <TextInput
                      value={editingName}
                      onChangeText={setEditingName}
                      placeholder="Edit category"
                      placeholderTextColor={palette.textMuted}
                      style={styles.manageInput}
                    />
                    <Pressable onPress={saveEditedCategory} style={styles.iconBtnPrimary}>
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Text style={styles.manageText}>{item}</Text>
                    <View style={styles.manageActions}>
                      <Pressable onPress={() => startEditingCategory(item)} style={styles.iconBtn}>
                        <Ionicons name="create-outline" size={14} color={palette.accent} />
                      </Pressable>
                      <Pressable onPress={() => removeCategory(item)} style={styles.iconBtn}>
                        <Ionicons name="trash-outline" size={14} color={palette.accentSecondary} />
                      </Pressable>
                    </View>
                  </>
                )}
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Note (optional)</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Short note about this expense"
          placeholderTextColor={palette.textMuted}
          style={styles.textInput}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Date</Text>
        <Pressable onPress={() => setShowDatePicker(true)} style={styles.dateField}>
          <View style={styles.dateTextWrap}>
            <Ionicons name="calendar-outline" size={16} color={palette.textMuted} />
            <Text style={styles.dateText}>{formatDate(date)}</Text>
          </View>
          <Ionicons name="chevron-down" size={16} color={palette.textMuted} />
        </Pressable>
      </View>

      {showDatePicker ? (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={onDateChange}
          maximumDate={new Date(2100, 11, 31)}
        />
      ) : null}

      <View style={styles.buttonContainer}>
        <Pressable
          onPress={handleSave}
          disabled={isSaveDisabled}
          style={[styles.button, isSaveDisabled && styles.buttonDisabled]}
        >
          <LinearGradient
            colors={[palette.accent, palette.accentSecondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>খরচ যোগ করুন</Text>
          </LinearGradient>
        </Pressable>
      </View>
      <Modal
        visible={showCalculator}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalculator(false)}
      >
        <View style={styles.calculatorOverlay}>
          <View style={styles.calculatorCard}>
            <Text style={styles.calculatorTitle}>Calculator</Text>
            <View style={styles.calculatorDisplay}>
              <Text numberOfLines={1} adjustsFontSizeToFit style={styles.calculatorDisplayText}>
                {calculatorExpression || '0'}
              </Text>
            </View>
            <View style={styles.calculatorGrid}>
              {CALCULATOR_KEYS.map((row, rowIndex) => (
                <View key={`row-${rowIndex}`} style={styles.calculatorRow}>
                  {row.map((key) => (
                    <Pressable
                      key={key}
                      onPress={() => handleCalculatorPress(key)}
                      style={({ pressed }) => [
                        styles.calculatorKey,
                        ['+', '-', '×', '÷', '='].includes(key) && styles.calculatorKeyAccent,
                        pressed && styles.calculatorKeyPressed,
                      ]}
                    >
                      <Text style={styles.calculatorKeyText}>{key}</Text>
                    </Pressable>
                  ))}
                  {row.length < 4 ? <View style={styles.calculatorKeyPlaceholder} /> : null}
                </View>
              ))}
            </View>
            <Pressable onPress={handleUseCalculatedAmount} style={styles.useAmountWrap}>
              <LinearGradient
                colors={[palette.accent, palette.accentSecondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.useAmountButton}
              >
                <Text style={styles.useAmountText}>অ্যামাউন্ট বসান (Use Amount)</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal
        visible={Boolean(pendingDeleteCategory)}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingDeleteCategory(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete Category?</Text>
            <Text style={styles.modalText}>
              {pendingDeleteCategory
                ? `"${pendingDeleteCategory}" ক্যাটাগরি মুছে ফেলতে চান? এই অ্যাকশনটি আনডু হবে না।`
                : ''}
            </Text>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setPendingDeleteCategory(null)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>না, থাক</Text>
              </Pressable>
              <Pressable onPress={confirmDeleteCategory} style={styles.modalDeleteBtn}>
                <Text style={styles.modalDeleteText}>হ্যাঁ, ডিলিট</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </CalmScreen>
  );
}

const styles = StyleSheet.create({
  successToast: {
    backgroundColor: palette.glassStrong,
    borderColor: palette.glassBorder,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  successText: {
    color: palette.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  field: {
    borderWidth: 1,
    borderColor: palette.glassBorder,
    borderRadius: 22,
    padding: 16,
    gap: 10,
    backgroundColor: palette.glassStrong,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 6,
  },
  fieldLabel: {
    fontSize: 13,
    color: palette.textMuted,
    fontWeight: '600',
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  currency: {
    fontSize: 24,
    fontWeight: '700',
    color: palette.textPrimary,
  },
  amountInput: {
    flex: 1,
    fontSize: 26,
    color: palette.textPrimary,
    fontWeight: '700',
    paddingVertical: 2,
  },
  calculatorTrigger: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: palette.glassBorder,
    backgroundColor: 'rgba(25, 37, 64, 0.82)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calculatorTriggerPressed: {
    opacity: 0.8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.glassBorder,
    backgroundColor: 'rgba(20, 31, 56, 0.76)',
  },
  chipActive: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  chipText: {
    color: palette.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  newChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.accentSecondary,
    backgroundColor: 'rgba(142, 45, 226, 0.14)',
  },
  newChipText: {
    color: palette.accentSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  newCategoryRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: palette.glassBorder,
    borderRadius: 14,
    backgroundColor: 'rgba(20, 31, 56, 0.78)',
    padding: 8,
  },
  newCategoryInput: {
    flex: 1,
    color: palette.textPrimary,
    fontSize: 14,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  newCategorySave: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accent,
  },
  manageWrap: {
    marginTop: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: palette.glassBorder,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 25, 48, 0.72)',
    padding: 10,
  },
  manageTitle: {
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  manageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  manageText: {
    flex: 1,
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  manageActions: {
    flexDirection: 'row',
    gap: 6,
  },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.glassBorder,
    backgroundColor: 'rgba(25, 37, 64, 0.82)',
  },
  iconBtnPrimary: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accent,
  },
  manageInput: {
    flex: 1,
    color: palette.textPrimary,
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: palette.glassBorder,
    borderRadius: 12,
    backgroundColor: 'rgba(25, 37, 64, 0.84)',
  },
  textInput: {
    minHeight: 44,
    fontSize: 15,
    color: palette.textPrimary,
    paddingVertical: 0,
  },
  dateField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.glassBorder,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(20, 31, 56, 0.82)',
  },
  dateTextWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    color: palette.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: 4,
  },
  buttonGradient: {
    borderRadius: 20,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 8,
  },
  button: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  buttonDisabled: {
    opacity: 0.48,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
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
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.glassBorder,
    backgroundColor: palette.glassStrong,
    padding: 16,
    gap: 10,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 10,
  },
  modalTitle: {
    color: palette.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  modalText: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  modalCancelBtn: {
    borderWidth: 1,
    borderColor: palette.glassBorder,
    backgroundColor: 'rgba(25, 37, 64, 0.82)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  modalCancelText: {
    color: palette.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  modalDeleteBtn: {
    borderWidth: 1,
    borderColor: palette.accentSecondary,
    backgroundColor: palette.accent,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  modalDeleteText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  calculatorOverlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 9, 34, 0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  calculatorCard: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.glassBorder,
    backgroundColor: 'rgba(26, 15, 48, 0.86)',
    padding: 14,
    gap: 10,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.4,
    shadowRadius: 22,
    elevation: 12,
  },
  calculatorTitle: {
    color: '#EDE7FF',
    fontSize: 17,
    fontWeight: '800',
  },
  calculatorDisplay: {
    borderWidth: 1,
    borderColor: 'rgba(186, 158, 255, 0.28)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(15, 25, 48, 0.9)',
    minHeight: 66,
    justifyContent: 'center',
  },
  calculatorDisplayText: {
    color: '#F7F2FF',
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'right',
  },
  calculatorGrid: {
    gap: 8,
  },
  calculatorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  calculatorKey: {
    flex: 1,
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(64, 72, 93, 0.35)',
    backgroundColor: 'rgba(20, 31, 56, 0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calculatorKeyAccent: {
    backgroundColor: 'rgba(142, 45, 226, 0.32)',
    borderColor: 'rgba(186, 118, 247, 0.7)',
  },
  calculatorKeyPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  calculatorKeyText: {
    color: '#F6EEFF',
    fontSize: 20,
    fontWeight: '700',
  },
  calculatorKeyPlaceholder: {
    flex: 1,
  },
  useAmountWrap: {
    marginTop: 2,
    borderRadius: 14,
    overflow: 'hidden',
  },
  useAmountButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  useAmountText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
