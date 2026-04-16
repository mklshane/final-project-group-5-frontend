import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Calendar } from 'react-native-calendars';

type Period = 'day' | 'week' | 'month' | 'year';

type PeriodNavigatorProps = {
  period: Period;
  anchor: Date;
  onSetAnchor: (date: Date) => void;
  formatAnchorLabel: (period: Period, anchor: Date) => string;
  isFutureAnchor: (period: Period, anchor: Date) => boolean;
  stepAnchor: (period: Period, anchor: Date, dir: 1 | -1) => Date;
};

export default function PeriodNavigator({
  period,
  anchor,
  onSetAnchor,
  formatAnchorLabel,
  isFutureAnchor,
  stepAnchor,
}: PeriodNavigatorProps) {
  const theme = useTheme();
  const s = makeStyles(theme);
  const [pickerVisible, setPickerVisible] = useState(false);

  const anchorLabel = formatAnchorLabel(period, anchor);

  const renderCalendar = () => (
    <View style={s.calendarContainer}>
      <Calendar
        current={anchor.toISOString().split('T')[0]}
        markedDates={{
          [anchor.toISOString().split('T')[0]]: {
            selected: true,
            selectedColor: theme.isDark ? theme.lime : 'rgba(200, 245, 96, 0.35)',
          },
        }}
        onDayPress={(day) => {
          onSetAnchor(new Date(day.timestamp));
          setPickerVisible(false);
        }}
        monthFormat={'MMMM yyyy'}
        hideExtraDays
        disableMonthChange={false}
        firstDay={1}
        onPressArrowLeft={(subtractMonth) => subtractMonth()}
        onPressArrowRight={(addMonth) => addMonth()}
        disableArrowRight={isFutureAnchor('month', anchor)}
        theme={{
          backgroundColor: theme.surface,
          calendarBackground: theme.surface,
          textSectionTitleColor: theme.secondary,
          selectedDayBackgroundColor: theme.isDark ? theme.lime : 'rgba(200, 245, 96, 0.35)',
          selectedDayTextColor: '#1A1E14',
          todayTextColor: theme.lime,
          dayTextColor: theme.text,
          textDisabledColor: theme.tertiary,
          dotColor: theme.lime,
          selectedDotColor: '#ffffff',
          arrowColor: theme.lime,
          disabledArrowColor: theme.tertiary,
          monthTextColor: theme.text,
          indicatorColor: 'blue',
          textDayFontWeight: '300',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '300',
          textDayFontSize: 16,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 16,
        }}
      />
    </View>
  );

  const renderPicker = () => {
    const items: Date[] = [];
    let current = getDefaultAnchor(period);
    for (let i = 0; i < 12; i++) {
      items.push(current);
      current = stepAnchor(period, current, -1);
    }

    return (
      <ScrollView>
        {items.map((item) => {
          const isActive = item.getTime() === anchor.getTime();
          return (
            <TouchableOpacity
              key={item.toISOString()}
              style={[s.pickerItem, isActive && s.pickerItemActive]}
              onPress={() => {
                onSetAnchor(item);
                setPickerVisible(false);
              }}
            >
              <Text style={[s.pickerItemText, isActive && s.pickerItemTextActive]}>
                {formatAnchorLabel(period, item)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  return (
    <View style={s.container}>
      <Pressable onPress={() => setPickerVisible(!pickerVisible)} style={s.navigator}>
        <Text style={s.navLabel}>{anchorLabel}</Text>
        <Ionicons name={pickerVisible ? 'chevron-up' : 'chevron-down'} size={16} color={theme.text} />
      </Pressable>

      {pickerVisible && (
        <View style={s.dropdown}>
          {period === 'day' ? renderCalendar() : <View style={s.pickerContainer}>{renderPicker()}</View>}
        </View>
      )}
    </View>
  );
}

function getDefaultAnchor(period: Period): Date {
    const now = new Date();
    if (period === 'day') {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    if (period === 'week') {
      const day = now.getDay();
      const diffToMon = day === 0 ? -6 : 1 - day;
      const weekStart = new Date(now);
      weekStart.setHours(0, 0, 0, 0);
      weekStart.setDate(now.getDate() + diffToMon);
      return weekStart;
    }
    if (period === 'month') {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return new Date(now.getFullYear(), 0, 1);
  }

const makeStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      position: 'relative',
      zIndex: 10,
    },
    navigator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.surface,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    navLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
      letterSpacing: -0.2,
    },
    dropdown: {
      position: 'absolute',
      top: '110%',
      left: 0,
      right: 0,
      backgroundColor: theme.surface,
      borderRadius: 20,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 5,
      },
      shadowOpacity: 0.3,
      shadowRadius: 15,
      elevation: 10,
    },
    calendarContainer: {
      borderRadius: 20,
      overflow: 'hidden',
    },
    pickerContainer: {
      maxHeight: 250,
    },
    pickerItem: {
      padding: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme.surfaceDeep,
    },
    pickerItemActive: {
      backgroundColor: 'rgba(200, 245, 96, 0.3)',
    },
    pickerItemText: {
      color: theme.text,
      fontSize: 16,
      textAlign: 'center',
    },
    pickerItemTextActive: {
      color: '#1A1E14',
      fontWeight: '700',
    },
  });
