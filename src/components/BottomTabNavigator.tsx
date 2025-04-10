// //Mine
// import React, {createContext, useContext, useState} from 'react';
// import {StyleSheet, View, TouchableOpacity, Text} from 'react-native';
// import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
// import {createStackNavigator} from '@react-navigation/stack';
// import {useNavigation, CommonActions} from '@react-navigation/native';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// import {ParamListBase} from '@react-navigation/native';

// // Import your screens
// import HomeScreen from '../screens/HomeScreen';
// import AlertScreen from '../screens/AlertScreen';
// import OrdersScreen from '../screens/OrdersScreen';
// import OrderHistoryScreen from '../screens/OrderHistoryScreen';
// // import PendingOrdersScreen from '../screens/';
// // import InwardOutwardReportScreen from '../screens/InwardOutwardReportScreen';
// import {CustomerProvider} from '../contexts/DisplayNameContext';
// import PendingOrdersScreen from '../screens/PendingOrdersScreen';

// // import StockReportScreen from '../screens/stocks/StockReportScreen';
// // import LotReportScreen from '../screens/LotReportScreen';
// // import ReportSummaryScreen from '../screens/stocks/ReportSummaryScreen';

// type TabParamList = {
//   Home: undefined;
//   Announcement: undefined;
//   Alert: undefined;
//   Search: {
//     customerID?: string;
//   };
//   Orders: undefined;
//   OrderHistory: undefined;
//   PendingOrders: undefined;
// } & ParamListBase;

// // Create Stack Navigator for Orders section
// const OrdersStack = createStackNavigator<TabParamList>();
// // const ReportsStack = createStackNavigator<TabParamList>();

// const OrdersStackNavigator = () => {
//   return (
//     <OrdersStack.Navigator
//       screenOptions={{
//         headerStyle: {
//           // backgroundColor: '#F48221',
//           backgroundColor: '#fff',
//         },
//         headerTintColor: '#F48221',
//       }}>
//       <OrdersStack.Screen
//         name="OrdersHome" // Renamed to avoid duplicate name
//         component={OrdersScreen}
//         options={{headerShown: false}}
//       />
//       <OrdersStack.Screen name="OrderHistory" component={OrderHistoryScreen} />

//       <OrdersStack.Screen
//         name="PendingOrders"
//         component={PendingOrdersScreen}
//         options={{title: 'Pending Orders'}}
//       />
//     </OrdersStack.Navigator>
//   );
// };

// // const ReportsStackNavigator = () => {
// //   return (
// //     <ReportsStack.Navigator
// //       screenOptions={{
// //         headerStyle: {
// //           backgroundColor: '#fff',
// //         },
// //         headerTintColor: '#F48221',
// //       }}>
// //       <ReportsStack.Screen
// //         name="Reports"
// //         component={ReportsScreen}
// //         options={{title: 'Reports'}}
// //       />
// //       <ReportsStack.Screen
// //         name="StockReport"
// //         component={StockReportScreen}
// //         options={{title: 'Stock Report'}}
// //       />
// //       <ReportsStack.Screen
// //         name="LotReport"
// //         component={LotReportScreen}
// //         options={{title: 'Lot Report'}}
// //       />
// //       <ReportsStack.Screen
// //         name="InwardOutwardReport"
// //         component={InwardOutwardReportScreen}
// //         options={{title: 'Inward/Outward Report'}}
// //       />
// //       <ReportsStack.Screen
// //         name="ReportSummary"
// //         component={ReportSummaryScreen}
// //         options={{title: 'Report Summary'}}
// //       />
// //     </ReportsStack.Navigator>
// //   );
// // };

