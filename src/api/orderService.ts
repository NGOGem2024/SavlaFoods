// In api/orderService.js

import axios from 'axios';
import {API_ENDPOINTS} from '../config/api.config';

// Add this function to your existing orderService.js file
export const cancelOrderItem = async (cancelData: any) => {
  try {
    const response = await axios.post(
      `${API_ENDPOINTS.GET_CANCEL_ORDER}`,
      cancelData,
    );

    return response.data;
  } catch (error) {
    console.error('Error in cancelOrderItem API call:', error);

    // Return a standardized error object
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to cancel order',
      error: error.response?.data?.error || error.message,
    };
  }
};
