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
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
  NavigationProp,
  useNavigation,
  RouteProp,
} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import axios from 'axios';
import {useCustomer} from '../contexts/DisplayNameContext';
import {ParamListBase} from '@react-navigation/native';
import {API_ENDPOINTS} from '../config/api.config';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

interface OrderItem {
  detailId: number;
  itemId: number;
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
}

type EditOrderScreenProps = {
  route: RouteProp<{params: {order: Order}}, 'params'>;
  navigation: StackNavigationProp<any>;
};

// Add navigation constants at the top for better maintainability
const NAVIGATION_CONSTANTS = {
  BOTTOM_TAB: 'BottomTabNavigator',
  ORDERS: 'Orders',
  ORDERS_HOME: 'OrdersHome',
  PENDING_ORDERS: 'PendingOrdersScreen',
};

const EditOrderScreen = ({route, navigation}: EditOrderScreenProps) => {
  // const navigation = useNavigation();
  const {customerID} = useCustomer();
  const {order} = route.params;
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    transporterName: order.transporterName || '',
    deliveryDate: order.deliveryDate || new Date().toISOString(),
    remarks: order.remarks || '',
    deliveryAddress: order.deliveryAddress || '',
  });

  // Add validation state to track errors
  const [validationErrors, setValidationErrors] = useState({
    transporterName: '',
    deliveryDate: '',
    requestedQty: {} as Record<number, string>,
  });
  // In useState initialization for selectedDate
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (order.deliveryDate) {
      try {
        // Handle ISO format dates (with T)
        if (order.deliveryDate.includes('T')) {
          return new Date(order.deliveryDate);
        }

        // Handle YYYY-MM-DD format
        const [year, month, day] = order.deliveryDate.split('-');
        if (year && month && day) {
          return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
      } catch (e) {
        console.error('Error parsing date:', e);
      }
    }
    return new Date(); // Default to today if parsing fails
  });

  const [orderItems, setOrderItems] = useState<OrderItem[]>([...order.items]);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState(
    'Order updated successfully!',
  );
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const toastOpacity = React.useRef(new Animated.Value(0)).current;
  const toastOffset = React.useRef(new Animated.Value(300)).current;

  // Add new state variables for the separate transporter fields
  const [transporterFields, setTransporterFields] = useState({
    name: '',
    vehicleNo: '',
    shopNo: '',
  });

  // Initialize the transporter fields from the original format
  useEffect(() => {
    if (order.transporterName) {
      const parts = order.transporterName.split('|').map(part => part.trim());
      setTransporterFields({
        name: parts[0] || '',
        vehicleNo: parts.length > 1 ? parts[1] : '',
        shopNo: parts.length > 2 ? parts[2] : '',
      });
    }
  }, [order.transporterName]);

  // Helper function to check if there are unsaved changes
  const checkForUnsavedChanges = () => {
    return (
      formData.transporterName !== order.transporterName ||
      formData.deliveryDate !== order.deliveryDate ||
      formData.remarks !== order.remarks ||
      formData.deliveryAddress !== order.deliveryAddress ||
      JSON.stringify(orderItems) !== JSON.stringify(order.items)
    );
  };

  // Helper function to handle navigation with unsaved changes
  const handleNavigateBack = () => {
    const hasChanges = checkForUnsavedChanges();

    if (hasChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          {
            text: 'Stay',
            style: 'cancel',
          },
          {
            text: 'Discard Changes',
            onPress: () => {
              // Navigate back to the previous screen
              navigation.goBack();
            },
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

    // Store the selected date in state
    setSelectedDate(date);

    // Format date for API (YYYY-MM-DD)
    const formattedDate = `${date.getFullYear()}-${String(
      date.getMonth() + 1,
    ).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    // Update form data with the formatted date
    setFormData(prev => ({...prev, deliveryDate: formattedDate}));

    // Clear any validation errors for delivery date
    setValidationErrors(prev => ({...prev, deliveryDate: ''}));
  };

  // Format date for display (doesn't change the date value)
  const formatDisplayDate = (date: Date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return 'Select Date';
    }

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

    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    return `${month} ${day}, ${year}`;
  };
  // Format date for display (doesn't change date)
  const formatDateForDisplay = (dateString: string) => {
    try {
      if (!dateString) return '';

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

      // For already formatted dates like "Month Day, Year"
      if (dateString.includes(',')) {
        return dateString;
      }

      // Last resort fallback
      return dateString;
    } catch (error) {
      console.log('Error formatting date:', error, dateString);
      return dateString;
    }
  };

  // Format date for API (YYYY-MM-DD)
  const formatDateForApi = (dateString: string) => {
    try {
      let date: Date;

      // Handle different date formats
      if (dateString.includes('T')) {
        // ISO format
        date = new Date(dateString);
      } else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // YYYY-MM-DD format
        const [year, month, day] = dateString.split('-');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        // Month Day, Year format or other
        date = new Date(dateString);
      }

      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return dateString;
      }

      // Format as YYYY-MM-DD
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        '0',
      )}-${String(date.getDate()).padStart(2, '0')}`;
    } catch (error) {
      console.error('Error formatting date for API:', error, dateString);
      return dateString;
    }
  };

  // Add validation for date format
  const isValidDateFormat = (dateString: string) => {
    // Support both YYYY-MM-DD and Month Day, Year formats
    return (
      dateString.match(/^\d{4}-\d{2}-\d{2}$/) ||
      dateString.match(/^[A-Za-z]+ \d{1,2}, \d{4}$/) ||
      (dateString.includes('T') &&
        dateString.split('T')[0].match(/^\d{4}-\d{2}-\d{2}$/))
    );
  };

  // Modify validateTransporterName function to not accept empty names
  const validateTransporterName = (name: string) => {
    if (!name.trim()) {
      return 'Transporter name is required';
    }
    return '';
  };

  // Update handleTransporterNameChange to include validation
  const handleTransporterNameChange = (
    field: 'name' | 'vehicleNo' | 'shopNo',
    text: string,
  ) => {
    setTransporterFields(prev => ({
      ...prev,
      [field]: text,
    }));

    // Construct the combined transporter name for the form data
    const updatedFields = {...transporterFields, [field]: text};
    const combinedName = `${updatedFields.name}${
      updatedFields.vehicleNo ? ' | ' + updatedFields.vehicleNo : ''
    }${updatedFields.shopNo ? ' | ' + updatedFields.shopNo : ''}`;

    setFormData(prev => ({
      ...prev,
      transporterName: combinedName,
    }));

    // Add validation for transporter name field only
    if (field === 'name') {
      const error = validateTransporterName(text);
      setValidationErrors(prev => ({...prev, transporterName: error}));
    }
  };

  // Modified validation for delivery date to ensure it's not before the order date
  const validateDeliveryDate = (dateString: string) => {
    if (!dateString.trim()) {
      return 'Delivery date is required';
    }

    let deliveryDate: Date;
    let orderDate: Date;

    try {
      // For ISO or YYYY-MM-DD format
      if (dateString.includes('T') || dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        deliveryDate = new Date(dateString);
      } else {
        // For formatted dates like "May 10, 2025"
        deliveryDate = new Date(dateString);
      }

      // Set hours to 0 for date comparison
      deliveryDate.setHours(0, 0, 0, 0);

      // Parse order date
      if (order.orderDate.includes('T')) {
        orderDate = new Date(order.orderDate);
      } else {
        const [year, month, day] = order.orderDate.split('-');
        orderDate = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
        );
      }

      orderDate.setHours(0, 0, 0, 0);

      // Check if dates are valid
      if (isNaN(deliveryDate.getTime()) || isNaN(orderDate.getTime())) {
        return 'Invalid date format';
      }

      // Check if delivery date is before order date
      if (deliveryDate < orderDate) {
        return 'Delivery date cannot be before order date';
      }

      return '';
    } catch (error) {
      console.error('Date validation error:', error);
      return 'Invalid date format';
    }
  };

  // Validate requested quantity
  const validateRequestedQty = (
    qty: number,
    availableQty: number,
    itemId: number,
  ) => {
    if (qty < 0) {
      return 'Quantity must be greater than zero';
    }

    // Warning for exceeding available quantity is already shown in UI
    // This validation is for required fields and number format

    return '';
  };

  const handleQtyChange = (index: number, value: string) => {
    // Don't convert to number immediately as this prevents clearing the field
    // Store the direct text input value
    const updatedItems = [...orderItems];
    const item = updatedItems[index];

    // Update the requested quantity with the exact text value the user entered
    const numValue = value === '' ? 0 : parseFloat(value);
    updatedItems[index] = {
      ...updatedItems[index],
      requestedQty: numValue, // Convert to number for storage, empty = 0
    };

    // Validate the quantity
    const qtyError = validateRequestedQty(
      numValue,
      item.availableQty,
      item.itemId,
    );
    setValidationErrors(prev => ({
      ...prev,
      requestedQty: {
        ...prev.requestedQty,
        [item.itemId]: qtyError,
      },
    }));

    setOrderItems(updatedItems);
  };

  // Handle delivery date change with validation
  const handleDeliveryDateChange = (text: string) => {
    setFormData({...formData, deliveryDate: text});
    const error = validateDeliveryDate(text);
    setValidationErrors(prev => ({...prev, deliveryDate: error}));
  };

  // Handle delivery address change without validation
  const handleDeliveryAddressChange = (text: string) => {
    setFormData({...formData, deliveryAddress: text});
    // Removed validation for address
  };

  // Validate all form fields
  const validateForm = () => {
    // Remove transporter validation
    const deliveryDateError = validateDeliveryDate(formData.deliveryDate);

    // Validate all items
    const qtyErrors: Record<number, string> = {};
    let hasQtyError = false;

    orderItems.forEach(item => {
      const error = validateRequestedQty(
        item.requestedQty,
        item.availableQty,
        item.itemId,
      );
      if (error) {
        qtyErrors[item.itemId] = error;
        hasQtyError = true;
      }
    });

    // Update validation errors state
    setValidationErrors({
      transporterName: '', // Always empty now
      deliveryDate: deliveryDateError,
      requestedQty: qtyErrors,
    });

    // Check if there are any errors
    return !(deliveryDateError || hasQtyError);
  };

  // Initial validation on component mount
  useEffect(() => {
    // No need to validate transporter name
    handleDeliveryDateChange(formData.deliveryDate);

    // Validate all quantities
    orderItems.forEach((item, index) => {
      handleQtyChange(index, item.requestedQty.toString());
    });
  }, []);

  const showToast = (
    message: string,
    type: 'success' | 'error' = 'success',
  ) => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);

    // Reset animation values
    toastOpacity.setValue(0);
    toastOffset.setValue(-100); // Start from above the screen

    // Animate toast down from top
    Animated.parallel([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(toastOffset, {
        toValue: 40, // Final position from top
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Hide toast after 2.5 seconds
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(toastOffset, {
          toValue: -100, // Move back above screen
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setToastVisible(false);
      });
    }, 2500);
  };

  const handleUpdateOrder = async () => {
    if (!customerID) {
      showToast('Customer ID not found. Please login again.', 'error');
      return;
    }

    // Check if any requested quantity exceeds available quantity
    const exceedsAvailable = orderItems.some(
      item => item.requestedQty > item.availableQty,
    );

    if (exceedsAvailable) {
      Alert.alert(
        'Validation Failed',
        'Requested quantity exceeds available quantity for some items. Please adjust them before saving.',
      );
      return;
    }

    // Validate all form fields
    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }

    setIsLoading(true);

    try {
      // Format the delivery date for API
      const formattedDeliveryDate = formatDateForApi(formData.deliveryDate);

      // Proceed with the update since there are no exceeded quantities
      await submitOrderUpdate(formattedDeliveryDate);
    } catch (error: any) {
      console.error('Error updating order:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Unknown error occurred';
      showToast(`Error: ${errorMessage}`, 'error');
      setIsLoading(false);
    }
  };

  // Modify the submitOrderUpdate function to ensure the transporter name is correctly formatted
  const submitOrderUpdate = async (formattedDeliveryDate: string) => {
    try {
      // Format the combined transporter name
      const combinedTransporterName = `${transporterFields.name}${
        transporterFields.vehicleNo ? ' | ' + transporterFields.vehicleNo : ''
      }${transporterFields.shopNo ? ' | ' + transporterFields.shopNo : ''}`;

      // Prepare the request payload according to the API requirements
      const requestPayload = {
        orderId: order.orderId,
        customer_id: customerID,
        deliveryDate: formattedDeliveryDate,
        transporterName: combinedTransporterName.trim(),
        remarks: formData.remarks.trim(),
        deliveryAddress: formData.deliveryAddress.trim(),
        items: orderItems.map(item => ({
          detailId: item.detailId,
          requestedQty: item.requestedQty,
        })),
      };

      // Call the update pending order API
      const response = await axios.put(
        API_ENDPOINTS.UPDATE_PENDING_ORDER,
        requestPayload,
        {
          params: {
            customer_id: customerID,
          },
        },
      );

      const result = response.data;

      if (result.success) {
        // Successfully updated the order
        showToast('Order updated successfully!', 'success');

        // Wait for toast to show before navigating
        setTimeout(() => {
          // Navigation approach 1: Navigate to the OrdersScreen first
          navigation.navigate(NAVIGATION_CONSTANTS.BOTTOM_TAB, {
            screen: NAVIGATION_CONSTANTS.ORDERS,
          });

          // Then after a short delay, navigate to PendingOrdersScreen (correct screen name)
          setTimeout(() => {
            navigation.navigate('PendingOrdersScreen', {
              customerID: customerID,
              shouldRefresh: true,
            });
          }, 500);
        }, 1500);
      } else {
        // API returned an error
        showToast(`Error: ${result.message}`, 'error');
      }
    } catch (error: any) {
      console.error('Error submitting order update:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Unknown error occurred';
      showToast(`Error: ${errorMessage}`, 'error');
    } finally {
      setIsLoading(false);
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
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none">
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
            {/* Delivery Date Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Delivery Date</Text>
              <TouchableOpacity
                onPress={showDatePicker}
                style={[
                  styles.dateInput,
                  validationErrors.deliveryDate ? styles.inputError : null,
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
            {/* Add the DateTimePickerModal component */}

            <DateTimePickerModal
              isVisible={isDatePickerVisible}
              mode="date"
              date={selectedDate}
              onConfirm={handleConfirm}
              onCancel={hideDatePicker}
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              themeVariant="light"
              isDarkModeEnabled={false}
              minimumDate={new Date(order.orderDate)} // Prevent selecting dates before order date
              // customConfirmButtonIOS={() => null} // Remove default confirm button
              customCancelButtonIOS={() => null} // Remove default cancel button
              customHeaderIOS={() => (
                <View style={styles.pickerHeader}>
                  <TouchableOpacity
                    onPress={hideDatePicker}
                    style={styles.closeIconButton}>
                    <MaterialIcons name="close" size={24} color="#6B7280" />
                  </TouchableOpacity>
                  <Text style={styles.pickerHeaderTitle}>Select Date</Text>
                </View>
              )}
            />
            {/* Transporter Fields - Modified to have three separate inputs */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Transporter Name</Text>

              {/* Transporter Name Field */}
              <View
                style={[
                  styles.textInput,
                  styles.transporterInput,
                  validationErrors.transporterName ? styles.inputError : null,
                ]}>
                <MaterialIcons
                  name="person"
                  size={20}
                  color="#6B7280"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={transporterFields.name}
                  placeholder="Enter transporter name"
                  onChangeText={text =>
                    handleTransporterNameChange('name', text)
                  }
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Vehicle Number Field */}
              <View
                style={[
                  styles.textInput,
                  styles.transporterInput,
                  validationErrors.transporterName ? styles.inputError : null,
                ]}>
                <MaterialIcons
                  name="directions-bus"
                  size={20}
                  color="#6B7280"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={transporterFields.vehicleNo}
                  placeholder="Enter vehicle number"
                  onChangeText={text =>
                    handleTransporterNameChange('vehicleNo', text)
                  }
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Shop Number Field */}
              <View
                style={[
                  styles.textInput,
                  styles.transporterInput,
                  validationErrors.transporterName ? styles.inputError : null,
                ]}>
                <MaterialIcons
                  name="store"
                  size={20}
                  color="#6B7280"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={transporterFields.shopNo}
                  placeholder="Enter shop number"
                  onChangeText={text =>
                    handleTransporterNameChange('shopNo', text)
                  }
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {validationErrors.transporterName ? (
                <Text style={styles.errorText}>
                  {validationErrors.transporterName}
                </Text>
              ) : null}
            </View>
            {/* Delivery Address Field - Removed validation */}
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
            {/* Remarks Field */}
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
                    setFormData({...formData, remarks: text})
                  }
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>
          </View>

          {/* Order Items Section */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Order Items</Text>

            {orderItems.map((item, index) => (
              <View
                key={`item-${item.detailId || index}`}
                style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{item.itemName}</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{item.status}</Text>
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
                    <MaterialIcons name="bookmark" size={16} color="#6B7280" />
                    <Text style={styles.infoText}>
                      Item Marks: {item.itemMarks || 'N/A'}
                    </Text>
                  </View>
                </View>

                <View style={styles.quantityContainer}>
                  <View style={styles.quantityRow}>
                    <Text style={styles.quantityLabel}>
                      Available Quantity:
                    </Text>
                    <Text style={styles.quantityValue}>
                      {item.availableQty}
                    </Text>
                  </View>

                  <View style={styles.quantityInputContainer}>
                    <Text style={styles.quantityLabel}>
                      Requested Quantity:{' '}
                    </Text>
                    <View
                      style={[
                        styles.qtyInputWrapper,
                        validationErrors.requestedQty[item.itemId]
                          ? styles.inputError
                          : null,
                      ]}>
                      <TextInput
                        style={styles.quantityInput}
                        value={item.requestedQty.toString()}
                        onChangeText={text => handleQtyChange(index, text)}
                        keyboardType="numeric"
                        maxLength={10}
                      />
                    </View>
                  </View>

                  {validationErrors.requestedQty[item.itemId] ? (
                    <Text style={styles.errorText}>
                      {validationErrors.requestedQty[item.itemId]}
                    </Text>
                  ) : null}
                </View>

                {/* Show warning if requested qty > available qty */}
                {item.requestedQty > item.availableQty && (
                  <View style={styles.warningContainer}>
                    <MaterialIcons name="warning" size={16} color="#f59e0b" />
                    <Text style={styles.warningText}>
                      Requested quantity exceeds available quantity
                    </Text>
                  </View>
                )}
              </View>
            ))}
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
      </KeyboardAvoidingView>

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
    // padding: 16,
  },
  orderHeaderCard: {
    backgroundColor: '#0284c7',
    borderRadius: 12,
    padding: 10,
    // marginBottom: 20,
    marginBottom: 10,
  },
  orderHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dateDisplayText: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },

  orderHeaderText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  formSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  statusBadge: {
    // backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
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
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginHorizontal: 30,
    alignItems: 'center',
  },
  quantityInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qtyInputWrapper: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    width: 80,
    backgroundColor: '#fff',
  },
  quantityInput: {
    padding: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    padding: 8,
    borderRadius: 6,
    marginTop: 12,
  },
  warningText: {
    fontSize: 12,
    color: '#b45309',
    marginLeft: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    width: '98%',
  },
  cancelButton: {
    flex: 1,
    // backgroundColor: '#f3f4f6',
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 14,
    marginRight: 3,
    alignItems: 'center',
    marginLeft: 8,
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
    marginLeft: 8,
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
    top: 40, // Adjust this value based on your header height
    right: 20,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    width: '80%', // Set a max width for better appearance
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
    paddingVertical: 14,
  },
  toastMessage: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
    color: '#1f2937',
  },
  requiredAsterisk: {
    color: '#ef4444',
    fontWeight: '700',
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

  pickerCancelButton: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButton: {
    color: '#0284c7',
    fontSize: 16,
    fontWeight: '600',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeIconButton: {
    padding: 4,
  },
  pickerHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  pickerConfirmButton: {
    color: '#0284c7',
    fontSize: 16,
    fontWeight: '600',
  },
  transporterInput: {
    marginBottom: 8,
  },
});

export default EditOrderScreen;
