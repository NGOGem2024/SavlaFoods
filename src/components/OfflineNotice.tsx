import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import { useNetwork } from '../contexts/NetworkContext';

const { width } = Dimensions.get('window');

const OfflineNotice: React.FC = () => {
  const { isConnected } = useNetwork();
  const [reconnecting, setReconnecting] = useState(false);
  const [wasDisconnected, setWasDisconnected] = useState(false);
  const translateY = useState(new Animated.Value(-50))[0];
  const opacity = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (isConnected === false) {
      // Network is disconnected
      setWasDisconnected(true);
      setReconnecting(false);
      
      // Animate in
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (isConnected === true && wasDisconnected) {
      // Just reconnected - show "Reconnected" message briefly
      setReconnecting(true);
      
      // Keep banner visible with new message
      setTimeout(() => {
        // Hide banner after 2 seconds
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -50,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setWasDisconnected(false);
          setReconnecting(false);
        });
      }, 2000);
    }
  }, [isConnected, wasDisconnected, translateY, opacity]);

  if (isConnected && !wasDisconnected) {
    return null;
  }

  return (
    <Animated.View 
      style={[
        styles.offlineContainer,
        reconnecting ? styles.reconnectedContainer : {},
        { 
          transform: [{ translateY }],
          opacity
        }
      ]}
    >
      <Text style={styles.offlineText}>
        {reconnecting ? 'Connected! Refreshing data...' : 'No internet connection'}
      </Text>
    </Animated.View>
  );
};

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
  reconnectedContainer: {
    backgroundColor: '#28a745',
  },
  offlineText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default OfflineNotice; 