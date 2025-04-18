// //Mine
// import React, {useEffect, useState} from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   Modal,
//   TouchableOpacity,
//   TextInput,
//   Alert,
//   Platform,
//   KeyboardAvoidingView,
// } from 'react-native';
// import Icon from 'react-native-vector-icons/Feather';
// import {useNavigation} from '@react-navigation/native';
// import {StackNavigationProp} from '@react-navigation/stack';
// import {useCart} from '../contexts/CartContext';

// interface QuantitySelectorModalProps {
//   isVisible: boolean;
//   item: {
//     item_id: number;
//     item_name: string;
//     lot_no: string;
//     available_qty: number;
//     unit_name: string;
//     box_quantity: number;
//     customerID?: number | string;
//     vakal_no?: string;
//     item_marks?: string;
//   };
//   onClose: () => void;
// }

// const QuantitySelectorModal: React.FC<QuantitySelectorModalProps> = ({
//   isVisible,
//   item,
//   onClose,
// }) => {
//   const navigation = useNavigation<StackNavigationProp<any>>();
//   const [inputValue, setInputValue] = useState('1');
//   const maxQuantity = item.available_qty;
//   const {addToCart} = useCart();

//   useEffect(() => {
//     if (isVisible) {
//       setInputValue('1');
//     }
//   }, [isVisible]);

//   const validateAndUpdateQuantity = (value: string) => {
//     const cleanedValue = value.replace(/[^0-9]/g, '');

//     if (cleanedValue === '' || cleanedValue === '0') {
//       setInputValue('');
//       return;
//     }

//     const numValue = parseInt(cleanedValue);

//     if (numValue > maxQuantity) {
//       setInputValue(maxQuantity.toString());
//       Alert.alert(
//         'Invalid Quantity',
//         `Maximum available quantity is ${maxQuantity}`,
//       );
//       return;
//     }

//     setInputValue(cleanedValue);
//   };

//   const incrementQuantity = () => {
//     const currentValue = parseInt(inputValue) || 0;
//     if (currentValue < maxQuantity) {
//       setInputValue((currentValue + 1).toString());
//     }
//   };

//   const decrementQuantity = () => {
//     const currentValue = parseInt(inputValue) || 0;
//     if (currentValue > 1) {
//       setInputValue((currentValue - 1).toString());
//     }
//   };

//   const handleConfirm = () => {
//     const quantity = parseInt(inputValue) || 0;

//     if (quantity <= 0) {
//       Alert.alert('Invalid Quantity', 'Please enter a quantity greater than 0');
//       setInputValue('1');
//       return;
//     }

//     if (quantity > maxQuantity) {
//       Alert.alert(
//         'Invalid Quantity',
//         `Please select a quantity between 1 and ${maxQuantity}`,
//       );
//       return;
//     }

//     // Create cart item with proper quantity
//     const cartItem = {
//       item_id: item.item_id,
//       item_name: item.item_name,
//       lot_no: item.lot_no,
//       vakal_no: item.vakal_no || '',
//       item_marks: item.item_marks || '',
//       unit_name: item.unit_name,
//       available_qty: item.available_qty,
//       quantity: quantity,
//       customerID: item.customerID,
//     };

//     // Add to cart
//     addToCart(cartItem);

//     const goToCart = () => {
//       onClose(); // Close the modal first
//       navigation.navigate('PlaceOrderScreen', {
//         selectedItems: [], // Pass relevant parameters as needed
//         customerID: item.customerID,
//         // stockLotLocationId:item.
//       });
//     };

//     Alert.alert(
//       'Added to Cart',
//       `${quantity} ${quantity > 1 ? 'items' : 'item'} added to your cart`,
//       [
//         {
//           text: 'Continue Shopping',
//           onPress: onClose,
//           style: 'cancel',
//         },
//         {
//           text: 'Go to Cart',
//           onPress: goToCart,
//           style: 'default',
//         },
//       ],
//       {cancelable: false},
//     );
//   };

//   return (
//     <Modal
//       transparent={true}
//       visible={isVisible}
//       onRequestClose={onClose}
//       animationType="fade">
//       <KeyboardAvoidingView
//         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//         style={styles.modalOverlay}>
//         <View style={styles.modalContent}>
//           <View style={styles.modalHeader}>
//             <Text style={styles.modalTitle}>Select Quantity</Text>
//             <TouchableOpacity onPress={onClose} style={styles.closeButton}>
//               <Icon name="x" size={24} color="#6B7280" />
//             </TouchableOpacity>
//           </View>

//           <View style={styles.itemInfo}>
//             <View style={styles.infoRow}>
//               <Icon name="package" size={20} color="#F48221" />
//               <Text style={styles.modalItemDetail}>
//                 Item:{' '}
//                 <Text style={styles.modalItemValue}>{item.item_name}</Text>
//               </Text>
//             </View>
//             <View style={styles.infoRow}>
//               <Icon name="hash" size={20} color="#F48221" />
//               <Text style={styles.modalItemDetail}>
//                 Lot No: <Text style={styles.modalItemValue}>{item.lot_no}</Text>
//               </Text>
//             </View>
//             <View style={styles.infoRow}>
//               <Icon name="database" size={20} color="#F48221" />
//               <Text style={styles.modalItemDetail}>
//                 Available:{' '}
//                 <Text style={styles.modalItemValue}>{maxQuantity}</Text>
//               </Text>
//             </View>
//             <View style={styles.infoRow}>
//               <Icon name="box" size={20} color="#F48221" />
//               <Text style={styles.modalItemDetail}>
//                 Unit:{' '}
//                 <Text style={styles.modalItemValue}>{item.unit_name}</Text>
//               </Text>
//             </View>
//           </View>