// // Temporary Reports Screen until individual report screens are created
// // const ReportsScreen = ({navigation}: {navigation: any}) => {
// //   const reportItems = [
// //     {
// //       name: 'StockReport',
// //       title: 'Stock Report',
// //       icon: 'inventory',
// //     },
// //     {
// //       name: 'LotReport',
// //       title: 'Lot Report',
// //       icon: 'list',
// //     },
// //     {
// //       name: 'InwardOutwardReport',
// //       title: 'Inward/Outward Report',
// //       icon: 'swap-horiz',
// //     },
// //     {
// //       name: 'ReportSummary',
// //       title: 'Summary',
// //       icon: 'summarize',
// //     },
// //   ];
// //   return (
// //     <View style={{flex: 1, padding: 16}}>
// //       {reportItems.map(item => (
// //         <TouchableOpacity
// //           key={item.name}
// //           style={{
// //             flexDirection: 'row',
// //             alignItems: 'center',
// //             padding: 16,
// //             borderBottomWidth: 1,
// //             borderBottomColor: '#ddd',
// //           }}
// //           onPress={() => navigation.navigate(item.name)}>
// //           <MaterialIcons
// //             name={item.icon}
// //             size={24}
// //             color="#F48221"
// //             style={{marginRight: 16}}
// //           />
// //           <Text style={{fontSize: 16}}>{item.title}</Text>
// //         </TouchableOpacity>
// //       ))}
// //     </View>
// //   );
// // };

// interface OrderContextType {
//   orderDetails: any;
//   setOrderDetails: (details: any) => void;
// }

// export const OrderContext = createContext<OrderContextType>({
//   orderDetails: null,
//   setOrderDetails: () => {},
// });

// const Tab = createBottomTabNavigator<TabParamList>();

// interface NavigationHistoryContextType {
//   history: string[];
//   addToHistory: (route: string) => void;
//   getPreviousRoute: () => string | null;
// }

// // Create a context to manage navigation history
// export const NavigationHistoryContext =
//   createContext<NavigationHistoryContextType>({
//     history: [],
//     addToHistory: () => {},
//     getPreviousRoute: () => null,
//   });

// export const NavigationHistoryProvider: React.FC<{
//   children: React.ReactNode;
// }> = ({children}) => {
//   const [history, setHistory] = useState<string[]>([]);

//   const addToHistory = (route: string) => {
//     setHistory(prev => [...prev, route]);
//   };

//   const getPreviousRoute = () => {
//     if (history.length < 2) return null;
//     return history[history.length - 2];
//   };

//   return (
//     <NavigationHistoryContext.Provider
//       value={{history, addToHistory, getPreviousRoute}}>
//       {children}
//     </NavigationHistoryContext.Provider>
//   );
// };

// export const TabBar = (props: any) => {
//   const navigation = useNavigation();
//   const {getPreviousRoute, addToHistory} = useContext(NavigationHistoryContext);

//   const tabs = [
//     {name: 'Home', icon: 'home', label: 'Home'},
//     // {name: 'Search', icon: 'search', label: 'Search'},
//     {name: 'Alert', icon: props.route?.name === 'Alert' ? 'notifications' : 'notifications-none', label: 'Alerts'},
//     {name: 'Orders', icon: 'list-alt', label: 'Orders'},
//   ];

//   // Enhanced tab press handler with route history
//   const onTabPress = (routeName: string) => {
//     if (routeName === props.route?.name) {
//       return;
//     }

//     // Add current route to history before navigating
//     if (props.route?.name) {
//       addToHistory(props.route.name);
//     }

//     if (['Home', 'Alert', 'Orders'].includes(routeName)) {
//       const currentParams = props.route?.params;
//       const navigationParams: any = {
//         screen: routeName,
//         params: {
//           previousRoute: props.route?.name,
//           customerID: currentParams?.customerID,
//           shouldRefresh: true,
//         },
//       };

//       navigation.navigate('BottomTabNavigator', navigationParams);
//     } else if (
//       props.customTabNavigation &&
//       props.customTabNavigation[routeName]
//     ) {
//       props.customTabNavigation[routeName]();
//     } else {
//       navigation.navigate(routeName as never);
//     }
//   };

//   // Handle back navigation
//   const handleBack = () => {
//     const previousRoute = getPreviousRoute();
//     if (previousRoute) {
//       navigation.navigate(previousRoute);
//     }
//   };

