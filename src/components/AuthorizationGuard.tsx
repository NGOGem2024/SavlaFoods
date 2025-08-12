import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthorization } from '../contexts/AuthorizationContext';

interface AuthorizationGuardProps {
  children: React.ReactNode;
  screenName: string;
  fallbackScreen?: string;
  showLoading?: boolean;
  showError?: boolean;
}

export const AuthorizationGuard: React.FC<AuthorizationGuardProps> = ({
  children,
  screenName,
  fallbackScreen = 'HomeScreen',
  showLoading = true,
  showError = true,
}) => {
  const navigation = useNavigation<any>();
  const { isInitialized, isLoading, isScreenAllowed } = useAuthorization();

  const allowed = isScreenAllowed(screenName);

  useEffect(() => {
    if (isInitialized && !isLoading && !allowed) {
      navigation.navigate(fallbackScreen as never);
    }
  }, [allowed, isInitialized, isLoading, navigation, fallbackScreen]);

  if (!isInitialized || isLoading) {
    if (!showLoading) return null;
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F48221" />
        <Text style={styles.message}>Loading permissions...</Text>
      </View>
    );
  }

  if (!allowed) {
    if (!showError) return null;
    return (
      <View style={styles.center}>
        <Text style={styles.notAllowed}>You are not authorized to view this screen.</Text>
      </View>
    );
  }

  return <>{children}</>;
};

export const withAuthorization = <P extends object>(
  Wrapped: React.ComponentType<P>,
  screenName: string,
  fallbackScreen?: string,
) => {
  const Component: React.FC<P> = props => (
    <AuthorizationGuard screenName={screenName} fallbackScreen={fallbackScreen}>
      <Wrapped {...(props as P)} />
    </AuthorizationGuard>
  );
  Component.displayName = `WithAuthorization(${Wrapped.displayName || Wrapped.name || 'Component'})`;
  return Component;
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  message: {
    marginTop: 8,
    color: '#333',
  },
  notAllowed: {
    color: '#b91c1c',
    fontWeight: '600',
  },
});

export default AuthorizationGuard;


