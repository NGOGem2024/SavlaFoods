// import type {StackScreenProps} from '@react-navigation/stack';
// // import { OrderContext } from '../contexts/orderContext';

// export interface Item {
//   ITEM_ID: number;
//   ITEM_NAME: string;
//   LOT_NO: string;
//   ITEM_MARKS?: string;
//   VAKAL_NO?: string;
//   AVAILABLE_QTY: number;
//   UNIT_NAME: string;
//   quantity?: number;
// }

// export type OrderHistoryParams = {
//   customerID: string;
//   orderId: number;
//   orderNo: string;
//   transporterName: string;
//   deliveryDate: string;
//   deliveryAddress: string;
//   orderDate: string;
//   items: Array<{
//     ITEM_ID: number;
//     LOT_NO: string;
//     ORDERED_QUANTITY: number;
//     AVAILABLE_QTY: number;
//     ITEM_MARKS: string;
//     VAKAL_NO: string;
//   }>;
// };

// export type RootStackParamList = {
//   SplashScreen: undefined;
//   OtpVerificationScreen: undefined;
//   // customerID?: string | null;

//   Main: {
//     screen: string;
//     params?: {
//       initialLogin?: boolean;
//       customerID?: string;
//     };
//   };
//   HomeScreen: {
//     switchedAccount?: boolean;
//     newCustomerId?: string;
//     timestamp?: number;
//     initialLogin?: boolean;
//     customerID?: string;
//     displayName?: string;
//   };
//   LotReportScreen: {
//     lotNo?: string;
//     itemId?: string;
//     customerID?: string;
//   };
// };

