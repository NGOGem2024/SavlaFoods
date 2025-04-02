// // OrderHistoryScreen.tsx

// import React, {useEffect, useState} from 'react';
// import {
//   ActivityIndicator,
//   Alert,
//   FlatList,
//   RefreshControl,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
//   SafeAreaView,
//   Animated,
// } from 'react-native';
// import {RouteProp} from '@react-navigation/native';
// import {StackNavigationProp} from '@react-navigation/stack';
// import {MainStackParamList} from '../type/type';
// import axios from 'axios';
// import {API_ENDPOINTS} from '../config/api.config';

// interface OrderHeader {
//   ID: number;
//   FK_CUSTOMER_ID: number;
//   FK_USER_SUPERVISOR_ID: string;
//   STATUS: string;
//   CREATEDBY: string;
//   CREATEDON: string;
//   UPDATEDBY: string;
//   UPDATEDON: string;
//   ORDER_BY: string;
//   ORDER_NO: string;
//   ORDER_DATE: string;
//   DELIVERY_DATE: string;
//   TRANSPORTER_NAME: string;
//   deliveryAdress: string;
//   REMARK: string;
//   ORDER_MODE: string;
// }

// interface OrderDetail {
//   ORDERED_QUANTITY: number;
//   ITEM_NAME: string;
//   ID: number;
//   FK_ORDER_ID: number;
//   FK_ITEM_ID: number;
//   LOT_NO: number | string;
//   ITEM_MARKS: string;
//   VAKAL_NO: string;
//   REQUESTED_QTY: number;
//   AVAILABLE_QTY: number;
//   STATUS: string;
//   // MARK: string;
//   REMARK: string;
//   UNIT_NAME?: string;
//   NET_QUANTITY?: number;
// }

// interface OrderResponse {
//   success: boolean;
//   header: OrderHeader;
//   details: OrderDetail[];
// }

// type OrderHistoryScreenRouteProp = RouteProp<
//   MainStackParamList,
//   'OrderHistoryScreen'
// >;
// type OrderHistoryScreenNavigationProp = StackNavigationProp<
//   MainStackParamList,
//   'OrderHistoryScreen'
// >;

// interface OrderHistoryScreenProps {
//   route: OrderHistoryScreenRouteProp;
//   navigation: OrderHistoryScreenNavigationProp;
// }

// const DetailRow: React.FC<{label: string; value: string}> = ({
//   label,
//   value,
// }) => (
//   <View style={styles.detailRow}>
//     <Text style={styles.label}>{label}:</Text>
//     <Text style={styles.value}>{value || 'N/A'}</Text>
//   </View>
// );

// const OrderHistoryScreen: React.FC<OrderHistoryScreenProps> = ({
//   route,
//   navigation,
// }) => {
//   const {
//     orderId,
//     orderNo,
//     transporterName,
//     deliveryDate,
//     deliveryAddress,
//     orderDate,
//     items,
//   } = route.params;
//   const [orderData, setOrderData] = useState<OrderResponse | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [expandedId, setExpandedId] = useState<number | null>(null);
//   const [error, setError] = useState<string | null>(null);
//   const [rotationValues] = useState<{[key: number]: Animated.Value}>({});

//   const fetchOrderDetails = async () => {
//     try {
//       setIsLoading(true);
//       setError(null);

//       // Create fallback data using route params
//       const fallbackData: OrderResponse = {
//         success: true,
//         header: {
//           ID: orderId,
//           ORDER_NO: orderNo,
//           DELIVERY_DATE: deliveryDate,
//           ORDER_DATE: orderDate || new Date().toISOString(), // Add fallback value
//           TRANSPORTER_NAME: transporterName,
//           deliveryAdress: deliveryAddress,
//           STATUS: 'NEW',
//           FK_CUSTOMER_ID: 0,
//           FK_USER_SUPERVISOR_ID: '',
//           CREATEDBY: '',
//           CREATEDON: '',
//           UPDATEDBY: '',
//           UPDATEDON: '',
//           ORDER_BY: '',
//           ORDER_MODE: '',
//           REMARK: '',
//         },
//         details: items.map((item: any, index: number) => ({
//           ID: item.ID || `${orderId}-${index}`,
//           FK_ORDER_ID: orderId,
//           FK_ITEM_ID: item.ITEM_ID,
//           ITEM_NAME: item.ITEM_NAME,
//           LOT_NO: item.LOT_NO,
//           ITEM_MARKS: item.ITEM_MARKS,
//           VAKAL_NO: item.VAKAL_NO,
//           REQUESTED_QTY: item.ORDERED_QUANTITY,
//           AVAILABLE_QTY: item.AVAILABLE_QTY,
//           STATUS: 'NEW',
//           MARK: item.ITEM_MARKS,
//           REMARK: item.REMARK || '',
//           ORDERED_QUANTITY: item.ORDERED_QUANTITY,
//           UNIT_NAME: item.UNIT_NAME,
//           NET_QUANTITY: item.NET_QUANTITY,
//         })),
//       };

