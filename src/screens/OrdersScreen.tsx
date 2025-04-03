import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';

const OrdersScreen = () => {
  const navigation = useNavigation();

  const menuItems = [
    {
      title: 'Order History',
      icon: 'history',
      screen: 'OrderHistory',
      description: 'View and track all your past orders',
    },
    {
      title: 'Pending Orders',
      icon: 'pending-actions',
      screen: 'PendingOrders',
      description: 'View orders awaiting approval or processing',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Orders Management</Text>
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.screen as never)}>
              <View style={styles.menuIconContainer}>
                <MaterialIcons
                  name={item.icon}
                  size={24}
                  style={{color: '#F48221'}}
                />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuDescription}>{item.description}</Text>
              </View>
              <MaterialIcons
                name="chevron-right"
                size={24}
                style={{color: '#888'}}
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#f8f8f8',
    backgroundColor: '#f4f4f4',
  },
  header: {
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3, // Slightly increased for better depth
    backgroundColor: '#F48221',
    padding: 17,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  menuContainer: {
    marginTop: 20,
    marginHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  menuIconContainer: {
    // backgroundColor: '#FFF3E5',
    backgroundColor: '#FFE7D0',
    padding: 10,
    borderRadius: 10,
  },
  menuTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  menuDescription: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
});

export default OrdersScreen;

// import React from 'react';
// import {
//   StyleSheet,
//   View,
//   Text,
//   TouchableOpacity,
//   ScrollView,
//   SafeAreaView,
//   Alert,
// } from 'react-native';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
// import {StackNavigationProp} from '@react-navigation/stack';
// import {MainStackParamList} from '../type/type';
// import {useCustomer} from '../contexts/DisplayNameContext';

// type OrdersScreenRouteProp = RouteProp<MainStackParamList, 'OrdersScreen'>;
// type OrdersScreenNavigationProp = StackNavigationProp<
//   MainStackParamList,
//   'OrdersScreen'
// >;

// const OrdersScreen = () => {
//   const navigation = useNavigation<OrdersScreenNavigationProp>();
//   const route = useRoute<OrdersScreenRouteProp>();
//   const newOrderData = route.params?.newOrderData;
//   const {customerID} = useCustomer();

//   const handleOrderHistoryNavigation = () => {
//     if (newOrderData) {
//       navigation.navigate('OrderHistoryScreen', {
//         orderId: newOrderData.orderId,
//         orderNo: newOrderData.orderNo,
//         transporterName: newOrderData.transporterName,
//         deliveryDate: newOrderData.deliveryDate,
//         deliveryAddress: newOrderData.deliveryAddress,
//         orderDate: newOrderData.orderDate,
//         items: newOrderData.items,
//         customerID: newOrderData.customerID,
//       });
//     } else {
//       Alert.alert(
//         'Order History',
//         'Please select an order to view its details',
//       );
//     }
//   };

//   const menuItems = [
//     {
//       title: 'Order History',
//       icon: 'history',
//       onPress: handleOrderHistoryNavigation,
//       description: 'View and track all your past orders',
//     },
//     {
//       title: 'Pending Orders',
//       icon: 'pending-actions',
//       onPress: () => {
//         if (customerID) {
//           navigation.navigate('PendingOrdersScreen', {
//             customerID: customerID,
//             orderId: 0,
//             orderNo: '',
//             transporterName: '',
//             deliveryDate: '',
//             deliveryAddress: '',
//             orderDate: '',
//             items: [],
//           });
//         } else {
//           Alert.alert('Error', 'Customer ID not found. Please log in again.');
//         }
//       },
//       description: 'View orders awaiting approval or processing',
//     },
//   ];

//   return (
//     <SafeAreaView style={styles.container}>
//       <ScrollView>
//         <View style={styles.header}>
//           <Text style={styles.headerTitle}>Orders Management</Text>
//         </View>

//         <View style={styles.menuContainer}>
//           {menuItems.map((item, index) => (
//             <TouchableOpacity
//               key={index}
//               style={styles.menuItem}
//               onPress={item.onPress}>
//               <View style={styles.menuIconContainer}>
//                 <MaterialIcons
//                   name={item.icon}
//                   size={24}
//                   style={{color: '#F48221'}}
//                 />
//               </View>
//               <View style={styles.menuTextContainer}>
//                 <Text style={styles.menuTitle}>{item.title}</Text>
//                 <Text style={styles.menuDescription}>{item.description}</Text>
//               </View>
//               <MaterialIcons
//                 name="chevron-right"
//                 size={24}
//                 style={{color: '#888'}}
//               />
//             </TouchableOpacity>
//           ))}
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f4f4f4',
//   },
//   header: {
//     shadowOpacity: 0.15,
//     shadowRadius: 3,
//     elevation: 3,
//     backgroundColor: '#F48221',
//     padding: 17,
//     alignItems: 'center',
//   },
//   headerTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: 'white',
//   },
//   menuContainer: {
//     marginTop: 20,
//     marginHorizontal: 16,
//   },
//   menuItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'white',
//     padding: 16,
//     borderRadius: 10,
//     marginBottom: 12,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 1,
//     },
//     shadowOpacity: 0.2,
//     shadowRadius: 1.41,
//     elevation: 2,
//   },
//   menuIconContainer: {
//     backgroundColor: '#FFE7D0',
//     padding: 10,
//     borderRadius: 10,
//   },
//   menuTextContainer: {
//     flex: 1,
//     marginLeft: 12,
//   },
//   menuTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#333',
//   },
//   menuDescription: {
//     fontSize: 12,
//     color: '#888',
//     marginTop: 4,
//   },
// });

// export default OrdersScreen;
