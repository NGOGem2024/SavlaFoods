// api/searchService.ts
import axios from 'axios';
import { API_BASE_URL, DEFAULT_HEADERS } from '../config/api.config';

export interface SearchResponse {
  success: boolean;
  data: any[];
  message?: string;
  error?: string;
}

// Define specific type interfaces for each search response
export interface CategoryResult {
  CATID: string;
  CATCODE: string;
  CATDESC: string;
  CATEGORY_IMAGE_NAME: string;
}

export interface ItemAndSubCategoryResult {
  ITEM_ID: string;
  ITEM_CODE: string;
  ITEM_NAME: string;
  DESCRIPTION: string;
  ITEM_SUB_CATEGORY_ID: string;
  SUB_CATEGORY_CODE: string;
  SUB_CATEGORY_NAME: string;
  ITEM_CATEG_ID: string;
  ITEM_CATEG_NAME: string;
  SUBCATEGORY_IMAGE_NAME: string;
}

export interface LotNumberResult {
  LOT_NO: string;
  ITEM_MARKS: string;
  VAKAL_NO: string;
  BATCH_NO: string;
  AVAILABLE_QTY: number;
  BALANCE_QTY: number;
  ITEM_ID: string;
  ITEM_CODE: string;
  ITEM_NAME: string;
  DESCRIPTION: string;
  ITEM_CATEG_ID: string;
  ITEM_CATEG_NAME: string;
  ITEM_SUB_CATEGORY_ID: string;
  SUB_CATEGORY_NAME: string;
  UNIT_NAME: string;
}

export interface TypedSearchResponse<T> extends Omit<SearchResponse, 'data'> {
  data: T[];
}

export const searchService = {
  searchCategories: async (
    searchTerm: string, 
    CustomerID: string
  ): Promise<TypedSearchResponse<CategoryResult>> => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/sf/searchCategories`,
        {
          searchTerm,
          CustomerID
        },
        {
          headers: DEFAULT_HEADERS
        }
      );
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw error.response.data;
      }
      throw { success: false, message: 'Network error', error: error.message };
    }
  },

  searchItemsAndSubCategories: async (
    searchTerm: string, 
    CustomerID: string
  ): Promise<TypedSearchResponse<ItemAndSubCategoryResult>> => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/sf/searchItemsAndSubCategories`,
        {
          searchTerm,
          CustomerID
        },
        {
          headers: DEFAULT_HEADERS
        }
      );
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw error.response.data;
      }
      throw { success: false, message: 'Network error', error: error.message };
    }
  },

  searchByLotNumber: async (
    searchTerm: string, 
    CustomerID: string
  ): Promise<TypedSearchResponse<LotNumberResult>> => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/sf/searchByLotNumber`,
        {
          searchTerm,
          CustomerID
        },
        {
          headers: DEFAULT_HEADERS
        }
      );
      return response.data;
    } catch (error: any) {
      if (error.response) {
        throw error.response.data;
      }
      throw { success: false, message: 'Network error', error: error.message };
    }
  }
};

export default searchService;