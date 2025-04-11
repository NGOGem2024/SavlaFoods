// src/config/api.config

import AsyncStorage from '@react-native-async-storage/async-storage';

const YOUR_COMPUTER_IP = '202.189.234.140';
// const YOUR_COMPUTER_IP = '192.168.1.37';
const PORT = '5000';

export const API_BASE_URL = `http://${YOUR_COMPUTER_IP}:${PORT}`;

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/sf/getUserAccountID`,
  GET_CUSTOMER_ID: `${API_BASE_URL}/getCustomerID`,
  GET_LIST_ACCOUNT: `${API_BASE_URL}/sf/listAccounts`,
  GET_CUSTOMER_INFO: `${API_BASE_URL}/getCustomerInfo`,
  ITEM_CATEGORIES: `${API_BASE_URL}/sf/getItemCatSubCat`,
  GET_ITEMS: `${API_BASE_URL}/sf/getItemsBySubCategory`,
  GET_ITEM_DETAILS: `${API_BASE_URL}/sf/getItemDetailswithStock`,
  GET_PLACEORDER_DETAILS: `${API_BASE_URL}/order/placeOrder`,
  GET_ORDER_HISTORY: `${API_BASE_URL}/order/getOrderHistory`,
  GET_PENDING_ORDERS: `${API_BASE_URL}/order/getPendingOrders`,
  SEARCH_STOCK_ITEMS: `${API_BASE_URL}/sf/searchStockItems`,

  GET_CANCEL_ORDER: `${API_BASE_URL}/order/cancelOrder`,
  SEARCH_ITEMS: `${API_BASE_URL}/search/SearchItems`,
  GET_ACCOUNTS_BY_GROUP: `${API_BASE_URL}/sf/getAccountsByGroup`,
  SWITCH_ACCOUNT: `${API_BASE_URL}/sf/switchAccount`
};

export const BASE_IMAGE_PATH = `${API_BASE_URL}/assets/images`;

export const getImagePath = (imageFileName: string) => {
  if (!imageFileName) return null;
  return `${BASE_IMAGE_PATH}/${imageFileName}`;
};

export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

// Add this new function
export const getAuthHeaders = async () => {
  // Get token from storage - this depends on how you're storing auth tokens
  // You may be using AsyncStorage, SecureStore, or a state management solution
  const token = await AsyncStorage.getItem('userToken');

  return {
    ...DEFAULT_HEADERS,
    Authorization: token ? `Bearer ${token}` : '',
  };
};
