import React, {createContext, useContext, useState, useEffect} from 'react';
import {getSecureItem} from '../utils/secureStorage';
import {getSecureOrAsyncItem} from '../utils/migrationHelper';

type CustomerContextType = {
  customerID: string | null;
  setCustomerID: (id: string | null) => void;
};

export const CustomerContext = createContext<CustomerContextType | undefined>(
  undefined,
);

export const CustomerProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [customerID, setCustomerID] = useState<string | null>(null);

  useEffect(() => {
    // Load customerID from secure storage when the app starts
    const loadCustomerID = async () => {
      const storedID = await getSecureOrAsyncItem('customerID');
      if (storedID) {
        setCustomerID(storedID);
      }
    };
    loadCustomerID();
  }, []);

  return (
    <CustomerContext.Provider value={{customerID, setCustomerID}}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
};

type DisplayNameContextType = {
  displayName: string | null;
  setDisplayName: (name: string | null) => void;
};

const DisplayNameContext = createContext<DisplayNameContextType | undefined>(
  undefined,
);

export const DisplayNameProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    // Load display name from secure storage when the app starts
    const loadDisplayName = async () => {
      try {
        // First try to get from Disp_name (current login format)
        let storedName = await getSecureOrAsyncItem('Disp_name');
        
        // If not found, try displayName (legacy format)
        if (!storedName) {
          storedName = await getSecureOrAsyncItem('displayName');
        }
        
        if (storedName) {
          console.log('Loaded display name from storage:', storedName);
          setDisplayName(storedName);
        } else {
          console.log('No display name found in storage');
        }
      } catch (error) {
        console.error('Error loading display name:', error);
      }
    };
    
    loadDisplayName();
  }, []);

  return (
    <DisplayNameContext.Provider
      value={{
        displayName,
        setDisplayName,
      }}>
      {children}
    </DisplayNameContext.Provider>
  );
};

export const useDisplayName = () => {
  const context = useContext(DisplayNameContext);
  if (context === undefined) {
    throw new Error('useDisplayName must be used within a DisplayNameProvider');
  }
  return context;
};
