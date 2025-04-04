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
  items: Array<{
    FK_ORDER_ID: number;
    ITEM_NAME: string;
    REQUESTED_QTY: number;
    ORDER_DATE: string;
    STATUS: string;
    CANCELLEDBY: string;
    CANCELLEDON: string;
    CANCELLED_REMARK: string;
    FK_ITEM_ID: number;
    LOT_NO: string;
    [key: string]: any;
  }>;
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
  const [selectedStatus, setSelectedStatus] = useState<string | null>("CANCEL");

  // Get customerID from context or route params
  const {customerID: contextCustomerID} = useCustomer();
  const customerID = params?.customerID || contextCustomerID;

  // Check if we have a specific order passed through params
  const hasSpecificOrder = params?.orderId && params?.orderNo;

  const fetchOrderHistory = useCallback(
    async (pageNum = 1, refresh = false, status = selectedStatus) => {
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
        if (status) apiParams.status = status;

        console.log('Fetching order history with params:', apiParams);

        const response = await axios.get(`${API_ENDPOINTS.GET_ORDER_HISTORY}`, {
          params: apiParams,
        });

        const result = response.data;
        console.log('Order history response:', result);

        if (result.success) {
          // Check if data is an array directly (different API format)
          const ordersData = Array.isArray(result.data) ? result.data : 
                            (result.data?.orders || []);
          
          // Group items by order ID to create order objects
          const orderMap = new Map();
          
          ordersData.forEach((item: any) => {
            const orderId = item.FK_ORDER_ID;
            if (!orderMap.has(orderId)) {
              const orderDate = item.ORDER_DATE ? item.ORDER_DATE.split('T')[0] : '';
              
              orderMap.set(orderId, {
                orderId: orderId,
                orderNo: `ORD-${orderId}`,
                orderDate: orderDate,
                deliveryDate: orderDate, // Using order date as delivery date if not provided
                status: item.STATUS,
                transporterName: '',
                remarks: item.CANCELLED_REMARK || '',
                deliveryAddress: '',
                customerName: '',
                totalItems: 1,
                totalQuantity: item.REQUESTED_QTY || 0,
                createdon: orderDate,
                closedon: item.CANCELLEDON ? item.CANCELLEDON.split('T')[0] : '',
                items: [item]
              });
            } else {
              // Update existing order
              const existingOrder = orderMap.get(orderId);
              existingOrder.totalItems += 1;
              existingOrder.totalQuantity += (item.REQUESTED_QTY || 0);
              existingOrder.items.push(item);
            }
          });
          
          // Convert map to array of orders
          const normalizedOrders = Array.from(orderMap.values());
          
          console.log('Normalized orders:', normalizedOrders);

          if (refresh || pageNum === 1) {
            setOrders(normalizedOrders);
          } else {
            setOrders(prevOrders => [...prevOrders, ...normalizedOrders]);
          }

          // Handle pagination (use default values if not provided)
          setTotalPages(result.data?.pagination?.totalPages || 1);
          setPage(result.data?.pagination?.page || pageNum);
        } else {
          setError(result.message || 'Failed to load order history');
          setOrders([]);
        }
      } catch (err: any) {
        console.error('Error fetching Order History:', err);
        setError(err.message || 'Server error. Please try again later.');
        setOrders([]);
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
        items: params.items || [],
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

  const handleStatusFilter = (status: string | null) => {
    // Don't apply filters if we have a specific order from params
    if (hasSpecificOrder) return;

    // Set the status immediately
    setSelectedStatus(status);
    
    // Reset data and fetch with new status
    setOrders([]);
    setIsLoading(true);
    setPage(1);
    
    // Small timeout to ensure state is updated before fetch
    setTimeout(() => {
      const apiParams: any = {
        customerId: customerID,
        page: 1,
        limit: 10,
      };
      
      if (status) apiParams.status = status;
      
      console.log('Filtering with status:', status);
      
      axios.get(`${API_ENDPOINTS.GET_ORDER_HISTORY}`, {
        params: apiParams,
      })
      .then(response => {
        const result = response.data;
        
        if (result.success) {
          // Check if data is an array directly (different API format)
          const ordersData = Array.isArray(result.data) ? result.data : 
                          (result.data?.orders || []);
          
          // Group items by order ID to create order objects
          const orderMap = new Map();
          
          ordersData.forEach((item: any) => {
            const orderId = item.FK_ORDER_ID;
            if (!orderMap.has(orderId)) {
              const orderDate = item.ORDER_DATE ? item.ORDER_DATE.split('T')[0] : '';
              
              orderMap.set(orderId, {
                orderId: orderId,
                orderNo: `ORD-${orderId}`,
                orderDate: orderDate,
                deliveryDate: orderDate, // Using order date as delivery date if not provided
                status: item.STATUS,
                transporterName: '',
                remarks: item.CANCELLED_REMARK || '',
                deliveryAddress: '',
                customerName: '',
                totalItems: 1,
                totalQuantity: item.REQUESTED_QTY || 0,
                createdon: orderDate,
                closedon: item.CANCELLEDON ? item.CANCELLEDON.split('T')[0] : '',
                items: [item]
              });
            } else {
              // Update existing order
              const existingOrder = orderMap.get(orderId);
              existingOrder.totalItems += 1;
              existingOrder.totalQuantity += (item.REQUESTED_QTY || 0);
              existingOrder.items.push(item);
            }
          });
          
          // Convert map to array of orders
          const normalizedOrders = Array.from(orderMap.values());
          
          setOrders(normalizedOrders);
          setTotalPages(result.data?.pagination?.totalPages || 1);
          setPage(result.data?.pagination?.page || 1);
        } else {
          setError(result.message || 'Failed to load order history');
          setOrders([]);
        }
      })
      .catch(err => {
        console.error('Error fetching filtered orders:', err);
        setError(err.message || 'Server error. Please try again later.');
        setOrders([]);
      })
      .finally(() => {
        setIsLoading(false);
        setRefreshing(false);
      });
    }, 50);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CLOSED':
        return {bg: '#dcfce7', text: '#16a34a'};
      case 'CANCEL':
        return {bg: '#fee2e2', text: '#ef4444'};
      default:
        return {bg: '#f3f4f6', text: '#6B7280'};
    }
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
              selectedStatus === 'CLOSED' && styles.statusButtonSelected,
            ]}
            activeOpacity={0.6}
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
            activeOpacity={0.6}
            onPress={() => handleStatusFilter('CANCEL')}>
            <Text
              style={[
                styles.statusButtonText,
                selectedStatus === 'CANCEL' && styles.statusButtonTextSelected,
              ]}>
              Cancelled
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderOrderCard = ({item}: {item: OrderHistory}) => {
    const statusColors = getStatusColor(item.status);
    const cancelledOn = item.closedon ? formatDate(item.closedon) : '';

    return (
      <View style={styles.card}>
        {item.items && item.items.map((orderItem, index) => (
          <View key={`item-${index}`}>
            {index > 0 && <View style={styles.itemDivider} />}
            <View style={styles.cardHeader}>
              <View style={styles.itemHeaderContainer}>
                <Text style={styles.itemHeaderName}>{orderItem.ITEM_NAME || 'Unknown Item'}</Text>
                <Text style={styles.itemHeaderQuantity}>
                  Qty: {orderItem.REQUESTED_QTY || 0}
                </Text>
              </View>
              {index === 0 && (
                <View style={styles.statusContainer}>
                  <View
                    style={[styles.statusBadge, {backgroundColor: statusColors.bg}]}>
                    <Text style={[styles.statusText, {color: statusColors.text}]}>
                      {item.status}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.lotNoContainer}>
              <Text style={styles.lotNoLabel}>Lot No:</Text>
              <Text style={styles.lotNoValue}>{orderItem.LOT_NO || 'N/A'}</Text>
            </View>
          </View>
        ))}

        <View style={styles.dateContainer}>
          <View style={styles.dateBox}>
            <Text style={styles.dateLabel}>Order Date</Text>
            <Text style={styles.dateValue}>{formatDate(item.orderDate)}</Text>
          </View>
        </View>

        {item.status === 'CANCEL' && item.closedon && (
          <View style={styles.closedDateContainer}>
            <Text style={styles.closedDateLabel}>Cancelled on:</Text>
            <Text style={styles.closedDateValue}>{cancelledOn}</Text>
          </View>
        )}

        <View style={styles.bottomRow}>
          {item.remarks && !item.remarks.includes("Cancelled via") ? (
            <Text style={styles.remarks}>
              {item.remarks}
            </Text>
          ) : null}
        </View>
      </View>
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
          <MaterialIcons name="error-outline" size={64} color="#ef4444" />
          <Text style={styles.errorTitle}>Server Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorInfo}>
            The server encountered an issue processing your request. This might be temporary.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchOrderHistory(1, true)}>
            <Text style={styles.retryButtonText}>Try Again</Text>
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
  itemHeaderContainer: {
    flex: 1,
  },
  itemHeaderName: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
    marginBottom: 4,
  },
  itemHeaderQuantity: {
    fontSize: 14,
    color: '#6B7280',
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
  additionalItemsContainer: {
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 6,
    marginVertical: 8,
  },
  additionalItemsText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
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
  closedDateContainer: {
    backgroundColor: '#fee2e2',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  closedDateLabel: {
    fontSize: 13,
    color: '#ef4444',
    marginRight: 4,
    fontWeight: '500',
  },
  closedDateValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  bottomRow: {
    marginTop: 4,
  },
  remarks: {
    fontSize: 14,
    color: '#6B7280',
    width: '100%',
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
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  errorInfo: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 24,
  },
  lotNoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    // backgroundColor: '#fef3c7',
    padding: 8,
    borderRadius: 6,
  },
  lotNoLabel: {
    fontSize: 14,
    color: '#d97706',
    fontWeight: '800',
    marginRight: 4,
  },
  lotNoValue: {
    fontSize: 16,
    color: '#d97706',
    fontWeight: '800',
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 10,
  },
});

export default OrderHistoryScreen;
