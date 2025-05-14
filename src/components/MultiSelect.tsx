import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface MultiSelectOption {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selectedValues: string[];
  onSelectChange: (values: string[]) => void;
  placeholder: string;
  disabled?: boolean;
  primaryColor?: string;
}

const MultiSelect = ({
  options,
  selectedValues,
  onSelectChange,
  placeholder,
  disabled = false,
  primaryColor = '#F48221',
}: MultiSelectProps) => {
  const [isVisible, setIsVisible] = useState(false);

  // Get display text for selected items
  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) {
      return options.find(option => option.value === selectedValues[0])?.label || '';
    }
    return `${selectedValues.length} items selected`;
  };

  // Toggle selection of an item
  const toggleItem = (value: string) => {
    if (selectedValues.includes(value)) {
      onSelectChange(selectedValues.filter(v => v !== value));
    } else {
      onSelectChange([...selectedValues, value]);
    }
  };

  return (
    <View style={[styles.container, disabled && styles.disabled]}>
      <TouchableOpacity
        style={styles.inputContainer}
        onPress={() => !disabled && setIsVisible(true)}
        disabled={disabled}>
        <Text
          style={[
            selectedValues.length > 0 ? styles.selectedText : styles.placeholderText,
            {color: selectedValues.length > 0 ? '#333333' : '#94A3B8'},
          ]}
          numberOfLines={1}
          ellipsizeMode="tail">
          {getDisplayText()}
        </Text>
        <MaterialIcons name="arrow-drop-down" size={24} color="#555" />
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsVisible(false)}>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Items</Text>
              <TouchableOpacity onPress={() => setIsVisible(false)}>
                <Text style={[styles.doneButton, {color: primaryColor}]}>Done</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => toggleItem(item.value)}>
                  <Text style={styles.optionText}>{item.label}</Text>
                  <MaterialIcons
                    name={selectedValues.includes(item.value) ? 'check-box' : 'check-box-outline-blank'}
                    size={24}
                    color={selectedValues.includes(item.value) ? primaryColor : '#CBD5E0'}
                  />
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.optionsList}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  disabled: {
    opacity: 0.7,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  selectedText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  placeholderText: {
    fontSize: 14,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: 60,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: -3},
        shadowOpacity: 0.1,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A202C',
  },
  doneButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionsList: {
    paddingBottom: 20,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F7FAFC',
  },
  optionText: {
    fontSize: 16,
    color: '#2D3748',
  },
});

export default MultiSelect; 