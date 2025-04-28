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
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import axios, {AxiosError} from 'axios';
import {API_ENDPOINTS, DEFAULT_HEADERS} from '../../config/api.config';

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

interface StockReportItem {
  "Customer Name": string;
  "Inward Dt": string;
  "Unit": string;
  "Inward No": string;
  "Item Description": string;
  "Item Mark": string;
  "Vakkal": string;
  "Lot No": string | number;
  "Net qty": number;
}

interface ItemWiseSummaryItem {
  "Customer Name": string;
  "Unit Name": string;
  "Item Name": string;
  "Description": string;
  "Net Qty": number;
}

interface CategoryWiseSummaryItem {
  "Customer Name": string;
  "Item Sub Category": string;
  "Net Qty": number;
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
  const [customerName, setCustomerName] = useState('');
  const [lotNo, setLotNo] = useState('');
  const [vakalNo, setVakalNo] = useState('');
  const [itemSubCategory, setItemSubCategory] = useState('');
  const [itemMarks, setItemMarks] = useState('');
  const [unit, setUnit] = useState('');
  const [toDate, setToDate] = useState('09/04/2025');
  const [qtyLessThan, setQtyLessThan] = useState('');
  const [reportType, setReportType] = useState('details');
  
  // New state variables for API integration
  const [isLoading, setIsLoading] = useState(false);
  const [stockData, setStockData] = useState<(StockReportItem | ItemWiseSummaryItem | CategoryWiseSummaryItem)[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // New state for expanded item
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  
  // Handle item expansion/collapse
  const toggleItemExpansion = (id: string) => {
    setExpandedItemId(expandedItemId === id ? null : id);
  };

  const customerOptions: DropdownOption[] = [
    {label: '--SELECT--', value: ''},
    {label: 'Customer 1', value: 'customer1'},
    {label: 'Customer 2', value: 'customer2'},
    {label: 'Customer 3', value: 'customer3'},
    {label: 'UNICORP ENTERPRISES', value: 'UNICORP ENTERPRISES'},
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

  const handleSearch = async () => {
    // Reset previous data
    setErrorMessage(null);
    setInfoMessage(null);
    
    try {
      setIsLoading(true);
      
      // Prepare the request payload
      const payload = {
        customerName: customerName || null,
        lotNo: lotNo ? Number(lotNo) : null,
        vakalNo: vakalNo || null,
        itemSubCategory: itemSubCategory || null,
        itemMarks: itemMarks || null,
        unit: unit || null,
        toDate: toDate || null,
        qtyLessThan: qtyLessThan ? Number(qtyLessThan) : null
      };
      
      console.log(`Preparing to fetch ${reportType} report with payload:`, payload);
      
      // Determine which API endpoint to use based on reportType
      const apiEndpoint = reportType === 'summary' 
        ? API_ENDPOINTS.GET_STOCK_ITEMWISE 
        : reportType === 'fullSummary' 
          ? API_ENDPOINTS.GET_STOCK_CATEGORYWISE 
          : API_ENDPOINTS.GET_STOCK_REPORT;
      
      console.log(`Using API endpoint: ${apiEndpoint}`);
      
      // Make the API call using axios
      const response = await axios.post(
        apiEndpoint,
        payload,
        { headers: DEFAULT_HEADERS }
      );
      
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
        console.error('Server response error:', axiosError.response.status, axiosError.response.data);
        const errorMsg = axiosError.response.data?.message || 'Server error';
        setErrorMessage(`Server error: ${axiosError.response.status}. ${errorMsg}`);
      } else if (axiosError.request) {
        // The request was made but no response was received
        console.error('No response received:', axiosError.request);
        setErrorMessage('No response from server. Please check your network connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setErrorMessage(axiosError.message || 'An unknown error occurred');
      }
      setStockData([]);
      setTotalRecords(0);
    } finally {
      setIsLoading(false);
    }
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
    setStockData([]);
    setErrorMessage(null);
    setInfoMessage(null);
    setTotalRecords(0);
  };

  const handleDownload = () => {
    console.log('Download as Excel');
    // This would need to be implemented for actual Excel download
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
          style={[styles.listItem, index % 2 === 0 ? styles.evenItem : styles.oddItem]}
          activeOpacity={1}
        >
          <View style={styles.mainRow}>
            <View style={styles.mainRowLeft}>
              <Text style={styles.itemName} numberOfLines={1} ellipsizeMode="tail">
                {categoryItem["Item Sub Category"]}
              </Text>
              <Text style={styles.itemDetails}>
                <Text style={styles.detailLabel}>Customer:</Text> <Text style={styles.highlightText}>{categoryItem["Customer Name"]}</Text>
              </Text>
            </View>
            <View style={styles.mainRowRight}>
              <Text style={[styles.dateText, styles.highlightText, { fontSize: 16 }]}>
                {categoryItem["Net Qty"]}
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
          style={[styles.listItem, index % 2 === 0 ? styles.evenItem : styles.oddItem]}
          activeOpacity={0.7}
        >
          <View style={styles.mainRow}>
            <View style={styles.mainRowLeft}>
              <View style={styles.itemNameRow}>
                <Text style={styles.itemName} numberOfLines={1} ellipsizeMode="tail">
                  {summaryItem["Item Name"]}
                </Text>
                <Text style={styles.unitText}>
                  {summaryItem["Unit Name"]}
                </Text>
              </View>
              <Text style={styles.itemDetails}>
                <Text style={styles.detailLabel}>Customer:</Text> <Text style={styles.highlightText}>{summaryItem["Customer Name"]}</Text> | 
                <Text style={styles.detailLabel}> Qty:</Text> <Text style={styles.highlightText}>{summaryItem["Net Qty"]}</Text>
              </Text>
            </View>
            <View style={[styles.mainRowRight, { alignItems: 'flex-end', paddingTop: 25 }]}>
              <View style={styles.expandIconContainer}>
                <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
              </View>
            </View>
          </View>
          
          {isExpanded && (
            <View style={styles.expandedDetails}>
              <View style={styles.detailRow}>
                <View style={styles.detailColumn}>
                  <Text style={styles.detailLabel}>Description:</Text>
                  <Text style={styles.detailValue}>{summaryItem["Description"] || '-'}</Text>
                </View>
              </View>
            </View>
          )}
        </TouchableOpacity>
      );
    }
    
    // The original details display for "details" report type
    return (
      <TouchableOpacity 
        onPress={() => toggleItemExpansion(itemId)}
        style={[styles.listItem, index % 2 === 0 ? styles.evenItem : styles.oddItem]}
        activeOpacity={0.7}
      >
        {/* Main row - always visible */}
        <View style={styles.mainRow}>
          <View style={styles.mainRowLeft}>
            <Text style={styles.itemName} numberOfLines={1} ellipsizeMode="tail">
              {item["Item Description"]}
            </Text>
            <Text style={styles.itemDetails}>
              <Text style={styles.detailLabel}>Lot:</Text> <Text style={styles.highlightText}>{item["Lot No"]}</Text> | 
              <Text style={styles.detailLabel}> Qty:</Text> <Text style={styles.highlightText}>{item["Net qty"]}</Text>
            </Text>
          </View>
          <View style={styles.mainRowRight}>
            <Text style={styles.dateText}>{item["Inward Dt"]}</Text>
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
                <Text style={styles.detailLabel}>Customer:</Text>
                <Text style={styles.detailValue}>{item["Customer Name"]}</Text>
              </View>
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabel}>Unit:</Text>
                <Text style={styles.detailValue}>{item["Unit"].split('(')[0]}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabel}>Inward No:</Text>
                <Text style={styles.detailValue}>{item["Inward No"]}</Text>
              </View>
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabel}>Item Mark:</Text>
                <Text style={styles.detailValue}>{item["Item Mark"] || '-'}</Text>
              </View>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailColumn}>
                <Text style={styles.detailLabel}>Vakkal:</Text>
                <Text style={styles.detailValue}>{item["Vakkal"] || '-'}</Text>
              </View>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Form header */}
      <Text style={styles.screenTitle}>Stock Report</Text>

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
        <Text style={styles.reportTypeLabel}>Report Type</Text>
        <View style={styles.radioGroupContainer}>
          <RadioGroup
            options={reportTypeOptions}
            selectedValue={reportType}
            onSelect={setReportType}
          />
        </View>
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

      {/* Results count and info message - centered with reduced width */}
      {stockData.length > 0 && (
        <View style={styles.resultInfoContainer}>
          <View style={styles.resultInfo}>
            <Text style={styles.resultCount}>Total records: {totalRecords}</Text>
            {infoMessage && <Text style={styles.infoMessage}>{infoMessage}</Text>}
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
          contentContainerStyle={styles.listContent}
        />
      ) : !isLoading && !errorMessage && (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No stock data available. Try adjusting your search criteria.</Text>
        </View>
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // Base container styles
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    paddingBottom: 24,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#E87830',
    textAlign: 'center',
    marginVertical: 16,
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
    height: 44,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
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
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 24,
  },
  searchButton: {
    backgroundColor: '#E87830',
    padding: 12,
    borderRadius: 4,
    marginRight: 7,
    minWidth: 90,
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#E87830',
    padding: 12,
    borderRadius: 4,
    marginRight: 7,
    minWidth: 90,
    alignItems: 'center',
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
        shadowOffset: { width: 0, height: 1 },
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
    fontSize: 13,
    color: '#666',
    marginRight: 10,
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
});

export default StockReportScreen;