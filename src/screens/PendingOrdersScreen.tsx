import React, {useEffect, useState, useCallback} from 'react';
import {
 ActivityIndicator,
 FlatList,
 RefreshControl,
 StatusBar,
 StyleSheet,
 Text,
 TouchableOpacity,
 View,
 SafeAreaView,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import axios from 'axios';
import {API_ENDPOINTS} from '../config/api.config';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useCustomer} from '../contexts/DisplayNameContext'; // Import the customer context
import {MainStackParamList} from '../../src/type/type'; // Import the typed parameter list

interface PendingOrder {
 orderId: number;
 orderNo: string;
 orderDate: string;
 deliveryDate: string;
 status: string;
 transporterName: string;
 remarks: string;
 deliveryAddress: string;
 customerName: string;
 totalItems: number;
 totalQuantity: number;
 items: Array<{
 detailId: number;
 itemId: number;
 itemName: string;
 lotNo: string | number;
 itemMarks: string;
 vakalNo: string;
 requestedQty: number;
 availableQty: number;
 status: string;
 }>;
}

interface PendingOrderResponse {
 success: boolean;
 message: string;
 data: {
 orders: PendingOrder[];
 pagination: {
 page: number;
 limit: number;
 totalItems: number;
 totalPages: number;
 };
 };
}

