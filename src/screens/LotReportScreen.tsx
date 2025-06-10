import React, {useState, useEffect, useRef} from 'react';
import {
 StyleSheet,
 Text,
 TouchableOpacity,
 View,
 ActivityIndicator,
 ScrollView,
 TextInput,
 Platform,
 Alert,
 KeyboardAvoidingView,
 Modal,
 Keyboard,
} from 'react-native';
import {useRoute, RouteProp, useNavigation} from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {API_ENDPOINTS} from '../config/api.config';
import apiClient from '../utils/apiClient';
import {RootStackParamList} from '../type/type';
import {LayoutWrapper} from '../components/AppLayout';

// Updated API response type definitions
interface LotDetails {
 LOT_NO: number;
 UNIT_NAME: string;
 DESCRIPTION: string;
 ITEM_MARKS: string;
 VAKAL_NO: string;
 AVAILABLE_QTY: number;
 BALANCE_QTY: number;
 CATEGORY_NAME?: string;
 ITEM_CATEG_NAME?: string;
 SUB_CATEGORY_NAME?: string;
 BATCH_NO?: string;
 EXPIRY_DATE?: string;
 REMARKS?: string;
 STATUS?: string;
 ITEM_NAME?: string;
}

interface InwardTransaction {
 GRN_NO: string;
 GRN_DATE: string;
 QUANTITY: number;
 ITEM_MARKS: string;
 VAKAL_NO: string;
 ITEM_NAME: string;
 UNIT_NAME: string;
 REMARKS: string;
 CUSTOMER_NAME: string;
 CUSTOMER_ID?: string | number;
 VEHICLE_NO?: string;
 ITEM_CATEG_NAME?: string;
 SUB_CATEGORY_NAME?: string;
}

interface OutwardTransaction {
 OUTWARD_NO: string;
 DELIVERY_CHALLAN_NO: string;
 OUTWARD_DATE: string;
 DC_QTY: number;
 ITEM_MARKS: string;
 VAKAL_NO: string;
 ITEM_NAME: string;
 UNIT_NAME: string;
 REMARK: string;
 CUSTOMER_NAME: string;
 CUSTOMER_ID?: string | number;
 DELIVERED_TO?: string;
 VEHICLE_NO?: string;
 ITEM_CATEG_NAME?: string;
 SUB_CATEGORY_NAME?: string;
 ORDER_QUANTITY?: number;
}

interface Summary {
 inwardCount: number;
 inwardTotalQuantity: number;
 outwardCount: number;
 outwardTotalQuantity: number;
 netBalance: number;
}

interface LotReportResponse {
 success: boolean;
 lotDetails: LotDetails;
 summary: Summary;
 inward: {
 count: number;
 totalQuantity: number;
 data: InwardTransaction[];
 };
 outward: {
 count: number;
 totalQuantity: number;
 data: OutwardTransaction[];
 };
}

