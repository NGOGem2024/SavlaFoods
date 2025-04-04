import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';

const StockReportScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Stock Report</Text>
      <View style={styles.reportSection}>
        <Text>Current Stock Details</Text>
        {/* Add your stock data rendering logic here */}
        <Text>Total Items: 0</Text>
        <Text>Available Stock: 0</Text>
        <Text>Low Stock Items: 0</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#F48221',
  },
  reportSection: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
});

export default StockReportScreen;
