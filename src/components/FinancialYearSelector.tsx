// components/FinancialYearSelector.tsx
import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, Platform} from 'react-native';
import {Picker} from '@react-native-picker/picker';

interface FinancialYearSelectorProps {
  selectedYear: string;
  onYearChange: (year: string) => void;
}

const FinancialYearSelector: React.FC<FinancialYearSelectorProps> = ({
  selectedYear,
  onYearChange,
}) => {
  const [financialYears, setFinancialYears] = useState<string[]>([]);

  useEffect(() => {
    generateFinancialYears();
  }, []);

  const generateFinancialYears = () => {
    const years: string[] = [];
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 2; year <= currentYear + 3; year++) {
      years.push(`${year}-${(year + 1).toString().slice(2)}`);
    }
    setFinancialYears(years);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Financial Year:</Text>
      <View
        style={Platform.OS === 'ios' ? styles.iosPicker : styles.androidPicker}>
        <Picker
          selectedValue={selectedYear}
          onValueChange={itemValue => onYearChange(itemValue)}>
          {financialYears.map(year => (
            <Picker.Item key={year} label={year} value={year} />
          ))}
        </Picker>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#555',
  },
  iosPicker: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  androidPicker: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
});

export default FinancialYearSelector;
