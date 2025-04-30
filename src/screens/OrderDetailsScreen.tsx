//OrderDetailsScreen
import React, {useEffect} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
  Animated,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {RouteProp} from '@react-navigation/native';
import {API_ENDPOINTS, DEFAULT_HEADERS} from '../config/api.config';
import axios from 'axios';
import {
  useNavigation,
  ParamListBase,
  NavigationProp,
  CommonActions,
} from '@react-navigation/native';

interface OrderItem {
  detailId?: number;
  itemId?: number;
  itemName: string;
  lotNo: string | number;
  itemMarks: string;
  vakalNo: string;
  requestedQty: number;
  availableQty: number;
  status: string;
  unitName?: string;
  netQuantity?: number;
}

interface Order {
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
  items: OrderItem[];
}

interface RouteParams {
  order: Order;
  fromEditScreen?: boolean; // Add this parameter to track if we came from edit screen
}

const OrderDetailsScreen = ({
  route,
}: {
  route: RouteProp<{params: RouteParams}, 'params'>;
}) => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const {order, fromEditScreen} = route.params;

  // Initialize state with order items from the route params
  const [orderItems, setOrderItems] = React.useState<OrderItem[]>(
    order.items || [],
  );

  // Update orderItems when the order prop changes
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (route.params?.order) {
        setOrderItems(route.params.order.items || []);
      }
    });

    return unsubscribe;
  }, [navigation, route.params]);

  const [modalVisible, setModalVisible] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<OrderItem | null>(
    null,
  );
  const [toastVisible, setToastVisible] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState(
    'Order cancelled successfully!',
  );
  const [toastType, setToastType] = React.useState<'success' | 'error'>(
    'success',
  );
  const toastOpacity = React.useRef(new Animated.Value(0)).current;
  const toastOffset = React.useRef(new Animated.Value(300)).current;

  // Format date for display
  // const formatDate = (dateString: string) => {
  //   try {
  //     if (!dateString) return 'N/A';

  //     // Check if the date is too far in the future or past
  //     // This will fix the "Date value out of bounds" error
  //     const currentYear = new Date().getFullYear();
  //     if (dateString.includes('-')) {
  //       const year = parseInt(dateString.split('-')[0], 10);
  //       // JavaScript dates are typically limited to around ±275,000 years from 1970
  //       // To be safe, limit to ±100 years from current
  //       if (year > currentYear + 100 || year < currentYear - 100) {
  //         console.warn('Date year out of reasonable range:', year);
  //         // Return a more user-friendly formatted version of the date
  //         const parts = dateString.split('-');
  //         if (parts.length === 3) {
  //           const [year, month, day] = parts;
  //           // Format manually with minimal processing to avoid Date constructor issues
  //           const monthNames = [
  //             'January',
  //             'February',
  //             'March',
  //             'April',
  //             'May',
  //             'June',
  //             'July',
  //             'August',
  //             'September',
  //             'October',
  //             'November',
  //             'December',
  //           ];
  //           const monthIndex = parseInt(month, 10) - 1;
  //           if (monthIndex >= 0 && monthIndex < 12) {
  //             return `${monthNames[monthIndex]} ${parseInt(day, 10)}, ${year}`;
  //           }
  //         }
  //         return dateString;
  //       }
  //     }

  //     // Handle invalid date strings
  //     const date = new Date(dateString);
  //     if (isNaN(date.getTime())) {
  //       return dateString; // Return original string if it can't be parsed
  //     }

  //     // Convert month number to month name
  //     const monthNames = [
  //       'January',
  //       'February',
  //       'March',
  //       'April',
  //       'May',
  //       'June',
  //       'July',
  //       'August',
  //       'September',
  //       'October',
  //       'November',
  //       'December',
  //     ];

  //     const year = date.getFullYear();
  //     const month = monthNames[date.getMonth()];
  //     const day = date.getDate();

  //     // Format the date manually
  //     return `${month} ${day}, ${year}`;
  //   } catch (error) {
  //     console.error('Error formatting date:', error, dateString);
  //     return dateString; // Return original string on error
  //   }
  // };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'N/A';

      // For YYYY-MM-DD format with or without time component
      if (dateString.match(/^\d{4}-\d{2}-\d{2}/) || dateString.includes('T')) {
        // Extract date part only if there's a time component
        const datePart = dateString.split('T')[0];
        const [year, month, day] = datePart.split('-');

        // Add 1 to day to compensate for timezone shift
        let dayNum = parseInt(day, 10) + 1;
        let monthIndex = parseInt(month, 10) - 1;
        let yearNum = parseInt(year, 10);

        // Handle month/year rollover if day exceeds month length
        const daysInMonth = new Date(yearNum, monthIndex + 1, 0).getDate();
        if (dayNum > daysInMonth) {
          dayNum = 1;
          if (monthIndex === 11) {
            monthIndex = 0;
            yearNum++;
          } else {
            monthIndex++;
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

        // Format the date manually
        return `${monthNames[monthIndex]} ${dayNum}, ${yearNum}`;
      }

      // For other formats or already formatted strings
      return dateString;
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return dateString; // Return original string on error
    }
  };
  const showCancelConfirmation = (item: OrderItem) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const showToast = (
    message: string,
    type: 'success' | 'error' = 'success',
  ) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);

    // Animate toast in
    Animated.parallel([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(toastOffset, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Hide toast after 2.5 seconds
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(toastOffset, {
          toValue: 300,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setToastVisible(false);
      });
    }, 2500);
  };

  // Updated backHandler function
  // Replace your backHandler with this simple version
  const backHandler = () => {
    navigation.goBack();
  };

  // Add this to handle updates when coming back from edit
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (route.params?.order) {
        // Update local state if we received updated order data
        setOrderItems(route.params.order.items || []);
      }
    });
    return unsubscribe;
  }, [navigation, route.params]);

  const handleCancelOrder = async () => {
    if (!selectedItem || !selectedItem.detailId) {
      showToast('Cannot cancel order: Missing detail ID', 'error');
      setModalVisible(false);
      return;
    }

    setIsLoading(true);

    try {
      // Log request details for debugging
      console.log('Making API request to:', API_ENDPOINTS.GET_CANCEL_ORDER);
      console.log('Request payload:', {
        detailId: selectedItem.detailId,
        cancelRemark: 'Cancelled via mobile app',
        cancelledBy: 'MOBILE_USER',
      });

      // Add a timeout to the axios request
      const response = await axios.post(
        API_ENDPOINTS.GET_CANCEL_ORDER,
        {
          detailId: selectedItem.detailId,
          cancelRemark: 'Cancelled via mobile app',
          cancelledBy: 'MOBILE_USER',
        },
        {
          headers: DEFAULT_HEADERS,
          timeout: 10000, // 10 second timeout
        },
      );

      // With axios, we directly get the data from the response
      const result = response.data;

      if (result.success) {
        // Remove the cancelled item from the order items list
        if (selectedItem && selectedItem.detailId) {
          // Filter out the cancelled item
          setOrderItems(
            orderItems.filter(item => item.detailId !== selectedItem.detailId),
          );
        }

        showToast('Order cancelled successfully!', 'success');
      } else {
        showToast(result.message || 'Failed to cancel order', 'error');
      }
    } catch (error: any) {
      console.error('Error cancelling order:', error);

      // Provide more specific error messages based on the error type
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          showToast('Request timed out. Please try again.', 'error');
        } else if (error.code === 'ERR_NETWORK') {
          showToast(
            'Cannot connect to server. Please check your network connection.',
            'error',
          );
        } else if (error.response) {
          // The request was made and the server responded with a status code outside of 2xx range
          showToast(`Server error: ${error.response.status}`, 'error');
        } else if (error.request) {
          // The request was made but no response was received
          showToast('No response from server. Please try again.', 'error');
        } else {
          showToast(`Error: ${error.message}`, 'error');
        }
      } else {
        showToast(
          `Error: ${error.message || 'Unknown error occurred'}`,
          'error',
        );
      }
    } finally {
      setIsLoading(false);
      setModalVisible(false);
    }
  };

  // Add this useEffect to handle updates
  useEffect(() => {
    if (route.params?.timestamp) {
      // This will re-render when we come back from edit with new data
    }
  }, [route.params?.timestamp]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={backHandler}>
          <MaterialIcons name="arrow-back" size={24} color="#0284C7" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        {order.status === 'NEW' && orderItems.length > 0 && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              navigation.navigate('EditOrderScreen', {order: order});
            }}>
            <MaterialIcons name="edit" size={24} color="#0284c7" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.purpleHeaderCard}>
          <View style={styles.purpleHeader}>
            <View style={styles.headerContent}>
              <MaterialIcons name="shopping-bag" size={24} color="#ffffff" />
              <Text style={styles.purpleHeaderText}>
                Order #{order.orderNo}
              </Text>
            </View>
          </View>

          <View style={styles.whiteCardContent}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <MaterialIcons name="event" size={16} color="#0284C7" />
                </View>
                <View>
                  <Text style={styles.infoLabelNew}>Order Date</Text>
                  {/* <Text style={styles.infoValueNew}>
                    {formatDate(order.orderDate)}
                  </Text> */}

                  <Text style={styles.infoValueNew}>
                    {formatDate(
                      new Date(
                        new Date(order.orderDate).setDate(
                          new Date(order.orderDate).getDate(),
                        ),
                      )
                        .toISOString()
                        .split('T')[0],
                    )}
                  </Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <MaterialIcons
                    name="local-shipping"
                    size={16}
                    color="#0284C7"
                  />
                </View>
                <View>
                  <Text style={styles.infoLabelNew}>Delivery Date</Text>
                  <Text style={styles.infoValueNew}>
                    {formatDate(order.deliveryDate)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.dividerHorizontal} />

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <MaterialIcons
                    name="directions-bus"
                    size={16}
                    color="#0284C7"
                  />
                </View>
                <View style={{flex: 1}}>
                  <Text style={styles.infoLabelNew}>Transporter</Text>
                  <Text
                    style={[styles.infoValueNew, styles.transporterText]}
                    numberOfLines={3}>
                    {order.transporterName || 'Qqq'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.dividerHorizontal} />

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <View style={styles.infoIcon}>
                  <MaterialIcons name="location-on" size={16} color="#0284C7" />
                </View>
                <View>
                  <Text style={styles.infoLabelNew}>Delivery Location</Text>
                  <View style={styles.locationBox}>
                    <Text style={styles.locationText}>
                      {order.deliveryAddress || 'N/A'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {orderItems && orderItems.length > 0 ? (
          orderItems.map((item: OrderItem, index: number) => (
            <View
              key={`item-${item.detailId || index}`}
              style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={styles.itemNameContainer}>
                  <MaterialIcons name="inventory" size={18} color="#0369a1" />
                  <Text style={styles.itemName}>{item.itemName}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <MaterialIcons
                    name="check-circle"
                    size={14}
                    color="#0284c7"
                  />
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>

              <View style={styles.lotNoContainer}>
                <MaterialIcons name="label" size={16} color="#f97316" />
                <Text style={styles.lotNo}>Lot No: {item.lotNo || 'N/A'}</Text>
              </View>

              <View style={styles.itemDetailsGrid}>
                <View style={styles.itemDetail}>
                  <MaterialIcons name="bookmark" size={14} color="#6B7280" />
                  <Text style={styles.detailLabel}>Item Marks:</Text>
                  <Text style={styles.detailValue}>
                    {item.itemMarks || 'N/A'}
                  </Text>
                </View>
              </View>
              <View style={styles.itemDetail}>
                <MaterialIcons name="description" size={14} color="#6B7280" />
                <Text style={styles.detailLabel}>Vakal No:</Text>
                <Text style={styles.detailValue}>{item.vakalNo || 'N/A'}</Text>
              </View>

              <View style={styles.quantityContainer}>
                <View style={styles.quantityColumn}>
                  <View style={styles.quantityLabelRow}>
                    <MaterialIcons
                      name="shopping-cart"
                      size={18}
                      color="#0369a1"
                    />
                    <Text style={styles.quantityLabel}>Ordered</Text>
                  </View>
                  <Text style={styles.quantityValue}>{item.requestedQty}</Text>
                </View>
                <View style={styles.quantityDivider} />
                <View style={styles.quantityColumn}>
                  <View style={styles.quantityLabelRow}>
                    <MaterialIcons name="inventory" size={18} color="#0369a1" />
                    <Text style={styles.quantityLabel}>Available</Text>
                  </View>
                  <Text style={styles.quantityValue}>{item.availableQty}</Text>
                </View>
              </View>

              <View style={styles.itemDetailsGrid}>
                <View style={styles.itemDetail}>
                  <MaterialIcons name="straighten" size={14} color="#6B7280" />
                  <Text style={styles.detailLabel}>Unit:</Text>
                  <Text style={styles.detailValue}>
                    {item.unitName || 'N/A'}
                  </Text>
                </View>
                <View style={styles.itemDetail}>
                  <MaterialIcons name="scale" size={14} color="#6B7280" />
                  <Text style={styles.detailLabel}>Net Qty:</Text>
                  <View
                    style={[
                      styles.netQtyContainer,
                      item.availableQty - item.requestedQty < 0
                        ? styles.negativeQtyContainer
                        : item.availableQty - item.requestedQty > 0
                        ? styles.positiveQtyContainer
                        : null,
                    ]}>
                    <Text
                      style={[
                        styles.detailValue,
                        item.availableQty - item.requestedQty < 0
                          ? styles.negativeQuantity
                          : item.availableQty - item.requestedQty > 0
                          ? styles.positiveQuantity
                          : null,
                      ]}>
                      {item.availableQty - item.requestedQty > 0 ? '+' : ''}
                      {item.availableQty - item.requestedQty}
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => showCancelConfirmation(item)}
                disabled={isLoading}>
                <MaterialIcons name="cancel" size={16} color="#fff" />
                <Text style={styles.cancelButtonText}>
                  {isLoading ? 'Processing...' : 'Cancel Order'}
                </Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.noItemsContainer}>
            <MaterialIcons name="info" size={48} color="#9ca3af" />
            <Text style={styles.noItemsText}>
              All order items have been cancelled
            </Text>
            <TouchableOpacity
              style={styles.backToOrdersButton}
              onPress={() => navigation.goBack()}>
              <MaterialIcons name="arrow-back" size={16} color="#fff" />
              <Text style={styles.backToOrdersText}>Back to Orders</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Custom Cancel Alert Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <MaterialIcons name="error-outline" size={40} color="#ef4444" />
              <Text style={styles.modalTitle}>Cancel Order</Text>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalMessage}>
                Are you sure you want to cancel order for:
              </Text>

              {selectedItem && (
                <View style={styles.selectedItemContainer}>
                  <Text style={styles.selectedItemName}>
                    {selectedItem.itemName}
                  </Text>
                  <View style={styles.selectedItemDetails}>
                    <MaterialIcons name="label" size={16} color="#f97316" />
                    <Text style={styles.selectedItemLot}>
                      Lot No: {selectedItem.lotNo || 'N/A'}
                    </Text>
                  </View>
                </View>
              )}

              <Text style={styles.modalWarning}>
                This action cannot be undone.
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>Keep Order</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={handleCancelOrder}>
                <MaterialIcons name="delete" size={16} color="#fff" />
                <Text style={styles.modalConfirmText}>Yes, Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Toast Notification */}
      {toastVisible && (
        <Animated.View
          style={[
            styles.toast,
            {
              opacity: toastOpacity,
              transform: [{translateX: toastOffset}],
            },
            toastType === 'error' ? styles.errorToast : styles.successToast,
          ]}>
          <View style={styles.toastContent}>
            <MaterialIcons
              name={toastType === 'success' ? 'check-circle' : 'error'}
              size={24}
              color={toastType === 'success' ? '#22c55e' : '#ef4444'}
            />
            <Text style={styles.toastMessage}>{toastMessage}</Text>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    position: 'relative', // This is important for absolute positioning of children
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0284c7',
    flex: 1,
    textAlign: 'center', // Center the text
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
  },
  editButton: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
  },

  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  whiteCardContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
    padding: 14,
    paddingHorizontal: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  infoIcon: {
    padding: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  infoLabelNew: {
    fontSize: 14,
    color: 'grey',
    fontWeight: '500',
    marginBottom: 3,
  },
  infoValueNew: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  transporterText: {
    flexWrap: 'wrap',
    lineHeight: 18,
  },
  dividerHorizontal: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
  },
  locationBox: {
    padding: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 4,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  orderStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    marginRight: 6,
  },
  orderStatusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
  },
  trackOrderLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7c3aed',
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 6,
  },
  statusBadge: {
    // backgroundColor: '#e0f2fe',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    // borderWidth: 1,
    // borderColor: '#bae6fd',
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284c7',
    marginLeft: 4,
  },
  lotNoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  lotNo: {
    fontSize: 15,
    fontWeight: '500',
    color: '#f97316',
    marginLeft: 6,
  },
  itemDetailsGrid: {
    flexDirection: 'row',
    marginVertical: 6,
  },
  itemDetail: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
    marginRight: 4,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  positiveQuantity: {
    color: '#059669',
    fontWeight: '700',
    fontSize: 14,
  },
  purpleHeaderCard: {
    backgroundColor: '#0284C7',
    borderRadius: 0,
    marginVertical: 10,
    marginHorizontal: 0,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  purpleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  purpleHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 11,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  negativeQuantity: {
    color: '#dc2626',
    fontWeight: '700',
    fontSize: 14,
  },
  quantityContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#dbeafe',
    alignItems: 'center',
  },
  quantityDivider: {
    height: '80%',
    width: 1,
    backgroundColor: '#bae6fd',
  },
  quantityColumn: {
    flex: 1,
    alignItems: 'center',
  },
  quantityLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0369a1',
    marginTop: 4,
  },
  netQtyContainer: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
    borderWidth: 1,
  },
  positiveQtyContainer: {
    backgroundColor: '#d1fae5',
    borderColor: '#a7f3d0',
  },
  negativeQtyContainer: {
    backgroundColor: '#fee2e2',
    borderColor: '#fecaca',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  cancelButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    padding: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    alignItems: 'center',
    padding: 16,
    paddingTop: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  modalBody: {
    padding: 16,
    paddingTop: 0,
  },
  modalMessage: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 12,
    textAlign: 'center',
  },
  selectedItemContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  selectedItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  selectedItemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedItemLot: {
    fontSize: 14,
    fontWeight: '500',
    color: '#f97316',
    marginLeft: 6,
  },
  modalWarning: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  modalCancelButton: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    borderRightWidth: 0.5,
    borderRightColor: '#e5e7eb',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalConfirmButton: {
    flex: 1,
    padding: 14,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  // Toast styles
  toast: {
    position: 'absolute',
    top: 82,
    right: 5,
    width: '74%',
    maxWidth: 310,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 2,
    },
    shadowOpacity: 0.18,
    shadowRadius: 4.65,
    elevation: 7,
    zIndex: 1000,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toastMessage: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 10,
  },
  noItemsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 12,
    marginVertical: 24,
    padding: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  noItemsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  backToOrdersButton: {
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  backToOrdersText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  cancelledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fee2e2',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  cancelledText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  errorToast: {
    borderLeftColor: '#ef4444',
  },
  successToast: {
    borderLeftColor: '#22c55e',
  },
});

