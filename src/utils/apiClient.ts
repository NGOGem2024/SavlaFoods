import axios, {AxiosRequestConfig, AxiosResponse} from 'axios';
import NetInfo from '@react-native-community/netinfo';
import {API_BASE_URL, DEFAULT_HEADERS} from '../config/api.config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper function to format token for better visibility
const formatTokenForLogging = (token: string | null) => {
  if (!token) return 'null';

  // Get first 10 chars and last 10 chars to make differences more visible
  const firstPart = token.substring(0, 10);
  const lastPart = token.substring(token.length - 10);
  return `${firstPart}...${lastPart}`;
};

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: DEFAULT_HEADERS,
  timeout: 15000, // 15 seconds timeout
});

// Add a request interceptor
apiClient.interceptors.request.use(
  async config => {
    // Check for network connectivity before making request
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      return Promise.reject(new Error('No internet connection'));
    }

    // Add auth token to headers if it exists
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Log the token and URL for debugging
      console.log(`🔹 API Request to: ${config.url}`);
      console.log(`🔑 Using token: ${formatTokenForLogging(token)}`);
    } else {
      console.log(`🔸 API Request to: ${config.url} (no token)`);
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// Add a response interceptor
apiClient.interceptors.response.use(
  response => {
    console.log(
      `✅ Response from: ${response.config.url} (Status: ${response.status})`,
    );
    return response;
  },
  error => {
    // Handle network errors
    if (
      error.message === 'No internet connection' ||
      error.message === 'Network Error' ||
      error.code === 'ECONNABORTED' ||
      !error.response
    ) {
      // Network error
      console.log(`❌ Network error for request to: ${error.config?.url}`);
      return Promise.reject(new Error('No internet connection'));
    }
    console.log(
      `❌ Error response from: ${error.config?.url} (Status: ${error.response?.status})`,
    );
    return Promise.reject(error);
  },
);

// Generic API request function
const apiRequest = async <T>(config: AxiosRequestConfig): Promise<T> => {
  try {
    // Check network status
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      throw new Error('No internet connection');
    }

    const response: AxiosResponse<T> = await apiClient(config);
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export default {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    apiRequest<T>({...config, method: 'get', url}),

  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiRequest<T>({...config, method: 'post', url, data}),

  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) =>
    apiRequest<T>({...config, method: 'put', url, data}),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    apiRequest<T>({...config, method: 'delete', url}),

  // Raw axios instance in case you need direct access
  axiosInstance: apiClient,
};