// export type MainStackParamList = {
//   BottomTabNavigator: {
//     screen: string;
//     customerID: string;
//     params: {
//       screen: string;
//       params: {
//         shouldRefresh: boolean;
//         customerID: string;
//       };
//     };
//   };
//   PendingOrdersScreen: {
//     customerID: string;
//     orderId: number;
//     orderNo: string;
//     transporterName: string;
//     remarks: String;
//     orderDate: string;
//     deliveryDate: string;
//     deliveryAddress: string;
//     refreshData?: boolean;
//     updatedOrder?: any;
//     items: Array<{
//       ITEM_ID: number;
//       LOT_NO: string;
//       ORDERED_QUANTITY: number;
//       AVAILABLE_QTY: number;
//       ITEM_MARKS: string;
//       VAKAL_NO: string;
//       UNIT_NAME: string;
//     }>;
//   };
//   GrnDetailsScreen: {
//     customerID: string;
//     grnId: number;
//     grnNo: string;
//     grnDate: string;
//     items: Array<{
//       ITEM_ID: number;
//       LOT_NO: string;
//       QUANTITY: number;
//       ITEM_MARKS?: string;
//       VAKAL_NO?: string;
//       UNIT_NAME: string;
//     }>;
//   };
//   OutwardDetailsScreen: {
//     customerId: string;
//     outwardNo: string;
//     item?: any;
//   };
//   OrderHistoryScreen: {
//     customerID: string;
//     orderId: number;
//     orderNo: string;
//     transporterName: string;
//     remarks: string;
//     deliveryDate: string;
//     deliveryAddress: string;
//     orderDate: string;
//     items: Array<{
//       ITEM_NAME: string;
//       NET_QUANTITY: any;
//       UNIT_NAME: any;
//       REMARK: string;
//       ITEM_ID: number;
//       LOT_NO: string;
//       ORDERED_QUANTITY: number;
//       AVAILABLE_QTY: number;
//       ITEM_MARKS: string;
//       VAKAL_NO: string;
//     }>;
//   };
//   OrderDetailsScreen: {
//     customerID: string;
//     orderId: number;
//     orderNo: string;
//     transporterName: string;
//     remarks: string;
//     deliveryDate: string;
//     orderDate: string;
//     isOrderUpdated?: boolean;
//     items: Array<{
//       ITEM_ID: number;
//       LOT_NO: string;
//       ORDERED_QUANTITY: number;
//       AVAILABLE_QTY: number;
//       ITEM_MARKS: string;
//       VAKAL_NO: string;
//       UNIT_NAME: string;
//     }>;
//   };
//   EditOrderScreen: {
//     customerID: string;
//     orderId: number;
//     orderNo: string;
//     transporterName: string;
//     deliveryDate: string;
//     orderDate: string;
//     items: Array<{
//       ITEM_ID: number;
//       LOT_NO: string;
//       ORDERED_QUANTITY: number;
//       AVAILABLE_QTY: number;
//       ITEM_MARKS: string;
//       VAKAL_NO: string;
//     }>;
//   };
//   QuantitySelectorModal: {
//     item: {
//       item_id: number;
//       lot_no: string;
//       available_qty: number;
//       customerID?: number | string;
//       vakal_no?: string;
//       item_marks?: string;
//       unit_name: string;
//       box_quantity: number;
//     };
//   };
//   PlaceOrderScreen: {
//     selectedItems: {
//       UPDATED_QTY(UPDATED_QTY: any): unknown;
//       LOT_NO: string;
//       VAKAL_NO: string;
//       BALANCE_QTY: any;
//       AVAILABLE_QTY: any;
//       ORDERED_QUANTITY: number;
//       ItemID: number;
//       LotNo: string;
//       Quantity: number;
//       customerID?: string;
//       item_name?: string;
//       unit_name?: string;
//       vakal_no?: string;
//       item_marks?: string;
//       net_quantity: number;
//     }[];
//     userSupervisorId?: number;
//     userMukadamId?: number;
//     stockLotLocationId?: number;
//     deliveryAddress?: string;
//     unitId?: number;
//     finYearId?: number;
//     shouldRefresh: boolean;
//     customerID: string;
//   };
//   OrderConfirmationScreen: {
//     orderItems: Array<{
//       ITEM_ID: number;
//       ITEM_NAME: string;
//       LOT_NO: string;
//       VAKAL_NO: string;
//       ITEM_MARKS: string;
//       UNIT_NAME: string;
//       AVAILABLE_QTY: number;
//       NET_QUANTITY: number;
//       ORDERED_QUANTITY: number;
//       BatchNo?: string | null;
//     }>;
//     customerID: string;
//     userSupervisorId: string;
//     CUST_DELIVERY_ADD?: string;
//     deliveryAddress?: string;
//     userMukadamId: string;
//     stockLotLocationId: string;
//     unitId?: number;
//     finYearId?: number;
//   };

//   SubCategory: {
//     category: string;
//     categoryId: string;
//     customerID: string;
//     subcategoryImage: string;
//   };
//   ItemDetailScreen: {
//     subcategoryId: string;
//     subcategoryName: string;
//     subcategoryImage: string;
//     customerID: string;
//   };
//   OrdersScreen: {
//     newOrderData?: {
//       customerID: string;
//       orderId: number;
//       orderNo: string;
//       transporterName: string;
//       deliveryDate: string;
//       deliveryAddress: string;
//       orderDate: string;
//       items: Array<any>;
//     };
//   };

//   ItemDetailsExpanded: {
//     ItemID: number;
//     itemName: string;
//     customerID: string;
//     updatedStockDetails?: {
//       LOT_NO: string;
//       ITEM_ID: number;
//       VAKAL_NO: string;
//       ITEM_MARKS: string;
//       UNIT_NAME: string | null;
//       AVAILABLE_QUANTITY: number;
//       NET_QUANTITY: number;
//       ORDERED_QUANTITY: number;
//     }[];
//     forceRefresh?: number;
//     LotReportScreen: {
//       lotNo?: string;
//       itemId?: string;
//       customerID?: string;
//     };
//   };
//   CartScreen: undefined;
//   LotReportScreen: {lotNo?: string; itemId?: string; customerID?: string};
// };

// export type MainStackScreenProps<T extends keyof MainStackParamList> =
//   StackScreenProps<MainStackParamList, T>;

