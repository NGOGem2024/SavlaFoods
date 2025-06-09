import {useState, useEffect} from 'react';
import {Alert, Platform} from 'react-native';
import {getSecureItem} from '../utils/secureStorage';
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
  unit: string;
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

  // Fetch customer name from secure storage
  const fetchCustomerName = async () => {
    try {
      const storedCustomerName = await getSecureOrAsyncItem('CUSTOMER_NAME');
      if (storedCustomerName) {
        setCustomerName(storedCustomerName);
      } else {
        // Fallback if CUSTOMER_NAME is not in secure storage
        const displayName = await getSecureOrAsyncItem('displayName');
        if (displayName) {
          setCustomerName(displayName);
        } else {
          // Default fallback if neither is available
          setCustomerName('UNICORP ENTERPRISES');
        }
      }
    } catch (error) {
      console.error('Error fetching customer name:', error);
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
        customerName: customerName, // Use customer name from state
        itemCategoryName:
          filters.itemCategories.length > 0
            ? filters.itemCategories.map(cat => cat.trim())
            : null,
        itemSubCategoryName:
          filters.itemSubcategories.length > 0
            ? filters.itemSubcategories.map(subcat => subcat.trim())
            : null,
        unitName: filters.unit ? filters.unit.trim() : null,
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
        // Filter the data based on provided filters only
        const filteredData = response.data.data.filter((item: any) => {
          // Always filter by customer name
          const customerMatch = item.CUSTOMER_NAME === requestData.customerName;

          // Only apply filters for fields that were provided (not null)
          const unitMatch =
            requestData.unitName === null ||
            item.UNIT_NAME === requestData.unitName;

          // Check if item's category is in the selected categories array
          const categoryMatch =
            requestData.itemCategoryName === null ||
            requestData.itemCategoryName.includes(item.ITEM_CATEG_NAME);

          // Check if item's subcategory is in the selected subcategories array
          const subcategoryMatch =
            requestData.itemSubCategoryName === null ||
            requestData.itemSubCategoryName.includes(item.SUB_CATEGORY_NAME);

          return (
            customerMatch && unitMatch && categoryMatch && subcategoryMatch
          );
        });

        console.log('Client-side filtered count:', filteredData.length);

        // Use the filtered data instead of all results
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
    fetchCustomerName();
  }, []);

  return {
    // Data
    apiCategories,
    apiSubcategories,
    reportData,
    customerName,

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
