// components/LayoutWrapper.tsx
import React from 'react';
import {View, StyleSheet, SafeAreaView, Platform} from 'react-native';
import Header from './Header';
import {useDisplayName} from '../contexts/DisplayNameContext';
import {useCartNavigation} from '../hooks/useCartNavigation';
import {TabBar} from './BottomTabNavigator';

interface LayoutWrapperProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showTabBar?: boolean;
  route: any;
}

export const LayoutWrapper: React.FC<LayoutWrapperProps> = ({
  children,
  showHeader = true,
  showTabBar = true,
  route,
}) => {
  const {displayName} = useDisplayName();
  const {cartItemCount, handleCartPress, handleAccountSwitch} =
    useCartNavigation();

  return (
    <SafeAreaView style={styles.container}>
      {showHeader && (
        <Header
          displayName={displayName}
          cartItemCount={cartItemCount}
          onCartPress={handleCartPress}
          onAccountSwitch={handleAccountSwitch}
        />
      )}
      <View style={styles.content}>{children}</View>
      {showTabBar && <TabBar route={route} />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    // Ensure consistent padding across platforms
    paddingTop: 0,
  },
  content: {
    flex: 1,
  },
});
