import {useState, useEffect, useCallback} from 'react';
import {Alert, Platform} from 'react-native';
import {getSecureItem, setSecureItem} from '../utils/secureStorage';
import {getSecureOrAsyncItem} from '../utils/migrationHelper';
import axios from 'axios';
import {API_ENDPOINTS, DEFAULT_HEADERS, API_BASE_URL} from '../config/api.config';
import apiClient from '../utils/apiClient';

// Define types for new API response
interface CategoryItem {
  id: number;
  name: string;
  available: boolean;
}

interface SubcategoryItem {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
  available: boolean;
}

interface NewApiResponse {
  success: boolean;
  allCategories: CategoryItem[];
  allSubCategories: SubcategoryItem[];
  availableCategories: CategoryItem[];
  availableSubCategories: SubcategoryItem[];
  data: any[];
  count: number;
  categoryAvailability: {[key: string]: boolean};
  subCategoryAvailability: {[key: string]: boolean};
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
  const [apiSubcategoryData, setApiSubcategoryData] = useState<SubcategoryItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  // Add customerID state
  const [customerID, setCustomerID] = useState('');

  // State for report data
  const [reportData, setReportData] = useState<any[]>([]);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Helper function to process new API response
  const processNewApiResponse = (categoryData: CategoryItem[], subcategoryData: SubcategoryItem[]) => {
    // Save the original category data with availability status
    setApiData(categoryData);
    setApiSubcategoryData(subcategoryData);

    // Process categories (unique values only) - use name field
    // But preserve the availability status by taking the first occurrence of each unique name
    const uniqueCategoriesMap = new Map<string, CategoryItem>();
    categoryData.forEach(category => {
      if (!uniqueCategoriesMap.has(category.name)) {
        uniqueCategoriesMap.set(category.name, category);
      }
    });
    
    const uniqueCategories = Array.from(uniqueCategoriesMap.values()).map(cat => cat.name);
    setApiCategories(uniqueCategories);

    // Process subcategories by category
    const subcatMap: SubcategoriesMap = {};
    uniqueCategories.forEach(category => {
      // Find the category ID for this category name
      const categoryItem = categoryData.find(item => item.name === category);
      if (categoryItem) {
        // Filter subcategories by categoryId
        const categorySubcategories = subcategoryData
          .filter(subcat => subcat.categoryId === categoryItem.id)
          .map(subcat => subcat.name);
        subcatMap[category] = categorySubcategories;
      }
    });

    setApiSubcategories(subcatMap);
  };

  // Function to get category options with disabled state
  const getCategoryOptions = useCallback(() => {
    const options = apiData.map(category => ({
      label: category.name,
      value: category.name,
      disabled: !category.available, // Disable if not available
    }));
    
    return options;
  }, [apiData]);

  // Function to get subcategory options with disabled state for a specific category
  const getSubcategoryOptions = useCallback((categoryName: string) => {
    const categoryItem = apiData.find(item => item.name === categoryName);
    if (!categoryItem) {
      return [];
    }

    // Get all subcategories for this category
    const subcategories = apiSubcategoryData.filter(subcat => 
      subcat.categoryId === categoryItem.id
    );

    return subcategories.map(subcat => ({
      label: subcat.name,
      value: subcat.name,
      disabled: !subcat.available, // Disable if not available
    }));
  }, [apiData, apiSubcategoryData]);

  // Function to fetch categories and subcategories from new API with date parameters
  const fetchCategoriesAndSubcategories = useCallback(async (fromDate?: Date, toDate?: Date) => {
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

      // Only proceed if both dates are provided
      if (!fromDate || !toDate) {
        setLoading(false);
        return;
      }

      const formatDateForApi = (date: Date) => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          '0',
        )}-${String(date.getDate()).padStart(2, '0')}`;
      };

      const requestData = {
        fromDate: formatDateForApi(fromDate),
        toDate: formatDateForApi(toDate),
        customerID: parseInt(customerID),
        itemCategoryName: null,
        itemSubCategoryName: null,
        unitName: null
      };

      // Choose endpoint based on isInward
      const endpoint = isInward
        ? API_ENDPOINTS.GET_ALL_CATEGORIES_SUBCATEGORIES
        : API_ENDPOINTS.GET_ALL_CATEGORIES_SUBCATEGORIES_OUTWARD;

      console.log(`🔍 [useReportData] Mode: ${isInward ? 'INWARD' : 'OUTWARD'}`);
      console.log(`🔍 [useReportData] Selected endpoint: ${endpoint}`);

      try {
        // Try using the apiClient utility first
        const response = await apiClient.post<NewApiResponse>(
          endpoint.replace(API_BASE_URL, ''),
          requestData,
        );

        if (response && response.allCategories && response.allSubCategories) {
          // Process the response data
          processNewApiResponse(response.allCategories, response.allSubCategories);
        } else {
          // Fallback to direct axios call
          const directResponse = await axios.post<NewApiResponse>(
            endpoint,
            requestData,
            {
              headers: DEFAULT_HEADERS,
            },
          );

          if (
            directResponse.data &&
            directResponse.data.allCategories &&
            directResponse.data.allSubCategories
          ) {
            processNewApiResponse(
              directResponse.data.allCategories,
              directResponse.data.allSubCategories,
            );
          } else {
            Alert.alert('Error', 'Failed to load categories. Invalid response format.');
          }
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          // Handle Axios specific errors
          const errorMessage = error.response
            ? `Server error: ${error.response.status}`
            : error.message;

          Alert.alert(
            'Connection Error',
            `Failed to connect to server: ${errorMessage}`,
          );
        } else {
          Alert.alert('Error', 'Failed to load categories. Please try again.');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [isInward]); // Add isInward to dependency array so function updates when mode changes

  // Fetch customer data (name and ID) from secure storage
  const fetchCustomerData = async () => {
    try {
      // Fetch customer ID
      const storedCustomerID = await getSecureOrAsyncItem('customerID');
      if (storedCustomerID) {
        setCustomerID(storedCustomerID);
      }

      // First try to get the display name from Disp_name, as this is the current user's name
      // This is what OtpVerificationScreen.tsx stores during login
      const storedDisplayName = await getSecureOrAsyncItem('Disp_name');

      if (storedDisplayName) {
        setCustomerName(storedDisplayName);
        // Also store under displayName for compatibility
        await setSecureItem('displayName', storedDisplayName);
      } else {
        // Then try the alternate key if Disp_name is not available
        const altDisplayName = await getSecureOrAsyncItem('displayName');
        if (altDisplayName) {
          setCustomerName(altDisplayName);
          // Store under Disp_name for consistency
          await setSecureItem('Disp_name', altDisplayName);
        } else {
          // If display name is not available, try the legacy CUSTOMER_NAME
          const storedCustomerName = await getSecureOrAsyncItem(
            'CUSTOMER_NAME',
          );
          if (storedCustomerName) {
            setCustomerName(storedCustomerName);
          } else {
            // Only use this as a last resort fallback
            setCustomerName('UNICORP ENTERPRISES');
          }
        }
      }
    } catch (error) {
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
    getCategoryOptions,
    getSubcategoryOptions,
    fetchCategoriesAndSubcategories, // Add this function to the return
  };
};
