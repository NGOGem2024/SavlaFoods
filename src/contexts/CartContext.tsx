import React, { createContext, useState, useContext, useCallback } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api.config';
 

interface CartItem {
  item_id: number;
  item_name: string;
  lot_no: string;
  available_qty: number;
  quantity: number;
  unit_name: string;
  vakal_no: string;
  item_marks: string;
  customerID?: number | string;
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
  updateCartItemsAfterOrder: () => {}
});

type CartProviderProps = {
  children: React.ReactNode;
};

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = useCallback((item: CartItem) => {
    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(
        cartItem => cartItem.lot_no === item.lot_no
      );

      if (existingItemIndex > -1) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: item.quantity
        };
        return updatedItems;
      }

      return [...prevItems, item];
    });
  }, []);

  const removeCartItem = useCallback((itemToRemove: CartItem) => {
    setCartItems(prevItems => 
      prevItems.filter(item => item.lot_no !== itemToRemove.lot_no)
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const updateCartItemQuantity = useCallback((item: CartItem, newQuantity: number) => {
    setCartItems(prevItems => 
      prevItems.map(cartItem => 
        cartItem.lot_no === item.lot_no
          ? { ...cartItem, quantity: newQuantity }
          : cartItem
      )
    );
  }, []);

  const updateCartItemsAfterOrder = useCallback((orderResponse: any) => {
    setCartItems(prevItems => 
      prevItems.map(item => {
        const matchingOrderItem = orderResponse.data.find(
          (orderedItem: any) => 
            orderedItem.LOT_NO === item.lot_no && 
            orderedItem.ITEM_ID === item.item_id
        );
  
        if (matchingOrderItem) {
          return { 
            ...item, 
            available_qty: matchingOrderItem.NET_QUANTITY,
            quantity: Math.min(item.quantity, matchingOrderItem.NET_QUANTITY)
          };
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  }, []);

  const contextValue = {
    cartItems,
    addToCart,
    removeCartItem,
    clearCart,
    updateCartItemQuantity,
    updateCartItemsAfterOrder
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
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