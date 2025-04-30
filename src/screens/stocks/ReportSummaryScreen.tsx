// // import React from 'react';
// // import {View, Text, StyleSheet, ScrollView} from 'react-native';

// // const ReportSummaryScreen = () => {
// //   return (
// //     <ScrollView style={styles.container}>
// //       <Text style={styles.title}>Report Summary</Text>
// //       <View style={styles.reportSection}>
// //         <Text style={styles.sectionTitle}>Overall Business Metrics</Text>
// //         <View style={styles.metricRow}>
// //           <Text>Total Sales:</Text>
// //           <Text>$0</Text>
// //         </View>
// //         <View style={styles.metricRow}>
// //           <Text>Total Orders:</Text>
// //           <Text>0</Text>
// //         </View>
// //         <View style={styles.metricRow}>
// //           <Text>Average Order Value:</Text>
// //           <Text>$0</Text>
// //         </View>
// //       </View>
// //     </ScrollView>
// //   );
// // };

// // const styles = StyleSheet.create({
// //   container: {
// //     flex: 1,
// //     padding: 16,
// //     backgroundColor: '#fff',
// //   },
// //   title: {
// //     fontSize: 24,
// //     fontWeight: 'bold',
// //     marginBottom: 16,
// //     color: '#F48221',
// //   },
// //   reportSection: {
// //     backgroundColor: '#f9f9f9',
// //     padding: 16,
// //     borderRadius: 8,
// //     marginBottom: 16,
// //   },
// //   sectionTitle: {
// //     fontSize: 18,
// //     fontWeight: 'bold',
// //     marginBottom: 12,
// //     color: '#333',
// //   },
// //   metricRow: {
// //     flexDirection: 'row',
// //     justifyContent: 'space-between',
// //     paddingVertical: 8,
// //     borderBottomWidth: 1,
// //     borderBottomColor: '#e0e0e0',
// //   },
// // });

// // export default ReportSummaryScreen;

// //vaishnavi
// import React, {useState, useEffect, useCallback} from 'react';
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
// } from 'react-native';
// import axios from 'axios';
// import DateTimePicker, {
//   DateTimePickerEvent,
// } from '@react-native-community/datetimepicker';
// import {format} from 'date-fns';
// import {API_ENDPOINTS, getAuthHeaders} from '../../config/api.config';

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
// }

// interface ApiResponse {
//   success: boolean;
//   data: SummaryData | ItemWiseData[];
//   filters?: Filters;
//   message?: string;
//   error?: string;
// }

// const ReportSummaryScreen: React.FC = () => {
//   // State with proper types
//   const [reportType, setReportType] = useState<'all' | 'itemwise'>('all');
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
//   const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
//   const [itemWiseData, setItemWiseData] = useState<ItemWiseData[]>([]);
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
//   // Add a state to force re-renders when needed
//   const [refreshKey, setRefreshKey] = useState<number>(0);

//   // Format dates for display
//   const formatDisplayDate = (date: Date): string => {
//     return format(date, 'dd/MM/yyyy');
//   };

//   // Format dates for API
//   const formatApiDate = (date: Date): string => {
//     return format(date, 'yyyy-MM-dd');
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
//       setTempFromDate(selectedDate);
//       if (Platform.OS === 'android') {
//         setFromDate(selectedDate);
//       }
//     }
//   };

//   const onToDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
//     if (Platform.OS === 'android') {
//       setShowToDatePicker(false);
//     }

//     if (selectedDate) {
//       setTempToDate(selectedDate);
//       if (Platform.OS === 'android') {
//         setToDate(selectedDate);
//       }
//     }
//   };

//   // Confirm date selections for iOS
//   const confirmFromDate = () => {
//     setFromDate(tempFromDate);
//     setShowFromDatePicker(false);
//   };

//   const confirmToDate = () => {
//     setToDate(tempToDate);
//     setShowToDatePicker(false);
//   };