const PendingOrdersScreen = () => {
 const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
 const [orders, setOrders] = useState<PendingOrder[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [refreshing, setRefreshing] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [page, setPage] = useState(1);
 const [totalPages, setTotalPages] = useState(1);
 const [isLoadingMore, setIsLoadingMore] = useState(false);

 // Get customerID from context instead of hardcoding
 const {customerID} = useCustomer();

 const fetchPendingOrder = useCallback(
 async (pageNum = 1, refresh = false) => {
 try {
 if (!customerID) {
 setError('Customer ID not found. Please login again.');
 setIsLoading(false);
 return;
 }

 if (refresh) {
 setIsLoading(true);
 setPage(1);
 } else if (pageNum > 1) {
 setIsLoadingMore(true);
 }

 setError(null);

 const response = await axios.get(
 `${API_ENDPOINTS.GET_PENDING_ORDERS}`,
 {
 params: {
 customerId: customerID, // Use the customerID from context
 page: pageNum,
 limit: 10,
 },
 },
 );

 const result: PendingOrderResponse = response.data;
 console.log('API Response:', JSON.stringify(result, null, 2));
 console.log('Orders Count:', result.data?.orders?.length || 0);
 console.log('Pagination Info:', result.data?.pagination);

 if (result.success) {
 // Process orders to normalize date format
 const normalizedOrders = result.data.orders.map(order => {
 // Ensure dates are in YYYY-MM-DD format without time component
 const normalizeDate = (dateString: string) => {
 if (!dateString) return dateString;
 // Extract just the date part if it's an ISO string
 return dateString.split('T')[0];
 };

 return {
 ...order,
 orderDate: normalizeDate(order.orderDate),
 deliveryDate: normalizeDate(order.deliveryDate),
 };
 });

 if (refresh || pageNum === 1) {
 setOrders(normalizedOrders);
 } else {
 setOrders(prevOrders => [...prevOrders, ...normalizedOrders]);
 }

 setTotalPages(result.data.pagination.totalPages);
 setPage(result.data.pagination.page);
 } else {
 setError(result.message);
 }
 } catch (err: any) {
 console.error('Error fetching Pending Orders:', err);
 setError(err.message || 'Failed to load pending orders ');

 // Using mock data for demonstration if the API fails
 if (pageNum === 1) {
 const mockOrders = generateMockData();
 setOrders(mockOrders);
 setTotalPages(3);
 }
 } finally {
 setIsLoading(false);
 setRefreshing(false);
 setIsLoadingMore(false);
 }
 },
 [customerID],
 );

 useEffect(() => {
 fetchPendingOrder();
 }, [fetchPendingOrder]);

 const onRefresh = () => {
 setRefreshing(true);
 fetchPendingOrder(1, true);
 };

 // Add useFocusEffect to refresh data when screen is focused
 useFocusEffect(
  useCallback(() => {
    console.log("PendingOrdersScreen focused");
    // Fetch data immediately every time the screen is focused
    fetchPendingOrder(1, true);
    
    // No need for the additional navigation listener since we're refreshing immediately
    return () => {
      // Cleanup if needed
    };
  }, [fetchPendingOrder])
 );

 const loadMoreOrders = () => {
 if (!isLoadingMore && page < totalPages) {
 fetchPendingOrder(page + 1);
 }
 };

 const handleOrderPress = (order: PendingOrder) => {
 // Use "as any" to bypass the type checking since the component
 // expects a different structure than the type definition
 navigation.navigate('OrderDetailsScreen' as any, {order});
 };

 const formatDate = (dateString: string) => {
 try {
 if (!dateString) return '';

 // Extract date parts from string
 let year, month, day;

 // For YYYY-MM-DD format
 if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
 [year, month, day] = dateString.split('-');

 // Create date parts directly without timezone issues
 const monthIndex = parseInt(month, 10) - 1;
 let dayNum = parseInt(day, 10) + 1; // Add one day
 let yearNum = parseInt(year, 10);

 // Handle month/year rollover if day exceeds month length
 let monthNum = parseInt(month, 10);
 const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

 if (dayNum > daysInMonth) {
 dayNum = 1;
 monthNum += 1;

 if (monthNum > 12) {
 monthNum = 1;
 yearNum += 1;
 }
 }

 // Convert month number to month name
 const monthNames = [
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
 ];

 // Format the date manually without creating a Date object
 return `${monthNames[monthNum - 1]} ${dayNum}, ${yearNum}`;
 }
 // For ISO format with time component
 else if (dateString.includes('T')) {
 const [datePart] = dateString.split('T');
 [year, month, day] = datePart.split('-');

 // Create date parts directly without timezone issues
 const monthIndex = parseInt(month, 10) - 1;
 let dayNum = parseInt(day, 10) + 1; // Add one day
 let yearNum = parseInt(year, 10);

 // Handle month/year rollover if day exceeds month length
 let monthNum = parseInt(month, 10);
 const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

 if (dayNum > daysInMonth) {
 dayNum = 1;
 monthNum += 1;

 if (monthNum > 12) {
 monthNum = 1;
 yearNum += 1;
 }
 }

 // Convert month number to month name
 const monthNames = [
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
 ];

 // Format the date manually without creating a Date object
 return `${monthNames[monthNum - 1]} ${dayNum}, ${yearNum}`;
 }
 // Invalid format
 else {
 return dateString;
 }
 } catch (error) {
 console.log('Error formatting date:', error, dateString);
 return dateString;
 }
 };

 const handleViewDetails = (order: PendingOrder) => {
 // Use "as any" to bypass the type checking since the component
 // expects a different structure than the type definition
 navigation.navigate('OrderDetailsScreen' as any, {order});
 };

 const renderOrderCard = ({item}: {item: PendingOrder}) => (
 <TouchableOpacity
 style={styles.card}
 onPress={() => handleOrderPress(item)}
 activeOpacity={0.7}>
 <View style={styles.cardHeader}>
 <View>
 <Text style={styles.orderNo}>Order No : {item.orderNo}</Text>
 <Text style={styles.totalItems}>Items: {item.totalItems}</Text>
 </View>
 <View style={styles.statusContainer}>
 <View
 style={[
 styles.statusBadge,
 {
 backgroundColor: item.status === 'NEW' ? '#e0f2fe' : '#f3f4f6',
 },
 ]}>
 <Text
 style={[
 styles.statusText,
 {color: item.status === 'NEW' ? '#0284c7' : '#6B7280'},
 ]}>
 {item.status}
 </Text>
 </View>
 </View>
 </View>

 <View style={styles.dateContainer}>
 <View style={styles.dateBox}>
 <Text style={styles.dateLabel}>Order Date</Text>
 <Text style={styles.dateValue}>{formatDate(item.orderDate)}</Text>
 </View>
 <View style={styles.dateDivider} />
 <View style={styles.dateBox}>
 <Text style={styles.dateLabel}>Delivery Date</Text>
 <Text style={styles.dateValue}>{formatDate(item.deliveryDate)}</Text>
 </View>
 </View>

 <View style={styles.bottomRow}>
 <Text style={styles.transporterValue} numberOfLines={1}>
 {item.transporterName || 'No transporter'}
 </Text>
 <TouchableOpacity
 style={styles.viewDetails}
 onPress={() => handleViewDetails(item)}>
 <Text style={styles.viewDetailsText}>View Details</Text>
 <MaterialIcons name="chevron-right" size={16} color="#0284c7" />
 </TouchableOpacity>
 </View>
 </TouchableOpacity>
 );

 const renderFooter = () => {
 if (!isLoadingMore) return null;

 return (
 <View style={styles.footerLoader}>
 <ActivityIndicator size="small" color="#0284C7" />
 <Text style={styles.loadingMoreText}>Loading more orders...</Text>
 </View>
 );
 };

 if (isLoading) {
 return (
 <View style={styles.centered}>
 <ActivityIndicator size="large" color="#0284C7" />
 </View>
 );
 }

 if (error && orders.length === 0) {
 return (
 <View style={styles.centered}>
 <Text style={styles.errorText}>{error}</Text>
 <TouchableOpacity
 style={styles.retryButton}
 onPress={() => fetchPendingOrder(1, true)}>
 <Text style={styles.retryButtonText}>Retry</Text>
 </TouchableOpacity>
 </View>
 );
 }

 return (
 <SafeAreaView style={styles.container}>
 <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />
 {/* 
 <View style={styles.titleContainer}>
 <Text style={styles.screenTitle}>Order Status</Text>
 </View> */}

 <FlatList
 data={orders}
 keyExtractor={item => `order-${item.orderId}`}
 renderItem={renderOrderCard}
 contentContainerStyle={styles.list}
 refreshControl={
 <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
 }
 onEndReached={loadMoreOrders}
 onEndReachedThreshold={0.3}
 ListFooterComponent={renderFooter}
 showsVerticalScrollIndicator={false}
 ListEmptyComponent={
 <View style={styles.emptyContainer}>
 <MaterialIcons name="history" size={64} color="#d1d5db" />
 <Text style={styles.emptyText}>No order history found</Text>
 {customerID ? (
 <Text style={styles.customerIdText}>
 Customer ID: {customerID}
 </Text>
 ) : (
 <Text style={styles.errorText}>Customer ID not found</Text>
 )}
 </View>
 }
 />
 </SafeAreaView>
 );
};

