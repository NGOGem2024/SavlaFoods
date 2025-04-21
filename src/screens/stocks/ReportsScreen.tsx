// // src/screens/ReportsScreen.tsx
// import React from 'react';
// import {
//   View,
//   TouchableOpacity,
//   Text,
//   StyleSheet,
//   SafeAreaView,
//   ScrollView,
// } from 'react-native';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// import {useNavigation} from '@react-navigation/native';
// import {LayoutWrapper} from '../../components/AppLayout';
// import {useRoute} from '@react-navigation/native';

// const ReportsScreen = () => {
//   const navigation = useNavigation();
//   const route = useRoute();

//   const reportItems = [
//     // {
//     //   name: 'StockReport',
//     //   title: 'Stock Report',
//     //   icon: 'inventory',
//     // },
//     // {
//     //   name: 'LotReport',
//     //   title: 'Lot Report',
//     //   icon: 'list',
//     // },
//     {
//       name: 'InwardOutwardReport',
//       title: 'Inward/Outward Report',
//       icon: 'swap-horiz',
//     },
//     {
//       name: 'ReportSummary',
//       title: 'Summary',
//       icon: 'summarize',
//     },
//   ];

//   return (
//     <LayoutWrapper showHeader={true} route={route} showTabBar={false}>
//       <SafeAreaView style={styles.container}>
//         <ScrollView>
//           <View style={styles.header}>
//             <Text style={styles.headerTitle}>Reports</Text>
//           </View>

//           <View style={styles.container}>
//             {reportItems.map(item => (
//               <TouchableOpacity
//                 key={item.name}
//                 style={styles.reportItem}
//                 onPress={() => navigation.navigate(item.name)}>
//                 <MaterialIcons
//                   name={item.icon}
//                   size={24}
//                   color="#F48221"
//                   style={styles.icon}
//                 />
//                 <Text style={styles.title}>{item.title}</Text>
//               </TouchableOpacity>
//             ))}
//           </View>
//         </ScrollView>
//       </SafeAreaView>
//     </LayoutWrapper>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 16,
//   },
//   header: {
//     shadowOpacity: 0.15,
//     shadowRadius: 3,
//     elevation: 3, // Slightly increased for better depth
//     backgroundColor: '#F48221',
//     padding: 17,
//     alignItems: 'center',
//     marginTop: 10,
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: 'white',
//   },
//   reportItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#ddd',
//   },
//   icon: {
//     marginRight: 16,
//   },
//   title: {
//     fontSize: 16,
//   },
// });

// export default ReportsScreen;

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
import {useNavigation, useRoute} from '@react-navigation/native';
import {LayoutWrapper} from '../../components/AppLayout';

const ReportsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const reportItems = [
    {
      title: 'Inward/Outward Report',
      icon: 'swap-horiz',
      screen: 'InwardOutwardReport',
      description: 'View all inward and outward transactions',
    },
    // {
    //   title: 'Summary',
    //   icon: 'summarize',
    //   screen: 'ReportSummary',
    //   description: 'View summary reports and analytics',
    // },
  ];

  return (
    <LayoutWrapper showHeader={true} route={route} showTabBar={false}>
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Reports</Text>
          </View>

          <View style={styles.menuContainer}>
            {reportItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={() => navigation.navigate(item.screen as never)}>
                <View style={styles.menuIconContainer}>
                  <MaterialIcons
                    name={item.icon}
                    size={24}
                    style={{color: '#0284c7'}}
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
    </LayoutWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    backgroundColor: '#F48221',
    padding: 17,
    alignItems: 'center',
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 18,
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
    backgroundColor: '#e0f2fe',
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

export default ReportsScreen;