//   // Format numbers for display with proper typing
//   const formatNumber = (
//     value: number | string | undefined | null,
//     decimals: number = 2,
//   ): string => {
//     if (value === undefined || value === null) {
//       return '0';
//     }
//     const num = Number(value);

//     // Format based on size of number
//     if (isNaN(num)) return '0';

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

//   // Use useCallback to memoize the fetch functions
//   const fetchSummaryData = useCallback(async (headers: any, payload: any) => {
//     try {
//       console.log(
//         `Fetching summary data from ${API_ENDPOINTS.GET_ALL_SUMMARY}`,
//       );
//       console.log('API URL:', API_ENDPOINTS.GET_ALL_SUMMARY);
//       console.log('Request payload:', JSON.stringify(payload, null, 2));
//       console.log('Request headers:', JSON.stringify(headers, null, 2));

//       const response = await axios.post<ApiResponse>(
//         API_ENDPOINTS.GET_ALL_SUMMARY,
//         payload,
//         {headers},
//       );

//       console.log(
//         'Summary API Response Status:',
//         response.status,
//         response.statusText,
//       );
//       console.log(
//         'Summary API Response Headers:',
//         JSON.stringify(response.headers, null, 2),
//       );
//       console.log(
//         'Summary API Response Body:',
//         JSON.stringify(response.data, null, 2),
//       );
//       console.log('Success value:', response.data?.success);

//       // Type check before accessing nested properties
//       if (
//         response.data &&
//         response.data.data &&
//         !Array.isArray(response.data.data)
//       ) {
//         console.log(
//           'Inward data:',
//           JSON.stringify(response.data.data.inward, null, 2),
//         );
//         console.log(
//           'Outward data:',
//           JSON.stringify(response.data.data.outward, null, 2),
//         );
//         console.log(
//           'Summary data:',
//           JSON.stringify(response.data.data.summary, null, 2),
//         );
//       }

//       if (response.data && response.data.success) {
//         console.log('Setting summary data to state');
//         setSummaryData(response.data.data as SummaryData);

//         // Store filters from response if available
//         if (response.data.filters) {
//           console.log('Setting filters from response');
//           setFilters(response.data.filters);
//         }

//         // Force a refresh by updating the refresh key
//         setRefreshKey(prevKey => prevKey + 1);
//       } else {
//         const errorMessage =
//           response.data?.message || 'Failed to fetch summary data';
//         console.error(
//           'API returned success=false. Error message:',
//           errorMessage,
//         );
//         setError(errorMessage);
//       }
//     } catch (error: any) {
//       console.error('Exception in fetchSummaryData:');
//       console.error('Error message:', error.message);
//       console.error(
//         'Error response:',
//         error.response
//           ? JSON.stringify(error.response.data, null, 2)
//           : 'No response data',
//       );
//       throw error;
//     }
//   }, []);

//   // Fetch item-wise data with typed response
//   const fetchItemWiseData = useCallback(async (headers: any, payload: any) => {
//     try {
//       console.log(
//         `Fetching item-wise data from ${API_ENDPOINTS.GET_ITEMWISE_SUMMARY}`,
//         payload,
//       );

//       const response = await axios.post<ApiResponse>(
//         API_ENDPOINTS.GET_ITEMWISE_SUMMARY,
//         payload,
//         {headers},
//       );

//       console.log('Item-wise API Response:', response.data);

//       if (response.data && response.data.success) {
//         setItemWiseData(response.data.data as ItemWiseData[]);

//         // Store filters from response if available
//         if (response.data.filters) {
//           setFilters(response.data.filters);
//         }

//         // Force a refresh by updating the refresh key
//         setRefreshKey(prevKey => prevKey + 1);
//       } else {
//         const errorMessage =
//           response.data?.message || 'Failed to fetch item-wise data';
//         setError(errorMessage);
//         console.error('Item-wise API Error:', errorMessage);
//       }
//     } catch (error) {
//       console.error('Error in fetchItemWiseData:', error);
//       throw error;
//     }
//   }, []);

