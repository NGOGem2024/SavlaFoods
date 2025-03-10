import Ionicons from 'react-native-vector-icons/Ionicons';
import {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import axios from 'axios';
import React, {useEffect, useState, useCallback} from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {MainStackParamList} from '../../src/type/type';
import {useCart} from '../contexts/CartContext';
import {API_ENDPOINTS} from '../config/api.config';
import Icon from 'react-native-vector-icons/Ionicons';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface DetailRowProps {
  label: string;
  value: string | number; // Adjust this type if value can be something else.
  highlighted?: boolean; // Optional
}

interface OrderItem {
  // Added missing fields from backend
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

interface GroupedItems {
  [key: string]: OrderItem[];
}

type PlaceOrderScreenRouteProp = RouteProp<
  MainStackParamList,
  'PlaceOrderScreen'
>;
type PlaceOrderScreenNavigationProp = StackNavigationProp<
  MainStackParamList,
  'PlaceOrderScreen'
>;

interface PlaceOrderScreenProps {
  route: PlaceOrderScreenRouteProp;
  navigation: PlaceOrderScreenNavigationProp;
}

const PlaceOrderScreen: React.FC<PlaceOrderScreenProps> = ({
  route,
  navigation,
}) => {
  const {selectedItems, customerID, shouldRefresh} = route.params || {
    selectedItems: [],
  };
  const {cartItems, clearCart, removeCartItem} = useCart();
  const [groupedOrderItems, setGroupedOrderItems] = useState<GroupedItems>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized && (selectedItems.length > 0 || cartItems.length > 0)) {
      const combinedItems = [
        ...(Array.isArray(selectedItems) ? selectedItems : []),
        ...cartItems.map(cartItem => ({
          LOT_NO: cartItem.lot_no || '',
          ITEM_ID: cartItem.item_id,
          ITEM_NAME: cartItem.item_name,
          VAKAL_NO: cartItem.vakal_no || '',
          ITEM_MARKS: cartItem.item_marks || '',
          UNIT_NAME: cartItem.unit_name || '',
          AVAILABLE_QTY: cartItem.available_qty,
          NET_QUANTITY: Math.max(0, cartItem.available_qty - cartItem.quantity),
          UPDATED_QTY: [cartItem.quantity],
          ORDERED_QUANTITY: cartItem.quantity,
        })),
      ] as OrderItem[];

      const grouped = combinedItems.reduce((acc, item) => {
        if (!acc[item.ITEM_NAME]) {
          acc[item.ITEM_NAME] = [];
        }
        acc[item.ITEM_NAME].push(item);
        return acc;
      }, {} as GroupedItems);

      setGroupedOrderItems(grouped);
      setIsInitialized(true);
    }
  }, [selectedItems, cartItems, isInitialized]);

  const handleQuantityChange = useCallback(
    (
      itemName: string,
      lotNo: string,
      change: 'increment' | 'decrement' | string,
    ) => {
      setGroupedOrderItems(prevGroups => {
        const newGroups = {...prevGroups};
        const group = [...(newGroups[itemName] || [])];
        const itemIndex = group.findIndex(item => item.LOT_NO === lotNo);

        if (itemIndex !== -1) {
          const item = group[itemIndex];
          let newQuantity: number;

          if (change === 'increment') {
            newQuantity = item.ORDERED_QUANTITY + 1;
          } else if (change === 'decrement') {
            newQuantity = Math.max(0, item.ORDERED_QUANTITY - 1);
          } else {
            newQuantity = parseFloat(change) || 0;
          }

          newQuantity = Math.min(newQuantity, item.AVAILABLE_QTY);

          group[itemIndex] = {
            ...item,
            ORDERED_QUANTITY: newQuantity,
            NET_QUANTITY: Math.max(0, item.AVAILABLE_QTY - newQuantity),
          };
          newGroups[itemName] = group;
        }

        return newGroups;
      });
    },
    [],
  );

  const handleRemoveItem = useCallback(
    (itemToRemove: OrderItem) => {
      setGroupedOrderItems(prevGroups => {
        const newGroups = {...prevGroups};
        const group = newGroups[itemToRemove.ITEM_NAME];
        if (group) {
          const filteredGroup = group.filter(
            item => item.LOT_NO !== itemToRemove.LOT_NO,
          );
          if (filteredGroup.length === 0) {
            delete newGroups[itemToRemove.ITEM_NAME];
          } else {
            newGroups[itemToRemove.ITEM_NAME] = filteredGroup;
          }
        }
        return newGroups;
      });

      const cartItemToRemove = cartItems.find(
        cartItem => cartItem.lot_no === itemToRemove.LOT_NO,
      );

      if (cartItemToRemove) {
        removeCartItem(cartItemToRemove);
      }
    },
    [cartItems, removeCartItem],
  );

  // const handleConfirmOrder = async () => {
  //   setIsLoading(true);
  //   try {
  //     const allItems = Object.values(groupedOrderItems).flat();

  //     if (allItems.length === 0) {
  //       Alert.alert('Error', 'Please add items to your order');
  //       return;
  //     }

  //     const invalidItems = allItems.filter(item => !item.ORDERED_QUANTITY || item.ORDERED_QUANTITY <= 0);
  //     if (invalidItems.length > 0) {
  //       Alert.alert('Error', 'Please specify valid quantities for all items');
  //       return;
  //     }

  //     const orderPayload = {
  //       CustomerID: route.params?.customerID || "1",
  //       items: allItems.map(item => ({
  //         LotNo: item.LOT_NO,
  //         ItemID: item.ITEM_ID,
  //         Quantity: item.ORDERED_QUANTITY
  //       }))
  //     };

  //     const response = await axios.post(
  //       API_ENDPOINTS.GET_PLACEORDER_DETAILS,
  //       orderPayload
  //     );

  //     if (response.data.success) {
  //       Alert.alert(
  //         'Success',
  //         'Order placed successfully! You will receive an email confirmation shortly.',
  //         [
  //           {
  //             text: 'OK',
  //             onPress: () => {
  //               clearCart();
  //               navigation.navigate('BottomTabNavigator', {
  //                 shouldRefresh: true,
  //                 customerID: String(route.params?.customerID || ''),
  //               });
  //             }
  //           }
  //         ]
  //       );
  //     } else {
  //       Alert.alert('Error', response.data.message || 'Failed to place order');
  //     }
  //   } catch (error: any) {
  //     const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
  //     Alert.alert('Error', `Failed to place order: ${errorMessage}`);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleConfirmOrder = async () => {
    setIsLoading(true);
    try {
      const allItems = Object.values(groupedOrderItems).flat();

      if (allItems.length === 0) {
        Alert.alert('Error', 'Please add items to your order');
        return;
      }

      const invalidItems = allItems.filter(
        item => !item.ORDERED_QUANTITY || item.ORDERED_QUANTITY <= 0,
      );
      if (invalidItems.length > 0) {
        Alert.alert('Error', 'Please specify valid quantities for all items');
        return;
      }

      if (clearCart) {
        clearCart();
      }

      // Navigate to confirmation screen with order items
      navigation.navigate('OrderConfirmationScreen', {
        orderItems: allItems,
        customerID: route.params.customerID,
        userSupervisorId: route.params.userSupervisorId,
        userMukadamId: route.params.userMukadamId,
        stockLotLocationId: route.params.stockLotLocationId || 882698,
        unitId: route.params.unitId || 3,
        finYearId: route.params.finYearId || 15,
      });
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Unknown error';
      Alert.alert('Error', `Failed to process order: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderOrderItem = (item: OrderItem, groupName: string) => (
    <View key={item.LOT_NO} style={styles.orderItemContainer}>
      <View style={styles.statusIndicator} />
      <View style={styles.orderItemHeader}>
        <View style={styles.headerContent}>
          <Text style={styles.lotNumber}>
            Lot No: <Text style={styles.highlightedLotNo}>{item.LOT_NO}</Text>
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            Alert.alert(
              'Remove Item',
              'Are you sure you want to remove this item?',
              [
                {text: 'Cancel', style: 'cancel'},
                {
                  text: 'Remove',
                  style: 'destructive',
                  onPress: () => handleRemoveItem(item),
                },
              ],
            );
          }}>
          <Ionicons name="trash-outline" size={20} style={{color:"#FF6B6B" }}/>
        </TouchableOpacity>
      </View>
      <View style={styles.orderItemDetails}>
        <View style={styles.detailColumn}>
          <DetailRow label="Vakal No" value={item.VAKAL_NO} />
          <DetailRow label="Item Marks" value={item.ITEM_MARKS} />
          <DetailRow
            label="Available Quantity"
            value={`${item.AVAILABLE_QTY}`}
          />
        </View>
        <View style={styles.detailColumn}>
          <DetailRow label="Unit Name" value={item.UNIT_NAME} />
          <DetailRow
            label="Net Quantity"
            value={`${item.NET_QUANTITY}`}
            highlighted
          />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ordered Quantity</Text>
            <View style={styles.quantityContainer}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() =>
                  handleQuantityChange(groupName, item.LOT_NO, 'decrement')
                }>
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>
              <TextInput
                style={[
                  styles.detailValue,
                  styles.orderhighlightedValue,
                  styles.input,
                  styles.quantityInput,
                ]}
                value={String(item.ORDERED_QUANTITY)}
                onChangeText={value =>
                  handleQuantityChange(groupName, item.LOT_NO, value)
                }
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() =>
                  handleQuantityChange(groupName, item.LOT_NO, 'increment')
                }>
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const DetailRow: React.FC<DetailRowProps> = ({
    label,
    value,
    highlighted = false,
  }) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text
        style={[styles.detailValue, highlighted && styles.highlightedValue]}>
        {value}
      </Text>
    </View>
  );

  const renderGroupedItems = () => {
    return Object.entries(groupedOrderItems).map(([itemName, items]) => (
      <View key={itemName} style={styles.groupContainer}>
        <View style={styles.groupHeaderContainer}>
          <Text style={styles.groupHeader}>{itemName}</Text>
        </View>
        {items.map(item => renderOrderItem(item, itemName))}
      </View>
    ));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mainContainer}>
        <ScrollView style={styles.scrollContainer}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{marginLeft: 15}}>
            <MaterialIcons name="arrow-back" size={24} style={{color:"#663399"}} />
          </TouchableOpacity>
          <Text style={styles.headerText}>Place Your Order</Text>
          {renderGroupedItems()}
          <View style={styles.scrollPadding} />
        </ScrollView>
        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={[styles.confirmButton, isLoading && styles.disabledButton]}
            onPress={handleConfirmOrder}
            disabled={isLoading}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#FFFFFF" />
                <Text style={styles.confirmButtonText}>Processing...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.confirmButtonText}>Place Order</Text>
                <Ionicons name="arrow-forward" size={20} style={{color:"#FFFFFF"}} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
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
    backgroundColor: '#FFFAFA',
    elevation: 2,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollPadding: {
    height: 20,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 5,
    marginBottom: 16,
    textAlign: 'center',
    color: '#663399',
  },
  groupContainer: {
    marginBottom: 20,
  },
  groupHeaderContainer: {
    backgroundColor: '#EDE9FE',
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
    marginBottom: 8,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  groupHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    padding: 12,
  },
  orderItemContainer: {
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderWidth: 1,
    borderColor: '#eaeaea',
  },
  statusIndicator: {
    height: 2,
    borderRadius: 2,
    backgroundColor: '#8B5CF6',
    marginBottom: 12,
  },
  orderItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  lotNumber: {
    fontSize: 14,
    color: '#666',
  },
  highlightedLotNo: {
    color: '#8B5CF6',
    fontWeight: '700',
  },
  deleteButton: {
    marginLeft: 12,
  },
  orderItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  detailColumn: {
    flex: 1,
  },
  detailRow: {
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#777',
  },
  footer: {
    marginTop: 16,
    marginBottom: 32,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#663399',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: 50,
    marginBottom: -20,
  },
  disabledButton: {
    backgroundColor: '#BDBDBD',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '50%',
  },
  quantityButton: {
    width: 30,
    height: 30,
    backgroundColor: '#8B5CF2',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  quantityButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantityInput: {
    width: 50,
    textAlign: 'center',
    marginHorizontal: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 4,
    paddingHorizontal: 8,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  highlightedValue: {
    color: '#ff5733',
  },
  orderhighlightedValue: {
    color: '#8B5CF2',
  },
  footerContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 25,
    borderTopWidth: 1,
    borderTopColor: '#eaeaea',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: -3},
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});

export default PlaceOrderScreen;