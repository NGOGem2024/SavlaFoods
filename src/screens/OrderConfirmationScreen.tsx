// import React, {useState} from 'react';
// import {
//   SafeAreaView,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
//   Alert,
//   Platform,
//   ActivityIndicator,
// } from 'react-native';
// import {RouteProp} from '@react-navigation/native';
// import {StackNavigationProp} from '@react-navigation/stack';
// import {MainStackParamList} from '../../src/type/type';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import axios from 'axios';
// import {API_ENDPOINTS} from '../config/api.config';

// interface OrderItem {
//   ITEM_ID: number;
//   ITEM_NAME: string;
//   LOT_NO: string;
//   VAKAL_NO: string;
//   ITEM_MARKS: string;
//   UNIT_NAME: string;
//   AVAILABLE_QTY: number;
//   NET_QUANTITY: number;
//   ORDERED_QUANTITY: number;
//   BatchNo?: string | null;
// }

// interface OrderResponse {
//   success: boolean;
//   message: string;
//   data: {
//     orderId: number;
//     orderNo: string;
//     customerAddressId: number;
//   };
// }

// type OrderConfirmationScreenRouteProp = RouteProp<
//   MainStackParamList,
//   'OrderConfirmationScreen'
// >;
// type OrderConfirmationScreenNavigationProp = StackNavigationProp<
//   MainStackParamList,
//   'OrderConfirmationScreen'
// >;

// interface OrderConfirmationScreenProps {
//   route: OrderConfirmationScreenRouteProp;
//   navigation: OrderConfirmationScreenNavigationProp;
// }

// const OrderConfirmationScreen: React.FC<OrderConfirmationScreenProps> = ({
//   route,
//   navigation,
// }) => {
//   const {
//     orderItems,
//     customerID,
//     userSupervisorId,
//     userMukadamId,
//     stockLotLocationId, // This comes in as a number or string
//     unitId = 3,
//     finYearId = 15,
//   } = route.params;

//   // Local state for order details.
//   const [orderDetails, setOrderDetails] = useState({
//     orderDate: new Date().toISOString().split('T')[0],
//     deliveryDate: new Date().toISOString().split('T')[0],
//     transporterName: '',
//     remarks: '',
//   });

//   // Create a state for the Stock Lot Location ID.
//   // Convert to string if needed so the TextInput receives a string.
//   const [editableStockLotLocationId, setEditableStockLotLocationId] = useState(
//     stockLotLocationId ? stockLotLocationId.toString() : '',
//   );

//   const [isLoading, setIsLoading] = useState(false);

//   const handleSubmitOrder = async () => {
//     if (
//       !orderDetails.deliveryDate ||
//       !orderDetails.transporterName ||
//       !editableStockLotLocationId
//     ) {
//       let errorMessage = 'Please fill in all required fields:';

//       if (!orderDetails.deliveryDate) errorMessage += '\n- Delivery Date';
//       if (!orderDetails.transporterName) errorMessage += '\n- Transporter Name';
//       if (!editableStockLotLocationId)
//         errorMessage += '\n- Stock Lot Location ID';

//       Alert.alert('Missing Fields', errorMessage);
//       return;
//     }

//     setIsLoading(true);
//     try {
//       const orderPayload = {
//         CustomerID: customerID,
//         items: orderItems.map((item: OrderItem) => ({
//           ItemID: item.ITEM_ID,
//           LotNo: item.LOT_NO,
//           Quantity: item.ORDERED_QUANTITY,
//           BatchNo: item.BatchNo === '**null**' ? null : item.BatchNo,
//           ItemMarks: item.ITEM_MARKS || '',
//           VakalNo: item.VAKAL_NO || '',
//         })),
//         orderDate: orderDetails.orderDate,
//         deliveryDate: orderDetails.deliveryDate,
//         transporterName: orderDetails.transporterName,
//         remarks: orderDetails.remarks,
//         userSupervisorId: null,
//         userMukadamId: null,
//         // Use the editable field from state (convert back to number if necessary)
//         stockLotLocationId: editableStockLotLocationId,
//         unitId,
//         finYearId,
//         orderMode: 'APP',
//       };

