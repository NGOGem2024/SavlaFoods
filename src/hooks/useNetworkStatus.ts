import {useEffect, useState} from 'react';
import NetInfo from '@react-native-community/netinfo';
import {Alert} from 'react-native';

/**
 * Custom hook for monitoring network connectivity status
 * @param {boolean} showAlert - Whether to show an alert when network status changes
 * @returns {boolean | null} Current network connectivity status
 */
const useNetworkStatus = (showAlert = false): boolean | null => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    // Function to handle network state changes
    const handleNetworkChange = (state: any) => {
      setIsConnected(state.isConnected);

      // Show alert if specified and connection status changes
      if (showAlert) {
        if (!state.isConnected) {
          Alert.alert(
            'No Internet Connection',
            'Please check your network connection and try again.',
            [{text: 'OK'}],
          );
        }
      }
    };

    // Subscribe to network info updates
    const unsubscribe = NetInfo.addEventListener(handleNetworkChange);

    // Initial check
    NetInfo.fetch().then(handleNetworkChange);

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [showAlert]);

  return isConnected;
};

export default useNetworkStatus;
