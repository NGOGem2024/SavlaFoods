// In api/orderService.js

import axios, {AxiosError} from 'axios';
import {API_ENDPOINTS} from '../config/api.config';

// Add this function to your existing orderService.js file
export const cancelOrderItem = async (cancelData: any) => {
  try {
    const response = await axios.post(
      `${API_ENDPOINTS.GET_CANCEL_ORDER}`,
      cancelData,
    );

    return response.data;
  } catch (error: unknown) {
    const axiosError = error as AxiosError<{message?: string; error?: string}>;

    console.error('Error in cancelOrderItem API call:', axiosError);

    return {
      success: false,
      message: axiosError.response?.data?.message || 'Failed to cancel order',
      error: axiosError.response?.data?.error || axiosError.message,
    };
  }
};
