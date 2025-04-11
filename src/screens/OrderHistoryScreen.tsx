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
  createdOn: string;
  customerName: string;
  customerMobile: number;
  customerEmail: string | null;
  totalItems: number;
  totalQuantity: number;
  items: Array<{
    detailId: number;
    itemId: number;
    itemName: string;
    lotNo: number;
    itemMarks: string;
    vakalNo: string;
    batchNo: string | null;
    requestedQty: number;
    availableQty: number;
    status: string;
    supervisorName: string | null;
    mukadamName: string | null;
    cancelledRemark: string | null;
    cancelledDate: string | null;
  }>;
  // deliveryAddress?: string;
  deliveryAddress?: string;
}

interface OrderHistoryResponse {
  success: boolean;
  message: string;
  data: {
    orders: OrderHistory[];
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

        console.log('Fetching order history with params:', JSON.stringify(apiParams, null, 2));

        const response = await axios.get<OrderHistoryResponse>(`${API_ENDPOINTS.GET_ORDER_HISTORY}`, {
          params: apiParams,
        });

        const result = response.data;
        console.log('Order history response:', JSON.stringify(result, null, 2));
        console.log('Orders Count:', result.data.orders.length);
        console.log('Pagination Info:', JSON.stringify(result.data.pagination, null, 2));

        if (result.success) {
          const ordersData = result.data.orders;
          
          if (refresh || pageNum === 1) {
            setOrders(ordersData);
          } else {
            setOrders(prevOrders => [...prevOrders, ...ordersData]);
          }

          setTotalPages(result.data.pagination.totalPages);
          setPage(result.data.pagination.page);
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
        createdOn: params.createdOn || '',
        customerName: params.customerName || '',
        customerMobile: params.customerMobile || 0,
        customerEmail: params.customerEmail || null,
        totalItems: params.items?.length || 0,
        totalQuantity:
          params.items?.reduce(
            (sum: any, item: {requestedQty: any}) =>
              sum + (item.requestedQty || 0),
            0,
          ) || 0,
        items: params.items || [],
        deliveryAddress: params.deliveryAddress || '',
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
      
      axios.get<OrderHistoryResponse>(`${API_ENDPOINTS.GET_ORDER_HISTORY}`, {
        params: apiParams,
      })
      .then(response => {
        const result = response.data;
        
        if (result.success) {
          const ordersData = result.data.orders;
          
          setOrders(ordersData);
          setTotalPages(result.data.pagination.totalPages);
          setPage(result.data.pagination.page);
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
        <View style={styles.filterHeader}>
          <MaterialIcons name="tune" size={20} color="#0284c7" />
          <Text style={styles.filterTitle}>Filter Orders</Text>
        </View>
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
    // Check if any items have CANCEL status
    const hasAnyCancelledItem = item.items && item.items.some(orderItem => orderItem.status === 'CANCEL');
    
    // If any item is cancelled, override the order status for display purposes
    const displayStatus = hasAnyCancelledItem ? 'CANCEL' : item.status;
    
    // Get the appropriate colors for the status
    const statusColors = getStatusColor(displayStatus);

    return (
      <View style={styles.card}>
        {/* Order Number and Status */}
        <View style={styles.orderHeaderTop}>
          <View style={styles.orderNumberContainer}>
            <MaterialIcons name="receipt" size={20} color="#0284C7" style={styles.orderIcon} />
            <Text style={styles.orderNumberLabel}>Order No:</Text>
            <Text style={styles.orderNumberValue}>{item.orderNo}</Text>
          </View>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, {backgroundColor: statusColors.bg}]}>
              <Text style={[styles.statusText, {color: statusColors.text}]}>
                {displayStatus}
              </Text>
            </View>
          </View>
        </View>

        {/* Items List */}
        <View style={styles.itemsList}>
          <View style={styles.itemsListHeader}>
            <MaterialIcons name="inventory" size={20} color="#0284C7" style={styles.itemsIcon} />
            <Text style={styles.itemsListTitle}>Items ({item.totalItems})</Text>
          </View>
          {item.items && item.items.map((orderItem, index) => (
            <View key={`item-${index}`} style={styles.itemContainer}>
              {index > 0 && <View style={styles.itemDivider} />}
              <View style={styles.itemHeader}>
                <View style={styles.itemHeaderContainer}>
                  <Text style={styles.itemHeaderName}>{orderItem.itemName}</Text>
                  <View style={styles.quantityContainer}>
                    <MaterialIcons name="shopping-cart" size={16} color="#6B7280" style={styles.quantityIcon} />
                    <Text style={styles.itemHeaderQuantity}>
                      Qty: {orderItem.requestedQty}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.lotNoContainer}>
                <MaterialIcons name="label" size={16} color="#d97706" style={styles.lotNoIcon} />
                <Text style={styles.lotNoLabel}>Lot No:</Text>
                <Text style={styles.lotNoValue}>{orderItem.lotNo}</Text>
              </View>

              {orderItem.itemMarks && (
                <View style={styles.itemMarksContainer}>
                  <MaterialIcons name="description" size={16} color="#4B5563" style={styles.itemMarksIcon} />
                  <Text style={styles.itemMarksLabel}>Item Marks:</Text>
                  <Text style={styles.itemMarksValue}>{orderItem.itemMarks}</Text>
                </View>
              )}

              {orderItem.vakalNo && (
                <View style={styles.vakalNoContainer}>
                  <MaterialIcons name="receipt-long" size={16} color="#4B5563" style={styles.vakalNoIcon} />
                  <Text style={styles.vakalNoLabel}>Vakal No:</Text>
                  <Text style={styles.vakalNoValue}>{orderItem.vakalNo}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Common Order Details at the bottom */}
        <View style={styles.orderDetailsSection}>
          <View style={styles.orderDetailsHeader}>
            <MaterialIcons name="info" size={20} color="#0284C7" style={styles.orderDetailsIcon} />
            <Text style={styles.orderDetailsTitle}>Order Details</Text>
          </View>
          
          <View style={styles.dateContainer}>
            <View style={styles.dateBox}>
              <View style={styles.dateLabelContainer}>
                <MaterialIcons name="event" size={16} color="#374151" style={styles.dateIcon} />
                <Text style={styles.dateLabel}>Order Date</Text>
              </View>
              <Text style={styles.dateValue}>{formatDate(item.orderDate)}</Text>
            </View>
            <View style={styles.dateBox}>
              <View style={styles.dateLabelContainer}>
                <MaterialIcons name="local-shipping" size={16} color="#374151" style={styles.dateIcon} />
                <Text style={styles.dateLabel}>Delivery Date</Text>
              </View>
              <Text style={styles.dateValue}>{formatDate(item.deliveryDate)}</Text>
            </View>
          </View>

          {displayStatus === 'CANCEL' && (
            <View style={styles.closedDateContainer}>
              <MaterialIcons name="block" size={16} color="#ef4444" style={styles.closedDateIcon} />
              <Text style={styles.closedDateLabel}>Cancelled on:</Text>
              <Text style={styles.closedDateValue}>{formatDate(item.createdOn)}</Text>
            </View>
          )}

          {item.remarks && (
            <View style={styles.remarksContainer}>
              <View style={styles.remarksHeader}>
                <MaterialIcons name="comment" size={16} color="#4B5563" style={styles.remarksIcon} />
                <Text style={styles.remarksTitle}>Remarks: </Text>
              </View>
              <Text style={styles.remarksValue}>{item.remarks}</Text>
            </View>
          )}

          {item.transporterName && (
            <View style={styles.transporterContainer}>
              <View style={styles.transporterHeader}>
                <MaterialIcons name="local-shipping" size={16} color="#4B5563" style={styles.transporterIcon} />
                <Text style={styles.transporterTitle}>Transporter Name : </Text>
              </View>
              <Text style={styles.transporterValue}>{item.transporterName}</Text>
            </View>
          )}

          {/* Delivery Location Field */}
          <View style={styles.locationContainer}>
            <View style={styles.locationHeader}>
              <MaterialIcons name="location-on" size={16} color="#4B5563" style={styles.locationIcon} />
              <Text style={styles.locationTitle}>Delivery Location : </Text>
            </View>
            <Text style={styles.locationValue}>{item.deliveryAddress || "Not specified"}</Text>
          </View>
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
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0284c7',
    marginLeft: 8,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 0,
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    marginBottom: 3,
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
    padding: 14,
    paddingBottom: 50,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 8,
    marginVertical: 6,
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  orderHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  orderNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderIcon: {
    marginRight: 8,
    color: '#0284C7',
  },
  orderNumberLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  orderNumberValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    marginLeft: 4,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#fee2e2',
  },
  statusIcon: {
    marginRight: 6,
    color: '#ef4444',
  },
  statusText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
  },
  itemsList: {
    marginTop: -4,
  },
  itemsListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemsIcon: {
    marginRight: 8,
    color: '#0284C7',
  },
  itemsListTitle: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  itemContainer: {
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemHeaderContainer: {
    flex: 1,
  },
  itemHeaderName: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    marginBottom: 6,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  quantityIcon: {
    marginRight: 6,
    color: '#6B7280',
  },
  itemHeaderQuantity: {
    fontSize: 15,
    color: '#6B7280',
  },
  lotNoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  lotNoIcon: {
    marginRight: 3,
    color: '#d97706',
  },
  lotNoLabel: {
    fontSize: 14,
    color: '#d97706',
    fontWeight: '600',
    marginRight: 4,
  },
  lotNoValue: {
    fontSize: 14,
    color: '#d97706',
    fontWeight: '600',
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 9,
  },
  itemMarksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemMarksIcon: {
    marginRight: 6,
    color: '#4B5563',
  },
  itemMarksLabel: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
    marginRight: 4,
  },
  itemMarksValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    flex: 1,
  },
  vakalNoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  vakalNoIcon: {
    marginRight: 6,
    color: '#4B5563',
  },
  vakalNoLabel: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
    marginRight: 4,
  },
  vakalNoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  orderDetailsSection: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  orderDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderDetailsIcon: {
    marginRight: 8,
    color: '#0284C7',
  },
  orderDetailsTitle: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  dateBox: {
    flex: 1,
  },
  dateLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateIcon: {
    marginRight: 6,
    color: '#374151',
  },
  dateLabel: {
    fontSize: 14,
    color: '#374151',
  },
  dateValue: {
    fontSize: 14,
    marginLeft:10,
    color: '#111827',
    fontWeight: '500',
  },
  closedDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  closedDateIcon: {
    marginRight: 6,
    color: '#ef4444',
  },
  closedDateLabel: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
    marginRight: 4,
  },
  closedDateValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  remarksContainer: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  remarksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  remarksIcon: {
    marginRight: 4,
    color: '#4B5563',
  },
  remarksTitle: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  remarksValue: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 20,
    paddingLeft: 22,
  },
  transporterContainer: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  transporterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  transporterIcon: {
    marginRight: 4,
    color: '#4B5563',
  },
  transporterTitle: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  transporterValue: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 20,
    paddingLeft: 22,
  },
  locationContainer: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationIcon: {
    marginRight: 4,
    color: '#4B5563',
  },
  locationTitle: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  locationValue: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 20,
    paddingLeft: 22,
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
});

export default OrderHistoryScreen;
