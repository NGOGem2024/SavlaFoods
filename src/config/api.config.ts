 // src/config/api.config
   
const YOUR_COMPUTER_IP = '202.189.234.140';  
// const YOUR_COMPUTER_IP = '192.168.1.37'; 
const PORT = '5000';

export const API_BASE_URL = `http://${YOUR_COMPUTER_IP}:${PORT}`;

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/sf/getUserAccountID`,
  GET_CUSTOMER_ID: `${API_BASE_URL}/getCustomerID`,
  GET_LIST_ACCOUNT:`${API_BASE_URL}/sf/listAccounts`,
  GET_CUSTOMER_INFO: `${API_BASE_URL}/getCustomerInfo`,
  ITEM_CATEGORIES: `${API_BASE_URL}/sf/getItemCatSubCat`,
  GET_ITEMS: `${API_BASE_URL}/sf/getItemsBySubCategory`,
  GET_ITEM_DETAILS: `${API_BASE_URL}/sf/getItemDetailswithStock`,
  GET_PLACEORDER_DETAILS: `${API_BASE_URL}/sf/placeOrder`,
  GET_ORDER_HISTORY: `${API_BASE_URL}/sf/getOrderHistory`,
  SEARCH_STOCK_ITEMS: `${API_BASE_URL}/sf/searchStockItems`,
  SEARCH_STOCK_SUBCATEGORIES: `${API_BASE_URL}/search/searchItemsAndSubCategories`,
  SEARCH_STOCK_CATEGORIES: `${API_BASE_URL}/search/searchCategories`,
  SEARCH_BY_LOT_NUMBER: `${API_BASE_URL}/search/searchByLotNumber`,
};


export const BASE_IMAGE_PATH = `${API_BASE_URL}/assets/images`;

export const getImagePath = (imageFileName: string) => {
    if (!imageFileName) return null;
    return `${BASE_IMAGE_PATH}/${imageFileName}`;
  };

export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};