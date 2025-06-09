// //vaishnavi
// import React, {useState, useEffect, useRef} from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   ActivityIndicator,
//   Modal,
//   Platform,
//   Alert,
//   Dimensions,
// } from 'react-native';
// import axios from 'axios';
// import DateTimePicker, {
//   DateTimePickerEvent,
// } from '@react-native-community/datetimepicker';
// import {format} from 'date-fns';
// import {API_ENDPOINTS, getAuthHeaders} from '../../config/api.config';
// import {useRoute} from '@react-navigation/core';
// import {LayoutWrapper} from '../../components/AppLayout';

// // Define types for API responses
// interface SummaryData {
//   inward?: {
//     TOTAL_INWARD_QUANTITY?: number | string;
//     TOTAL_INWARD_DOCUMENTS?: number;
//     TOTAL_INWARD_CUSTOMERS?: number;
//     TOTAL_INWARD_LOTS?: number;
//   };
//   outward?: {
//     TOTAL_OUTWARD_QUANTITY?: number | string;
//     TOTAL_REQUESTED_QUANTITY?: number | string;
//     TOTAL_OUTWARD_DOCUMENTS?: number;
//     TOTAL_OUTWARD_CUSTOMERS?: number;
//     TOTAL_OUTWARD_LOTS?: number;
//   };
//   summary?: {
//     TOTAL_QUANTITY_DIFFERENCE?: number | string;
//     TOTAL_DOCUMENTS?: number;
//     DELIVERY_FULFILLMENT_RATE?: number | string;
//   };
// }

// interface ItemWiseData {
//   ITEM_ID?: number | string;
//   ITEM_NAME?: string;
//   ITEM_CATEG_NAME?: string;
//   SUB_CATEGORY_NAME?: string;
//   TOTAL_INWARD_QUANTITY?: number | string;
//   TOTAL_OUTWARD_QUANTITY?: number | string;
//   TOTAL_REQUESTED_QUANTITY?: number | string;
//   NET_QUANTITY?: number | string;
// }

// interface Filters {
//   customerName?: string | null;
//   customerId?: string | number | null;
//   itemCategoryName?: string | null;
//   itemSubCategoryName?: string | null;
//   unitName?: string | null;
//   dateRange?: string;
//   fromDate?: string;
//   toDate?: string;
// }

// interface ApiResponse {
//   success: boolean;
//   data: SummaryData | ItemWiseData[];
//   filters?: Filters;
//   message?: string;
//   error?: string;
// }

// const ReportSummaryScreen: React.FC = () => {
//   const route = useRoute();
//   // State with proper types
//   const [fromDate, setFromDate] = useState<Date>(() => {
//     const today = new Date();
//     const lastMonth = new Date(today);
//     lastMonth.setMonth(today.getMonth() - 1);
//     return lastMonth;
//   });
//   const [toDate, setToDate] = useState<Date>(new Date());
//   const [tempFromDate, setTempFromDate] = useState<Date>(() => {
//     const today = new Date();
//     const lastMonth = new Date(today);
//     lastMonth.setMonth(today.getMonth() - 1);
//     return lastMonth;
//   });
//   const [tempToDate, setTempToDate] = useState<Date>(new Date());
//   const [summaryData, setSummaryData] = useState<
//     SummaryData | ItemWiseData[] | null
//   >(null);
//   const [loading, setLoading] = useState<boolean>(false);
//   const [error, setError] = useState<string | null>(null);
//   const [filters, setFilters] = useState<Filters>({
//     customerName: null,
//     customerId: null,
//     itemCategoryName: null,
//     itemSubCategoryName: null,
//     unitName: null,
//   });
//   const [showFromDatePicker, setShowFromDatePicker] = useState<boolean>(false);
//   const [showToDatePicker, setShowToDatePicker] = useState<boolean>(false);
//   const [reportType, setReportType] = useState<'all' | 'itemwise'>('all');
//   const [lastApiRequestTime, setLastApiRequestTime] = useState<Date | null>(
//     null,
//   );
//   const [tableHeight, setTableHeight] = useState<number>(550);
  
//   // Add useRef for the main ScrollView to ensure we can scroll back to top when switching tabs
//   const scrollViewRef = useRef<ScrollView>(null);
  
//   // Calculate appropriate table height based on screen dimensions
//   useEffect(() => {
//     const calculateTableHeight = () => {
//       const screenHeight = Dimensions.get('window').height;
//       // Adjust the calculation based on other UI elements
//       // Roughly 60% of screen height, but minimum 400px and maximum 650px
//       const calculatedHeight = Math.min(Math.max(screenHeight * 0.6, 400), 650);
//       setTableHeight(calculatedHeight);
//     };
    
//     calculateTableHeight();
    
//     // Add event listener for screen dimension changes (orientation changes)
//     const dimensionsListener = Dimensions.addEventListener('change', calculateTableHeight);
    
//     // Clean up listener
//     return () => {
//       dimensionsListener.remove();
//     };
//   }, []);

//   // Format dates for display
//   const formatDisplayDate = (date: Date): string => {
//     return format(date, 'dd/MM/yyyy');
//   };

//   // Format dates for API - keep this simple and reliable
//   const formatApiDate = (date: Date): string => {
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, '0');
//     const day = String(date.getDate()).padStart(2, '0');
//     return `${year}-${month}-${day}`;
//   };

//   // Handle date changes
//   const onFromDateChange = (
//     event: DateTimePickerEvent,
//     selectedDate?: Date,
//   ) => {
//     if (Platform.OS === 'android') {
//       setShowFromDatePicker(false);
//     }

//     if (selectedDate) {
//       console.log(
//         `From date changing from ${fromDate.toISOString()} to ${selectedDate.toISOString()}`,
//       );
//       console.log(
//         `API format: ${formatApiDate(fromDate)} to ${formatApiDate(
//           selectedDate,
//         )}`,
//       );

//       // Set temp date for iOS
//       setTempFromDate(selectedDate);

//       // For Android, update state immediately
//       if (Platform.OS === 'android') {
//         setFromDate(selectedDate);
//         console.log('From date updated (Android)');
//       }
//     }
//   };

//   const onToDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
//     if (Platform.OS === 'android') {
//       setShowToDatePicker(false);
//     }

//     if (selectedDate) {
//       console.log(
//         `To date changing from ${toDate.toISOString()} to ${selectedDate.toISOString()}`,
//       );
//       console.log(
//         `API format: ${formatApiDate(toDate)} to ${formatApiDate(
//           selectedDate,
//         )}`,
//       );

//       // Set temp date for iOS
//       setTempToDate(selectedDate);

//       // For Android, update state immediately
//       if (Platform.OS === 'android') {
//         setToDate(selectedDate);
//         console.log('To date updated (Android)');
//       }
//     }
//   };

//   // Confirm date selections for iOS
//   const confirmFromDate = () => {
//     console.log(`Confirming from date change to ${tempFromDate.toISOString()}`);
//     console.log(`API format: ${formatApiDate(tempFromDate)}`);
//     setFromDate(tempFromDate);
//     setShowFromDatePicker(false);
//     console.log('From date updated (iOS)');
//   };

//   const confirmToDate = () => {
//     console.log(`Confirming to date change to ${tempToDate.toISOString()}`);
//     console.log(`API format: ${formatApiDate(tempToDate)}`);
//     setToDate(tempToDate);
//     setShowToDatePicker(false);
//     console.log('To date updated (iOS)');
//   };

//   // Format numbers for display with proper typing
//   const formatNumber = (
//     value: number | string | undefined | null,
//     decimals: number = 2,
//   ): string => {
//     // Add more detailed logging for troubleshooting
//     console.log(`formatNumber input: ${value}, type: ${typeof value}`);

//     // Handle null, undefined, empty string
//     if (value === undefined || value === null || value === '') {
//       return '0';
//     }

//     // Convert to number safely
//     const num = typeof value === 'string' ? parseFloat(value) : Number(value);

//     // Handle NaN
//     if (isNaN(num)) {
//       console.log(`Value converted to NaN: ${value}`);
//       return '0';
//     }

//     // For whole numbers or large values, don't show decimal places
//     if (num % 1 === 0 || Math.abs(num) >= 1000) {
//       return num.toLocaleString('en-US', {maximumFractionDigits: 0});
//     }

//     // For smaller values with decimals, show the specified number of decimal places
//     return num.toLocaleString('en-US', {
//       maximumFractionDigits: decimals,
//       minimumFractionDigits: decimals,
//     });
//   };

