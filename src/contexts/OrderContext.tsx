// OrderContext.tsx
import React, {createContext, useState, useEffect} from 'react';
import {getSecureItem, setSecureItem, removeSecureItem} from '../utils/secureStorage';

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
  pendingOrders: OrderData[]; // Add this for pending orders
  refreshPendingOrders: () => Promise<void>; // Add this
  updateOrder: (updatedOrder: OrderData) => Promise<void>; // Add this
}

export const OrderContext = createContext<OrderContextType>({
  orderHistory: [],
  addOrder: async () => {},
  pendingOrders: [],
  clearHistory: async () => {},
  refreshPendingOrders: async () => {},
  updateOrder: async () => {},
});

export const OrderProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [orderHistory, setOrderHistory] = useState<OrderData[]>([]);
  const [pendingOrders, setPendingOrders] = useState<OrderData[]>([]);

  useEffect(() => {
    loadOrderHistory();
    loadPendingOrders();
  }, []);

  const loadOrderHistory = async () => {
    try {
      const savedHistory = await getSecureItem('orderHistory');
      if (savedHistory) {
        setOrderHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error('Error loading order history:', error);
    }
  };

  const loadPendingOrders = async () => {
    try {
      // Implement your API call to fetch pending orders
      // const response = await axios.get(API_ENDPOINTS.GET_PENDING_ORDERS);
      // setPendingOrders(response.data);
    } catch (error) {
      console.error('Error loading pending orders:', error);
    }
  };

  const updateOrder = async (updatedOrder: OrderData) => {
    try {
      // Update pending orders
      const updatedPendingOrders = pendingOrders.map(order =>
        order.header.ID === updatedOrder.header.ID ? updatedOrder : order,
      );
      setPendingOrders(updatedPendingOrders);

      // Also update in history if exists
      const updatedHistory = orderHistory.map(order =>
        order.header.ID === updatedOrder.header.ID ? updatedOrder : order,
      );
      if (updatedHistory.length !== orderHistory.length) {
        updatedHistory.push(updatedOrder);
      }

      await setSecureItem(
        'orderHistory',
        JSON.stringify(updatedHistory),
      );
      setOrderHistory(updatedHistory);
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const refreshPendingOrders = async () => {
    await loadPendingOrders();
  };
  const addOrder = async (order: OrderData) => {
    try {
      const updatedHistory = [...orderHistory, order];
      await setSecureItem(
        'orderHistory',
        JSON.stringify(updatedHistory),
      );
      setOrderHistory(updatedHistory);
    } catch (error) {
      console.error('Error saving order:', error);
    }
  };

  const clearHistory = async () => {
    try {
      await removeSecureItem('orderHistory');
      setOrderHistory([]);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  return (
    <OrderContext.Provider
      value={{
        orderHistory,
        addOrder,
        clearHistory,
        refreshPendingOrders,
        pendingOrders,
        updateOrder,
      }}>
      {children}
    </OrderContext.Provider>
  );
};
