// import React, {useState} from 'react';
// import {
//   StyleSheet,
//   View,
//   Text,
//   TouchableOpacity,
//   ScrollView,
//   TextInput,
//   Switch,
//   Platform,
//   Alert,
// } from 'react-native';
// import DateTimePicker from '@react-native-community/datetimepicker';
// import {Picker} from '@react-native-picker/picker';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// // import DocumentPicker from 'react-native-document-picker';

// const InwardOutwardReportScreen = () => {
//   const [isInward, setIsInward] = useState(true);
//   const [fromDate, setFromDate] = useState(new Date());
//   const [toDate, setToDate] = useState(new Date());
//   const [showFromDatePicker, setShowFromDatePicker] = useState(false);
//   const [showToDatePicker, setShowToDatePicker] = useState(false);
//   const [itemCategory, setItemCategory] = useState('');
//   const [itemSubcategory, setItemSubcategory] = useState('');
//   const [unit, setUnit] = useState('');

//   // Sample data for dropdown menus
//   const categories = ['Raw Materials', 'Finished Goods', 'Packaging', 'Other'];
//   const subcategories = {
//     'Raw Materials': ['Metal', 'Plastic', 'Wood', 'Fabric'],
//     'Finished Goods': ['Electronics', 'Furniture', 'Clothing', 'Accessories'],
//     Packaging: ['Boxes', 'Bags', 'Tapes', 'Labels'],
//     Other: ['Office Supplies', 'Tools', 'Miscellaneous'],
//   };
//   const units = ['Pcs', 'Kg', 'Ltr', 'Box', 'Set'];

//   // Date picker handlers
//   const onFromDateChange = (event: any, selectedDate?: Date) => {
//     const currentDate = selectedDate || fromDate;
//     setShowFromDatePicker(Platform.OS === 'ios');
//     setFromDate(currentDate);
//   };

//   const onToDateChange = (event: any, selectedDate?: Date) => {
//     const currentDate = selectedDate || toDate;
//     setShowToDatePicker(Platform.OS === 'ios');
//     setToDate(currentDate);
//   };

//   // Format date for display
//   const formatDate = (date: Date) => {
//     return `${date.getDate().toString().padStart(2, '0')}/${(
//       date.getMonth() + 1
//     )
//       .toString()
//       .padStart(2, '0')}/${date.getFullYear()}`;
//   };

//   // Handle search button
//   const handleSearch = () => {
//     // Validate inputs
//     if (!itemCategory) {
//       Alert.alert('Error', 'Please select an item category');
//       return;
//     }

//     console.log('Generating report with:', {
//       type: isInward ? 'Inward' : 'Outward',
//       fromDate,
//       toDate,
//       itemCategory,
//       itemSubcategory,
//       unit,
//     });

//     // Implement API call to get report data
//     Alert.alert('Success', 'Report generated successfully!');
//   };

//   // Handle clear button
//   const handleClear = () => {
//     setFromDate(new Date());
//     setToDate(new Date());
//     setItemCategory('');
//     setItemSubcategory('');
//     setUnit('');
//   };

//   // Handle download as Excel
//   const handleDownload = async () => {
//     try {
//       // Validate inputs first
//       if (!itemCategory) {
//         Alert.alert('Error', 'Please select an item category');
//         return;
//       }

//       // Implement API call to generate and download Excel
//       Alert.alert('Success', 'Report downloaded as Excel successfully!');
//     } catch (err) {
//       console.error('Error downloading excel:', err);
//       Alert.alert('Error', 'Failed to download report');
//     }
//   };

//   return (
//     <ScrollView style={styles.container}>
//       {/* Toggle Button */}
//       <View style={styles.toggleContainer}>
//         <Text
//           style={[styles.toggleText, !isInward && styles.toggleTextInactive]}>
//           Inward
//         </Text>
//         <Switch
//           trackColor={{false: '#F48221', true: '#4682B4'}}
//           thumbColor="#FFFFFF"
//           ios_backgroundColor="#F48221"
//           onValueChange={() => setIsInward(!isInward)}
//           value={!isInward}
//           style={styles.toggle}
//         />
//         <Text
//           style={[styles.toggleText, isInward && styles.toggleTextInactive]}>
//           Outward
//         </Text>
//       </View>