export default OrderDetailsScreen;

// import React from 'react';
// import {
//   SafeAreaView,
//   ScrollView,
//   StyleSheet,
//   Text,
//   View,
//   TouchableOpacity,
//   Alert,
//   Modal,
//   Image,
//   Animated,
// } from 'react-native';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// import {RouteProp} from '@react-navigation/native';
// import axios from 'axios';
// import {
//   useNavigation,
//   ParamListBase,
//   NavigationProp,
//   useFocusEffect,
// } from '@react-navigation/native';

// interface OrderItem {
//   detailId?: number;
//   itemId?: number;
//   itemName: string;
//   lotNo: string | number;
//   itemMarks: string;
//   vakalNo: string;
//   requestedQty: number;
//   availableQty: number;
//   status: string;
//   unitName?: string;
//   netQuantity?: number;
// }

// interface Order {
//   orderId: number;
//   orderNo: string;
//   orderDate: string;
//   deliveryDate: string;
//   status: string;
//   transporterName: string;
//   remarks: string;
//   deliveryAddress: string;
//   customerName: string;
//   totalItems: number;
//   totalQuantity: number;
//   items: OrderItem[];
// }

// interface RouteParams {
//   order: Order;
// }

// const OrderDetailsScreen = ({
//   route,
// }: {
//   route: RouteProp<{params: RouteParams}, 'params'>;
// }) => {
//   const navigation = useNavigation<NavigationProp<ParamListBase>>();
//   const {order} = route.params;