const LotReportScreen = () => {
 const route = useRoute<RouteProp<RootStackParamList, 'LotReportScreen'>>();
 const navigation = useNavigation<any>();
 const {lotNo: initialLotNo, customerID: routeCustomerId} = route.params || {};
 const [showNumberPad, setShowNumberPad] = useState(false);
 const [selectedTab, setSelectedTab] = useState<'Inwards' | 'Outwards'>(
 'Inwards',
 );
 // Add this ref for the horizontal ScrollView
 const horizontalScrollRef = useRef(null);
 const [lotDetails, setLotDetails] = useState<LotDetails | null>(null);
 const [inwardTransactions, setInwardTransactions] = useState<
 InwardTransaction[]
 >([]);
 const [outwardTransactions, setOutwardTransactions] = useState<
 OutwardTransaction[]
 >([]);
 const [summary, setSummary] = useState<Summary | null>(null);
 const [loading, setLoading] = useState<boolean>(false);
 const [error, setError] = useState<string | null>(null);
 const [searchLotNo, setSearchLotNo] = useState<string>(
 initialLotNo?.toString() || '',
 );
 const [summaryModalVisible, setSummaryModalVisible] =
 useState<boolean>(false);

 // Load the report data when the screen is first mounted with a lotNo from navigation
 useEffect(() => {
 if (initialLotNo && routeCustomerId) {
 fetchLotReport(initialLotNo.toString());
 }
 }, [initialLotNo, routeCustomerId]);

 const fetchLotReport = async (lotNo: string) => {
 if (!lotNo || lotNo.trim() === '') {
 Alert.alert('Error', 'Please enter a Lot Number');
 return;
 }

 try {
 setLoading(true);
 setError(null);
 // Use the customerId from route params if available, otherwise use a default
 const customerId = routeCustomerId || '1279';

 const response = await apiClient.get<LotReportResponse>(
 `${API_ENDPOINTS.GET_LOT_REPORT}/${lotNo}?customerId=${customerId}`,
 );

 if (response && response.success) {
 setLotDetails(response.lotDetails);
 setInwardTransactions(response.inward.data);
 setOutwardTransactions(response.outward.data);
 setSummary(response.summary);

 // Log to check if CUSTOMER_ID is present in the response
 if (response.inward.data && response.inward.data.length > 0) {
 console.log('Sample inward transaction:', response.inward.data[0]);
 console.log(
 'Has CUSTOMER_ID?',
 'CUSTOMER_ID' in response.inward.data[0],
 );
 }

 if (response.outward.data && response.outward.data.length > 0) {
 console.log('Sample outward transaction:', response.outward.data[0]);
 console.log(
 'Has CUSTOMER_ID?',
 'CUSTOMER_ID' in response.outward.data[0],
 );
 }
 } else {
 setError('Failed to load lot details');
 Alert.alert('Error', 'Failed to load lot details');
 }
 } catch (err) {
 console.error('Error fetching lot report:', err);
 setError('An error occurred while fetching data');
 Alert.alert('Error', 'An error occurred while fetching data');
 } finally {
 setLoading(false);
 }
 };

 // Get current transactions based on selected tab
 const currentTransactions =
 selectedTab === 'Inwards' ? inwardTransactions : outwardTransactions;

 // Get theme color based on selected tab
 const getThemeColor = () =>
 selectedTab === 'Inwards' ? '#F28C28' : '#4682B4';

 const handleSearch = () => {
 Keyboard.dismiss();
 fetchLotReport(searchLotNo);
 };

 const handleTabChange = tab => {
 setSelectedTab(tab);
 // Reset horizontal scroll position to start
 if (horizontalScrollRef.current) {
 horizontalScrollRef.current.scrollTo({x: 0, animated: true});
 }
 };

 const handleRefresh = () => {
 if (searchLotNo && searchLotNo.trim() !== '') {
 fetchLotReport(searchLotNo);
 } else {
 Alert.alert('Error', 'Please enter a Lot Number to refresh');
 }
 };

 const toggleSummaryModal = () => {
 setSummaryModalVisible(!summaryModalVisible);
 };

 const handleDocumentNumberPress = (
 item: InwardTransaction | OutwardTransaction,
 ) => {
 if ('GRN_NO' in item) {
 // For inward items, navigate to GrnDetailsScreen with the GRN_NO
 console.log('Navigating to GrnDetailsScreen with GRN_NO:', item.GRN_NO);

 // Ensure GRN_NO is a string
 const grnNo = String(item.GRN_NO);

 // Use item.CUSTOMER_ID if available, otherwise fall back to routeCustomerId
 const customerId = (item as any).CUSTOMER_ID || routeCustomerId;
 console.log('Using customerId:', customerId);

 try {
 navigation.navigate('GrnDetailsScreen', {
 grnNo: grnNo,
 customerId: customerId,
 item: item,
 });
 } catch (error) {
 console.error('Navigation error:', error);
 Alert.alert(
 'Navigation Error',
 `Error navigating to GRN Details: ${(error as Error).message}`,
 [{text: 'OK'}],
 );
 }
 } else if ('OUTWARD_NO' in item) {
 // For outward items
 console.log('Clicked on outward with OUTWARD_NO:', item.OUTWARD_NO);

 // Ensure OUTWARD_NO is a string
 const outwardNo = String(item.OUTWARD_NO);

 // Use item.CUSTOMER_ID if available, otherwise fall back to routeCustomerId
 const customerId = (item as any).CUSTOMER_ID || routeCustomerId;
 console.log('Using customerId:', customerId);

 // Check if OutwardDetailsScreen exists in the navigation stack
 try {
 navigation.navigate('OutwardDetailsScreen', {
 outwardNo: outwardNo,
 customerId: customerId,
 item: item,
 });
 } catch (error) {
 // If navigation fails, show an alert that the screen is under development
 Alert.alert(
 'Feature Coming Soon',
 'Outward Details screen is under development.',
 [{text: 'OK'}],
 );
 }
 }
 };

 const renderSummaryModal = () => {
 return (
 <Modal
 animationType="slide"
 transparent={true}
 visible={summaryModalVisible}
 onRequestClose={toggleSummaryModal}>
 <View style={styles.modalOverlay}>
 <View style={styles.modalContent}>
 <View style={styles.modalHeader}>
 <Text style={styles.modalTitle}>Lot Summary</Text>
 <TouchableOpacity onPress={toggleSummaryModal}>
 <MaterialIcons name="close" size={24} color="#333" />
 </TouchableOpacity>
 </View>

 {summary ? (
 <View style={styles.summaryContainer}>
 {/* Inward Count */}
 <View style={styles.summaryRow}>
 <Text style={styles.summaryLabel}>Inward Count:</Text>
 <Text style={[styles.summaryValue, {color: '#F28C28'}]}>
 {summary.inwardCount}
 </Text>
 </View>

 {/* Inward Quantity */}
 <View style={styles.summaryRow}>
 <Text style={styles.summaryLabel}>Total Inward Qty:</Text>
 <Text style={[styles.summaryValue, {color: '#F28C28'}]}>
 {summary.inwardTotalQuantity}
 </Text>
 </View>

 {/* Outward Count */}
 <View style={styles.summaryRow}>
 <Text style={styles.summaryLabel}>Outward Count:</Text>
 <Text style={[styles.summaryValue, {color: '#007bff'}]}>
 {summary.outwardCount}
 </Text>
 </View>

 {/* Outward Quantity */}
 <View style={styles.summaryRow}>
 <Text style={styles.summaryLabel}>Total Outward Qty:</Text>
 <Text style={[styles.summaryValue, {color: '#007bff'}]}>
 {summary.outwardTotalQuantity}
 </Text>
 </View>

 {/* Divider */}
 <View style={styles.divider} />

 {/* Net Balance */}
 <View style={styles.balanceRow}>
 <Text style={styles.balanceLabel}>Net Balance:</Text>
 <Text style={[styles.balanceValue, {color: '#888'}]}>
 {summary.netBalance}
 </Text>
 </View>
 </View>
 ) : (
 <Text style={styles.noSummaryText}>
 No summary data available
 </Text>
 )}
 </View>
 </View>
 </Modal>
 );
 };

 // Render the transactions table rows
 const renderTransactionRows = () => {
 if (currentTransactions.length === 0) {
 return (
 <View style={styles.emptyContainer}>
 <Text style={styles.emptyText}>
 No {selectedTab} transactions found
 </Text>
 </View>
 );
 }

 return currentTransactions.map((item, index) => {
 if (selectedTab === 'Inwards') {
 const inwardItem = item as InwardTransaction;
 return (
 <View
 key={`inward-${index}`}
 style={[
 styles.tableRow,
 index % 2 === 0 ? styles.evenRow : styles.oddRow,
 ]}>
 <Text style={styles.tableCell}>{inwardItem.UNIT_NAME || '-'}</Text>
 <Text style={styles.tableCell}>
 {new Date(inwardItem.GRN_DATE).toLocaleDateString() || '-'}
 </Text>
 <TouchableOpacity
 style={styles.tableCellContainer}
 onPress={() => handleDocumentNumberPress(inwardItem)}
 disabled={!inwardItem.GRN_NO}>
 <Text
 style={[
 styles.tableCell,
 styles.clickableCell,
 {
 color: inwardItem.GRN_NO ? getThemeColor() : '#334155',
 },
 ]}>
 {inwardItem.GRN_NO || '-'}
 </Text>
 </TouchableOpacity>
 <Text style={styles.tableCell}>{inwardItem.VAKAL_NO || '-'}</Text>
 <Text style={styles.tableCell}>{inwardItem.ITEM_MARKS || '-'}</Text>
 <Text style={styles.tableCell}>{inwardItem.QUANTITY || '-'}</Text>
 <Text style={styles.tableCell}>{inwardItem.REMARKS || '-'}</Text>
 <Text style={styles.tableCell}>{inwardItem.VEHICLE_NO || '-'}</Text>
 </View>
 );
 } else {
 const outwardItem = item as OutwardTransaction;
 return (
 <View
 key={`outward-${index}`}
 style={[
 styles.tableRow,
 index % 2 === 0 ? styles.evenRow : styles.oddRow,
 ]}>
 <Text style={styles.tableCell}>{outwardItem.UNIT_NAME || '-'}</Text>
 <Text style={styles.tableCell}>
 {new Date(outwardItem.OUTWARD_DATE).toLocaleDateString() || '-'}
 </Text>
 <TouchableOpacity
 style={[styles.tableCellContainer, {width: 110}]}
 onPress={() => handleDocumentNumberPress(outwardItem)}
 disabled={!outwardItem.OUTWARD_NO}>
 <Text
 style={[
 styles.tableCell,
 styles.clickableCell,
 {
 color: outwardItem.OUTWARD_NO ? getThemeColor() : '#334155',
 width: '100%',
 },
 ]}>
 {outwardItem.OUTWARD_NO || '-'}
 </Text>
 </TouchableOpacity>
 <Text style={styles.tableCell}>{outwardItem.VAKAL_NO || '-'}</Text>
 <Text style={styles.tableCell}>
 {outwardItem.ITEM_MARKS || '-'}
 </Text>
 <Text style={styles.tableCell}>{outwardItem.DC_QTY || '-'}</Text>
 <Text style={styles.tableCell}>{outwardItem.REMARK || '-'}</Text>
 <Text style={styles.tableCell}>
 {outwardItem.VEHICLE_NO || '-'}
 </Text>
 <Text style={styles.tableCell}>
 {outwardItem.DELIVERED_TO || '-'}
 </Text>
 </View>
 );
 }
 });
 };

 return (
 <LayoutWrapper showHeader={true} showTabBar={false} route={route}>
 <View style={styles.container}>
 {/* Title */}
 <View style={styles.titleContainer}>
 <Text style={styles.titleText}>Lot Report</Text>
 </View>

 {/* Fixed Search Container at the top */}
 <View style={styles.searchContainer}>
 <View style={styles.searchInputContainer}>
 <MaterialIcons
 name="search"
 size={24}
 color="#777"
 style={styles.searchIcon}
 />
 <TextInput
 style={styles.searchInput}
 placeholder="Enter Lot No."
 placeholderTextColor="#777"
 value={searchLotNo}
 onChangeText={text => {
 // Allow only numbers by removing non-numeric characters
 const cleanedText = text.replace(/[^0-9]/g, '');
 setSearchLotNo(cleanedText);
 }}
 keyboardType="number-pad"
 onSubmitEditing={handleSearch}
 />
 </View>
 <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
 <Text style={styles.searchButtonText}>Search</Text>
 </TouchableOpacity>
 <TouchableOpacity
 style={styles.refreshButton}
 onPress={handleRefresh}>
 <MaterialIcons name="refresh" size={24} color="#fff" />
 </TouchableOpacity>
 </View>

 {/* Content with Keyboard Handling */}
 <KeyboardAvoidingView
 style={{flex: 1}}
 behavior={Platform.OS === 'ios' ? 'padding' : undefined}
 keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
 {loading ? (
 <View style={styles.loadingContainer}>
 <ActivityIndicator size="large" color="#007bff" />
 <Text style={styles.loadingText}>Loading lot details...</Text>
 </View>
 ) : error ? (
 <View style={styles.errorContainer}>
 <Text style={styles.errorText}>{error}</Text>
 </View>
 ) : lotDetails ? (
 <ScrollView
 style={styles.mainScrollView}
 contentContainerStyle={styles.scrollViewContent}
 showsVerticalScrollIndicator={false}>
 <View style={styles.detailsContainer}>
 <View style={styles.lotHeader}>
 <Text style={styles.lotNo}>
 Lot No:{' '}
 <Text style={styles.lotNoHighlight}>
 {lotDetails?.LOT_NO}
 </Text>
 </Text>
 <TouchableOpacity
 style={styles.summaryIconButton}
 onPress={toggleSummaryModal}>
 <MaterialIcons name="bar-chart" size={26} color="#F28C28" />
 </TouchableOpacity>
 </View>

 <Text style={styles.detailText}>
 Unit Name:{' '}
 <Text style={styles.detailBold}>{lotDetails?.UNIT_NAME}</Text>
 </Text>
 <Text style={styles.detailText}>
 Item Name:{' '}
 <Text style={styles.detailBold}>
 {lotDetails?.ITEM_NAME || lotDetails?.DESCRIPTION}
 </Text>
 </Text>
 <Text style={styles.detailText}>
 Category:{' '}
 <Text style={styles.detailBold}>
 {lotDetails?.ITEM_CATEG_NAME}
 </Text>
 </Text>
 <Text style={styles.detailText}>
 Sub Category:{' '}
 <Text style={styles.detailBold}>
 {lotDetails?.SUB_CATEGORY_NAME}
 </Text>
 </Text>
 <Text style={styles.detailText}>
 Item Mark:{' '}
 <Text style={styles.detailBold}>
 {lotDetails?.ITEM_MARKS}
 </Text>
 </Text>
 <Text style={styles.detailText}>
 Vakkal:{' '}
 <Text style={styles.detailBold}>{lotDetails?.VAKAL_NO}</Text>
 </Text>
 {lotDetails?.BATCH_NO && (
 <Text style={styles.detailText}>
 Batch No:{' '}
 <Text style={styles.detailBold}>{lotDetails.BATCH_NO}</Text>
 </Text>
 )}
 <Text style={styles.detailText}>
 Available Qty:{' '}
 <Text style={styles.detailBold}>
 {lotDetails?.AVAILABLE_QTY}
 </Text>
 </Text>
 {lotDetails?.EXPIRY_DATE && (
 <Text style={styles.detailText}>
 Expiry Date:{' '}
 <Text style={styles.detailBold}>
 {new Date(lotDetails.EXPIRY_DATE).toLocaleDateString()}
 </Text>
 </Text>
 )}
 {lotDetails?.REMARKS && (
 <Text style={styles.detailText}>
 Remarks:{' '}
 <Text style={styles.detailBold}>{lotDetails.REMARKS}</Text>
 </Text>
 )}
 </View>

 <View style={styles.tabContainer}>
 <TouchableOpacity
 style={[
 styles.inwardTabButton,
 selectedTab === 'Inwards' && styles.activeInwardTab,
 ]}
 onPress={() => handleTabChange('Inwards')}>
 <Text
 style={[
 styles.tabText,
 selectedTab === 'Inwards' && styles.activeTabText,
 ]}>
 Inwards ({summary?.inwardCount || 0})
 </Text>
 </TouchableOpacity>
 <TouchableOpacity
 style={[
 styles.outwardTabButton,
 selectedTab === 'Outwards' && styles.activeOutwardTab,
 ]}
 onPress={() => handleTabChange('Outwards')}>
 <Text
 style={[
 styles.tabText,
 selectedTab === 'Outwards' && styles.activeTabText,
 ]}>
 Outwards ({summary?.outwardCount || 0})
 </Text>
 </TouchableOpacity>
 </View>

 <View
 style={[
 styles.scrollHintContainer,
 {backgroundColor: '#f8f8f8'},
 ]}>
 <MaterialIcons name="swipe" size={16} color="#64748B" />
 <Text style={styles.scrollHintText}>
 Swipe horizontally to see all columns
 </Text>
 </View>

 <ScrollView
 ref={horizontalScrollRef}
 horizontal
 showsHorizontalScrollIndicator={true}>
 <View style={styles.tableContainer}>
 {selectedTab === 'Inwards' ? (
 <>
 <View style={styles.inwardTableHeader}>
 <Text style={styles.headerCell}>Unit Name</Text>
 <Text style={styles.headerCell}>GRN Date</Text>
 <Text style={styles.headerCell}>GRN No</Text>
 <Text style={styles.headerCell}>Vakal No</Text>
 <Text style={styles.headerCell}>Item Marks</Text>
 <Text style={styles.headerCell}>Quantity</Text>
 <Text style={styles.headerCell}>Remarks</Text>
 <Text style={styles.headerCell}>Vehicle No</Text>
 </View>
 </>
 ) : (
 <>
 <View style={styles.outwardTableHeader}>
 <Text style={styles.headerCell}>Unit Name</Text>
 <Text style={[styles.headerCell, {width: 110}]}>
 Delivery Challan Date
 </Text>
 <Text style={[styles.headerCell, {width: 110}]}>
 Delivery{'\n'}Challan No
 </Text>
 <Text style={styles.headerCell}>Vakal No</Text>
 <Text style={styles.headerCell}>Item Marks</Text>
 <Text style={styles.headerCell}>Quantity</Text>
 <Text style={styles.headerCell}>Remarks</Text>
 <Text style={styles.headerCell}>Vehicle No</Text>
 <Text style={styles.headerCell}>Delivered To</Text>
 </View>
 </>
 )}
 {renderTransactionRows()}
 </View>
 </ScrollView>
 </ScrollView>
 ) : (
 <View style={styles.initialStateContainer}>
 <MaterialIcons name="search" size={50} color="#CCCCCC" />
 <Text style={styles.initialStateText}>
 Enter a Lot Number and press Search
 </Text>
 </View>
 )}
 </KeyboardAvoidingView>
 {renderSummaryModal()}
 </View>
 </LayoutWrapper>
 );
};