//   // Handle report type change
//   const handleReportTypeChange = (type: 'all' | 'itemwise') => {
//     if (type !== reportType) {
//       console.log(`Changing report type from ${reportType} to ${type}`);
//       setReportType(type);
//       // Clear previous data when switching report types
//       setSummaryData(null);
//     }
//   };

//   // Handle date changes and fetch data
//   const handleApplyDates = async () => {
//     const requestId = `req-${new Date().getTime()}`;

//     console.log(
//       `[${requestId}] Apply Date Range button pressed for report type: ${reportType}`,
//     );

//     // Immediately clear previous data to avoid showing stale information
//     setSummaryData(null);
//     setLoading(true);
//     setError(null);

//     try {
//       // Capture the current date states to avoid any state changes during async operations
//       const currentFromDate = new Date(fromDate);
//       const currentToDate = new Date(toDate);

//       console.log(
//         `[${requestId}] Using dates: From=${currentFromDate.toISOString()}, To=${currentToDate.toISOString()}`,
//       );

//       // Format dates directly using simple date formatting
//       const fromDateStr = formatApiDate(currentFromDate);
//       const toDateStr = formatApiDate(currentToDate);

//       console.log(
//         `[${requestId}] Formatted dates: From=${fromDateStr}, To=${toDateStr}`,
//       );

//       // Get auth headers
//       const headers = await getAuthHeaders();

//       // Create the API request payload with proper date format
//       const payload = {
//         fromDate: fromDateStr,
//         toDate: toDateStr,
//         customerName: 'UNICORP ENTERPRISES',
//         itemCategoryName: null,
//         itemSubCategoryName: null,
//         unitName: null,
//       };

//       console.log(
//         `[${requestId}] Request payload:`,
//         JSON.stringify(payload, null, 2),
//       );

//       // Choose the API endpoint based on the report type
//       const apiEndpoint =
//         reportType === 'all'
//           ? API_ENDPOINTS.GET_ALL_SUMMARY
//           : API_ENDPOINTS.GET_ITEMWISE_SUMMARY;

//       console.log(
//         `[${requestId}] Using API endpoint: ${apiEndpoint} for report type: ${reportType}`,
//       );

//       // Make the API request
//       const response = await axios.post<ApiResponse>(apiEndpoint, payload, {
//         headers: {
//           ...headers,
//           'Cache-Control': 'no-cache',
//         },
//       });

//       console.log(`[${requestId}] API response status:`, response.status);

//       if (response.data && response.data.success) {
//         // For detailed logging of item-wise data
//         if (reportType === 'itemwise' && Array.isArray(response.data.data)) {
//           console.log(
//             `[${requestId}] Received ${response.data.data.length} items from API`,
//           );
//           console.log(`[${requestId}] Full item-wise data:`);
//           response.data.data.forEach((item, index) => {
//             console.log(
//               `[${requestId}] Item ${index + 1}:`,
//               JSON.stringify(item, null, 2),
//             );
//           });
//         } else {
//           console.log(
//             `[${requestId}] API response data received:`,
//             reportType === 'all'
//               ? JSON.stringify(response.data.data, null, 2)
//               : `Array with ${
//                   Array.isArray(response.data.data)
//                     ? response.data.data.length
//                     : 0
//                 } items`,
//           );
//         }

//         // Update state with new data
//         if (reportType === 'all') {
//           // For 'all' report type, store the summary data
//           setSummaryData(response.data.data as SummaryData);
//         } else {
//           // For 'itemwise' report type, store the array of item data
//           setSummaryData(response.data.data as unknown as ItemWiseData[]);
//         }

//         // Update filters if available
//         if (response.data.filters) {
//           setFilters(response.data.filters);
//         }
//       } else {
//         const errorMessage =
//           response.data?.message || 'Failed to fetch report data';
//         setError(errorMessage);
//         console.error(`[${requestId}] API error:`, errorMessage);
//       }
//     } catch (err: any) {
//       console.error(`[${requestId}] Error:`, err);
//       const errorMessage =
//         err.response?.data?.message ||
//         err.response?.data?.error ||
//         err.message ||
//         'An error occurred';

//       setError(errorMessage);
//       Alert.alert('Error', `Failed to fetch report data: ${errorMessage}`, [
//         {text: 'OK'},
//       ]);
//     } finally {
//       setLoading(false);
//       console.log(`[${requestId}] Request completed, UI will update`);
//     }
//   };

//   // Add type guard functions to check data types
//   const isSummaryData = (data: any): data is SummaryData => {
//     return (
//       data && !Array.isArray(data) && 'inward' in data && 'outward' in data
//     );
//   };

//   const isItemWiseData = (data: any): data is ItemWiseData[] => {
//     return (
//       data && Array.isArray(data) && data.length > 0 && 'ITEM_NAME' in data[0]
//     );
//   };

//   // Render summary data with safe access
//   const renderSummaryData = () => {
//     if (!summaryData) {
//       console.log('No summary data available to render');
//       return (
//         <View style={styles.reportSection}>
//           <Text style={styles.emptyMessage}>
//             Select a date range and press "Apply Date Range" to view the report
//           </Text>
//         </View>
//       );
//     }

//     // Check if we have the correct data type
//     if (!isSummaryData(summaryData)) {
//       console.log('Data is not in summary format');
//       return (
//         <View style={styles.reportSection}>
//           <Text style={styles.emptyMessage}>
//             No summary data available. Please select the "All" report type.
//           </Text>
//         </View>
//       );
//     }

//     // Now TypeScript knows summaryData is SummaryData type
//     const inward = summaryData.inward || {};
//     const outward = summaryData.outward || {};
//     const summary = summaryData.summary || {};

//     console.log('Rendering summary data:');
//     console.log('Inward data for rendering:', JSON.stringify(inward, null, 2));
//     console.log(
//       'Outward data for rendering:',
//       JSON.stringify(outward, null, 2),
//     );
//     console.log(
//       'Summary data for rendering:',
//       JSON.stringify(summary, null, 2),
//     );

//     // Show full raw data in logs for troubleshooting
//     console.log(
//       'TOTAL_INWARD_QUANTITY type:',
//       typeof inward.TOTAL_INWARD_QUANTITY,
//     );
//     console.log(
//       'TOTAL_INWARD_QUANTITY raw value:',
//       inward.TOTAL_INWARD_QUANTITY,
//     );
//     console.log(
//       'TOTAL_INWARD_QUANTITY formatted:',
//       formatNumber(inward.TOTAL_INWARD_QUANTITY),
//     );
//     console.log(
//       'TOTAL_OUTWARD_QUANTITY raw value:',
//       outward.TOTAL_OUTWARD_QUANTITY,
//     );
//     console.log(
//       'TOTAL_OUTWARD_QUANTITY formatted:',
//       formatNumber(outward.TOTAL_OUTWARD_QUANTITY),
//     );
//     console.log(
//       'TOTAL_QUANTITY_DIFFERENCE raw value:',
//       summary.TOTAL_QUANTITY_DIFFERENCE,
//     );
//     console.log(
//       'TOTAL_QUANTITY_DIFFERENCE formatted:',
//       formatNumber(summary.TOTAL_QUANTITY_DIFFERENCE),
//     );

//     // Check if there's meaningful data
//     const hasData =
//       inward.TOTAL_INWARD_QUANTITY != null ||
//       outward.TOTAL_OUTWARD_QUANTITY != null ||
//       summary.TOTAL_QUANTITY_DIFFERENCE != null;

//     if (!hasData) {
//       return (
//         <View style={styles.reportSection}>
//           <Text style={styles.emptyMessage}>
//             No report data found for the selected date range. Try selecting a
//             different date range.
//           </Text>
//         </View>
//       );
//     }