//   // Initialize state with order items from the route params
//   const [orderItems, setOrderItems] = React.useState<OrderItem[]>(
//     order.items || [],
//   );

//   // Update orderItems when the order prop changes
//   React.useEffect(() => {
//     if (order && order.items) {
//       setOrderItems(order.items);
//     }
//   }, [order]);
//   const [modalVisible, setModalVisible] = React.useState(false);
//   const [selectedItem, setSelectedItem] = React.useState<OrderItem | null>(
//     null,
//   );
//   const [toastVisible, setToastVisible] = React.useState(false);
//   const [isLoading, setIsLoading] = React.useState(false);
//   const [toastMessage, setToastMessage] = React.useState(
//     'Order cancelled successfully!',
//   );
//   const [toastType, setToastType] = React.useState<'success' | 'error'>(
//     'success',
//   );
//   const toastOpacity = React.useRef(new Animated.Value(0)).current;
//   const toastOffset = React.useRef(new Animated.Value(300)).current;

//   // Format date for display
//   const formatDate = (dateString: string) => {
//     try {
//       if (!dateString) return 'N/A';

//       // For YYYY-MM-DD format with or without time component
//       if (dateString.match(/^\d{4}-\d{2}-\d{2}/) || dateString.includes('T')) {
//         // Extract date part only if there's a time component
//         const datePart = dateString.split('T')[0];
//         const [year, month, day] = datePart.split('-');

