//with labour
import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
  Dimensions,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  InteractionManager,
} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {MainStackParamList} from '../../src/type/type';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import {API_ENDPOINTS} from '../config/api.config';
import LinearGradient from 'react-native-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import PendingOrdersScreen from './PendingOrdersScreen';

const {width, height} = Dimensions.get('window');

interface OrderItem {
  ITEM_ID: number;
  ITEM_NAME: string;
  LOT_NO: string;
  VAKAL_NO: string;
  ITEM_MARKS: string;
  UNIT_NAME: string;
  AVAILABLE_QTY: number;
  NET_QUANTITY: number;
  ORDERED_QUANTITY: number;
  BatchNo?: string | null;
}

interface LaborCharge {
  id: number;
  type: string;
  appliedQuantity: string;
  quantity: string;
  selected: boolean;
}

interface OrderResponse {
  success: boolean;
  message: string;
  data: {
    orderId: number;
    orderNo: string;
    customerAddressId?: number;
    customerName?: string;
    orderDate?: string;
    deliveryDate?: string;
    itemCount?: number;
    transporterName?: string;
    deliveryAddress?: string; // Add this field
  };
}

interface TransporterDetails {
  name: string;
  vehicleNo: string;
  shopNo: string;
}

type OrderConfirmationScreenRouteProp = RouteProp<
  MainStackParamList,
  'OrderConfirmationScreen'
>;
type OrderConfirmationScreenNavigationProp = StackNavigationProp<
  MainStackParamList,
  'OrderConfirmationScreen'
>;

interface OrderConfirmationScreenProps {
  route: OrderConfirmationScreenRouteProp;
  navigation: OrderConfirmationScreenNavigationProp;
}