//     return (
//       <>
//         <View style={styles.reportSection}>
//           <Text style={styles.sectionTitle}>Inward Summary</Text>
//           <View style={styles.metricRow}>
//             <Text style={styles.metricLabel}>Total Quantity:</Text>
//             <Text style={styles.metricValue}>
//               {formatNumber(inward.TOTAL_INWARD_QUANTITY)}
//             </Text>
//           </View>
//           <View style={styles.metricRow}>
//             <Text style={styles.metricLabel}>Total Documents:</Text>
//             <Text style={styles.metricValue}>
//               {inward.TOTAL_INWARD_DOCUMENTS || 0}
//             </Text>
//           </View>
//           <View style={styles.metricRow}>
//             <Text style={styles.metricLabel}>Total Customers:</Text>
//             <Text style={styles.metricValue}>
//               {inward.TOTAL_INWARD_CUSTOMERS || 0}
//             </Text>
//           </View>
//           <View style={styles.metricRow}>
//             <Text style={styles.metricLabel}>Total Lots:</Text>
//             <Text style={styles.metricValue}>
//               {inward.TOTAL_INWARD_LOTS || 0}
//             </Text>
//           </View>
//         </View>

//         <View style={styles.reportSection}>
//           <Text style={styles.sectionTitle}>Outward Summary</Text>
//           <View style={styles.metricRow}>
//             <Text style={styles.metricLabel}>Total Quantity:</Text>
//             <Text style={styles.metricValue}>
//               {formatNumber(outward.TOTAL_OUTWARD_QUANTITY)}
//             </Text>
//           </View>
//           <View style={styles.metricRow}>
//             <Text style={styles.metricLabel}>Requested Quantity:</Text>
//             <Text style={styles.metricValue}>
//               {formatNumber(outward.TOTAL_REQUESTED_QUANTITY)}
//             </Text>
//           </View>
//           <View style={styles.metricRow}>
//             <Text style={styles.metricLabel}>Total Documents:</Text>
//             <Text style={styles.metricValue}>
//               {outward.TOTAL_OUTWARD_DOCUMENTS || 0}
//             </Text>
//           </View>
//           <View style={styles.metricRow}>
//             <Text style={styles.metricLabel}>Total Customers:</Text>
//             <Text style={styles.metricValue}>
//               {outward.TOTAL_OUTWARD_CUSTOMERS || 0}
//             </Text>
//           </View>
//           <View style={styles.metricRow}>
//             <Text style={styles.metricLabel}>Total Lots:</Text>
//             <Text style={styles.metricValue}>
//               {outward.TOTAL_OUTWARD_LOTS || 0}
//             </Text>
//           </View>
//         </View>

//         <View style={styles.reportSection}>
//           <Text style={styles.sectionTitle}>Summary</Text>
//           <View style={styles.metricRow}>
//             <Text style={styles.metricLabel}>Quantity Difference:</Text>
//             <Text
//               style={[
//                 styles.metricValue,
//                 Number(summary.TOTAL_QUANTITY_DIFFERENCE) > 0
//                   ? styles.positive
//                   : Number(summary.TOTAL_QUANTITY_DIFFERENCE) < 0
//                   ? styles.negative
//                   : null,
//               ]}>
//               {formatNumber(summary.TOTAL_QUANTITY_DIFFERENCE)}
//             </Text>
//           </View>
//           <View style={styles.metricRow}>
//             <Text style={styles.metricLabel}>Total Documents:</Text>
//             <Text style={styles.metricValue}>
//               {summary.TOTAL_DOCUMENTS || 0}
//             </Text>
//           </View>
//           <View style={styles.metricRow}>
//             <Text style={styles.metricLabel}>Fulfillment Rate:</Text>
//             <Text style={styles.metricValue}>
//               {formatNumber(summary.DELIVERY_FULFILLMENT_RATE)}%
//             </Text>
//           </View>
//         </View>
//       </>
//     );
//   };

//   // Add the renderItemWiseData function
//   const renderItemWiseData = () => {
//     if (!summaryData) {
//       console.log('No item-wise data available to render');
//       return (
//         <View style={styles.reportSection}>
//           <Text style={styles.emptyMessage}>
//             Select a date range and press "Apply Date Range" to view item-wise
//             data
//           </Text>
//         </View>
//       );
//     }

//     // Check if we have the correct data type using the type guard
//     if (!isItemWiseData(summaryData)) {
//       console.log('Data is not in item-wise format');
//       return (
//         <View style={styles.reportSection}>
//           <Text style={styles.emptyMessage}>
//             No item-wise data available. Please select the "Item-wise" report
//             type.
//           </Text>
//         </View>
//       );
//     }

//     // Now TypeScript knows summaryData is ItemWiseData[] type
//     const itemWiseData = summaryData;

//     if (itemWiseData.length === 0) {
//       return (
//         <View style={styles.reportSection}>
//           <Text style={styles.emptyMessage}>
//             No item data found for the selected date range. Try selecting a
//             different date range.
//           </Text>
//         </View>
//       );
//     }

//     // Log all items to console
//     console.log(`Logging all ${itemWiseData.length} items:`);
//     itemWiseData.forEach((item, index) => {
//       console.log(`Item ${index + 1}:`, JSON.stringify(item, null, 2));
//     });

//     return (
//       <View style={styles.reportSection}>
//         <Text style={styles.sectionTitle}>
//           Item-wise Summary ({itemWiseData.length} items)
//         </Text>

//         <View style={styles.minimumScrollHint}>
//           <Text style={styles.minimumScrollHintText}>
//             ⟷ Scroll horizontally to see more columns
//           </Text>
//         </View>

//         {/* Main table container with proper sizing */}
//         <View style={styles.tableWrapper}>
//           {/* Horizontal Scroll Container */}
//           <ScrollView horizontal={true} showsHorizontalScrollIndicator={true}>
//             {/* Table Container with Fixed Width */}
//             <View style={styles.tableContainer}>
//               {/* Table Header */}
//               <View style={styles.tableHeader}>
//                 <View style={[styles.headerCell, {width: 200}]}>
//                   <Text style={styles.headerText} numberOfLines={2}>
//                     Item Details
//                   </Text>
//                 </View>
//                 <View style={[styles.headerCell, {width: 100}]}>
//                   <Text style={styles.headerText}>Inward Qty</Text>
//                 </View>
//                 <View style={[styles.headerCell, {width: 100}]}>
//                   <Text style={styles.headerText}>Outward Qty</Text>
//                 </View>
//                 <View style={[styles.headerCell, {width: 120}]}>
//                   <Text style={styles.headerText}>Requested Qty</Text>
//                 </View>
//                 <View style={[styles.headerCell, {width: 100}]}>
//                   <Text style={styles.headerText}>Net Balance</Text>
//                 </View>
//               </View>

//               {/* Fixed-height container for vertical scrolling */}
//               <View style={{height: Math.min(tableHeight, 450)}}>
//                 {/* Vertical Scroll for Rows */}
//                 <ScrollView 
//                   nestedScrollEnabled={true}
//                   showsVerticalScrollIndicator={true}
//                   persistentScrollbar={true}>
//                   {itemWiseData.map((item, index) => (
//                     <View key={`${item.ITEM_ID}-${index}`} style={styles.tableRow}>
//                       {/* Item Details Column */}
//                       <View style={[styles.dataCell, {width: 200}]}>
//                         <Text style={styles.itemName} numberOfLines={1}>
//                           {item.ITEM_NAME || 'Unknown Item'}
//                         </Text>
//                         <Text style={styles.itemCategory} numberOfLines={1}>
//                           {[item.ITEM_CATEG_NAME, item.SUB_CATEGORY_NAME]
//                             .filter(Boolean)
//                             .join(' / ')}
//                         </Text>
//                       </View>

//                       {/* Data Columns */}
//                       <View style={[styles.dataCell, {width: 100}]}>
//                         <Text style={styles.dataText}>
//                           {formatNumber(item.TOTAL_INWARD_QUANTITY)}
//                         </Text>
//                       </View>
//                       <View style={[styles.dataCell, {width: 100}]}>
//                         <Text style={styles.dataText}>
//                           {formatNumber(item.TOTAL_OUTWARD_QUANTITY)}
//                         </Text>
//                       </View>
//                       <View style={[styles.dataCell, {width: 120}]}>
//                         <Text style={styles.dataText}>
//                           {formatNumber(item.TOTAL_REQUESTED_QUANTITY)}
//                         </Text>
//                       </View>
//                       <View style={[styles.dataCell, {width: 100}]}>
//                         <Text
//                           style={[
//                             styles.dataText,
//                             Number(item.NET_QUANTITY) > 0
//                               ? styles.positive
//                               : Number(item.NET_QUANTITY) < 0
//                               ? styles.negative
//                               : null,
//                           ]}>
//                           {formatNumber(Math.abs(Number(item.NET_QUANTITY)))}
//                         </Text>
//                       </View>
//                     </View>
//                   ))}
//                 </ScrollView>
//               </View>
//             </View>
//           </ScrollView>
//         </View>
//       </View>
//     );
//   };

