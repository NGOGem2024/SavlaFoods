// OrderHistoryScreen.tsx

import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  Animated,
} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {MainStackParamList} from '../type/type';
import axios from 'axios';
import {API_ENDPOINTS} from '../config/api.config';

interface OrderHeader {
  ID: number;
  FK_CUSTOMER_ID: number;
  FK_USER_SUPERVISOR_ID: string;
  STATUS: string;
  CREATEDBY: string;
  CREATEDON: string;
  UPDATEDBY: string;
  UPDATEDON: string;
  ORDER_BY: string;
  ORDER_NO: string;
  ORDER_DATE: string;
  DELIVERY_DATE: string;
  TRANSPORTER_NAME: string;
  REMARK: string;
  ORDER_MODE: string;
}

interface OrderDetail {
  ORDERED_QUANTITY: number;
  ITEM_NAME: string;
  ID: number;
  FK_ORDER_ID: number;
  FK_ITEM_ID: number;
  LOT_NO: number | string;
  ITEM_MARKS: string;
  VAKAL_NO: string;
  REQUESTED_QTY: number;
  AVAILABLE_QTY: number;
  STATUS: string;
  MARK: string;
  REMARK: string;
  UNIT_NAME?: string;
  NET_QUANTITY?: number;
}

interface OrderResponse {
  success: boolean;
  header: OrderHeader;
  details: OrderDetail[];
}

type OrderHistoryScreenRouteProp = RouteProp<
  MainStackParamList,
  'OrderHistoryScreen'
>;
type OrderHistoryScreenNavigationProp = StackNavigationProp<
  MainStackParamList,
  'OrderHistoryScreen'
>;

interface OrderHistoryScreenProps {
  route: OrderHistoryScreenRouteProp;
  navigation: OrderHistoryScreenNavigationProp;
}

const DetailRow: React.FC<{label: string; value: string}> = ({
  label,
  value,
}) => (
  <View style={styles.detailRow}>
    <Text style={styles.label}>{label}:</Text>
    <Text style={styles.value}>{value || 'N/A'}</Text>
  </View>
);