//       <View
//         style={[
//           styles.formContainer,
//           isInward ? styles.inwardForm : styles.outwardForm,
//         ]}>
//         <Text style={styles.formTitle}>
//           {isInward ? 'Inward Report' : 'Outward Report'}
//         </Text>

//         {/* Date Fields with Calendar Pickers */}
//         <View style={styles.formGroup}>
//           <Text style={styles.label}>From Date</Text>
//           <TouchableOpacity
//             style={styles.dateInput}
//             onPress={() => setShowFromDatePicker(true)}>
//             <Text style={styles.dateText}>{formatDate(fromDate)}</Text>
//             <MaterialIcons
//               name="calendar-today"
//               size={20}
//               style={{color: '#555'}}
//             />
//           </TouchableOpacity>
//           {showFromDatePicker && (
//             <DateTimePicker
//               testID="fromDatePicker"
//               value={fromDate}
//               mode="date"
//               display="default"
//               onChange={onFromDateChange}
//             />
//           )}
//         </View>

//         <View style={styles.formGroup}>
//           <Text style={styles.label}>To Date</Text>
//           <TouchableOpacity
//             style={styles.dateInput}
//             onPress={() => setShowToDatePicker(true)}>
//             <Text style={styles.dateText}>{formatDate(toDate)}</Text>
//             <MaterialIcons
//               name="calendar-today"
//               size={20}
//               style={{color: '#555'}}
//             />
//           </TouchableOpacity>
//           {showToDatePicker && (
//             <DateTimePicker
//               testID="toDatePicker"
//               value={toDate}
//               mode="date"
//               display="default"
//               onChange={onToDateChange}
//             />
//           )}
//         </View>

//         {/* Dropdown Fields */}
//         <View style={styles.formGroup}>
//           <Text style={styles.label}>Item Category</Text>
//           <View style={styles.pickerContainer}>
//             <Picker
//               selectedValue={itemCategory}
//               onValueChange={itemValue => {
//                 setItemCategory(itemValue);
//                 setItemSubcategory(''); // Reset subcategory when category changes
//               }}
//               style={styles.picker}>
//               <Picker.Item label="Select Category" value="" />
//               {categories.map((category, index) => (
//                 <Picker.Item key={index} label={category} value={category} />
//               ))}
//             </Picker>
//           </View>
//         </View>

//         <View style={styles.formGroup}>
//           <Text style={styles.label}>Item Subcategory</Text>
//           <View style={styles.pickerContainer}>
//             <Picker
//               selectedValue={itemSubcategory}
//               onValueChange={itemValue => setItemSubcategory(itemValue)}
//               enabled={!!itemCategory}
//               style={styles.picker}>
//               <Picker.Item label="Select Subcategory" value="" />
//               {itemCategory &&
//                 subcategories[itemCategory as keyof typeof subcategories].map(
//                   (subcategory, index) => (
//                     <Picker.Item
//                       key={index}
//                       label={subcategory}
//                       value={subcategory}
//                     />
//                   ),
//                 )}
//             </Picker>
//           </View>
//         </View>

//         <View style={styles.formGroup}>
//           <Text style={styles.label}>Unit</Text>
//           <View style={styles.pickerContainer}>
//             <Picker
//               selectedValue={unit}
//               onValueChange={itemValue => setUnit(itemValue)}
//               style={styles.picker}>
//               <Picker.Item label="Select Unit" value="" />
//               {units.map((unit, index) => (
//                 <Picker.Item key={index} label={unit} value={unit} />
//               ))}
//             </Picker>
//           </View>
//         </View>