//   return (
//     <View style={styles.tabBar}>
//       {getPreviousRoute() && (
//         <TouchableOpacity style={styles.backButton} onPress={handleBack}>
//           <MaterialIcons name="arrow-back" size={24} color="black" />
//         </TouchableOpacity>
//       )}

//       {tabs.map(tab => (
//         <TouchableOpacity
//           key={tab.name}
//           style={styles.tabItem}
//           onPress={() => onTabPress(tab.name)}>
//           <MaterialIcons
//             name={tab.icon}
//             size={24}
//             color={props.route?.name === tab.name ? '#F48221' : 'black'}
//           />
//           <Text
//             style={[
//               styles.tabLabel,
//               {color: props.route?.name === tab.name ? '#F48221' : 'black'},
//             ]}>
//             {tab.label}
//           </Text>
//         </TouchableOpacity>
//       ))}
//     </View>
//   );
// };

// const BottomTabNavigator: React.FC = () => {
//   const getIconName = (routeName: string, focused: boolean): string => {
//     switch (routeName) {
//       case 'Home':
//         return 'home';
//       case 'Search':
//         return 'search';
//       case 'Alert':
//         return 'notifications-none';
//       case 'Orders':
//         return 'list-alt';
//       default:
//         return 'circle';
//     }
//   };

//   return (
//     <CustomerProvider>
//       <NavigationHistoryProvider>
//         <Tab.Navigator
//           screenOptions={({route}) => ({
//             tabBarIcon: ({focused, color, size}) => {
//               const iconName = getIconName(route.name, focused);
//               return (
//                 <MaterialIcons name={iconName} size={size} color={color} />
//               );
//             },
//             tabBarActiveTintColor: '#F48221',
//             tabBarInactiveTintColor: 'black',
//             tabBarStyle: styles.tabBar,
//             headerShown: false,
//             tabBarHideOnKeyboard: true,
//           })}>
//           <Tab.Screen name="Home" component={HomeScreen} />
//           {/* <Tab.Screen
//             name="Search"
//             component={SearchScreen}
//             options={{
//               headerShown: false,
//             }}
//           /> */}
//           {/* <Tab.Screen
//             name="Reports"
//             component={ReportsStackNavigator}
//             options={{title: 'Reports'}}
//           /> */}
//           <Tab.Screen name="Alert" component={AlertScreen} />
//           <Tab.Screen name="Orders" component={OrdersStackNavigator} />
//         </Tab.Navigator>
//       </NavigationHistoryProvider>
//     </CustomerProvider>
//   );
// };

// const styles = StyleSheet.create({
//   tabBar: {
//     flexDirection: 'row',
//     backgroundColor: '#fff',
//     borderTopColor: '#ddd',
//     borderTopWidth: 1,
//     elevation: 8,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: -2,
//     },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//   },
//   tabItem: {
//     flex: 1,
//     alignItems: 'center',
//     paddingVertical: 8,
//   },
//   tabLabel: {
//     fontSize: 12,
//     marginTop: 2,
//   },
//   backButton: {
//     position: 'absolute',
//     left: 8,
//     top: 8,
//     zIndex: 1,
//   },
// });

// export default BottomTabNavigator;

// Vaishnavi
import React, {createContext, useContext, useState} from 'react';
import {StyleSheet, View, TouchableOpacity, Text} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import {useNavigation, CommonActions} from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {ParamListBase} from '@react-navigation/native';

// Import your screens
import HomeScreen from '../screens/HomeScreen';
import AlertScreen from '../screens/AlertScreen';
import OrdersScreen from '../screens/OrdersScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import InwardOutwardReportScreen from '../screens/InwardOutwardReportScreen';
import {CustomerProvider} from '../contexts/DisplayNameContext';
import PendingOrdersScreen from '../screens/PendingOrdersScreen';

import StockReportScreen from '../screens/stocks/StockReportScreen';
import LotReportScreen from '../screens/LotReportScreen';
import ReportSummaryScreen from '../screens/stocks/ReportSummaryScreen';