//       setOrderData(fallbackData);
//     } catch (error: any) {
//       console.error('Error handling order details:', error);
//       setError('Failed to load order details');
//     } finally {
//       setIsLoading(false);
//       setRefreshing(false);
//     }
//   };

//   useEffect(() => {
//     if (!orderId || !items) {
//       setError('Order details are missing');
//       return;
//     }
//     fetchOrderDetails();
//   }, [orderId, items]);

//   const formatDate = (dateString: string) => {
//     try {
//       const date = new Date(dateString);
//       return date.toLocaleDateString('en-US', {
//         year: 'numeric',
//         month: 'long',
//         day: 'numeric',
//       });
//     } catch {
//       return dateString;
//     }
//   };

//   const renderOrderDetail = ({item}: {item: OrderDetail}) => {
//     const isExpanded = expandedId === item.ID;

//     // Initialize rotation value for this item if it doesn't exist
//     if (!rotationValues[item.ID]) {
//       rotationValues[item.ID] = new Animated.Value(isExpanded ? 1 : 0);
//     }

//     const rotate = rotationValues[item.ID].interpolate({
//       inputRange: [0, 1],
//       outputRange: ['0deg', '180deg'],
//     });

//     return (
//       <TouchableOpacity
//         onPress={() => toggleExpand(item.ID)}
//         activeOpacity={0.9}>
//         <Animated.View style={[styles.card, isExpanded && styles.expandedCard]}>
//           <View style={styles.mainContent}>
//             <View style={styles.cardHeader}>
//               <View style={styles.nameContainer}>
//                 <Text style={styles.itemName}>{item.ITEM_NAME}</Text>
//                 <View style={styles.lotNoContainer}>
//                   <Text style={styles.lotNo}>Lot No: {item.LOT_NO}</Text>
//                 </View>
//               </View>
//               <View style={styles.statusContainer}>
//                 <View
//                   style={[
//                     styles.statusBadge,
//                     {
//                       backgroundColor:
//                         item.STATUS === 'NEW' ? '#e0f2fe' : '#f3f4f6',
//                     },
//                   ]}>
//                   <Text
//                     style={[
//                       styles.statusText,
//                       {color: item.STATUS === 'NEW' ? '#0284c7' : '#6B7280'},
//                     ]}>
//                     {item.STATUS}
//                   </Text>
//                 </View>
//                 <Animated.Text
//                   style={[styles.menuIcon, {transform: [{rotate}]}]}>
//                   ▼
//                 </Animated.Text>
//               </View>
//             </View>

//             {isExpanded && (
//               <View style={styles.expandedContent}>
//                 <View style={styles.divider} />
//                 <View style={styles.detailsGrid}>
//                   <DetailRow label="Item Marks" value={item.ITEM_MARKS} />
//                   <DetailRow label="Vakal No" value={item.VAKAL_NO} />
//                   <View style={styles.quantityContainer}>
//                     <View style={styles.quantityBox}>
//                       <Text style={styles.quantityLabel}>Ordered</Text>
//                       <Text style={styles.quantityValue}>
//                         {item.ORDERED_QUANTITY}
//                       </Text>
//                     </View>
//                     <View style={styles.quantityBox}>
//                       <Text style={styles.quantityLabel}>Available</Text>
//                       <Text style={styles.quantityValue}>
//                         {item.AVAILABLE_QTY}
//                       </Text>
//                     </View>
//                   </View>
//                   <DetailRow label="Unit Name" value={item.UNIT_NAME || ''} />
//                   <DetailRow
//                     label="Net Quantity"
//                     value={String(item.NET_QUANTITY || '')}
//                   />
//                   {/* <DetailRow label="Mark" value={item.MARK} />
//                   {item.REMARK && (
//                     <DetailRow label="Remark" value={item.REMARK} />
//                   )} */}
//                 </View>
//               </View>
//             )}
//           </View>
//         </Animated.View>
//       </TouchableOpacity>
//     );
//   };