//         {/* Action Buttons */}
//         <View style={styles.buttonGroup}>
//           <TouchableOpacity
//             style={[styles.button, styles.searchButton]}
//             onPress={handleSearch}>
//             <MaterialIcons name="search" size={20} style={{color: '#FFFFFF'}} />
//             <Text style={styles.buttonText}>Search</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={[styles.button, styles.clearButton]}
//             onPress={handleClear}>
//             <MaterialIcons name="clear" size={20} style={{color: '#FFFFFF'}} />
//             <Text style={styles.buttonText}>Clear</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={[styles.button, styles.downloadButton]}
//             onPress={handleDownload}>
//             <MaterialIcons
//               name="download"
//               size={20}
//               style={{color: '#FFFFFF'}}
//             />
//             <Text style={styles.buttonText}>Excel</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8f8f8',
//   },
//   toggleContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginVertical: 20,
//     marginHorizontal: 20,
//   },
//   toggle: {
//     marginHorizontal: 10,
//   },
//   toggleText: {
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   toggleTextInactive: {
//     opacity: 0.5,
//   },
//   formContainer: {
//     margin: 16,
//     padding: 16,
//     borderRadius: 10,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.23,
//     shadowRadius: 2.62,
//     elevation: 4,
//   },
//   inwardForm: {
//     backgroundColor: '#FFF3E5', // Light orange
//     borderColor: '#F48221',
//     borderWidth: 1,
//   },
//   outwardForm: {
//     backgroundColor: '#E5F0FF', // Light blue
//     borderColor: '#4682B4',
//     borderWidth: 1,
//   },
//   formTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 16,
//     textAlign: 'center',
//     color: '#333',
//   },
//   formGroup: {
//     marginBottom: 16,
//   },
//   label: {
//     fontSize: 14,
//     fontWeight: '600',
//     marginBottom: 8,
//     color: '#555',
//   },
//   dateInput: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     height: 48,
//     paddingHorizontal: 12,
//     backgroundColor: '#FFFFFF',
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: '#DDD',
//   },
//   dateText: {
//     fontSize: 14,
//     color: '#333',
//   },
//   pickerContainer: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: '#DDD',
//     overflow: 'hidden',
//   },
//   picker: {
//     height: 48,
//   },
//   buttonGroup: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginTop: 24,
//   },
//   button: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     borderRadius: 8,
//     flex: 1,
//     marginHorizontal: 4,
//   },
//   searchButton: {
//     backgroundColor: '#F48221',
//   },
//   clearButton: {
//     backgroundColor: '#888888',
//   },
//   downloadButton: {
//     backgroundColor: '#F48221',
//   },
//   buttonText: {
//     color: '#FFFFFF',
//     fontWeight: 'bold',
//     marginLeft: 4,
//   },
// });

// export default InwardOutwardReportScreen;

import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Modal,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {Picker} from '@react-native-picker/picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const InwardOutwardReportScreen = () => {
  // State variables
  const [isInward, setIsInward] = useState(true);
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);
  const [itemCategory, setItemCategory] = useState('');
  const [itemSubcategory, setItemSubcategory] = useState('');
  const [unit, setUnit] = useState('');

  // Modal visibility state for iOS pickers
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [currentPicker, setCurrentPicker] = useState('');

  // Sample data for dropdown menus
  const categories = ['Raw Materials', 'Finished Goods', 'Packaging', 'Other'];
  const subcategories = {
    'Raw Materials': ['Metal', 'Plastic', 'Wood', 'Fabric'],
    'Finished Goods': ['Electronics', 'Furniture', 'Clothing', 'Accessories'],
    Packaging: ['Boxes', 'Bags', 'Tapes', 'Labels'],
    Other: ['Office Supplies', 'Tools', 'Miscellaneous'],
  };
  const units = ['Pcs', 'Kg', 'Ltr', 'Box', 'Set'];

  // Reset subcategory when category changes
  useEffect(() => {
    if (itemCategory) {
      setItemSubcategory('');
    }
  }, [itemCategory]);

  // Date picker handlers with platform-specific implementation
  const showDatePicker = (pickerType: 'from' | 'to') => {
    if (pickerType === 'from') {
      setShowFromDatePicker(true);
    } else {
      setShowToDatePicker(true);
    }
  };

  const onFromDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || fromDate;
    setShowFromDatePicker(Platform.OS === 'ios');
    setFromDate(currentDate);
  };

  const onToDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || toDate;
    setShowToDatePicker(Platform.OS === 'ios');
    setToDate(currentDate);
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return `${date.getDate().toString().padStart(2, '0')}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, '0')}/${date.getFullYear()}`;
  };

  // Helper function to show picker modal (for iOS)
  const openPicker = (pickerName: string) => {
    setCurrentPicker(pickerName);
    setIsPickerVisible(true);
  };

  // Validate inputs before actions
  const validateInputs = () => {
    if (!itemCategory) {
      Alert.alert('Error', 'Please select an item category');
      return false;
    }
    return true;
  };

  // Handle search button
  const handleSearch = () => {
    if (!validateInputs()) return;

    console.log('Generating report with:', {
      type: isInward ? 'Inward' : 'Outward',
      fromDate,
      toDate,
      itemCategory,
      itemSubcategory,
      unit,
    });

    // Implement API call to get report data
    Alert.alert('Success', 'Report generated successfully!');
  };

  // Handle clear button
  const handleClear = () => {
    setFromDate(new Date());
    setToDate(new Date());
    setItemCategory('');
    setItemSubcategory('');
    setUnit('');
  };

  // Handle download as Excel
  const handleDownload = async () => {
    try {
      if (!validateInputs()) return;

      // Implement API call to generate and download Excel
      Alert.alert('Success', 'Report downloaded as Excel successfully!');
    } catch (err) {
      console.error('Error downloading excel:', err);
      Alert.alert('Error', 'Failed to download report');
    }
  };

  // Render appropriate picker components for iOS
  const renderIOSPicker = () => {
    switch (currentPicker) {
      case 'category':
        return (
          <Picker
            selectedValue={itemCategory}
            onValueChange={value => setItemCategory(value)}
            style={styles.iosPicker}>
            <Picker.Item label="Select Category" value="" />
            {categories.map((category, index) => (
              <Picker.Item key={index} label={category} value={category} />
            ))}
          </Picker>
        );
      case 'subcategory':
        return (
          <Picker
            selectedValue={itemSubcategory}
            onValueChange={value => setItemSubcategory(value)}
            style={styles.iosPicker}>
            <Picker.Item label="Select Subcategory" value="" />
            {itemCategory &&
              subcategories[itemCategory as keyof typeof subcategories].map(
                (subcategory, index) => (
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
            style={styles.iosPicker}>
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

  // Render picker based on platform
  const renderPicker = (
    pickerType: string,
    value: string,
    label: string,
    items: string[],
    onValueChange: (value: string) => void,
    enabled: boolean = true,
  ) => {
    if (Platform.OS === 'ios') {
      return (
        <TouchableOpacity
          style={[styles.pickerContainer, !enabled && styles.disabledPicker]}
          onPress={() => {
            if (enabled) openPicker(pickerType);
          }}
          disabled={!enabled}>
          <Text style={value ? styles.pickerText : styles.pickerPlaceholder}>
            {value || `Select ${label}`}
          </Text>
          <MaterialIcons name="arrow-drop-down" size={24} color="#555" />
        </TouchableOpacity>
      );
    } else {
      return (
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={value}
            onValueChange={onValueChange}
            enabled={enabled}
            style={styles.picker}>
            <Picker.Item label={`Select ${label}`} value="" />
            {items.map((item, index) => (
              <Picker.Item key={index} label={item} value={item} />
            ))}
          </Picker>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        backgroundColor={isInward ? '#F48221' : '#4682B4'}
        barStyle="light-content"
      />
      <ScrollView style={styles.container}>
        {/* Toggle Button */}
        <View style={styles.toggleContainer}>
          <Text
            style={[styles.toggleText, !isInward && styles.toggleTextInactive]}>
            Inward
          </Text>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              {backgroundColor: isInward ? '#F48221' : '#4682B4'},
            ]}
            onPress={() => setIsInward(!isInward)}>
            <View
              style={[
                styles.toggleCircle,
                {
                  left: isInward ? 4 : 36,
                  backgroundColor: '#FFFFFF',
                },
              ]}
            />
          </TouchableOpacity>
          <Text
            style={[styles.toggleText, isInward && styles.toggleTextInactive]}>
            Outward
          </Text>
        </View>

        <View
          style={[
            styles.formContainer,
            isInward ? styles.inwardForm : styles.outwardForm,
          ]}>
          <Text
            style={[
              styles.formTitle,
              {color: isInward ? '#F48221' : '#4682B4'},
            ]}>
            {isInward ? 'Inward Report' : 'Outward Report'}
          </Text>

          {/* Date Fields with Calendar Pickers */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>From Date</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => showDatePicker('from')}>
              <Text style={styles.dateText}>{formatDate(fromDate)}</Text>
              <MaterialIcons
                name="calendar-today"
                size={20}
                style={{color: '#555'}}
              />
            </TouchableOpacity>
            {showFromDatePicker && (
              <DateTimePicker
                testID="fromDatePicker"
                value={fromDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onFromDateChange}
              />
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>To Date</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => showDatePicker('to')}>
              <Text style={styles.dateText}>{formatDate(toDate)}</Text>
              <MaterialIcons
                name="calendar-today"
                size={20}
                style={{color: '#555'}}
              />
            </TouchableOpacity>
            {showToDatePicker && (
              <DateTimePicker
                testID="toDatePicker"
                value={toDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onToDateChange}
              />
            )}
          </View>

          {/* Dropdown Fields */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Item Category</Text>
            {renderPicker(
              'category',
              itemCategory,
              'Category',
              categories,
              value => setItemCategory(value),
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Item Subcategory</Text>
            {renderPicker(
              'subcategory',
              itemSubcategory,
              'Subcategory',
              itemCategory
                ? subcategories[itemCategory as keyof typeof subcategories]
                : [],
              value => setItemSubcategory(value),
              !!itemCategory,
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Unit</Text>
            {renderPicker('unit', unit, 'Unit', units, value => setUnit(value))}
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[
                styles.button,
                {backgroundColor: isInward ? '#F48221' : '#4682B4'},
              ]}
              onPress={handleSearch}>
              <MaterialIcons
                name="search"
                size={20}
                style={{color: '#FFFFFF'}}
              />
              <Text style={styles.buttonText}>Search</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={handleClear}>
              <MaterialIcons
                name="clear"
                size={20}
                style={{color: '#FFFFFF'}}
              />
              <Text style={styles.buttonText}>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                {backgroundColor: isInward ? '#F48221' : '#4682B4'},
              ]}
              onPress={handleDownload}>
              <MaterialIcons
                name="download"
                size={20}
                style={{color: '#FFFFFF'}}
              />
              <Text style={styles.buttonText}>Excel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* iOS Picker Modal */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={isPickerVisible}
          transparent={true}
          animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.pickerModalContent}>
              <View style={styles.pickerHeader}>
                <TouchableOpacity
                  onPress={() => setIsPickerVisible(false)}
                  style={styles.doneButton}>
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
              {renderIOSPicker()}
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
    marginHorizontal: 20,
  },
  toggleButton: {
    width: 70,
    height: 30,
    borderRadius: 15,
    marginHorizontal: 10,
    justifyContent: 'center',
  },
  toggleCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    position: 'absolute',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleTextInactive: {
    opacity: 0.5,
  },
  formContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  inwardForm: {
    backgroundColor: '#FFF3E5', // Light orange
    borderColor: '#F48221',
    borderWidth: 1,
  },
  outwardForm: {
    backgroundColor: '#E5F0FF', // Light blue
    borderColor: '#4682B4',
    borderWidth: 1,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#555',
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  dateText: {
    fontSize: 14,
    color: '#333',
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    height: 48,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  disabledPicker: {
    backgroundColor: '#F5F5F5',
    opacity: 0.7,
  },
  picker: {
    height: 48,
    width: '100%',
  },
  pickerText: {
    fontSize: 14,
    color: '#333',
  },
  pickerPlaceholder: {
    fontSize: 14,
    color: '#999',
  },
  iosPicker: {
    width: '100%',
    height: 200,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  clearButton: {
    backgroundColor: '#888888',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  // iOS Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  pickerModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingBottom: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  doneButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  doneButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default InwardOutwardReportScreen;