//         // Add 1 to day to compensate for timezone shift
//         let dayNum = parseInt(day, 10) + 1;
//         let monthIndex = parseInt(month, 10) - 1;
//         let yearNum = parseInt(year, 10);

//         // Handle month/year rollover if day exceeds month length
//         const daysInMonth = new Date(yearNum, monthIndex + 1, 0).getDate();
//         if (dayNum > daysInMonth) {
//           dayNum = 1;
//           if (monthIndex === 11) {
//             monthIndex = 0;
//             yearNum++;
//           } else {
//             monthIndex++;
//           }
//         }

//         // Convert month number to month name
//         const monthNames = [
//           'January',
//           'February',
//           'March',
//           'April',
//           'May',
//           'June',
//           'July',
//           'August',
//           'September',
//           'October',
//           'November',
//           'December',
//         ];

//         // Format the date manually
//         return `${monthNames[monthIndex]} ${dayNum}, ${yearNum}`;
//       }

//       // For other formats or already formatted strings
//       return dateString;
//     } catch (error) {
//       console.error('Error formatting date:', error, dateString);
//       return dateString; // Return original string on error
//     }
//   };

//   const showCancelConfirmation = (item: OrderItem) => {
//     setSelectedItem(item);
//     setModalVisible(true);
//   };

