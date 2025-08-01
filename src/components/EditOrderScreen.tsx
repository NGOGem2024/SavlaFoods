import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Modal,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import axios from 'axios';
import {useCustomer} from '../contexts/DisplayNameContext';
import {API_ENDPOINTS} from '../config/api.config';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

interface OrderItem {
  AVAILABLE_QTY: any;
  detailId: number;
  itemId: number;
  itemName: string;
  lotNo: string | number;
  itemMarks: string;
  vakalNo: string;
  requestedQty: number;
  QUANTITY: number; // Changed from Quantity to QUANTITY to match OrderDetailsScreen
  netQuantity: number; // From API AVAILABLE_QTY
  status: string;
  unitName?: string;
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
}

type EditOrderScreenProps = {
  route: RouteProp<{params: RouteParams}, 'params'>;
  navigation: StackNavigationProp<any>;
};

const NAVIGATION_CONSTANTS = {
  BOTTOM_TAB: 'BottomTabNavigator',
  ORDERS: 'Orders',
  PENDING_ORDERS: 'PendingOrdersScreen',
};

const EditOrderScreen = ({route, navigation}: EditOrderScreenProps) => {
  const {customerID} = useCustomer();
  const {order} = route.params;
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    transporterName: order.transporterName || '',
    deliveryDate: order.deliveryDate || new Date().toISOString().split('T')[0],
    remarks: order.remarks || '',
    deliveryAddress: order.deliveryAddress || '',
  });
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    try {
      const date = order.deliveryDate
        ? new Date(order.deliveryDate)
        : new Date();
      date.setHours(0, 0, 0, 0); // Normalize to midnight
      return date;
    } catch (e) {
      console.error('Error parsing deliveryDate:', e);
      return new Date();
    }
  });
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const toastOpacity = React.useRef(new Animated.Value(0)).current;
  const toastOffset = React.useRef(new Animated.Value(300)).current;
  const [transporterFields, setTransporterFields] = useState({
    name: '',
    vehicleNo: '',
    shopNo: '',
  });
  const [validationErrors, setValidationErrors] = useState({
    transporterName: '',
    deliveryDate: '',
    requestedQty: {} as Record<number, string>,
  });
  const [quantityExceedModalVisible, setQuantityExceedModalVisible] =
    useState(false);
  const [exceededItem, setExceededItem] = useState<OrderItem | null>(null);

  useEffect(() => {
    console.log('Order items received:', order.items);
    const mappedItems = order.items.map(item => {
      const mappedItem = {
        ...item,
        // Map both possible property names to ensure compatibility
        QUANTITY: item.QUANTITY ?? item.Quantity ?? 0,
        netQuantity: item.AVAILABLE_QTY ?? item.netQuantity ?? 0,
        requestedQty: item.requestedQty ?? 0,
        unitName: item.unitName ?? '',
        lotNo: String(item.lotNo || ''), // Ensure lotNo is string
        detailId: Number(item.detailId), // Ensure number
        itemId: Number(item.itemId), // Ensure number
      };
      console.log(`Mapped item ${item.itemName}:`, {
        QUANTITY: mappedItem.QUANTITY,
        netQuantity: mappedItem.netQuantity,
        requestedQty: mappedItem.requestedQty,
        detailId: mappedItem.detailId,
        itemId: mappedItem.itemId,
        lotNo: mappedItem.lotNo,
      });
      return mappedItem;
    });
    setOrderItems(mappedItems);
    if (order.transporterName) {
      const parts = order.transporterName.split('|').map(part => part.trim());
      setTransporterFields({
        name: parts[0] || '',
        vehicleNo: parts[1] || '',
        shopNo: parts[2] || '',
      });
    }
  }, [order]);

  const checkForUnsavedChanges = () => {
    return (
      formData.transporterName !== order.transporterName ||
      formData.deliveryDate !== order.deliveryDate ||
      formData.remarks !== order.remarks ||
      formData.deliveryAddress !== order.deliveryAddress ||
      orderItems.some(
        (item, index) => item.requestedQty !== order.items[index]?.requestedQty,
      )
    );
  };

  const handleNavigateBack = () => {
    if (checkForUnsavedChanges()) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          {text: 'Stay', style: 'cancel'},
          {
            text: 'Discard Changes',
            onPress: () => navigation.goBack(),
            style: 'destructive',
          },
        ],
      );
    } else {
      navigation.goBack();
    }
  };

  const showDatePicker = () => {
    setDatePickerVisible(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  const handleConfirm = (date: Date) => {
    hideDatePicker();
    if (!date) return;
    date.setHours(0, 0, 0, 0); // Normalize to midnight
    setSelectedDate(date);
    const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
    setFormData(prev => ({...prev, deliveryDate: formattedDate}));
    setValidationErrors(prev => ({...prev, deliveryDate: ''}));
  };

  const formatDisplayDate = (date: Date) => {
    if (!date || isNaN(date.getTime())) return 'Select Date';
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
    return `${
      monthNames[date.getMonth()]
    } ${date.getDate()}, ${date.getFullYear()}`;
  };

  const validateTransporterName = (name: string) => {
    return name.trim() ? '' : 'Transporter name is required';
  };

  const validateDeliveryDate = (dateString: string) => {
    if (!dateString) return 'Delivery date is required';
    try {
      const deliveryDate = new Date(dateString);
      const orderDate = new Date(order.orderDate);
      if (isNaN(deliveryDate.getTime()) || isNaN(orderDate.getTime())) {
        return 'Invalid date format';
      }
      deliveryDate.setHours(0, 0, 0, 0);
      orderDate.setHours(0, 0, 0, 0);
      if (deliveryDate < orderDate) {
        return 'Delivery date cannot be before order date';
      }
      return '';
    } catch (error) {
      console.error('Date validation error:', error);
      return 'Invalid date format';
    }
  };

  const validateRequestedQty = (
    qty: number,
    netQuantity: number,
    itemId: number,
  ) => {
    if (qty < 0) return 'Quantity must be greater than zero';
    return '';
  };

  const handleTransporterNameChange = (
    field: 'name' | 'vehicleNo' | 'shopNo',
    text: string,
  ) => {
    setTransporterFields(prev => ({...prev, [field]: text}));
    const updatedFields = {...transporterFields, [field]: text};
    const combinedName = [
      updatedFields.name,
      updatedFields.vehicleNo,
      updatedFields.shopNo,
    ]
      .filter(part => part)
      .join(' | ');
    setFormData(prev => ({...prev, transporterName: combinedName}));
    if (field === 'name') {
      setValidationErrors(prev => ({
        ...prev,
        transporterName: validateTransporterName(text),
      }));
    }
  };

  const handleQtyChange = (index: number, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    if (isNaN(numValue)) return;
    const updatedItems = [...orderItems];
    const item = updatedItems[index];
    updatedItems[index] = {...item, requestedQty: numValue};
    const qtyError = validateRequestedQty(
      numValue,
      item.netQuantity,
      item.itemId,
    );
    setValidationErrors(prev => ({
      ...prev,
      requestedQty: {...prev.requestedQty, [item.itemId]: qtyError},
    }));
    // Use QUANTITY instead of Quantity for comparison
    if (numValue > item.QUANTITY) {
      setExceededItem(item);
      setQuantityExceedModalVisible(true);
    }
    setOrderItems(updatedItems);
  };

  const handleDeliveryAddressChange = (text: string) => {
    setFormData(prev => ({...prev, deliveryAddress: text}));
  };

  const validateForm = () => {
    const deliveryDateError = validateDeliveryDate(formData.deliveryDate);
    const qtyErrors: Record<number, string> = {};
    let hasQtyError = false;
    orderItems.forEach(item => {
      const error = validateRequestedQty(
        item.requestedQty,
        item.netQuantity,
        item.itemId,
      );
      if (error) {
        qtyErrors[item.itemId] = error;
        hasQtyError = true;
      }
    });
    setValidationErrors(prev => ({
      ...prev,
      deliveryDate: deliveryDateError,
      requestedQty: qtyErrors,
    }));
    return !deliveryDateError && !hasQtyError;
  };

  const showToast = (
    message: string,
    type: 'success' | 'error' = 'success',
  ) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
    toastOpacity.setValue(0);
    toastOffset.setValue(-100);
    Animated.parallel([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(toastOffset, {
        toValue: 20,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(toastOffset, {
          toValue: -100,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => setToastVisible(false));
    }, 2500);
  };

  const handleUpdateOrder = async () => {
    if (!customerID) {
      showToast('Customer ID not found. Please login again.', 'error');
      return;
    }
    if (!Number(customerID)) {
      showToast('Customer ID must be a valid number.', 'error');
      return;
    }
    if (orderItems.some(item => item.requestedQty > item.netQuantity)) {
      showToast(
        'Requested quantity exceeds available stock for some items.',
        'error',
      );
      return;
    }
    if (!validateForm()) {
      showToast('Please fix the errors in the form.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const formattedDeliveryDate = formData.deliveryDate;
      await submitOrderUpdate(formattedDeliveryDate);
    } catch (error: any) {
      let errorMessage = 'Failed to update order';
      if (error.response) {
        const {status, data} = error.response;
        errorMessage = `Error ${status}: ${
          data.message || 'No details provided'
        }`;
        console.log('API error response:', {status, data});
      } else if (error.request) {
        errorMessage = 'No response from server. Check network connection.';
        console.log('No response received:', error.request);
      } else {
        errorMessage = `Error: ${error.message}`;
        console.log('Error setting up request:', error.message);
      }
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const submitOrderUpdate = async (deliveryDate: string) => {
    const combinedTransporterName = [
      transporterFields.name,
      transporterFields.vehicleNo,
      transporterFields.shopNo,
    ]
      .filter(part => part)
      .join(' | ');
    const requestPayload = {
      orderId: Number(order.orderId),
      customerID: Number(customerID),
      deliveryDate,
      transporterName: combinedTransporterName.trim(),
      remarks: formData.remarks.trim(),
      deliveryAddress: formData.deliveryAddress.trim(),
      items: orderItems.map(item => ({
        detailId: Number(item.detailId),
        itemId: Number(item.itemId),
        lotNo: String(item.lotNo),
        availableQty: Number(item.requestedQty),
      })),
    };
    console.log(
      'Submitting order update with payload:',
      JSON.stringify(requestPayload, null, 2),
    );
    try {
      const response = await axios.put(
        API_ENDPOINTS.UPDATE_PENDING_ORDER,
        requestPayload,
        {
          headers: {'Content-Type': 'application/json'},
        },
      );
      console.log('API response:', response.data);
      if (response.data.success) {
        showToast('Order updated successfully!', 'success');
        setTimeout(() => {
          navigation.navigate(NAVIGATION_CONSTANTS.BOTTOM_TAB, {
            screen: NAVIGATION_CONSTANTS.ORDERS,
          });
          setTimeout(() => {
            navigation.navigate(NAVIGATION_CONSTANTS.PENDING_ORDERS, {
              customerID: Number(customerID),
              shouldRefresh: true,
            });
          }, 500);
        }, 1500);
      } else {
        showToast(
          `Error: ${response.data.message || 'Failed to update order'}`,
          'error',
        );
      }
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleNavigateBack}>
            <MaterialIcons name="arrow-back" size={24} color="#0284c7" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Order</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          keyboardShouldPersistTaps="handled">
          <View style={styles.purpleHeaderCard}>
            <View style={styles.purpleHeader}>
              <View style={styles.headerContent}>
                <MaterialIcons name="shopping-bag" size={24} color="#ffffff" />
                <Text style={styles.purpleHeaderText}>
                  Order #{order.orderNo}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Delivery Information</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Delivery Date</Text>
              <TouchableOpacity
                onPress={showDatePicker}
                style={[
                  styles.dateInput,
                  validationErrors.deliveryDate && styles.inputError,
                ]}>
                <MaterialIcons
                  name="event"
                  size={20}
                  color="#6B7280"
                  style={styles.inputIcon}
                />
                <Text style={styles.dateDisplayText}>
                  {formatDisplayDate(selectedDate)}
                </Text>
              </TouchableOpacity>
              {validationErrors.deliveryDate && (
                <Text style={styles.errorText}>
                  {validationErrors.deliveryDate}
                </Text>
              )}
            </View>

            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              date={selectedDate}
              onConfirm={handleConfirm}
              onCancel={hideDatePicker}
              minimumDate={new Date(order.orderDate)}
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              themeVariant="light"
            />

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Transporter Name</Text>
              {(['name', 'vehicleNo', 'shopNo'] as const).map(field => (
                <View
                  key={field}
                  style={[
                    styles.textInput,
                    validationErrors.transporterName && styles.inputError,
                  ]}>
                  <MaterialIcons
                    name={
                      field === 'name'
                        ? 'person'
                        : field === 'vehicleNo'
                        ? 'directions-bus'
                        : 'store'
                    }
                    size={20}
                    color="#6B7280"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={transporterFields[field]}
                    placeholder={
                      field === 'name'
                        ? 'Enter transporter name'
                        : field === 'vehicleNo'
                        ? 'Enter vehicle number'
                        : 'Enter shop number'
                    }
                    onChangeText={text =>
                      handleTransporterNameChange(field, text)
                    }
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              ))}
              {validationErrors.transporterName && (
                <Text style={styles.errorText}>
                  {validationErrors.transporterName}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Delivery Location</Text>
              <View style={styles.textInput}>
                <MaterialIcons
                  name="location-on"
                  size={20}
                  color="#6B7280"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={formData.deliveryAddress}
                  placeholder="Enter delivery address"
                  onChangeText={handleDeliveryAddressChange}
                  placeholderTextColor="#9CA3AF"
                  multiline
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Remarks</Text>
              <View style={styles.textInput}>
                <MaterialIcons
                  name="comment"
                  size={20}
                  color="#6B7280"
                  style={styles.inputIconRemark}
                />
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  value={formData.remarks}
                  placeholder="Enter any remarks"
                  onChangeText={text =>
                    setFormData(prev => ({...prev, remarks: text}))
                  }
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Order Items</Text>
            {orderItems.length === 0 ? (
              <Text style={styles.noItemsText}>No items available</Text>
            ) : (
              orderItems.map((item, index) => (
                <View
                  key={`item-${item.detailId || index}`}
                  style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>
                      {item.itemName || 'Unknown Item'}
                    </Text>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>
                        {item.status || 'N/A'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.itemInfo}>
                    <View style={styles.infoRow}>
                      <MaterialIcons name="label" size={16} color="#F48221" />
                      <Text style={styles.infoTextlot}>
                        Lot No: {item.lotNo || 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <MaterialIcons
                        name="bookmark"
                        size={16}
                        color="#6B7280"
                      />
                      <Text style={styles.infoText}>
                        Item Marks: {item.itemMarks || 'N/A'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.quantityContainer}>
                    <View style={styles.quantityRow}>
                      <Text style={styles.quantityLabel}>
                        Original Quantity:
                      </Text>
                      <Text style={styles.quantityValue}>
                        {item.QUANTITY !== undefined && !isNaN(item.QUANTITY)
                          ? item.QUANTITY
                          : 'N/A'}{' '}
                        {item.unitName || ''}
                      </Text>
                    </View>
                    <View style={styles.quantityRow}>
                      <Text style={styles.quantityLabel}>
                        Net Quantity (Available):
                      </Text>
                      <Text style={styles.quantityValue}>
                        {item.netQuantity !== undefined &&
                        !isNaN(item.netQuantity)
                          ? item.netQuantity
                          : 'N/A'}{' '}
                        {item.unitName || ''}
                      </Text>
                    </View>
                    <View style={styles.quantityInputContainer}>
                      <Text style={styles.quantityLabel}>
                        Ordered Quantity:
                      </Text>
                      <View
                        style={[
                          styles.qtyInputWrapper,
                          validationErrors.requestedQty[item.itemId] &&
                            styles.inputError,
                        ]}>
                        <TextInput
                          style={styles.quantityInput}
                          value={item.requestedQty.toString()}
                          onChangeText={text => handleQtyChange(index, text)}
                          keyboardType="numeric"
                          maxLength={10}
                        />
                      </View>
                      <Text style={styles.quantityUnit}>
                        {item.unitName || ''}
                      </Text>
                    </View>
                    {validationErrors.requestedQty[item.itemId] && (
                      <Text style={styles.errorText}>
                        {validationErrors.requestedQty[item.itemId]}
                      </Text>
                    )}
                    {item.requestedQty > item.QUANTITY && (
                      <View style={styles.warningContainer}>
                        <MaterialIcons
                          name="warning"
                          size={16}
                          color="#f59e0b"
                        />
                        <Text style={styles.warningText}>
                          Ordered quantity exceeds original quantity
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleNavigateBack}
              disabled={isLoading}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, isLoading && styles.disabledButton]}
              onPress={handleUpdateOrder}
              disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <MaterialIcons name="check" size={18} color="#fff" />
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        <Modal
          animationType="fade"
          transparent
          visible={quantityExceedModalVisible}
          onRequestClose={() => setQuantityExceedModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <MaterialIcons name="error-outline" size={28} color="#ef4444" />
                <Text style={styles.modalTitle}>Quantity Exceeds Limit</Text>
              </View>
              <View style={styles.modalBody}>
                <Text style={styles.modalMessage}>
                  The ordered quantity for {exceededItem?.itemName || 'item'} (
                  {exceededItem?.requestedQty || 0}{' '}
                  {exceededItem?.unitName || ''}) exceeds the original quantity
                  of {exceededItem?.QUANTITY || 0}{' '}
                  {exceededItem?.unitName || ''}.
                </Text>
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setQuantityExceedModalVisible(false)}>
                  <Text style={styles.modalCancelText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {toastVisible && (
          <Animated.View
            style={[
              styles.toast,
              {opacity: toastOpacity, transform: [{translateY: toastOffset}]},
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0284c7',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  purpleHeaderCard: {
    backgroundColor: '#0284C7',
    marginVertical: 10,
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
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  formSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    marginHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: 6,
  },
  textInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  inputIconRemark: {
    marginRight: 8,
    marginTop: -35,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  dateDisplayText: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  itemCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#e0f2fe',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0284c7',
  },
  itemInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4b5563',
    marginLeft: 8,
  },
  infoTextlot: {
    fontSize: 14,
    color: '#F48221',
    fontWeight: '500',
    marginLeft: 8,
  },
  quantityContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
    minHeight: 24,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0284c7',
    flex: 1,
    textAlign: 'right',
    paddingLeft: 8,
  },
  quantityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  qtyInputWrapper: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    width: 80,
    backgroundColor: '#fff',
    marginHorizontal: 8,
  },
  quantityInput: {
    padding: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  quantityUnit: {
    fontSize: 14,
    color: '#4b5563',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  warningText: {
    fontSize: 12,
    color: '#b45309',
    marginLeft: 4,
  },
  noItemsText: {
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
    marginVertical: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 30,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#0284c7',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#93c5fd',
  },
  toast: {
    position: 'absolute',
    top: 20,
    right: 20,
    left: 20,
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  successToast: {
    backgroundColor: '#dcfce7',
    borderLeftColor: '#22c55e',
    borderLeftWidth: 4,
  },
  errorToast: {
    backgroundColor: '#fee2e2',
    borderLeftColor: '#ef4444',
    borderLeftWidth: 4,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  toastMessage: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
    color: '#1f2937',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  inputError: {
    borderColor: '#ef4444',
    borderWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    overflow: 'hidden',
    elevation: 5,
  },
  modalHeader: {
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 6,
  },
  modalBody: {
    padding: 16,
  },
  modalMessage: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    fontWeight: '500',
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
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
});

export default EditOrderScreen;