//       console.log(
//         'Sending order payload:',
//         JSON.stringify(orderPayload, null, 2),
//       );
//       const response = await axios.post<OrderResponse>(
//         API_ENDPOINTS.GET_PLACEORDER_DETAILS,
//         orderPayload,
//         {
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           timeout: 10000, // 10-second timeout
//         },
//       );

//       console.log('Server response:', JSON.stringify(response.data, null, 2));
//       if (!response || !response.data) {
//         throw new Error('No response received from server');
//       }

//       if (response.data.success === true) {
//         const {orderId, orderNo} = response.data.data;

//         if (!orderId || !orderNo) {
//           throw new Error('Missing order details in success response');
//         }

//         const processedItems = orderItems.map(item => ({
//           ...item,
//           FK_ORDER_ID: orderId,
//           FK_ITEM_ID: item.ITEM_ID,
//           STATUS: 'NEW',
//           REMARK: orderDetails.remarks,
//         }));

//         Alert.alert(
//           'Success',
//           `Order ${orderId} placed successfully!`,
//           [
//             {
//               text: 'View Order',
//               onPress: () => {
//                 navigation.navigate('OrderHistoryScreen', {
//                   orderId,
//                   orderNo,
//                   transporterName: orderDetails.transporterName,
//                   deliveryDate: orderDetails.deliveryDate,
//                   orderDate: orderDetails.orderDate,
//                   items: processedItems,
//                 });
//               },
//             },
//             // {
//             //   text: 'Back to Home',
//             //   onPress: () => {
//             //     navigation.reset({
//             //       index: 0,
//             //       routes: [
//             //         {
//             //           name: 'BottomTabNavigator',
//             //           params: {
//             //             screen: 'Home',
//             //           },
//             //         },
//             //       ],
//             //     });
//             //   },
//             // },
//           ],
//           {
//             cancelable: false,
//           },
//         );
//       } else {
//         throw new Error(
//           response.data.message || 'Server returned unsuccessful response',
//         );
//       }
//     } catch (error: any) {
//       console.error('Error submitting order:', error.message);
//       Alert.alert('Error', error.message || 'Failed to place order');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <SafeAreaView style={styles.safeArea}>
//       <View style={styles.mainContainer}>
//         <ScrollView style={styles.scrollContainer}>
//           <Text style={styles.headerText}>Order Confirmation</Text>

//           <View style={styles.cardContainer}>
//             <View style={styles.field}>
//               <Text style={styles.fieldLabel}>Order Date</Text>
//               <TextInput
//                 style={[styles.fieldInput, styles.disabledInput]}
//                 value={orderDetails.orderDate}
//                 editable={false}
//               />
//             </View>

//             <View style={styles.field}>
//               <Text style={styles.fieldLabel}>
//                 Delivery Date
//                 <Text style={{color: 'red'}}> *</Text>
//               </Text>
//               <TextInput
//                 style={styles.fieldInput}
//                 value={orderDetails.deliveryDate}
//                 onChangeText={text =>
//                   setOrderDetails(prev => ({...prev, deliveryDate: text}))
//                 }
//                 placeholder="YYYY-MM-DD"
//               />
//             </View>

//             <View style={styles.field}>
//               <Text style={styles.fieldLabel}>
//                 Transporter Name
//                 <Text style={{color: 'red'}}> *</Text>
//               </Text>
//               <TextInput
//                 style={styles.fieldInput}
//                 value={orderDetails.transporterName}
//                 onChangeText={text =>
//                   setOrderDetails(prev => ({...prev, transporterName: text}))
//                 }
//                 placeholder="Enter transporter name"
//               />
//             </View>

//             {/* Editable Stock Lot Location ID Field */}
//             <View style={styles.field}>
//               <Text style={styles.fieldLabel}>
//                 Stock Lot Location ID
//                 <Text style={{color: 'red'}}> *</Text>
//               </Text>
//               <TextInput
//                 style={styles.fieldInput}
//                 value={editableStockLotLocationId}
//                 onChangeText={setEditableStockLotLocationId}
//                 placeholder="Enter Stock Lot Location ID"
//               />
//             </View>

