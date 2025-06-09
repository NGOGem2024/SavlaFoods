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
import {useCustomer} from '../contexts/DisplayNameContext'; // Import useCustomer hook

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
  fromEditScreen?: boolean; // Add this parameter to track if we came from edit screen
  timestamp?: number; // Add timestamp property to fix TypeScript error
}

const OrderDetailsScreen = ({
  route,
}: {
  route: RouteProp<{params: RouteParams}, 'params'>;
}) => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const {order, unitName, fromEditScreen} = route.params;
  const {customerID} = useCustomer(); // Get customerID from context

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
  const [deleteModalVisible, setDeleteModalVisible] = React.useState(false);
  const [itemToDelete, setItemToDelete] = React.useState<OrderItem | null>(null);
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
  const [deletingItemId, setDeletingItemId] = React.useState<number | null>(null);

  const handleDeleteItem = (itemToDelete: OrderItem) => {
    // Check if the item has a detailId
    if (!itemToDelete.detailId) {
      showToast('Cannot delete: Missing item detail ID', 'error');
      return;
    }

    // Check if customerID is available
    if (!customerID) {
      showToast('Cannot delete: Customer ID not found', 'error');
      return;
    }

    // Log the full item object to verify its structure
    console.log('Full item object:', JSON.stringify(itemToDelete, null, 2));
    
    // Log the detailId to verify it's correct
    console.log('Deleting item with detailId:', itemToDelete.detailId);

    // Set the deleting item ID to show loading indicator
    setDeletingItemId(itemToDelete.detailId);
    setIsLoading(true);

    // Prepare the request body - only include detailIds
    const requestBody = {
      detailIds: [itemToDelete.detailId]
    };

    // Construct the full URL
    const apiUrl = `${API_ENDPOINTS.DELETE_ORDER}?customerId=${customerID}`;
    
    console.log('Delete API URL:', apiUrl);
    console.log('Delete request payload:', JSON.stringify(requestBody, null, 2));

    // Call the DELETE_ORDER API with customerId as URL parameter
    axios.post(
      apiUrl,
      requestBody,
      {
        headers: DEFAULT_HEADERS,
        timeout: 10000,
      }
    )
    .then(response => {
      console.log('Delete API response:', JSON.stringify(response.data, null, 2));
      
      if (response.data.success) {
        // Filter out the deleted item
        const updatedItems = orderItems.filter(
          item => item.detailId !== itemToDelete.detailId
        );
        
        setOrderItems(updatedItems);
        
        // Show success toast
        showToast(`Order deleted successfully`, 'success');
        
        // Check if the order was completely emptied and cancelled
        if (response.data.data.emptyOrdersCancelled?.includes(order.orderId)) {
          showToast('Order deleted successfully', 'success');
          setTimeout(() => navigation.goBack(), 1500);
        } else if (updatedItems.length === 0) {
          // If all items are deleted locally but not reflected in API response
          setTimeout(() => navigation.goBack(), 1500);
        }
      } else {
        showToast(response.data.message || 'Failed to delete item', 'error');
      }
    })
    .catch(error => {
      console.error('Error deleting item:', error);
      
      // Log more detailed error information
      if (axios.isAxiosError(error)) {
        console.log('Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          responseData: error.response?.data,
          message: error.message,
          code: error.code,
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
          requestData: error.config?.data,
        });
        
        // Provide more specific error messages based on the error type
        if (error.code === 'ECONNABORTED') {
          showToast('Request timed out. Please try again.', 'error');
        } else if (error.code === 'ERR_NETWORK') {
          showToast(
            'Cannot connect to server. Please check your network connection.',
            'error',
          );
        } else if (error.response) {
          // The request was made and the server responded with a status code outside of 2xx range
          const errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
          showToast(errorMessage, 'error');
        } else if (error.request) {
          // The request was made but no response was received
          showToast('No response from server. Please try again.', 'error');
        } else {
          showToast(`Error: ${error.message}`, 'error');
        }
      } else {
        showToast(`Error: ${error.message || 'Unknown error occurred'}`, 'error');
      }
    })
    .finally(() => {
      setIsLoading(false);
      setDeletingItemId(null);
    });
  };

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
    // setSelectedItem(item);
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
        // Clear all items
        setOrderItems([]);
        showToast('Order cancelled successfully!', 'success');
        // Navigate back after 1.5 seconds
        setTimeout(() => navigation.goBack(), 1500);
      } else {
        console.log('API call failed with message:', response.data.message);
        showToast(response.data.message || 'Failed to cancel order', 'error');
      }
    } catch (error: any) {
      console.error('Error cancelling order:', error);

      // Log detailed error information
      if (axios.isAxiosError(error)) {
        console.log('Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          responseData: error.response?.data,
          message: error.message,
          code: error.code,
        });
      }

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
      // Reset cancel remark to default for next time
      setCancelRemark('');
    }
  };

  // Add this useEffect to handle updates
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
                  <TouchableOpacity 
                    style={styles.deleteIconButton}
                    disabled={deletingItemId === item.detailId}
                    onPress={() => {
                      // Show custom delete modal
                      setItemToDelete(item);
                      setDeleteModalVisible(true);
                    }}>
                    {deletingItemId === item.detailId ? (
                      <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>Deleting...</Text>
                      </View>
                    ) : (
                      <MaterialIcons name="delete" size={20} color="#ef4444" />
                    )}
                  </TouchableOpacity>
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

        {/* Custom Delete Confirmation Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={deleteModalVisible}
          onRequestClose={() => setDeleteModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.deleteModalContent}>
              <View style={styles.deleteModalHeader}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <Text style={styles.deleteModalTitle}>Delete Item?</Text>
              </View>

              <View style={styles.deleteModalBody}>
                <Text style={styles.deleteModalMessage}>
                  Are you sure you want to delete:
                </Text>
                {itemToDelete && (
                  <Text style={styles.deleteItemName}>
                    "{itemToDelete.itemName}"
                  </Text>
                )}
              </View>

              <View style={styles.deleteModalActions}>
                <TouchableOpacity
                  style={styles.keepItemButton}
                  onPress={() => setDeleteModalVisible(false)}>
                  <Text style={styles.keepItemText}>KEEP ITEM</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.confirmDeleteButton}
                  onPress={() => {
                    setDeleteModalVisible(false);
                    if (itemToDelete) {
                      handleDeleteItem(itemToDelete);
                    }
                  }}
                  disabled={isLoading}>
                  <Text style={styles.confirmDeleteText}>
                    {isLoading ? 'DELETING...' : 'YES, DELETE'}
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
    marginEnd: 160,
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
    padding: 12,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 6,
  },
  modalBody: {
    padding: 16,
    paddingTop: 0,
  },
  modalMessage: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedItemContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  orderNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedItemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginLeft: 8,
  },
  selectedItemLot: {
    fontSize: 14,
    fontWeight: '500',
    color: '#f97316',
    marginLeft: 6,
  },
  modalActions: {
    flexDirection: 'row',
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
    marginLeft: 5,
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

  quantityContainerNew: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
  },
  quantityBox: {
    alignItems: 'center',
    flex: 1,
  },
  quantityDividerNew: {
    width: 1,
    backgroundColor: '#d1d5db',
    marginVertical: 4,
  },
  quantityLabelNew: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  quantityValueNew: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  selectedItemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  selectedItemDetailsText: {
    marginLeft: 4,
    color: '#4b5563',
  },
  bottomButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  fullCancelButton: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    borderRadius: 8,
    elevation: 2,
  },
  fullCancelButtonText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  cancelRemarkContainer: {
    marginTop: 12,
    marginBottom: 20,
    width: '100%',
  },
  cancelRemarkLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 8,
  },
  cancelRemarkInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#f9fafb',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  compactOrderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignSelf: 'center',
  },
  compactOrderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 3,
  },
  deleteIconButton: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  loadingContainer: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
  deleteModalContent: {
    backgroundColor: '#4b5563', // Dark gray background
    borderRadius: 8,
    width: '90%',
    maxWidth: 400,
    padding: 20,
    elevation: 5,
  },
  deleteModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  deleteModalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff', // White text
  },
  deleteModalBody: {
    marginBottom: 20,
  },
  deleteModalMessage: {
    fontSize: 18,
    color: '#ffffff', // White text
    marginBottom: 12,
  },
  deleteItemName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff', // White text
    marginBottom: 20,
  },
  deleteModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  keepItemButton: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    marginRight: 10,
  },
  keepItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4ade80', // Green text
  },
  confirmDeleteButton: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
  },
  confirmDeleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4ade80', // Green text for "YES, DELETE"
  },
  warningIcon: {
    fontSize: 28,
    marginRight: 8,
  },
});

export default OrderDetailsScreen;