const OrderConfirmationScreen: React.FC<OrderConfirmationScreenProps> = ({
  route,
  navigation,
}) => {
  const {
    orderItems,
    customerID,
    userSupervisorId,
    deliveryAddress,
    userMukadamId,
    stockLotLocationId,
    unitId = 3,
    finYearId = 15,
  } = route.params;

  // Get today's date in YYYY-MM-DD format
  const today = new Date();
  const formattedToday = today.toISOString().split('T')[0];
  
  // Reference for picker timer
  const datePickerTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Local state for order details
  const [orderDetails, setOrderDetails] = useState({
    orderDate: formattedToday,
    deliveryDate: formattedToday,
    deliveryAddress: '',
    // deliveryLocation: '',
    remarks: '',
    laborCharges: '',
  });

  // Transporter details with subfields
  const [transporterDetails, setTransporterDetails] =
    useState<TransporterDetails>({
      name: '',
      vehicleNo: '',
      shopNo: '',
    });

  // State for loading
  const [isLoading, setIsLoading] = useState(false);

  // State for labor charges modal
  const [isLaborModalVisible, setIsLaborModalVisible] = useState(false);

  // Add state for transporter name validation
  const [transporterNameError, setTransporterNameError] = useState('');

  // Labor charges options
  const [laborCharges, setLaborCharges] = useState<LaborCharge[]>([
    {
      id: 1,
      type: 'LOADING(L)',
      appliedQuantity: '1',
      quantity: '1',
      selected: true,
    },
    {
      id: 2,
      type: 'WEIGHT(W)',
      appliedQuantity: '1',
      quantity: '1',
      selected: false,
    },
  ]);

  // Add these to state declarations at the top of the component
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [successData, setSuccessData] = useState({
    orderId: 0,
    orderNo: '',
    processedItems: [] as any[],
    formattedTransporterName: '',
    selectedLabor: [] as any[],
  });

  // Add new state for date picker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Add this near other state declarations
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Add new state for the resubmission alert modal
  const [showResubmissionModal, setShowResubmissionModal] = useState(false);

  // Add this useEffect hook after other useEffect hooks
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Reset form state when screen comes into focus
      if (isOrderPlaced) {
        setOrderDetails({
          orderDate: formattedToday,
          deliveryDate: formattedToday,
          deliveryAddress: '',
          remarks: '',
          laborCharges: '',
        });
        setTransporterDetails({
          name: '',
          vehicleNo: '',
          shopNo: '',
        });
        setLaborCharges([
          {
            id: 1,
            type: 'LOADING(L)',
            appliedQuantity: '1',
            quantity: '1',
            selected: true,
          },
          {
            id: 2,
            type: 'UNLOADING (UL)',
            appliedQuantity: '1',
            quantity: '1',
            selected: false,
          },
          {
            id: 3,
            type: 'WEIGHT(W)',
            appliedQuantity: '1',
            quantity: '1',
            selected: false,
          },
        ]);
        setIsOrderPlaced(false);
        setSuccessData({
          orderId: 0,
          orderNo: '',
          processedItems: [],
          formattedTransporterName: '',
          selectedLabor: [],
        });
      }
    });

    return unsubscribe;
  }, [navigation, isOrderPlaced, formattedToday]);

  // Add keyboard listeners to track keyboard visibility
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Handle labor charge selection
  const toggleLaborChargeSelection = (id: number) => {
    // Prevent unticking the first row (LOADING)
    if (id === 1) {
      return;
    }
    setLaborCharges(
      laborCharges.map(charge =>
        charge.id === id ? {...charge, selected: !charge.selected} : charge,
      ),
    );
  };

  // Handle applied quantity change
  const updateAppliedQuantity = (id: number, value: string) => {
    // Only allow numeric values (no special characters, letters, etc.)
    const numericOnly = value.replace(/[^0-9]/g, '');
    
    setLaborCharges(
      laborCharges.map(charge =>
        charge.id === id ? {...charge, appliedQuantity: numericOnly} : charge,
      ),
    );
  };

  // Calculate selected labor charges for display
  const getSelectedLaborCharges = () => {
    const selected = laborCharges.filter(charge => charge.selected);
    if (selected.length === 0) return '';
    return selected
      .map(charge => `${charge.type}: ${charge.appliedQuantity}`)
      .join(', ');
  };

  // Format the transporter name with subfields for database
  const getFormattedTransporterName = () => {
    let formattedName = transporterDetails.name.trim();

    if (transporterDetails.vehicleNo) {
      formattedName += ` | Vehicle: ${transporterDetails.vehicleNo.trim()}`;
    }

    if (transporterDetails.shopNo) {
      formattedName += ` | Shop: ${transporterDetails.shopNo.trim()}`;
    }

    return formattedName;
  };

  // Update the date field handler to handle keyboard properly
  const handleDateFieldTap = () => {
    // Only dismiss keyboard for this specific interaction
    // This won't affect the keyboard behavior for other interactions
    Keyboard.dismiss();
    
    // Show date picker after ensuring keyboard is dismissed
    setTimeout(() => {
      setShowDatePicker(true);
    }, 10);
  };

  // Handle date picker
  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || new Date();
    setShowDatePicker(Platform.OS === 'ios');
    setSelectedDate(currentDate);

    // Format the date as YYYY-MM-DD
    const formattedDate = currentDate.toISOString().split('T')[0];
    setOrderDetails(prev => ({...prev, deliveryDate: formattedDate}));
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Function to validate date format (YYYY-MM-DD)
  const isValidDateFormat = (dateString: string) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(dateString);
  };

  // Function to check if date is valid
  const isValidDate = (dateString: string) => {
    if (!isValidDateFormat(dateString)) return false;

    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };

  // Function to check if delivery date is not in the past
  const isDeliveryDateValid = (dateString: string) => {
    if (!isValidDate(dateString)) return false;

    const deliveryDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to beginning of day for comparison

    return deliveryDate >= today;
  };

  // Modified function to handle transporter name change with validation
  const handleTransporterNameChange = (text: string) => {
    // Only allow letters, spaces, and some common punctuation
    const letterOnlyRegex = /^[a-zA-Z\s.',-]*$/;
    
    // Update the state regardless, but set an error if invalid
    setTransporterDetails(prev => ({...prev, name: text}));
    
    if (!letterOnlyRegex.test(text)) {
      setTransporterNameError('Only letters, spaces, and common punctuation allowed');
    } else {
      setTransporterNameError('');
    }
  };

  const handleSubmitOrder = async () => {
    // Prevent resubmission if order is already placed
    if (isOrderPlaced) {
      setShowResubmissionModal(true);
      return;
    }

    // Enhanced validation checks
    let hasError = false;
    let errorMessage = 'Please fix the following issues:';

    if (!transporterDetails.name.trim()) {
      errorMessage += '\nTransporter Name is required';
      hasError = true;
    } else if (!/^[a-zA-Z\s.',-]*$/.test(transporterDetails.name)) {
      errorMessage += '\nTransporter Name can only contain letters, spaces, and common punctuation';
      hasError = true;
    }

    // Delivery Location validation
    if (!orderDetails.deliveryAddress.trim()) {
      errorMessage += '\nDelivery Location is required';
      hasError = true;
    }

    // Date validation
    if (!isValidDateFormat(orderDetails.deliveryDate)) {
      errorMessage += '\nDelivery date must be in YYYY-MM-DD format';
      hasError = true;
    } else if (!isValidDate(orderDetails.deliveryDate)) {
      errorMessage += '\nInvalid delivery date';
      hasError = true;
    } else if (!isDeliveryDateValid(orderDetails.deliveryDate)) {
      errorMessage += '\nDelivery date cannot be in the past';
      hasError = true;
    }

    if (hasError) {
      setValidationMessage(errorMessage);
      setShowValidationModal(true);
      return;
    }

    setIsLoading(true);
    try {
      // Get selected labor charges
      const selectedLabor = laborCharges
        .filter(charge => charge.selected)
        .map(charge => ({
          type: charge.type,
          quantity: charge.appliedQuantity,
        }));

      // Format transporter name with subfields
      const formattedTransporterName = getFormattedTransporterName();

      const orderPayload = {
        CustomerID: customerID,
        items: orderItems.map((item: OrderItem) => ({
          ItemID: item.ITEM_ID,
          LotNo: item.LOT_NO,
          Quantity: item.ORDERED_QUANTITY,
          BatchNo: item.BatchNo === '**null**' ? null : item.BatchNo,
          ItemMarks: item.ITEM_MARKS || '',
          VakalNo: item.VAKAL_NO || '',
        })),
        orderDate: orderDetails.orderDate,
        deliveryDate: orderDetails.deliveryDate,
        transporterName: formattedTransporterName,
        deliveryAddress: orderDetails.deliveryAddress,
        remarks: orderDetails.remarks,
        userSupervisorId,
        userMukadamId,
        stockLotLocationId,
        unitId,
        finYearId,
        orderMode: 'APP',
        laborCharges: selectedLabor,
      };

      console.log(
        'Sending order payload:',
        JSON.stringify(orderPayload, null, 2),
      );
      const response = await axios.post<OrderResponse>(
        API_ENDPOINTS.GET_PLACEORDER_DETAILS,
        orderPayload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      console.log('Server response:', JSON.stringify(response.data, null, 2));
      if (!response || !response.data) {
        throw new Error('No response received from server');
      }

      if (response.data.success === true) {
        const {orderId, orderNo} = response.data.data;

        if (!orderId || !orderNo) {
          throw new Error('Missing order details in success response');
        }

        const processedItems = orderItems.map(item => ({
          ...item,
          FK_ORDER_ID: orderId,
          FK_ITEM_ID: item.ITEM_ID,
          STATUS: 'NEW',
          REMARK: orderDetails.remarks,
        }));

        setSuccessData({
          orderId,
          orderNo,
          processedItems,
          formattedTransporterName: getFormattedTransporterName(),
          selectedLabor,
        });
        setIsOrderPlaced(true); // Set order as placed
        setShowSuccessModal(true);
      } else {
        throw new Error(
          response.data.message || 'Server returned unsuccessful response',
        );
      }
    } catch (error: any) {
      console.error('Error submitting order:', error.message);
      Alert.alert('Error', error.message || 'Failed to place order');
    } finally {
      setIsLoading(false);
    }
  };

  const proceedWithLaborCharges = () => {
    setIsLaborModalVisible(false);
    setOrderDetails(prev => ({
      ...prev,
      laborCharges: getSelectedLaborCharges(),
    }));
  };

  useEffect(() => {
    // Clean up any timers on unmount
    return () => {
      if (datePickerTimerRef.current) {
        clearTimeout(datePickerTimerRef.current);
        datePickerTimerRef.current = null;
      }
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.mainContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <MaterialIcons
              name="arrow-back"
              size={24}
              style={{color: '#4CAF50'}}
            />
          </TouchableOpacity>
          <Text style={styles.headerText}>Order Confirmation</Text>
          <View style={styles.headerSpacer}></View>
        </View>
        
        <ScrollView 
          style={styles.scrollContainer}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none">
          <View style={styles.cardContainer}>
            {/* Transporter Details Section */}
            <View style={styles.sectionHeader}>
              <MaterialIcons name="local-shipping" size={24} color="#2C3E50" />
              <Text style={styles.sectionTitle}>Transporter Details</Text>
            </View>

            {/* Transporter Name */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>
                Transporter Name
                <Text style={{color: 'red'}}> *</Text>
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#718096"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.fieldInput, styles.inputWithIcon]}
                  value={transporterDetails.name}
                  onChangeText={handleTransporterNameChange}
                  // placeholder="Enter transporter name"
                />
              </View>
              {transporterNameError ? (
                <Text style={styles.errorText}>{transporterNameError}</Text>
              ) : null}
            </View>

            {/* Vehicle Number */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Vehicle No (Optional)</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons
                  name="directions-car"
                  size={20}
                  color="#718096"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.fieldInput, styles.inputWithIcon]}
                  value={transporterDetails.vehicleNo}
                  onChangeText={text =>
                    setTransporterDetails(prev => ({...prev, vehicleNo: text}))
                  }
                  // placeholder="Enter vehicle number"
                />
              </View>
            </View>

            {/* Shop Number */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Shop No (Optional)</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons
                  name="store"
                  size={20}
                  color="#718096"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.fieldInput, styles.inputWithIcon]}
                  value={transporterDetails.shopNo}
                  onChangeText={text =>
                    setTransporterDetails(prev => ({...prev, shopNo: text}))
                  }
                  // placeholder="Enter shop number"
                />
              </View>
            </View>

            <View style={styles.divider} />

            {/* Order Date */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Order Date</Text>
              <View style={styles.dateInputContainer}>
                <View style={styles.dateInputContent}>
                  <MaterialIcons
                    name="event"
                    size={20}
                    color="#718096"
                    style={styles.inputIcon}
                  />
                  <Text style={styles.dateText}>
                    {formatDate(orderDetails.orderDate)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Delivery Date */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>
                Delivery Date
                <Text style={{color: 'red'}}> *</Text>
              </Text>
              <TouchableWithoutFeedback onPress={handleDateFieldTap}>
                <View style={[styles.dateInputContainer, { position: 'relative' }]}>
                  <View style={styles.dateInputContent}>
                    <MaterialIcons
                      name="event-available"
                      size={20}
                      color="#718096"
                      style={styles.inputIcon}
                    />
                    <Text style={styles.dateText}>
                      {formatDate(orderDetails.deliveryDate)}
                    </Text>
                  </View>
                </View>
              </TouchableWithoutFeedback>
              {showDatePicker && Platform.OS === 'android' && (
                <DateTimePicker
                  testID="datePickerAndroid"
                  value={selectedDate}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                  minimumDate={new Date()}
                />
              )}
            </View>

            {/* Delivery Location Field */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>
                Delivery Location
                <Text style={{color: 'red'}}> *</Text>
              </Text>
              <View style={styles.inputContainer}>
                <MaterialIcons
                  name="location-on"
                  size={20}
                  color="#718096"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.fieldInput, styles.inputWithIcon]}
                  value={orderDetails.deliveryAddress}
                  onChangeText={text =>
                    setOrderDetails(prev => ({
                      ...prev,
                      deliveryAddress: text,
                    }))
                  }
                  // placeholder="Enter delivery location"
                  multiline
                  numberOfLines={2}
                />
              </View>
            </View>

            {/* Remarks Field */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Remarks</Text>
              <View style={[styles.inputContainer, styles.remarksContainer]}>
                <View style={styles.remarksIconContainer}>
                  <MaterialIcons name="notes" size={20} color="#718096" />
                </View>
                <TextInput
                  style={[
                    styles.fieldInput,
                    styles.inputWithIcon,
                    styles.remarksInput,
                  ]}
                  value={orderDetails.remarks}
                  onChangeText={text =>
                    setOrderDetails(prev => ({...prev, remarks: text}))
                  }
                  // placeholder="Add any special instructions"
                  multiline
                  numberOfLines={100}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>

          {/* Order Summary */}
          <View style={styles.itemsSummary}>
            <View style={styles.summaryHeader}>
              <MaterialIcons name="receipt-long" size={24} color="#2C3E50" />
              <Text style={styles.summaryTitle}>Order Summary</Text>
            </View>
            {orderItems.map((item: OrderItem, index: number) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <MaterialIcons name="inventory" size={20} color="#4A5568" />
                  <Text style={styles.itemName}>
                    {item.ITEM_NAME || `Item ${item.ITEM_ID}`}
                  </Text>
                </View>
                <View style={styles.quantityBadge}>
                  <Text style={styles.itemQuantity}>
                    {item.ORDERED_QUANTITY}
                  </Text>
                </View>
              </View>
            ))}
          </View>
          
          {/* Submit Button */}
          <View style={styles.submitButtonContainer}>
            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.disabledButton]}
              onPress={handleSubmitOrder}
              disabled={isLoading}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#FFFFFF" />
                  <Text style={styles.buttonText}>Processing...</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.buttonText}>Confirm Order</Text>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={24}
                    style={{color: '#FFFFFF'}}
                  />
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Labor Modal */}
        {/* <Modal
          visible={isLaborModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsLaborModalVisible(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <MaterialIcons name="engineering" size={24} color="#2C3E50" />
                  <Text style={styles.modalTitle}>Handling</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setIsLaborModalVisible(false)}
                  style={styles.closeModalButton}>
                  <Ionicons name="close" size={24} color="#2C3E50" />
                </TouchableOpacity>
              </View>

              <View style={styles.tableHeader}>
                <Text
                  style={[
                    styles.tableHeaderCell,
                    {width: '10%', textAlign: 'center'},
                  ]}>
                  #
                </Text>
                <Text
                  style={[
                    styles.tableHeaderCell,
                    {width: '15%', textAlign: 'center'},
                  ]}></Text>
                <Text style={[styles.tableHeaderCell, {width: '30%'}]}>
                  Type
                </Text>
                <Text style={[styles.tableHeaderCell, {width: '25%'}]}>
                  Applied Quantity
                </Text>
                <Text style={[styles.tableHeaderCell, {width: '20%'}]}>
                  Quantity
                </Text>
              </View>

              <ScrollView style={styles.laborItemsContainer}>
                {laborCharges.map((charge, index) => (
                  <View
                    key={charge.id}
                    style={[
                      styles.laborItem,
                      index % 2 === 0 ? styles.evenRow : null,
                    ]}>
                    <Text
                      style={[
                        styles.laborItemText,
                        {width: '10%', textAlign: 'center'},
                      ]}>
                      {charge.id}
                    </Text>
                    <View style={{width: '15%', alignItems: 'center'}}>
                      <TouchableOpacity
                        onPress={() => toggleLaborChargeSelection(charge.id)}
                        disabled={charge.id === 1}>
                        <View
                          style={[
                            styles.checkbox,
                            charge.selected && styles.checkboxSelected,
                            charge.id === 1 && styles.checkboxDisabled,
                          ]}>
                          {charge.selected && (
                            <Text style={styles.checkmark}>✓</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.laborItemText, {width: '30%'}]}>
                      {charge.type}
                    </Text>
                    <View style={{width: '25%', paddingHorizontal: 5}}>
                      <TextInput
                        style={[
                          styles.quantityInput,
                          !charge.selected && styles.disabledQuantityInput,
                        ]}
                        value={charge.appliedQuantity}
                        onChangeText={text =>
                          updateAppliedQuantity(charge.id, text)
                        }
                        keyboardType="numeric"
                        editable={charge.selected}
                      />
                    </View>
                    <Text
                      style={[
                        styles.laborItemText,
                        {width: '20%', textAlign: 'center'},
                      ]}>
                      {charge.quantity}
                    </Text>
                  </View>
                ))}
              </ScrollView>

              <View style={styles.modalDivider} />

              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={styles.webModalButton}
                  onPress={proceedWithLaborCharges}>
                  <Text style={styles.webModalButtonText}>Proceed</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.webModalButton, styles.webCloseButton]}
                  onPress={() => setIsLaborModalVisible(false)}>
                  <Text style={styles.webCloseButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal> */}

        <Modal
          visible={showDatePicker && Platform.OS === 'ios'}
          transparent={true}
          animationType="slide">
          <View style={styles.iosDatePickerModal}>
            <View style={styles.iosDatePickerContainer}>
              <View style={styles.iosDatePickerHeader}>
                <Text style={styles.iosDatePickerTitle}>
                  Select Delivery Date
                </Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.iosDatePickerDoneBtn}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                testID="datePickerIOS"
                value={selectedDate}
                mode="date"
                display="spinner"
                onChange={(event, date) => {
                  if (date) setSelectedDate(date);
                }}
                minimumDate={new Date()}
                style={styles.iosDatePicker}
                textColor="#000000"
              />
              <TouchableOpacity
                style={styles.iosDatePickerConfirmBtn}
                onPress={() => {
                  onDateChange({}, selectedDate);
                  setShowDatePicker(false);
                }}>
                <Text style={styles.iosDatePickerConfirmText}>
                  Confirm Date
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Success Modal */}
        <Modal
          visible={showSuccessModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowSuccessModal(false)}>
          <View style={styles.successModalOverlay}>
            <View style={styles.successModalContent}>
              <View style={styles.successIconContainer}>
                <LinearGradient
                  colors={['#4CAF50', '#45a049']}
                  style={styles.successIconCircle}>
                  <Ionicons name="checkmark-sharp" size={40} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <View style={styles.successTextContainer}>
                <Text style={styles.successEmoji}>🎉</Text>
                <Text style={styles.successTitle}>
                  Order Placed Successfully!
                </Text>
                <View style={styles.orderNumberContainer}>
                  <View style={styles.orderNumberRow}>
                    <Text style={styles.orderNoLabel}>Order No:</Text>
                    <Text style={styles.orderNoValue}>
                      {successData.orderNo}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.successButtonsContainer}>
                <TouchableOpacity
                  style={styles.viewOrderButton}
                  onPress={() => {
                    setShowSuccessModal(false);
                    // First navigate to OrdersScreen
                    navigation.navigate('BottomTabNavigator', {
                      screen: 'Orders',
                      customerID: customerID,
                      params: {
                        screen: 'OrdersHome',
                        params: {
                          shouldRefresh: true,
                          customerID: customerID,
                        },
                      },
                    });
                    // Then navigate to PendingOrdersScreen
                    setTimeout(() => {
                      navigation.navigate('PendingOrdersScreen', {
                        orderId: successData.orderId,
                        orderNo: successData.orderNo,
                        transporterName: successData.formattedTransporterName,
                        deliveryDate: orderDetails.deliveryDate,
                        deliveryAddress: orderDetails.deliveryAddress,
                        orderDate: orderDetails.orderDate,
                        items: successData.processedItems,
                        customerID: customerID,
                      });
                    }, 100);
                  }}>
                  <LinearGradient
                    colors={['#6B46C1', '#553C9A']}
                    style={styles.viewOrderGradient}>
                    <MaterialIcons
                      name="visibility"
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={styles.viewOrderText}>View Order</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Validation Error Modal */}
        <Modal
          visible={showValidationModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowValidationModal(false)}>
          <View style={styles.validationModalOverlay}>
            <View style={styles.validationModalContent}>
              <LinearGradient
                colors={['#F8FAFC', '#EDF2F7']}
                style={styles.validationModalHeader}>
                <MaterialIcons name="info-outline" size={30} color="#dc3545" />
                <Text style={styles.validationHeaderText}>Please Review</Text>
              </LinearGradient>

              <View style={styles.validationBodyContainer}>
                {validationMessage.split('\n').map((message, index) =>
                  index === 0 ? (
                    <Text key={index} style={styles.validationMainMessage}>
                      {message}
                    </Text>
                  ) : (
                    <View key={index} style={styles.validationItemRow}>
                      <MaterialIcons
                        name="error-outline"
                        size={18}
                        color="#dc3545"
                      />
                      <Text style={styles.validationItemText}>{message}</Text>
                    </View>
                  ),
                )}
              </View>

              <TouchableOpacity
                style={styles.validationActionButton}
                onPress={() => setShowValidationModal(false)}>
                <Text style={styles.validationActionButtonText}>Got It!</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Resubmission Alert Modal */}
        <Modal
          visible={showResubmissionModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowResubmissionModal(false)}>
          <View style={styles.resubmissionModalOverlay}>
            <View style={styles.resubmissionModalContent}>
              <View style={styles.resubmissionIconContainer}>
                <LinearGradient
                  colors={['#FF6B6B', '#FF5252']}
                  style={styles.resubmissionIconCircle}>
                  <MaterialIcons name="warning" size={40} color="#FFFFFF" />
                </LinearGradient>
              </View>
              <View style={styles.resubmissionTextContainer}>
                <Text style={styles.resubmissionTitle}>Already Submitted!</Text>
                <Text style={styles.resubmissionMessage}>
                  This order has already been placed successfully. Please start
                  a new order.
                </Text>
              </View>
              <View style={styles.resubmissionButtonsContainer}>
                <TouchableOpacity
                  style={styles.resubmissionButton}
                  onPress={() => {
                    setShowResubmissionModal(false);
                    navigation.goBack();
                  }}>
                  <LinearGradient
                    colors={['#4CAF50', '#45a049']}
                    style={styles.resubmissionButtonGradient}>
                    <MaterialIcons
                      name="arrow-back"
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={styles.resubmissionButtonText}>Go Back</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFFAFA',
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F7',
    width: '100%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8F7FF',
  },
  headerSpacer: {
    width: 40,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginLeft: 8,
  },
  field: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34495E',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputIcon: {
    padding: 12,
  },
  inputWithIcon: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingLeft: 0,
  },
  fieldInput: {
    padding: 12,
    fontSize: 16,
    color: '#2C3E50',
    borderRadius: 12,
  },
  disabledInput: {
    backgroundColor: '#EDF2F7',
    color: '#718096',
  },
  remarksInput: {
    flex: 1,
    height: 120,
    paddingTop: 12,
    paddingBottom: 1,
    paddingRight: 12,
    fontSize: 15,
    color: '#2D3748',
    textAlignVertical: 'top',
  },
  helperText: {
    color: '#718096',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 12,
  },
  // iOS date picker modal styles
  iosDatePickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  iosDatePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: -2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  iosDatePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  iosDatePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
  },
  iosDatePickerDoneBtn: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  iosDatePicker: {
    height: 200,
    marginTop: 10,
  },
  iosDatePickerConfirmBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 5,
  },
  iosDatePickerConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Fix modal styles for iOS
  // Update existing modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxWidth: 500,
    maxHeight: Platform.OS === 'ios' ? height * 0.7 : height * 0.8,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 20,
  },
  laborHeadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  laborTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedLaborContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F5FF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#6B46C1',
  },
  selectedLaborText: {
    fontSize: 14,
    color: '#4A5568',
    marginLeft: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6B46C1',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 6,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  itemsSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginLeft: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    color: '#2C3E50',
    marginLeft: 8,
    flex: 1,
  },
  quantityBadge: {
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
  },
  submitButtonContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#A0AEC0',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginLeft: 8,
  },
  closeModalButton: {
    padding: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tableHeaderCell: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  laborItemsContainer: {
    maxHeight: 250,
  },
  laborItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  evenRow: {
    backgroundColor: '#F7FAFC',
  },
  laborItemText: {
    fontSize: 14,
    color: '#333',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CBD5E0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxSelected: {
    backgroundColor: '#6B46C1',
    borderColor: '#3B82F6',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: '#CBD5E0',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    width: '100%',
    fontSize: 14,
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
  },
  disabledQuantityInput: {
    backgroundColor: '#F1F5F9',
    color: '#94A3B8',
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 20,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    gap: 10,
  },
  webModalButton: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    paddingVertical: Platform.OS === 'ios' ? 10 : 12,
    paddingHorizontal: 20,
    backgroundColor: '#6B46C1',
    color: '#FFFFFF',
    minWidth: 100,
    alignItems: 'center',
  },
  webModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  webCloseButton: {
    borderColor: '#E2E8F0',
    backgroundColor: '#ccc',
  },
  webCloseButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  dateInputContainer: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 12,
  },
  dateInputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    color: '#2C3E50',
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    color: '#2C3E50',
    marginLeft: 1,
  },
  remarksContainer: {
    minHeight: 120,
    padding: 0,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 12,
  },
  remarksIconContainer: {
    paddingTop: 12,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  checkboxDisabled: {
    backgroundColor: '#6B46C1',
    borderColor: '#3B82F6',
    opacity: 0.8,
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  successIconContainer: {
    marginBottom: Platform.OS === 'ios' ? 12 : 16,
    ...Platform.select({
      ios: {
        shadowColor: '#4CAF50',
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  successIconCircle: {
    width: Platform.OS === 'ios' ? 54 : 58,
    height: Platform.OS === 'ios' ? 54 : 58,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTextContainer: {
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 12 : 16,
    width: '100%',
  },
  successEmoji: {
    fontSize: Platform.OS === 'ios' ? 28 : 32,
    marginBottom: Platform.OS === 'ios' ? 12 : 16,
  },
  successTitle: {
    fontSize: Platform.OS === 'ios' ? 17 : 18,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 12,
    textAlign: 'center',
    width: '100%',
  },
  orderNumberContainer: {
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    padding: 10,
    width: '100%',
    alignItems: 'center',
  },
  orderNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderNoLabel: {
    fontSize: 14,
    color: '#718096',
    marginRight: 8,
  },
  orderNoValue: {
    fontSize: 16,
    color: '#6B46C1',
    fontWeight: '600',
  },
  successButtonsContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  viewOrderButton: {
    width: '80%',
    height: Platform.OS === 'ios' ? 52 : 52, // Explicit height
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: '#6B46C1', // Fallback color
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#6B46C1',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  viewOrderGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  viewOrderText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  // Validation modal styles
  validationModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  validationModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    overflow: 'hidden',
    alignItems: 'center',
    minHeight: 180,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  validationModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: -5,
    padding: Platform.OS === 'ios' ? 3 : 25,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginTop: 10,
    width: '100%',
  },
  validationHeaderText: {
    fontSize: Platform.OS === 'ios' ? 16 : 16,
    fontWeight: 'bold',
    color: '#dc3545',
    marginLeft: 3,
    // marginTop: -12,
  },
  validationBodyContainer: {
    width: '89%',
    paddingHorizontal: 17,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'ios' ? 14 : 18,
    paddingBottom: Platform.OS === 'ios' ? 14 : 18,
  },
  validationMainMessage: {
    fontSize: Platform.OS === 'ios' ? 14 : 15,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: Platform.OS === 'ios' ? 10 : 12,
    textAlign: 'center',
  },
  validationItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 6 : 8,
    backgroundColor: '#EFF6FF',
    padding: Platform.OS === 'ios' ? 8 : 10,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#dc3545',
  },
  validationItemText: {
    fontSize: Platform.OS === 'ios' ? 12 : 13,
    color: '#4B5563',
    marginLeft: 8,
    flex: 1,
    lineHeight: Platform.OS === 'ios' ? 16 : 18,
  },
  validationActionButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingVertical: Platform.OS === 'ios' ? 10 : 10,
    paddingHorizontal: 20,
    // paddingVertical: 10,
    width: '40%',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 10 : 16,
    marginTop: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#3B82F6',
        shadowOffset: {width: 0, height: 5},
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  validationActionButtonText: {
    color: '#FFFFFF',
    fontSize: Platform.OS === 'ios' ? 15 : 15,
    fontWeight: '600',
  },
  resubmissionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  resubmissionModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    maxHeight: Platform.OS === 'ios' ? height * 0.7 : undefined,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 8},
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  resubmissionIconContainer: {
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#FF5252',
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  resubmissionTextContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  resubmissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF5252',
    marginBottom: 16,
    textAlign: 'center',
  },
  resubmissionMessage: {
    fontSize: 16,
    color: '#4A5568',
    textAlign: 'center',
    lineHeight: 24,
  },
  resubmissionButtonsContainer: {
    width: '100%',
  },
  resubmissionButton: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#4CAF50',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  resubmissionIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resubmissionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  resubmissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 12,
  },
});

export default OrderConfirmationScreen;