//   const showToast = (
//     message: string,
//     type: 'success' | 'error' = 'success',
//   ) => {
//     setToastMessage(message);
//     setToastType(type);
//     setToastVisible(true);

//     // Animate toast in
//     Animated.parallel([
//       Animated.timing(toastOpacity, {
//         toValue: 1,
//         duration: 400,
//         useNativeDriver: true,
//       }),
//       Animated.timing(toastOffset, {
//         toValue: 0,
//         duration: 400,
//         useNativeDriver: true,
//       }),
//     ]).start();

//     // Hide toast after 2.5 seconds
//     setTimeout(() => {
//       Animated.parallel([
//         Animated.timing(toastOpacity, {
//           toValue: 0,
//           duration: 350,
//           useNativeDriver: true,
//         }),
//         Animated.timing(toastOffset, {
//           toValue: 300,
//           duration: 350,
//           useNativeDriver: true,
//         }),
//       ]).start(() => {
//         setToastVisible(false);
//       });
//     }, 2500);
//   };

//   const handleCancelOrder = async () => {
//     if (!selectedItem || !selectedItem.detailId) {
//       showToast('Cannot cancel order: Missing detail ID', 'error');
//       setModalVisible(false);
//       return;
//     }

//     setIsLoading(true);

//     try {
//       // Simulate a successful cancellation without API call
//       // Remove the cancelled item from the order items list
//       if (selectedItem && selectedItem.detailId) {
//         // Filter out the cancelled item
//         setOrderItems(
//           orderItems.filter(item => item.detailId !== selectedItem.detailId),
//         );
//       }

//       showToast('Order cancelled successfully!', 'success');
//     } catch (error: any) {
//       console.error('Error cancelling order:', error);
//       showToast('Error cancelling order', 'error');
//     } finally {
//       setIsLoading(false);
//       setModalVisible(false);
//     }
//   };

//   // Handle going back to previous screen
//   const handleGoBack = () => {
//     // Simply go back to the previous screen without passing parameters
//     navigation.goBack();
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.header}>
//         <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
//           <MaterialIcons name="arrow-back" size={24} color="#0284C7" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Order Details</Text>
//         {order.status === 'NEW' && (
//           <TouchableOpacity
//             style={styles.editButton}
//             onPress={() => {
//               navigation.navigate('EditOrderScreen', {order: order});
//             }}>
//             <MaterialIcons name="edit" size={24} color="#0284c7" />
//           </TouchableOpacity>
//         )}
//       </View>

//       <ScrollView style={styles.scrollView}>
//         <View style={styles.purpleHeaderCard}>
//           <View style={styles.purpleHeader}>
//             <View style={styles.headerContent}>
//               <MaterialIcons name="shopping-bag" size={24} color="#ffffff" />
//               <Text style={styles.purpleHeaderText}>
//                 Order #{order.orderNo}
//               </Text>
//             </View>
//           </View>

//           <View style={styles.whiteCardContent}>
//             <View style={styles.infoRow}>
//               <View style={styles.infoItem}>
//                 <View style={styles.infoIcon}>
//                   <MaterialIcons name="event" size={16} color="#0284C7" />
//                 </View>
//                 <View>
//                   <Text style={styles.infoLabelNew}>Order Date</Text>
//                   <Text style={styles.infoValueNew}>
//                     {formatDate(order.orderDate)}
//                   </Text>
//                 </View>
//               </View>

//               <View style={styles.infoItem}>
//                 <View style={styles.infoIcon}>
//                   <MaterialIcons
//                     name="local-shipping"
//                     size={16}
//                     color="#0284C7"
//                   />
//                 </View>
//                 <View>
//                   <Text style={styles.infoLabelNew}>Delivery Date</Text>
//                   <Text style={styles.infoValueNew}>
//                     {formatDate(order.deliveryDate)}
//                   </Text>
//                 </View>
//               </View>
//             </View>

//             <View style={styles.dividerHorizontal} />

//             <View style={styles.infoRow}>
//               <View style={styles.infoItem}>
//                 <View style={styles.infoIcon}>
//                   <MaterialIcons
//                     name="directions-bus"
//                     size={16}
//                     color="#0284C7"
//                   />
//                 </View>
//                 <View style={{flex: 1}}>
//                   <Text style={styles.infoLabelNew}>Transporter</Text>
//                   <Text
//                     style={[styles.infoValueNew, styles.transporterText]}
//                     numberOfLines={3}>
//                     {order.transporterName || 'Qqq'}
//                   </Text>
//                 </View>
//               </View>
//             </View>

//             <View style={styles.dividerHorizontal} />

//             <View style={styles.infoRow}>
//               <View style={styles.infoItem}>
//                 <View style={styles.infoIcon}>
//                   <MaterialIcons name="location-on" size={16} color="#0284C7" />
//                 </View>
//                 <View>
//                   <Text style={styles.infoLabelNew}>Delivery Location</Text>
//                   <View style={styles.locationBox}>
//                     <Text style={styles.locationText}>
//                       {order.deliveryAddress || 'N/A'}
//                     </Text>
//                   </View>
//                 </View>
//               </View>
//             </View>
//           </View>
//         </View>

