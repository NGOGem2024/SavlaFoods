import React from 'react';
import {View, Text, Modal, TouchableOpacity, StyleSheet} from 'react-native';
import {Picker} from '@react-native-picker/picker';

interface RenderPickerProps {
  selectedValue: string;
  items: string[];
  onValueChange: (value: string) => void;
}

interface IOSPickerModalProps {
  isVisible: boolean;
  currentPicker: string;
  itemCategory: string;
  itemSubcategory: string;
  unit: string;
  apiCategories: string[];
  apiSubcategories: {[key: string]: string[]};
  units: string[];
  setItemCategory: (value: string) => void;
  setItemSubcategory: (value: string) => void;
  setUnit: (value: string) => void;
  onClose: () => void;
}

const IOSPickerModal = ({
  isVisible,
  currentPicker,
  itemCategory,
  itemSubcategory,
  unit,
  apiCategories,
  apiSubcategories,
  units,
  setItemCategory,
  setItemSubcategory,
  setUnit,
  onClose,
}: IOSPickerModalProps) => {
  const renderPicker = () => {
    switch (currentPicker) {
      case 'category':
        return (
          <Picker
            selectedValue={itemCategory}
            onValueChange={value => setItemCategory(value)}
            style={styles.iosPicker}
            itemStyle={styles.iosPickerItem}>
            <Picker.Item label="Select Category" value="" />
            {apiCategories.map((category, index) => (
              <Picker.Item key={index} label={category} value={category} />
            ))}
          </Picker>
        );
      case 'subcategory':
        return (
          <Picker
            selectedValue={itemSubcategory}
            onValueChange={value => setItemSubcategory(value)}
            style={styles.iosPicker}
            itemStyle={styles.iosPickerItem}>
            <Picker.Item label="Select Subcategory" value="" />
            {itemCategory &&
              apiSubcategories[itemCategory] &&
              apiSubcategories[itemCategory].map(
                (subcategory: string, index: number) => (
                  <Picker.Item
                    key={index}
                    label={subcategory}
                    value={subcategory}
                  />
                ),
              )}
          </Picker>
        );
      case 'unit':
        return (
          <Picker
            selectedValue={unit}
            onValueChange={value => setUnit(value)}
            style={styles.iosPicker}
            itemStyle={styles.iosPickerItem}>
            <Picker.Item label="Select Unit" value="" />
            {units.map((unit, index) => (
              <Picker.Item key={index} label={unit} value={unit} />
            ))}
          </Picker>
        );
      default:
        return null;
    }
  };

  return (
    <Modal visible={isVisible} transparent={true} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.pickerModalContent}>
          <View style={styles.pickerHeader}>
            <TouchableOpacity onPress={onClose} style={styles.doneButton}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
          {renderPicker()}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  doneButton: {
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
  },
  iosPicker: {
    width: '100%',
    height: 215,
  },
  iosPickerItem: {
    fontSize: 18,
  },
});

export default IOSPickerModal;
