import React, {useState, useEffect, useRef} from 'react';
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
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import axios, {AxiosError} from 'axios';
import {API_ENDPOINTS, DEFAULT_HEADERS} from '../../config/api.config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {format} from 'date-fns';
import MultiSelect from '../../components/Multiselect';
import {LayoutWrapper} from '../../components/AppLayout';
import {useRoute} from '@react-navigation/core';

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
              style={{width: '100%'}}
              keyboardShouldPersistTaps="handled"
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

// Updated interface for the new API response
interface StockReportItem {
  ITEM_ID: number;
  ITEM_CODE: string;
  DESCRIPTION: string;
  ITEM_NAME: string;
  LOT_NO: number;
  UNIT_NAME: string[];
  ITEM_MARKS: string | null;
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

interface StockReportResponse {
  status: string;
  count: number;
  data: StockReportItem[];
}

interface SubCategoryItem {
  CATID: string | number;
  CATCODE: string;
  CATDESC: string;
  SUBCATID: string | number;
  SUBCATCODE: string;
  SUBCATDESC: string;
  CATEGORY_IMAGE_NAME?: string;
  SUBCATEGORY_IMAGE_NAME?: string;
}

interface ErrorResponse {
  message?: string;
  status?: string;
  details?: string;
}

const StockReportScreen: React.FC = () => {
  const route = useRoute();
  const [customerName, setCustomerName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [lotNo, setLotNo] = useState('');
  const [vakalNo, setVakalNo] = useState('');
  const [itemSubCategory, setItemSubCategory] = useState<string[]>([]);
  const [itemMarks, setItemMarks] = useState('');
  const [unit, setUnit] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [tempFromDate, setTempFromDate] = useState<Date>(new Date());
  const [tempToDate, setTempToDate] = useState<Date>(new Date());
  const [showFromDatePicker, setShowFromDatePicker] = useState<boolean>(false);
  const [showToDatePicker, setShowToDatePicker] = useState<boolean>(false);
  const [isFromDateSelected, setIsFromDateSelected] = useState<boolean>(false);
  const [isToDateSelected, setIsToDateSelected] = useState<boolean>(false);
  const [qtyLessThan, setQtyLessThan] = useState('');
  const [isScrollingToResults, setIsScrollingToResults] = useState(false);
  const [includeZeroStock, setIncludeZeroStock] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const resultsRef = useRef<View>(null);

  // API integration state variables
  const [isLoading, setIsLoading] = useState(false);
  const [stockData, setStockData] = useState<StockReportItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // State for subcategories
  const [subCategories, setSubCategories] = useState<SubCategoryItem[]>([]);
  const [subCategoryLoading, setSubCategoryLoading] = useState(false);

  // Format date for display
  const formatDisplayDate = (date: Date | null): string => {
    if (!date) {
      return '';
    }
    return format(date, 'dd/MM/yyyy');
  };

  // Format dates for API
  const formatApiDate = (date: Date | null): string | null => {
    if (!date) {
      return null;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Enhanced state setters with logging
  const logAndSetCustomerName = (value: string) => {
    console.log('Customer Name changed:', value);
    setCustomerName(value);
  };

  const logAndSetLotNo = (value: string) => {
    console.log('Lot No changed:', value);
    setLotNo(value);
  };

  const logAndSetVakalNo = (value: string) => {
    console.log('Vakal No changed:', value);
    setVakalNo(value);
  };

  const logAndSetItemSubCategory = (values: string[]) => {
    console.log('Item Sub Category changed:', values);
    setItemSubCategory(values);
  };

  const logAndSetItemMarks = (value: string) => {
    console.log('Item Marks changed:', value);
    setItemMarks(value);
  };

  const logAndSetUnit = (values: string[]) => {
    console.log('Unit changed:', values);
    setUnit(values);
  };

  const logAndSetFromDate = (date: Date) => {
    console.log('From Date changed:', date);
    setFromDate(date);
    setIsFromDateSelected(true);
  };

  const logAndSetToDate = (date: Date) => {
    console.log('To Date changed:', date);
    setToDate(date);
    setIsToDateSelected(true);
  };

  const logAndSetQtyLessThan = (value: string) => {
    console.log('Qty Less Than changed:', value);
    setQtyLessThan(value);
  };

  // Scroll to results section when data loads
  useEffect(() => {
    if (stockData.length > 0) {
      setIsScrollingToResults(true);

      setTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.measure((x, y, width, height, pageX, pageY) => {
            scrollViewRef.current?.scrollTo({y: pageY - 50, animated: true});
            setTimeout(() => {
              setIsScrollingToResults(false);
            }, 500);
          });
        } else {
          setIsScrollingToResults(false);
        }
      }, 100);
    }
  }, [stockData]);

  // Fetch subcategories from API
  useEffect(() => {
    const fetchSubCategories = async () => {
      try {
        setSubCategoryLoading(true);

        const customerID = await AsyncStorage.getItem('customerID');
        if (!customerID) {
          console.error('Customer ID not found');
          return;
        }

        const response = await axios.post(
          API_ENDPOINTS.ITEM_CATEGORIES,
          {CustomerID: customerID},
          {headers: DEFAULT_HEADERS},
        );

        if (
          response.data &&
          response.data.output &&
          Array.isArray(response.data.output)
        ) {
          setSubCategories(response.data.output);
        } else {
          console.error(
            'Invalid response format for subcategories:',
            response.data,
          );
        }
      } catch (error) {
        console.error('Error fetching subcategories:', error);
      } finally {
        setSubCategoryLoading(false);
      }
    };

    fetchSubCategories();
  }, []);

  // Fetch display name and customer ID
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const name = await AsyncStorage.getItem('Disp_name');
        const id = await AsyncStorage.getItem('customerID');

        if (name) {
          setDisplayName(name);
          setCustomerName(name);
          console.log('Display name set from AsyncStorage:', name);
        }

        if (id) {
          setCustomerId(id);
          console.log('Customer ID set from AsyncStorage:', id);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUserData();
  }, []);