//   // Filter display component
//   const renderActiveFilters = () => {
//     // Removed as not needed
//     return null;
//   };

//   return (
//     <LayoutWrapper showHeader={true} showTabBar={false} route={route}>
//       <View style={styles.container}>
//         {/* Title */}
//         <View style={styles.titleContainer}>
//           <Text style={styles.titleText}>Report Summary</Text>
//         </View>

//         {/* Date Range Selector */}
//         <View style={styles.dateContainer}>
//           <View style={styles.dateField}>
//             <Text style={styles.dateLabel}>From:</Text>
//             <TouchableOpacity
//               style={styles.datePicker}
//               onPress={() => {
//                 setTempFromDate(fromDate);
//                 setShowFromDatePicker(true);
//               }}>
//               <Text style={styles.dateText}>{formatDisplayDate(fromDate)}</Text>
//             </TouchableOpacity>
//           </View>

//           <View style={styles.dateField}>
//             <Text style={styles.dateLabel}>To:</Text>
//             <TouchableOpacity
//               style={styles.datePicker}
//               onPress={() => {
//                 setTempToDate(toDate);
//                 setShowToDatePicker(true);
//               }}>
//               <Text style={styles.dateText}>{formatDisplayDate(toDate)}</Text>
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* Apply button for date range */}
//         <TouchableOpacity style={styles.applyButton} onPress={handleApplyDates}>
//           <Text style={styles.applyButtonText}> Apply Date Range</Text>
//         </TouchableOpacity>

//         {/* Replace the individual radio buttons with this container */}
//         <View style={styles.radioContainer}>
//           <TouchableOpacity
//             style={[
//               styles.radioButton,
//               reportType === 'all' && styles.radioSelected,
//             ]}
//             onPress={() => handleReportTypeChange('all')}>
//             <View
//               style={[
//                 styles.radioCircle,
//                 reportType === 'all' && {borderColor: '#F48221'},
//               ]}>
//               {reportType === 'all' && <View style={styles.radioFill} />}
//             </View>
//             <Text
//               style={[
//                 styles.radioLabel,
//                 reportType === 'all' && styles.radioSelectedLabel,
//               ]}>
//               All
//             </Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={[
//               styles.radioButton,
//               reportType === 'itemwise' && styles.radioSelected,
//             ]}
//             onPress={() => handleReportTypeChange('itemwise')}>
//             <View
//               style={[
//                 styles.radioCircle,
//                 reportType === 'itemwise' && {borderColor: '#F48221'},
//               ]}>
//               {reportType === 'itemwise' && <View style={styles.radioFill} />}
//             </View>
//             <Text
//               style={[
//                 styles.radioLabel,
//                 reportType === 'itemwise' && styles.radioSelectedLabel,
//               ]}>
//               Item-wise
//             </Text>
//           </TouchableOpacity>
//         </View>

//         {/* Loading Indicator */}
//         {loading && (
//           <View style={styles.loadingContainer}>
//             <ActivityIndicator size="large" color="#F48221" />
//             <Text style={styles.loadingText}>Loading report data...</Text>
//           </View>
//         )}

//         {/* Error Message */}
//         {error && (
//           <View style={styles.errorContainer}>
//             <Text style={styles.errorText}>{error}</Text>
//             <TouchableOpacity
//               style={styles.retryButton}
//               onPress={handleApplyDates}>
//               <Text style={styles.retryButtonText}>Retry</Text>
//             </TouchableOpacity>
//           </View>
//         )}

//         {/* Report Content */}
//         {!loading && !error && (
//           <ScrollView 
//             ref={scrollViewRef}
//             style={styles.scrollContainer}>
//             {reportType === 'all' ? renderSummaryData() : renderItemWiseData()}
//           </ScrollView>
//         )}

//         {/* Date Picker Modals */}
//         {Platform.OS === 'ios' ? (
//           // iOS date picker modal
//           <>
//             {showFromDatePicker && (
//               <Modal
//                 transparent={true}
//                 animationType="fade"
//                 visible={showFromDatePicker}>
//                 <View style={styles.modalOverlay}>
//                   <View style={styles.modalContent}>
//                     <Text style={styles.modalTitle}>Select From Date</Text>

//                     <DateTimePicker
//                       value={tempFromDate}
//                       mode="date"
//                       display="spinner"
//                       onChange={onFromDateChange}
//                       textColor="#000000"
//                       style={styles.iosDatePicker}
//                       minimumDate={new Date(2020, 0, 1)}
//                       maximumDate={new Date()}
//                     />

//                     <View style={styles.modalButtons}>
//                       <TouchableOpacity
//                         style={styles.cancelButton}
//                         onPress={() => setShowFromDatePicker(false)}>
//                         <Text style={styles.buttonText}>Cancel</Text>
//                       </TouchableOpacity>

//                       <TouchableOpacity
//                         style={styles.confirmButton}
//                         onPress={confirmFromDate}>
//                         <Text style={styles.buttonText}>Confirm</Text>
//                       </TouchableOpacity>
//                     </View>
//                   </View>
//                 </View>
//               </Modal>
//             )}

//             {showToDatePicker && (
//               <Modal
//                 transparent={true}
//                 animationType="fade"
//                 visible={showToDatePicker}>
//                 <View style={styles.modalOverlay}>
//                   <View style={styles.modalContent}>
//                     <Text style={styles.modalTitle}>Select To Date</Text>

//                     <DateTimePicker
//                       value={tempToDate}
//                       mode="date"
//                       display="spinner"
//                       onChange={onToDateChange}
//                       style={styles.iosDatePicker}
//                       minimumDate={new Date(2020, 0, 1)}
//                       maximumDate={new Date()}
//                       // Add these props for iOS
//                       textColor="#000000"
//                       accentColor="#F48221" // Your app's orange accent color
//                     />
//                     <View style={styles.modalButtons}>
//                       <TouchableOpacity
//                         style={styles.cancelButton}
//                         onPress={() => setShowToDatePicker(false)}>
//                         <Text style={styles.buttonText}>Cancel</Text>
//                       </TouchableOpacity>

//                       <TouchableOpacity
//                         style={styles.confirmButton}
//                         onPress={confirmToDate}>
//                         <Text style={styles.buttonText}>Confirm</Text>
//                       </TouchableOpacity>
//                     </View>
//                   </View>
//                 </View>
//               </Modal>
//             )}
//           </>
//         ) : (
//           // Android date picker
//           <>
//             {showFromDatePicker && (
//               <DateTimePicker
//                 value={tempFromDate}
//                 mode="date"
//                 is24Hour={true}
//                 display="default"
//                 onChange={onFromDateChange}
//                 minimumDate={new Date(2020, 0, 1)}
//                 maximumDate={new Date()}
//               />
//             )}

//             {showToDatePicker && (
//               <DateTimePicker
//                 value={tempToDate}
//                 mode="date"
//                 display="default"
//                 onChange={onToDateChange}
//                 minimumDate={new Date(2020, 0, 1)}
//                 maximumDate={new Date()}
//               />
//             )}
//           </>
//         )}
//       </View>
//     </LayoutWrapper>
//   );
// };