//   const toggleExpand = (detailId: number) => {
//     // Initialize rotation value for this item if it doesn't exist
//     if (!rotationValues[detailId]) {
//       rotationValues[detailId] = new Animated.Value(0);
//     }

//     const isExpanding = expandedId !== detailId;

//     Animated.timing(rotationValues[detailId], {
//       toValue: isExpanding ? 1 : 0,
//       duration: 200,
//       useNativeDriver: true,
//     }).start();

//     setExpandedId(isExpanding ? detailId : null);
//   };

//   if (isLoading) {
//     return (
//       <View style={styles.centered}>
//         <ActivityIndicator size="large" color="#0284C7" />
//       </View>
//     );
//   }

//   if (error) {
//     return (
//       <View style={styles.centered}>
//         <Text style={styles.errorText}>{error}</Text>
//       </View>
//     );
//   }

//   if (!orderData) {
//     return (
//       <View style={styles.centered}>
//         <Text style={styles.errorText}>No order data found</Text>
//       </View>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />

//       <View style={styles.titleContainer}>
//         <Text style={styles.screenTitle}>Order History</Text>
//       </View>

//       <View style={styles.headerCard}>
//         <Text style={styles.orderNo}>
//           Order No : {orderData?.header.ORDER_NO}
//         </Text>
//         <View style={styles.dateContainer}>
//           <View style={styles.dateBox}>
//             <Text style={styles.dateLabel}>Order Date</Text>
//             <Text style={styles.dateValue}>
//               {formatDate(orderData?.header.ORDER_DATE || '')}
//             </Text>
//           </View>
//           <View style={styles.dateDivider} />
//           <View style={styles.dateBox}>
//             <Text style={styles.dateLabel}>Delivery Date</Text>
//             <Text style={styles.dateValue}>
//               {formatDate(orderData?.header.DELIVERY_DATE || '')}
//             </Text>
//           </View>
//         </View>
//         <View style={styles.transporterContainer}>
//           <Text style={styles.transporterLabel}>Transporter</Text>
//           <Text style={styles.transporterValue}>
//             {orderData?.header.TRANSPORTER_NAME}
//           </Text>
//         </View>
//         {/* New Delivery Address Section */}
//         <View style={styles.deliveryContainer}>
//           <Text style={styles.deliveryLabel}>Delivery Location</Text>
//           <Text style={styles.deliveryValue}>{deliveryAddress || 'N/A'}</Text>
//         </View>
//       </View>

//       <FlatList
//         data={orderData?.details}
//         keyExtractor={item => `detail-${item.FK_ORDER_ID}${item.ID}`}
//         renderItem={renderOrderDetail}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={() => {
//               setRefreshing(true);
//               fetchOrderDetails();
//             }}
//           />
//         }
//         contentContainerStyle={styles.list}
//       />
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f3f4f6',
//   },
//   deliveryContainer: {
//     marginTop: 8,
//     backgroundColor: '#F1F5F9',
//     padding: 12,
//     borderRadius: 8,
//   },
//   deliveryLabel: {
//     fontSize: 13,
//     color: '#6B7280',
//     marginBottom: 2,
//   },
//   deliveryValue: {
//     fontSize: 15,
//     color: '#111827',
//     fontWeight: '500',
//   },

