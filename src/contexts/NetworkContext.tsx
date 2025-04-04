import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

// Define the context type
interface NetworkContextType {
  isConnected: boolean | null;
  addRetryCallback: (id: string, callback: () => void) => void;
  removeRetryCallback: (id: string) => void;
}

// Create the context with default values
const NetworkContext = createContext<NetworkContextType>({
  isConnected: null,
  addRetryCallback: () => {},
  removeRetryCallback: () => {}
});

// Custom hook to use the context
export const useNetwork = () => useContext(NetworkContext);

// The provider component
export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [showMessage, setShowMessage] = useState(false);
  const [previousConnected, setPreviousConnected] = useState<boolean | null>(true);
  const [retryCallbacks, setRetryCallbacks] = useState<Record<string, () => void>>({});

  // Add a callback to be executed when internet connectivity is restored
  const addRetryCallback = useCallback((id: string, callback: () => void) => {
    setRetryCallbacks(prev => ({
      ...prev,
      [id]: callback
    }));
  }, []);

  // Remove a callback
  const removeRetryCallback = useCallback((id: string) => {
    setRetryCallbacks(prev => {
      const newCallbacks = { ...prev };
      delete newCallbacks[id];
      return newCallbacks;
    });
  }, []);

  useEffect(() => {
    // Execute all retry callbacks when internet is restored
    if (isConnected === true && previousConnected === false) {
      // Execute all registered callbacks
      Object.values(retryCallbacks).forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('Error executing network retry callback:', error);
        }
      });
    }
    
    setPreviousConnected(isConnected);
  }, [isConnected, previousConnected, retryCallbacks]);

  useEffect(() => {
    // Subscribe to network info updates
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
      setShowMessage(!state.isConnected);
    });

    // Initial check
    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected);
      setShowMessage(!state.isConnected);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <NetworkContext.Provider value={{ isConnected, addRetryCallback, removeRetryCallback }}>
      {children}
      {showMessage && (
        <View style={styles.offlineContainer}>
          <Text style={styles.offlineText}>No internet connection</Text>
        </View>
      )}
    </NetworkContext.Provider>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  offlineContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#b52424',
    padding: 10,
    alignItems: 'center',
    width: width,
    zIndex: 1000,
  },
  offlineText: {
    color: '#fff',
    fontWeight: 'bold',
  },
}); 