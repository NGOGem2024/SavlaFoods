import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  Platform,
  TextInput,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_ENDPOINTS, getAuthHeaders} from '../../config/api.config';
import {useNavigation} from '@react-navigation/native';
import MultiSelect from '../../components/Multiselect';
import {LayoutWrapper} from '../../components/AppLayout';
import {RouteProp, useRoute} from '@react-navigation/core';
import {roundToNearestHours} from 'date-fns';

// Define dropdown option interface
interface DropdownOption {
  label: string;
  value: string;
}

// Define interface for zero stock item based on actual API response
interface ZeroStockItem {
  ITEM_ID: number;
  ITEM_CODE: string;
  DESCRIPTION: string;
  ITEM_NAME: string;
  LOT_NO: number;
  FK_UNIT_ID: number;
  ITEM_MARKS: string;
  VAKAL_NO: string | null;
  BATCH_NO: string | null;
  BALANCE_QTY: number;
  AVAILABLE_QTY: number;
  BOX_QUANTITY: number;
  EXPIRY_DATE: string | null;
  REMARKS: string | null;
  STATUS: string;
  ITEM_CATEG_NAME: string;
  SUB_CATEGORY_NAME: string;
}

// Pagination interface for tracking pagination state
interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

// Props interface for CustomDropdown component
interface CustomDropdownProps {
  options: DropdownOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}

// StockReportScreen style CustomDropdown for Unit field
interface StockReportDropdownProps {
  options: DropdownOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  placeholder: string;
}