//   titleContainer: {
//     alignItems: 'center',
//     paddingVertical: 16,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e5e7eb',
//   },
//   screenTitle: {
//     fontSize: 20,
//     fontWeight: '600',
//     color: '#7c3aed', // Purple color
//   },
//   headerCard: {
//     backgroundColor: '#ffffff',
//     padding: 16,
//     margin: 16,
//     borderRadius: 16,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 2},
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   centered: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   orderNo: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#111827',
//     marginBottom: 16,
//     textAlign: 'center',
//   },
//   dateContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 16,
//   },
//   dateBox: {
//     flex: 1,
//   },
//   dateLabel: {
//     fontSize: 13,
//     color: '#6B7280',
//     marginBottom: 2,
//   },
//   dateValue: {
//     fontSize: 15,
//     color: '#111827',
//     fontWeight: '500',
//   },
//   dateDivider: {
//     width: 1,
//     backgroundColor: '#E5E7EB',
//     marginHorizontal: 16,
//   },
//   transporterContainer: {
//     marginTop: 8,
//   },
//   transporterLabel: {
//     fontSize: 13,
//     color: '#6B7280',
//     marginBottom: 2,
//   },
//   transporterValue: {
//     fontSize: 15,
//     color: '#111827',
//     fontWeight: '500',
//   },
//   list: {
//     padding: 16,
//   },
//   card: {
//     backgroundColor: '#ffffff',
//     borderRadius: 16,
//     marginBottom: 8,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 1},
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//   },
//   expandedCard: {
//     borderColor: '#e0f2fe',
//     borderWidth: 1,
//   },
//   mainContent: {
//     padding: 12,
//   },
//   cardHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   nameContainer: {
//     flex: 1,
//     gap: 4,
//   },
//   itemName: {
//     fontSize: 15,
//     fontWeight: '600',
//     color: '#111827',
//   },
//   lotNoContainer: {
//     backgroundColor: '#fff7ed',
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     borderRadius: 4,
//     alignSelf: 'flex-start',
//   },
//   lotNo: {
//     fontSize: 13,
//     color: '#ea580c', // Orange color
//     fontWeight: '500',
//   },
//   statusContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   statusBadge: {
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     borderRadius: 12,
//   },
//   statusText: {
//     fontSize: 13,
//     fontWeight: '500',
//   },
//   menuIcon: {
//     fontSize: 12,
//     color: '#6B7280',
//   },
//   expandedContent: {
//     marginTop: 8,
//   },
//   divider: {
//     height: 1,
//     backgroundColor: '#E5E7EB',
//     marginVertical: 8,
//   },
//   detailsGrid: {
//     gap: 8,
//   },
//   detailRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   label: {
//     fontSize: 13,
//     color: '#6B7280',
//   },
//   value: {
//     fontSize: 13,
//     color: '#111827',
//     fontWeight: '500',
//   },
//   quantityContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     backgroundColor: '#f8fafc',
//     padding: 8,
//     borderRadius: 8,
//     marginVertical: 4,
//   },
//   quantityBox: {
//     alignItems: 'center',
//   },
//   quantityLabel: {
//     fontSize: 12,
//     color: '#6B7280',
//     marginBottom: 2,
//   },
//   quantityValue: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#0284c7',
//   },
//   errorText: {
//     fontSize: 16,
//     color: '#EF4444',
//     textAlign: 'center',
//   },
// });

// export default OrderHistoryScreen;

//Integrated History
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
  Platform,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import axios from 'axios';
import {API_ENDPOINTS} from '../config/api.config';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useCustomer} from '../contexts/DisplayNameContext';
import {MainStackParamList} from '../../src/type/type';

interface OrderHistory {
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
  createdon: string;
  closedon: string;
}

interface OrderHistoryResponse {
  success: boolean;
  message: string;
  data: {
    orders: any[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
    };
  };
}