// export type RootStackScreenProps<T extends keyof RootStackParamList> =
//   StackScreenProps<RootStackParamList, T>;

// export type SearchType =
//   | 'searchCategories'
//   | 'searchItemsAndSubCategories'
//   | 'searchByLotNumber';

// export interface SearchData {
//   searchType: SearchType;
//   searchQuery: string;
// }


import type {StackScreenProps} from '@react-navigation/stack';
// import { OrderContext } from '../contexts/orderContext';

export interface Item {
  ITEM_ID: number;
  ITEM_NAME: string;
  LOT_NO: string;
  ITEM_MARKS?: string;
  VAKAL_NO?: string;
  AVAILABLE_QTY: number;
  UNIT_NAME: string;
  quantity?: number;
}

export type OrderHistoryParams = {
  customerID: string;
  orderId: number;
  orderNo: string;
  transporterName: string;
  deliveryDate: string;
  deliveryAddress: string;
  orderDate: string;
  items: Array<{
    ITEM_ID: number;
    LOT_NO: string;
    ORDERED_QUANTITY: number;
    AVAILABLE_QTY: number;
    ITEM_MARKS: string;
    VAKAL_NO: string;
  }>;
};

export type RootStackParamList = {
  SplashScreen: undefined;
  OtpVerificationScreen: undefined;
  // customerID?: string | null;

  Main: {
    screen: string;
    params?: {
      initialLogin?: boolean;
      customerID?: string;
    };
  };
  HomeScreen: {
    switchedAccount?: boolean;
    newCustomerId?: string;
    timestamp?: number;
    initialLogin?: boolean;
    customerID?: string;
    displayName?: string;
  };
  LotReportScreen: {
    lotNo?: string;
    itemId?: string;
    customerID?: string;
  };
};