type TabParamList = {
  Home: undefined;
  Announcement: undefined;
  Alert: undefined;
  Search: {
    customerID?: string;
  };
  Orders: undefined;
  OrderHistory: undefined;
  PendingOrders: undefined;
} & ParamListBase;

// Create Stack Navigator for Orders section
const OrdersStack = createStackNavigator<TabParamList>();
const ReportsStack = createStackNavigator<TabParamList>();

const OrdersStackNavigator = () => {
  return (
    <OrdersStack.Navigator
      screenOptions={{
        headerStyle: {
          // backgroundColor: '#F48221',
          backgroundColor: '#fff',
        },
        headerTintColor: '#F48221',
      }}>
      <OrdersStack.Screen
        name="OrdersHome" // Renamed to avoid duplicate name
        component={OrdersScreen}
        options={{headerShown: false}}
      />
      <OrdersStack.Screen name="OrderHistory" component={OrderHistoryScreen} />

      <OrdersStack.Screen
        name="PendingOrders"
        component={PendingOrdersScreen}
        options={{title: 'Pending Orders'}}
      />
    </OrdersStack.Navigator>
  );
};

const ReportsStackNavigator = () => {
  return (
    <ReportsStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#fff',
        },
        headerTintColor: '#F48221',
      }}>
      <ReportsStack.Screen
        name="Reports"
        component={ReportsScreen}
        options={{title: 'Reports'}}
      />
      <ReportsStack.Screen
        name="StockReport"
        component={StockReportScreen}
        options={{title: 'Stock Report'}}
      />
      <ReportsStack.Screen
        name="LotReport"
        component={LotReportScreen}
        options={{title: 'Lot Report'}}
      />
      <ReportsStack.Screen
        name="InwardOutwardReport"
        component={InwardOutwardReportScreen}
        options={{title: 'Inward/Outward Report'}}
      />
      <ReportsStack.Screen
        name="ReportSummary"
        component={ReportSummaryScreen}
        options={{title: 'Report Summary'}}
      />
    </ReportsStack.Navigator>
  );
};

