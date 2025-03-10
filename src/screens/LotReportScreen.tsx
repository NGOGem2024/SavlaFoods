import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const outwardData = [
  { outNo: 'DC103524', date: '01/12/2021', vehicle: 'MH 17 AG 6604', deliveredTo: 'F-28', qty: 1 },
  { outNo: 'DC106871', date: '09/12/2021', vehicle: 'MH 04 AG 7880', deliveredTo: 'F-28', qty: 2 },
  { outNo: 'DC45023', date: '29/07/2022', vehicle: 'MH 04 AG 7880', deliveredTo: 'F-28', qty: 2 },
  { outNo: 'DC57232', date: '29/08/2022', vehicle: 'MH 17 AG 6604', deliveredTo: 'F-28', qty: 2 },
  { outNo: 'DC9954', date: '29/04/2023', vehicle: 'MH 17 AG 6604', deliveredTo: 'F-28', qty: 1 },
];

const LotReportScreen = () => {
  const [selectedTab, setSelectedTab] = useState<'Inwards' | 'Outwards'>('Outwards');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.enterpriseName}>UNICORP ENTERPRISES</Text>
        <TouchableOpacity style={styles.cartButton}>
          <MaterialIcons name="shopping-cart" size={25} style={{color:"#007bff"}} />
        </TouchableOpacity>
      </View>

      <View style={styles.detailsContainer}>
        <Text style={styles.lotNo}>Lot No: <Text style={styles.lotNoHighlight}>138909</Text></Text>
        <Text style={styles.detailText}>Unit Name: <Text style={styles.detailBold}>D-39</Text></Text>
        <Text style={styles.detailText}>Item Description: <Text style={styles.detailBold}>BADAM KERNAL BOX 10</Text></Text>
        <Text style={styles.detailText}>Item Mark: <Text style={styles.detailBold}>SSJ</Text></Text>
        <Text style={styles.detailText}>Vakkal: <Text style={styles.detailBold}>ES</Text></Text>
        <Text style={styles.detailText}>Balance Qty: <Text style={styles.detailBold}>11</Text></Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'Inwards' && styles.activeTab]}
          onPress={() => setSelectedTab('Inwards')}
        >
          <Text style={[styles.tabText, selectedTab === 'Inwards' && styles.activeTabText]}>Inwards</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'Outwards' && styles.activeTab]}
          onPress={() => setSelectedTab('Outwards')}
        >
          <Text style={[styles.tabText, selectedTab === 'Outwards' && styles.activeTabText]}>Outwards</Text>
        </TouchableOpacity>
      </View>

      {selectedTab === 'Outwards' && (
        <FlatList
          data={outwardData}
          keyExtractor={(item) => item.outNo}
          renderItem={({ item, index }) => (
            <View style={[styles.tableRow, index % 2 === 0 ? styles.evenRow : styles.oddRow]}>
              <Text style={styles.tableCell}>{item.outNo}</Text>
              <Text style={styles.tableCell}>{item.date}</Text>
              <Text style={styles.tableCell}>{item.vehicle}</Text>
              <Text style={styles.tableCell}>{item.deliveredTo}</Text>
              <Text style={styles.tableCell}>{item.qty}</Text>
            </View>
          )}
          ListHeaderComponent={() => (
            <View style={styles.tableHeader}>
              <Text style={styles.headerCell}>Outward No</Text>
              <Text style={styles.headerCell}>Outward Date</Text>
              <Text style={styles.headerCell}>Vehicle</Text>
              <Text style={styles.headerCell}>Delivered To</Text>
              <Text style={styles.headerCell}>Out Qty</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
  },
  enterpriseName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007bff',
  },
  cartButton: {
    padding: 10,
  },
  detailsContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
    marginBottom: 20,
  },
  lotNo: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  lotNoHighlight: {
    color: '#ff5733',
  },
  detailText: {
    fontSize: 16,
    marginVertical: 2,
    color: '#333',
  },
  detailBold: {
    fontWeight: '600',
    color: '#000',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    padding: 10,
    backgroundColor: '#F28C28',
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  activeTab: {
    backgroundColor: '#007bff',
  },
  tabText: {
    fontSize: 14,
    color: '#555',
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#fff',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  evenRow: {
    backgroundColor: '#f9f9f9',
  },
  oddRow: {
    backgroundColor: '#ffffff',
  },
  tableCell: {
    flex: 1,
    textAlign: 'center',
    color: '#333',
    fontSize: 14,
  },
  headerCell: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default LotReportScreen;