  const customerOptions: DropdownOption[] = [
    {label: '--SELECT--', value: ''},
    {label: displayName, value: displayName},
  ];

  // Update item subcategory options to use API data
  const itemSubCategoryOptions = subCategories
    .slice()
    .sort((a, b) => a.SUBCATDESC.localeCompare(b.SUBCATDESC))
    .map(item => ({
      label: item.SUBCATDESC,
      value: item.SUBCATDESC, // Use description as value for API
    }));

  const unitOptions = [
    {label: 'D-39', value: 'D-39'},
    {label: 'D-514', value: 'D-514'},
  ];

  const handleSearch = async () => {
    // Reset previous data
    setErrorMessage(null);
    setInfoMessage(null);
    setIsScrollingToResults(true);

    try {
      setIsLoading(true);

      if (!customerId) {
        throw new Error('Customer ID not found. Please login again.');
      }

      // Prepare the request payload matching the API structure
      const payload = {
        customerName: customerName || null,
        lotNo: lotNo ? Number(lotNo) : null,
        vakalNo: vakalNo || null,
        itemSubCategory: itemSubCategory.length > 0 ? itemSubCategory : null,
        itemMarks: itemMarks || null,
        unit: unit.length > 0 ? unit : null,
        fromDate: formatApiDate(fromDate),
        toDate: formatApiDate(toDate),
        qtyLessThan: qtyLessThan ? Number(qtyLessThan) : null,
      };

      const apiEndpoint = `${API_ENDPOINTS.GET_STOCK_REPORT}?customerId=${customerId}`;

      console.log(`Using API endpoint: ${apiEndpoint}`);
      console.log('Request payload:', JSON.stringify(payload, null, 2));

      // Make the API call
      const response = await axios.post(apiEndpoint, payload, {
        headers: DEFAULT_HEADERS,
      });

      console.log('API Response:', JSON.stringify(response.data, null, 2));

      const result = response.data;

      if (result.status === 'success') {
        setStockData(result.data || []);
        setTotalRecords(result.count || 0);
        setInfoMessage(`Found ${result.count || 0} records`);

        console.log('Stock data records:', result.count);
        if (result.data && result.data.length > 0) {
          console.log(
            'First record sample:',
            JSON.stringify(result.data[0], null, 2),
          );
        } else {
          console.log('No records found');
        }
      } else {
        throw new Error(result.message || 'Failed to fetch stock report data');
      }
    } catch (error) {
      console.error('Error fetching stock report:', error);
      const axiosError = error as AxiosError<ErrorResponse>;
      if (axiosError.response) {
        console.error(
          'Server response error:',
          axiosError.response.status,
          axiosError.response.data,
        );
        const errorMsg = axiosError.response.data?.message || 'Server error';
        setErrorMessage(
          `Server error: ${axiosError.response.status}. ${errorMsg}`,
        );
      } else if (axiosError.request) {
        console.error('No response received:', axiosError.request);
        setErrorMessage(
          'No response from server. Please check your network connection.',
        );
      } else {
        setErrorMessage(axiosError.message || 'An unknown error occurred');
      }
      setStockData([]);
      setTotalRecords(0);
      setIsScrollingToResults(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    console.log('Form cleared by user');
    setCustomerName(displayName); // Reset to display name
    setLotNo('');
    setVakalNo('');
    setItemSubCategory([]);
    setItemMarks('');
    setUnit([]);
    setFromDate(null);
    setToDate(null);
    setIsFromDateSelected(false);
    setIsToDateSelected(false);
    setQtyLessThan('');
    setStockData([]);
    setErrorMessage(null);
    setInfoMessage(null);
    setTotalRecords(0);
    setIsScrollingToResults(false);
  };

  // Handle date change for From Date
  const onFromDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    if (Platform.OS === 'android') {
      setShowFromDatePicker(false);
    }

    if (selectedDate) {
      console.log(`From date changing to ${selectedDate.toISOString()}`);
      setTempFromDate(selectedDate);

      if (Platform.OS === 'android') {
        setFromDate(selectedDate);
        setIsFromDateSelected(true);
        console.log('From date updated (Android)');
      }
    }
  };

  // Handle date change for To Date
  const onToDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowToDatePicker(false);
    }

