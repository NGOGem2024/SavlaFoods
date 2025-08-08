import React, {
  createContext,
  useState,
  useContext,
  useCallback,
  useEffect,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import {API_ENDPOINTS} from '../config/api.config';

interface CartItem {
  quantityInBox: number;
  requested_qty: any;
  ordered_quantity: any;
  item_id: number;
  item_name: string;
  lot_no: string;
  available_qty: number;
  quantity: number;
  unit_name: string;
  vakal_no: string;
  item_marks: string;
  customerID?: number | string;
  addedTimestamp: number; // Added timestamp for expiration tracking
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeCartItem: (item: CartItem) => void;
  clearCart: () => void;
  updateCartItemQuantity: (item: CartItem, newQuantity: number) => void;
  updateCartItemsAfterOrder: (orderResponse: any) => void;
}

// Create the context with default values
const CartContext = createContext<CartContextType>({
  cartItems: [],
  addToCart: () => {},
  removeCartItem: () => {},
  clearCart: () => {},
  updateCartItemQuantity: () => {},
  updateCartItemsAfterOrder: () => {},
});

type CartProviderProps = {
  children: React.ReactNode;
};

const CART_STORAGE_KEY = '@cart_items';
const EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const CartProvider: React.FC<CartProviderProps> = ({children}) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Load cart from AsyncStorage on mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        const storedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
        if (storedCart) {
          const parsedCart: CartItem[] = JSON.parse(storedCart);
          // Filter out expired items
          const now = Date.now();
          const validItems = parsedCart.filter(
            item => now - item.addedTimestamp < EXPIRATION_TIME,
          );
          setCartItems(validItems);
          // Save filtered cart back to storage
          await AsyncStorage.setItem(
            CART_STORAGE_KEY,
            JSON.stringify(validItems),
          );
        }
      } catch (error) {
        console.error('Error loading cart from storage:', error);
      }
    };
    loadCart();
  }, []);

  // Save cart to AsyncStorage whenever it changes
  useEffect(() => {
    const saveCart = async () => {
      try {
        await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
      } catch (error) {
        console.error('Error saving cart to storage:', error);
      }
    };
    saveCart();
  }, [cartItems]);

  // Periodic cleanup of expired items
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCartItems(prevItems => {
        const validItems = prevItems.filter(
          item => now - item.addedTimestamp < EXPIRATION_TIME,
        );
        return validItems;
      });
    }, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(interval);
  }, []);

  const addToCart = useCallback((item: CartItem) => {
    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(
        cartItem => cartItem.lot_no === item.lot_no,
      );

      const newItem = {
        ...item,
        addedTimestamp: Date.now(), // Add timestamp when item is added
      };

      if (existingItemIndex > -1) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: item.quantity,
          addedTimestamp: Date.now(), // Update timestamp on quantity change
        };
        return updatedItems;
      }

      return [...prevItems, newItem];
    });
  }, []);

  const removeCartItem = useCallback((itemToRemove: CartItem) => {
    setCartItems(prevItems =>
      prevItems.filter(item => item.lot_no !== itemToRemove.lot_no),
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    AsyncStorage.removeItem(CART_STORAGE_KEY);
  }, []);

  const updateCartItemQuantity = useCallback(
    (item: CartItem, newQuantity: number) => {
      setCartItems(prevItems =>
        prevItems.map(cartItem =>
          cartItem.lot_no === item.lot_no
            ? {
                ...cartItem,
                quantity: newQuantity,
                addedTimestamp: Date.now(), // Update timestamp when quantity changes
              }
            : cartItem,
        ),
      );
    },
    [],
  );

  const updateCartItemsAfterOrder = useCallback((orderResponse: any) => {
    setCartItems(prevItems =>
      prevItems
        .map(item => {
          const matchingOrderItem = orderResponse.data.find(
            (orderedItem: any) =>
              orderedItem.LOT_NO === item.lot_no &&
              orderedItem.ITEM_ID === item.item_id,
          );

          if (matchingOrderItem) {
            return {
              ...item,
              available_qty: matchingOrderItem.NET_QUANTITY,
              quantity: Math.min(item.quantity, matchingOrderItem.NET_QUANTITY),
              addedTimestamp: Date.now(), // Update timestamp after order
            };
          }
          return item;
        })
        .filter(item => item.quantity > 0),
    );
  }, []);

  const contextValue = {
    cartItems,
    addToCart,
    removeCartItem,
    clearCart,
    updateCartItemQuantity,
    updateCartItemsAfterOrder,
  };

  return (
    <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>
  );
};

// Custom hook to use the cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
