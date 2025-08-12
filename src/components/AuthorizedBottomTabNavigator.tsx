import React, { useMemo, useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthorization } from '../contexts/AuthorizationContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

// Base screens / stacks
import HomeScreen from '../screens/HomeScreen';
import AlertScreen from '../screens/AlertScreen';
import { 
  OrdersStackNavigator, 
  FinanceStackNavigator, 
  ReportsStackNavigator 
} from './BottomTabNavigator';

// Extract exported stacks from BottomTabNavigator if available
// We re-import the stacks by referencing the default navigator
// but since original file doesn't export stacks, we will keep tab mapping light

const Tab = createBottomTabNavigator();

interface TabConfig {
  name: string;
  component: React.ComponentType<any>;
  icon: (focused: boolean, color: string, size: number) => React.ReactNode;
  label: string;
  moduleIds: number[];
}

const AuthorizedBottomTabNavigator: React.FC = () => {
  const { hasModuleAccess, debugAuthorization } = useAuthorization();

  // Define tabs and associate with module IDs
  const allTabs: TabConfig[] = useMemo(
    () => [
      {
        name: 'Home',
        component: HomeScreen,
        icon: (focused: boolean, color: string, size: number) =>
          focused ? (
            <MaterialIcons name="home" size={size} color={color} />
          ) : (
            <MaterialCommunityIcons name="home-outline" size={size} color={color} />
          ),
        label: 'Home',
        moduleIds: [1, 4],
      },
      {
        name: 'Invoice',
        component: FinanceStackNavigator,
        icon: (_focused: boolean, color: string, size: number) => (
          <MaterialIcons name="account-balance-wallet" size={size} color={color} />
        ),
        label: 'Invoice',
        moduleIds: [2],
      },
      {
        name: 'Orders',
        component: OrdersStackNavigator,
        icon: (_focused: boolean, color: string, size: number) => (
          <FontAwesome name="list-alt" size={size} color={color} />
        ),
        label: 'Orders',
        moduleIds: [1],
      },
      {
        name: 'Reports',
        component: ReportsStackNavigator,
        icon: (focused: boolean, color: string, size: number) =>
          focused ? (
            <MaterialIcons name="assessment" size={size} color={color} />
          ) : (
            <MaterialCommunityIcons name="chart-box-outline" size={size} color={color} />
          ),
        label: 'Reports',
        moduleIds: [5],
      },
      {
        name: 'Alert',
        component: AlertScreen,
        icon: (focused: boolean, color: string, size: number) =>
          focused ? (
            <MaterialIcons name="notifications" size={size} color={color} />
          ) : (
            <MaterialIcons name="notifications-none" size={size} color={color} />
          ),
        label: 'Alerts',
        moduleIds: [1, 4],
      },
    ],
    [],
  );

  const authorizedTabs = useMemo(() => {
    // First check if user has any module access
    const tabsWithModuleAccess = allTabs.filter(tab => tab.moduleIds.some(id => hasModuleAccess(id)));
    
    // If user has module access, return those tabs
    if (tabsWithModuleAccess.length > 0) {
      return tabsWithModuleAccess;
    }
    
    // If no module access, check if user has HomeScreen-only access (for comma RAR case)
    const { userAuthorization } = useAuthorization();
    if (userAuthorization && userAuthorization.allowedScreens.includes('HomeScreen')) {
      // Return only Home tab for HomeScreen-only users
      return allTabs.filter(tab => tab.name === 'Home');
    }
    
    return [];
  }, [allTabs, hasModuleAccess]);

  useEffect(() => {
    debugAuthorization();
  }, [debugAuthorization]);

  if (authorizedTabs.length === 0) {
    return (
      <Tab.Navigator>
        <Tab.Screen
          name="NoAccess"
          component={() => null}
          options={{
            tabBarLabel: 'No Access',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="block" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const tab = authorizedTabs.find(t => t.name === route.name);
          return tab ? tab.icon(focused, color, size) : null;
        },
        tabBarLabelStyle: { fontSize: 13 },
        tabBarActiveTintColor: '#F48221',
        tabBarInactiveTintColor: 'black',
        tabBarStyle: { backgroundColor: '#fff' },
        headerShown: false,
        tabBarHideOnKeyboard: true,
      })}
    >
      {authorizedTabs.map(tab => (
        <Tab.Screen key={tab.name} name={tab.name} component={tab.component} options={{ tabBarLabel: tab.label }} />
      ))}
    </Tab.Navigator>
  );
};

export default AuthorizedBottomTabNavigator;


