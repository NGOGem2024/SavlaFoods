import {useState, useEffect} from 'react';
import {Alert, Platform} from 'react-native';
import {getSecureItem, setSecureItem} from '../utils/secureStorage';
import {getSecureOrAsyncItem} from '../utils/migrationHelper';
import axios from 'axios';
import {API_ENDPOINTS, DEFAULT_HEADERS} from '../config/api.config';
import apiClient from '../utils/apiClient';

// Define types
interface CategoryItem {
  CATID: number;
  CATCODE: string;
  CATDESC: string;
  SUBCATID: number;
  SUBCATCODE: string;
  SUBCATDESC: string;
  CATEGORY_IMAGE_NAME: string;
  SUBCATEGORY_IMAGE_NAME: string;
}

interface ApiResponse {
  input: {
    CustomerID: number;
    displayName: string;
  };
  output: CategoryItem[];
}

interface SubcategoriesMap {
  [key: string]: string[];
}

export interface ReportFilters {
  fromDate: Date;
  toDate: Date;
  itemCategories: string[];
  itemSubcategories: string[];
  unit: string[]; // Changed from string to string[]
}

interface UseReportDataProps {
  isInward: boolean;
}

export const useReportData = ({isInward}: UseReportDataProps) => {
  // State for categories and subcategories
  const [loading, setLoading] = useState(false);
  const [apiCategories, setApiCategories] = useState<string[]>([]);
  const [apiSubcategories, setApiSubcategories] = useState<SubcategoriesMap>(
    {},
  );
  const [apiData, setApiData] = useState<CategoryItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  // Add customerID state
  const [customerID, setCustomerID] = useState('');

  // State for report data
  const [reportData, setReportData] = useState<any[]>([]);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Helper function to process API response
  const processApiResponse = (categoryData: CategoryItem[]) => {
    // Save the original data
    setApiData(categoryData);

    // Process categories (unique values only)
    const uniqueCategories = [
      ...new Set(categoryData.map(item => item.CATDESC)),
    ];
    setApiCategories(uniqueCategories);

    // Process subcategories by category
    const subcatMap: SubcategoriesMap = {};
    uniqueCategories.forEach(category => {
      subcatMap[category] = categoryData
        .filter(item => item.CATDESC === category)
        .map(item => item.SUBCATDESC);
    });

    setApiSubcategories(subcatMap);
  };

  // Function to fetch categories and subcategories from API
  const fetchCategoriesAndSubcategories = async () => {
    try {
      setLoading(true);

      // Get customer ID from secure storage
      const customerID = await getSecureOrAsyncItem('customerID');
      const displayName = await getSecureOrAsyncItem('displayName');

      if (!customerID) {
        Alert.alert('Error', 'Customer ID not found. Please login again.');
        setLoading(false);
        return;
      }

      console.log('Fetching from URL:', API_ENDPOINTS.ITEM_CATEGORIES);
      console.log(
        'Request body:',
        JSON.stringify({
          CustomerID: parseInt(customerID),
          displayName: displayName || '',
        }),
      );

      try {
        // Try using the apiClient utility first
        const response = await apiClient.post<ApiResponse>(
          '/sf/getItemCatSubCat',
          {
            CustomerID: parseInt(customerID),
            displayName: displayName || '',
          },
        );

        console.log(
          'API Response data:',
          JSON.stringify(response).substring(0, 200),
        );

        if (response && response.output && Array.isArray(response.output)) {
          // Process the response data
          processApiResponse(response.output);
        } else {
          // Fallback to direct axios call
          const directResponse = await axios.post<ApiResponse>(
            API_ENDPOINTS.ITEM_CATEGORIES,
            {
              CustomerID: parseInt(customerID),
              displayName: displayName || '',
            },
            {
              headers: DEFAULT_HEADERS,
              timeout: 10000,
            },
          );

          console.log(
            'Direct axios response:',
            JSON.stringify(directResponse.data).substring(0, 200),
          );

          if (
            directResponse.data &&
            directResponse.data.output &&
            Array.isArray(directResponse.data.output)
          ) {
            // Process the response data
            processApiResponse(directResponse.data.output);
          } else {
            console.error('Invalid API response format:', directResponse.data);
            Alert.alert(
              'Error',
              'Failed to load categories. Invalid response format.',
            );
          }
        }
      } catch (error) {
        console.error('Error fetching categories:', error);

        if (axios.isAxiosError(error)) {
          // Handle Axios specific errors
          const errorMessage = error.response
            ? `Server error: ${error.response.status}`
            : error.message;

          console.log('Axios error details:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
          });

          Alert.alert(
            'Connection Error',
            `Failed to connect to server: ${errorMessage}`,
          );
        } else {
          Alert.alert('Error', 'Failed to load categories. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error in overall category handling:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch customer data (name and ID) from secure storage
  const fetchCustomerData = async () => {
    try {
      // Fetch customer ID
      const storedCustomerID = await getSecureOrAsyncItem('customerID');
      if (storedCustomerID) {
        console.log('Found customer ID in secure storage:', storedCustomerID);
        setCustomerID(storedCustomerID);
      } else {
        console.error('No customer ID found in secure storage');
      }

      // First try to get the display name from Disp_name, as this is the current user's name
      // This is what OtpVerificationScreen.tsx stores during login
      const storedDisplayName = await getSecureOrAsyncItem('Disp_name');

      if (storedDisplayName) {
        console.log(
          'Found display name in secure storage (Disp_name):',
          storedDisplayName,
        );
        setCustomerName(storedDisplayName);

        // Also store under displayName for compatibility
        await setSecureItem('displayName', storedDisplayName);
      } else {
        // Then try the alternate key if Disp_name is not available
        const altDisplayName = await getSecureOrAsyncItem('displayName');
        if (altDisplayName) {
          console.log(
            'Found display name in secure storage (displayName):',
            altDisplayName,
          );
          setCustomerName(altDisplayName);

          // Store under Disp_name for consistency
          await setSecureItem('Disp_name', altDisplayName);
        } else {
          // If display name is not available, try the legacy CUSTOMER_NAME
          const storedCustomerName = await getSecureOrAsyncItem(
            'CUSTOMER_NAME',
          );
          if (storedCustomerName) {
            console.log(
              'Found CUSTOMER_NAME in secure storage:',
              storedCustomerName,
            );
            setCustomerName(storedCustomerName);
          } else {
            // Only use this as a last resort fallback
            console.log(
              'No customer name found, using default: UNICORP ENTERPRISES',
            );
            setCustomerName('UNICORP ENTERPRISES');
          }
        }
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
      // Default fallback
      setCustomerName('UNICORP ENTERPRISES');
    }
  };

  // Validate inputs before actions
  const validateInputs = (filters: ReportFilters) => {
    // Item Category and Item Subcategory are now optional
    // Only checking if dates are valid
    if (filters.fromDate > filters.toDate) {
      Alert.alert('Error', 'From Date cannot be after To Date');
      return false;
    }
    return true;
  };

  // Format date for API (YYYY-MM-DD)
  const formatDateForApi = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // Format date for display (DD/MM/YYYY)
  const formatDate = (date: Date) => {
    return `${date.getDate().toString().padStart(2, '0')}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, '0')}/${date.getFullYear()}`;
  };

  // Format date for filenames (DD-MM-YYYY)
  const formatDateForFilename = (date: Date) => {
    return `${date.getDate().toString().padStart(2, '0')}-${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, '0')}-${date.getFullYear()}`;
  };

  // Handle search/fetch report data
  const fetchReport = async (filters: ReportFilters): Promise<boolean> => {
    if (!validateInputs(filters)) return false;

    try {
      setIsReportLoading(true);
      setIsSearching(true);

      // Build request data with arrays for categories and subcategories
      const requestData = {
        fromDate: formatDateForApi(filters.fromDate),
        toDate: formatDateForApi(filters.toDate),
        customerID: customerID, // Use customerID instead of customerName
        itemCategoryName:
          filters.itemCategories.length > 0
            ? filters.itemCategories.map(cat => cat.trim())
            : null,
        itemSubCategoryName:
          filters.itemSubcategories.length > 0
            ? filters.itemSubcategories.map(subcat => subcat.trim())
            : null,
        unitName: filters.unit.length > 0 ? filters.unit : null, // Changed to handle array
      };

      console.log('==== REQUEST DATA DETAILS ====');
      console.log(
        'URL:',
        isInward
          ? API_ENDPOINTS.GET_INWARD_REPORT
          : API_ENDPOINTS.GET_OUTWARD_REPORT,
      );
      console.log('Request data stringified:', JSON.stringify(requestData));

      // Make API call
      const response = await axios.post(
        isInward
          ? API_ENDPOINTS.GET_INWARD_REPORT
          : API_ENDPOINTS.GET_OUTWARD_REPORT,
        requestData,
        {
          headers: DEFAULT_HEADERS,
        },
      );

      // Log structured response
      console.log(
        `====== ${
          isInward ? 'GET_INWARD_REPORT' : 'GET_OUTWARD_REPORT'
        } API RESPONSE START ======`,
      );
      console.log('Response status:', response.status);
      console.log('Data count:', response.data?.data?.length || 0);

      // Update client-side filtering to handle optional fields (null values)
      if (response.data && response.data.success) {
        // No filtering needed - use the API response data directly
        const filteredData = response.data.data;
        console.log('API returned data count:', filteredData.length);

        // Use the data from the API response directly
        setReportData(filteredData);

        if (filteredData.length === 0) {
          Alert.alert('No Data', 'No records found for the selected criteria.');
        }

        return true;
      } else {
        Alert.alert(
          'Error',
          response.data?.message || 'Failed to fetch report data.',
        );
        return false;
      }
    } catch (error) {
      console.error('Error fetching report data:', error);

      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;
        Alert.alert('Error', `Failed to fetch report: ${errorMessage}`);
      } else {
        Alert.alert('Error', 'An unexpected error occurred.');
      }
      return false;
    } finally {
      setIsReportLoading(false);
      setIsSearching(false);
    }
  };

  // Initialize data on mount
  useEffect(() => {
    fetchCategoriesAndSubcategories();
    fetchCustomerData();
  }, []);

  return {
    // Data
    apiCategories,
    apiSubcategories,
    reportData,
    customerName,
    customerID, // Add customerID to the returned values

    // Loading states
    loading,
    isReportLoading,
    isSearching,

    // Functions
    fetchReport,
    validateInputs,
    formatDate,
    formatDateForFilename,
  };
};