//   // Handle report type change
//   const handleReportTypeChange = (type: 'all' | 'itemwise') => {
//     if (type !== reportType) {
//       setReportType(type);
//       // Clear previous data when switching report types
//       if (type === 'all') {
//         setItemWiseData([]);
//       } else {
//         setSummaryData(null);
//       }

//       // Force a refresh
//       setRefreshKey(prevKey => prevKey + 1);
//     }
//   };

//   // Handle date changes and fetch data
//   const handleApplyDates = async () => {
//     console.log('Apply Date Range button pressed');
//     console.log('Current report type:', reportType);
//     console.log(
//       'Date range:',
//       formatApiDate(fromDate),
//       'to',
//       formatApiDate(toDate),
//     );

//     setLoading(true);
//     setError(null);

//     // Clear existing data when applying new date range
//     if (reportType === 'all') {
//       setSummaryData(null);
//     } else {
//       setItemWiseData([]);
//     }

//     try {
//       // Get auth headers
//       const headers = await getAuthHeaders();
//       console.log('Auth headers:', JSON.stringify(headers, null, 2));

//       // Set sample data for testing with the specific customer and unit
//       const updatedFilters = {
//         ...filters,
//         customerName: 'UNICORP ENTERPRISES',
//         unitName: 'D-39',
//       };

//       // Prepare request payload with dates and any filters
//       const payload = {
//         fromDate: formatApiDate(fromDate),
//         toDate: formatApiDate(toDate),
//         ...updatedFilters,
//       };

//       console.log('Request payload:', JSON.stringify(payload, null, 2));

//       // Based on current report type, call the appropriate API
//       if (reportType === 'all') {
//         console.log('Calling GET_ALL_SUMMARY API directly');
//         await fetchSummaryData(headers, payload);
//       } else {
//         console.log('Calling GET_ITEMWISE_SUMMARY API directly');
//         await fetchItemWiseData(headers, payload);
//       }
//     } catch (err: any) {
//       console.error('Error in handleApplyDates:', err);
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
//     }
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

//     // Safely access nested properties with defaults
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
//     console.log(
//       'TOTAL_INWARD_QUANTITY raw value:',
//       inward.TOTAL_INWARD_QUANTITY,
//     );
//     console.log(
//       'TOTAL_INWARD_QUANTITY formatted:',
//       formatNumber(inward.TOTAL_INWARD_QUANTITY),
//     );

//     // Check if there's meaningful data
//     const hasData =
//       inward.TOTAL_INWARD_QUANTITY !== null ||
//       outward.TOTAL_OUTWARD_QUANTITY !== null ||
//       summary.TOTAL_QUANTITY_DIFFERENCE !== 0;

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

//   // Render item-wise data
//   const renderItemWiseData = () => {
//     if (!itemWiseData || itemWiseData.length === 0) {
//       return (
//         <View style={styles.reportSection}>
//           <Text style={styles.emptyMessage}>
//             Select a date range and press "Apply Date Range" to view item data
//           </Text>
//         </View>
//       );
//     }

//     return (
//       <View style={styles.reportSection}>
//         <Text style={styles.sectionTitle}>Item-wise Summary</Text>

//         <View style={styles.tableHeader}>
//           <Text style={styles.headerCell}>Item</Text>
//           <Text style={styles.headerCell}>Inward</Text>
//           <Text style={styles.headerCell}>Outward</Text>
//           <Text style={styles.headerCell}>Net</Text>
//         </View>

