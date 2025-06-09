// import React, {useState} from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   Modal,
//   FlatList,
//   StyleSheet,
//   SafeAreaView,
//   Platform,
//   Keyboard,
// } from 'react-native';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// interface MultiSelectOption {
//   label: string;
//   value: string;
// }

// interface MultiSelectProps {
//   options: MultiSelectOption[];
//   selectedValues: string[];
//   onSelectChange: (values: string[]) => void;
//   placeholder: string;
//   disabled?: boolean;
//   primaryColor?: string;
//   showSelectAll?: boolean;
// }

// const MultiSelect = ({
//   options,
//   selectedValues,
//   onSelectChange,
//   placeholder,
//   disabled = false,
//   primaryColor = '#F48221',
//   showSelectAll = true,
// }: MultiSelectProps) => {
//   const [isVisible, setIsVisible] = useState(false);

//   // Get display text for selected items
//   const getDisplayText = () => {
//     if (selectedValues.length === 0) return placeholder;
//     if (selectedValues.length === 1) {
//       return (
//         options.find(option => option.value === selectedValues[0])?.label || ''
//       );
//     }
//     return `${selectedValues.length} items selected`;
//   };

//   // Handle press with keyboard dismiss
//   const handlePress = () => {
//     if (!disabled) {
//       Keyboard.dismiss();
//       setIsVisible(true);
//     }
//   };

//   // Toggle selection of an item
//   const toggleItem = (value: string) => {
//     if (selectedValues.includes(value)) {
//       onSelectChange(selectedValues.filter(v => v !== value));
//     } else {
//       onSelectChange([...selectedValues, value]);
//     }
//   };

//   // Handle Select All functionality
//   const handleSelectAll = () => {
//     const allValues = options.map(option => option.value);
//     const allSelected = selectedValues.length === options.length;
    
//     if (allSelected) {
//       // If all are selected, deselect all
//       onSelectChange([]);
//     } else {
//       // If not all are selected, select all
//       onSelectChange(allValues);
//     }
//   };

//   // Check if all items are selected
//   const isAllSelected = selectedValues.length === options.length && options.length > 0;

//   // Prepare data for FlatList (Select All + options)
//   const listData = showSelectAll && options.length > 0 
//     ? [{ label: 'Select All', value: '__SELECT_ALL__', isSelectAll: true }, ...options]
//     : options;

//   const renderItem = ({item}: {item: any}) => {
//     if (item.isSelectAll) {
//       return (
//         <View style={styles.selectAllContainer}>
//           <TouchableOpacity
//             style={[styles.optionItem, styles.selectAllItem]}
//             onPress={handleSelectAll}>
//             <Text style={[styles.optionText, styles.selectAllText]}>
//               {item.label}
//             </Text>
//             <MaterialIcons
//               name={isAllSelected ? 'check-box' : 'check-box-outline-blank'}
//               size={24}
//               color={isAllSelected ? primaryColor : '#CBD5E0'}
//             />
//           </TouchableOpacity>
//           <View style={styles.separator} />
//         </View>
//       );
//     }

//     return (
//       <TouchableOpacity
//         style={styles.optionItem}
//         onPress={() => toggleItem(item.value)}>
//         <Text style={styles.optionText}>{item.label}</Text>
//         <MaterialIcons
//           name={
//             selectedValues.includes(item.value)
//               ? 'check-box'
//               : 'check-box-outline-blank'
//           }
//           size={24}
//           color={
//             selectedValues.includes(item.value) ? primaryColor : '#CBD5E0'
//           }
//         />
//       </TouchableOpacity>
//     );
//   };

//   return (
//     <View style={[styles.container, disabled && styles.disabled]}>
//       <TouchableOpacity
//         style={styles.inputContainer}
//         onPress={handlePress}
//         disabled={disabled}>
//         <Text
//           style={[
//             selectedValues.length > 0
//               ? styles.selectedText
//               : styles.placeholderText,
//             {color: selectedValues.length > 0 ? '#333333' : '#94A3B8'},
//           ]}
//           numberOfLines={1}
//           ellipsizeMode="tail">
//           {getDisplayText()}
//         </Text>
//         <MaterialIcons name="arrow-drop-down" size={24} color="#555" />
//       </TouchableOpacity>

