import { ParamListBase } from '@react-navigation/native';

// Stack Navigation Types
export type RootStackParamList = {
  Search: {
    customerID: string;
  };
  Home: {
    searchResults: CategoryResult[];
    customerID: string;
  };
  SubCategory: { 
    searchResults: ItemAndSubCategoryResult[];
    categoryName?: string;
    customerID: string;
  };
  ItemDetailsExpanded: { 
    lotData: LotNumberResult;
    fromSearch?: boolean;
    customerID: string;
  };
};

// Tab Navigation Types
export type TabParamList = {
  Home: undefined;
  Announcement: undefined;
  Search: {
    customerID: string;
  };
  Report: undefined;
  Alert: undefined;
  OrderHistoryScreen: undefined;
} & ParamListBase;

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