// Mock data generation function for demonstration
const generateMockData = (): PendingOrder[] => {
 const mockOrders: PendingOrder[] = [];
 for (let i = 1; i <= 5; i++) {
 // Create dates without time component to avoid timezone issues
 const orderDate = new Date();
 orderDate.setDate(orderDate.getDate() - i * 3);

 const deliveryDate = new Date(orderDate);
 deliveryDate.setDate(deliveryDate.getDate() + 2);

 // Format dates as YYYY-MM-DD to avoid timezone issues
 const formatDateToString = (date: Date) => {
 const year = date.getFullYear();
 const month = String(date.getMonth() + 1).padStart(2, '0');
 const day = String(date.getDate()).padStart(2, '0');
 return `${year}-${month}-${day}`;
 };

 const totalItems = Math.floor(Math.random() * 5) + 1;
 const items = [];

 for (let j = 1; j <= totalItems; j++) {
 items.push({
 detailId: j,
 itemId: j * 100,
 itemName: `Item ${j}`,
 lotNo: `LOT${j}${i}`,
 itemMarks: `MARK-${j}${i}`,
 vakalNo: `VAK-${j}${i}`,
 requestedQty: Math.floor(Math.random() * 50) + 10,
 availableQty: Math.floor(Math.random() * 100) + 20,
 status: 'NEW',
 });
 }

 mockOrders.push({
 orderId: i,
 orderNo: `ORD-${2025}${i.toString().padStart(4, '0')}`,
 orderDate: formatDateToString(orderDate),
 deliveryDate: formatDateToString(deliveryDate),
 status: 'NEW',
 transporterName: `Transporter ${i}`,
 remarks: `Remarks for order ${i}`,
 deliveryAddress: `123 Delivery St, Building ${i}, City`,
 customerName: 'John Doe',
 totalItems,
 totalQuantity: items.reduce((sum, item) => sum + item.requestedQty, 0),
 items,
 });
 }
 return mockOrders;
};

