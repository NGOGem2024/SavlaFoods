import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';

const LotReportScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Lot Report</Text>
      <View style={styles.reportSection}>
        <Text>Lot Tracking Information</Text>
        {/* Add your lot data rendering logic here */}
        <Text>Total Lots: 0</Text>
        <Text>Active Lots: 0</Text>
        <Text>Expired Lots: 0</Text>
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

export default LotReportScreen;
