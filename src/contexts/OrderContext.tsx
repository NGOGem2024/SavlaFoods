// OrderContext.tsx
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OrderDetail {
  ID: number;
  FK_ORDER_ID: number;
  FK_ITEM_ID: number;
  ITEM_NAME: string;
  LOT_NO: string | number;
  ITEM_MARKS: string;
  VAKAL_NO: string;
  REQUESTED_QTY: number;
  AVAILABLE_QTY: number;
  STATUS: string;
  MARK: string;
  REMARK: string;
  ORDERED_QUANTITY: number;
  UNIT_NAME?: string;
  NET_QUANTITY?: number;
}

interface OrderHeader {
  ID: number;
  ORDER_NO: string;
  DELIVERY_DATE: string;
  ORDER_DATE: string;
  TRANSPORTER_NAME: string;
  STATUS: string;
  FK_CUSTOMER_ID: number;
  FK_USER_SUPERVISOR_ID: string;
  CREATEDBY: string;
  CREATEDON: string;
  UPDATEDBY: string;
  UPDATEDON: string;
  ORDER_BY: string;
  ORDER_MODE: string;
  REMARK: string;
}

interface OrderData {
  header: OrderHeader;
  details: OrderDetail[];
}

interface OrderContextType {
  orderHistory: OrderData[];
  addOrder: (order: OrderData) => Promise<void>;
  clearHistory: () => Promise<void>;
}

export const OrderContext = createContext<OrderContextType>({
  orderHistory: [],
  addOrder: async () => {},
  clearHistory: async () => {},
});

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orderHistory, setOrderHistory] = useState<OrderData[]>([]);

  useEffect(() => {
    loadOrderHistory();
  }, []);

  const loadOrderHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem('orderHistory');
      if (savedHistory) {
        setOrderHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error('Error loading order history:', error);
    }
  };

  const addOrder = async (order: OrderData) => {
    try {
      const updatedHistory = [...orderHistory, order];
      await AsyncStorage.setItem('orderHistory', JSON.stringify(updatedHistory));
      setOrderHistory(updatedHistory);
    } catch (error) {
      console.error('Error saving order:', error);
    }
  };

  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem('orderHistory');
      setOrderHistory([]);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  return (
    <OrderContext.Provider value={{ orderHistory, addOrder, clearHistory }}>
      {children}
    </OrderContext.Provider>
  );
};