const styles = StyleSheet.create({
 container: {
 flex: 1,
 backgroundColor: '#f3f4f6',
 },
 centered: {
 flex: 1,
 justifyContent: 'center',
 alignItems: 'center',
 padding: 20,
 },
 titleContainer: {
 alignItems: 'center',
 paddingVertical: 16,
 backgroundColor: '#fff',
 borderBottomWidth: 1,
 borderBottomColor: '#e5e7eb',
 },
 screenTitle: {
 fontSize: 20,
 fontWeight: '600',
 color: '#7c3aed',
 },
 list: {
 padding: 16,
 paddingBottom: 50, // Increased padding at the bottom to avoid bottom bar overlap
 },
 card: {
 backgroundColor: '#ffffff',
 borderRadius: 16,
 marginBottom: 16,
 padding: 16,
 elevation: 2,
 shadowColor: '#000',
 shadowOffset: {width: 0, height: 1},
 shadowOpacity: 0.1,
 shadowRadius: 2,
 },
 cardHeader: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'flex-start',
 marginBottom: 12,
 },
 orderNo: {
 fontSize: 16,
 fontWeight: '600',
 color: '#0284c7',
 },
 totalItems: {
 fontSize: 14,
 color: '#6B7280',
 marginTop: 4,
 },
 statusContainer: {
 alignItems: 'flex-end',
 },
 statusBadge: {
 paddingHorizontal: 12,
 paddingVertical: 4,
 borderRadius: 12,
 },
 statusText: {
 fontSize: 13,
 fontWeight: '500',
 },
 dateContainer: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 marginBottom: 12,
 backgroundColor: '#f9fafb',
 padding: 12,
 borderRadius: 8,
 },
 dateBox: {
 flex: 1,
 },
 dateLabel: {
 fontSize: 13,
 color: '#6B7280',
 marginBottom: 2,
 },
 dateValue: {
 fontSize: 14,
 color: '#111827',
 fontWeight: '500',
 },
 dateDivider: {
 width: 1,
 backgroundColor: '#E5E7EB',
 marginHorizontal: 16,
 },
 bottomRow: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'center',
 marginTop: 4,
 },
 transporterValue: {
 fontSize: 14,
 color: '#4B5563',
 flex: 1,
 },
 viewDetails: {
 flexDirection: 'row',
 alignItems: 'center',
 },
 viewDetailsText: {
 fontSize: 14,
 color: '#0284c7',
 fontWeight: '500',
 marginRight: 4,
 },
 footerLoader: {
 flexDirection: 'row',
 justifyContent: 'center',
 alignItems: 'center',
 padding: 16,
 paddingBottom: 34, // Increased padding at the bottom
 marginBottom: 17, // Added margin to create more space
 },
 loadingMoreText: {
 marginLeft: 8,
 fontSize: 14,
 color: '#6B7280',
 },
 errorText: {
 fontSize: 16,
 color: '#EF4444',
 textAlign: 'center',
 padding: 16,
 },
 emptyContainer: {
 alignItems: 'center',
 justifyContent: 'center',
 padding: 32,
 },
 emptyText: {
 fontSize: 16,
 color: '#6B7280',
 marginTop: 16,
 textAlign: 'center',
 },
 customerIdText: {
 fontSize: 14,
 color: '#6B7280',
 marginTop: 8,
 },
 retryButton: {
 marginTop: 16,
 paddingHorizontal: 24,
 paddingVertical: 12,
 backgroundColor: '#0284C7',
 borderRadius: 8,
 },
 retryButtonText: {
 color: '#fff',
 fontWeight: '500',
 fontSize: 16,
 },
});

export default PendingOrdersScreen;