//       <Modal
//         visible={isVisible}
//         transparent={true}
//         animationType="slide"
//         onRequestClose={() => setIsVisible(false)}>
//         <View style={styles.modalOverlay}>
//           <SafeAreaView style={styles.modalContent}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>Select Items</Text>
//               <TouchableOpacity onPress={() => setIsVisible(false)}>
//                 <Text style={[styles.doneButton, {color: primaryColor}]}>
//                   Done
//                 </Text>
//               </TouchableOpacity>
//             </View>

//             <FlatList
//               data={listData}
//               keyExtractor={(item, index) => item.isSelectAll ? '__SELECT_ALL__' : item.value}
//               keyboardShouldPersistTaps="handled"
//               keyboardDismissMode="on-drag"
//               renderItem={renderItem}
//               contentContainerStyle={styles.optionsList}
//             />
//           </SafeAreaView>
//         </View>
//       </Modal>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     marginBottom: 8,
//   },
//   disabled: {
//     opacity: 0.7,
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     height: 44,
//     paddingHorizontal: 12,
//     borderWidth: 1,
//     borderColor: '#E2E8F0',
//     borderRadius: 8,
//     backgroundColor: '#FFFFFF',
//   },
//   selectedText: {
//     fontSize: 15,
//     fontWeight: '500',
//     flex: 1,
//   },
//   placeholderText: {
//     fontSize: 14,
//     flex: 1,
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//   },
//   modalContent: {
//     flex: 1,
//     backgroundColor: 'white',
//     marginTop: 60,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     ...Platform.select({
//       ios: {
//         shadowColor: '#000',
//         shadowOffset: {width: 0, height: -3},
//         shadowOpacity: 0.1,
//         shadowRadius: 5,
//       },
//       android: {
//         elevation: 5,
//       },
//     }),
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#E2E8F0',
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#1A202C',
//   },
//   doneButton: {
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   optionsList: {
//     paddingBottom: 20,
//   },
//   optionItem: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingVertical: 14,
//     paddingHorizontal: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#F7FAFC',
//   },
//   selectAllContainer: {
//     marginBottom: 8,
//   },
//   selectAllItem: {
//     backgroundColor: '#F8FAFC',
//     borderBottomWidth: 0, // Remove bottom border as we'll use separator
//     paddingVertical: 14, // Match the regular item padding
//     paddingHorizontal: 16, // Match the regular item padding
//     marginHorizontal: 0, // Remove margin to align properly
//     borderRadius: 0, // Remove border radius to match regular items
//   },
//   separator: {
//     height: 1,
//     backgroundColor: '#E2E8F0',
//     marginHorizontal: 16,
//     marginTop: 4,
//   },
//   optionText: {
//     fontSize: 16,
//     color: '#2D3748',
//   },
//   selectAllText: {
//     fontWeight: '600',
//     color: '#1A202C',
//     fontSize: 16, // Match the regular option text size
//   },
// });

// export default MultiSelect;


import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Platform,
  Keyboard,
  TextInput,
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
  showSelectAll?: boolean;
  searchPlaceholder?: string;
}