//         {orderItems && orderItems.length > 0 ? (
//           orderItems.map((item: OrderItem, index: number) => (
//             <View
//               key={`item-${item.detailId || index}`}
//               style={styles.itemCard}>
//               <View style={styles.itemHeader}>
//                 <View style={styles.itemNameContainer}>
//                   <MaterialIcons name="inventory" size={18} color="#0284C7" />
//                   <Text style={styles.itemName}>{item.itemName}</Text>
//                 </View>
//                 <View style={styles.statusBadge}>
//                   <MaterialIcons
//                     name="check-circle"
//                     size={14}
//                     color="#0284c7"
//                   />
//                   <Text style={styles.statusText}>{item.status}</Text>
//                 </View>
//               </View>

//               <View style={styles.lotNoContainer}>
//                 <MaterialIcons name="label" size={16} color="#f97316" />
//                 <Text style={styles.lotNo}>Lot No: {item.lotNo || 'N/A'}</Text>
//               </View>

//               <View style={styles.itemDetailsGrid}>
//                 <View style={styles.itemDetail}>
//                   <MaterialIcons name="bookmark" size={14} color="#6B7280" />
//                   <Text style={styles.detailLabel}>Item Marks:</Text>
//                   <Text style={styles.detailValue}>
//                     {item.itemMarks || 'N/A'}
//                   </Text>
//                 </View>
//               </View>
//               <View style={styles.itemDetail}>
//                 <MaterialIcons name="description" size={14} color="#6B7280" />
//                 <Text style={styles.detailLabel}>Vakal No:</Text>
//                 <Text style={styles.detailValue}>{item.vakalNo || 'N/A'}</Text>
//               </View>

//               <View style={styles.quantityContainer}>
//                 <View style={styles.quantityColumn}>
//                   <View style={styles.quantityLabelRow}>
//                     <MaterialIcons
//                       name="shopping-cart"
//                       size={18}
//                       color="#0369a1"
//                     />
//                     <Text style={styles.quantityLabel}>Ordered</Text>
//                   </View>
//                   <Text style={styles.quantityValue}>{item.requestedQty}</Text>
//                 </View>
//                 <View style={styles.quantityDivider} />
//                 <View style={styles.quantityColumn}>
//                   <View style={styles.quantityLabelRow}>
//                     <MaterialIcons name="inventory" size={18} color="#0369a1" />
//                     <Text style={styles.quantityLabel}>Available</Text>
//                   </View>
//                   <Text style={styles.quantityValue}>{item.availableQty}</Text>
//                 </View>
//               </View>

//               <View style={styles.itemDetailsGrid}>
//                 <View style={styles.itemDetail}>
//                   <MaterialIcons name="straighten" size={14} color="#6B7280" />
//                   <Text style={styles.detailLabel}>Unit:</Text>
//                   <Text style={styles.detailValue}>
//                     {item.unitName || 'N/A'}
//                   </Text>
//                 </View>
//                 <View style={styles.itemDetail}>
//                   <MaterialIcons name="scale" size={14} color="#6B7280" />
//                   <Text style={styles.detailLabel}>Net Qty:</Text>
//                   <View
//                     style={[
//                       styles.netQtyContainer,
//                       item.availableQty - item.requestedQty < 0
//                         ? styles.negativeQtyContainer
//                         : item.availableQty - item.requestedQty > 0
//                         ? styles.positiveQtyContainer
//                         : null,
//                     ]}>
//                     <Text
//                       style={[
//                         styles.detailValue,
//                         item.availableQty - item.requestedQty < 0
//                           ? styles.negativeQuantity
//                           : item.availableQty - item.requestedQty > 0
//                           ? styles.positiveQuantity
//                           : null,
//                       ]}>
//                       {item.availableQty - item.requestedQty > 0 ? '+' : ''}
//                       {item.availableQty - item.requestedQty}
//                     </Text>
//                   </View>
//                 </View>
//               </View>

//               <TouchableOpacity
//                 style={styles.cancelButton}
//                 onPress={() => showCancelConfirmation(item)}
//                 disabled={isLoading}>
//                 <MaterialIcons name="cancel" size={16} color="#fff" />
//                 <Text style={styles.cancelButtonText}>
//                   {isLoading ? 'Processing...' : 'Cancel Order'}
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           ))
//         ) : (
//           <View style={styles.noItemsContainer}>
//             <MaterialIcons name="info" size={48} color="#9ca3af" />
//             <Text style={styles.noItemsText}>
//               All order items have been cancelled
//             </Text>
//             <TouchableOpacity
//               style={styles.backToOrdersButton}
//               onPress={() => navigation.goBack()}>
//               <MaterialIcons name="arrow-back" size={16} color="#fff" />
//               <Text style={styles.backToOrdersText}>Back to Orders</Text>
//             </TouchableOpacity>
//           </View>
//         )}
//       </ScrollView>

//       {/* Custom Cancel Alert Modal */}
//       <Modal
//         animationType="fade"
//         transparent={true}
//         visible={modalVisible}
//         onRequestClose={() => setModalVisible(false)}>
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContent}>
//             <View style={styles.modalHeader}>
//               <MaterialIcons name="error-outline" size={40} color="#ef4444" />
//               <Text style={styles.modalTitle}>Cancel Order</Text>
//             </View>

//             <View style={styles.modalBody}>
//               <Text style={styles.modalMessage}>
//                 Are you sure you want to cancel order for:
//               </Text>

