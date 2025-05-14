// components/FinancialYearCalendar.tsx
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

interface FinancialYearCalendarProps {
  financialYear: string;
}

const FinancialYearCalendar: React.FC<FinancialYearCalendarProps> = ({
  financialYear,
}) => {
  const getMonthStructure = () => {
    const [startYearStr] = financialYear.split('-');
    const startYear = parseInt(startYearStr);
    const months = [];

    // Financial year runs from April to March
    for (let monthIdx = 3; monthIdx <= 14; monthIdx++) {
      const currentYear = startYear + Math.floor(monthIdx / 12);
      const currentMonth = monthIdx % 12;
      const monthDate = new Date(currentYear, currentMonth, 1);

      if (monthDate.getMonth() !== currentMonth) break;

      const monthName = monthDate.toLocaleString('default', {month: 'long'});
      const weeks = [];
      let currentDate = new Date(currentYear, currentMonth, 1);

      while (currentDate.getMonth() === currentMonth) {
        const weekStart = currentDate.getDate();
        currentDate.setDate(currentDate.getDate() + 6);
        const weekEnd = Math.min(
          currentDate.getDate(),
          new Date(currentYear, currentMonth + 1, 0).getDate(),
        );

        weeks.push({start: weekStart, end: weekEnd});

        currentDate.setDate(currentDate.getDate() + 1);
      }

      months.push({
        name: monthName,
        year: currentYear,
        weeks,
      });
    }

    return months;
  };

  const months = getMonthStructure();

  return (
    <View style={styles.container}>
      {months.map((month, index) => (
        <View key={`${month.name}-${index}`} style={styles.monthContainer}>
          <Text style={styles.monthTitle}>
            {month.name} {month.year}
          </Text>
          <View style={styles.weeksContainer}>
            {month.weeks.map((week, weekIndex) => (
              <View key={`week-${weekIndex}`} style={styles.weekBlock}>
                <Text style={styles.weekLabel}>Week {weekIndex + 1}</Text>
                <Text style={styles.weekDates}>
                  {month.name.slice(0, 3)} {week.start} - {week.end}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  monthContainer: {
    marginBottom: 20,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#4A5568',
  },
  weeksContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  weekBlock: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    minWidth: '30%',
    marginBottom: 8,
  },
  weekLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  weekDates: {
    fontSize: 12,
    color: '#718096',
  },
});

export default FinancialYearCalendar;