// // Styles with additions for active filters
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     paddingVertical: 16,
//     paddingHorizontal: 8,
//     backgroundColor: '#fff',
//   },
//   titleContainer: {
//     alignItems: 'center',
//     marginBottom: 16,
//     backgroundColor: '#f9f9f9',
//     paddingVertical: 10,
//     borderRadius: 8,
//     borderBottomWidth: 1,
//     borderBottomColor: '#eaeaea',
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 1},
//     shadowOpacity: 0.1,
//     shadowRadius: 1,
//     elevation: 1,
//   },
//   titleText: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#F48221',
//   },
//   dateContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 16,
//   },
//   dateField: {
//     flex: 1,
//     marginHorizontal: 4,
//   },
//   dateLabel: {
//     fontSize: 14,
//     marginBottom: 4,
//     color: '#666',
//   },
//   datePicker: {
//     padding: 12,
//     backgroundColor: '#f5f5f5',
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: '#ddd',
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   dateText: {
//     fontSize: 14,
//     color: '#333',
//     fontWeight: '500',
//   },
//   applyButton: {
//     backgroundColor: '#F48221',
//     paddingVertical: 10,
//     borderRadius: 8,
//     marginBottom: 16,
//     alignItems: 'center',
//   },
//   applyButtonText: {
//     color: 'white',
//     fontWeight: '600',
//     fontSize: 16,
//   },
//   dateRangeHint: {
//     color: '#666',
//     fontSize: 12,
//     marginTop: 8,
//     marginBottom: 12,
//     textAlign: 'center',
//     fontStyle: 'italic',
//   },
//   scrollContainer: {
//     flex: 1,
//   },
//   reportSection: {
//     backgroundColor: '#f9f9f9',
//     paddingVertical: 16,
//     paddingHorizontal: 6,
//     borderRadius: 8,
//     marginBottom: 16,
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 1},
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//     elevation: 2,
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 12,
//     color: '#333',
//     borderBottomWidth: 1,
//     borderBottomColor: '#ddd',
//     paddingBottom: 8,
//   },
//   metricRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     paddingVertical: 8,
//     borderBottomWidth: 1,
//     borderBottomColor: '#e0e0e0',
//   },
//   metricLabel: {
//     fontSize: 15,
//     color: '#555',
//     flex: 2,
//   },
//   metricValue: {
//     fontSize: 15,
//     fontWeight: '600',
//     color: '#333',
//     flex: 1,
//     textAlign: 'right',
//   },
//   positive: {
//     color: '#333', // Green
//     fontWeight: 'bold',
//   },
//   negative: {
//     color: '#333', // Red
//     fontWeight: 'bold',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingText: {
//     marginTop: 10,
//     color: '#666',
//     fontSize: 14,
//   },
//   radioContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     gap: 8,
//     marginBottom: 16,
//   },
//   radioButton: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     borderRadius: 6,
//     // borderWidth: 1,
//     // borderColor: '#ddd',
//     backgroundColor: '#fff',
//   },
//   radioCircle: {
//     width: 18,
//     height: 18,
//     borderRadius: 4,
//     borderWidth: 2,
//     borderColor: '#ddd',
//     marginRight: 8,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   radioFill: {
//     width: 10,
//     height: 10,
//     borderRadius: 2,
//     backgroundColor: '#F48221',
//   },
//   radioLabel: {
//     fontSize: 16,
//     color: '#666',
//   },
//   radioSelected: {
//     borderColor: '#F48221',
//   },
//   radioSelectedLabel: {
//     color: '#F48221',
//   },

//   ioSelected: {
//     borderColor: '#F48221', // Orange border instead of background
//   },

//   errorContainer: {
//     padding: 16,
//     backgroundColor: '#ffebee',
//     borderRadius: 8,
//     marginVertical: 16,
//     alignItems: 'center',
//   },
//   errorText: {
//     color: '#c62828',
//     textAlign: 'center',
//     marginBottom: 12,
//   },
//   retryButton: {
//     backgroundColor: '#F48221',
//     paddingVertical: 8,
//     paddingHorizontal: 16,
//     borderRadius: 4,
//   },
//   retryButtonText: {
//     color: 'white',
//     fontWeight: '500',
//   },
//   emptyMessage: {
//     textAlign: 'center',
//     color: '#666',
//     padding: 20,
//     fontSize: 16,
//     fontStyle: 'italic',
//   },
//   modalOverlay: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//   },
//   modalContent: {
//     width: '90%',
//     backgroundColor: 'white',
//     shadowColor: '#000',
//     borderRadius: 10,
//     padding: 20,
//     alignItems: 'center',
//   },