export type MainStackParamList = {
  BottomTabNavigator: {
    screen: string;
    customerID: string;
    params: {
      screen: string;
      params: {
        shouldRefresh: boolean;
        customerID: string;
      };
    };
  };
  PendingOrdersScreen: {
    customerID: string;
    orderId: number;
    orderNo: string;
    transporterName: string;
    remarks: String;
    orderDate: string;
    deliveryDate: string;
    deliveryAddress: string;
    orderBy: string;
    refreshData?: boolean;
    updatedOrder?: any;
    items: Array<{
      ITEM_ID: number;
      LOT_NO: string;
      ORDERED_QUANTITY: number;
      AVAILABLE_QTY: number;
      ITEM_MARKS: string;
      VAKAL_NO: string;
      UNIT_NAME: string;
    }>;
  };
  GrnDetailsScreen: {
    customerID: string;
    grnId: number;
    grnNo: string;
    grnDate: string;
    items: Array<{
      ITEM_ID: number;
      LOT_NO: string;
      QUANTITY: number;
      ITEM_MARKS?: string;
      VAKAL_NO?: string;
      UNIT_NAME: string;
    }>;
  };
  OutwardDetailsScreen: {
    customerId: string;
    outwardNo: string;
    item?: any;
  };
  OrderHistoryScreen: {
    customerID: string;
    orderId: number;
    orderNo: string;
    transporterName: string;
    remarks: string;
    deliveryDate: string;
    deliveryAddress: string;
    orderDate: string;
    items: Array<{
      ITEM_NAME: string;
      NET_QUANTITY: any;
      UNIT_NAME: any;
      REMARK: string;
      ITEM_ID: number;
      LOT_NO: string;
      ORDERED_QUANTITY: number;
      AVAILABLE_QTY: number;
      ITEM_MARKS: string;
      VAKAL_NO: string;
    }>;
  };
  OrderDetailsScreen: {
    customerID: string;
    orderId: number;
    orderNo: string;
    transporterName: string;
    remarks: string;
    deliveryDate: string;
    orderDate: string;
    isOrderUpdated?: boolean;
    items: Array<{
      ITEM_ID: number;
      LOT_NO: string;
      ORDERED_QUANTITY: number;
      AVAILABLE_QTY: number;
      ITEM_MARKS: string;
      VAKAL_NO: string;
      UNIT_NAME: string;
    }>;
  };
  EditOrderScreen: {
    customerID: string;
    orderId: number;
    orderNo: string;
    transporterName: string;
    deliveryDate: string;
    orderDate: string;
    items: Array<{
      ITEM_ID: number;
      LOT_NO: string;
      ORDERED_QUANTITY: number;
      AVAILABLE_QTY: number;
      ITEM_MARKS: string;
      VAKAL_NO: string;
    }>;
  };
  QuantitySelectorModal: {
    item: {
      item_id: number;
      lot_no: string;
      available_qty: number;
      customerID?: number | string;
      vakal_no?: string;
      item_marks?: string;
      unit_name: string;
      box_quantity: number;
    };
  };
  PlaceOrderScreen: {
    selectedItems: {
      UPDATED_QTY(UPDATED_QTY: any): unknown;
      LOT_NO: string;
      VAKAL_NO: string;
      BALANCE_QTY: any;
      AVAILABLE_QTY: any;
      ORDERED_QUANTITY: number;
      ItemID: number;
      LotNo: string;
      Quantity: number;
      customerID?: string;
      item_name?: string;
      unit_name?: string;
      vakal_no?: string;
      item_marks?: string;
      net_quantity: number;
    }[];
    userSupervisorId?: number;
    userMukadamId?: number;
    stockLotLocationId?: number;
    deliveryAddress?: string;
    orderBy?: string;
    unitId?: number;
    finYearId?: number;
    shouldRefresh: boolean;
    customerID: string;
  };
  OrderConfirmationScreen: {
    orderItems: Array<{
      ITEM_ID: number;
      ITEM_NAME: string;
      LOT_NO: string;
      VAKAL_NO: string;
      ITEM_MARKS: string;
      UNIT_NAME: string;
      AVAILABLE_QTY: number;
      NET_QUANTITY: number;
      ORDERED_QUANTITY: number;
      BatchNo?: string | null;
    }>;
    customerID: string;
    userSupervisorId: string;
    CUST_DELIVERY_ADD?: string;
    deliveryAddress?: string;
    orderBy?: string;
    userMukadamId: string;
    stockLotLocationId: string;
    unitId?: number;
    finYearId?: number;
  };

  SubCategory: {
    category: string;
    categoryId: string;
    customerID: string;
    subcategoryImage: string;
  };
  ItemDetailScreen: {
    subcategoryId: string;
    subcategoryName: string;
    subcategoryImage: string;
    customerID: string;
  };
  OrdersScreen: {
    newOrderData?: {
      customerID: string;
      orderId: number;
      orderNo: string;
      transporterName: string;
      deliveryDate: string;
      deliveryAddress: string;
      orderDate: string;
      items: Array<any>;
    };
  };

  ItemDetailsExpanded: {
    ItemID: number;
    itemName: string;
    customerID: string;
    updatedStockDetails?: {
      LOT_NO: string;
      ITEM_ID: number;
      VAKAL_NO: string;
      ITEM_MARKS: string;
      UNIT_NAME: string | null;
      AVAILABLE_QUANTITY: number;
      NET_QUANTITY: number;
      ORDERED_QUANTITY: number;
    }[];
    forceRefresh?: number;
    LotReportScreen: {
      lotNo?: string;
      itemId?: string;
      customerID?: string;
    };
  };
  CartScreen: undefined;
  LotReportScreen: {lotNo?: string; itemId?: string; customerID?: string};
};

export type MainStackScreenProps<T extends keyof MainStackParamList> =
  StackScreenProps<MainStackParamList, T>;

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  StackScreenProps<RootStackParamList, T>;

export type SearchType =
  | 'searchCategories'
  | 'searchItemsAndSubCategories'
  | 'searchByLotNumber';

export interface SearchData {
  searchType: SearchType;
  searchQuery: string;
}