const styles = StyleSheet.create({
 container: {
 flex: 1,
 padding: 10,
 backgroundColor: '#f5f5f5',
 },
 titleContainer: {
 alignItems: 'center',
 marginBottom: 5,
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
 color: '#F28C28',
 },
 mainScrollView: {
 flex: 1,
 },
 scrollViewContent: {
 flexGrow: 1,
 paddingBottom: 20,
 },
 searchContainer: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'center',
 paddingVertical: 10,
 marginBottom: 5,
 },
 searchInputContainer: {
 flex: 1,
 flexDirection: 'row',
 alignItems: 'center',
 backgroundColor: '#fff',
 borderRadius: 8,
 paddingHorizontal: 10,
 borderWidth: 1,
 borderColor: '#ddd',
 height: 46,
 marginRight: 10,
 },
 searchIcon: {
 marginRight: 10,
 },
 searchInput: {
 flex: 1,
 fontSize: 16,
 color: '#333',
 padding: 0,
 },
 searchButton: {
 paddingVertical: 10,
 paddingHorizontal: 15,
 backgroundColor: '#F28C28',
 borderRadius: 8,
 marginRight: 10,
 shadowColor: '#000',
 shadowOffset: {width: 0, height: 2},
 shadowOpacity: 0.1,
 shadowRadius: 2,
 elevation: 2,
 },
 searchButtonText: {
 color: '#fff',
 fontWeight: 'bold',
 fontSize: 14,
 },
 refreshButton: {
 padding: 8,
 backgroundColor: '#007bff',
 borderRadius: 24,
 alignItems: 'center',
 justifyContent: 'center',
 width: 40,
 height: 40,
 shadowColor: '#000',
 shadowOffset: {width: 0, height: 2},
 shadowOpacity: 0.1,
 shadowRadius: 2,
 elevation: 2,
 },
 loadingContainer: {
 flex: 1,
 justifyContent: 'center',
 alignItems: 'center',
 },
 loadingText: {
 marginTop: 10,
 fontSize: 16,
 color: '#333',
 },
 errorContainer: {
 flex: 1,
 justifyContent: 'center',
 alignItems: 'center',
 padding: 20,
 },
 errorText: {
 fontSize: 16,
 color: 'red',
 textAlign: 'center',
 },
 initialStateContainer: {
 flex: 1,
 justifyContent: 'center',
 alignItems: 'center',
 padding: 20,
 },
 initialStateText: {
 marginTop: 15,
 fontSize: 16,
 color: '#666',
 textAlign: 'center',
 },

 modalOverlay: {
 flex: 1,
 backgroundColor: 'rgba(0, 0, 0, 0.5)',
 justifyContent: 'center',
 alignItems: 'center',
 paddingHorizontal: 20,
 },
 modalContent: {
 backgroundColor: '#fff',
 borderRadius: 12,
 width: '100%',
 padding: 20,
 shadowColor: '#000',
 shadowOffset: {width: 0, height: 2},
 shadowOpacity: 0.25,
 shadowRadius: 5,
 elevation: 5,
 },
 modalHeader: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'center',
 marginBottom: 15,
 paddingBottom: 10,
 borderBottomWidth: 1,
 borderBottomColor: '#e0e0e0',
 },
 modalTitle: {
 fontSize: 20,
 fontWeight: 'bold',
 color: '#333',
 },
 summaryContainer: {
 marginBottom: 15,
 },
 summaryRow: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'center',
 paddingVertical: 6,
 },
 balanceRow: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'center',
 paddingVertical: 8,
 },
 summaryLabel: {
 fontSize: 15,
 color: '#555',
 fontWeight: '500',
 },
 summaryValue: {
 fontSize: 16,
 fontWeight: 'bold',
 },
 balanceLabel: {
 fontSize: 16,
 color: '#333',
 fontWeight: '600',
 },
 balanceValue: {
 fontSize: 18,
 fontWeight: 'bold',
 },
 divider: {
 height: 1,
 backgroundColor: '#E0E0E0',
 marginVertical: 10,
 },
 noSummaryText: {
 fontSize: 16,
 color: '#666',
 textAlign: 'center',
 marginVertical: 20,
 },
 detailsContainer: {
 padding: 15,
 borderRadius: 10,
 shadowColor: '#000',
 shadowOffset: {width: 0, height: 1},
 shadowOpacity: 0.2,
 shadowRadius: 3,
 elevation: 5,
 marginBottom: 20,
 backgroundColor: '#fff',
 },
 lotHeader: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'center',
 marginBottom: 8,
 },
 lotNo: {
 fontSize: 16,
 fontWeight: 'bold',
 },
 lotNoHighlight: {
 color: '#F28C28',
 },
 summaryIconButton: {
 padding: 2,
 },
 detailText: {
 fontSize: 15,
 marginVertical: 2,
 color: '#333',
 },
 detailBold: {
 fontWeight: '600',
 color: '#000',
 },
 tabContainer: {
 flexDirection: 'row',
 justifyContent: 'center',
 marginBottom: 12,
 paddingHorizontal: 10,
 },
 inwardTabButton: {
 flex: 1,
 padding: 10,
 backgroundColor: '#E0E0E0',
 alignItems: 'center',
 borderRadius: 8,
 marginHorizontal: 5,
 },
 outwardTabButton: {
 flex: 1,
 padding: 10,
 backgroundColor: '#E0E0E0',
 alignItems: 'center',
 borderRadius: 8,
 marginHorizontal: 5,
 },
 activeInwardTab: {
 backgroundColor: '#F28C28', // Orange for inward
 borderColor: '#e67e22',
 },
 activeOutwardTab: {
 backgroundColor: '#007bff', // Blue for outward
 borderColor: '#0069d9',
 },
 tabText: {
 fontSize: 14,
 color: '#333',
 fontWeight: 'bold',
 },
 activeTabText: {
 color: '#fff',
 },
 inwardTableHeader: {
 flexDirection: 'row',
 backgroundColor: '#F28C28', // Orange for inward
 padding: 12,
 },
 outwardTableHeader: {
 flexDirection: 'row',
 backgroundColor: '#007bff', // Blue for outward
 padding: 12,
 },
 headerCell: {
 color: '#fff',
 fontWeight: 'bold',
 fontSize: 13,
 width: 100,
 textAlign: 'center',
 paddingHorizontal: 5,
 height: 32,
 },
 tableRow: {
 flexDirection: 'row',
 padding: 11,
 borderBottomWidth: 1,
 borderBottomColor: '#e0e0e0',
 },
 tableCellContainer: {
 justifyContent: 'center',
 alignItems: 'center',
 },
 tableCell: {
 color: '#333',
 fontSize: 13,
 width: 100,
 textAlign: 'center',
 paddingHorizontal: 5,
 },
 evenRow: {
 backgroundColor: '#f5f9ff',
 },
 oddRow: {
 backgroundColor: '#ffffff',
 },
 emptyContainer: {
 padding: 20,
 alignItems: 'center',
 backgroundColor: '#fff',
 },
 emptyText: {
 color: '#666',
 fontStyle: 'italic',
 },
 tableContainer: {
 backgroundColor: '#fff',
 borderRadius: 8,
 borderWidth: 1,
 borderColor: '#e0e0e0',
 },
 scrollHintContainer: {
 flexDirection: 'row',
 alignItems: 'center',
 justifyContent: 'center',
 paddingVertical: 8,
 paddingHorizontal: 12,
 marginBottom: 12,
 borderRadius: 8,
 borderWidth: 1,
 borderColor: '#e0e0e0',
 },
 scrollHintText: {
 marginLeft: 8,
 fontSize: 14,
 color: '#64748B',
 },
 clickableCell: {
 textDecorationLine: 'underline',
 fontWeight: '500',
 },
});

export default LotReportScreen;