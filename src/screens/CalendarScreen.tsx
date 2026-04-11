import { useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CalmScreen } from '../components/CalmScreen';
import { palette } from '../theme/palette';

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const HOLIDAYS = [
  { month: 3, day: 26, title: 'Independence Day' },
  { month: 4, day: 14, title: 'Pohela Boishakh' },
  { month: 12, day: 16, title: 'Victory Day' },
];

type HabitId = 'water' | 'tea' | 'snacks';
type Habit = { id: HabitId; title: string; unit: string };

const HABITS: Habit[] = [
  { id: 'water', title: 'Water (Glasses)', unit: 'glasses' },
  { id: 'tea', title: 'Tea/Coffee (Cups)', unit: 'cups' },
  { id: 'snacks', title: 'Cigarettes/Snacks', unit: 'count' },
];

export function CalendarScreen() {
  const today = new Date();
  const [habitCounts, setHabitCounts] = useState<Record<HabitId, number>>({
    water: 0,
    tea: 0,
    snacks: 0,
  });
  const habitScales = useRef<Record<HabitId, Animated.Value>>({
    water: new Animated.Value(1),
    tea: new Animated.Value(1),
    snacks: new Animated.Value(1),
  }).current;

  const year = today.getFullYear();
  const month = today.getMonth();
  const monthName = today.toLocaleString('en-US', { month: 'long' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOffset = new Date(year, month, 1).getDay();

  const calendarCells = useMemo(() => {
    const cells: Array<number | null> = [];
    for (let i = 0; i < firstDayOffset; i += 1) cells.push(null);
    for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [daysInMonth, firstDayOffset]);

  const monthlyHolidays = HOLIDAYS.filter((h) => h.month === month + 1);

  const incrementHabit = (id: HabitId) => {
    setHabitCounts((prev) => ({ ...prev, [id]: prev[id] + 1 }));
    Animated.sequence([
      Animated.timing(habitScales[id], { toValue: 1.04, duration: 120, useNativeDriver: true }),
      Animated.timing(habitScales[id], { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  return (
    <CalmScreen
      title="Calendar"
      subtitle="Track your month and build gentle habits with your purple-glass daily journal."
    >
      <View style={styles.calendarCard}>
        <Text style={styles.monthTitle}>{monthName} {year}</Text>
        <View style={styles.weekRow}>
          {WEEK_DAYS.map((day) => (
            <Text key={day} style={styles.weekDay}>{day}</Text>
          ))}
        </View>

        <View style={styles.grid}>
          {calendarCells.map((day, index) => {
            const holiday = monthlyHolidays.find((h) => h.day === day);
            const isToday = day === today.getDate();
            return (
              <View key={`${day ?? 'blank'}-${index}`} style={[styles.dayCell, isToday && styles.todayCell]}>
                <Text style={[styles.dayText, isToday && styles.todayText, holiday && styles.holidayText]}>
                  {day ?? ''}
                </Text>
                {holiday ? <View style={styles.holidayDot} /> : null}
              </View>
            );
          })}
        </View>

        <View style={styles.holidayLegend}>
          {monthlyHolidays.length > 0 ? (
            monthlyHolidays.map((holiday) => (
              <Text key={holiday.title} style={styles.holidayItem}>
                {holiday.day} {monthName} - {holiday.title}
              </Text>
            ))
          ) : (
            <Text style={styles.holidayItem}>No major holidays marked for this month.</Text>
          )}
        </View>
      </View>

      <Text style={styles.habitSectionTitle}>Daily Habits (Today)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.habitRow}>
        {HABITS.map((habit) => (
          <Animated.View
            key={habit.id}
            style={[styles.habitCard, { transform: [{ scale: habitScales[habit.id] }] }]}
          >
            <Text style={styles.habitTitle}>{habit.title}</Text>
            <Text style={styles.habitCount}>{habitCounts[habit.id]}</Text>
            <Text style={styles.habitUnit}>{habit.unit}</Text>
            <Pressable onPress={() => incrementHabit(habit.id)} style={styles.plusButton}>
              <Text style={styles.plusText}>+</Text>
            </Pressable>
          </Animated.View>
        ))}
      </ScrollView>
      <Text style={styles.habitHint}>Small habits shape your monthly money mood.</Text>
      
      <View style={styles.holidayListCard}>
        <Text style={styles.holidayListTitle}>Bangladesh Holiday Highlights</Text>
        <Text style={styles.holidayListText}>26 March - Independence Day</Text>
        <Text style={styles.holidayListText}>14 April - Pohela Boishakh</Text>
        <Text style={styles.holidayListText}>16 December - Victory Day</Text>
      </View>
    </CalmScreen>
  );
}

const styles = StyleSheet.create({
  calendarCard: {
    backgroundColor: palette.glassStrong,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.glassBorder,
    padding: 16,
    gap: 12,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 5,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: palette.textPrimary,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekDay: {
    width: '14%',
    textAlign: 'center',
    fontSize: 12,
    color: palette.textMuted,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayCell: {
    width: '13.5%',
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  todayCell: {
    borderColor: palette.accent,
    backgroundColor: 'rgba(142, 45, 226, 0.15)',
  },
  dayText: {
    fontSize: 13,
    color: palette.textPrimary,
    fontWeight: '600',
  },
  todayText: {
    color: palette.accent,
    fontWeight: '800',
  },
  holidayText: {
    color: palette.accentSecondary,
  },
  holidayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.accentSecondary,
  },
  holidayLegend: {
    gap: 4,
  },
  holidayItem: {
    color: palette.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  habitSectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: palette.textPrimary,
    marginTop: 2,
  },
  habitRow: {
    gap: 10,
  },
  habitCard: {
    width: 146,
    borderRadius: 20,
    padding: 14,
    backgroundColor: palette.glassStrong,
    borderWidth: 1,
    borderColor: palette.glassBorder,
    shadowColor: palette.shadow,
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 5,
    gap: 4,
  },
  habitTitle: {
    color: palette.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  habitCount: {
    color: palette.accent,
    fontSize: 30,
    fontWeight: '900',
  },
  habitUnit: {
    color: palette.textMuted,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  plusButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: palette.accent,
    borderRadius: 999,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },
  habitHint: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  holidayListCard: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: palette.glassBorder,
    backgroundColor: palette.glassStrong,
    gap: 5,
  },
  holidayListTitle: {
    color: palette.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  holidayListText: {
    color: palette.textMuted,
    fontSize: 13,
  },
});
