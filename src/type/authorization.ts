// Authorization types and helpers for RAR-based access control

export interface RARModule {
  id: number;
  name: string;
  screens: string[];
}

export interface AuthorizationConfig {
  modules: RARModule[];
}

export interface UserAuthorization {
  rarValues: number[];
  allowedScreens: string[];
  allowedModules: RARModule[];
}

export interface ScreenAuthorization {
  screenName: string;
  moduleId: number;
  moduleName: string;
  isAuthorized: boolean;
}

// RAR Module definitions
export const RAR_MODULES: RARModule[] = [
  {
    id: 1,
    name: 'Create Order',
    screens: [
      'HomeScreen',
      'SubCategory',
      'ItemDetailScreen',
      'ItemDetailsExpanded',
      'QuantitySelectorModal',
      'PlaceOrderScreen',
      'OrderConfirmationScreen',
      'OrdersScreen',
      'PendingOrdersScreen',
      'OrderHistoryScreen',
      'OrderDetailsScreen',
      'EditOrderScreen',
    ],
  },
  {
    id: 2,
    name: 'Accounts',
    screens: ['InvoiceScreen', 'InvoiceReportScreen', 'InvoiceDetailsScreen'],
  },
  {
    id: 3,
    name: 'Config',
    screens: [], // No screens for now
  },
  {
    id: 4,
    name: 'Stock Search',
    screens: ['HomeScreen', 'SubCategory', 'ItemDetailScreen', 'ItemDetailsExpanded'],
  },
  {
    id: 5,
    name: 'Reports',
    screens: [
      'ReportsScreen',
      'StockReportScreen',
      'LotReportScreen',
      'ReportSummaryScreen',
      'InwardOutwardReportScreen',
    ],
  },
];

// Helper functions
export const getModuleById = (id: number): RARModule | undefined => {
  return RAR_MODULES.find(module => module.id === id);
};

export const getModuleByName = (name: string): RARModule | undefined => {
  return RAR_MODULES.find(module => module.name === name);
};

export const getScreensByRAR = (rarValues: number[]): string[] => {
  const allowedScreens: string[] = [];
  const unique = new Set<string>();

  rarValues.forEach(rarId => {
    const module = getModuleById(rarId);
    if (module) {
      module.screens.forEach(screen => {
        if (!unique.has(screen)) {
          unique.add(screen);
          allowedScreens.push(screen);
        }
      });
    }
  });

  return allowedScreens;
};

export const getModulesByRAR = (rarValues: number[]): RARModule[] => {
  const modules: RARModule[] = [];
  rarValues.forEach(id => {
    const mod = getModuleById(id);
    if (mod) modules.push(mod);
  });
  return modules;
};

export const isScreenAuthorized = (screenName: string, rarValues: number[]): boolean => {
  const screens = getScreensByRAR(rarValues);
  return screens.includes(screenName);
};

export const getScreenAuthorization = (
  screenName: string,
  rarValues: number[],
): ScreenAuthorization => {
  let moduleId = 0;
  let moduleName = 'Unknown';

  for (const mod of RAR_MODULES) {
    if (mod.screens.includes(screenName)) {
      moduleId = mod.id;
      moduleName = mod.name;
      break;
    }
  }

  return {
    screenName,
    moduleId,
    moduleName,
    isAuthorized: isScreenAuthorized(screenName, rarValues),
  };
};

export const parseRARString = (rarRaw: string | number[] | null | undefined): number[] => {
  try {
    if (rarRaw == null) return [];

    if (Array.isArray(rarRaw)) {
      return rarRaw
        .map(v => Number(v))
        .filter(v => Number.isFinite(v) && v >= 1 && v <= 5);
    }

    const rarString = String(rarRaw).trim();
    
    // Handle edge cases: empty string, single comma, or just whitespace
    if (rarString.length === 0 || rarString === ',' || rarString === '","' || /^[\s,]+$/.test(rarString)) {
      console.log('RAR parsing: Empty or invalid RAR value detected:', rarRaw);
      return [];
    }

    // Try JSON array format e.g. "[1,4]"
    if (rarString.startsWith('[') && rarString.endsWith(']')) {
      const parsed = JSON.parse(rarString);
      if (Array.isArray(parsed)) {
        return parsed
          .map(v => Number(v))
          .filter(v => Number.isFinite(v) && v >= 1 && v <= 5);
      }
    }

    // Fallback: comma/space separated values e.g. "1,4" or "1 4"
    const tokens = rarString.split(/[\s,]+/).filter(token => token.trim().length > 0);
    const result = tokens
      .map(token => Number(token.trim()))
      .filter(v => Number.isFinite(v) && v >= 1 && v <= 5);
    
    console.log('RAR parsing: Input:', rarRaw, 'Parsed tokens:', tokens, 'Result:', result);
    return result;
  } catch (error) {
    console.error('RAR parsing error:', error, 'Input:', rarRaw);
    return [];
  }
};