//               {selectedItem && (
//                 <View style={styles.selectedItemContainer}>
//                   <Text style={styles.selectedItemName}>
//                     {selectedItem?.itemName}
//                   </Text>
//                   <View style={styles.selectedItemDetails}>
//                     <MaterialIcons name="label" size={16} color="#f97316" />
//                     <Text style={styles.selectedItemLot}>
//                       Lot No: {selectedItem?.lotNo || 'N/A'}
//                     </Text>
//                   </View>
//                 </View>
//               )}

//               <Text style={styles.modalWarning}>
//                 This action cannot be undone.
//               </Text>
//             </View>

//             <View style={styles.modalActions}>
//               <TouchableOpacity
//                 style={styles.modalCancelButton}
//                 onPress={() => setModalVisible(false)}>
//                 <Text style={styles.modalCancelText}>Keep Order</Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 style={styles.modalConfirmButton}
//                 onPress={handleCancelOrder}>
//                 <MaterialIcons name="delete" size={16} color="#fff" />
//                 <Text style={styles.modalConfirmText}>Yes, Cancel</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>

//       {/* Custom Toast Notification */}
//       {toastVisible && (
//         <Animated.View
//           style={[
//             styles.toast,
//             {
//               opacity: toastOpacity,
//               transform: [{translateX: toastOffset}],
//             },
//             toastType === 'error' ? styles.errorToast : styles.successToast,
//           ]}>
//           <View style={styles.toastContent}>
//             <MaterialIcons
//               name={toastType === 'success' ? 'check-circle' : 'error'}
//               size={24}
//               color={toastType === 'success' ? '#22c55e' : '#ef4444'}
//             />
//             <Text style={styles.toastMessage}>{toastMessage}</Text>
//           </View>
//         </Animated.View>
//       )}
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '# f9fafb',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingVertical: 10,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e5e7eb',
//     elevation: 2,
//   },
//   editButton: {
//     padding: 8,
//   },
//   backButton: {
//     padding: 8,
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#0284C7',
//   },
//   placeholder: {
//     width: 40,
//   },
//   scrollView: {
//     flex: 1,
//   },
//   purpleHeaderCard: {
//     backgroundColor: '#0284C7',
//     borderRadius: 0,
//     marginVertical: 10,
//     marginHorizontal: 0,
//     overflow: 'hidden',
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 2},
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//     marginBottom: 10,
//   },
//   purpleHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 15,
//     paddingHorizontal: 15,
//   },
//   headerContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   purpleHeaderText: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#ffffff',
//     marginLeft: 11,
//     letterSpacing: 0.5,
//     textShadowColor: 'rgba(0, 0, 0, 0.2)',
//     textShadowOffset: {width: 0, height: 1},
//     textShadowRadius: 2,
//   },
//   whiteCardContent: {
//     backgroundColor: '#ffffff',
//     borderTopLeftRadius: 1,
//     borderTopRightRadius: 1,
//     padding: 14,
//     paddingHorizontal: 16,
//   },
//   infoRow: {
//     flexDirection: 'row',
//     marginBottom: 0,
//   },
//   infoItem: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     flex: 1,
//   },
//   infoIcon: {
//     padding: 8,
//     borderRadius: 8,
//     marginRight: 10,
//   },
//   infoLabelNew: {
//     fontSize: 12,
//     color: 'grey',
//     fontWeight: '500',
//     marginBottom: 3,
//   },
//   infoValueNew: {
//     fontSize: 13,
//     fontWeight: '600',
//     color: '#111827',
//   },
//   transporterText: {
//     flexWrap: 'wrap',
//     lineHeight: 18,
//   },
//   dividerHorizontal: {
//     height: 1,
//     backgroundColor: '#f0f0f0',
//     marginVertical: 12,
//   },
//   locationBox: {
//     padding: 8,
//     backgroundColor: '#f9fafb',
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: '#e5e7eb',
//     marginTop: 4,
//   },
//   locationText: {
//     fontSize: 14,
//     fontWeight: '500',
//     color: '#111827',
//   },
//   orderStatus: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },
//   statusDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     backgroundColor: '#22c55e',
//     marginRight: 6,
//   },
//   orderStatusText: {
//     fontSize: 14,
//     fontWeight: '500',
//     color: '#111827',
//     flex: 1,
//   },
//   trackOrderLink: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#7c3aed',
//   },
//   itemCard: {
//     backgroundColor: '#ffffff',
//     borderRadius: 12,
//     marginHorizontal: 12,
//     marginBottom: 12,
//     padding: 14,
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 2},
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//     borderWidth: 1,
//     borderColor: '#f0f0f0',
//   },
//   itemHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 12,
//     paddingBottom: 8,
//     borderBottomWidth: 1,
//     borderBottomColor: '#f0f0f0',
//   },
//   itemNameContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     flex: 1,
//   },
//   itemName: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#111827',
//     marginLeft: 6,
//   },
//   statusBadge: {
//     // backgroundColor: '#e0f2fe',
//     paddingHorizontal: 10,
//     paddingVertical: 3,
//     borderRadius: 20,
//     // borderWidth: 1,
//     // borderColor: '#bae6fd',
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   statusText: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: '#0284c7',
//     marginLeft: 4,
//   },
//   lotNoContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   lotNo: {
//     fontSize: 14,
//     fontWeight: '500',
//     color: '#f97316',
//     marginLeft: 6,
//   },
//   itemDetailsGrid: {
//     flexDirection: 'row',
//     marginVertical: 6,
//   },
//   itemDetail: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   detailLabel: {
//     fontSize: 13,
//     color: '#6B7280',
//     marginLeft: 4,
//     marginRight: 4,
//     fontWeight: '500',
//   },
//   detailValue: {
//     fontSize: 13,
//     fontWeight: '600',
//     color: '#111827',
//   },
//   positiveQuantity: {
//     color: '#059669',
//     fontWeight: '700',
//     fontSize: 14,
//   },
//   negativeQuantity: {
//     color: '#dc2626',
//     fontWeight: '700',
//     fontSize: 14,
//   },
//   quantityContainer: {
//     flexDirection: 'row',
//     backgroundColor: '#f0f7ff',
//     borderRadius: 8,
//     padding: 10,
//     marginVertical: 10,
//     borderWidth: 1,
//     borderColor: '#dbeafe',
//     alignItems: 'center',
//   },
//   quantityDivider: {
//     height: '80%',
//     width: 1,
//     backgroundColor: '#bae6fd',
//   },
//   quantityColumn: {
//     flex: 1,
//     alignItems: 'center',
//   },
//   quantityLabelRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   quantityLabel: {
//     fontSize: 12,
//     color: '#6B7280',
//     marginLeft: 4,
//     fontWeight: '500',
//   },
//   quantityValue: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#0369a1',
//     marginTop: 4,
//   },
//   netQtyContainer: {
//     paddingHorizontal: 8,
//     paddingVertical: 2,
//     borderRadius: 4,
//     marginLeft: 4,
//     borderWidth: 1,
//   },
//   positiveQtyContainer: {
//     backgroundColor: '#d1fae5',
//     borderColor: '#a7f3d0',
//   },
//   negativeQtyContainer: {
//     backgroundColor: '#fee2e2',
//     borderColor: '#fecaca',
//   },
//   cancelButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#ef4444',
//     borderRadius: 8,
//     paddingVertical: 10,
//     paddingHorizontal: 16,
//     marginTop: 12,
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 1},
//     shadowOpacity: 0.2,
//     shadowRadius: 2,
//   },
//   cancelButtonText: {
//     color: '#ffffff',
//     fontWeight: '600',
//     fontSize: 14,
//     marginLeft: 8,
//   },