//           <View style={styles.quantitySelector}>
//             <TouchableOpacity
//               style={[
//                 styles.quantityButton,
//                 (!inputValue || parseInt(inputValue) <= 1) &&
//                   styles.quantityButtonDisabled,
//               ]}
//               onPress={decrementQuantity}
//               disabled={!inputValue || parseInt(inputValue) <= 1}>
//               <Icon name="minus" size={20} color="white" />
//             </TouchableOpacity>

//             <TextInput
//               style={styles.quantityInput}
//               keyboardType="numeric"
//               value={inputValue}
//               onChangeText={validateAndUpdateQuantity}
//               selectTextOnFocus={true}
//               maxLength={String(maxQuantity).length}
//             />

//             <TouchableOpacity
//               style={[
//                 styles.quantityButton,
//                 parseInt(inputValue) >= maxQuantity &&
//                   styles.quantityButtonDisabled,
//               ]}
//               onPress={incrementQuantity}
//               disabled={parseInt(inputValue) >= maxQuantity}>
//               <Icon name="plus" size={20} color="white" />
//             </TouchableOpacity>
//           </View>

//           <View style={styles.modalActions}>
//             <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
//               <Icon name="x" size={20} color="#6B7280" />
//               <Text style={styles.cancelButtonText}>Cancel</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={styles.confirmButton}
//               onPress={handleConfirm}>
//               <Icon name="shopping-cart" size={20} color="white" />
//               <Text style={styles.confirmButtonText}>Add to Cart</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </KeyboardAvoidingView>
//     </Modal>
//   );
// };

// const styles = StyleSheet.create({
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   modalContent: {
//     backgroundColor: 'white',
//     borderRadius: 12,
//     padding: 20,
//     width: '85%',
//     maxWidth: 400,
//     elevation: 5,
//     shadowColor: '#000',
//     shadowOffset: {width: 0, height: 2},
//     shadowOpacity: 0.25,
//     shadowRadius: 4,
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#1F2937',
//   },
//   closeButton: {
//     padding: 4,
//   },
//   itemInfo: {
//     marginBottom: 24,
//     backgroundColor: '#F9FAFB',
//     padding: 16,
//     borderRadius: 8,
//   },
//   infoRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//     gap: 10,
//   },
//   modalItemDetail: {
//     fontSize: 15,
//     color: '#6B7280',
//     flex: 1,
//   },
//   modalItemValue: {
//     color: '#1F2937',
//     fontWeight: '600',
//   },
//   quantitySelector: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 24,
//     paddingHorizontal: 20,
//   },
//   quantityButton: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: '#F48221',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   quantityButtonDisabled: {
//     backgroundColor: '#E5E7EB',
//   },
//   quantityInput: {
//     borderWidth: 1,
//     borderColor: '#E5E7EB',
//     borderRadius: 8,
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     width: 80,
//     textAlign: 'center',
//     fontSize: 16,
//     color: '#1F2937',
//   },
//   modalActions: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     gap: 12,
//   },
//   cancelButton: {
//     flex: 1,
//     flexDirection: 'row',
//     backgroundColor: '#F3F4F6',
//     padding: 12,
//     borderRadius: 8,
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: 8,
//   },
//   cancelButtonText: {
//     color: '#6B7280',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   confirmButton: {
//     flex: 1,
//     flexDirection: 'row',
//     backgroundColor: '#F48221',
//     padding: 12,
//     borderRadius: 8,
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: 8,
//   },
//   confirmButtonText: {
//     color: 'white',
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });

// export default QuantitySelectorModal;

import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useCart} from '../contexts/CartContext';
import SuccessModal from './SuccessModal'; // Import the new SuccessModal component

interface QuantitySelectorModalProps {
  isVisible: boolean;
  item: {
    item_id: number;
    item_name: string;
    lot_no: string;
    available_qty: number;
    unit_name: string;
    box_quantity: number;
    customerID?: number | string;
    vakal_no?: string;
    item_marks?: string;
  };
  onClose: () => void;
}