const OrderHistoryScreen: React.FC<OrderHistoryScreenProps> = ({
  route,
  navigation,
}) => {
  const {orderId, orderNo, transporterName, deliveryDate, orderDate, items} =
    route.params;
  const [orderData, setOrderData] = useState<OrderResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rotationValues] = useState<{[key: number]: Animated.Value}>({});

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Create fallback data using route params
      const fallbackData: OrderResponse = {
        success: true,
        header: {
          ID: orderId,
          ORDER_NO: orderNo,
          DELIVERY_DATE: deliveryDate,
          ORDER_DATE: orderDate || new Date().toISOString(), // Add fallback value
          TRANSPORTER_NAME: transporterName,
          STATUS: 'NEW',
          FK_CUSTOMER_ID: 0,
          FK_USER_SUPERVISOR_ID: '',
          CREATEDBY: '',
          CREATEDON: '',
          UPDATEDBY: '',
          UPDATEDON: '',
          ORDER_BY: '',
          ORDER_MODE: '',
          REMARK: '',
        },
        details: items.map((item: any, index: number) => ({
          ID: item.ID || `${orderId}-${index}`,
          FK_ORDER_ID: orderId,
          FK_ITEM_ID: item.ITEM_ID,
          ITEM_NAME: item.ITEM_NAME,
          LOT_NO: item.LOT_NO,
          ITEM_MARKS: item.ITEM_MARKS,
          VAKAL_NO: item.VAKAL_NO,
          REQUESTED_QTY: item.ORDERED_QUANTITY,
          AVAILABLE_QTY: item.AVAILABLE_QTY,
          STATUS: 'NEW',
          MARK: item.ITEM_MARKS,
          REMARK: item.REMARK || '',
          ORDERED_QUANTITY: item.ORDERED_QUANTITY,
          UNIT_NAME: item.UNIT_NAME,
          NET_QUANTITY: item.NET_QUANTITY,
        })),
      };

      setOrderData(fallbackData);
    } catch (error: any) {
      console.error('Error handling order details:', error);
      setError('Failed to load order details');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!orderId || !items) {
      setError('Order details are missing');
      return;
    }
    fetchOrderDetails();
  }, [orderId, items]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const renderOrderDetail = ({item}: {item: OrderDetail}) => {
    const isExpanded = expandedId === item.ID;

    // Initialize rotation value for this item if it doesn't exist
    if (!rotationValues[item.ID]) {
      rotationValues[item.ID] = new Animated.Value(isExpanded ? 1 : 0);
    }

    const rotate = rotationValues[item.ID].interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '180deg'],
    });

    return (
      <TouchableOpacity
        onPress={() => toggleExpand(item.ID)}
        activeOpacity={0.9}>
        <Animated.View style={[styles.card, isExpanded && styles.expandedCard]}>
          <View style={styles.mainContent}>
            <View style={styles.cardHeader}>
              <View style={styles.nameContainer}>
                <Text style={styles.itemName}>{item.ITEM_NAME}</Text>
                <View style={styles.lotNoContainer}>
                  <Text style={styles.lotNo}>Lot No: {item.LOT_NO}</Text>
                </View>
              </View>
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        item.STATUS === 'NEW' ? '#e0f2fe' : '#f3f4f6',
                    },
                  ]}>
                  <Text
                    style={[
                      styles.statusText,
                      {color: item.STATUS === 'NEW' ? '#0284c7' : '#6B7280'},
                    ]}>
                    {item.STATUS}
                  </Text>
                </View>
                <Animated.Text
                  style={[styles.menuIcon, {transform: [{rotate}]}]}>
                  ▼
                </Animated.Text>
              </View>
            </View>

            {isExpanded && (
              <View style={styles.expandedContent}>
                <View style={styles.divider} />
                <View style={styles.detailsGrid}>
                  <DetailRow label="Item Marks" value={item.ITEM_MARKS} />
                  <DetailRow label="Vakal No" value={item.VAKAL_NO} />
                  <View style={styles.quantityContainer}>
                    <View style={styles.quantityBox}>
                      <Text style={styles.quantityLabel}>Ordered</Text>
                      <Text style={styles.quantityValue}>
                        {item.ORDERED_QUANTITY}
                      </Text>
                    </View>
                    <View style={styles.quantityBox}>
                      <Text style={styles.quantityLabel}>Available</Text>
                      <Text style={styles.quantityValue}>
                        {item.AVAILABLE_QTY}
                      </Text>
                    </View>
                  </View>
                  <DetailRow label="Unit Name" value={item.UNIT_NAME || ''} />
                  <DetailRow
                    label="Net Quantity"
                    value={String(item.NET_QUANTITY || '')}
                  />
                  <DetailRow label="Mark" value={item.MARK} />
                  {item.REMARK && (
                    <DetailRow label="Remark" value={item.REMARK} />
                  )}
                </View>
              </View>
            )}
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const toggleExpand = (detailId: number) => {
    // Initialize rotation value for this item if it doesn't exist
    if (!rotationValues[detailId]) {
      rotationValues[detailId] = new Animated.Value(0);
    }

    const isExpanding = expandedId !== detailId;

    Animated.timing(rotationValues[detailId], {
      toValue: isExpanding ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();

    setExpandedId(isExpanding ? detailId : null);
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0284C7" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!orderData) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No order data found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />

      <View style={styles.titleContainer}>
        <Text style={styles.screenTitle}>Order History</Text>
      </View>

      <View style={styles.headerCard}>
        <Text style={styles.orderNo}>Order ID : {orderData?.header.ID}</Text>
        <View style={styles.dateContainer}>
          <View style={styles.dateBox}>
            <Text style={styles.dateLabel}>Order Date</Text>
            <Text style={styles.dateValue}>
              {formatDate(orderData?.header.ORDER_DATE || '')}
            </Text>
          </View>
          <View style={styles.dateDivider} />
          <View style={styles.dateBox}>
            <Text style={styles.dateLabel}>Delivery Date</Text>
            <Text style={styles.dateValue}>
              {formatDate(orderData?.header.DELIVERY_DATE || '')}
            </Text>
          </View>
        </View>
        <View style={styles.transporterContainer}>
          <Text style={styles.transporterLabel}>Transporter</Text>
          <Text style={styles.transporterValue}>
            {orderData?.header.TRANSPORTER_NAME}
          </Text>
        </View>
      </View>

      <FlatList
        data={orderData?.details}
        keyExtractor={item => `detail-${item.FK_ORDER_ID}${item.ID}`}
        renderItem={renderOrderDetail}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchOrderDetails();
            }}
          />
        }
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
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
    color: '#7c3aed', // Purple color
  },
  headerCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    margin: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderNo: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
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
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  dateDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  transporterContainer: {
    marginTop: 8,
  },
  transporterLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  transporterValue: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  expandedCard: {
    borderColor: '#e0f2fe',
    borderWidth: 1,
  },
  mainContent: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameContainer: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  lotNoContainer: {
    backgroundColor: '#fff7ed',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  lotNo: {
    fontSize: 13,
    color: '#ea580c', // Orange color
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  menuIcon: {
    fontSize: 12,
    color: '#6B7280',
  },
  expandedContent: {
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  detailsGrid: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    color: '#6B7280',
  },
  value: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
  },
  quantityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 8,
    marginVertical: 4,
  },
  quantityBox: {
    alignItems: 'center',
  },
  quantityLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  quantityValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0284c7',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
});

export default OrderHistoryScreen;