const StockReportDropdown: React.FC<StockReportDropdownProps> = ({
  options,
  selectedValue,
  onSelect,
  placeholder,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const selectedOption = options.find(option => option.value === selectedValue);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  const route = useRoute();

  return (
    <View style={stockReportStyles.dropdownContainer}>
      <TouchableOpacity
        style={stockReportStyles.dropdownButton}
        onPress={() => setIsVisible(true)}>
        <Text
          style={
            selectedOption
              ? stockReportStyles.dropdownSelectedText
              : stockReportStyles.dropdownPlaceholderText
          }>
          {displayText}
        </Text>
        <MaterialIcons name="arrow-drop-down" size={24} color="#555" />
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}>
        <TouchableOpacity
          style={stockReportStyles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsVisible(false)}>
          <View style={stockReportStyles.modalContent}>
            <FlatList
              data={options}
              keyExtractor={item => item.value}
              style={{width: '100%'}}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[
                    stockReportStyles.optionItem,
                    selectedValue === item.value &&
                      stockReportStyles.selectedOption,
                  ]}
                  onPress={() => {
                    onSelect(item.value);
                    setIsVisible(false);
                  }}>
                  <Text
                    style={[
                      stockReportStyles.optionText,
                      selectedValue === item.value &&
                        stockReportStyles.selectedOptionText,
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

// Custom dropdown component for filters
const CustomDropdown = ({
  options,
  selectedValue,
  onSelect,
  placeholder,
  disabled = false,
}: CustomDropdownProps) => {
  const [isVisible, setIsVisible] = useState(false);

  const selectedOption = options.find(option => option.value === selectedValue);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  return (
    <View
      style={[styles.dropdownContainer, disabled && styles.disabledDropdown]}>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => !disabled && setIsVisible(true)}
        disabled={disabled}>
        <Text
          style={
            selectedOption
              ? styles.dropdownSelectedText
              : styles.dropdownPlaceholderText
          }
          numberOfLines={1}
          ellipsizeMode="tail">
          {displayText}
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
              <Text style={styles.modalTitle}>Select Option</Text>
              <TouchableOpacity onPress={() => setIsVisible(false)}>
                <Text style={styles.doneButton}>Done</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={item => item.value}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => {
                    onSelect(item.value);
                    setIsVisible(false);
                  }}>
                  <Text style={styles.optionText}>{item.label}</Text>
                  {selectedValue === item.value && (
                    <MaterialIcons name="check" size={20} color="#F48221" />
                  )}
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

const ZeroStockReportScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // State variables
  const [customerID, setCustomerID] = useState('');
  const [loading, setLoading] = useState(false);
  const [zeroStockItems, setZeroStockItems] = useState<ZeroStockItem[]>([]);
  const [allZeroStockItems, setAllZeroStockItems] = useState<ZeroStockItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchInitiated, setSearchInitiated] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    itemsPerPage: 50, // Show 50 items per page
    totalItems: 0,
    totalPages: 1,
  });

  // Log API endpoint for debugging
  console.log('Zero Stock API Endpoint:', API_ENDPOINTS.GET_ZERO_STOCK_REPORT);

  // Filter states with multi-select for categories and subcategories
  const [apiCategories, setApiCategories] = useState<string[]>([]);
  const [apiSubcategories, setApiSubcategories] = useState<{
    [key: string]: string[];
  }>({});
  const [units, setUnits] = useState<DropdownOption[]>([]);

  // Selected filter values
  const [itemCategories, setItemCategories] = useState<string[]>([]);
  const [itemSubcategories, setItemSubcategories] = useState<string[]>([]);
  const [lotNumber, setLotNumber] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');

  // Fetch customer ID on component mount
  useEffect(() => {
    const getCustomerID = async () => {
      try {
        const id = await AsyncStorage.getItem('customerID');
        if (id) {
          setCustomerID(id);
        }
      } catch (err) {
        console.error('Error fetching customer ID:', err);
      }
    };

    getCustomerID();
  }, []);

  // Fetch categories, subcategories, lot numbers and units data
  useEffect(() => {
    if (customerID) {
      fetchFilterData();
    }
  }, [customerID]);

  // Reset subcategories when categories change
  useEffect(() => {
    // Clear subcategories when categories change
    if (itemCategories.length === 0) {
      setItemSubcategories([]);
    }

    // Log whenever categories change
    console.log('Selected Categories:', itemCategories);
  }, [itemCategories]);

  // Log whenever subcategories change
  useEffect(() => {
    console.log('Selected Subcategories:', itemSubcategories);
  }, [itemSubcategories]);

  // Log whenever unit selection changes
  useEffect(() => {
    console.log('Selected Unit:', selectedUnit);
  }, [selectedUnit]);

  // Log whenever lot number changes
  useEffect(() => {
    console.log('Entered Lot Number:', lotNumber);
  }, [lotNumber]);

  // Fetch filter data from the API
  const fetchFilterData = async () => {
    try {
      setLoading(true);
      // Fetch categories and subcategories
      const categoriesResponse = await axios.post(
        API_ENDPOINTS.ITEM_CATEGORIES,
        {CustomerID: customerID},
        {headers: await getAuthHeaders()},
      );

      if (categoriesResponse.data && categoriesResponse.data.output) {
        // Process the data to get categories and subcategories
        const categoriesData = categoriesResponse.data.output;

        // Extract unique categories
        const uniqueCategories = [
          ...new Set(categoriesData.map((item: any) => item.CATDESC)),
        ] as string[];

        // Sort categories alphabetically
        const sortedCategories = [...uniqueCategories].sort((a, b) =>
          a.localeCompare(b),
        );

        // Create subcategories mapping by category
        const subcategoriesMap: {[key: string]: string[]} = {};

        // Populate subcategories map
        categoriesData.forEach((item: any) => {
          const category = item.CATDESC;
          const subcategory = item.SUBCATDESC;

          if (!subcategoriesMap[category]) {
            subcategoriesMap[category] = [];
          }

          if (!subcategoriesMap[category].includes(subcategory)) {
            subcategoriesMap[category].push(subcategory);
          }
        });

        // Sort subcategories within each category
        Object.keys(subcategoriesMap).forEach(category => {
          subcategoriesMap[category].sort((a, b) => a.localeCompare(b));
        });

        // Set the state
        setApiCategories(sortedCategories);
        setApiSubcategories(subcategoriesMap);
      }

      // Set unit options
      setUnits([
        {label: '--SELECT--', value: ''},
        {label: 'D-39', value: 'D-39'},
        {label: 'D-514', value: 'D-514'},
      ]);
    } catch (err) {
      console.error('Error fetching filter data:', err);
      setError('Failed to load filter data');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get available subcategories based on selected categories
  const getAvailableSubcategories = () => {
    let allSubcategories: string[] = [];

    // If no categories selected, return empty array
    if (itemCategories.length === 0) {
      return [];
    }

    // Collect subcategories from all selected categories
    itemCategories.forEach(category => {
      if (apiSubcategories[category]) {
        allSubcategories = [...allSubcategories, ...apiSubcategories[category]];
      }
    });

    // Remove duplicates
    const uniqueSubcategories = [...new Set(allSubcategories)];

    // Convert to option format
    return uniqueSubcategories.map(subcat => ({
      label: subcat,
      value: subcat,
    }));
  };

  // Fetch zero stock report data
  const fetchZeroStockItems = async () => {
    if (!customerID) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSearchInitiated(true);
      setPagination({
        ...pagination,
        currentPage: 1 // Reset to first page on new search
      });

      // Format request to exactly match the Postman format - using exact format from screenshot
      const requestData = {
        customerID: parseInt(customerID),
        itemCategoryName: itemCategories.length > 0 ? itemCategories : null,
        itemSubCategoryName:
          itemSubcategories.length > 0 ? itemSubcategories : null,
        lotNo: lotNumber ? parseInt(lotNumber) : null,
        unit: selectedUnit || null,
      };

      console.log('API Request URL:', API_ENDPOINTS.GET_ZERO_STOCK_REPORT);
      console.log('API Request Data:', JSON.stringify(requestData, null, 2));
      console.log('Customer ID:', customerID);

      const headers = await getAuthHeaders();
      console.log('API Request Headers:', JSON.stringify(headers, null, 2));

      const response = await axios.post(
        API_ENDPOINTS.GET_ZERO_STOCK_REPORT,
        requestData,
        {headers: headers},
      );

      console.log('API Response Status:', response.status);
      console.log('API Response Data:', JSON.stringify(response.data, null, 2));

      // Handle response based on what we see in Postman
      let dataArray: ZeroStockItem[] = [];
      
      if (response.data) {
        if (response.data.data && Array.isArray(response.data.data)) {
          console.log(
            'Found data array with length:',
            response.data.data.length,
          );
          dataArray = response.data.data;
        } else if (
          response.data.output &&
          Array.isArray(response.data.output)
        ) {
          console.log(
            'Found output array with length:',
            response.data.output.length,
          );
          dataArray = response.data.output;
        } else if (
          response.data.status === 'success' &&
          response.data.count > 0
        ) {
          console.log('Found success status with count:', response.data.count);
          dataArray = response.data.data;
        }
        
        // Store all data and update pagination
        setAllZeroStockItems(dataArray);
        const totalPages = Math.ceil(dataArray.length / pagination.itemsPerPage);
        setPagination({
          ...pagination,
          totalItems: dataArray.length,
          totalPages: totalPages || 1,
        });
        
        // Set current page data
        updateCurrentPageData(dataArray, 1, pagination.itemsPerPage);
        
        if (dataArray.length === 0) {
          setError('No zero stock items found');
        } else {
          setError(null);
        }
      } else {
        setAllZeroStockItems([]);
        setZeroStockItems([]);
        setError('No zero stock items found');
      }
    } catch (err: any) {
      console.error('Error fetching zero stock items:', err);
      console.log(
        'Error details:',
        JSON.stringify(err.response?.data, null, 2),
      );
      console.log('Error status:', err.response?.status);
      console.log(
        'Error headers:',
        JSON.stringify(err.response?.headers, null, 2),
      );
      setError('Failed to load zero stock items');
      Alert.alert(
        'Error',
        'Failed to load zero stock items. Please try again.',
        [{text: 'OK'}],
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to update current page data
  const updateCurrentPageData = (data: ZeroStockItem[], page: number, itemsPerPage: number) => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = data.slice(startIndex, endIndex);
    setZeroStockItems(paginatedData);
  };
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    
    setPagination({
      ...pagination,
      currentPage: newPage
    });
    
    updateCurrentPageData(allZeroStockItems, newPage, pagination.itemsPerPage);
  };
  
  // Pagination UI component
  const renderPagination = () => {
    if (!searchInitiated || zeroStockItems.length === 0) return null;
    
    const {currentPage, totalPages} = pagination;
    
    return (
      <View style={styles.paginationContainer}>
        <View style={styles.paginationControls}>
          <TouchableOpacity 
            style={[styles.pageButton, currentPage === 1 && styles.disabledButton]}
            onPress={() => handlePageChange(1)}
            disabled={currentPage === 1}>
            <MaterialIcons name="first-page" size={16} color={currentPage === 1 ? "#9ca3af" : "#F48221"} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.pageButton, currentPage === 1 && styles.disabledButton]}
            onPress={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}>
            <MaterialIcons name="chevron-left" size={16} color={currentPage === 1 ? "#9ca3af" : "#F48221"} />
          </TouchableOpacity>
          
          <Text style={styles.pageInfo}>{currentPage}/{totalPages}</Text>
          
          <TouchableOpacity 
            style={[styles.pageButton, currentPage === totalPages && styles.disabledButton]}
            onPress={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}>
            <MaterialIcons name="chevron-right" size={16} color={currentPage === totalPages ? "#9ca3af" : "#F48221"} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.pageButton, currentPage === totalPages && styles.disabledButton]}
            onPress={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}>
            <MaterialIcons name="last-page" size={16} color={currentPage === totalPages ? "#9ca3af" : "#F48221"} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Clear all filters
  const handleClearFilters = () => {
    setItemCategories([]);
    setItemSubcategories([]);
    setLotNumber('');
    setSelectedUnit('');
    setSearchInitiated(false);
    console.log('All filters cleared');
  };

  // Handler for numeric input
  const handleNumericInput = (text: string) => {
    // Only allow numeric input
    const numericText = text.replace(/[^0-9]/g, '');
    setLotNumber(numericText);
    console.log('Lot Number Input:', numericText);
  };

  // Render items with pagination
  const renderItems = () => {
    if (!searchInitiated) {
      return null;
    }

    if (loading) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#F48221" />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    return (
      <View style={styles.tableWrapper}>
        <ScrollView
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
          contentContainerStyle={styles.verticalScrollViewContent}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.scrollViewContent}>
            <View style={styles.tableContainer}>
              {/* Table Header */}
              <View style={styles.tableHeaderRow}>
                <View style={styles.tableHeaderCell60}>
                  <Text style={styles.tableHeaderText}>#</Text>
                </View>
                <View style={styles.tableHeaderCell100}>
                  <Text style={styles.tableHeaderText}>Balance Qty</Text>
                </View>
                <View style={styles.tableHeaderCell100}>
                  <Text style={styles.tableHeaderText}>Available Qty</Text>
                </View>
                <View style={styles.tableHeaderCell100}>
                  <Text style={styles.tableHeaderText}>Box Quantity</Text>
                </View>
                <View style={styles.tableHeaderCell200}>
                  <Text style={styles.tableHeaderText}>Item Name</Text>
                </View>
                <View style={styles.tableHeaderCell100}>
                  <Text style={styles.tableHeaderText}>Lot No</Text>
                </View>
                <View style={styles.tableHeaderCell120}>
                  <Text style={styles.tableHeaderText}>Item Marks</Text>
                </View>
                <View style={styles.tableHeaderCell100}>
                  <Text style={styles.tableHeaderText}>Vakal No</Text>
                </View>
                <View style={styles.tableHeaderCell100}>
                  <Text style={styles.tableHeaderText}>Batch No</Text>
                </View>
                <View style={styles.tableHeaderCell120}>
                  <Text style={styles.tableHeaderText}>Expiry Date</Text>
                </View>
                <View style={styles.tableHeaderCell150}>
                  <Text style={styles.tableHeaderText}>Remarks</Text>
                </View>
                <View style={styles.tableHeaderCell100}>
                  <Text style={styles.tableHeaderText}>Status</Text>
                </View>
                <View style={styles.tableHeaderCell120}>
                  <Text style={styles.tableHeaderText}>Category</Text>
                </View>
                <View style={styles.tableHeaderCell120}>
                  <Text style={styles.tableHeaderText}>Subcategory</Text>
                </View>
              </View>

              {/* Table Body */}
              {zeroStockItems.length > 0 ? (
                zeroStockItems.map((item, index) => (
                  <View
                    key={`item-${index}-${item.ITEM_ID}`}
                    style={[
                      styles.tableRow,
                      index % 2 === 0
                        ? styles.tableRowEven
                        : styles.tableRowOdd,
                    ]}>
                    <View style={styles.tableHeaderCell60}>
                      <Text style={styles.tableRowText}>
                        {(pagination.currentPage - 1) * pagination.itemsPerPage + index + 1}
                      </Text>
                    </View>
                    <View style={styles.tableHeaderCell100}>
                      <Text style={styles.tableRowText}>
                        {item.BALANCE_QTY}
                      </Text>
                    </View>
                    <View style={styles.tableHeaderCell100}>
                      <Text style={styles.tableRowText}>
                        {item.AVAILABLE_QTY}
                      </Text>
                    </View>
                    <View style={styles.tableHeaderCell100}>
                      <Text style={styles.tableRowText}>
                        {item.BOX_QUANTITY}
                      </Text>
                    </View>
                    <View style={styles.tableHeaderCell200}>
                      <Text style={styles.tableRowText}>{item.ITEM_NAME}</Text>
                    </View>
                    <View style={styles.tableHeaderCell100}>
                      <Text style={styles.tableRowText}>{item.LOT_NO}</Text>
                    </View>
                    <View style={styles.tableHeaderCell120}>
                      <Text style={styles.tableRowText}>
                        {item.ITEM_MARKS || '-'}
                      </Text>
                    </View>
                    <View style={styles.tableHeaderCell100}>
                      <Text style={styles.tableRowText}>
                        {item.VAKAL_NO || '-'}
                      </Text>
                    </View>
                    <View style={styles.tableHeaderCell100}>
                      <Text style={styles.tableRowText}>
                        {item.BATCH_NO || '-'}
                      </Text>
                    </View>
                    <View style={styles.tableHeaderCell120}>
                      <Text style={styles.tableRowText}>
                        {item.EXPIRY_DATE || '-'}
                      </Text>
                    </View>
                    <View style={styles.tableHeaderCell150}>
                      <Text style={styles.tableRowText}>
                        {item.REMARKS || '-'}
                      </Text>
                    </View>
                    <View style={styles.tableHeaderCell100}>
                      <Text style={styles.tableRowText}>
                        {item.STATUS || '-'}
                      </Text>
                    </View>
                    <View style={styles.tableHeaderCell120}>
                      <Text style={styles.tableRowText}>
                        {item.ITEM_CATEG_NAME}
                      </Text>
                    </View>
                    <View style={styles.tableHeaderCell120}>
                      <Text style={styles.tableRowText}>
                        {item.SUB_CATEGORY_NAME}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyRow}>
                  <Text style={styles.emptyText}>
                    No zero stock items found. Try changing filters or search
                    again.
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </ScrollView>
        {renderPagination()}
      </View>
    );
  };

  return (
    <LayoutWrapper showHeader={true} showTabBar={true} route={route}>
      <View style={styles.container}>
        {/* Filters Section */}
        <View style={styles.filtersContainer}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>Filter Options</Text>
            <TouchableOpacity
              style={styles.clearAllButton}
              onPress={handleClearFilters}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterGrid}>
            {/* Left Column */}
            <View style={styles.filterColumn}>
              {/* Categories Multi-Select */}
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Categories:</Text>
                <View style={styles.multiSelectContainer}>
                  <MultiSelect
                    options={apiCategories.map(category => ({
                      label: category,
                      value: category,
                    }))}
                    selectedValues={itemCategories}
                    onSelectChange={values => {
                      setItemCategories(values);
                      console.log('Categories Selected:', values);
                    }}
                    placeholder="Select items"
                    primaryColor="#F48221"
                  />
                </View>
              </View>

              {/* Lot No */}
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Lot No:</Text>
                <View style={styles.textInputContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter Lot Number"
                    placeholderTextColor="#9ca3af"
                    value={lotNumber}
                    onChangeText={handleNumericInput}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Right Column */}
            <View style={styles.filterColumn}>
              {/* Subcategories Multi-Select */}
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Subcategories:</Text>
                <View style={styles.multiSelectContainer}>
                  <MultiSelect
                    options={getAvailableSubcategories()}
                    selectedValues={itemSubcategories}
                    onSelectChange={values => {
                      setItemSubcategories(values);
                      console.log('Subcategories Selected:', values);
                    }}
                    placeholder="Select items"
                    disabled={itemCategories.length === 0}
                    primaryColor="#F48221"
                  />
                </View>
              </View>

              {/* Unit */}
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Unit:</Text>
                <StockReportDropdown
                  options={units}
                  selectedValue={selectedUnit}
                  onSelect={value => {
                    setSelectedUnit(value);
                    console.log('Unit Selected:', value);
                  }}
                  placeholder="--SELECT--"
                />
              </View>
            </View>
          </View>

          {/* Search Button */}
          <TouchableOpacity
            style={styles.searchButton}
            onPress={fetchZeroStockItems}>
            <MaterialIcons name="search" size={18} color="#fff" />
            <Text style={styles.buttonText}>Search</Text>
          </TouchableOpacity>
        </View>

        {/* Results Section */}
        {renderItems()}
      </View>
    </LayoutWrapper>
  );
};

