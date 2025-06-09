import React, {useState, useEffect, useRef} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  TextInput,
  Modal,
  FlatList,
  Animated,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {Picker} from '@react-native-picker/picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ViewShot from 'react-native-view-shot';
import axios from 'axios';
import {useNavigation} from '@react-navigation/native';
// Custom components
import ReportTable from '../components/ReportTable';
import IOSPickerModal from '../components/IOSPickerModal';
import IOSDatePickerModal from '../components/IOSDatePickerModal';
import MultiSelect from '../components/Multiselect';
// Custom hooks
import {useReportData, ReportFilters} from '../hooks/useReportData';
import {usePdfGeneration} from '../hooks/usePdfGeneration';
// Initialize notifications
import PushNotification from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
// Utilities
import {openPdf} from '../utils/ReportPdfUtils';
// API constants
import {API_ENDPOINTS, DEFAULT_HEADERS} from '../config/api.config';
import {LayoutWrapper} from '../components/AppLayout';

// Time period types for the report
type TimePeriod = 'Weekly' | 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Custom';

// Interface for dropdown option
interface DropdownOption {
  label: string;
  value: string;
}

// Custom dropdown component props interface
interface CustomDropdownProps {
  options: DropdownOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  primaryColor?: string;
}

const InwardOutwardReportScreen = () => {
  // Get navigation
  const navigation = useNavigation<any>();
  const route = useState();
  // Mode state
  const [isInward, setIsInward] = useState(true);

  // Form states
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  const [showFromDatePicker, setShowFromDatePicker] = useState(false);
  const [showToDatePicker, setShowToDatePicker] = useState(false);
  // Change from single selection to arrays
  const [itemCategories, setItemCategories] = useState<string[]>([]);
  const [itemSubcategories, setItemSubcategories] = useState<string[]>([]);
  const [unit, setUnit] = useState<string[]>([]);
  // Additional state for IOSPickerModal compatibility
  const [unitString, setUnitString] = useState('');

  // Time period selection states
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('Custom');
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<string | null>(null);
  const [selectedHalf, setSelectedHalf] = useState<string | null>(null);
  const [financialYear, setFinancialYear] = useState('2025-2026');
  const [showFinancialYearSelector, setShowFinancialYearSelector] =
    useState(false);

  // UI states
  const [showReport, setShowReport] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [isReportLoading, setIsReportLoading] = useState(false);
  // Add local report data state
  const [localReportData, setLocalReportData] = useState<any[]>([]);

  // Modal visibility state for iOS pickers
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [currentPicker, setCurrentPicker] = useState('');

  // Sample data for units dropdown
  const units = ['D-39', 'D-514'];

  // Refs
  const tableRef = useRef<ScrollView>(null);
  const viewshotRef = useRef(null);

  // Add state for custom alert
  const [showCustomAlert, setShowCustomAlert] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'error' | 'warning' | 'info' | 'success'>('info');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Handler for Inward/Outward No cell press
  const handleInwardOutwardNoPress = (item: any) => {
    if (isInward && item.GRN_NO) {
      // For inward items, navigate to GrnDetailsScreen with the GRN_NO
      console.log('Navigating to GrnDetailsScreen with GRN_NO:', item.GRN_NO);
      // Pass all the item data to the detail screen
      navigation.navigate('GrnDetailsScreen', {
        grnNo: item.GRN_NO,
        item: item,
        customerId: item.CUSTOMER_ID,
      });
    } else if (!isInward && item.OUTWARD_NO) {
      // For outward items, navigate to OutwardDetailsScreen with the OUTWARD_NO
      console.log('Navigating to OutwardDetailsScreen with OUTWARD_NO:', item.OUTWARD_NO);
      // Pass all the item data to the detail screen
      navigation.navigate('OutwardDetailsScreen', {
        outwardNo: item.OUTWARD_NO,
        item: item,
        customerId: item.CUSTOMER_ID,
      });
    }
  };

  // Custom dropdown component defined inside the main component
  // to access the isInward state
  const CustomDropdown = ({
    options,
    selectedValue,
    onSelect,
    placeholder,
    disabled = false,
    primaryColor,
  }: CustomDropdownProps) => {
    const [isVisible, setIsVisible] = useState(false);

    // Use the isInward state if primaryColor is not provided
    const color = primaryColor || (isInward ? '#F48221' : '#4682B4');

    const selectedOption = options.find(
      option => option.value === selectedValue,
    );
    const displayText = selectedOption ? selectedOption.label : placeholder;

    return (
      <View
        style={[
          styles.customDropdownContainer,
          disabled && styles.disabledDropdown,
        ]}>
        <TouchableOpacity
          style={styles.customDropdownButton}
          onPress={() => !disabled && setIsVisible(true)}
          disabled={disabled}>
          <Text
            style={
              selectedOption
                ? styles.customDropdownSelectedText
                : styles.customDropdownPlaceholderText
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
          animationType="fade"
          onRequestClose={() => setIsVisible(false)}>
          <TouchableOpacity
            style={styles.customModalOverlay}
            activeOpacity={1}
            onPress={() => setIsVisible(false)}>
            <View style={styles.customModalContent}>
              <FlatList
                data={options}
                keyExtractor={(item, index) => `${item.value}-${index}`}
                style={{width: '100%'}}
                renderItem={({item}) => (
                  <TouchableOpacity
                    style={[
                      styles.customOptionItem,
                      selectedValue === item.value && {
                        backgroundColor: '#f4f4f4',
                      },
                    ]}
                    onPress={() => {
                      onSelect(item.value);
                      setIsVisible(false);
                    }}>
                    <Text
                      style={[
                        styles.customOptionText,
                        selectedValue === item.value && {
                          color,
                          fontWeight: '500',
                        },
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

  // Use custom hooks
  const {
    apiCategories,
    apiSubcategories,
    reportData,
    customerName,
    loading,
    isReportLoading: hookReportLoading,
    isSearching,
    fetchReport,
    formatDate,
    formatDateForFilename,
  } = useReportData({isInward});

  const {
    pdfGenerating: isPdfDownloading,
    downloadProgress,
    statusMessage,
    generatePdf,
    updateProgressUI,
  } = usePdfGeneration({isInward});

  // Helper function to get icon based on alert type
  const getAlertIcon = () => {
    switch (alertType) {
      case 'error':
        return <MaterialIcons name="error-outline" size={28} color="#E53E3E" />;
      case 'warning':
        return <MaterialIcons name="warning" size={28} color="#DD6B20" />;
      case 'success':
        return <MaterialIcons name="check-circle" size={28} color="#38A169" />;
      case 'info':
      default:
        return <MaterialIcons name="info" size={28} color="#3182CE" />;
    }
  };

  // Custom Alert Component with enhanced styling
  const CustomAlert = () => {
    useEffect(() => {
      if (showCustomAlert) {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else {
        fadeAnim.setValue(0);
      }
    }, [showCustomAlert]);

    if (!showCustomAlert) return null;

    const alertColor = (() => {
      switch (alertType) {
        case 'error': return '#FED7D7';
        case 'warning': return '#FEEBC8';
        case 'success': return '#C6F6D5';
        case 'info': default: return '#BEE3F8';
      }
    })();

    const isRequiredFieldAlert = alertTitle === 'Required Field Missing';

    return (
      <Modal
        transparent={true}
        animationType="none"
        visible={showCustomAlert}
        onRequestClose={() => setShowCustomAlert(false)}>
        <View style={styles.alertOverlay}>
          <Animated.View
            style={[
              styles.alertContainer,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
              },
              isInward ? styles.inwardAlert : styles.outwardAlert,
            ]}>
            <View style={[styles.alertHeader, { backgroundColor: alertColor }]}>
              <View style={styles.alertTitleContainer}>
                {getAlertIcon()}
                <Text style={styles.alertTitle}>{alertTitle}</Text>
              </View>
            </View>
            <View style={styles.alertBody}>
              <Text style={styles.alertMessage}>{alertMessage}</Text>
         
            </View>
            <View style={styles.alertButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.alertButton,
                  isInward ? styles.inwardAlertButton : styles.outwardAlertButton,
                ]}
                onPress={() => setShowCustomAlert(false)}>
                <Text 
                  style={[
                    styles.alertButtonText,
                    { color: isInward ? '#F48221' : '#4682B4' }
                  ]}>
                  OK
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  // Show custom alert helper function with type parameter
  const showAlert = (title: string, message: string, type: 'error' | 'warning' | 'info' | 'success' = 'info') => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setShowCustomAlert(true);
  };

  // Validate inputs before search
  const validateInputs = (): boolean => {
    // Check if unit is selected
    if (unit.length === 0) {
      showAlert(
        'Required Field Missing',
        'Please select a Unit to continue.',
        'warning'
      );
      return false;
    }
    
    // Simple validation example
    if (fromDate > toDate) {
      showAlert('Invalid Date Range', 'From date cannot be after To date', 'error');
      return false;
    }
    return true;
  };

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

  // Helper function to show picker modal (for iOS)
  const openPicker = (pickerName: string) => {
    setCurrentPicker(pickerName);
    setIsPickerVisible(true);
  };

  // Handle clear button
  const handleClear = () => {
    setFromDate(new Date());
    setToDate(new Date());
    setItemCategories([]);
    setItemSubcategories([]);
    setUnit([]);
    setUnitString('');
    setTimePeriod('Custom');
    setSelectedWeek(null);
    setSelectedMonth(null);
    setSelectedQuarter(null);
    setSelectedHalf(null);
  };

  // Helper function to set dates based on the selected time period
  const setDatesByTimePeriod = (period: TimePeriod) => {
    // If clicking the same period that's already selected, toggle it off (set to Custom)
    if (period === timePeriod) {
      setTimePeriod('Custom');
      return;
    }

    setTimePeriod(period);

    // Reset all specific period selections when changing period type
    setSelectedWeek(null);
    setSelectedMonth(null);
    setSelectedQuarter(null);
    setSelectedHalf(null);

    // Default to current dates when switching periods
    const today = new Date();

    switch (period) {
      case 'Weekly':
        // Initialize to dates based on current month/year or set defaults

        // If current month/year not already set, initialize them
        if (!currentMonth || !currentYear) {
          // Default to current month, or January of financial year
          setCurrentMonth(new Date().getMonth());
          setCurrentYear(parseInt(financialYear));
        }

        // Default to first week of current month
        const weekStart = new Date(currentYear, currentMonth, 1);
        // Adjust to start on Sunday
        const dayOfWeek = weekStart.getDay();
        if (dayOfWeek !== 0) {
          weekStart.setDate(weekStart.getDate() + (7 - dayOfWeek));
        }

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        setFromDate(weekStart);
        setToDate(weekEnd);
        break;

      case 'Monthly':
        // Default to current month
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          0,
        );

        setFromDate(startOfMonth);
        setToDate(endOfMonth);
        break;

      case 'Quarterly':
        // Default to current quarter
        const currentQuarter = Math.floor(today.getMonth() / 3);
        const startOfQuarter = new Date(
          today.getFullYear(),
          currentQuarter * 3,
          1,
        );
        const endOfQuarter = new Date(
          today.getFullYear(),
          (currentQuarter + 1) * 3,
          0,
        );

        setFromDate(startOfQuarter);
        setToDate(endOfQuarter);
        break;

      case 'Half-Yearly':
        // Default to current half year (Apr-Sep or Oct-Mar for fiscal year)
        const isFirstHalf = today.getMonth() >= 3 && today.getMonth() < 9; // Apr-Sep is first half
        const startMonth = isFirstHalf ? 3 : 9; // Apr or Oct
        const endMonth = isFirstHalf ? 8 : 2; // Sep or Mar of next year
        const startYear = today.getFullYear();
        const endYear = isFirstHalf ? startYear : startYear + 1;

        const startOfHalf = new Date(startYear, startMonth, 1);
        const endOfHalf = new Date(endYear, endMonth + 1, 0);

        setFromDate(startOfHalf);
        setToDate(endOfHalf);
        break;

      case 'Custom':
        // Keep current date selections
        break;
    }
  };

  // Handle selection of a specific week
  const handleWeekSelection = (
    weekNumber: number,
    startDate: Date,
    endDate: Date,
  ) => {
    // Format week string: "Week X: Apr 1-7"
    const month = startDate.toLocaleString('default', {month: 'short'});
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    const weekString = `Week ${weekNumber}`;

    setSelectedWeek(weekString);
    setFromDate(startDate);
    setToDate(endDate);

    console.log(
      `Selected ${weekString}, from ${formatDate(startDate)} to ${formatDate(
        endDate,
      )}`,
    );
  };

  // Generate week dates for current month and year
  const generateWeekDates = () => {
    // Use the currentYear directly instead of parsing from financialYear
    const calendarYear = currentYear;

    // Get the first day of the month
    const firstDayOfMonth = new Date(calendarYear, currentMonth, 1);

    // Get the last day of the month
    const lastDayOfMonth = new Date(calendarYear, currentMonth + 1, 0);
    const lastDay = lastDayOfMonth.getDate();

    // Generate the weeks
    const weeks = [];
    let currentDay = 1;

    // Week 1: 1-7
    const week1Start = new Date(calendarYear, currentMonth, currentDay);
    const week1End = new Date(calendarYear, currentMonth, Math.min(7, lastDay));
    weeks.push({
      number: 1,
      startDate: week1Start,
      endDate: week1End,
      title: `Week 1`,
      label: `1-${Math.min(7, lastDay)}`,
    });
    currentDay = 8;

    // Week 2: 8-14
    if (currentDay <= lastDay) {
      const week2Start = new Date(calendarYear, currentMonth, currentDay);
      const week2End = new Date(
        calendarYear,
        currentMonth,
        Math.min(14, lastDay),
      );
      weeks.push({
        number: 2,
        startDate: week2Start,
        endDate: week2End,
        title: `Week 2`,
        label: `${currentDay}-${Math.min(14, lastDay)}`,
      });
      currentDay = 15;
    }

    // Week 3: 15-21
    if (currentDay <= lastDay) {
      const week3Start = new Date(calendarYear, currentMonth, currentDay);
      const week3End = new Date(
        calendarYear,
        currentMonth,
        Math.min(21, lastDay),
      );
      weeks.push({
        number: 3,
        startDate: week3Start,
        endDate: week3End,
        title: `Week 3`,
        label: `${currentDay}-${Math.min(21, lastDay)}`,
      });
      currentDay = 22;
    }

    // Week 4: 22-28
    if (currentDay <= lastDay) {
      const week4Start = new Date(calendarYear, currentMonth, currentDay);
      const week4End = new Date(
        calendarYear,
        currentMonth,
        Math.min(28, lastDay),
      );
      weeks.push({
        number: 4,
        startDate: week4Start,
        endDate: week4End,
        title: `Week 4`,
        label: `${currentDay}-${Math.min(28, lastDay)}`,
      });
      currentDay = 29;
    }

    // Week 5: 29-end of month (if needed)
    if (currentDay <= lastDay) {
      const week5Start = new Date(calendarYear, currentMonth, currentDay);
      const week5End = new Date(calendarYear, currentMonth, lastDay);
      weeks.push({
        number: 5,
        startDate: week5Start,
        endDate: week5End,
        title: `Week 5`,
        label: `${currentDay}-${lastDay}`,
      });
    }

    return weeks;
  };

  // Handle selection of a specific month
  const handleMonthSelection = (monthIndex: number) => {
    // Get the calendar year from the financial year (which is now just a single year)
    const calendarYear = parseInt(financialYear);

    const startOfMonth = new Date(calendarYear, monthIndex, 1);
    const endOfMonth = new Date(calendarYear, monthIndex + 1, 0);

    const monthName = startOfMonth.toLocaleString('default', {month: 'long'});
    setSelectedMonth(monthName);

    setFromDate(startOfMonth);
    setToDate(endOfMonth);

    console.log(
      `Selected ${monthName} ${calendarYear}, from ${formatDate(
        startOfMonth,
      )} to ${formatDate(endOfMonth)}`,
    );
  };

  // Handle selection of a specific quarter
  const handleQuarterSelection = (quarter: number) => {
    // Get the calendar year from the financial year (which is now just a single year)
    const calendarYear = parseInt(financialYear);

    // Calendar year quarters: Q1: Jan-Mar, Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec
    const quarterMonths = [
    
      {start: 3, end: 5}, // Q2: Apr-Jun
      {start: 6, end: 8}, // Q3: Jul-Sep
      {start: 9, end: 11}, // Q4: Oct-Dec
      {start: 0, end: 2}, // Q1: Jan-Mar
    ];

    const quarterData = quarterMonths[quarter - 1];
    const startOfQuarter = new Date(calendarYear, quarterData.start, 1);
    const endOfQuarter = new Date(calendarYear, quarterData.end + 1, 0);

    setSelectedQuarter(`Q${quarter}`);
    setFromDate(startOfQuarter);
    setToDate(endOfQuarter);

    console.log(
      `Selected Q${quarter}, from ${formatDate(startOfQuarter)} to ${formatDate(
        endOfQuarter,
      )}`,
    );
  };

  // Handle selection of half year
  const handleHalfYearSelection = (half: number) => {
    // Get the calendar year from the financial year (which is now just a single year)
    const calendarYear = parseInt(financialYear);

    if (half === 1) {
      // H1: Jan-Jun
      const startOfHalf = new Date(calendarYear, 0, 1); // Jan 1
      const endOfHalf = new Date(calendarYear, 5, 30); // Jun 30
      setSelectedHalf('H1(First Half)');
      setFromDate(startOfHalf);
      setToDate(endOfHalf);

      console.log(
        `Selected H1, from ${formatDate(startOfHalf)} to ${formatDate(
          endOfHalf,
        )}`,
      );
    } else {
      // H2: Jul-Dec
      const startOfHalf = new Date(calendarYear, 6, 1); // Jul 1
      const endOfHalf = new Date(calendarYear, 11, 31); // Dec 31
      setSelectedHalf('H2(Second Half)');
      setFromDate(startOfHalf);
      setToDate(endOfHalf);

      console.log(
        `Selected H2, from ${formatDate(startOfHalf)} to ${formatDate(
          endOfHalf,
        )}`,
      );
    }
  };

  // Handle selection of a full calendar year
  const handleYearSelection = (yearString: string) => {
    // setSelectedYear(yearString); // Removed since we no longer use Yearly option
    const calendarYear = parseInt(yearString);

    const startOfYear = new Date(calendarYear, 0, 1); // Jan 1
    const endOfYear = new Date(calendarYear, 11, 31); // Dec 31

    setFromDate(startOfYear);
    setToDate(endOfYear);

    console.log(
      `Selected Calendar Year ${yearString}, from ${formatDate(
        startOfYear,
      )} to ${formatDate(endOfYear)}`,
    );
  };

  // Handle search button
  const handleSearch = async () => {
    if (!validateInputs()) return;

    try {
      setIsReportLoading(true);
      setShowReport(true);
      setShowForm(false);
      setLocalReportData([]); // Clear previous data

      // Format dates for API (YYYY-MM-DD)
      const formatDateForApi = (date: Date) => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          '0',
        )}-${String(date.getDate()).padStart(2, '0')}`;
      };

      // Build request data with arrays for categories and subcategories
      const requestData: {
        fromDate: string;
        toDate: string;
        customerName: string;
        itemCategoryName: string[] | null;
        itemSubCategoryName: string[] | null;
        unitName: string[] | null; // Changed from string to string array
      } = {
        fromDate: formatDateForApi(fromDate),
        toDate: formatDateForApi(toDate),
        customerName: customerName, // Use customer name from state
        itemCategoryName: itemCategories.length > 0 ? itemCategories : null,
        itemSubCategoryName:
          itemSubcategories.length > 0 ? itemSubcategories : null,
        unitName: unit.length > 0 ? unit : null, // Changed to check array length
      };

      console.log('==== REQUEST DATA DETAILS ====');
      console.log('URL:', API_ENDPOINTS.GET_INWARD_REPORT);
      console.log('Request data stringified:', JSON.stringify(requestData));
      console.log('fromDate exact value:', requestData.fromDate);
      console.log('toDate exact value:', requestData.toDate);
      console.log('customerName exact value:', requestData.customerName);
      console.log(
        'itemCategoryName exact value:',
        requestData.itemCategoryName
          ? JSON.stringify(requestData.itemCategoryName)
          : null,
      );
      console.log(
        'itemSubCategoryName exact value:',
        requestData.itemSubCategoryName
          ? JSON.stringify(requestData.itemSubCategoryName)
          : null,
      );
      console.log('unitName exact value:', requestData.unitName);

      // Make API call
      const response = await axios.post(
        isInward
          ? API_ENDPOINTS.GET_INWARD_REPORT
          : API_ENDPOINTS.GET_OUTWARD_REPORT,
        requestData,
        {
          headers: DEFAULT_HEADERS,
        },
      );

      // Log structured response
      console.log(
        `====== ${
          isInward ? 'GET_INWARD_REPORT' : 'GET_OUTWARD_REPORT'
        } API RESPONSE START ======`,
      );
      console.log('Response status:', response.status);
      console.log(
        'Response headers:',
        JSON.stringify(response.headers, null, 2),
      );
      console.log('Response data:', JSON.stringify(response.data, null, 2));
      console.log('Success:', response.data?.success);
      console.log('Message:', response.data?.message);
      console.log('Data count:', response.data?.data?.length || 0);

      if (response.data?.data?.length > 0) {
        // Check sample record values (first record)
        const sampleRecord = response.data.data[0];
        console.log('Sample record field values:');
        console.log('- UNIT_NAME:', sampleRecord.UNIT_NAME);
        console.log('- GRN_DATE:', sampleRecord.GRN_DATE);
        console.log('- CUSTOMER_NAME:', sampleRecord.CUSTOMER_NAME);
        console.log('- ITEM_CATEG_NAME:', sampleRecord.ITEM_CATEG_NAME);
        console.log('- SUB_CATEGORY_NAME:', sampleRecord.SUB_CATEGORY_NAME);

        // Add additional logging for the problematic fields
        console.log('- ITEM_MARK:', sampleRecord.ITEM_MARK);
        console.log('- ITEM_MARKS:', sampleRecord.ITEM_MARKS);
        console.log('- VAKKAL_NO:', sampleRecord.VAKKAL_NO);
        console.log('- VAKAL_NO:', sampleRecord.VAKAL_NO);
        console.log('- QTY:', sampleRecord.QTY);
        console.log('- QUANTITY:', sampleRecord.QUANTITY);
        console.log('- DC_QTY:', sampleRecord.DC_QTY);

        // Log all field names in the sample record
        console.log(
          'All field names in sample record:',
          Object.keys(sampleRecord).join(', '),
        );

        // Modify client-side filtering to handle optional fields
        console.log('Filter matching check:');
        if (unit)
          console.log(
            '- Unit match:',
            sampleRecord.UNIT_NAME === requestData.unitName,
          );
        if (itemCategories.length > 0)
          console.log(
            '- Category match:',
            requestData.itemCategoryName &&
              requestData.itemCategoryName.includes(
                sampleRecord.ITEM_CATEG_NAME,
              ),
          );
        if (itemSubcategories.length > 0)
          console.log(
            '- Subcategory match:',
            requestData.itemSubCategoryName &&
              requestData.itemSubCategoryName.includes(
                sampleRecord.SUB_CATEGORY_NAME,
              ),
          );
        console.log(
          '- Customer match:',
          sampleRecord.CUSTOMER_NAME === requestData.customerName,
        );
      }

      console.log('====== GET_INWARD_REPORT API RESPONSE END ======');

      // Update client-side filtering to handle optional fields (null values)
      if (response.data && response.data.success) {
        // Filter the data based on provided filters only
        const filteredData = response.data.data.filter((item: any) => {
          // Always filter by customer name
          const customerMatch = item.CUSTOMER_NAME === requestData.customerName;

          // Only apply filters for fields that were provided (not null)
          const unitMatch =
            requestData.unitName === null ||
            (requestData.unitName && requestData.unitName.includes(item.UNIT_NAME));

          // Safe filtering for category and subcategory arrays
          const categoryMatch =
            !requestData.itemCategoryName ||
            (requestData.itemCategoryName &&
              requestData.itemCategoryName.includes(item.ITEM_CATEG_NAME));

          const subcategoryMatch =
            !requestData.itemSubCategoryName ||
            (requestData.itemSubCategoryName &&
              requestData.itemSubCategoryName.includes(item.SUB_CATEGORY_NAME));

          return (
            customerMatch && unitMatch && categoryMatch && subcategoryMatch
          );
        });

        console.log('Client-side filtered count:', filteredData.length);

        // Normalize field names to ensure consistent data structure
        const normalizedData = filteredData.map((item: any) => {
          // Create a new object with standardized property names
          const normalizedItem = {...item};

          // Normalize Item Mark field
          if (!normalizedItem.ITEM_MARK && normalizedItem.ITEM_MARKS) {
            normalizedItem.ITEM_MARK = normalizedItem.ITEM_MARKS;
          }

          // Normalize Vakkal No field
          if (!normalizedItem.VAKKAL_NO && normalizedItem.VAKAL_NO) {
            normalizedItem.VAKKAL_NO = normalizedItem.VAKAL_NO;
          }

          // Normalize Qty field
          if (!normalizedItem.QTY) {
            if (normalizedItem.QUANTITY) {
              normalizedItem.QTY = normalizedItem.QUANTITY;
            } else if (!isInward && normalizedItem.DC_QTY) {
              normalizedItem.QTY = normalizedItem.DC_QTY;
            }
          }

          return normalizedItem;
        });

        // Use the normalized filtered data
        setLocalReportData(normalizedData);

        if (normalizedData.length === 0) {
          showAlert('No Data', 'No records found for the selected criteria.', 'info');
        }
      } else {
        showAlert(
          'Error',
          response.data?.message || 'Failed to fetch report data.',
          'error'
        );
      }
    } catch (error) {
      console.error('Error fetching report data:', error);

      if (axios.isAxiosError(error)) {
        const errorMessage =
          (error as any).response?.data?.message || (error as Error).message;
        showAlert('Error', `Failed to fetch report: ${errorMessage}`, 'error');
      } else {
        showAlert('Error', 'An unexpected error occurred.', 'error');
      }
    } finally {
      setIsReportLoading(false);
    }
  };

  // Handle PDF download
  const handlePdfDownload = async () => {
    if (localReportData.length === 0) {
      showAlert('No Data', 'There is no data to download.', 'info');
      return;
    }

    try {
      // Create PDF with all necessary parameters
      await generatePdf(localReportData, fromDate, toDate, customerName, {
        unit: unit.length > 0 ? unit.join(', ') : '',
        itemCategories,
        itemSubcategories,
      });
    } catch (err) {
      console.error('Error in PDF download flow:', err);
    }
  };

  // Add a function to go back to the form
  const handleBackToForm = () => {
    setShowForm(true);
    setShowReport(false);
  };

  // Helper function to get the financial year display format (e.g., '2025-26')
  const getFinancialYearDisplay = (year: string): string => {
    const startYear = parseInt(year);
    const endYear = startYear + 1;
    return `${startYear}-${endYear.toString().slice(-2)}`;
  };

  // Reset subcategories when categories change
  useEffect(() => {
    // Clear subcategories when categories change
    if (itemCategories.length === 0) {
      setItemSubcategories([]);
    }
  }, [itemCategories]);

  // Add this useEffect to update subcategories when categories change
  useEffect(() => {
    if (itemCategories.length === 0) {
      // If no categories are selected, clear all subcategories
      setItemSubcategories([]);
    } else {
      // Get all available subcategories based on selected categories
      const availableSubcategories = getAvailableSubcategories().map(option => option.value);
      
      // Filter out subcategories that are no longer available
      const filteredSubcategories = itemSubcategories.filter(subcat => 
        availableSubcategories.includes(subcat)
      );
      
      // Update the subcategories state
      if (filteredSubcategories.length !== itemSubcategories.length) {
        setItemSubcategories(filteredSubcategories);
        console.log('Updated subcategories after category change:', filteredSubcategories);
      }
    }
  }, [itemCategories, apiSubcategories]);

  // Configure notifications on component mount
  useEffect(() => {
    // Initialize push notifications
    PushNotification.configure({
      // (required) Called when a remote or local notification is opened or received
      onNotification: function (notification: any) {
        console.log('NOTIFICATION:', notification);

        // Try to open the PDF file when notification is pressed
        if (notification.userInfo?.filePath) {
          openPdf(notification.userInfo.filePath);
        }

        // Required on iOS only
        if (Platform.OS === 'ios') {
          notification.finish(PushNotificationIOS.FetchResult.NoData);
        }
      },

      // Android only: GCM or FCM Sender ID
      senderID: '',

      // iOS only: permission to use notifications
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      // Should the initial notification be popped automatically
      popInitialNotification: true,

      // Requesting permissions on iOS
      requestPermissions: Platform.OS === 'ios',
    });

    // For iOS, register notification categories with actions
    if (Platform.OS === 'ios') {
      PushNotificationIOS.setNotificationCategories([
        {
          id: 'pdf-download',
          actions: [{id: 'view', title: 'View', options: {foreground: true}}],
        },
      ]);
    }

    return () => {
      // Clean up notifications on component unmount if needed
      PushNotification.unregister();
    };
  }, []);

  // Updated renderPicker that uses the CustomDropdown component
  const renderPicker = (
    pickerType: string,
    value: string,
    label: string,
    items: string[],
    onValueChange: (value: string) => void,
    enabled: boolean = true,
  ) => {
    // Convert items array to DropdownOption format
    const options: DropdownOption[] = [
      {label: `Select ${label}`, value: ''},
      ...items.map(item => ({label: item, value: item})),
    ];

    // Use the custom dropdown for both iOS and Android
    return (
      <CustomDropdown
        options={options}
        selectedValue={value}
        onSelect={onValueChange}
        placeholder={`Select ${label}`}
        disabled={!enabled}
        primaryColor={isInward ? '#F48221' : '#4682B4'}
      />
    );
  };

  // Helper function to check if a date is within the selected financial year range
  const isWithinFinancialYearRange = (month: number, year: number): boolean => {
    const startYear = parseInt(financialYear);
    const endYear = startYear + 1;

    return year === startYear || (year === endYear && month <= 11);
  };

  // Implement getAvailableSubcategories function
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

  // Helper function to sync unit array and unitString
  const syncUnitState = (newUnit: string[]) => {
    setUnit(newUnit);
    setUnitString(newUnit.length > 0 ? newUnit[0] : '');
  };

  return (
    <LayoutWrapper showHeader={true} showTabBar={false} route={route}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          backgroundColor={isInward ? '#F48221' : '#4682B4'}
          barStyle="light-content"
        />

        {/* Custom Alert Component */}
        <CustomAlert />

        {showForm ? (
          // Form Section
          <ScrollView style={styles.container}>
            {/* Toggle Button */}
            <View style={styles.toggleContainer}>
              <Text
                style={[
                  styles.toggleText,
                  !isInward && styles.toggleTextInactive,
                ]}>
                Inward
              </Text>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  {backgroundColor: isInward ? '#F48221' : '#4682B4'},
                  styles.toggleButtonEnhanced,
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
                style={[
                  styles.toggleText,
                  isInward && styles.toggleTextInactive,
                ]}>
                Outward
              </Text>
            </View>

            {/* Financial Year Selection - Moved outside the form container */}
            {timePeriod !== ('Custom' as TimePeriod) && (
              <View style={styles.financialYearContainer}>
                <Text style={styles.label}>Financial Year:</Text>
                <View style={styles.selectorWrapper}>
                  <TouchableOpacity
                    style={[
                      styles.financialYearSelector,
                      {
                        borderColor: isInward ? '#F48221' : '#4682B4',
                        backgroundColor: isInward ? '#FFFBF6' : '#F5F9FF',
                      },
                    ]}
                    onPress={() =>
                      setShowFinancialYearSelector(!showFinancialYearSelector)
                    }>
                    <Text
                      style={[
                        styles.financialYearText,
                        {color: isInward ? '#F48221' : '#4682B4'},
                      ]}>
                      {getFinancialYearDisplay(financialYear)}
                    </Text>
                    <MaterialIcons
                      name={
                        showFinancialYearSelector
                          ? 'keyboard-arrow-up'
                          : 'keyboard-arrow-down'
                      }
                      size={24}
                      color={isInward ? '#F48221' : '#4682B4'}
                    />
                  </TouchableOpacity>

                  {showFinancialYearSelector && (
                    <View
                      style={[
                        styles.financialYearDropdown,
                        {borderColor: isInward ? '#F48221' : '#4682B4'},
                      ]}>
                      {[
                        {display: '2025-26', value: '2025'},
                        {display: '2024-25', value: '2024'},
                        {display: '2023-24', value: '2023'},
                        {display: '2022-23', value: '2022'},
                        {display: '2021-22', value: '2021'},
                        {display: '2020-21', value: '2020'},
                        {display: '2019-20', value: '2019'},
                        {display: '2018-19', value: '2018'},
                      ].map((yearOption, index) => (
                        <TouchableOpacity
                          key={yearOption.display}
                          style={[
                            styles.financialYearOption,
                            financialYear === yearOption.value && [
                              styles.selectedFinancialYear,
                              {
                                backgroundColor: isInward
                                  ? '#FFF3E0'
                                  : '#E6F0FA',
                              },
                            ],
                            index === 0 && styles.firstYearOption,
                            index === 7 && styles.lastYearOption,
                          ]}
                          onPress={() => {
                            setFinancialYear(yearOption.value);
                            console.log(
                              'Financial year selected:',
                              yearOption.display,
                            );
                            setShowFinancialYearSelector(false);

                            // Update the calendar year
                            const yearValue = parseInt(yearOption.value);

                            // Set the current month and year based on the selected financial year
                            setCurrentYear(yearValue);

                            // Update date ranges based on the current time period without changing the period
                            const currentPeriod = timePeriod;

                            // Handle different periods without toggling back to custom
                            if (currentPeriod === 'Weekly') {
                              // Update week dates for the new year
                              const weekStart = new Date(
                                yearValue,
                                currentMonth,
                                1,
                              );
                              // Adjust to start on Sunday
                              const dayOfWeek = weekStart.getDay();
                              if (dayOfWeek !== 0) {
                                weekStart.setDate(
                                  weekStart.getDate() + (7 - dayOfWeek),
                                );
                              }

                              const weekEnd = new Date(weekStart);
                              weekEnd.setDate(weekStart.getDate() + 6);

                              setFromDate(weekStart);
                              setToDate(weekEnd);
                              setSelectedWeek(null); // Reset selected week
                            } else if (currentPeriod === 'Monthly') {
                              // Default to current month but in the new year
                              const startOfMonth = new Date(
                                yearValue,
                                currentMonth,
                                1,
                              );
                              const endOfMonth = new Date(
                                yearValue,
                                currentMonth + 1,
                                0,
                              );

                              setFromDate(startOfMonth);
                              setToDate(endOfMonth);
                              setSelectedMonth(null); // Reset selected month
                            } else if (currentPeriod === 'Quarterly') {
                              // Default to current quarter in new year
                              const currentQuarter = Math.floor(
                                new Date().getMonth() / 3,
                              );
                              const startOfQuarter = new Date(
                                yearValue,
                                currentQuarter * 3,
                                1,
                              );
                              const endOfQuarter = new Date(
                                yearValue,
                                (currentQuarter + 1) * 3,
                                0,
                              );

                              setFromDate(startOfQuarter);
                              setToDate(endOfQuarter);
                              setSelectedQuarter(null); // Reset selected quarter
                            } else if (currentPeriod === 'Half-Yearly') {
                              // Default to current half year in new year
                              const currentMonth = new Date().getMonth();
                              const isFirstHalf =
                                currentMonth >= 0 && currentMonth < 6; // Jan-Jun is first half
                              const startMonth = isFirstHalf ? 0 : 6; // Jan or Jul
                              const endMonth = isFirstHalf ? 5 : 11; // Jun or Dec

                              const startOfHalf = new Date(
                                yearValue,
                                startMonth,
                                1,
                              );
                              const endOfHalf = new Date(
                                yearValue,
                                endMonth + 1,
                                0,
                              );

                              setFromDate(startOfHalf);
                              setToDate(endOfHalf);
                              setSelectedHalf(null); // Reset selected half
                            } else {
                              // For Custom, update to start and end of calendar year
                              setFromDate(new Date(yearValue, 0, 1)); // January 1st
                              setToDate(new Date(yearValue, 11, 31)); // December 31st
                            }
                          }}>
                          <Text
                            style={[
                              styles.financialYearOptionText,
                              financialYear === yearOption.value && [
                                styles.selectedFinancialYearText,
                                {color: isInward ? '#F48221' : '#4682B4'},
                              ],
                            ]}>
                            {yearOption.display}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            )}

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

              {/* Loading Indicator */}
              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator
                    size="large"
                    color={isInward ? '#F48221' : '#4682B4'}
                  />
                  <Text style={styles.loadingText}>Loading categories...</Text>
                </View>
              )}

              {/* Time Period Tabs */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.timePeriodTabsContainer}>
                {(
                  [
                    'Weekly',
                    'Monthly',
                    'Quarterly',
                    'Half-Yearly',
                    'Custom',
                  ] as TimePeriod[]
                ).map(period => (
                  <TouchableOpacity
                    key={period}
                    style={[
                      styles.timePeriodTab,
                      timePeriod === period && styles.activeTimePeriodTab,
                      timePeriod === period && {
                        borderBottomColor: isInward ? '#F48221' : '#4682B4',
                      },
                    ]}
                    onPress={() => setDatesByTimePeriod(period)}>
                    <Text
                      style={[
                        styles.timePeriodTabText,
                        timePeriod === period && styles.activeTimePeriodTabText,
                        timePeriod === period && {
                          color: isInward ? '#F48221' : '#4682B4',
                        },
                      ]}>
                      {period}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Weekly View - shown only when Weekly is selected */}
              {timePeriod === 'Weekly' && (
                <View style={styles.timePeriodSelectorContainer}>
                  <View style={styles.monthNavHeader}>
                    <TouchableOpacity
                      style={styles.navArrowButton}
                      onPress={() => {
                        // Go to previous month, accounting for financial year boundary
                        let newMonth = currentMonth - 1;
                        let newYear = currentYear;

                        if (newMonth < 0) {
                          // Crossing calendar year boundary
                          newMonth = 11;
                          newYear = currentYear - 1;
                        }

                        // Check if the new date is within the financial year range
                        const startYear = parseInt(financialYear);

                        // If going to previous month would take us out of range, loop back to end of range
                        if (newYear < startYear) {
                          newMonth = 11; // December
                          newYear = startYear + 1; // End year of the financial year
                        }

                        setCurrentMonth(newMonth);
                        setCurrentYear(newYear);

                        // Reset the selected week when changing month
                        setSelectedWeek(null);
                      }}>
                      <MaterialIcons
                        name="chevron-left"
                        size={24}
                        color="#64748B"
                      />
                    </TouchableOpacity>
                    <Text style={styles.monthYearHeading}>
                      {new Date(currentYear, currentMonth).toLocaleString(
                        'default',
                        {month: 'long', year: 'numeric'},
                      )}
                    </Text>
                    <TouchableOpacity
                      style={styles.navArrowButton}
                      onPress={() => {
                        // Go to next month, accounting for financial year boundary
                        let newMonth = currentMonth + 1;
                        let newYear = currentYear;

                        if (newMonth > 11) {
                          // Crossing calendar year boundary
                          newMonth = 0;
                          newYear = currentYear + 1;
                        }

                        // Check if the new date is within the financial year range
                        const startYear = parseInt(financialYear);
                        const endYear = startYear + 1;

                        // If going to next month would take us out of range, loop back to start of range
                        if (
                          newYear > endYear ||
                          (newYear === endYear && newMonth > 11)
                        ) {
                          newMonth = 0; // January
                          newYear = startYear; // Start year of the financial year
                        }

                        setCurrentMonth(newMonth);
                        setCurrentYear(newYear);

                        // Reset the selected week when changing month
                        setSelectedWeek(null);
                      }}>
                      <MaterialIcons
                        name="chevron-right"
                        size={24}
                        color="#64748B"
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.weeksContainer}>
                    <View style={styles.weeksGrid}>
                      {generateWeekDates().map((week, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.weekItem,
                            selectedWeek === week.title && {
                              backgroundColor: isInward ? '#F48221' : '#4682B4',
                              borderColor: 'transparent',
                            },
                          ]}
                          onPress={() =>
                            handleWeekSelection(
                              week.number,
                              week.startDate,
                              week.endDate,
                            )
                          }>
                          <Text
                            style={[
                              styles.weekItemTitle,
                              selectedWeek === week.title &&
                                styles.selectedTimeItemText,
                            ]}>
                            {week.title}
                          </Text>
                          <Text
                            style={[
                              styles.weekItemDates,
                              selectedWeek === week.title &&
                                styles.selectedTimeItemText,
                            ]}>
                            {new Date(currentYear, currentMonth).toLocaleString(
                              'default',
                              {month: 'short'},
                            )}{' '}
                            {week.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              )}

              {/* Monthly View - shown only when Monthly is selected */}
              {timePeriod === 'Monthly' && (
                <View style={styles.timePeriodSelectorContainer}>
                  <View style={styles.monthsGrid}>
                    {[
                      'January',
                      'February',
                      'March',
                      'April',
                      'May',
                      'June',
                      'July',
                      'August',
                      'September',
                      'October',
                      'November',
                      'December',
                    ].map((month, index) => (
                      <TouchableOpacity
                        key={month}
                        style={[
                          styles.monthItem,
                          selectedMonth === month && {
                            backgroundColor: isInward ? '#F48221' : '#4682B4',
                            borderColor: 'transparent',
                            ...Platform.select({
                              ios: {
                                shadowColor: '#000',
                                shadowOffset: {width: 0, height: 2},
                                shadowOpacity: 0.1,
                                shadowRadius: 3,
                              },
                              android: {
                                elevation: 2,
                              },
                            }),
                          },
                        ]}
                        onPress={() => handleMonthSelection(index)}>
                        <Text
                          style={[
                            styles.monthItemText,
                            selectedMonth === month &&
                              styles.selectedTimeItemText,
                          ]}>
                          {month}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Quarterly View - shown only when Quarterly is selected */}
              {timePeriod === 'Quarterly' && (
                <View style={styles.timePeriodSelectorContainer}>
                  <View style={styles.quartersGrid}>
                    <TouchableOpacity
                      style={[
                        styles.quarterItem,
                        selectedQuarter === 'Q1' && {
                          backgroundColor: isInward ? '#F48221' : '#4682B4',
                          borderColor: 'transparent',
                          ...Platform.select({
                            ios: {
                              shadowColor: '#000',
                              shadowOffset: {width: 0, height: 2},
                              shadowOpacity: 0.1,
                              shadowRadius: 3,
                            },
                            android: {
                              elevation: 2,
                            },
                          }),
                        },
                      ]}
                      onPress={() => handleQuarterSelection(1)}>
                      <Text
                        style={[
                          styles.quarterItemTitle,
                          selectedQuarter === 'Q1' &&
                            styles.selectedTimeItemText,
                        ]}>
                        Q1
                      </Text>
                      <Text
                        style={[
                          styles.quarterItemDates,
                          selectedQuarter === 'Q1' &&
                            styles.selectedTimeItemText,
                        ]}>
                        Apr-Jun
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.quarterItem,
                        selectedQuarter === 'Q2' && {
                          backgroundColor: isInward ? '#F48221' : '#4682B4',
                          borderColor: 'transparent',
                          ...Platform.select({
                            ios: {
                              shadowColor: '#000',
                              shadowOffset: {width: 0, height: 2},
                              shadowOpacity: 0.1,
                              shadowRadius: 3,
                            },
                            android: {
                              elevation: 2,
                            },
                          }),
                        },
                      ]}
                      onPress={() => handleQuarterSelection(2)}>
                      <Text
                        style={[
                          styles.quarterItemTitle,
                          selectedQuarter === 'Q2' &&
                            styles.selectedTimeItemText,
                        ]}>
                        Q2
                      </Text>
                      <Text
                        style={[
                          styles.quarterItemDates,
                          selectedQuarter === 'Q2' &&
                            styles.selectedTimeItemText,
                        ]}>
                        Jul-Sep
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.quarterItem,
                        selectedQuarter === 'Q3' && {
                          backgroundColor: isInward ? '#F48221' : '#4682B4',
                          borderColor: 'transparent',
                          ...Platform.select({
                            ios: {
                              shadowColor: '#000',
                              shadowOffset: {width: 0, height: 2},
                              shadowOpacity: 0.1,
                              shadowRadius: 3,
                            },
                            android: {
                              elevation: 2,
                            },
                          }),
                        },
                      ]}
                      onPress={() => handleQuarterSelection(3)}>
                      <Text
                        style={[
                          styles.quarterItemTitle,
                          selectedQuarter === 'Q3' &&
                            styles.selectedTimeItemText,
                        ]}>
                        Q3
                      </Text>
                      <Text
                        style={[
                          styles.quarterItemDates,
                          selectedQuarter === 'Q3' &&
                            styles.selectedTimeItemText,
                        ]}>
                        Oct-Dec
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.quarterItem,
                        selectedQuarter === 'Q4' && {
                          backgroundColor: isInward ? '#F48221' : '#4682B4',
                          borderColor: 'transparent',
                          ...Platform.select({
                            ios: {
                              shadowColor: '#000',
                              shadowOffset: {width: 0, height: 2},
                              shadowOpacity: 0.1,
                              shadowRadius: 3,
                            },
                            android: {
                              elevation: 2,
                            },
                          }),
                        },
                      ]}
                      onPress={() => handleQuarterSelection(4)}>
                      <Text
                        style={[
                          styles.quarterItemTitle,
                          selectedQuarter === 'Q4' &&
                            styles.selectedTimeItemText,
                        ]}>
                        Q4
                      </Text>
                      <Text
                        style={[
                          styles.quarterItemDates,
                          selectedQuarter === 'Q4' &&
                            styles.selectedTimeItemText,
                        ]}>
                        Jan-Mar
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Half-Yearly View - shown only when Half-Yearly is selected */}
              {timePeriod === 'Half-Yearly' && (
                <View style={styles.timePeriodSelectorContainer}>
                  <View style={styles.halfsGrid}>
                    <TouchableOpacity
                      style={[
                        styles.halfItem,
                        selectedHalf === 'H1(First Half)' && {
                          backgroundColor: isInward ? '#F48221' : '#4682B4',
                          borderColor: 'transparent',
                        },
                      ]}
                      onPress={() => handleHalfYearSelection(1)}>
                      <Text
                        style={[
                          styles.halfItemTitle,
                          selectedHalf === 'H1(First Half)' &&
                            styles.selectedTimeItemText,
                        ]}>
                        H1 (First Half)
                      </Text>
                      <Text
                        style={[
                          styles.halfItemDates,
                          selectedHalf === 'H1(First Half)' &&
                            styles.selectedTimeItemText,
                        ]}>
                        Jan-Jun{' '}
                        {getFinancialYearDisplay(financialYear).split('-')[0]}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.halfItem,
                        selectedHalf === 'H2(Second Half)' && {
                          backgroundColor: isInward ? '#F48221' : '#4682B4',
                          borderColor: 'transparent',
                        },
                      ]}
                      onPress={() => handleHalfYearSelection(2)}>
                      <Text
                        style={[
                          styles.halfItemTitle,
                          selectedHalf === 'H2(Second Half)' &&
                            styles.selectedTimeItemText,
                        ]}>
                        H2 (Second Half)
                      </Text>
                      <Text
                        style={[
                          styles.halfItemDates,
                          selectedHalf === 'H2(Second Half)' &&
                            styles.selectedTimeItemText,
                        ]}>
                        Jul-Dec{' '}
                        {getFinancialYearDisplay(financialYear).split('-')[0]}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Date Fields (visible only in custom mode or showing the selected dates) */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>From Date</Text>
                <TouchableOpacity
                  style={styles.dateInputContainer}
                  onPress={() =>
                    timePeriod === ('Custom' as TimePeriod) &&
                    showDatePicker('from')
                  }
                  disabled={timePeriod !== ('Custom' as TimePeriod)}>
                  <View style={styles.dateInputContent}>
                    <MaterialIcons
                      name="event"
                      size={20}
                      color="#718096"
                      style={styles.inputIcon}
                    />
                    <Text
                      style={[
                        styles.dateText,
                        timePeriod !== ('Custom' as TimePeriod) &&
                          styles.disabledDateText,
                      ]}>
                      {formatDate(fromDate)}
                    </Text>
                  </View>
                </TouchableOpacity>
                {showFromDatePicker &&
                  Platform.OS === 'android' &&
                  timePeriod === 'Custom' && (
                    <DateTimePicker
                      testID="fromDatePicker"
                      value={fromDate}
                      mode="date"
                      display="default"
                      onChange={onFromDateChange}
                    />
                  )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>To Date</Text>
                <TouchableOpacity
                  style={styles.dateInputContainer}
                  onPress={() =>
                    timePeriod === ('Custom' as TimePeriod) &&
                    showDatePicker('to')
                  }
                  disabled={timePeriod !== ('Custom' as TimePeriod)}>
                  <View style={styles.dateInputContent}>
                    <MaterialIcons
                      name="event-available"
                      size={20}
                      color="#718096"
                      style={styles.inputIcon}
                    />
                    <Text
                      style={[
                        styles.dateText,
                        timePeriod !== ('Custom' as TimePeriod) &&
                          styles.disabledDateText,
                      ]}>
                      {formatDate(toDate)}
                    </Text>
                  </View>
                </TouchableOpacity>
                {showToDatePicker &&
                  Platform.OS === 'android' &&
                  timePeriod === 'Custom' && (
                    <DateTimePicker
                      testID="toDatePicker"
                      value={toDate}
                      mode="date"
                      display="default"
                      onChange={onToDateChange}
                    />
                  )}
              </View>

              {/* Category Multi-Select */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Categories</Text>
                <MultiSelect
                  options={apiCategories.map(category => ({
                    label: category,
                    value: category,
                  }))}
                  selectedValues={itemCategories}
                  onSelectChange={values => setItemCategories(values)}
                  placeholder="Select Items"
                  primaryColor={isInward ? '#F48221' : '#4682B4'}
                />
              </View>

              {/* Subcategory Multi-Select - Only enabled if at least one category is selected */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Subcategories</Text>
                <MultiSelect
                  options={getAvailableSubcategories()}
                  selectedValues={itemSubcategories}
                  onSelectChange={values => setItemSubcategories(values)}
                  placeholder="Select Items"
                  disabled={itemCategories.length === 0}
                  primaryColor={isInward ? '#F48221' : '#4682B4'}
                />
              </View>

              {/* Unit Picker - Replace with MultiSelect */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Unit <Text style={styles.requiredField}>*</Text>
                </Text>
                <MultiSelect
                  options={units.map(unit => ({
                    label: unit,
                    value: unit,
                  }))}
                  selectedValues={unit}
                  onSelectChange={values => {
                    setUnit(values);
                    setUnitString(values.length > 0 ? values[0] : '');
                  }}
                  placeholder="Select Units"
                  primaryColor={isInward ? '#F48221' : '#4682B4'}
                />
              </View>

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    {backgroundColor: '#718096'}, // Grey for clear
                    isSearching && styles.disabledButton,
                  ]}
                  onPress={handleClear}
                  disabled={isSearching}>
                  <Text style={styles.buttonText}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.button,
                    {backgroundColor: isInward ? '#F48221' : '#4682B4'},
                    isSearching && styles.disabledButton,
                  ]}
                  onPress={handleSearch}
                  disabled={isSearching}>
                  {isSearching ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.buttonText}>Search</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        ) : showReport ? (
          // Report Section
          <View style={styles.reportContainer}>
            <ViewShot
              ref={viewshotRef}
              options={{
                fileName: 'inward-outward-report',
                format: 'jpg',
                quality: 0.9,
              }}
              style={styles.reportContent}>
              {/* Report Header */}
              <View style={styles.reportHeader}>
                <View style={styles.reportHeaderLeft}>
                  <TouchableOpacity
                    onPress={handleBackToForm}
                    style={[
                      styles.backButton,
                      {
                        backgroundColor: '#FFFFFF',
                        borderColor: isInward ? '#F48221' : '#4682B4',
                      },
                    ]}>
                    <MaterialIcons
                      name="arrow-back"
                      size={20}
                      color={isInward ? '#F48221' : '#4682B4'}
                    />
                    <Text
                      style={[
                        styles.backButtonText,
                        {color: isInward ? '#F48221' : '#4682B4'},
                      ]}>
                      Back
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.reportHeaderCenter}>
                  <Text
                    style={[
                      styles.reportTitle,
                      {color: isInward ? '#F48221' : '#4682B4'},
                    ]}>
                    {isInward ? 'Inward Report' : 'Outward Report'}
                  </Text>
                </View>
                <View style={styles.reportHeaderRight}>
                  <TouchableOpacity
                    onPress={handlePdfDownload}
                    disabled={isPdfDownloading || localReportData.length === 0}
                    style={[
                      styles.pdfButton,
                      {
                        backgroundColor:
                          localReportData.length === 0
                            ? '#CBD5E1'
                            : isInward
                            ? '#F48221'
                            : '#4682B4',
                      },
                      isPdfDownloading && styles.disabledButton,
                    ]}>
                    <MaterialIcons
                      name="file-download"
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={styles.pdfButtonText}>PDF</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Report Sub Header */}
              <View style={styles.reportSubHeader}>
                {isPdfDownloading ? (
                  <View style={styles.loadingIndicatorContainer}>
                    <ActivityIndicator
                      size="small"
                      color={isInward ? '#F48221' : '#4682B4'}
                    />
                    <Text style={styles.loadingIndicatorText}>
                      Generating PDF...
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Scrolling Hint - only show when data is loaded and available */}
              {!isReportLoading && localReportData.length > 0 && (
                <View style={styles.scrollHintContainer}>
                  <MaterialIcons name="swipe" size={18} color="#64748B" />
                  <Text style={styles.scrollHintText}>
                    Scroll horizontally to view all data
                  </Text>
                </View>
              )}

              {/* Report Table Section - Pass the onInwardOutwardNoPress handler */}
              {isReportLoading ? (
                <View style={styles.loadingTableContainer}>
                  <ActivityIndicator
                    size="large"
                    color={isInward ? '#F48221' : '#4682B4'}
                  />
                  <Text style={styles.loadingTableText}>
                    Loading report data...
                  </Text>
                </View>
              ) : localReportData.length > 0 ? (
                <ReportTable
                  reportData={localReportData}
                  isInward={isInward}
                  tableRef={tableRef}
                  onInwardOutwardNoPress={handleInwardOutwardNoPress}
                />
              ) : (
                <View style={styles.emptyTableContainer}>
                  <MaterialIcons name="search-off" size={48} color="#CBD5E1" />
                  <Text style={styles.emptyTableText}>
                    No records found matching your filters.
                  </Text>
                </View>
              )}
            </ViewShot>
          </View>
        ) : (
          // Empty State
          <View style={styles.emptyStateContainer}>
            <MaterialIcons name="error-outline" size={64} color="#E2E8F0" />
            <Text style={styles.emptyStateTitle}>Something went wrong</Text>
            <Text style={styles.emptyStateText}>
              Please go back and try again with different filters.
            </Text>
          </View>
        )}

        {/* iOS Picker Modal */}
        <IOSPickerModal
          isVisible={isPickerVisible}
          currentPicker={currentPicker}
          itemCategory={itemCategories.length > 0 ? itemCategories[0] : ''}
          itemSubcategory={
            itemSubcategories.length > 0 ? itemSubcategories[0] : ''
          }
          unit={unitString}
          apiCategories={apiCategories}
          apiSubcategories={apiSubcategories}
          units={units}
          setItemCategory={value => {
            if (value) {
              setItemCategories([value]);
            } else {
              setItemCategories([]);
            }
          }}
          setItemSubcategory={value => {
            if (value) {
              setItemSubcategories([value]);
            } else {
              setItemSubcategories([]);
            }
          }}
          setUnit={value => {
            if (value) {
              setUnit([value]);
              setUnitString(value);
            } else {
              setUnit([]);
              setUnitString('');
            }
          }}
          onClose={() => setIsPickerVisible(false)}
        />

        {/* iOS Date Picker Modal */}
        <IOSDatePickerModal
          visible={showFromDatePicker && Platform.OS === 'ios'}
          date={fromDate}
          isInward={isInward}
          title="Select From Date"
          onClose={() => setShowFromDatePicker(false)}
          onDateChange={(event: any, date?: Date) => {
            if (date) setFromDate(date);
          }}
          onConfirm={() => {
            onFromDateChange({}, fromDate);
            setShowFromDatePicker(false);
          }}
        />

        <IOSDatePickerModal
          visible={showToDatePicker && Platform.OS === 'ios'}
          date={toDate}
          isInward={isInward}
          title="Select To Date"
          onClose={() => setShowToDatePicker(false)}
          onDateChange={(event: any, date?: Date) => {
            if (date) setToDate(date);
          }}
          onConfirm={() => {
            onToDateChange({}, toDate);
            setShowToDatePicker(false);
          }}
        />

        {/* PDF Loading Overlay */}
        {isPdfDownloading && (
          <View style={styles.pdfLoadingOverlay}>
            <View style={styles.pdfLoadingCard}>
              <Text style={styles.pdfLoadingText}>Generating PDF</Text>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${downloadProgress}%`,
                      backgroundColor: isInward ? '#F48221' : '#4682B4',
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{statusMessage}</Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    </LayoutWrapper>
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
    width: 62,
    height: 30,
    borderRadius: 15,
    marginHorizontal: 10,
    justifyContent: 'center',
  },
  toggleButtonEnhanced: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  toggleCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    position: 'absolute',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  toggleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  toggleTextInactive: {
    opacity: 0.5,
  },
  // Add financialYearContainer style for the relocated component
  financialYearContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  selectorWrapper: {
    position: 'relative',
    marginLeft: 8,
  },
  formContainer: {
    margin: 16,
    padding: 16,
    marginTop: 0,
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
    backgroundColor: '#FFFBF6',
    borderColor: '#F48221',
    borderWidth: 1,
  },
  outwardForm: {
    backgroundColor: '#F5F9FF',
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
  dateInputContainer: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 12,
  },
  dateInputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    color: '#2C3E50',
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    color: '#2C3E50',
    marginLeft: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  pickerContainer: {
    position: 'relative',
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
  pickerTextSelected: {
    fontSize: 15,
    color: '#262626',
    fontWeight: 'bold',
    flex: 1,
  },
  pickerTextContainer: {
    flex: 1,
    paddingVertical: 12,
  },

  buttonContainer: {
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
  // Loading styles
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
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
    color: 'black',
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
  // iOS date picker modal styles
  iosPicker: {
    width: '100%',
    height: 200,
    backgroundColor: '#FFFFFF', // Add white background
  },
  iosPickerItem: {
    color: '#000000',
    fontSize: 16,
    // color: 'red',
    backgroundColor: '#FFFFFF', // Ensure item background
  },
  iosDatePickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  iosDatePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: -2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  iosDatePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  iosDatePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
  },
  iosDatePickerDoneBtn: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F48221',
  },
  iosDatePicker: {
    height: 200,
    marginTop: 10,
  },
  iosDatePickerConfirmBtn: {
    backgroundColor: '#F48221',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 5,
  },
  iosDatePickerConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Android picker styles
  androidPickerContainer: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    height: 50,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  disabledAndroidPicker: {
    opacity: 0.7,
    backgroundColor: '#F0F0F0',
    borderColor: '#E0E0E0',
  },
  androidSelectedText: {
    color: '#2C3E50',
    fontSize: 15,
    maxWidth: '90%',
  },
  androidPicker: {
    width: '100%',
    height: 50,
    position: 'absolute',

    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0, // Make the picker transparent but still functional
  },
  androidDropdownIcon: {
    position: 'absolute',
    right: 12,
  },
  disabledAndroidText: {
    color: '#A0A0A0',
  },
  reportContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: 10, // Increased negative margin to further reduce space above header
  },
  reportHeader: {
    padding: 0,
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    // marginTop: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 11,
    borderRadius: 4,
    borderWidth: 1,
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
  backButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 15,
    borderRadius: 4,
  },
  pdfButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 4,
  },
  reportSubHeader: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  loadingIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingIndicatorText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#64748B',
  },
  resultsSummaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportCountText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  scrollHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  scrollHintText: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 6,
  },
  tableContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    margin: 0,
    borderRadius: 0,
  },
  horizontalScrollContainer: {
    flex: 1,
  },
  tableWrapper: {
    flexDirection: 'column',
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
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tableCell: {
    fontSize: 14,
    color: '#334155',
    paddingHorizontal: 6,
    paddingVertical: 2,
    textAlign: 'center',
  },
  emptyTableContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTableText: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#64748B',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 300,
  },
  pdfLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  pdfLoadingCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  pdfLoadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  progressBarContainer: {
    width: '100%',
    height: 20,
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    borderRadius: 10,
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.5,
  },
  // iOS date picker styling
  inwardDatePicker: {
    borderColor: '#F48221',
    borderWidth: 1,
  },
  outwardDatePicker: {
    borderColor: '#4682B4',
    borderWidth: 1,
  },
  reportContent: {
    flex: 1,
  },
  reportHeaderLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  reportHeaderCenter: {
    flex: 2,
    alignItems: 'center',
  },
  reportHeaderRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  // Financial Year Selector Styles
  financialYearSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F48221', // Default to inward color
    borderRadius: 8,
    backgroundColor: '#FFFBF6', // Default to inward background
    padding: 5,
    paddingHorizontal: 9,
    width: 110,
  },
  financialYearText: {
    fontSize: 14,
    color: '#F48221',
    fontWeight: '500',
  },
  financialYearDropdown: {
    position: 'absolute',
    top: 44,
    left: 0,
    width: 110,
    borderWidth: 1,
    borderColor: '#F48221',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  financialYearOption: {
    width: '100%',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  firstYearOption: {
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
  },
  lastYearOption: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 7,
  },
  selectedFinancialYear: {
    backgroundColor: '#FFF3E0',
  },
  financialYearOptionText: {
    fontSize: 14,
    color: '#667080',
    textAlign: 'left',
  },
  selectedFinancialYearText: {
    fontWeight: '500',
    color: '#F48221', // Will be overridden for outward
  },
  // Time Period Tabs
  timePeriodTabsContainer: {
    marginTop: 10,
    marginBottom: 12,
  },
  timePeriodTab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTimePeriodTab: {
    borderBottomWidth: 2,
  },
  timePeriodTabText: {
    fontSize: 14,
    color: '#64748B',
  },
  activeTimePeriodTabText: {
    fontWeight: '600',
  },
  // Time Period Selector Container
  timePeriodSelectorContainer: {
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  monthNavHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    marginBottom: 12,
    height: 48,
  },
  navArrowButton: {
    padding: 1,
  },
  monthYearHeading: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2C3E50',
    textAlign: 'center',
  },
  weeksContainer: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 9,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    width: '100%', // Changed from fixed 340px to 100%
    minHeight: 140,
    alignSelf: 'center',
  },
  weeksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center', // Changed from flex-start to center
    alignItems: 'center',
    gap: 8, // Reduced gap
  },
  weekItem: {
    width: '28%', // Keep percentage-based width
    marginHorizontal: 4, // Added horizontal margin
    marginVertical: 4, // Added vertical margin
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  weekItemTitle: {
    fontSize: 11, // Slightly reduced font size
    fontWeight: '500',
    color: '#2C3E50',
    marginBottom: 2,
    textAlign: 'center',
  },
  weekItemDates: {
    fontSize: 10, // Slightly reduced font size
    color: '#64748B',
    textAlign: 'center',
  },
  selectedTimeItem: {
    backgroundColor: '#5A5A5A',
    borderColor: 'transparent',
  },
  selectedTimeItemText: {
    color: '#FFFFFF',
  },
  // Months Grid
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'flex-start',
    width: '100%',
    minHeight: 170,
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  monthItem: {
    width: '31%',
    height: 36,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  monthItemText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2C3E50',
    textAlign: 'center',
  },
  // Quarters Grid
  quartersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'flex-start',
    width: '100%',
    alignSelf: 'center',
    padding: 10,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  quarterItem: {
    width: '23%',
    height: 50,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  quarterItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 2,
    textAlign: 'center',
  },
  quarterItemDates: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  halfsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'flex-start',
    width: '100%',
    alignSelf: 'center',
    padding: 10,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  halfItem: {
    width: '48%',
    height: 50,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  halfItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 2,
    textAlign: 'center',
  },
  halfItemDates: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  customDropdownContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  disabledDropdown: {
    opacity: 0.7,
  },
  customDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  customDropdownSelectedText: {
    fontSize: 15,
    color: '#333333',
    fontWeight: '500',
    flex: 1,
  },
  customDropdownPlaceholderText: {
    fontSize: 14,
    color: '#94A3B8',
    flex: 1,
  },
  customModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  customModalContent: {
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
  customOptionItem: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  customOptionText: {
    fontSize: 16,
    color: '#333',
  },
  loadingTableContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  loadingTableText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 16,
    textAlign: 'center',
  },
  disabledDateText: {
    color: '#A0A0A0',
  },
  requiredField: {
    color: 'red',
    fontWeight: 'bold',
  },
  // Custom Alert Styles
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  inwardAlert: {
    // borderLeftWidth: 5,
    // borderLeftColor: '#F48221',
  },
  outwardAlert: {
    // borderLeftWidth: 5,
    // borderLeftColor: '#4682B4',
  },
  alertHeader: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  alertTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3748',
    marginLeft: 10,
  },
  alertBody: {
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  alertMessage: {
    fontSize: 16,
    color: '#4A5568',
    lineHeight: 22,
  },
  alertButtonsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  alertButton: {
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  inwardAlertButton: {
    backgroundColor: '#FFF8F3',
  },
  outwardAlertButton: {
    backgroundColor: '#F5F9FF',
  },
  alertButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  requiredFieldIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 10,
    backgroundColor: '#FFFAF0',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#DD6B20',
  },
  requiredFieldText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 5,
    flex: 1,
  },
});

export default InwardOutwardReportScreen;