const QuantitySelectorModal: React.FC<QuantitySelectorModalProps> = ({
  isVisible,
  item,
  onClose,
}) => {
  const navigation = useNavigation<StackNavigationProp<any>>();
  const [inputValue, setInputValue] = useState('1');
  const maxQuantity = item.available_qty;
  const {addToCart} = useCart();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [addedQuantity, setAddedQuantity] = useState(0);

  useEffect(() => {
    if (isVisible) {
      setInputValue('1');
      setShowSuccessModal(false);
    }
  }, [isVisible]);

  const validateAndUpdateQuantity = (value: string) => {
    const cleanedValue = value.replace(/[^0-9]/g, '');

    if (cleanedValue === '' || cleanedValue === '0') {
      setInputValue('');
      return;
    }

    const numValue = parseInt(cleanedValue);

    if (numValue > maxQuantity) {
      setInputValue(maxQuantity.toString());
      Alert.alert(
        'Invalid Quantity',
        `Maximum available quantity is ${maxQuantity}`,
      );
      return;
    }

    setInputValue(cleanedValue);
  };

  const incrementQuantity = () => {
    const currentValue = parseInt(inputValue) || 0;
    if (currentValue < maxQuantity) {
      setInputValue((currentValue + 1).toString());
    }
  };

  const decrementQuantity = () => {
    const currentValue = parseInt(inputValue) || 0;
    if (currentValue > 1) {
      setInputValue((currentValue - 1).toString());
    }
  };

  const handleConfirm = () => {
    const quantity = parseInt(inputValue) || 0;

    if (quantity <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a quantity greater than 0');
      setInputValue('1');
      return;
    }

    if (quantity > maxQuantity) {
      Alert.alert(
        'Invalid Quantity',
        `Please select a quantity between 1 and ${maxQuantity}`,
      );
      return;
    }

    // Create cart item with proper quantity
    const cartItem = {
      item_id: item.item_id,
      item_name: item.item_name,
      lot_no: item.lot_no,
      vakal_no: item.vakal_no || '',
      item_marks: item.item_marks || '',
      unit_name: item.unit_name,
      available_qty: item.available_qty,
      quantity: quantity,
      customerID: item.customerID,
    };

    // Add to cart
    addToCart(cartItem);

    // Set added quantity for success modal
    setAddedQuantity(quantity);

    // Show success modal instead of Alert
    setShowSuccessModal(true);
  };

  const handleGoToCart = () => {
    setShowSuccessModal(false);
    onClose(); // Close the quantity selector modal
    navigation.navigate('PlaceOrderScreen', {
      selectedItems: [],
      customerID: item.customerID,
    });
  };

  const handleOrderMore = () => {
    setShowSuccessModal(false);
    onClose(); // Close both modals
  };

  return (
    <>
      <Modal
        transparent={true}
        visible={isVisible && !showSuccessModal}
        onRequestClose={onClose}
        animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Quantity</Text>
            </View>

            <View style={styles.itemInfo}>
              <View style={styles.infoRow}>
                <Icon name="package" size={20} color="#F48221" />
                <Text style={styles.modalItemDetail}>
                  Item:{' '}
                  <Text style={styles.modalItemValue}>{item.item_name}</Text>
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Icon name="hash" size={20} color="#F48221" />
                <Text style={styles.modalItemDetail}>
                  Lot No:{' '}
                  <Text style={styles.modalItemValue}>{item.lot_no}</Text>
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Icon name="database" size={20} color="#F48221" />
                <Text style={styles.modalItemDetail}>
                  Available:{' '}
                  <Text style={styles.modalItemValue}>{maxQuantity}</Text>
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Icon name="box" size={20} color="#F48221" />
                <Text style={styles.modalItemDetail}>
                  Unit:{' '}
                  <Text style={styles.modalItemValue}>{item.unit_name}</Text>
                </Text>
              </View>
            </View>

            <View style={styles.quantitySelector}>
              <TouchableOpacity
                style={[
                  styles.quantityButton,
                  (!inputValue || parseInt(inputValue) <= 1) &&
                    styles.quantityButtonDisabled,
                ]}
                onPress={decrementQuantity}
                disabled={!inputValue || parseInt(inputValue) <= 1}>
                <Icon name="minus" size={20} color="white" />
              </TouchableOpacity>

              <TextInput
                style={styles.quantityInput}
                keyboardType="numeric"
                value={inputValue}
                onChangeText={validateAndUpdateQuantity}
                selectTextOnFocus={true}
                maxLength={String(maxQuantity).length}
              />

              <TouchableOpacity
                style={[
                  styles.quantityButton,
                  parseInt(inputValue) >= maxQuantity &&
                    styles.quantityButtonDisabled,
                ]}
                onPress={incrementQuantity}
                disabled={parseInt(inputValue) >= maxQuantity}>
                <Icon name="plus" size={20} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Icon name="x" size={20} color="#6B7280" />
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirm}>
                <Icon name="shopping-cart" size={20} color="white" />
                <Text style={styles.confirmButtonText}>Add to Cart</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Success Modal */}
      <SuccessModal
        isVisible={showSuccessModal}
        itemCount={addedQuantity}
        onClose={handleOrderMore}
        onGoToCart={handleGoToCart}
      />
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '85%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  itemInfo: {
    marginBottom: 24,
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  modalItemDetail: {
    fontSize: 15,
    color: '#6B7280',
    flex: 1,
  },
  modalItemValue: {
    color: '#1F2937',
    fontWeight: '600',
  },
  quantitySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F48221',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    width: 80,
    textAlign: 'center',
    fontSize: 16,
    color: '#1F2937',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F48221',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QuantitySelectorModal;
