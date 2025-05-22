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
      placeholderTextColor={'#888'}
      keyboardType="numeric"
    />
  );
};

interface StockReportItem {
  'Customer Name': string;
  'Inward Dt': string;
  Unit: string;
  'Inward No': string;
  'Item Description': string;
  'Item Mark': string;
  Vakkal: string;
  'Lot No': string | number;
  'Net qty': number;
}

interface ItemWiseSummaryItem {
  'Customer Name': string;
  'Unit Name': string;
  'Item Name': string;
  Description: string;
  'Net Qty': number;
}

interface CategoryWiseSummaryItem {
  'Customer Name': string;
  'Item Sub Category': string;
  'Net Qty': number;
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

interface StockReportResponse {
  status: string;
  data: StockReportItem[] | ItemWiseSummaryItem[] | CategoryWiseSummaryItem[];
  recordCount: number;
  message: string | null;
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
  const [lotNo, setLotNo] = useState('');
  const [vakalNo, setVakalNo] = useState('');
  const [itemSubCategory, setItemSubCategory] = useState<string[]>([]);
  const [itemSubCategoryText, setItemSubCategoryText] = useState('');
  const [itemMarks, setItemMarks] = useState('');
  const [unit, setUnit] = useState('');
  const [toDate, setToDate] = useState<Date | null>(null);
  const [tempToDate, setTempToDate] = useState<Date>(new Date());
  const [showToDatePicker, setShowToDatePicker] = useState<boolean>(false);
  const [isDateSelected, setIsDateSelected] = useState<boolean>(false);
  const [qtyLessThan, setQtyLessThan] = useState('');
  const [reportType, setReportType] = useState('details');
  const [isScrollingToResults, setIsScrollingToResults] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const resultsRef = useRef<View>(null);

