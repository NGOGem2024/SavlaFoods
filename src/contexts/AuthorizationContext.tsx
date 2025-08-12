import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getSecureItem, setSecureItem, removeSecureItem } from '../utils/secureStorage';
import {
  RARModule,
  UserAuthorization,
  ScreenAuthorization,
  RAR_MODULES,
  getModulesByRAR,
  getScreensByRAR,
  getScreenAuthorization as getScreenAuthorizationUtil,
  isScreenAuthorized as isScreenAuthorizedUtil,
  parseRARString,
} from '../type/authorization';

interface AuthorizationContextType {
  userAuthorization: UserAuthorization | null;
  isLoading: boolean;
  isInitialized: boolean;
  initializeAuthorization: () => Promise<void>;
  setUserAuthorization: (rarValues: number[]) => Promise<void>;
  clearAuthorization: () => Promise<void>;
  isScreenAllowed: (screenName: string) => boolean;
  getScreenAuthorization: (screenName: string) => ScreenAuthorization | null;
  getAllowedScreens: () => string[];
  getAllowedModules: () => RARModule[];
  hasModuleAccess: (moduleId: number) => boolean;
  debugAuthorization: () => void;
}

const AuthorizationContext = createContext<AuthorizationContextType | undefined>(undefined);

interface AuthorizationProviderProps {
  children: ReactNode;
}

export const AuthorizationProvider: React.FC<AuthorizationProviderProps> = ({ children }) => {
  const [userAuthorization, setUserAuthorizationState] = useState<UserAuthorization | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const initializeAuthorization = async () => {
    try {
      setIsLoading(true);
      const rarString = await getSecureItem('RAR');
      console.log('Initializing authorization with RAR:', rarString);
      
      if (rarString) {
        const rarValues = parseRARString(rarString);
        console.log('Parsed RAR values:', rarValues);
        
        if (rarValues.length > 0) {
          const allowedScreens = getScreensByRAR(rarValues);
          const allowedModules = getModulesByRAR(rarValues);
          setUserAuthorizationState({ rarValues, allowedScreens, allowedModules });
          console.log('Authorization set with modules:', allowedModules.map(m => m.name));
        } else {
          // Check if RAR is just a comma or empty - give only HomeScreen access
          if (rarString === ',' || rarString === '","' || rarString.trim() === '') {
            console.log('RAR is just a comma or empty, providing HomeScreen-only access');
            const homeScreenOnly = ['HomeScreen'];
            const homeScreenModule = [
              {
                id: 0,
                name: 'Home Only',
                screens: homeScreenOnly
              }
            ];
            setUserAuthorizationState({ 
              rarValues: [], 
              allowedScreens: homeScreenOnly, 
              allowedModules: homeScreenModule 
            });
            console.log('HomeScreen-only authorization set successfully');
          } else {
            console.log('No valid RAR values found, setting authorization to null');
            setUserAuthorizationState(null);
          }
        }
      } else {
        console.log('No RAR string found, setting authorization to null');
        setUserAuthorizationState(null);
      }
    } catch (error) {
      console.error('Error initializing authorization:', error);
      setUserAuthorizationState(null);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  const setUserAuthorization = async (rarValues: number[]) => {
    console.log('Setting user authorization with RAR values:', rarValues);
    const rarString = rarValues.join(',');
    await setSecureItem('RAR', rarString);
    const allowedScreens = getScreensByRAR(rarValues);
    const allowedModules = getModulesByRAR(rarValues);
    setUserAuthorizationState({ rarValues, allowedScreens, allowedModules });
    console.log('User authorization set successfully with modules:', allowedModules.map(m => m.name));
  };

  const clearAuthorization = async () => {
    await removeSecureItem('RAR');
    setUserAuthorizationState(null);
  };

  const isScreenAllowed = (screenName: string): boolean => {
    if (!userAuthorization) return false;
    
    // First check if user has RAR values (normal authorization)
    if (userAuthorization.rarValues.length > 0) {
      return isScreenAuthorizedUtil(screenName, userAuthorization.rarValues);
    }
    
    // If no RAR values, check allowedScreens (for comma RAR case)
    return userAuthorization.allowedScreens.includes(screenName);
  };

  const getScreenAuthorization = (screenName: string): ScreenAuthorization | null => {
    if (!userAuthorization) return null;
    return getScreenAuthorizationUtil(screenName, userAuthorization.rarValues);
  };

  const getAllowedScreens = (): string[] => userAuthorization?.allowedScreens || [];
  const getAllowedModules = (): RARModule[] => userAuthorization?.allowedModules || [];

  const hasModuleAccess = (moduleId: number): boolean => {
    return userAuthorization?.rarValues.includes(moduleId) || false;
  };

  const debugAuthorization = () => {
    if (!__DEV__) return;
    // eslint-disable-next-line no-console
    console.log('Auth Debug', {
      userAuthorization,
      allowedScreens: getAllowedScreens(),
      allowedModules: getAllowedModules(),
    });
  };

  useEffect(() => {
    initializeAuthorization();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthorizationContext.Provider
      value={{
        userAuthorization,
        isLoading,
        isInitialized,
        initializeAuthorization,
        setUserAuthorization,
        clearAuthorization,
        isScreenAllowed,
        getScreenAuthorization,
        getAllowedScreens,
        getAllowedModules,
        hasModuleAccess,
        debugAuthorization,
      }}
    >
      {children}
    </AuthorizationContext.Provider>
  );
};

export const useAuthorization = (): AuthorizationContextType => {
  const ctx = useContext(AuthorizationContext);
  if (!ctx) throw new Error('useAuthorization must be used within an AuthorizationProvider');
  return ctx;
};

export const useScreenAuthorization = (screenName: string) => {
  const { isScreenAllowed, getScreenAuthorization } = useAuthorization();
  return {
    isAllowed: isScreenAllowed(screenName),
    authorization: getScreenAuthorization(screenName),
  };
};

export const useModuleAuthorization = (moduleId: number) => {
  const { hasModuleAccess, getAllowedModules } = useAuthorization();
  return {
    hasAccess: hasModuleAccess(moduleId),
    allowedModules: getAllowedModules(),
  };
};

export const useIsStockViewerOnly = (): boolean => {
  const { userAuthorization } = useAuthorization();
  return (
    !!userAuthorization &&
    userAuthorization.rarValues.length === 1 &&
    userAuthorization.rarValues[0] === 4
  );
};

// New helper: user can add to cart only if they have RAR 1 (Create Order)
export const useCanAddToCart = (): boolean => {
  const { userAuthorization } = useAuthorization();
  return !!userAuthorization && userAuthorization.rarValues.includes(1);
};

// Helper: user has any authorization (including fallback for no RAR)
export const useHasAnyAuthorization = (): boolean => {
  const { userAuthorization } = useAuthorization();
  return !!userAuthorization && (userAuthorization.rarValues.length > 0 || userAuthorization.allowedScreens.length > 0);
};