const MultiSelect = ({
  options,
  selectedValues,
  onSelectChange,
  placeholder,
  disabled = false,
  primaryColor = '#F48221',
  showSelectAll = true,
  searchPlaceholder = 'Search options...',
}: MultiSelectProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    return options.filter(option =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [options, searchQuery]);

  // Get display text for selected items
  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) {
      return (
        options.find(option => option.value === selectedValues[0])?.label || ''
      );
    }
    return `${selectedValues.length} items selected`;
  };

  // Handle press with keyboard dismiss
  const handlePress = () => {
    if (!disabled) {
      Keyboard.dismiss();
      setIsVisible(true);
    }
  };

  // Handle modal close
  const handleClose = () => {
    setIsVisible(false);
    setSearchQuery(''); // Clear search when closing
  };

  // Toggle selection of an item
  const toggleItem = (value: string) => {
    if (selectedValues.includes(value)) {
      onSelectChange(selectedValues.filter(v => v !== value));
    } else {
      onSelectChange([...selectedValues, value]);
    }
  };

  // Handle Select All functionality (based on filtered results)
  const handleSelectAll = () => {
    const filteredValues = filteredOptions.map(option => option.value);
    const filteredSelectedValues = selectedValues.filter(value =>
      filteredValues.includes(value),
    );
    const allFilteredSelected =
      filteredSelectedValues.length === filteredOptions.length;

    if (allFilteredSelected) {
      // If all filtered items are selected, deselect them
      const remainingValues = selectedValues.filter(
        value => !filteredValues.includes(value),
      );
      onSelectChange(remainingValues);
    } else {
      // If not all filtered items are selected, select all filtered items
      const newSelectedValues = [
        ...new Set([...selectedValues, ...filteredValues]),
      ];
      onSelectChange(newSelectedValues);
    }
  };

  // Check if all filtered items are selected
  const isAllFilteredSelected = useMemo(() => {
    if (filteredOptions.length === 0) return false;
    const filteredValues = filteredOptions.map(option => option.value);
    return filteredValues.every(value => selectedValues.includes(value));
  }, [filteredOptions, selectedValues]);

  // Prepare data for FlatList (Select All + filtered options)
  const listData = useMemo(() => {
    if (!showSelectAll || filteredOptions.length === 0) return filteredOptions;

    return [
      {
        label: searchQuery.trim() ? 'Select All Filtered' : 'Select All',
        value: '__SELECT_ALL__',
        isSelectAll: true,
      },
      ...filteredOptions,
    ];
  }, [showSelectAll, filteredOptions, searchQuery]);

  const renderItem = ({item}: {item: any}) => {
    if (item.isSelectAll) {
      return (
        <View style={styles.selectAllContainer}>
          <TouchableOpacity
            style={[styles.optionItem, styles.selectAllItem]}
            onPress={handleSelectAll}>
            <Text style={[styles.optionText, styles.selectAllText]}>
              {item.label}
            </Text>
            <MaterialIcons
              name={
                isAllFilteredSelected ? 'check-box' : 'check-box-outline-blank'
              }
              size={24}
              color={isAllFilteredSelected ? primaryColor : '#CBD5E0'}
            />
          </TouchableOpacity>
          <View style={styles.separator} />
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={styles.optionItem}
        onPress={() => toggleItem(item.value)}>
        <Text style={styles.optionText}>{item.label}</Text>
        <MaterialIcons
          name={
            selectedValues.includes(item.value)
              ? 'check-box'
              : 'check-box-outline-blank'
          }
          size={24}
          color={selectedValues.includes(item.value) ? primaryColor : '#CBD5E0'}
        />
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="search-off" size={48} color="#CBD5E0" />
      <Text style={styles.emptyText}>No options found</Text>
      <Text style={styles.emptySubtext}>Try adjusting your search terms</Text>
    </View>
  );

  return (
    <View style={[styles.container, disabled && styles.disabled]}>
      <TouchableOpacity
        style={styles.inputContainer}
        onPress={handlePress}
        disabled={disabled}>
        <Text
          style={[
            selectedValues.length > 0
              ? styles.selectedText
              : styles.placeholderText,
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
        onRequestClose={handleClose}>
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Items</Text>
              <TouchableOpacity onPress={handleClose}>
                <Text style={[styles.doneButton, {color: primaryColor}]}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <MaterialIcons
                  name="search"
                  size={20}
                  color="#94A3B8"
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder={searchPlaceholder}
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    style={styles.clearButton}>
                    <MaterialIcons name="clear" size={20} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Results Count */}
            {searchQuery.trim() && (
              <View style={styles.resultsContainer}>
                <Text style={styles.resultsText}>
                  {filteredOptions.length} of {options.length} options
                </Text>
              </View>
            )}

            <FlatList
              data={listData}
              keyExtractor={(item, index) =>
                item.isSelectAll ? '__SELECT_ALL__' : item.value
              }
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              renderItem={renderItem}
              contentContainerStyle={[
                styles.optionsList,
                listData.length === 0 && styles.emptyList,
              ]}
              ListEmptyComponent={searchQuery.trim() ? renderEmptyState : null}
              showsVerticalScrollIndicator={true}
              bounces={true}
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F7FAFC',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2D3748',
    paddingVertical: 0, // Remove default padding on Android
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  resultsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
  },
  resultsText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  optionsList: {
    paddingBottom: 20,
  },
  emptyList: {
    flexGrow: 1,
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
  selectAllContainer: {
    marginBottom: 8,
  },
  selectAllItem: {
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 0,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 0,
    borderRadius: 0,
  },
  separator: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
    marginTop: 4,
  },
  optionText: {
    fontSize: 16,
    color: '#2D3748',
  },
  selectAllText: {
    fontWeight: '600',
    color: '#1A202C',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A5568',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default MultiSelect;