//   // Modal styles
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   modalContent: {
//     backgroundColor: 'white',
//     borderRadius: 16,
//     width: '90%',
//     maxWidth: 400,
//     padding: 0,
//     overflow: 'hidden',
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   modalHeader: {
//     alignItems: 'center',
//     padding: 16,
//     paddingTop: 24,
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#111827',
//     marginTop: 8,
//   },
//   modalBody: {
//     padding: 16,
//     paddingTop: 0,
//   },
//   modalMessage: {
//     fontSize: 16,
//     color: '#4B5563',
//     marginBottom: 12,
//     textAlign: 'center',
//   },
//   selectedItemContainer: {
//     backgroundColor: '#f8fafc',
//     borderRadius: 8,
//     padding: 12,
//     marginBottom: 16,
//     borderWidth: 1,
//     borderColor: '#e2e8f0',
//   },
//   selectedItemName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#111827',
//     marginBottom: 8,
//   },
//   selectedItemDetails: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   selectedItemLot: {
//     fontSize: 14,
//     fontWeight: '500',
//     color: '#f97316',
//     marginLeft: 6,
//   },
//   modalWarning: {
//     fontSize: 14,
//     color: '#9CA3AF',
//     fontStyle: 'italic',
//     textAlign: 'center',
//   },
//   modalActions: {
//     flexDirection: 'row',
//     marginTop: 8,
//     borderTopWidth: 1,
//     borderTopColor: '#e5e7eb',
//   },
//   modalCancelButton: {
//     flex: 1,
//     padding: 14,
//     alignItems: 'center',
//     borderRightWidth: 0.5,
//     borderRightColor: '#e5e7eb',
//   },
//   modalCancelText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#6B7280',
//   },
//   modalConfirmButton: {
//     flex: 1,
//     padding: 14,
//     backgroundColor: '#ef4444',
//     alignItems: 'center',
//     flexDirection: 'row',
//     justifyContent: 'center',
//   },
//   modalConfirmText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: 'white',
//     marginLeft: 8,
//   },
//   // Toast styles
//   toast: {
//     position: 'absolute',
//     top: 82,
//     right: 5,
//     width: '74%',
//     maxWidth: 310,
//     backgroundColor: '#ffffff',
//     borderRadius: 12,
//     paddingVertical: 10,
//     paddingHorizontal: 14,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: -2,
//       height: 2,
//     },
//     shadowOpacity: 0.18,
//     shadowRadius: 4.65,
//     elevation: 7,
//     zIndex: 1000,
//     borderLeftWidth: 4,
//     borderLeftColor: '#22c55e',
//   },
//   toastContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   toastMessage: {
//     fontSize: 15,
//     fontWeight: '600',
//     color: '#111827',
//     marginLeft: 10,
//   },
//   noItemsContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#ffffff',
//     borderRadius: 12,
//     marginHorizontal: 12,
//     marginVertical: 24,
//     padding: 24,
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 2},
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//   },
//   noItemsText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#6b7280',
//     marginTop: 16,
//     marginBottom: 24,
//     textAlign: 'center',
//   },
//   backToOrdersButton: {
//     backgroundColor: '#7c3aed',
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     borderRadius: 8,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 1},
//     shadowOpacity: 0.2,
//     shadowRadius: 2,
//   },
//   backToOrdersText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#ffffff',
//     marginLeft: 8,
//   },
//   cancelledBadge: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#fef2f2',
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: '#fee2e2',
//     paddingVertical: 10,
//     paddingHorizontal: 16,
//     marginTop: 12,
//   },
//   cancelledText: {
//     color: '#ef4444',
//     fontWeight: '600',
//     fontSize: 14,
//     marginLeft: 8,
//   },
//   errorToast: {
//     borderLeftColor: '#ef4444',
//   },
//   successToast: {
//     borderLeftColor: '#22c55e',
//   },
// });

// export default OrderDetailsScreen;