  // New state variables for API integration
  const [isLoading, setIsLoading] = useState(false);
  const [stockData, setStockData] = useState<
    (StockReportItem | ItemWiseSummaryItem | CategoryWiseSummaryItem)[]
  >([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // New state for subcategories
  const [subCategories, setSubCategories] = useState<SubCategoryItem[]>([]);
  const [subCategoryLoading, setSubCategoryLoading] = useState(false);

  // New state for expanded item
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

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

  // Create enhanced state setters with logging
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

    // Find all matching subcategories and store their descriptions
    if (values.length > 0) {
      const selectedDescriptions = values
        .map(value => {
          const selectedCategory = subCategories.find(
            cat => cat.SUBCATID.toString() === value,
          );
          return selectedCategory ? selectedCategory.SUBCATDESC : '';
        })
        .filter(Boolean);

      setItemSubCategoryText(selectedDescriptions.join(', '));
      console.log('Selected subcategory descriptions:', selectedDescriptions);
    } else {
      setItemSubCategoryText('');
    }
  };

  const logAndSetItemMarks = (value: string) => {
    console.log('Item Marks changed:', value);
    setItemMarks(value);
  };

  const logAndSetUnit = (value: string) => {
    console.log('Unit changed:', value);
    setUnit(value);
  };

  const logAndSetToDate = (date: Date) => {
    console.log('To Date changed:', date);
    setToDate(date);
    setIsDateSelected(true);
  };

  const logAndSetQtyLessThan = (value: string) => {
    console.log('Qty Less Than changed:', value);
    setQtyLessThan(value);
  };

  const logAndSetReportType = (value: string) => {
    console.log('Report Type changed:', value);
    setReportType(value);
    setStockData([]);
    setTotalRecords(0);
  };

  // Handle item expansion/collapse
  const toggleItemExpansion = (id: string) => {
    setExpandedItemId(expandedItemId === id ? null : id);
  };

  // Scroll to results section when data loads
  useEffect(() => {
    if (stockData.length > 0) {
      // Set scrolling indicator
      setIsScrollingToResults(true);
      
      // Give a short delay to ensure the results are rendered
      setTimeout(() => {
        if (resultsRef.current) {
          // Find the y-position of the results section and scroll to it
          resultsRef.current.measure((x, y, width, height, pageX, pageY) => {
            scrollViewRef.current?.scrollTo({y: pageY - 50, animated: true});
            
            // Reset scrolling indicator after animation completes
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

        // Get customer ID from AsyncStorage
        const customerID = await AsyncStorage.getItem('customerID');
        if (!customerID) {
          console.error('Customer ID not found');
          return;
        }

        // Use POST request with CustomerID in the body
        const response = await axios.post(
          API_ENDPOINTS.ITEM_CATEGORIES,
          {CustomerID: customerID},
          {headers: DEFAULT_HEADERS},
        );

        // Check if response has the expected format
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

  // Add useEffect to fetch display name
  useEffect(() => {
    const fetchDisplayName = async () => {
      try {
        const name = await AsyncStorage.getItem('Disp_name');
        if (name) {
          setDisplayName(name);
          setCustomerName(name); // Set customer name to display name by default
          console.log('Display name set from AsyncStorage:', name);
        }
      } catch (error) {
        console.error('Error fetching display name:', error);
      }
    };
    fetchDisplayName();
  }, []);

  const customerOptions: DropdownOption[] = [
    {label: '--SELECT--', value: ''},
    {label: displayName, value: displayName},
  ];

  // Update item subcategory options to use API data
  const itemSubCategoryOptions = subCategories
    .slice() // Create a copy of the array to avoid mutating the original
    .sort((a, b) => a.SUBCATDESC.localeCompare(b.SUBCATDESC)) // Sort alphabetically by SUBCATDESC
    .map(item => ({
      label: item.SUBCATDESC,
      value: item.SUBCATID.toString(),
    }));

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

  const handleSearch = async () => {
    // Reset previous data
    setErrorMessage(null);
    setInfoMessage(null);
    setIsScrollingToResults(true);

    try {
      setIsLoading(true);

      // Prepare the request payload
      const payload = {
        customerName: customerName || null,
        lotNo: lotNo ? Number(lotNo) : null,
        vakalNo: vakalNo || null,
        itemSubCategory: itemSubCategoryText || null,
        itemMarks: itemMarks || null,
        unit: unit || null,
        toDate: formatApiDate(toDate),
        qtyLessThan: qtyLessThan ? Number(qtyLessThan) : null,
      };

      console.log('=============================================');
      console.log('SEARCH INITIATED WITH THE FOLLOWING VALUES:');
      console.log('Customer Name:', customerName);
      console.log('Lot No:', lotNo);
      console.log('Vakal No:', vakalNo);
      console.log('Item Sub Category (IDs):', itemSubCategory);
      console.log('Item Sub Category (Text):', itemSubCategoryText);
      console.log('Item Marks:', itemMarks);
      console.log('Unit:', unit);
      console.log('To Date:', formatApiDate(toDate));
      console.log('Qty Less Than:', qtyLessThan);
      console.log('Report Type:', reportType);
      console.log('=============================================');
      console.log('FINAL API PAYLOAD:', JSON.stringify(payload, null, 2));
      console.log('=============================================');

      // Determine which API endpoint to use based on reportType
      const apiEndpoint =
        reportType === 'summary'
          ? API_ENDPOINTS.GET_STOCK_ITEMWISE
          : reportType === 'fullSummary'
          ? API_ENDPOINTS.GET_STOCK_CATEGORYWISE
          : API_ENDPOINTS.GET_STOCK_REPORT;

      console.log(`Using API endpoint: ${apiEndpoint}`);

      // Make the API call using axios
      const response = await axios.post(apiEndpoint, payload, {
        headers: DEFAULT_HEADERS,
      });

      // Log the API response
      console.log('API Response:');
      console.log(JSON.stringify(response.data, null, 2));

      // With axios, the data is already parsed from JSON
      const result = response.data;

      if (result.status === 'success') {
        setStockData(result.data);
        setTotalRecords(result.recordCount);
        setInfoMessage(result.message);

        // Log more detailed data
        console.log('Stock data records:', result.recordCount);
        if (result.data.length > 0) {
          console.log('First record sample:');
          console.log(JSON.stringify(result.data[0], null, 2));
        } else {
          console.log('No records found');
        }
      } else {
        throw new Error(result.message || 'Failed to fetch stock report data');
      }
    } catch (error) {
      console.error('Error fetching stock report:', error);
      // Axios specific error handling
      const axiosError = error as AxiosError<ErrorResponse>;
      if (axiosError.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
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
        // The request was made but no response was received
        console.error('No response received:', axiosError.request);
        setErrorMessage(
          'No response from server. Please check your network connection.',
        );
      } else {
        // Something happened in setting up the request that triggered an Error
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
    setCustomerName('');
    setLotNo('');
    setVakalNo('');
    setItemSubCategory([]);
    setItemSubCategoryText('');
    setItemMarks('');
    setUnit('');
    setToDate(null);
    setIsDateSelected(false);
    setQtyLessThan('');
    setReportType('details');
    setStockData([]);
    setErrorMessage(null);
    setInfoMessage(null);
    setTotalRecords(0);
    setIsScrollingToResults(false);
  };

  const handleDownload = () => {
    console.log('Download as Pdf');
    // This would need to be implemented for actual Excel download
  };

  // Handle date change
  const onToDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowToDatePicker(false);
    }

    if (selectedDate) {
      console.log(
        `To date changing from ${
          toDate?.toISOString() || 'null'
        } to ${selectedDate.toISOString()}`,
      );

      // Set temp date for iOS
      setTempToDate(selectedDate);

      // For Android, update state immediately
      if (Platform.OS === 'android') {
        setToDate(selectedDate);
        setIsDateSelected(true);
        console.log('To date updated (Android)');
      }
    }
  };

  // Confirm date selection for iOS
  const confirmToDate = () => {
    console.log(`Confirming to date change to ${tempToDate.toISOString()}`);
    setToDate(tempToDate);
    setIsDateSelected(true);
    setShowToDatePicker(false);
    console.log('To date updated (iOS)');
  };

  // Render function based on report type
  const renderStockItem = ({item, index}: {item: any; index: number}) => {
    const itemId = `stock-${index}`;
    const isExpanded = expandedItemId === itemId;

    // Handle category-wise summary display
    if (reportType === 'fullSummary' && 'Item Sub Category' in item) {
      const categoryItem = item as CategoryWiseSummaryItem;
      return (
        <TouchableOpacity
          style={[
            styles.listItem,
            index % 2 === 0 ? styles.evenItem : styles.oddItem,
          ]}
          activeOpacity={1}>
          <View style={styles.mainRow}>
            <View style={styles.mainRowLeft}>
              <Text
                style={styles.itemName}
                numberOfLines={1}
                ellipsizeMode="tail">
                {categoryItem['Item Sub Category']}
              </Text>
            </View>
            <View style={styles.mainRowRight}>
              <Text
                style={[styles.dateText, styles.highlightText, {fontSize: 16}]}>
                {categoryItem['Net Qty']}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    // Handle item-wise summary display
    if (reportType === 'summary' && 'Item Name' in item) {
      const summaryItem = item as ItemWiseSummaryItem;
      return (
        <TouchableOpacity
          onPress={() => toggleItemExpansion(itemId)}
          style={[
            styles.listItem,
            index % 2 === 0 ? styles.evenItem : styles.oddItem,
          ]}
          activeOpacity={0.7}>
          <View style={styles.mainRow}>
            <View style={styles.mainRowLeft}>
              <View style={styles.itemNameRow}>
                <Text
                  style={styles.itemName}
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  {summaryItem['Item Name']}
                </Text>
                <Text style={styles.unitText}>{summaryItem['Unit Name']}</Text>
              </View>
              <Text style={styles.itemDetails}>
                <Text style={styles.detailLabel}>Description:</Text>{' '}
                <Text style={styles.detailValue}>
                  {summaryItem['Description'] || '-'}
                </Text>{' '}
                |<Text style={styles.detailLabel}> Qty:</Text>{' '}
                <Text style={styles.highlightText}>
                  {summaryItem['Net Qty']}
                </Text>
              </Text>
            </View>
            {/* <View
 style={[
 styles.mainRowRight,
 {alignItems: 'flex-end', paddingTop: 25},
 ]}>
 <View style={styles.expandIconContainer}>
 <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
 </View>
 </View> */}
          </View>

          {/* {isExpanded && (
 <View style={styles.expandedDetails}>
 <View style={styles.detailRow}>
 <View style={styles.detailColumn}>
 <Text style={styles.detailLabel}>Description:</Text>
 <Text style={styles.detailValue}>
 {summaryItem['Description'] || '-'}
 </Text>
 </View>
 </View>
 </View>
 )} */}
        </TouchableOpacity>
      );
    }

    // The original details display for "details" report type
    return (
      <TouchableOpacity
        onPress={() => toggleItemExpansion(itemId)}
        style={[
          styles.listItem,
          index % 2 === 0 ? styles.evenItem : styles.oddItem,
        ]}
        activeOpacity={0.7}>
        {/* Main row - always visible */}
        <View style={styles.mainRow}>
          <View style={styles.mainRowLeft}>
            <Text
              style={styles.itemName}
              numberOfLines={1}
              ellipsizeMode="tail">
              {item['Item Description']}
            </Text>
            <Text style={styles.itemDetails}>
              <Text style={styles.detailLabel}>Lot:</Text>{' '}
              <Text style={styles.highlightText}>{item['Lot No']}</Text> |
              <Text style={styles.detailLabel}> Qty:</Text>{' '}
              <Text style={styles.highlightText}>{item['Net qty']}</Text>
            </Text>
            <Text style={styles.dateText}>{item['Inward Dt']}</Text>
          </View>
          <View style={styles.mainRowRight}>
            <View style={styles.expandIconContainer}>
              <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
            </View>
          </View>
        </View>

        {/* Expanded details - only visible when expanded */}
        {isExpanded && (
          <View style={styles.expandedDetails}>
            <View style={styles.detailRow}>
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabel}>Inward No:</Text>
                <Text style={styles.detailValue}>{item['Inward No']}</Text>
              </View>
              {/* <View style={styles.detailColumn}>
 <Text style={styles.detailLabel}>Customer:</Text>
 <Text style={styles.detailValue}>{item['Customer Name']}</Text>
 </View> */}
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabel}>Unit:</Text>
                <Text style={styles.detailValue}>
                  {item['Unit'].split('(')[0]}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabel}>Item Mark:</Text>
                <Text style={styles.detailValue}>
                  {item['Item Mark'] || '-'}
                </Text>
              </View>
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabel}>Vakkal:</Text>
                <Text style={styles.detailValue}>{item['Vakkal'] || '-'}</Text>
              </View>
            </View>

            {/* <View style={styles.detailRow}></View> */}
          </View>
        )}
      </TouchableOpacity>
    );
  };

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
              <CustomDropdown
                options={unitOptions}
                selectedValue={unit}
                onSelect={logAndSetUnit}
                placeholder="--SELECT--"
              />
            </View>
          </View>

          <View style={styles.formRow}>
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
                    isDateSelected ? styles.dateText : styles.placeholderText
                  }>
                  {isDateSelected ? formatDisplayDate(toDate) : 'DD/MM/YYYY'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formColumn}>
              <Text style={styles.label}>Qty Less Than</Text>
              <TextInput
                style={styles.input}
                value={qtyLessThan}
                onChangeText={logAndSetQtyLessThan}
                keyboardType="numeric"
                placeholder=""
              />
            </View>
          </View>

          <View style={styles.typeSection}>
            <Text style={styles.reportTypeLabel}>Report Type</Text>
            <View style={styles.radioGroupContainer}>
              <RadioGroup
                options={reportTypeOptions}
                selectedValue={reportType}
                onSelect={logAndSetReportType}
              />
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

            {/* <TouchableOpacity
 style={styles.downloadButton}
 onPress={handleDownload}>
 <Text style={styles.buttonText}>Download As PDF</Text>
 </TouchableOpacity> */}
          </View>

          {/* Scrolling indicator */}
          {isLoading && stockData.length === 0 && (
            <View style={styles.scrollIndicatorContainer}>
              <Text style={styles.scrollIndicatorText}>Loading results...</Text>
              <Text style={styles.scrollIndicatorArrow}>↓</Text>
            </View>
          )}

          {/* Results count and info message - centered with reduced width */}
          {stockData.length > 0 && (
            <View 
              ref={resultsRef}
              style={styles.resultInfoContainer}
            >
              <View style={styles.resultInfo}>
                {isScrollingToResults && (
                  <ActivityIndicator size="small" color="#E87830" style={{marginBottom: 5}} />
                )}
                <Text style={styles.resultCount}>
                  Total records: {totalRecords}
                </Text>
                {infoMessage && (
                  <Text style={styles.infoMessage}>{infoMessage}</Text>
                )}
              </View>
            </View>
          )}

          {/* Simplified list view with expandable details - now full width */}
          {stockData.length > 0 ? (
            <FlatList
              data={stockData}
              renderItem={renderStockItem}
              keyExtractor={(item, index) => `stock-${index}`}
              scrollEnabled={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.listContent}
            />
          ) : (
            !isLoading &&
            !errorMessage && (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>
                  No stock data available. Try adjusting your search criteria.
                </Text>
              </View>
            )
          )}

          {/* Loading indicator */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#E87830" />
              <Text style={styles.loadingText}>Loading stock report...</Text>
            </View>
          )}

          {/* Error message */}
          {errorMessage && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Date Picker Modals */}
          {Platform.OS === 'ios' ? (
            // iOS date picker modal
            <>
              {showToDatePicker && (
                <Modal
                  transparent={true}
                  animationType="fade"
                  visible={showToDatePicker}>
                  <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                      <Text style={styles.modalTitle}>Select Date</Text>

                      <DateTimePicker
                        value={tempToDate}
                        mode="date"
                        display="spinner"
                        onChange={onToDateChange}
                        style={styles.iosDatePicker}
                        minimumDate={new Date(2020, 0, 1)}
                        maximumDate={new Date()}
                        textColor="#000000"
                      />

                      <View style={styles.modalButtons}>
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
                    </View>
                  </View>
                </Modal>
              )}
            </>
          ) : (
            // Android date picker
            <>
              {showToDatePicker && (
                <DateTimePicker
                  value={tempToDate}
                  mode="date"
                  is24Hour={true}
                  display="default"
                  onChange={onToDateChange}
                  minimumDate={new Date(2020, 0, 1)}
                  maximumDate={new Date()}
                />
              )}
            </>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>
    </LayoutWrapper>
  );
};

const styles = StyleSheet.create({
  // Base container styles
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 3,
  },
  contentContainer: {
    paddingBottom: 24,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 9,
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
    color: '#E87830',
  },
  // Form styles
  formRow: {
    flexDirection: 'row',
    marginBottom: 14,
    justifyContent: 'space-between',
    paddingHorizontal: 12,
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
  typeSection: {
    marginVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingVertical: 12,
  },
  radioGroupContainer: {
    marginTop: 8,
    backgroundColor: '#f7f7f7',
    borderRadius: 4,
    padding: 8,
  },

  // Button styles
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#E87830',
    padding: 12,
    borderRadius: 4,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButton: {
    marginRight: 10,
  },
  clearButton: {
    marginLeft: 10,
  },
  downloadButton: {
    backgroundColor: '#E87830',
    padding: 12,
    borderRadius: 4,
    minWidth: 150,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },

  // Results info container
  resultInfoContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  resultInfo: {
    width: '55%', // Reduced width
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#E87830',
    alignItems: 'center', // Center text content
  },
  resultCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center', // Center the text
  },
  infoMessage: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center', // Center the text
  },

  // List styles
  listContent: {
    width: '100%',
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  listItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    width: '100%',
    marginVertical: 4,
    backgroundColor: '#fff',
    borderRadius: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 1,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  evenItem: {
    backgroundColor: '#fff',
  },
  oddItem: {
    backgroundColor: '#fafafa',
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  mainRowLeft: {
    flex: 3,
    paddingRight: 10,
  },
  mainRowRight: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  itemDetails: {
    fontSize: 14,
    color: '#666',
  },
  highlightText: {
    color: '#E87830',
    fontWeight: '500',
  },
  dateText: {
    fontSize: 14,
    color: '#333',
    paddingVertical: 4,
    marginTop: 2,
    fontStyle: 'normal',
  },
  expandIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandIcon: {
    fontSize: 12,
    color: '#666',
  },
  expandedDetails: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    width: '100%',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 10,
    width: '100%',
  },
  detailColumn: {
    flex: 1,
    paddingRight: 10,
  },
  detailLabel: {
    fontSize: 13,
    color: '#777',
    marginBottom: 3,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    color: '#333',
  },

  // Status messages
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#ffdddd',
    borderRadius: 8,
    marginVertical: 16,
    marginHorizontal: 12,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 16,
  },
  noDataContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    marginVertical: 20,
    marginHorizontal: 12,
    borderRadius: 8,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  // Dropdown styles
  dropdownContainer: {
    position: 'relative',
  },
  dropdownButton: {
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
    color: '#94A3B8',
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
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  iosDatePicker: {
    width: '100%',
    height: 180,
    backgroundColor: '#ffffff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 6,
    marginRight: 8,
    alignItems: 'center',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#E87830',
    padding: 12,
    borderRadius: 6,
    marginLeft: 8,
    alignItems: 'center',
  },
  radioContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
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
    fontSize: 15,
    color: '#333',
  },
  itemNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 6,
  },
  unitText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
  },
  reportTypeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E87830',
    marginBottom: 8,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    paddingHorizontal: 12,
  },
  dropdownLoadingText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#E87830',
  },
  // Dropdown component styles - add these back
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
  placeholderText: {
    fontSize: 14,
    color: '#94A3B8',
    flex: 1,
  },
  scrollIndicatorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    padding: 5,
  },
  scrollIndicatorText: {
    fontSize: 14,
    color: '#E87830',
    marginBottom: 5,
  },
  scrollIndicatorArrow: {
    fontSize: 24,
    color: '#E87830',
    fontWeight: 'bold',
  },
});

export default StockReportScreen;
