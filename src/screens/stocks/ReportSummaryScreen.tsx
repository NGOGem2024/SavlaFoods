import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';

const ReportSummaryScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Report Summary</Text>
      <View style={styles.reportSection}>
        <Text style={styles.sectionTitle}>Overall Business Metrics</Text>
        <View style={styles.metricRow}>
          <Text>Total Sales:</Text>
          <Text>$0</Text>
        </View>
        <View style={styles.metricRow}>
          <Text>Total Orders:</Text>
          <Text>0</Text>
        </View>
        <View style={styles.metricRow}>
          <Text>Average Order Value:</Text>
          <Text>$0</Text>
        </View>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
});

export default ReportSummaryScreen;
