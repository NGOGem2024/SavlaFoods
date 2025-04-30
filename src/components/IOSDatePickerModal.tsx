import React from 'react';
import {View, Text, Modal, TouchableOpacity, StyleSheet} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface IOSDatePickerModalProps {
  visible: boolean;
  date: Date;
  isInward: boolean;
  title: string;
  onClose: () => void;
  onDateChange: (event: any, date?: Date) => void;
  onConfirm: () => void;
}

const IOSDatePickerModal = ({
  visible,
  date,
  isInward,
  title,
  onClose,
  onDateChange,
  onConfirm,
}: IOSDatePickerModalProps) => {
  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.iosDatePickerModal}>
        <View
          style={[
            styles.iosDatePickerContainer,
            isInward ? styles.inwardDatePicker : styles.outwardDatePicker,
          ]}>
          <View style={styles.iosDatePickerHeader}>
            <Text style={styles.iosDatePickerTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text
                style={[
                  styles.iosDatePickerDoneBtn,
                  {color: isInward ? '#F48221' : '#4682B4'},
                ]}>
                Done
              </Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            testID="datePickerIOS"
            value={date}
            mode="date"
            display="spinner"
            onChange={(event, selectedDate) => {
              if (selectedDate) onDateChange(event, selectedDate);
            }}
            style={styles.iosDatePicker}
            textColor={isInward ? '#F48221' : '#4682B4'} // Set text color based on mode
          />
          <TouchableOpacity
            style={[
              styles.iosDatePickerConfirmBtn,
              {backgroundColor: isInward ? '#F48221' : '#4682B4'},
            ]}
            onPress={onConfirm}>
            <Text style={styles.iosDatePickerConfirmText}>Confirm Date</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  iosDatePickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  iosDatePickerContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  iosDatePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  iosDatePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  iosDatePickerDoneBtn: {
    fontSize: 16,
    fontWeight: '600',
  },
  iosDatePicker: {
    height: 200,
    marginBottom: 20,
  },
  iosDatePickerConfirmBtn: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  iosDatePickerConfirmText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  inwardDatePicker: {
    borderColor: '#F48221',
    borderWidth: 1,
  },
  outwardDatePicker: {
    borderColor: '#4682B4',
    borderWidth: 1,
  },
});

export default IOSDatePickerModal;
