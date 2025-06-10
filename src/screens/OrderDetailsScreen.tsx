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
  TextInput,
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
import {LayoutWrapper} from '../components/AppLayout';

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
  orderBy: string;
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
  unitName: string;
  fromEditScreen?: boolean;
  timestamp?: number;
}

const OrderDetailsScreen = ({
  route,
}: {
  route: RouteProp<{params: RouteParams}, 'params'>;
}) => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const {order, unitName, fromEditScreen} = route.params;

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
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);
  const [cancelRemark, setCancelRemark] = React.useState('');

  // Add states for item deletion
  const [deleteModalVisible, setDeleteModalVisible] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<OrderItem | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = React.useState(false);

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

  const showCancelConfirmation = (order: Order) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  // Add function to show delete confirmation
  const showDeleteConfirmation = (item: OrderItem) => {
    setItemToDelete(item);
    setDeleteModalVisible(true);
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

  const backHandler = () => {
    navigation.goBack();
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (route.params?.order) {
        setOrderItems(route.params.order.items || []);
      }
    });
    return unsubscribe;
  }, [navigation, route.params]);

  // Add function to handle item deletion
  const handleDeleteItem = async () => {
    if (!itemToDelete?.detailId) {
      showToast('Cannot delete item: Missing detail ID', 'error');
      setDeleteModalVisible(false);
      return;
    }

    setIsDeleting(true);

    try {
      console.log('Deleting item with detail ID:', itemToDelete.detailId);

      // Get customer ID from your app's state/context or pass it as needed
      const customerId = 'YOUR_CUSTOMER_ID'; // Replace with actual customer ID

      const response = await axios.delete(
        `${API_ENDPOINTS.DELETE_ORDER}?customerId=${customerId}`,
        {
          data: {
            detailIds: [itemToDelete.detailId],
          },
          headers: DEFAULT_HEADERS,
          timeout: 10000,
        },
      );

      console.log(
        'Delete API response:',
        JSON.stringify(response.data, null, 2),
      );

      if (response.data.success) {
        // Remove the deleted item from local state
        const updatedItems = orderItems.filter(
          item => item.detailId !== itemToDelete.detailId,
        );
        setOrderItems(updatedItems);

        showToast('Item deleted successfully!', 'success');

        // If no items left, show appropriate message
        if (updatedItems.length === 0) {
          showToast('All items deleted. Order has been cancelled.', 'success');
        }
      } else {
        console.log('Delete API failed with message:', response.data.message);
        showToast(response.data.message || 'Failed to delete item', 'error');
      }
    } catch (error: any) {
      console.error('Error deleting item:', error);

      if (axios.isAxiosError(error)) {
        console.log('Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          code: error.code,
        });

        if (error.code === 'ECONNABORTED') {
          showToast('Request timed out. Please try again.', 'error');
        } else if (error.code === 'ERR_NETWORK') {
          showToast(
            'Cannot connect to server. Please check your network connection.',
            'error',
          );
        } else if (error.response) {
          showToast(`Server error: ${error.response.status}`, 'error');
        } else if (error.request) {
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
      setIsDeleting(false);
      setDeleteModalVisible(false);
      setItemToDelete(null);
    }
  };

  const handleCancelOrder = async () => {
    if (!order?.orderNo) {
      showToast('Cannot cancel order: Missing order number', 'error');
      setModalVisible(false);
      return;
    }

    setIsLoading(true);

    try {
      console.log('Cancelling order with number:', order.orderNo);
      console.log('API endpoint:', API_ENDPOINTS.GET_CANCEL_ORDER);
      console.log('Request payload:', {
        orderNo: order.orderNo,
        cancelRemark: cancelRemark,
        cancelledBy: 'MOBILE_USER',
      });

      const response = await axios.post(
        API_ENDPOINTS.GET_CANCEL_ORDER,
        {
          orderNo: order.orderNo,
          cancelRemarks: cancelRemark,
          cancelledBy: 'MOBILE_USER',
        },
        {
          headers: DEFAULT_HEADERS,
          timeout: 10000,
        },
      );

      console.log('API response:', JSON.stringify(response.data, null, 2));

      if (response.data.success) {
        setOrderItems([]);
        showToast('Order cancelled successfully!', 'success');
        setTimeout(() => navigation.goBack(), 1500);
      } else {
        console.log('API call failed with message:', response.data.message);
        showToast(response.data.message || 'Failed to cancel order', 'error');
      }
    } catch (error: any) {
      console.error('Error cancelling order:', error);

      if (axios.isAxiosError(error)) {
        console.log('Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          code: error.code,
        });
      }

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          showToast('Request timed out. Please try again.', 'error');
        } else if (error.code === 'ERR_NETWORK') {
          showToast(
            'Cannot connect to server. Please check your network connection.',
            'error',
          );
        } else if (error.response) {
          showToast(`Server error: ${error.response.status}`, 'error');
        } else if (error.request) {
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
      setCancelRemark('');
    }
  };

  useEffect(() => {
    if (route.params?.timestamp) {
      // This will re-render when we come back from edit with new data
    }
  }, [route.params?.timestamp]);

  return (
    <LayoutWrapper showHeader={true} showTabBar={true} route={route}>
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.purpleHeaderCard}>
            <View style={styles.purpleHeader}>
              <View style={styles.headerContent}>
                <MaterialIcons name="shopping-bag" size={24} color="#ffffff" />
                <Text style={styles.purpleHeaderText}>
                  Order #{order.orderNo}
                </Text>
              </View>
              {order.status === 'NEW' && orderItems.length > 0 && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => {
                    navigation.navigate('EditOrderScreen', {order: order});
                  }}>
                  <MaterialIcons name="edit" size={24} color="white" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.whiteCardContent}>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <View style={styles.infoIcon}>
                    <MaterialIcons name="event" size={16} color="#0284C7" />
                  </View>
                  <View>
                    <Text style={styles.infoLabelNew}>Order Date</Text>
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
                    <Text style={styles.infoLabelNew}>Order By</Text>
                    <Text
                      style={[styles.infoValueNew, styles.transporterText]}
                      numberOfLines={3}>
                      {order.orderBy || 'Qqq'}
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
                    <Text style={styles.infoLabelNew}>Transporter Name</Text>
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
                    <MaterialIcons
                      name="location-on"
                      size={16}
                      color="#0284C7"
                    />
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

              <View style={styles.dividerHorizontal} />

              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <View style={styles.infoIcon}>
                    <MaterialIcons name="comment" size={16} color="#0284C7" />
                  </View>
                  <View>
                    <Text style={styles.infoLabelNew}>Remarks</Text>
                    <View style={styles.locationBox}>
                      <Text style={styles.locationText}>
                        {order.remarks || 'N/A'}
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
                  {/* Add delete button for each item */}
                  {order.status === 'NEW' && (
                    <TouchableOpacity
                      style={styles.deleteItemButton}
                      onPress={() => showDeleteConfirmation(item)}
                      disabled={isDeleting}>
                      <MaterialIcons name="delete" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.lotNoContainer}>
                  <MaterialIcons name="label" size={16} color="#f97316" />
                  <Text style={styles.lotNo}>
                    Lot No: {item.lotNo || 'N/A'}
                  </Text>
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
                  <Text style={styles.detailValue}>
                    {item.vakalNo || 'N/A'}
                  </Text>
                </View>

                <View style={styles.quantityContainerNew}>
                  <View style={styles.quantityBox}>
                    <Text style={styles.quantityLabelNew}>Available</Text>
                    <Text style={styles.quantityValueNew}>
                      {item.availableQty}
                    </Text>
                  </View>
                  <View style={styles.quantityDividerNew} />
                  <View style={styles.quantityBox}>
                    <Text style={styles.quantityLabelNew}>Net Qty</Text>
                    <Text
                      style={[
                        styles.quantityValueNew,
                        item.availableQty - item.requestedQty < 0 &&
                          styles.negativeQuantity,
                        item.availableQty - item.requestedQty > 0 &&
                          styles.positiveQuantity,
                      ]}>
                      {item.availableQty - item.requestedQty}
                    </Text>
                  </View>
                  <View style={styles.quantityDividerNew} />
                  <View style={styles.quantityBox}>
                    <Text style={styles.quantityLabelNew}>Ordered</Text>
                    <Text style={styles.quantityValueNew}>
                      {item.requestedQty}
                    </Text>
                  </View>
                </View>
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

        {/* Order Cancel Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <MaterialIcons name="error-outline" size={28} color="#ef4444" />
                <Text style={styles.modalTitle}>Cancel Order</Text>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.modalMessage}>
                  Are you sure you want to cancel this order?
                </Text>

                <View style={styles.compactOrderContainer}>
                  <MaterialIcons
                    name="shopping-bag"
                    size={16}
                    color="#0284C7"
                  />
                  <Text style={styles.compactOrderText}>
                    Order No: #{order.orderNo}
                  </Text>
                </View>

                <View style={styles.cancelRemarkContainer}>
                  <Text style={styles.cancelRemarkLabel}>
                    Cancellation Remarks:
                  </Text>
                  <TextInput
                    style={styles.cancelRemarkInput}
                    value={cancelRemark}
                    onChangeText={setCancelRemark}
                    placeholder="Enter reason for cancellation"
                    placeholderTextColor="#9ca3af"
                    multiline={true}
                    numberOfLines={2}
                  />
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalCancelText}>Keep Order</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalConfirmButton}
                  onPress={handleCancelOrder}
                  disabled={isLoading}>
                  <MaterialIcons name="delete" size={16} color="#fff" />
                  <Text style={styles.modalConfirmText}>
                    {isLoading ? 'Cancelling...' : 'Confirm Cancel'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Item Delete Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={deleteModalVisible}
          onRequestClose={() => setDeleteModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <MaterialIcons
                  name="delete-outline"
                  size={28}
                  color="#ef4444"
                />
                <Text style={styles.modalTitle}>Delete Item</Text>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.modalMessage}>
                  Are you sure you want to delete this item from the order?
                </Text>

                {itemToDelete && (
                  <View style={styles.selectedItemContainer}>
                    <View style={styles.orderNumberContainer}>
                      <MaterialIcons
                        name="inventory"
                        size={18}
                        color="#0369a1"
                      />
                      <Text style={styles.selectedItemName}>
                        {itemToDelete.itemName}
                      </Text>
                    </View>
                    <View style={styles.selectedItemDetails}>
                      <MaterialIcons name="label" size={14} color="#f97316" />
                      <Text style={styles.selectedItemDetailsText}>
                        Lot: {itemToDelete.lotNo}
                      </Text>
                    </View>
                    <View style={styles.selectedItemDetails}>
                      <MaterialIcons
                        name="shopping-cart"
                        size={14}
                        color="#6B7280"
                      />
                      <Text style={styles.selectedItemDetailsText}>
                        Qty: {itemToDelete.requestedQty}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setDeleteModalVisible(false)}>
                  <Text style={styles.modalCancelText}>Keep Item</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalConfirmButton}
                  onPress={handleDeleteItem}
                  disabled={isDeleting}>
                  <MaterialIcons name="delete" size={16} color="#fff" />
                  <Text style={styles.modalConfirmText}>
                    {isDeleting ? 'Deleting...' : 'Delete Item'}
                  </Text>
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
        {orderItems.length > 0 && (
          <View style={styles.bottomButtonContainer}>
            <TouchableOpacity
              style={styles.fullCancelButton}
              onPress={() => showCancelConfirmation(order)}
              disabled={isLoading}>
              <MaterialIcons name="cancel" size={20} color="#fff" />
              <Text style={styles.fullCancelButtonText}>
                {isLoading ? 'Processing...' : 'Cancel Order'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </LayoutWrapper>
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
    position: 'relative',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0284c7',
    flex: 1,
    textAlign: 'center',
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
  // Add delete item button style
  deleteItemButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
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
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 18,
  },
  purpleHeaderCard: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  purpleHeader: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  purpleHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  itemCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0369a1',
    marginLeft: 8,
    flex: 1,
  },
  lotNoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#fef3c7',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  lotNo: {
    fontSize: 14,
    fontWeight: '500',
    color: '#d97706',
    marginLeft: 6,
  },
  itemDetailsGrid: {
    marginBottom: 8,
  },
  itemDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginLeft: 6,
    marginRight: 8,
  },
  detailValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  quantityContainerNew: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  quantityBox: {
    flex: 1,
    alignItems: 'center',
  },
  quantityLabelNew: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  quantityValueNew: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  quantityDividerNew: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },
  negativeQuantity: {
    color: '#ef4444',
  },
  positiveQuantity: {
    color: '#22c55e',
  },
  noItemsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  noItemsText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  backToOrdersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backToOrdersText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  bottomButtonContainer: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  fullCancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 8,
    shadowColor: '#ef4444',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  fullCancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 0,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 12,
  },
  modalBody: {
    padding: 20,
    paddingTop: 16,
  },
  modalMessage: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 16,
  },
  compactOrderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  compactOrderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0284c7',
    marginLeft: 8,
  },
  cancelRemarkContainer: {
    marginTop: 8,
  },
  cancelRemarkLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  cancelRemarkInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#374151',
    backgroundColor: '#ffffff',
    textAlignVertical: 'top',
    minHeight: 60,
  },
  selectedItemContainer: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 12,
  },
  orderNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0369a1',
    marginLeft: 8,
    flex: 1,
  },
  selectedItemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  selectedItemDetailsText: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 6,
  },
  modalActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  modalCancelButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: '#f3f4f6',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  modalConfirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#ef4444',
    borderBottomRightRadius: 16,
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 6,
  },
  toast: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    left: 16,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 1000,
  },
  successToast: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  errorToast: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toastMessage: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
  },
});

export default OrderDetailsScreen;