//             <View style={styles.field}>
//               <Text style={styles.fieldLabel}>Remarks</Text>
//               <TextInput
//                 style={[styles.fieldInput, styles.remarksInput]}
//                 value={orderDetails.remarks}
//                 onChangeText={text =>
//                   setOrderDetails(prev => ({...prev, remarks: text}))
//                 }
//                 placeholder="Add any special instructions"
//                 multiline
//                 numberOfLines={3}
//               />
//             </View>
//           </View>

//           <View style={styles.itemsSummary}>
//             <Text style={styles.summaryTitle}>Order Summary</Text>
//             {orderItems.map((item: OrderItem, index: number) => (
//               <View key={index} style={styles.itemRow}>
//                 <Text style={styles.itemName}>
//                   {item.ITEM_NAME || `Item ${item.ITEM_ID}`}
//                 </Text>
//                 <Text style={styles.itemQuantity}>
//                   Qty: {item.ORDERED_QUANTITY}
//                 </Text>
//               </View>
//             ))}
//           </View>
//         </ScrollView>

//         <View style={styles.footerContainer}>
//           <TouchableOpacity
//             style={[styles.submitButton, isLoading && styles.disabledButton]}
//             onPress={handleSubmitOrder}
//             disabled={isLoading}>
//             {isLoading ? (
//               <View style={styles.loadingContainer}>
//                 <ActivityIndicator color="#FFFFFF" />
//                 <Text style={styles.buttonText}>Processing...</Text>
//               </View>
//             ) : (
//               <>
//                 <Text style={styles.buttonText}>Confirm Order</Text>
//                 <Ionicons
//                   name="checkmark-circle-outline"
//                   size={24}
//                   style={{color: '#FFFFFF'}}
//                 />
//               </>
//             )}
//           </TouchableOpacity>
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   mainContainer: {
//     flex: 1,
//     backgroundColor: '#F5F7FA',
//   },
//   scrollContainer: {
//     flex: 1,
//     padding: 16,
//   },
//   headerText: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#2C3E50',
//     marginBottom: 24,
//     textAlign: 'center',
//   },
//   cardContainer: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 16,
//     ...Platform.select({
//       ios: {
//         shadowColor: '#000',
//         shadowOffset: {width: 0, height: 2},
//         shadowOpacity: 0.1,
//         shadowRadius: 4,
//       },
//       android: {
//         elevation: 4,
//       },
//     }),
//   },
//   field: {
//     marginBottom: 16,
//   },
//   fieldLabel: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#34495E',
//     marginBottom: 8,
//   },
//   fieldInput: {
//     borderWidth: 1,
//     borderColor: '#E2E8F0',
//     borderRadius: 8,
//     padding: 12,
//     fontSize: 16,
//     color: '#2C3E50',
//     backgroundColor: '#F8FAFC',
//   },
//   disabledInput: {
//     backgroundColor: '#EDF2F7',
//     color: '#718096',
//   },
//   remarksInput: {
//     height: 100,
//     textAlignVertical: 'top',
//   },
//   itemsSummary: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 16,
//   },
//   summaryTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#2C3E50',
//     marginBottom: 12,
//   },
//   itemRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingVertical: 8,
//     borderBottomWidth: 1,
//     borderBottomColor: '#E2E8F0',
//   },
//   itemName: {
//     fontSize: 14,
//     color: '#2C3E50',
//     flex: 1,
//   },
//   itemQuantity: {
//     fontSize: 14,
//     color: '#2C3E50',
//     fontWeight: '500',
//   },
//   footerContainer: {
//     backgroundColor: '#fff',
//     padding: 16,
//     borderTopWidth: 1,
//     borderTopColor: '#E2E8F0',
//   },
//   submitButton: {
//     backgroundColor: '#4CAF50',
//     borderRadius: 8,
//     padding: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: 8,
//   },
//   disabledButton: {
//     backgroundColor: '#A0AEC0',
//   },
//   buttonText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   loadingContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
// });

// export default OrderConfirmationScreen;

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
} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {MainStackParamList} from '../../src/type/type';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import {API_ENDPOINTS} from '../config/api.config';

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
    userMukadamId,
    stockLotLocationId,
    unitId = 3,
    finYearId = 15,
  } = route.params;

  // Get today's date in YYYY-MM-DD format
  const today = new Date();
  const formattedToday = today.toISOString().split('T')[0];

  // Local state for order details
  const [orderDetails, setOrderDetails] = useState({
    orderDate: formattedToday,
    deliveryDate: formattedToday,
    CUST_DELIVERY_ADD: '',
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

  // Handle labor charge selection
  const toggleLaborChargeSelection = (id: number) => {
    setLaborCharges(
      laborCharges.map(charge =>
        charge.id === id ? {...charge, selected: !charge.selected} : charge,
      ),
    );
  };

  // Handle applied quantity change
  const updateAppliedQuantity = (id: number, value: string) => {
    setLaborCharges(
      laborCharges.map(charge =>
        charge.id === id ? {...charge, appliedQuantity: value} : charge,
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

  // Handle date change with input validation format
  const handleDeliveryDateChange = (text: string) => {
    // Allow user to type any date format
    setOrderDetails(prev => ({...prev, deliveryDate: text}));
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

  const handleSubmitOrder = async () => {
    // Enhanced validation checks
    let hasError = false;
    let errorMessage = 'Please fix the following issues:';

    if (!transporterDetails.name.trim()) {
      errorMessage += '\n- Transporter Name is required';
      hasError = true;
    }

    // Date validation
    if (!isValidDateFormat(orderDetails.deliveryDate)) {
      errorMessage += '\n- Delivery date must be in YYYY-MM-DD format';
      hasError = true;
    } else if (!isValidDate(orderDetails.deliveryDate)) {
      errorMessage += '\n- Invalid delivery date';
      hasError = true;
    } else if (!isDeliveryDateValid(orderDetails.deliveryDate)) {
      errorMessage += '\n- Delivery date cannot be in the past';
      hasError = true;
    }

    if (hasError) {
      Alert.alert('Validation Error', errorMessage);
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
        CUST_DELIVERY_ADD: orderDetails.CUST_DELIVERY_ADD,
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

        Alert.alert(
          'Success',
          `Order ${orderNo} placed successfully!`,
          [
            {
              text: 'View Order',
              onPress: () => {
                navigation.navigate('OrderHistoryScreen', {
                  orderId,
                  orderNo,
                  transporterName: formattedTransporterName,
                  deliveryDate: orderDetails.deliveryDate,
                  deliveryAddress: orderDetails.CUST_DELIVERY_ADD,
                  orderDate: orderDetails.orderDate,
                  items: processedItems,
                  laborCharges: selectedLabor,
                });
              },
            },
          ],
          {
            cancelable: false,
          },
        );
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.mainContainer}>
        <ScrollView style={styles.scrollContainer}>
          <Text style={styles.headerText}>Order Confirmation</Text>

          <View style={styles.cardContainer}>
            {/* Transporter Details Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Transporter Details</Text>
            </View>

            {/* Transporter Name */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>
                Transporter Name
                <Text style={{color: 'red'}}> *</Text>
              </Text>
              <TextInput
                style={styles.fieldInput}
                value={transporterDetails.name}
                onChangeText={text =>
                  setTransporterDetails(prev => ({...prev, name: text}))
                }
                placeholder="Enter transporter name"
              />
            </View>

            {/* Vehicle Number */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Vehicle No (Optional)</Text>
              <TextInput
                style={styles.fieldInput}
                value={transporterDetails.vehicleNo}
                onChangeText={text =>
                  setTransporterDetails(prev => ({...prev, vehicleNo: text}))
                }
                placeholder="Enter vehicle number"
              />
            </View>

            {/* Shop Number */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Shop No (Optional)</Text>
              <TextInput
                style={styles.fieldInput}
                value={transporterDetails.shopNo}
                onChangeText={text =>
                  setTransporterDetails(prev => ({...prev, shopNo: text}))
                }
                placeholder="Enter shop number"
              />
            </View>

            <View style={styles.divider} />

            {/* Order Date */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Order Date</Text>
              <TextInput
                style={[styles.fieldInput, styles.disabledInput]}
                value={orderDetails.orderDate}
                editable={false}
              />
            </View>

            {/* Delivery Date with manual input */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>
                Delivery Date
                <Text style={{color: 'red'}}> *</Text>
              </Text>
              <TextInput
                style={styles.fieldInput}
                value={orderDetails.deliveryDate}
                onChangeText={handleDeliveryDateChange}
                placeholder="YYYY-MM-DD"
              />
              <Text style={styles.helperText}>
                Format: YYYY-MM-DD (e.g., 2025-03-25)
              </Text>
            </View>

            {/* Labor Heading with Edit button */}
            <View style={styles.laborHeadingContainer}>
              <Text style={styles.fieldLabel}>Labour</Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsLaborModalVisible(true)}>
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>

            {/* Display selected labor charges if any */}
            {orderDetails.laborCharges ? (
              <View style={styles.selectedLaborContainer}>
                <Text style={styles.selectedLaborText}>
                  {orderDetails.laborCharges}
                </Text>
              </View>
            ) : null}

            {/* Delivery Location Field - renamed to match backend */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Delivery Location</Text>
              <TextInput
                style={styles.fieldInput}
                value={orderDetails.CUST_DELIVERY_ADD}
                onChangeText={text =>
                  setOrderDetails(prev => ({...prev, CUST_DELIVERY_ADD: text}))
                }
                placeholder="Enter delivery location"
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Remarks Field */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Remarks</Text>
              <TextInput
                style={[styles.fieldInput, styles.remarksInput]}
                value={orderDetails.remarks}
                onChangeText={text =>
                  setOrderDetails(prev => ({...prev, remarks: text}))
                }
                placeholder="Add any special instructions"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Order Summary */}
          <View style={styles.itemsSummary}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            {orderItems.map((item: OrderItem, index: number) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemName}>
                  {item.ITEM_NAME || `Item ${item.ITEM_ID}`}
                </Text>
                <Text style={styles.itemQuantity}>
                  Qty: {item.ORDERED_QUANTITY}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Footer with Submit Button */}
        <View style={styles.footerContainer}>
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

        <Modal
          visible={isLaborModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsLaborModalVisible(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Instruction Dropbox</Text>
                <TouchableOpacity
                  onPress={() => setIsLaborModalVisible(false)}
                  style={styles.closeModalButton}>
                  <Text style={styles.closeButtonX}>✕</Text>
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
                    <View style={[{width: '15%', alignItems: 'center'}]}>
                      <TouchableOpacity
                        onPress={() => toggleLaborChargeSelection(charge.id)}>
                        <View
                          style={[
                            styles.checkbox,
                            charge.selected && styles.checkboxSelected,
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
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 24,
    textAlign: 'center',
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  helperText: {
    color: '#718096',
    fontSize: 12,
    marginTop: 4,
  },
  sectionHeader: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34495E',
    marginBottom: 8,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2C3E50',
    backgroundColor: '#F8FAFC',
  },
  disabledInput: {
    backgroundColor: '#EDF2F7',
    color: '#718096',
  },

  remarksInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    width: '90%',
    maxWidth: 500,
    maxHeight: height * 0.8,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
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
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  closeModalButton: {
    padding: 5,
  },
  closeButtonX: {
    fontSize: 20,
    color: '#333',
    fontWeight: '500',
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
    paddingVertical: 10,
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
  laborHeadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  selectedLaborContainer: {
    backgroundColor: '#F0F5FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#6B46C1',
  },
  selectedLaborText: {
    fontSize: 14,
    color: '#4A5568',
  },
  editButton: {
    backgroundColor: '#6B46C1',
    borderRadius: 6,
    paddingVertical: 7,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  itemsSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 100, // Extra space for the footer
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  itemName: {
    fontSize: 14,
    color: '#2C3E50',
    flex: 1,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
  },
  footerContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
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
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
});

export default OrderConfirmationScreen;
