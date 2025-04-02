import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  Modal,
  StyleSheet,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface CrossPlatformDatePickerProps {
  date: Date | null;
  onDateChange: (date: Date) => void;
  mode?: 'date' | 'time' | 'datetime';
  title?: string;
}

const CrossPlatformDatePicker: React.FC<CrossPlatformDatePickerProps> = ({
  date,
  onDateChange,
  mode = 'date',
  title = 'Select Date',
}) => {
  const [show, setShow] = useState(false);
  const [currentDate, setCurrentDate] = useState(date || new Date());

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentSelectedDate = selectedDate || currentDate;

    if (Platform.OS === 'android') {
      setShow(false);
    }

    setCurrentDate(currentSelectedDate);
    onDateChange(currentSelectedDate);
  };

  const showDatepicker = () => {
    setShow(true);
  };

  const renderPicker = () => {
    if (Platform.OS === 'ios') {
      return (
        <Modal
          transparent={true}
          visible={show}
          animationType="slide"
          onRequestClose={() => setShow(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{title}</Text>
              </View>
              <DateTimePicker
                testID="dateTimePicker"
                value={currentDate}
                mode={mode}
                is24Hour={true}
                display="spinner"
                onChange={handleDateChange}
              />
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => setShow(false)}>
                  <Text style={styles.buttonText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => {
                    onDateChange(currentDate);
                    setShow(false);
                  }}>
                  <Text style={styles.buttonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      );
    }

    // Android picker
    return (
      show && (
        <DateTimePicker
          testID="dateTimePicker"
          value={currentDate}
          mode={mode}
          is24Hour={true}
          display="default"
          onChange={handleDateChange}
        />
      )
    );
  };

  return (
    <View>
      <TouchableOpacity onPress={showDatepicker} style={styles.pickerTrigger}>
        <Text style={styles.pickerText}>
          {currentDate ? currentDate.toLocaleDateString() : 'Select Date'}
        </Text>
      </TouchableOpacity>
      {renderPicker()}
    </View>
  );
};

const styles = StyleSheet.create({
  pickerTrigger: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: {
    color: '#4B5563',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
  },
  button: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default CrossPlatformDatePicker;
