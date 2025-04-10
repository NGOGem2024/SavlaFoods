// import React from 'react';
// import {View, Text, StyleSheet, ScrollView} from 'react-native';

// const StockReportScreen = () => {
//   return (
//     <ScrollView style={styles.container}>
//       <Text style={styles.title}>Stock Report</Text>
//       <View style={styles.reportSection}>
//         <Text>Current Stock Details</Text>
//         {/* Add your stock data rendering logic here */}
//         <Text>Total Items: 0</Text>
//         <Text>Available Stock: 0</Text>
//         <Text>Low Stock Items: 0</Text>
//       </View>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 16,
//     backgroundColor: '#fff',
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     marginBottom: 16,
//     color: '#F48221',
//   },
//   reportSection: {
//     backgroundColor: '#f9f9f9',
//     padding: 16,
//     borderRadius: 8,
//     marginBottom: 16,
//   },
// });

// export default StockReportScreen;


// Vaishnavi

import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

interface DropdownOption {
  label: string;
  value: string;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  placeholder: string;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  selectedValue,
  onSelect,
  placeholder,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const selectedOption = options.find(option => option.value === selectedValue);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  return (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setIsVisible(true)}>
        <Text
          style={
            selectedOption
              ? styles.dropdownSelectedText
              : styles.dropdownPlaceholderText
          }>
          {displayText}
        </Text>
        <Text style={styles.dropdownIcon}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsVisible(false)}>
          <View style={styles.modalContent}>
            <FlatList
              data={options}
              keyExtractor={item => item.value}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    selectedValue === item.value && styles.selectedOption,
                  ]}
                  onPress={() => {
                    onSelect(item.value);
                    setIsVisible(false);
                  }}>
                  <Text
                    style={[
                      styles.optionText,
                      selectedValue === item.value && styles.selectedOptionText,
                    ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

interface RadioOption {
  label: string;
  value: string;
}

interface RadioGroupProps {
  options: RadioOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

const RadioGroup: React.FC<RadioGroupProps> = ({
  options,
  selectedValue,
  onSelect,
}) => {
  return (
    <View style={styles.radioContainer}>
      {options.map(option => (
        <TouchableOpacity
          key={option.value}
          style={styles.radioOption}
          onPress={() => onSelect(option.value)}>
          <View style={styles.radioCircle}>
            {selectedValue === option.value && (
              <View style={styles.selectedRadio} />
            )}
          </View>
          <Text style={styles.radioLabel}>{option.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const DateInput: React.FC<{
  value: string;
  onChangeText: (text: string) => void;
}> = ({value, onChangeText}) => {
  return (
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder="DD/MM/YYYY"
      keyboardType="numeric"
    />
  );
};

const StockReportScreen: React.FC = () => {
  const [customerName, setCustomerName] = useState('');
  const [lotNo, setLotNo] = useState('');
  const [vakalNo, setVakalNo] = useState('');
  const [itemSubCategory, setItemSubCategory] = useState('');
  const [itemMarks, setItemMarks] = useState('');
  const [unit, setUnit] = useState('');
  const [toDate, setToDate] = useState('09/04/2025');
  const [qtyLessThan, setQtyLessThan] = useState('');
  const [reportType, setReportType] = useState('details');

  const customerOptions: DropdownOption[] = [
    {label: '--SELECT--', value: ''},
    {label: 'Customer 1', value: 'customer1'},
    {label: 'Customer 2', value: 'customer2'},
    {label: 'Customer 3', value: 'customer3'},
  ];

  const itemSubCategoryOptions: DropdownOption[] = [
    {label: '--SELECT--', value: ''},
    {label: 'Category 1', value: 'category1'},
    {label: 'Category 2', value: 'category2'},
    {label: 'Category 3', value: 'category3'},
  ];

  const unitOptions: DropdownOption[] = [
    {label: '--SELECT--', value: ''},
    {label: 'D-39', value: 'D-39'},
    {label: 'D-514', value: 'D-514'},
  ];

  const reportTypeOptions: RadioOption[] = [
    {label: 'Details (Lot wise)', value: 'details'},
    {label: 'Summary (Item wise)', value: 'summary'},
    {label: 'FullSummary(Category wise)', value: 'fullSummary'},
  ];

  const handleSearch = () => {
    console.log('Search with parameters:', {
      customerName,
      lotNo,
      vakalNo,
      itemSubCategory,
      itemMarks,
      unit,
      toDate,
      qtyLessThan,
      reportType,
    });
  };

  const handleClear = () => {
    setCustomerName('');
    setLotNo('');
    setVakalNo('');
    setItemSubCategory('');
    setItemMarks('');
    setUnit('');
    setToDate('09/04/2025');
    setQtyLessThan('');
    setReportType('details');
  };

  const handleDownload = () => {
    console.log('Download as Excel');
  };

  return (
    // <SafeAreaView style={styles.safeArea}>
    <ScrollView style={styles.container}>
      {/* <Text style={styles.title}>Stock Report</Text> */}

      <View style={styles.formRow}>
        <View style={styles.formColumn}>
          <Text style={styles.label}>Customer Name</Text>
          <CustomDropdown
            options={customerOptions}
            selectedValue={customerName}
            onSelect={setCustomerName}
            placeholder="--SELECT--"
          />
        </View>

        <View style={styles.formColumn}>
          <Text style={styles.label}>Lot No</Text>
          <TextInput
            style={styles.input}
            value={lotNo}
            onChangeText={setLotNo}
            placeholder=""
          />
        </View>
      </View>

      <View style={styles.formRow}>
        <View style={styles.formColumn}>
          <Text style={styles.label}>Vakal No</Text>
          <TextInput
            style={styles.input}
            value={vakalNo}
            onChangeText={setVakalNo}
            placeholder=""
          />
        </View>

        <View style={styles.formColumn}>
          <Text style={styles.label}>Item Sub Category</Text>
          <CustomDropdown
            options={itemSubCategoryOptions}
            selectedValue={itemSubCategory}
            onSelect={setItemSubCategory}
            placeholder="--SELECT--"
          />
        </View>
      </View>

      <View style={styles.formRow}>
        <View style={styles.formColumn}>
          <Text style={styles.label}>Item Marks</Text>
          <TextInput
            style={styles.input}
            value={itemMarks}
            onChangeText={setItemMarks}
            placeholder=""
          />
        </View>

        <View style={styles.formColumn}>
          <Text style={styles.label}>Unit</Text>
          <CustomDropdown
            options={unitOptions}
            selectedValue={unit}
            onSelect={setUnit}
            placeholder="--SELECT--"
          />
        </View>
      </View>

      <View style={styles.formRow}>
        <View style={styles.formColumn}>
          <Text style={styles.label}>To Date</Text>
          <DateInput value={toDate} onChangeText={setToDate} />
        </View>

        <View style={styles.formColumn}>
          <Text style={styles.label}>Qty Less Than</Text>
          <TextInput
            style={styles.input}
            value={qtyLessThan}
            onChangeText={setQtyLessThan}
            keyboardType="numeric"
            placeholder=""
          />
        </View>
      </View>

      <View style={styles.typeSection}>
        <Text style={styles.label}>Type</Text>
        <RadioGroup
          options={reportTypeOptions}
          selectedValue={reportType}
          onSelect={setReportType}
        />
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.buttonText}>Search</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <Text style={styles.buttonText}>Clear</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.downloadButton}
          onPress={handleDownload}>
          <Text style={styles.buttonText}>Download As Excel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    // </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // safeArea: {
  //   flex: 1,
  //   backgroundColor: '#fff',
  // },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#E87830',
    textAlign: 'center',
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  formColumn: {
    flex: 1,
    marginHorizontal: 5,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
    color: '#333',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  typeSection: {
    marginVertical: 16,
  },
  radioContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    marginBottom: 12,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E87830',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadio: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E87830',
  },
  radioLabel: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 40,
  },
  searchButton: {
    backgroundColor: '#E87830',
    padding: 14,
    borderRadius: 4,
    marginRight: 7,
    minWidth: 100,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#E87830',
    padding: 14,
    borderRadius: 4,
    marginRight: 7,
    minWidth: 100,
    alignItems: 'center',
  },
  downloadButton: {
    backgroundColor: '#E87830',
    padding: 14,
    borderRadius: 4,
    minWidth: 180,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Dropdown styles
  dropdownContainer: {
    position: 'relative',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 50,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  dropdownSelectedText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownPlaceholderText: {
    fontSize: 16,
    color: '#999',
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    maxHeight: '60%',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  optionItem: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedOption: {
    backgroundColor: '#f4f4f4',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedOptionText: {
    color: '#E87830',
    fontWeight: '500',
  },
});

export default StockReportScreen;