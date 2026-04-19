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
      <Text style={s.groupLabel}>DATE RANGE</Text>
      <Pressable
        onPress={() => setPickerVisible(!pickerVisible)}
        style={s.navigatorPressable}
      >
        {({ pressed }) => (
          <View style={[s.navigator, pressed && s.navigatorPressed]}>
            <View style={s.navContent}>
              <View style={s.navIconWrap}>
                <Ionicons name="calendar-outline" size={15} color={theme.limeDark} />
              </View>
              <Text style={s.navLabel} numberOfLines={1}>{anchorLabel}</Text>
            </View>
            <View style={s.chevronWrap}>
              <Ionicons name={pickerVisible ? 'chevron-up' : 'chevron-down'} size={15} color={theme.text} />
            </View>
          </View>
        )}
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
    navigatorPressable: {
      width: '100%',
    },
    navigator: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.isDark ? theme.surface : '#F7FAF3',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 16,
      paddingVertical: 11,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: theme.isDark ? 0 : 0.05,
      shadowRadius: 6,
      elevation: theme.isDark ? 0 : 2,
    },
    navigatorPressed: {
      opacity: 0.9,
    },
    groupLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.secondary,
      letterSpacing: 1.8,
      marginBottom: 8,
    },
    navContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      paddingRight: 8,
      minWidth: 0,
    },
    navIconWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.isDark ? 'rgba(200,245,96,0.14)' : 'rgba(200,245,96,0.24)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
      flexShrink: 0,
    },
    chevronWrap: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: theme.isDark ? theme.surfaceDeep : '#EEF3E6',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 10,
      flexShrink: 0,
    },
    navLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.text,
      letterSpacing: -0.2,
      flexShrink: 1,
    },
    dropdown: {
      position: 'absolute',
      top: '116%',
      left: 0,
      right: 0,
      backgroundColor: theme.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity: theme.isDark ? 0.25 : 0.14,
      shadowRadius: 14,
      elevation: theme.isDark ? 6 : 8,
    },
    calendarContainer: {
      borderRadius: 20,
      overflow: 'hidden',
    },
    pickerContainer: {
      maxHeight: 250,
      paddingVertical: 8,
    },
    pickerItem: {
      paddingVertical: 12,
      paddingHorizontal: 14,
      marginHorizontal: 8,
      marginVertical: 2,
      borderRadius: 12,
    },
    pickerItemActive: {
      backgroundColor: 'rgba(200, 245, 96, 0.22)',
      borderWidth: 1,
      borderColor: 'rgba(138, 175, 45, 0.45)',
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