//         {itemWiseData.map((item, index) => (
//           <View key={`${item.ITEM_ID}-${index}`} style={styles.tableRow}>
//             <View style={styles.itemNameColumn}>
//               <Text style={styles.itemName} numberOfLines={2}>
//                 {item.ITEM_NAME || 'Unknown Item'}
//               </Text>
//               <Text style={styles.itemCategory} numberOfLines={1}>
//                 {item.ITEM_CATEG_NAME || 'N/A'}
//                 {item.SUB_CATEGORY_NAME ? ` / ${item.SUB_CATEGORY_NAME}` : ''}
//               </Text>
//             </View>
//             <Text style={styles.dataCell}>
//               {formatNumber(item.TOTAL_INWARD_QUANTITY)}
//             </Text>
//             <Text style={styles.dataCell}>
//               {formatNumber(item.TOTAL_OUTWARD_QUANTITY)}
//             </Text>
//             <Text
//               style={[
//                 styles.dataCell,
//                 Number(item.NET_QUANTITY) > 0
//                   ? styles.positive
//                   : Number(item.NET_QUANTITY) < 0
//                   ? styles.negative
//                   : null,
//               ]}>
//               {formatNumber(item.NET_QUANTITY)}
//             </Text>
//           </View>
//         ))}
//       </View>
//     );
//   };

//   return (
//     <View style={styles.container} key={refreshKey}>
//       <Text style={styles.title}>Report Summary</Text>

//       {/* Date Range Selector */}
//       <View style={styles.dateContainer}>
//         <View style={styles.dateField}>
//           <Text style={styles.dateLabel}>From:</Text>
//           <TouchableOpacity
//             style={styles.datePicker}
//             onPress={() => {
//               setTempFromDate(fromDate);
//               setShowFromDatePicker(true);
//             }}>
//             <Text style={styles.dateText}>{formatDisplayDate(fromDate)}</Text>
//           </TouchableOpacity>
//         </View>

//         <View style={styles.dateField}>
//           <Text style={styles.dateLabel}>To:</Text>
//           <TouchableOpacity
//             style={styles.datePicker}
//             onPress={() => {
//               setTempToDate(toDate);
//               setShowToDatePicker(true);
//             }}>
//             <Text style={styles.dateText}>{formatDisplayDate(toDate)}</Text>
//           </TouchableOpacity>
//         </View>
//       </View>

//       {/* Apply button for date range */}
//       <TouchableOpacity style={styles.applyButton} onPress={handleApplyDates}>
//         <Text style={styles.applyButtonText}> Apply Date Range</Text>
//       </TouchableOpacity>

//       {/* Report Type Toggle */}
//       <View style={styles.radioContainer}>
//         <TouchableOpacity
//           style={[
//             styles.radioButton,
//             reportType === 'all' && styles.radioSelected,
//           ]}
//           onPress={() => handleReportTypeChange('all')}>
//           <View style={styles.radioCircle}>
//             {reportType === 'all' && <View style={styles.radioFill} />}
//           </View>
//           <Text style={styles.radioLabel}>All</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[
//             styles.radioButton,
//             reportType === 'itemwise' && styles.radioSelected,
//           ]}
//           onPress={() => handleReportTypeChange('itemwise')}>
//           <View style={styles.radioCircle}>
//             {reportType === 'itemwise' && <View style={styles.radioFill} />}
//           </View>
//           <Text style={styles.radioLabel}>Item-wise</Text>
//         </TouchableOpacity>
//       </View>

//       {/* Loading Indicator */}
//       {loading && (
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#F48221" />
//           <Text style={styles.loadingText}>Loading report data...</Text>
//         </View>
//       )}

//       {/* Error Message */}
//       {error && (
//         <View style={styles.errorContainer}>
//           <Text style={styles.errorText}>{error}</Text>
//           <TouchableOpacity
//             style={styles.retryButton}
//             onPress={handleApplyDates}>
//             <Text style={styles.retryButtonText}>Retry</Text>
//           </TouchableOpacity>
//         </View>
//       )}

//       {/* Report Content */}
//       {!loading && !error && (
//         <ScrollView style={styles.scrollContainer}>
//           {reportType === 'all' ? renderSummaryData() : renderItemWiseData()}
//         </ScrollView>
//       )}

//       {/* Date Picker Modals */}
//       {Platform.OS === 'ios' ? (
//         // iOS date picker modal
//         <>
//           {showFromDatePicker && (
//             <Modal
//               transparent={true}
//               animationType="fade"
//               visible={showFromDatePicker}>
//               <View style={styles.modalOverlay}>
//                 <View style={styles.modalContent}>
//                   <Text style={styles.modalTitle}>Select From Date</Text>