//   modalTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 15,
//     color: '#333',
//   },
//   iosDatePicker: {
//     width: '100%',
//     height: 180,
//     backgroundColor: '#ffffff',
//   },
//   modalButtons: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     width: '100%',
//     marginTop: 20,
//   },
//   cancelButton: {
//     flex: 1,
//     backgroundColor: '#6c757d',
//     padding: 12,
//     borderRadius: 6,
//     marginRight: 8,
//     alignItems: 'center',
//   },
//   confirmButton: {
//     flex: 1,
//     backgroundColor: '#F48221',
//     padding: 12,
//     borderRadius: 6,
//     marginLeft: 8,
//     alignItems: 'center',
//   },
//   buttonText: {
//     color: 'white',
//     fontWeight: '600',
//     fontSize: 16,
//   },
//   debugContainer: {
//     padding: 16,
//     backgroundColor: '#f9f9f9',
//     borderRadius: 8,
//     marginBottom: 16,
//   },
//   debugTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 12,
//     color: '#333',
//   },
//   debugText: {
//     color: '#666',
//     fontSize: 12,
//   },
//   tableContainer: {
//     flexDirection: 'column',
//     minWidth: 620, // Total of all column widths
//   },
//   tableHeader: {
//     flexDirection: 'row',
//     backgroundColor: '#f8f8f8',
//     paddingVertical: 12,
//     borderBottomWidth: 2,
//     borderBottomColor: '#ddd',
//   },
//   headerCell: {
//     paddingHorizontal: 8,
//     justifyContent: 'center',
//   },
//   headerText: {
//     fontWeight: '600',
//     fontSize: 12,
//     color: '#444',
//     textAlign: 'left',
//     marginLeft: 10,
//   },
//   verticalScroll: {
//     minHeight: 300,
//     maxHeight: 650,
//   },
//   tableRow: {
//     flexDirection: 'row',
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//     alignItems: 'center',
//   },
//   dataCell: {
//     paddingHorizontal: 8,
//     justifyContent: 'center',
//   },
//   dataText: {
//     fontSize: 12,
//     color: '#333',
//     textAlign: 'center',
//   },
//   itemName: {
//     fontWeight: '500',
//     fontSize: 12,
//   },
//   itemCategory: {
//     fontSize: 11,
//     color: '#666',
//     marginTop: 4,
//   },
//   scrollIndicator: {
//     padding: 10,
//     backgroundColor: '#f0f0f0',
//     borderTopWidth: 1,
//     borderTopColor: '#ddd',
//     alignItems: 'center',
//   },
//   scrollIndicatorText: {
//     color: '#F48221',
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   scrollHint: {
//     padding: 10,
//     backgroundColor: '#f0f0f0',
//     borderRadius: 4,
//     alignItems: 'center',
//     marginBottom: 5,
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//   },
//   scrollHintText: {
//     color: '#F48221',
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   tableWrapper: {
//     flex: 1,
//     flexDirection: 'column',
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//     borderRadius: 8,
//     overflow: 'hidden',
//     marginBottom: 10,
//     marginHorizontal: 0,
//     width: '100%', // Take full available width
//   },
//   minimumScrollHint: {
//     paddingVertical: 3,
//     paddingHorizontal: 6,
//     backgroundColor: '#f8f8f8',
//     borderRadius: 4,
//     alignItems: 'center',
//     marginBottom: 3,
//   },
//   minimumScrollHintText: {
//     color: '#666',
//     fontSize: 11,
//   },
// });

// export default ReportSummaryScreen;


//vaishnavi
import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import axios from 'axios';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {format} from 'date-fns';
import {API_ENDPOINTS, getAuthHeaders} from '../../config/api.config';
import {useRoute} from '@react-navigation/core';
import {LayoutWrapper} from '../../components/AppLayout';

// Define types for API responses

interface SummaryData {
  inward?: {
    TOTAL_INWARD_QUANTITY?: number | string;
  };
  outward?: {
    TOTAL_OUTWARD_QUANTITY?: number | string;
    TOTAL_REQUESTED_QUANTITY?: number | string;
  };
  summary?: {
    NET_QUANTITY: number;
    PENDING_QUANTITY?: number | string; // Add this line
    DELIVERY_FULFILLMENT_RATE?: number | string;
  };
}

interface ItemWiseData {
  ITEM_ID?: number | string;
  ITEM_NAME?: string;
  ITEM_CATEG_NAME?: string;
  SUB_CATEGORY_NAME?: string;
  TOTAL_INWARD_QUANTITY?: number | string;
  TOTAL_OUTWARD_QUANTITY?: number | string;
  TOTAL_REQUESTED_QUANTITY?: number | string;
  NET_QUANTITY?: number | string;
}

interface Filters {
  customerName?: string | null;
  customerId?: string | number | null;
  itemCategoryName?: string | null;
  itemSubCategoryName?: string | null;
  unitName?: string | null;
  dateRange?: string;
  fromDate?: string;
  toDate?: string;
}

interface ApiResponse {
  success: boolean;
  data: SummaryData | ItemWiseData[];
  filters?: Filters;
  message?: string;
  error?: string;
}

const ReportSummaryScreen: React.FC = () => {
  const route = useRoute();
  // State with proper types
  const [fromDate, setFromDate] = useState<Date>(() => {
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);
    return lastMonth;
  });
  const [toDate, setToDate] = useState<Date>(new Date());
  const [tempFromDate, setTempFromDate] = useState<Date>(() => {
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);
    return lastMonth;
  });
  const [tempToDate, setTempToDate] = useState<Date>(new Date());
  const [summaryData, setSummaryData] = useState<
    SummaryData | ItemWiseData[] | null
  >(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    customerName: null,
    customerId: null,
    itemCategoryName: null,
    itemSubCategoryName: null,
    unitName: null,
  });
  const [showFromDatePicker, setShowFromDatePicker] = useState<boolean>(false);
  const [showToDatePicker, setShowToDatePicker] = useState<boolean>(false);
  const [reportType, setReportType] = useState<'all' | 'itemwise'>('all');
  const [lastApiRequestTime, setLastApiRequestTime] = useState<Date | null>(
    null,
  );
  const [tableHeight, setTableHeight] = useState<number>(550);

  // Add useRef for the main ScrollView to ensure we can scroll back to top when switching tabs
  const scrollViewRef = useRef<ScrollView>(null);

  // Calculate appropriate table height based on screen dimensions
  useEffect(() => {
    const calculateTableHeight = () => {
      const screenHeight = Dimensions.get('window').height;
      // Adjust the calculation based on other UI elements
      // Roughly 60% of screen height, but minimum 400px and maximum 650px
      const calculatedHeight = Math.min(Math.max(screenHeight * 0.6, 400), 650);
      setTableHeight(calculatedHeight);
    };

    calculateTableHeight();

    // Add event listener for screen dimension changes (orientation changes)
    const dimensionsListener = Dimensions.addEventListener(
      'change',
      calculateTableHeight,
    );

    // Clean up listener
    return () => {
      dimensionsListener.remove();
    };
  }, []);

  // Format dates for display
  const formatDisplayDate = (date: Date): string => {
    return format(date, 'dd/MM/yyyy');
  };

  // Format dates for API - keep this simple and reliable
  const formatApiDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Handle date changes
  const onFromDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    if (Platform.OS === 'android') {
      setShowFromDatePicker(false);
    }

    if (selectedDate) {
      console.log(
        `From date changing from ${fromDate.toISOString()} to ${selectedDate.toISOString()}`,
      );
      console.log(
        `API format: ${formatApiDate(fromDate)} to ${formatApiDate(
          selectedDate,
        )}`,
      );

      // Set temp date for iOS
      setTempFromDate(selectedDate);

      // For Android, update state immediately
      if (Platform.OS === 'android') {
        setFromDate(selectedDate);
        console.log('From date updated (Android)');
      }
    }
  };

  const onToDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowToDatePicker(false);
    }

    if (selectedDate) {
      console.log(
        `To date changing from ${toDate.toISOString()} to ${selectedDate.toISOString()}`,
      );
      console.log(
        `API format: ${formatApiDate(toDate)} to ${formatApiDate(
          selectedDate,
        )}`,
      );

      // Set temp date for iOS
      setTempToDate(selectedDate);

      // For Android, update state immediately
      if (Platform.OS === 'android') {
        setToDate(selectedDate);
        console.log('To date updated (Android)');
      }
    }
  };

  // Confirm date selections for iOS
  const confirmFromDate = () => {
    console.log(`Confirming from date change to ${tempFromDate.toISOString()}`);
    console.log(`API format: ${formatApiDate(tempFromDate)}`);
    setFromDate(tempFromDate);
    setShowFromDatePicker(false);
    console.log('From date updated (iOS)');
  };

  const confirmToDate = () => {
    console.log(`Confirming to date change to ${tempToDate.toISOString()}`);
    console.log(`API format: ${formatApiDate(tempToDate)}`);
    setToDate(tempToDate);
    setShowToDatePicker(false);
    console.log('To date updated (iOS)');
  };

  // Format numbers for display with proper typing
  const formatNumber = (
    value: number | string | undefined | null,
    decimals: number = 2,
  ): string => {
    // Add more detailed logging for troubleshooting
    console.log(`formatNumber input: ${value}, type: ${typeof value}`);

    // Handle null, undefined, empty string
    if (value === undefined || value === null || value === '') {
      return '0';
    }

    // Convert to number safely
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);

    // Handle NaN
    if (isNaN(num)) {
      console.log(`Value converted to NaN: ${value}`);
      return '0';
    }

    // For whole numbers or large values, don't show decimal places
    if (num % 1 === 0 || Math.abs(num) >= 1000) {
      return num.toLocaleString('en-US', {maximumFractionDigits: 0});
    }

    // For smaller values with decimals, show the specified number of decimal places
    return num.toLocaleString('en-US', {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
    });
  };

  // Handle report type change
  const handleReportTypeChange = (type: 'all' | 'itemwise') => {
    if (type !== reportType) {
      console.log(`Changing report type from ${reportType} to ${type}`);
      setReportType(type);
      // Clear previous data when switching report types
      setSummaryData(null);
    }
  };

  // Handle date changes and fetch data
  const handleApplyDates = async () => {
    const requestId = `req-${new Date().getTime()}`;

    console.log(
      `[${requestId}] Apply Date Range button pressed for report type: ${reportType}`,
    );

    // Immediately clear previous data to avoid showing stale information
    setSummaryData(null);
    setLoading(true);
    setError(null);

    try {
      // Capture the current date states to avoid any state changes during async operations
      const currentFromDate = new Date(fromDate);
      const currentToDate = new Date(toDate);

      console.log(
        `[${requestId}] Using dates: From=${currentFromDate.toISOString()}, To=${currentToDate.toISOString()}`,
      );

      // Format dates directly using simple date formatting
      const fromDateStr = formatApiDate(currentFromDate);
      const toDateStr = formatApiDate(currentToDate);

      console.log(
        `[${requestId}] Formatted dates: From=${fromDateStr}, To=${toDateStr}`,
      );

      // Get auth headers
      const headers = await getAuthHeaders();

      // Create the API request payload with proper date format
      const payload = {
        fromDate: fromDateStr,
        toDate: toDateStr,
        customerName: 'UNICORP ENTERPRISES',
        itemCategoryName: null,
        itemSubCategoryName: null,
        unitName: null,
      };

      console.log(
        `[${requestId}] Request payload:`,
        JSON.stringify(payload, null, 2),
      );

      // Choose the API endpoint based on the report type
      const apiEndpoint =
        reportType === 'all'
          ? API_ENDPOINTS.GET_ALL_SUMMARY
          : API_ENDPOINTS.GET_ITEMWISE_SUMMARY;

      console.log(
        `[${requestId}] Using API endpoint: ${apiEndpoint} for report type: ${reportType}`,
      );

      // Make the API request
      const response = await axios.post<ApiResponse>(apiEndpoint, payload, {
        headers: {
          ...headers,
          'Cache-Control': 'no-cache',
        },
      });

      console.log(`[${requestId}] API response status:`, response.status);

      if (response.data && response.data.success) {
        // For detailed logging of item-wise data
        if (reportType === 'itemwise' && Array.isArray(response.data.data)) {
          console.log(
            `[${requestId}] Received ${response.data.data.length} items from API`,
          );
          console.log(`[${requestId}] Full item-wise data:`);
          response.data.data.forEach((item, index) => {
            console.log(
              `[${requestId}] Item ${index + 1}:`,
              JSON.stringify(item, null, 2),
            );
          });
        } else {
          console.log(
            `[${requestId}] API response data received:`,
            reportType === 'all'
              ? JSON.stringify(response.data.data, null, 2)
              : `Array with ${
                  Array.isArray(response.data.data)
                    ? response.data.data.length
                    : 0
                } items`,
          );
        }

        // Update state with new data
        if (reportType === 'all') {
          // For 'all' report type, store the summary data
          setSummaryData(response.data.data as SummaryData);
        } else {
          // For 'itemwise' report type, store the array of item data
          setSummaryData(response.data.data as unknown as ItemWiseData[]);
        }

        // Update filters if available
        if (response.data.filters) {
          setFilters(response.data.filters);
        }
      } else {
        const errorMessage =
          response.data?.message || 'Failed to fetch report data';
        setError(errorMessage);
        console.error(`[${requestId}] API error:`, errorMessage);
      }
    } catch (err: any) {
      console.error(`[${requestId}] Error:`, err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'An error occurred';

      setError(errorMessage);
      Alert.alert('Error', `Failed to fetch report data: ${errorMessage}`, [
        {text: 'OK'},
      ]);
    } finally {
      setLoading(false);
      console.log(`[${requestId}] Request completed, UI will update`);
    }
  };

  // Add type guard functions to check data types
  const isSummaryData = (data: any): data is SummaryData => {
    return (
      data && !Array.isArray(data) && 'inward' in data && 'outward' in data
    );
  };

  const isItemWiseData = (data: any): data is ItemWiseData[] => {
    return (
      data && Array.isArray(data) && data.length > 0 && 'ITEM_NAME' in data[0]
    );
  };

  // Render summary data with safe access
  const renderSummaryData = () => {
    if (!summaryData) {
      console.log('No summary data available to render');
      return (
        <View style={styles.reportSection}>
          <Text style={styles.emptyMessage}>
            Select a date range and press "Apply Date Range" to view the report
          </Text>
        </View>
      );
    }

    // Check if we have the correct data type
    if (!isSummaryData(summaryData)) {
      console.log('Data is not in summary format');
      return (
        <View style={styles.reportSection}>
          <Text style={styles.emptyMessage}>
            No summary data available. Please select the "All" report type.
          </Text>
        </View>
      );
    }

    // Now TypeScript knows summaryData is SummaryData type
    const inward = summaryData.inward || {};
    const outward = summaryData.outward || {};
    const summary = summaryData.summary || {};

    console.log('Rendering summary data:');
    console.log('Inward data for rendering:', JSON.stringify(inward, null, 2));
    console.log(
      'Outward data for rendering:',
      JSON.stringify(outward, null, 2),
    );
    console.log(
      'Summary data for rendering:',
      JSON.stringify(summary, null, 2),
    );

    // Show full raw data in logs for troubleshooting
    console.log(
      'TOTAL_INWARD_QUANTITY type:',
      typeof inward.TOTAL_INWARD_QUANTITY,
    );
    console.log(
      'TOTAL_INWARD_QUANTITY raw value:',
      inward.TOTAL_INWARD_QUANTITY,
    );
    console.log(
      'TOTAL_INWARD_QUANTITY formatted:',
      formatNumber(inward.TOTAL_INWARD_QUANTITY),
    );
    console.log(
      'TOTAL_OUTWARD_QUANTITY raw value:',
      outward.TOTAL_OUTWARD_QUANTITY,
    );
    console.log(
      'TOTAL_OUTWARD_QUANTITY formatted:',
      formatNumber(outward.TOTAL_OUTWARD_QUANTITY),
    );

    // Check if there's meaningful data
    const hasData =
      inward.TOTAL_INWARD_QUANTITY != null ||
      outward.TOTAL_OUTWARD_QUANTITY != null ||
      summary.TOTAL_FULLFILLMENT_RATE != null;

    if (!hasData) {
      return (
        <View style={styles.reportSection}>
          <Text style={styles.emptyMessage}>
            No report data found for the selected date range. Try selecting a
            different date range.
          </Text>
        </View>
      );
    }

    return (
      <>
        <View style={styles.reportSection}>
          <Text style={styles.sectionTitle}>Inward Summary</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total Quantity:</Text>
            <Text style={styles.metricValue}>
              {formatNumber(inward.TOTAL_INWARD_QUANTITY)}
            </Text>
          </View>
          {/* <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total Documents:</Text>
            <Text style={styles.metricValue}>
              {inward.TOTAL_INWARD_DOCUMENTS || 0}
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total Customers:</Text>
            <Text style={styles.metricValue}>
              {inward.TOTAL_INWARD_CUSTOMERS || 0}
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total Lots:</Text>
            <Text style={styles.metricValue}>
              {inward.TOTAL_INWARD_LOTS || 0}
            </Text>
          </View> */}
        </View>

        <View style={styles.reportSection}>
          <Text style={styles.sectionTitle}>Outward Summary</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total Quantity:</Text>
            <Text style={styles.metricValue}>
              {formatNumber(outward.TOTAL_OUTWARD_QUANTITY)}
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Requested Quantity:</Text>
            <Text style={styles.metricValue}>
              {formatNumber(outward.TOTAL_REQUESTED_QUANTITY)}
            </Text>
          </View>
        </View>

        <View style={styles.reportSection}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Net Quantity:</Text>
            <Text style={styles.metricValue}>
              {formatNumber(summary.NET_QUANTITY)}
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Pending Quantity:</Text>
            <Text style={styles.metricValue}>
              {formatNumber(summary.PENDING_QUANTITY)}
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Fulfillment Rate:</Text>
            <Text style={styles.metricValue}>
              {formatNumber(summary.DELIVERY_FULFILLMENT_RATE)}%
            </Text>
          </View>
        </View>
      </>
    );
  };

  // Add the renderItemWiseData function
  const renderItemWiseData = () => {
    if (!summaryData) {
      console.log('No item-wise data available to render');
      return (
        <View style={styles.reportSection}>
          <Text style={styles.emptyMessage}>
            Select a date range and press "Apply Date Range" to view item-wise
            data
          </Text>
        </View>
      );
    }

    // Check if we have the correct data type using the type guard
    if (!isItemWiseData(summaryData)) {
      console.log('Data is not in item-wise format');
      return (
        <View style={styles.reportSection}>
          <Text style={styles.emptyMessage}>
            No item-wise data available. Please select the "Item-wise" report
            type.
          </Text>
        </View>
      );
    }

    // Now TypeScript knows summaryData is ItemWiseData[] type
    const itemWiseData = summaryData;

    if (itemWiseData.length === 0) {
      return (
        <View style={styles.reportSection}>
          <Text style={styles.emptyMessage}>
            No item data found for the selected date range. Try selecting a
            different date range.
          </Text>
        </View>
      );
    }

    // Log all items to console
    console.log(`Logging all ${itemWiseData.length} items:`);
    itemWiseData.forEach((item, index) => {
      console.log(`Item ${index + 1}:`, JSON.stringify(item, null, 2));
    });

    return (
      <View style={styles.reportSection}>
        <Text style={styles.sectionTitle}>
          Item-wise Summary ({itemWiseData.length} items)
        </Text>

        <View style={styles.minimumScrollHint}>
          <Text style={styles.minimumScrollHintText}>
            ⟷ Scroll horizontally to see more columns
          </Text>
        </View>

        {/* Main table container with proper sizing */}
        <View style={styles.tableWrapper}>
          {/* Horizontal Scroll Container */}
          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={{minWidth: 620}}>
            {/* Table Container with Fixed Width */}
            <View style={styles.tableContainer}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <View style={[styles.headerCell, {width: 200}]}>
                  <Text style={styles.headerText} numberOfLines={2}>
                    Item Details
                  </Text>
                </View>
                <View style={[styles.headerCell, {width: 100}]}>
                  <Text style={styles.headerText}>Inward Qty</Text>
                </View>
                <View style={[styles.headerCell, {width: 100}]}>
                  <Text style={styles.headerText}>Outward Qty</Text>
                </View>
                <View style={[styles.headerCell, {width: 120}]}>
                  <Text style={styles.headerText}>Requested Qty</Text>
                </View>
                <View style={[styles.headerCell, {width: 100}]}>
                  <Text style={styles.headerText}>Net Qty</Text>
                </View>
              </View>

              {/* Fixed-height container for vertical scrolling */}
              <View style={{height: Math.min(tableHeight, 450)}}>
                {/* Vertical Scroll for Rows */}
                <ScrollView
                  nestedScrollEnabled={true}
                  showsVerticalScrollIndicator={true}
                  persistentScrollbar={true}>
                  {itemWiseData.map((item, index) => (
                    <View
                      key={`${item.ITEM_ID}-${index}`}
                      style={[styles.tableRow, {minWidth: 620}]}>
                      {/* Item Details Column */}
                      <View style={[styles.dataCell, {width: 200}]}>
                        <Text style={styles.itemName} numberOfLines={1}>
                          {item.ITEM_NAME || 'Unknown Item'}
                        </Text>
                        {/* <Text style={styles.itemCategory} numberOfLines={1}>
                          {[item.ITEM_CATEG_NAME, item.SUB_CATEGORY_NAME]
                            .filter(Boolean)
                            .join(' / ')}
                        </Text> */}
                      </View>

                      {/* Data Columns */}
                      <View style={[styles.dataCell, {width: 100}]}>
                        <Text style={styles.dataText}>
                          {formatNumber(item.TOTAL_INWARD_QUANTITY)}
                        </Text>
                      </View>
                      <View style={[styles.dataCell, {width: 100}]}>
                        <Text style={styles.dataText}>
                          {formatNumber(item.TOTAL_OUTWARD_QUANTITY)}
                        </Text>
                      </View>
                      <View style={[styles.dataCell, {width: 120}]}>
                        <Text style={styles.dataText}>
                          {formatNumber(item.TOTAL_REQUESTED_QUANTITY)}
                        </Text>
                      </View>
                      <View style={[styles.dataCell, {width: 100}]}>
                        <Text
                          style={[
                            styles.dataText,
                            Number(item.NET_QUANTITY) > 0
                              ? styles.positive
                              : Number(item.NET_QUANTITY) < 0
                              ? styles.negative
                              : null,
                          ]}>
                          {formatNumber(Math.abs(Number(item.NET_QUANTITY)))}
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  };

  // Filter display component
  const renderActiveFilters = () => {
    // Removed as not needed
    return null;
  };

  return (
    <LayoutWrapper showHeader={true} showTabBar={false} route={route}>
      <View style={styles.container}>
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>Report Summary</Text>
        </View>

        {/* Date Range Selector */}
        <View style={styles.dateContainer}>
          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>From:</Text>
            <TouchableOpacity
              style={styles.datePicker}
              onPress={() => {
                setTempFromDate(fromDate);
                setShowFromDatePicker(true);
              }}>
              <Text style={styles.dateText}>{formatDisplayDate(fromDate)}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>To:</Text>
            <TouchableOpacity
              style={styles.datePicker}
              onPress={() => {
                setTempToDate(toDate);
                setShowToDatePicker(true);
              }}>
              <Text style={styles.dateText}>{formatDisplayDate(toDate)}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Apply button for date range */}
        <TouchableOpacity style={styles.applyButton} onPress={handleApplyDates}>
          <Text style={styles.applyButtonText}> Apply Date Range</Text>
        </TouchableOpacity>

        {/* Replace the individual radio buttons with this container */}
        <View style={styles.radioContainer}>
          <TouchableOpacity
            style={[
              styles.radioButton,
              reportType === 'all' && styles.radioSelected,
            ]}
            onPress={() => handleReportTypeChange('all')}>
            <View
              style={[
                styles.radioCircle,
                reportType === 'all' && {borderColor: '#F48221'},
              ]}>
              {reportType === 'all' && <View style={styles.radioFill} />}
            </View>
            <Text
              style={[
                styles.radioLabel,
                reportType === 'all' && styles.radioSelectedLabel,
              ]}>
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.radioButton,
              reportType === 'itemwise' && styles.radioSelected,
            ]}
            onPress={() => handleReportTypeChange('itemwise')}>
            <View
              style={[
                styles.radioCircle,
                reportType === 'itemwise' && {borderColor: '#F48221'},
              ]}>
              {reportType === 'itemwise' && <View style={styles.radioFill} />}
            </View>
            <Text
              style={[
                styles.radioLabel,
                reportType === 'itemwise' && styles.radioSelectedLabel,
              ]}>
              Item-wise
            </Text>
          </TouchableOpacity>
        </View>

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F48221" />
            <Text style={styles.loadingText}>Loading report data...</Text>
          </View>
        )}

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleApplyDates}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Report Content */}
        {!loading && !error && (
          <ScrollView ref={scrollViewRef} style={styles.scrollContainer}>
            {reportType === 'all' ? renderSummaryData() : renderItemWiseData()}
          </ScrollView>
        )}

        {/* Date Picker Modals */}
        {Platform.OS === 'ios' ? (
          // iOS date picker modal
          <>
            {showFromDatePicker && (
              <Modal
                transparent={true}
                animationType="fade"
                visible={showFromDatePicker}>
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Select From Date</Text>

                    <DateTimePicker
                      value={tempFromDate}
                      mode="date"
                      display="spinner"
                      onChange={onFromDateChange}
                      textColor="#000000"
                      style={styles.iosDatePicker}
                      minimumDate={new Date(2020, 0, 1)}
                      maximumDate={new Date()}
                    />

                    <View style={styles.modalButtons}>
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
                  </View>
                </View>
              </Modal>
            )}

            {showToDatePicker && (
              <Modal
                transparent={true}
                animationType="fade"
                visible={showToDatePicker}>
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Select To Date</Text>

                    <DateTimePicker
                      value={tempToDate}
                      mode="date"
                      display="spinner"
                      onChange={onToDateChange}
                      style={styles.iosDatePicker}
                      minimumDate={new Date(2020, 0, 1)}
                      maximumDate={new Date()}
                      // Add these props for iOS
                      textColor="#000000"
                      accentColor="#F48221" // Your app's orange accent color
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
            {showFromDatePicker && (
              <DateTimePicker
                value={tempFromDate}
                mode="date"
                is24Hour={true}
                display="default"
                onChange={onFromDateChange}
                minimumDate={new Date(2020, 0, 1)}
                maximumDate={new Date()}
              />
            )}

            {showToDatePicker && (
              <DateTimePicker
                value={tempToDate}
                mode="date"
                display="default"
                onChange={onToDateChange}
                minimumDate={new Date(2020, 0, 1)}
                maximumDate={new Date()}
              />
            )}
          </>
        )}
      </View>
    </LayoutWrapper>
  );
};

