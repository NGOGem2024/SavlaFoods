// src/config/api.config

import {getSecureItem} from '../utils/secureStorage';
import {getSecureOrAsyncItem} from '../utils/migrationHelper';

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

  //Searching
  SEARCH_STOCK_ITEMS: `${API_BASE_URL}/sf/searchStockItems`,
  SEARCH_ITEMS: `${API_BASE_URL}/search/SearchItems`,

  //Switch Account
  GET_ACCOUNTS_BY_GROUP: `${API_BASE_URL}/sf/getAccountsByGroup`,
  SWITCH_ACCOUNT: `${API_BASE_URL}/sf/switchAccount`,

  //OrderHistory&Pending Flow
  GET_PLACEORDER_DETAILS: `${API_BASE_URL}/order/placeOrder`,
  GET_ORDER_HISTORY: `${API_BASE_URL}/order/getOrderHistory`,
  GET_PENDING_ORDERS: `${API_BASE_URL}/order/getPendingOrders`,
  UPDATE_PENDING_ORDER: `${API_BASE_URL}/order/updatePendingOrder`,
  GET_CANCEL_ORDER: `${API_BASE_URL}/order/cancelOrder`,
  DELETE_ORDER: `${API_BASE_URL}/order/deleteOrder`,

  //Inward/OutwardReport
  GET_INWARD_REPORT: `${API_BASE_URL}/reports/getInwardData`,
  GET_OUTWARD_REPORT: `${API_BASE_URL}/reports/getOutwardData`,

  //Summary
  GET_ALL_SUMMARY: `${API_BASE_URL}/reports/getTotalInwardOutward`,
  GET_ITEMWISE_SUMMARY: `${API_BASE_URL}/reports/getItemWiseTotals`,

  //StockReport
  GET_STOCK_REPORT: `${API_BASE_URL}/stocks/getStockReport`,
  GET_STOCK_ITEMWISE: `${API_BASE_URL}/stocks/getItemWiseSummary`,
  GET_STOCK_CATEGORYWISE: `${API_BASE_URL}/stocks/getCategoryWiseSummary`,

  //LotReport
  GET_LOT_REPORT: `${API_BASE_URL}/lots/getLotReport`,

  //GRNdetails
  GET_GRN_DETAILS: `${API_BASE_URL}/reports/GRNdetails`,

  //DCdetails
  GET_DC_DETAILS: `${API_BASE_URL}/lots/deliveryChallanDetails`,

  //ZeroStockReport
  GET_ZERO_STOCK_REPORT: `${API_BASE_URL}/zerostock/getZeroStock`,

  //PDF
  GET_STOCK_PDF_REPORT: `${API_BASE_URL}/stocks/getStockpdf`,

  GET_ZERO_STOCK_PDF_REPORT: `${API_BASE_URL}/stocks/getZeroStockpdf`,
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
  // Get token from secure storage
  const token = await getSecureOrAsyncItem('userToken');

  return {
    ...DEFAULT_HEADERS,
    Authorization: token ? `Bearer ${token}` : '',
  };
};