//                   <DateTimePicker
//                     value={tempFromDate}
//                     mode="date"
//                     display="spinner"
//                     onChange={onFromDateChange}
//                     style={styles.iosDatePicker}
//                     minimumDate={new Date(2020, 0, 1)}
//                     maximumDate={new Date()}
//                   />

//                   <View style={styles.modalButtons}>
//                     <TouchableOpacity
//                       style={styles.cancelButton}
//                       onPress={() => setShowFromDatePicker(false)}>
//                       <Text style={styles.buttonText}>Cancel</Text>
//                     </TouchableOpacity>

//                     <TouchableOpacity
//                       style={styles.confirmButton}
//                       onPress={confirmFromDate}>
//                       <Text style={styles.buttonText}>Confirm</Text>
//                     </TouchableOpacity>
//                   </View>
//                 </View>
//               </View>
//             </Modal>
//           )}

//           {showToDatePicker && (
//             <Modal
//               transparent={true}
//               animationType="fade"
//               visible={showToDatePicker}>
//               <View style={styles.modalOverlay}>
//                 <View style={styles.modalContent}>
//                   <Text style={styles.modalTitle}>Select To Date</Text>

//                   <DateTimePicker
//                     value={tempToDate}
//                     mode="date"
//                     display="spinner"
//                     onChange={onToDateChange}
//                     style={styles.iosDatePicker}
//                     minimumDate={tempFromDate}
//                     maximumDate={new Date()}
//                   />

//                   <View style={styles.modalButtons}>
//                     <TouchableOpacity
//                       style={styles.cancelButton}
//                       onPress={() => setShowToDatePicker(false)}>
//                       <Text style={styles.buttonText}>Cancel</Text>
//                     </TouchableOpacity>

//                     <TouchableOpacity
//                       style={styles.confirmButton}
//                       onPress={confirmToDate}>
//                       <Text style={styles.buttonText}>Confirm</Text>
//                     </TouchableOpacity>
//                   </View>
//                 </View>
//               </View>
//             </Modal>
//           )}
//         </>
//       ) : (
//         // Android date picker
//         <>
//           {showFromDatePicker && (
//             <DateTimePicker
//               value={tempFromDate}
//               mode="date"
//               is24Hour={true}
//               display="default"
//               onChange={onFromDateChange}
//               minimumDate={new Date(2020, 0, 1)}
//               maximumDate={new Date()}
//             />
//           )}

//           {showToDatePicker && (
//             <DateTimePicker
//               value={tempToDate}
//               mode="date"
//               is24Hour={true}
//               display="default"
//               onChange={onToDateChange}
//               minimumDate={tempFromDate}
//               maximumDate={new Date()}
//             />
//           )}
//         </>
//       )}
//     </View>
//   );
// };

// // Styles with additions for active filters
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
//   radioContainer: {
//     flexDirection: 'row',
//     marginBottom: 16,
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 8,
//     padding: 4,
//   },
//   radioButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//     paddingVertical: 10,
//     paddingHorizontal: 16,
//     justifyContent: 'center',
//   },
//   radioSelected: {
//     backgroundColor: 'rgba(244, 130, 33, 0.1)',
//     borderRadius: 6,
//   },
//   radioCircle: {
//     height: 20,
//     width: 20,
//     borderRadius: 10,
//     borderWidth: 2,
//     borderColor: '#F48221',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: 8,
//   },
//   radioFill: {
//     height: 10,
//     width: 10,
//     borderRadius: 5,
//     backgroundColor: '#F48221',
//   },
//   radioLabel: {
//     fontSize: 16,
//     color: '#333',
//     fontWeight: '500',
//   },
//   scrollContainer: {
//     flex: 1,
//   },
//   reportSection: {
//     backgroundColor: '#f9f9f9',
//     padding: 16,
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
//     color: '#0b8043', // Green
//   },
//   negative: {
//     color: '#d23f31', // Red
//   },
//   tableHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     paddingVertical: 10,
//     borderBottomWidth: 2,
//     borderBottomColor: '#ddd',
//     marginBottom: 8,
//     backgroundColor: '#f2f2f2',
//     borderRadius: 4,
//   },
//   headerCell: {
//     flex: 1,
//     fontWeight: 'bold',
//     fontSize: 14,
//     color: '#555',
//     textAlign: 'center',
//   },
//   tableRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: '#eee',
//   },
//   itemNameColumn: {
//     flex: 1.5,
//     paddingRight: 5,
//   },
//   itemName: {
//     fontSize: 14,
//     color: '#333',
//     fontWeight: '500',
//   },
//   itemCategory: {
//     fontSize: 12,
//     color: '#666',
//     marginTop: 2,
//   },
//   dataCell: {
//     flex: 1,
//     fontSize: 14,
//     textAlign: 'center',
//     alignSelf: 'center',
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
// });

