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
import {NavigationProp, useNavigation, RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import axios from 'axios';
import {useCustomer} from '../contexts/DisplayNameContext';
import {ParamListBase} from '@react-navigation/native';
import {API_ENDPOINTS} from '../config/api.config';

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
 PENDING_ORDERS: 'PendingOrdersScreen'
};

const EditOrderScreen = ({route, navigation}: EditOrderScreenProps) => {
 // const navigation = useNavigation();
 const {customerID} = useCustomer();
 const {order} = route.params;

 const [isLoading, setIsLoading] = useState(false);
 const [formData, setFormData] = useState({
 transporterName: order.transporterName || '',
 deliveryDate: order.deliveryDate || '',
 remarks: order.remarks || '',
 deliveryAddress: order.deliveryAddress || '',
 });

 const [orderItems, setOrderItems] = useState<OrderItem[]>([...order.items]);
 const [toastVisible, setToastVisible] = useState(false);
 const [toastMessage, setToastMessage] = useState(
 'Order updated successfully!',
 );
 const [toastType, setToastType] = useState<'success' | 'error'>('success');
 const toastOpacity = React.useRef(new Animated.Value(0)).current;
 const toastOffset = React.useRef(new Animated.Value(300)).current;

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
       ]
     );
   } else {
     navigation.goBack();
   }
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
       'January', 'February', 'March', 'April', 'May', 'June',
       'July', 'August', 'September', 'October', 'November', 'December'
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
 if (!dateString) return '';

 // First, check if it's already in YYYY-MM-DD format
 if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
 return dateString;
 }

 // For dates in "Month Day, Year" format (from the UI)
 if (dateString.includes(',')) {
   const parts = dateString.split(' ');
   if (parts.length === 3) {
     const monthNames = [
       'January', 'February', 'March', 'April', 'May', 'June',
       'July', 'August', 'September', 'October', 'November', 'December'
     ];
     const day = parseInt(parts[1].replace(',', ''));
     const month = monthNames.indexOf(parts[0]) + 1;
     const year = parseInt(parts[2]);

     // Format directly to YYYY-MM-DD without creating Date object
     return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
   }
 }

 // For other date formats, manually extract and format
 if (dateString.includes('T')) {
   const [datePart] = dateString.split('T');
   return datePart;
 }

 // Last resort - parse with Date object but avoid timezone issues
 const [month, day, year] = new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
   year: 'numeric',
   month: '2-digit',
   day: '2-digit',
 }).split('/');

 // Convert from MM/DD/YYYY to YYYY-MM-DD
 return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
 } catch (error) {
 console.log('Error formatting date for API:', error, dateString);
 return dateString;
 }
 };

 const handleQtyChange = (index: number, value: string) => {
 const numericValue = parseFloat(value);
 if (isNaN(numericValue)) return;

 const updatedItems = [...orderItems];
 updatedItems[index] = {
 ...updatedItems[index],
 requestedQty: numericValue,
 };
 setOrderItems(updatedItems);
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

 const handleUpdateOrder = async () => {
   if (!customerID) {
     showToast('Customer ID not found. Please login again.', 'error');
     return;
   }

   setIsLoading(true);

   try {
     // Format the delivery date for API
     const formattedDeliveryDate = formatDateForApi(formData.deliveryDate);

     // Validate form data before making API call
     if (!formattedDeliveryDate) {
       showToast('Please enter a valid delivery date', 'error');
       return;
     }

     if (!formData.transporterName.trim()) {
       showToast('Please enter transporter name', 'error');
       return;
     }

     // Prepare the request payload according to the API requirements
     const requestPayload = {
       orderId: order.orderId,
       customer_id: customerID,
       deliveryDate: formattedDeliveryDate,
       transporterName: formData.transporterName.trim(),
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
       }
     );

     const result = response.data;

     if (result.success) {
       // Successfully updated the order
       showToast('Order updated successfully!', 'success');
       
       // Wait for toast to show before navigating
       setTimeout(() => {
         // Navigation approach 1: Navigate to the OrdersScreen first
         navigation.navigate(NAVIGATION_CONSTANTS.BOTTOM_TAB, {
           screen: NAVIGATION_CONSTANTS.ORDERS
         });
         
         // Then after a short delay, navigate to PendingOrdersScreen (correct screen name)
         setTimeout(() => {
           navigation.navigate('PendingOrdersScreen', {
             customerID: customerID,
             shouldRefresh: true
           });
         }, 500);
       }, 1500);
     } else {
       // API returned an error
       showToast(`Error: ${result.message}`, 'error');
     }
   } catch (error: any) {
     console.error('Error updating order:', error);
     const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
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
 <MaterialIcons name="arrow-back" size={24} color="#111827" />
 </TouchableOpacity>
 <Text style={styles.headerTitle}>Edit Order</Text>
 <View style={styles.placeholder} />
 </View>

 <ScrollView style={styles.scrollView}>
 <View style={styles.orderHeaderCard}>
 <View style={styles.orderHeaderContent}>
 <MaterialIcons name="shopping-bag" size={24} color="#7c3aed" />
 <Text style={styles.orderHeaderText}>Order #{order.orderNo}</Text>
 </View>
 </View>

 <View style={styles.formSection}>
 <Text style={styles.sectionTitle}>Delivery Information</Text>

 {/* Delivery Date Field */}
 <View style={styles.inputGroup}>
 <Text style={styles.inputLabel}>Delivery Date</Text>
 <View style={styles.dateInput}>
 <MaterialIcons
 name="event"
 size={20}
 color="#6B7280"
 style={styles.inputIcon}
 />
 <TextInput
 style={styles.input}
 value={
 formData.deliveryDate
 ? formatDateForDisplay(formData.deliveryDate)
 : ''
 }
 placeholder="Enter delivery date"
 onChangeText={text =>
 setFormData({...formData, deliveryDate: text})
 }
 placeholderTextColor="#9CA3AF"
 />
 </View>
 </View>

 {/* Transporter Field */}
 <View style={styles.inputGroup}>
 <Text style={styles.inputLabel}>Transporter</Text>
 <View style={styles.textInput}>
 <MaterialIcons
 name="directions-bus"
 size={20}
 color="#6B7280"
 style={styles.inputIcon}
 />
 <TextInput
 style={styles.input}
 value={formData.transporterName}
 placeholder="Enter transporter name"
 onChangeText={text =>
 setFormData({...formData, transporterName: text})
 }
 placeholderTextColor="#9CA3AF"
 />
 </View>
 </View>

 {/* Delivery Address Field */}
 <View style={styles.inputGroup}>
 <Text style={styles.inputLabel}>Delivery Address</Text>
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
 onChangeText={text =>
 setFormData({...formData, deliveryAddress: text})
 }
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
 style={styles.inputIcon}
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
 <MaterialIcons name="label" size={16} color="#f97316" />
 <Text style={styles.infoText}>
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
 Requested Quantity:
 </Text>
 <View style={styles.qtyInputWrapper}>
 <TextInput
 style={styles.quantityInput}
 value={item.requestedQty.toString()}
 onChangeText={text => handleQtyChange(index, text)}
 keyboardType="numeric"
 maxLength={10}
 />
 </View>
 </View>
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
 color: '#111827',
 },
 placeholder: {
 width: 40,
 },
 scrollView: {
 flex: 1,
 padding: 16,
 },
 orderHeaderCard: {
 backgroundColor: '#7c3aed',
 borderRadius: 12,
 padding: 16,
 marginBottom: 20,
 },
 orderHeaderContent: {
 flexDirection: 'row',
 alignItems: 'center',
 justifyContent: 'center',
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
 statusBadge: {
 backgroundColor: '#e0f2fe',
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
 },
 cancelButton: {
 flex: 1,
 backgroundColor: '#f3f4f6',
 borderRadius: 8,
 paddingVertical: 14,
 marginRight: 8,
 alignItems: 'center',
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
 bottom: 40,
 left: 20,
 right: 20,
 borderRadius: 10,
 shadowColor: '#000',
 shadowOffset: {width: 0, height: 2},
 shadowOpacity: 0.2,
 shadowRadius: 4,
 elevation: 4,
 },
 successToast: {
 backgroundColor: '#dcfce7',
 },
 errorToast: {
 backgroundColor: '#fee2e2',
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
});

export default EditOrderScreen;