// Styles for StockReportScreen-style dropdown
const stockReportStyles = StyleSheet.create({
  dropdownContainer: {
    position: 'relative',
    flex: 1,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 40,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  dropdownSelectedText: {
    fontSize: 14,
    color: '#111827',
  },
  dropdownPlaceholderText: {
    fontSize: 14,
    color: '#9ca3af',
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '60%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
    paddingHorizontal: 3,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#F48221',
  },
  paginationContainer: {
    marginVertical: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  paginationControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageButton: {
    padding: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 3,
    marginHorizontal: 2,
    backgroundColor: '#fff',
  },
  disabledButton: {
    opacity: 0.5,
  },
  pageInfo: {
    fontSize: 12,
    color: '#4b5563',
    marginHorizontal: 4,
  },
  filtersContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterColumn: {
    width: '49%',
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F48221',
  },
  clearAllButton: {
    padding: 4,
  },
  clearAllText: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '500',
  },
  filterRow: {
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
    marginBottom: 4,
  },
  multiSelectContainer: {
    width: '100%',
  },
  searchButton: {
    backgroundColor: '#F48221',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  textInputContainer: {
    width: '100%',
  },
  textInput: {
    height: 40,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    backgroundColor: '#fff',
    fontSize: 14,
    color: '#111827',
    ...Platform.select({
      ios: {
        paddingVertical: 10,
      },
    }),
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 16,
  },
  itemCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F48221',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F48221',
  },
  itemCategory: {
    fontSize: 14,
    color: '#6b7280',
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1f2937',
  },
  itemDetails: {
    marginTop: 8,
  },
  itemDetail: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  description: {
    fontSize: 16,
    color: '#4b5563',
  },
  dropdownContainer: {
    flex: 1,
  },
  disabledDropdown: {
    opacity: 0.6,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 40,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  dropdownSelectedText: {
    fontSize: 14,
    color: '#111827',
  },
  dropdownPlaceholderText: {
    fontSize: 14,
    color: '#9ca3af',
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
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  doneButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F48221',
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
    borderBottomColor: '#f3f4f6',
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
  },
  tableWrapper: {
    flex: 1,
    height: '100%',
    maxHeight: 550,
    ...Platform.select({
      ios: {
        maxHeight: 530, // Slightly smaller on iOS to account for keyboard
      },
    }),
  },
  verticalScrollViewContent: {
    flexGrow: 1,
  },
  scrollViewContent: {
    paddingBottom: 8,
  },
  tableContainer: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginTop: 4,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f2f2f2',
    borderBottomWidth: 1,
    borderBottomColor: '#c1d5e0',
    padding: 6,
  },
  tableHeaderCell60: {
    width: 60,
    paddingHorizontal: 6,
    justifyContent: 'center',
  },
  tableHeaderCell100: {
    width: 100,
    paddingHorizontal: 6,
    justifyContent: 'center',
  },
  tableHeaderCell120: {
    width: 120,
    paddingHorizontal: 6,
    justifyContent: 'center',
  },
  tableHeaderCell200: {
    width: 200,
    paddingHorizontal: 6,
    justifyContent: 'center',
  },
  tableHeaderCell150: {
    width: 150,
    paddingHorizontal: 6,
    justifyContent: 'center',
  },
  tableHeaderText: {
    fontWeight: 'bold',
    fontSize: 12,
    // color: '#0d47a1',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    padding: 6,
  },
  tableRowEven: {
    backgroundColor: '#ffffff',
  },
  tableRowOdd: {
    backgroundColor: '#f9fafb',
  },
  tableRowText: {
    fontSize: 12,
  },
  emptyRow: {
    padding: 20,
    alignItems: 'center',
  },
});

export default ZeroStockReportScreen;