// export default ReportSummaryScreen;

//vaishnavi
import React, {useState, useEffect} from 'react';
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
} from 'react-native';
import axios from 'axios';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import {format} from 'date-fns';
import {API_ENDPOINTS, getAuthHeaders} from '../../config/api.config';

// Define types for API responses
interface SummaryData {
  inward?: {
    TOTAL_INWARD_QUANTITY?: number | string;
    TOTAL_INWARD_DOCUMENTS?: number;
    TOTAL_INWARD_CUSTOMERS?: number;
    TOTAL_INWARD_LOTS?: number;
  };
  outward?: {
    TOTAL_OUTWARD_QUANTITY?: number | string;
    TOTAL_REQUESTED_QUANTITY?: number | string;
    TOTAL_OUTWARD_DOCUMENTS?: number;
    TOTAL_OUTWARD_CUSTOMERS?: number;
    TOTAL_OUTWARD_LOTS?: number;
  };
  summary?: {
    TOTAL_QUANTITY_DIFFERENCE?: number | string;
    TOTAL_DOCUMENTS?: number;
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
    console.log(
      'TOTAL_QUANTITY_DIFFERENCE raw value:',
      summary.TOTAL_QUANTITY_DIFFERENCE,
    );
    console.log(
      'TOTAL_QUANTITY_DIFFERENCE formatted:',
      formatNumber(summary.TOTAL_QUANTITY_DIFFERENCE),
    );

    // Check if there's meaningful data
    const hasData =
      inward.TOTAL_INWARD_QUANTITY != null ||
      outward.TOTAL_OUTWARD_QUANTITY != null ||
      summary.TOTAL_QUANTITY_DIFFERENCE != null;

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
          <View style={styles.metricRow}>
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
          </View>
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
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total Documents:</Text>
            <Text style={styles.metricValue}>
              {outward.TOTAL_OUTWARD_DOCUMENTS || 0}
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total Customers:</Text>
            <Text style={styles.metricValue}>
              {outward.TOTAL_OUTWARD_CUSTOMERS || 0}
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total Lots:</Text>
            <Text style={styles.metricValue}>
              {outward.TOTAL_OUTWARD_LOTS || 0}
            </Text>
          </View>
        </View>

        <View style={styles.reportSection}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Quantity Difference:</Text>
            <Text
              style={[
                styles.metricValue,
                Number(summary.TOTAL_QUANTITY_DIFFERENCE) > 0
                  ? styles.positive
                  : Number(summary.TOTAL_QUANTITY_DIFFERENCE) < 0
                  ? styles.negative
                  : null,
              ]}>
              {formatNumber(summary.TOTAL_QUANTITY_DIFFERENCE)}
            </Text>
          </View>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total Documents:</Text>
            <Text style={styles.metricValue}>
              {summary.TOTAL_DOCUMENTS || 0}
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

        <View style={styles.tableHeader}>
          <Text style={styles.itemDetailsHeader}>Item Details</Text>
          <Text style={styles.headerCell}>Inward Qty</Text>
          <Text style={styles.headerCell}>Outward Qty</Text>
          <Text style={styles.headerCell}>Requested Qty</Text>
          <Text style={styles.headerCell}>Net Balance</Text>
        </View>

        <ScrollView style={{maxHeight: 500}}>
          {itemWiseData.map((item, index) => (
            <View
              key={`${item.ITEM_ID || ''}-${index}`}
              style={styles.tableRow}>
              <View style={styles.itemNameColumn}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.ITEM_NAME || 'Unknown Item'}
                </Text>
                <Text style={styles.itemCategory} numberOfLines={1}>
                  {item.ITEM_CATEG_NAME || 'N/A'}
                  {item.SUB_CATEGORY_NAME ? ` / ${item.SUB_CATEGORY_NAME}` : ''}
                </Text>
                {/* <Text style={styles.itemId}>ID: {item.ITEM_ID || 'N/A'}</Text> */}
              </View>
              <Text style={styles.dataCell}>
                {formatNumber(item.TOTAL_INWARD_QUANTITY)}
              </Text>
              <Text style={styles.dataCell}>
                {formatNumber(item.TOTAL_OUTWARD_QUANTITY)}
              </Text>
              <Text style={styles.dataCell}>
                {formatNumber(item.TOTAL_REQUESTED_QUANTITY)}
              </Text>
              <Text
                style={[
                  styles.dataCell,
                  Number(item.NET_QUANTITY) > 0
                    ? styles.positive
                    : Number(item.NET_QUANTITY) < 0
                    ? styles.negative
                    : null,
                ]}>
                {formatNumber(item.NET_QUANTITY)}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Filter display component
  const renderActiveFilters = () => {
    // Removed as not needed
    return null;
  };

  return (
    <View style={styles.container}>
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

      {/* Report Type Toggle */}
      <View style={styles.radioContainer}>
        <TouchableOpacity
          style={[
            styles.radioButton,
            reportType === 'all' && styles.radioSelected,
          ]}
          onPress={() => handleReportTypeChange('all')}>
          <View style={styles.radioCircle}>
            {reportType === 'all' && <View style={styles.radioFill} />}
          </View>
          <Text style={styles.radioLabel}>All</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.radioButton,
            reportType === 'itemwise' && styles.radioSelected,
          ]}
          onPress={() => handleReportTypeChange('itemwise')}>
          <View style={styles.radioCircle}>
            {reportType === 'itemwise' && <View style={styles.radioFill} />}
          </View>
          <Text style={styles.radioLabel}>Item-wise</Text>
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
        <ScrollView style={styles.scrollContainer}>
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
                    value={tempFromDate}
                    mode="date"
                    display="spinner"
                    onChange={onFromDateChange}
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
              is24Hour={true}
              display="default"
              onChange={onToDateChange}
              minimumDate={tempFromDate}
              maximumDate={new Date()}
            />
          )}
        </>
      )}
    </View>
  );
};

// Styles with additions for active filters
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
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
    padding: 16,
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
    color: '#0b8043', // Green
  },
  negative: {
    color: '#d23f31', // Red
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
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  radioButton: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioSelected: {
    backgroundColor: '#F48221',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  radioFill: {
    backgroundColor: 'white',
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  radioLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderBottomWidth: 2,
    borderBottomColor: '#ddd',
    marginBottom: 8,
    backgroundColor: '#f2f2f2',
    borderRadius: 4,
    alignItems: 'center',
    minHeight: 44,
    width: '100%',
  },
  headerCell: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
    paddingHorizontal: 2,
    flex: 1,
  },
  itemDetailsHeader: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#555',
    textAlign: 'left',
    paddingHorizontal: 5,
    flex: 2.5,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
    minHeight: 64,
  },
  itemNameColumn: {
    paddingRight: 5,
    flex: 2.5,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    textAlign: 'left',
  },
  itemCategory: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    textAlign: 'left',
  },
  dataCell: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 2,
    flex: 1,
  },
  itemId: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    textAlign: 'left',
  },
  tableNote: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ReportSummaryScreen;