const OrderHistoryScreen = () => {
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  const route = useRoute();
  const params = route.params as any;

  const [orders, setOrders] = useState<OrderHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // Get customerID from context or route params
  const {customerID: contextCustomerID} = useCustomer();
  const customerID = params?.customerID || contextCustomerID;

  // Check if we have a specific order passed through params
  const hasSpecificOrder = params?.orderId && params?.orderNo;

  const fetchOrderHistory = useCallback(
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

        // Configure API parameters
        const apiParams: any = {
          customerId: customerID,
          page: pageNum,
          limit: 10,
        };

        // Add status filter if selected
        if (selectedStatus) apiParams.status = selectedStatus;

        console.log('Fetching order history with params:', apiParams);

        const response = await axios.get(`${API_ENDPOINTS.GET_ORDER_HISTORY}`, {
          params: apiParams,
        });

        const result: OrderHistoryResponse = response.data;
        console.log('Order history response:', result);

        if (result.success) {
          // Process orders to normalize data
          const normalizedOrders = result.data.orders.map(order => {
            // Ensure dates are in YYYY-MM-DD format without time component
            const normalizeDate = (dateString: string) => {
              if (!dateString) return '';
              // Extract just the date part if it's an ISO string
              return dateString.split('T')[0];
            };

            // Map backend field names to frontend expected names
            return {
              orderId: order.ORDER_ID,
              orderNo: order.ORDER_NO,
              orderDate: normalizeDate(order.ORDER_DATE),
              deliveryDate: normalizeDate(order.DELIVERY_DATE),
              status: order.STATUS,
              transporterName: order.TRANSPORTER_NAME || '',
              remarks: order.REMARK || '',
              deliveryAddress: order.CUST_DELIVERY_ADD || '',
              customerName: order.CUSTOMER_NAME || '',
              totalItems: order.TOTAL_ITEMS || 0,
              totalQuantity: order.TOTAL_QUANTITY || 0,
              createdon: normalizeDate(order.CREATEDON),
              closedon: normalizeDate(order.CLOSEDON),
            };
          });

          console.log('Normalized orders:', normalizedOrders);

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
        console.error('Error fetching Order History:', err);
        setError(err.message || 'Failed to load order history');

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
    [customerID, selectedStatus],
  );

  useEffect(() => {
    // If we have a specific order from params, create a single order object
    if (hasSpecificOrder) {
      const paramOrder = {
        orderId: params.orderId,
        orderNo: params.orderNo,
        orderDate: params.orderDate || '',
        deliveryDate: params.deliveryDate || '',
        status: params.status || 'NEW',
        transporterName: params.transporterName || '',
        remarks: params.remarks || '',
        deliveryAddress: params.deliveryAddress || '',
        customerName: params.customerName || '',
        totalItems: params.items?.length || 0,
        totalQuantity:
          params.items?.reduce(
            (sum: any, item: {ORDERED_QUANTITY: any}) =>
              sum + (item.ORDERED_QUANTITY || 0),
            0,
          ) || 0,
        createdon: params.orderDate || '',
        closedon: params.closedon || '',
      };
      setOrders([paramOrder]);
      setIsLoading(false);
    } else {
      // Otherwise fetch order history as usual
      fetchOrderHistory();
    }
  }, [fetchOrderHistory, hasSpecificOrder, params]);

  const onRefresh = () => {
    // Don't refresh if we have a specific order from params
    if (hasSpecificOrder) return;

    setRefreshing(true);
    fetchOrderHistory(1, true);
  };

  const loadMoreOrders = () => {
    // Don't load more if we have a specific order from params
    if (hasSpecificOrder) return;

    if (!isLoadingMore && page < totalPages) {
      fetchOrderHistory(page + 1);
    }
  };

  const handleOrderPress = (order: OrderHistory) => {
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
        let dayNum = parseInt(day, 10);
        let yearNum = parseInt(year, 10);

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
        return `${monthNames[monthIndex]} ${dayNum}, ${yearNum}`;
      }
      // For ISO format with time component
      else if (dateString.includes('T')) {
        const [datePart] = dateString.split('T');
        [year, month, day] = datePart.split('-');

        // Create date parts directly without timezone issues
        const monthIndex = parseInt(month, 10) - 1;
        let dayNum = parseInt(day, 10);
        let yearNum = parseInt(year, 10);

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
        return `${monthNames[monthIndex]} ${dayNum}, ${yearNum}`;
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

  const handleViewDetails = (order: OrderHistory) => {
    navigation.navigate('OrderDetailsScreen' as any, {order});
  };

  const handleStatusFilter = (status: string | null) => {
    // Don't apply filters if we have a specific order from params
    if (hasSpecificOrder) return;

    setSelectedStatus(status);
    // Reset pagination when filter changes
    setPage(1);
    setIsLoading(true);
    // Fetch data with new filter on next render
    fetchOrderHistory(1, true);
  };

  const renderStatusFilter = () => {
    // Don't show filters if we have a specific order from params
    if (hasSpecificOrder) return null;

    return (
      <View style={styles.filterContainer}>
        <Text style={styles.filterTitle}>Filter by Status:</Text>
        <View style={styles.statusButtons}>
          <TouchableOpacity
            style={[
              styles.statusButton,
              selectedStatus === null && styles.statusButtonSelected,
            ]}
            onPress={() => handleStatusFilter(null)}>
            <Text
              style={[
                styles.statusButtonText,
                selectedStatus === null && styles.statusButtonTextSelected,
              ]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.statusButton,
              selectedStatus === 'CLOSED' && styles.statusButtonSelected,
            ]}
            onPress={() => handleStatusFilter('CLOSED')}>
            <Text
              style={[
                styles.statusButtonText,
                selectedStatus === 'CLOSED' && styles.statusButtonTextSelected,
              ]}>
              Closed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.statusButton,
              selectedStatus === 'CANCEL' && styles.statusButtonSelected,
            ]}
            onPress={() => handleStatusFilter('CANCEL')}>
            <Text
              style={[
                styles.statusButtonText,
                selectedStatus === 'CANCEL' && styles.statusButtonTextSelected,
              ]}>
              Cancelled
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.statusButton,
              selectedStatus === 'NEW' && styles.statusButtonSelected,
            ]}
            onPress={() => handleStatusFilter('NEW')}>
            <Text
              style={[
                styles.statusButtonText,
                selectedStatus === 'NEW' && styles.statusButtonTextSelected,
              ]}>
              New
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CLOSED':
        return {bg: '#dcfce7', text: '#16a34a'};
      case 'CANCEL':
        return {bg: '#fee2e2', text: '#ef4444'};
      case 'NEW':
        return {bg: '#e0f2fe', text: '#0284c7'};
      default:
        return {bg: '#f3f4f6', text: '#6B7280'};
    }
  };

  const renderOrderCard = ({item}: {item: OrderHistory}) => {
    const statusColors = getStatusColor(item.status);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => handleOrderPress(item)}
        activeOpacity={0.7}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderNo}>Order No: {item.orderNo}</Text>
            <Text style={styles.totalItems}>Items: {item.totalItems}</Text>
          </View>
          <View style={styles.statusContainer}>
            <View
              style={[styles.statusBadge, {backgroundColor: statusColors.bg}]}>
              <Text style={[styles.statusText, {color: statusColors.text}]}>
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
            <Text style={styles.dateValue}>
              {formatDate(item.deliveryDate)}
            </Text>
          </View>
        </View>

        {item.closedon && (
          <View style={styles.closedDateContainer}>
            <Text style={styles.closedDateLabel}>Closed on:</Text>
            <Text style={styles.closedDateValue}>
              {formatDate(item.closedon)}
            </Text>
          </View>
        )}

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
  };

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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />

      {renderStatusFilter()}

      {error && orders.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchOrderHistory(1, true)}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => `order-history-${item.orderId}`}
          renderItem={renderOrderCard}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              enabled={!hasSpecificOrder} // Disable pull-to-refresh for specific order
            />
          }
          onEndReached={loadMoreOrders}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="history" size={64} color="#d1d5db" />
              <Text style={styles.emptyText}>No order history found</Text>
              {selectedStatus && (
                <Text style={styles.filterInfoText}>
                  Filter: {selectedStatus}
                </Text>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

// Mock data generation function for demonstration
const generateMockData = (): OrderHistory[] => {
  const mockOrders: OrderHistory[] = [];
  const statuses = ['CLOSED', 'CANCEL', 'NEW'];

  for (let i = 1; i <= 5; i++) {
    // Create dates without time component to avoid timezone issues
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - i * 5);

    const deliveryDate = new Date(orderDate);
    deliveryDate.setDate(deliveryDate.getDate() + 3);

    const closedDate = new Date(deliveryDate);
    closedDate.setDate(closedDate.getDate() + 2);

    // Format dates as YYYY-MM-DD to avoid timezone issues
    const formatDateToString = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const status = statuses[Math.floor(Math.random() * statuses.length)];

    mockOrders.push({
      orderId: i + 100,
      orderNo: `HIST-${2024}${i.toString().padStart(4, '0')}`,
      orderDate: formatDateToString(orderDate),
      deliveryDate: formatDateToString(deliveryDate),
      status,
      transporterName: `Transporter ${i + 5}`,
      remarks: `Historical order ${i}`,
      deliveryAddress: `456 History St, Building ${i}, City`,
      customerName: 'John Doe',
      totalItems: Math.floor(Math.random() * 10) + 1,
      totalQuantity: Math.floor(Math.random() * 100) + 20,
      createdon: formatDateToString(orderDate),
      closedon: status === 'CLOSED' ? formatDateToString(closedDate) : '',
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
  filterContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  statusButtonSelected: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  statusButtonText: {
    color: '#4b5563',
    fontWeight: '500',
    fontSize: 14,
  },
  statusButtonTextSelected: {
    color: '#ffffff',
  },
  list: {
    padding: 16,
    paddingBottom: 50,
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
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
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
  closedDateContainer: {
    backgroundColor: '#f9fafb',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closedDateLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginRight: 4,
  },
  closedDateValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
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
    paddingBottom: 34,
    marginBottom: 17,
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
  filterInfoText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
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

export default OrderHistoryScreen;
