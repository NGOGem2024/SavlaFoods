// hooks/useCartNavigation.ts
import {useCallback} from 'react';
import {Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useCart} from '../contexts/CartContext';
import {MainStackParamList} from '../type/type';

export const useCartNavigation = () => {
  const navigation = useNavigation();
  const {cartItems} = useCart();

  const handleCartPress = useCallback(async () => {
    try {
      const customerID = await AsyncStorage.getItem('customerID');

      if (customerID) {
        navigation.navigate('PlaceOrderScreen', {
          selectedItems: [],
          shouldRefresh: true,
          customerID: customerID,
        });
      } else {
        Alert.alert('Error', 'Customer ID not available');
      }
    } catch (error) {
      console.error('Error navigating to cart:', error);
      Alert.alert('Error', 'Unable to access cart at this time');
    }
  }, [navigation]);

  const handleAccountSwitch = useCallback(async () => {
    try {
      // Get the new customer ID
      const newCustomerId = await AsyncStorage.getItem('customerID');

      if (newCustomerId) {
        // Navigate to home screen with the new customer ID
        navigation.navigate('HomeScreen', {
          switchedAccount: true,
          newCustomerId: newCustomerId,
        });
      }
    } catch (error) {
      console.error('Error switching account:', error);
      Alert.alert('Error', 'Failed to switch account');
    }
  }, [navigation]);

  return {
    cartItemCount: cartItems?.length || 0,
    handleCartPress,
    handleAccountSwitch,
  };
};