// Styles with additions for active filters
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
  },
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
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateField: {
    flex: 1,
    marginHorizontal: 4,
  },
  dateLabel: {
    fontSize: 14,
    marginBottom: 4,
    color: '#666',
  },
  datePicker: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  applyButton: {
    backgroundColor: '#F48221',
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  dateRangeHint: {
    color: '#666',
    fontSize: 12,
    marginTop: 8,
    marginBottom: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  scrollContainer: {
    flex: 1,
  },
  reportSection: {
    backgroundColor: '#f9f9f9',
    paddingVertical: 16,
    paddingHorizontal: 6,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 8,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  metricLabel: {
    fontSize: 15,
    color: '#555',
    flex: 2,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  positive: {
    color: '#333', // Green
    fontWeight: 'bold',
  },
  negative: {
    color: '#333', // Red
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  radioButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    // borderWidth: 1,
    // borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioFill: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#F48221',
  },
  radioLabel: {
    fontSize: 16,
    color: '#666',
  },
  radioSelected: {
    borderColor: '#F48221',
  },
  radioSelectedLabel: {
    color: '#F48221',
  },

  ioSelected: {
    borderColor: '#F48221', // Orange border instead of background
  },

  errorContainer: {
    padding: 16,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    marginVertical: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#c62828',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#F48221',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
    fontSize: 16,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    shadowColor: '#000',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
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
    backgroundColor: '#F48221',
    padding: 12,
    borderRadius: 6,
    marginLeft: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  debugContainer: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 16,
  },
  debugTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  debugText: {
    color: '#666',
    fontSize: 12,
  },
  tableContainer: {
    flexDirection: 'column',
    minWidth: 620, // Total of all column widths
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#ddd',
  },
  headerCell: {
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  headerText: {
    fontWeight: '600',
    fontSize: 12,
    color: '#444',
    textAlign: 'center',
  },
  verticalScroll: {
    minHeight: 300,
    maxHeight: 650,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  dataCell: {
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  dataText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  itemName: {
    fontWeight: '500',
    fontSize: 12,
  },
  itemCategory: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  scrollIndicator: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    alignItems: 'center',
  },
  scrollIndicatorText: {
    color: '#F48221',
    fontSize: 14,
    fontWeight: '500',
  },
  scrollHint: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  scrollHintText: {
    color: '#F48221',
    fontSize: 14,
    fontWeight: '500',
  },
  tableWrapper: {
    flex: 1,
    flexDirection: 'column',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
    marginHorizontal: 0,
    minHeight: 500,
    width: '100%', // Take full available width
  },
  minimumScrollHint: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    backgroundColor: '#f8f8f8',
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 3,
  },
  minimumScrollHintText: {
    color: '#666',
    fontSize: 11,
  },
});

export default ReportSummaryScreen;