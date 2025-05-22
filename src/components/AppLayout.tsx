// components/LayoutWrapper.tsx
import React from 'react';
import {View, StyleSheet, SafeAreaView} from 'react-native';
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
      {showTabBar && <TabBar route={route} style={styles.bottom} />}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  bottom: {
    padding: 50,
  },
});