    if (selectedDate) {
      console.log(`To date changing to ${selectedDate.toISOString()}`);
      setTempToDate(selectedDate);

      if (Platform.OS === 'android') {
        setToDate(selectedDate);
        setIsToDateSelected(true);
        console.log('To date updated (Android)');
      }
    }
  };

  // Confirm date selection for iOS
  const confirmFromDate = () => {
    console.log(`Confirming from date change to ${tempFromDate.toISOString()}`);
    setFromDate(tempFromDate);
    setIsFromDateSelected(true);
    setShowFromDatePicker(false);
    console.log('From date updated (iOS)');
  };

  const confirmToDate = () => {
    console.log(`Confirming to date change to ${tempToDate.toISOString()}`);
    setToDate(tempToDate);
    setIsToDateSelected(true);
    setShowToDatePicker(false);
    console.log('To date updated (iOS)');
  };

  // Render table header
  const renderTableHeader = () => (
    <View style={styles.tableHeader}>
      <Text style={[styles.tableHeaderCell, styles.unitColumn]}>Unit</Text>
      <Text style={[styles.tableHeaderCell, styles.lotColumn]}>Lot No</Text>
      <Text style={[styles.tableHeaderCell, styles.itemNameColumn]}>
        Item Name
      </Text>

      <Text style={[styles.tableHeaderCell, styles.balanceColumn]}>
        Balance
      </Text>
      <Text style={[styles.tableHeaderCell, styles.availableColumn]}>
        Available
      </Text>

      {/* <Text style={[styles.tableHeaderCell, styles.statusColumn]}>Status</Text>
      <Text style={[styles.tableHeaderCell, styles.categoryColumn]}>
        Category
      </Text> */}
      <Text style={[styles.tableHeaderCell, styles.remarksColumn]}>
        Remarks
      </Text>
    </View>
  );

  // Render table row
  const renderTableRow = ({
    item,
    index,
  }: {
    item: StockReportItem;
    index: number;
  }) => (
    <View
      style={[
        styles.tableRow,
        index % 2 === 0 ? styles.evenRow : styles.oddRow,
      ]}>
      <Text style={[styles.tableCell, styles.unitColumn]} numberOfLines={1}>
        {Array.isArray(item.UNIT_NAME)
          ? item.UNIT_NAME.join(', ')
          : item.UNIT_NAME}
      </Text>
      <Text style={[styles.tableCell, styles.lotColumn]}>{item.LOT_NO}</Text>
      <Text style={[styles.tableCell, styles.itemNameColumn]} numberOfLines={2}>
        {item.ITEM_NAME}
      </Text>

      <Text style={[styles.tableCell, styles.balanceColumn]}>
        {item.BALANCE_QTY}
      </Text>
      <Text style={[styles.tableCell, styles.availableColumn]}>
        {item.AVAILABLE_QTY}
      </Text>

      {/* <Text style={[styles.tableCell, styles.statusColumn]}>{item.STATUS}</Text>
      <Text style={[styles.tableCell, styles.categoryColumn]} numberOfLines={2}>
        {item.SUB_CATEGORY_NAME}
      </Text> */}
      <Text style={[styles.tableCell, styles.remarksColumn]} numberOfLines={2}>
        {item.REMARKS || '-'}
      </Text>
    </View>
  );

  return (
    <LayoutWrapper showHeader={true} showTabBar={false} route={route}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag">
          {/* Form header */}
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>Stock Report</Text>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formColumn}>
              <Text style={styles.label}>Customer Name</Text>
              <CustomDropdown
                options={customerOptions}
                selectedValue={customerName}
                onSelect={logAndSetCustomerName}
                placeholder="--SELECT--"
              />
            </View>

            <View style={styles.formColumn}>
              <Text style={styles.label}>Lot No</Text>
              <TextInput
                style={styles.input}
                value={lotNo}
                onChangeText={logAndSetLotNo}
                placeholder=""
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formColumn}>
              <Text style={styles.label}>Vakal No</Text>
              <TextInput
                style={styles.input}
                value={vakalNo}
                onChangeText={logAndSetVakalNo}
                placeholder=""
              />
            </View>

            <View style={styles.formColumn}>
              <Text style={styles.label}>Item Sub Category</Text>
              {subCategoryLoading ? (
                <View style={[styles.input, styles.dropdownLoading]}>
                  <ActivityIndicator size="small" color="#E87830" />
                  <Text style={styles.dropdownLoadingText}>Loading...</Text>
                </View>
              ) : (
                <MultiSelect
                  options={itemSubCategoryOptions}
                  selectedValues={itemSubCategory}
                  onSelectChange={logAndSetItemSubCategory}
                  placeholder="--SELECT--"
                  primaryColor="#E87830"
                />
              )}
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formColumn}>
              <Text style={styles.label}>Item Marks</Text>
              <TextInput
                style={styles.input}
                value={itemMarks}
                onChangeText={logAndSetItemMarks}
                placeholder=""
              />
            </View>

            <View style={styles.formColumn}>
              <Text style={styles.label}>Unit</Text>
              <MultiSelect
                options={unitOptions}
                selectedValues={unit}
                onSelectChange={logAndSetUnit}
                placeholder="--SELECT--"
                primaryColor="#E87830"
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formColumn}>
              <Text style={styles.label}>From Date</Text>
              <TouchableOpacity
                style={styles.input}
                activeOpacity={0.7}
                onPress={() => {
                  setTempFromDate(fromDate || new Date());
                  setShowFromDatePicker(true);
                }}>
                <Text
                  style={
                    isFromDateSelected
                      ? styles.dateText
                      : styles.placeholderText
                  }>
                  {isFromDateSelected
                    ? formatDisplayDate(fromDate)
                    : 'DD/MM/YYYY'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formColumn}>
              <Text style={styles.label}>To Date</Text>
              <TouchableOpacity
                style={styles.input}
                activeOpacity={0.7}
                onPress={() => {
                  setTempToDate(toDate || new Date());
                  setShowToDatePicker(true);
                }}>
                <Text
                  style={
                    isToDateSelected ? styles.dateText : styles.placeholderText
                  }>
                  {isToDateSelected ? formatDisplayDate(toDate) : 'DD/MM/YYYY'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.searchButton]}
              onPress={handleSearch}>
              <Text style={styles.buttonText}>Search</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={handleClear}>
              <Text style={styles.buttonText}>Clear</Text>
            </TouchableOpacity>
          </View>

          {/* Loading indicator */}
          {isLoading && stockData.length === 0 && (
            <View style={styles.scrollIndicatorContainer}>
              <Text style={styles.scrollIndicatorText}>Loading results...</Text>
              <Text style={styles.scrollIndicatorArrow}>↓</Text>
            </View>
          )}

          {/* Table format results */}
          {stockData.length > 0 && (
            <View style={styles.tableContainer}>
              <ScrollView
                horizontal={true}
                showsHorizontalScrollIndicator={true}>
                <View>
                  {renderTableHeader()}
                  <FlatList
                    data={stockData}
                    renderItem={renderTableRow}
                    keyExtractor={(item, index) => `stock-${index}`}
                    scrollEnabled={false}
                    keyboardShouldPersistTaps="handled"
                  />
                </View>
              </ScrollView>
            </View>
          )}

          {/* Loading indicator */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#E87830" />
            </View>
          )}

          {/* Error message display */}
          {errorMessage && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Empty state message */}
          {!isLoading && stockData.length === 0 && !errorMessage && (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>
                No stock data available. Try adjusting your search criteria.
              </Text>
            </View>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>

      {/* Date Pickers with fixed styling */}
      {showFromDatePicker && (
        <Modal transparent={true} animationType="slide">
          <View style={styles.datePickerContainer}>
            <View style={styles.datePickerModal}>
              <DateTimePicker
                value={tempFromDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onFromDateChange}
                textColor="#000000"
                style={styles.datePicker}
              />
              {Platform.OS === 'ios' && (
                <View style={styles.datePickerButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowFromDatePicker(false)}>
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={confirmFromDate}>
                    <Text style={styles.buttonText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}

      {showToDatePicker && (
        <Modal transparent={true} animationType="slide">
          <View style={styles.datePickerContainer}>
            <View style={styles.datePickerModal}>
              <DateTimePicker
                value={tempToDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onToDateChange}
                textColor="#000000"
                style={styles.datePicker}
              />
              {Platform.OS === 'ios' && (
                <View style={styles.datePickerButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowToDatePicker(false)}>
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={confirmToDate}>
                    <Text style={styles.buttonText}>Confirm</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}
    </LayoutWrapper>
  );
};

const styles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  //title styles
  titleContainer: {
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
    paddingVertical: 10,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F48221',
  },

  // Form styles
  formRow: {
    flexDirection: 'row',
    marginBottom: 14,
    justifyContent: 'space-between',
    paddingHorizontal: 5,
  },
  formColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '500',
    color: '#333',
  },
  input: {
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

  dateText: {
    color: '#333',
    fontSize: 14,
  },
  placeholderText: {
    color: '#999',
    fontSize: 14,
  },

  // Dropdown styles
  dropdownContainer: {
    marginBottom: 15,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    height: 40,
  },
  dropdownSelectedText: {
    color: '#333',
    fontSize: 14,
  },
  dropdownPlaceholderText: {
    color: '#999',
    fontSize: 14,
  },
  dropdownIcon: {
    color: '#666',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    width: '80%',
    maxHeight: '60%',
  },
  optionItem: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedOption: {
    backgroundColor: '#f5f5f5',
  },
  optionText: {
    color: '#333',
    fontSize: 14,
  },
  selectedOptionText: {
    fontWeight: 'bold',
    color: '#E87830',
  },
  dropdownLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownLoadingText: {
    marginLeft: 10,
    color: '#666',
  },

  // Button styles
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  searchButton: {
    backgroundColor: '#E87830',
  },
  clearButton: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },

  // Date picker styles
  datePickerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  datePickerModal: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
  },
  datePicker: {
    width: '100%',
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    padding: 10,
    borderRadius: 5,
    width: '45%',
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#E87830',
    padding: 10,
    borderRadius: 5,
    width: '45%',
    alignItems: 'center',
  },

  // Results section
  resultInfoContainer: {
    marginBottom: 15,
  },
  resultInfo: {
    backgroundColor: '#e9f7ef',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  resultCount: {
    fontWeight: 'bold',
    color: '#28a745',
    fontSize: 16,
  },
  infoMessage: {
    color: '#28a745',
    marginTop: 5,
    fontSize: 14,
  },
  scrollIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  scrollIndicatorText: {
    color: '#E87830',
    marginRight: 10,
  },
  scrollIndicatorArrow: {
    color: '#E87830',
    fontSize: 20,
    fontWeight: 'bold',
  },

  // Table styles
  tableContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    marginBottom: 20,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
  },
  tableHeaderCell: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    paddingHorizontal: 0,
    borderBottomColor: '#eee',
  },
  evenRow: {
    backgroundColor: 'white',
  },
  oddRow: {
    backgroundColor: '#f9f9f9',
  },
  tableCell: {
    paddingHorizontal: 4,
    fontSize: 12,
    textAlign: 'center',
  },

  // Column widths
  itemNameColumn: {width: 150},
  lotColumn: {width: 60},
  balanceColumn: {width: 70},
  availableColumn: {width: 70},
  unitColumn: {width: 70},
  statusColumn: {width: 70},
  categoryColumn: {width: 100},
  remarksColumn: {width: 120},

  // Status indicators
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    backgroundColor: '#f8d7da',
    padding: 15,
    borderRadius: 6,
    marginVertical: 20,
  },
  errorText: {
    color: '#721c24',
    textAlign: 'center',
  },
  noDataContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noDataText: {
    color: '#6c757d',
    fontSize: 16,
    textAlign: 'center',
  },

  // Radio group styles (not used but included for completeness)
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E87830',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  selectedRadio: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: '#E87830',
  },
  radioLabel: {
    fontSize: 14,
    color: '#333',
  },
});

export default StockReportScreen;