// Temporary Reports Screen until individual report screens are created
const ReportsScreen = ({navigation}: {navigation: any}) => {
  const reportItems = [
    {
      name: 'StockReport',
      title: 'Stock Report',
      icon: 'inventory',
    },
    {
      name: 'LotReport',
      title: 'Lot Report',
      icon: 'list',
    },
    {
      name: 'InwardOutwardReport',
      title: 'Inward/Outward Report',
      icon: 'swap-horiz',
    },
    {
      name: 'ReportSummary',
      title: 'Summary',
      icon: 'summarize',
    },
  ];
  return (
    <View style={{flex: 1, padding: 16}}>
      {reportItems.map(item => (
        <TouchableOpacity
          key={item.name}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#ddd',
          }}
          onPress={() => navigation.navigate(item.name)}>
          <MaterialIcons
            name={item.icon}
            size={24}
            color="#F48221"
            style={{marginRight: 16}}
          />
          <Text style={{fontSize: 16}}>{item.title}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

interface OrderContextType {
  orderDetails: any;
  setOrderDetails: (details: any) => void;
}

export const OrderContext = createContext<OrderContextType>({
  orderDetails: null,
  setOrderDetails: () => {},
});

const Tab = createBottomTabNavigator<TabParamList>();

interface NavigationHistoryContextType {
  history: string[];
  addToHistory: (route: string) => void;
  getPreviousRoute: () => string | null;
}

// Create a context to manage navigation history
export const NavigationHistoryContext =
  createContext<NavigationHistoryContextType>({
    history: [],
    addToHistory: () => {},
    getPreviousRoute: () => null,
  });

export const NavigationHistoryProvider: React.FC<{
  children: React.ReactNode;
}> = ({children}) => {
  const [history, setHistory] = useState<string[]>([]);

  const addToHistory = (route: string) => {
    setHistory(prev => [...prev, route]);
  };

  const getPreviousRoute = () => {
    if (history.length < 2) return null;
    return history[history.length - 2];
  };

  return (
    <NavigationHistoryContext.Provider
      value={{history, addToHistory, getPreviousRoute}}>
      {children}
    </NavigationHistoryContext.Provider>
  );
};

export const TabBar = (props: any) => {
  const navigation = useNavigation();
  const {getPreviousRoute, addToHistory} = useContext(NavigationHistoryContext);

  const tabs = [
    {name: 'Home', icon: 'home', label: 'Home'},
    // {name: 'Search', icon: 'search', label: 'Search'},
    {
      name: 'Alert',
      icon:
        props.route?.name === 'Alert' ? 'notifications' : 'notifications-none',
      label: 'Alerts',
    },
    {name: 'Orders', icon: 'list-alt', label: 'Orders'},
  ];

  // Enhanced tab press handler with route history
  const onTabPress = (routeName: string) => {
    if (routeName === props.route?.name) {
      return;
    }

    // Add current route to history before navigating
    if (props.route?.name) {
      addToHistory(props.route.name);
    }

    if (['Home', 'Alert', 'Orders'].includes(routeName)) {
      const currentParams = props.route?.params;
      const navigationParams: any = {
        screen: routeName,
        params: {
          previousRoute: props.route?.name,
          customerID: currentParams?.customerID,
          shouldRefresh: true,
        },
      };

      navigation.navigate('BottomTabNavigator', navigationParams);
    } else if (
      props.customTabNavigation &&
      props.customTabNavigation[routeName]
    ) {
      props.customTabNavigation[routeName]();
    } else {
      navigation.navigate(routeName as never);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    const previousRoute = getPreviousRoute();
    if (previousRoute) {
      navigation.navigate(previousRoute);
    }
  };

  return (
    <View style={styles.tabBar}>
      {getPreviousRoute() && (
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <MaterialIcons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
      )}

      {tabs.map(tab => (
        <TouchableOpacity
          key={tab.name}
          style={styles.tabItem}
          onPress={() => onTabPress(tab.name)}>
          <MaterialIcons
            name={tab.icon}
            size={24}
            color={props.route?.name === tab.name ? '#F48221' : 'black'}
          />
          <Text
            style={[
              styles.tabLabel,
              {color: props.route?.name === tab.name ? '#F48221' : 'black'},
            ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const BottomTabNavigator: React.FC = () => {
  const getIconName = (routeName: string, focused: boolean): string => {
    switch (routeName) {
      case 'Home':
        return 'home';
      case 'Search':
        return 'search';
      case 'Alert':
        return 'notifications-none';
      case 'Orders':
        return 'list-alt';
      default:
        return 'circle';
    }
  };

  return (
    <CustomerProvider>
      <NavigationHistoryProvider>
        <Tab.Navigator
          screenOptions={({route}) => ({
            tabBarIcon: ({focused, color, size}) => {
              const iconName = getIconName(route.name, focused);
              return (
                <MaterialIcons name={iconName} size={size} color={color} />
              );
            },
            tabBarActiveTintColor: '#F48221',
            tabBarInactiveTintColor: 'black',
            tabBarStyle: styles.tabBar,
            headerShown: false,
            tabBarHideOnKeyboard: true,
          })}>
          <Tab.Screen name="Home" component={HomeScreen} />
          {/* <Tab.Screen
            name="Search"
            component={SearchScreen}
            options={{
              headerShown: false,
            }}
          /> */}
          <Tab.Screen
            name="Reports"
            component={ReportsStackNavigator}
            options={{title: 'Reports'}}
          />
          <Tab.Screen name="Alert" component={AlertScreen} />
          <Tab.Screen name="Orders" component={OrdersStackNavigator} />
        </Tab.Navigator>
      </NavigationHistoryProvider>
    </CustomerProvider>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopColor: '#ddd',
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  backButton: {
    position: 'absolute',
    left: 8,
    top: 8,
    zIndex: 1,
  },
});

export default BottomTabNavigator;
