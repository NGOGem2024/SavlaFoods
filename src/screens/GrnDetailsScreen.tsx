import React from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { DataTable } from 'react-native-paper';

const GrnDetailsScreen = () => {
  // Sample data based on the image
  const headerDetails = {
    partyName: 'UNICORP ENTERPRISES',
    date: '30/11/2024',
    address: 'F-28,APMC MARKET-1,PHASE-2,SEC-19,TURBHE,VASHI,NAVI MUMBAI,MAHARASHTRA,INDIA. PINCODE-400703',
    billMaking: 'YES',
    preGrnNo: '15340',
    gatePassNo: '40317',
    vehicleNo: 'MH 46 F 3774',
  };

  const grnDetails = [
    {
      id: 1,
      lotNo: '122093',
      item: 'KALI DRAKH BOX 15',
      itemMarks: 'HWR',
      vakalNo: 'HI-150',
      batchNo: '-',
      expiryDate: '-',
      location: '-',
      scheme: 'REGULAR NORMAL',
      quantity: '15',
      recievedQty: '15',
      deletedQty: '0',
      balancedQty: '0',
      transhipment: 'NO',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>GRN Details</Text>
      </View>

      <View style={styles.detailsContainer}>
        <Text style={styles.sectionTitle}>GRN HEADER DETAILS</Text>
        
        <View style={styles.rowContainer}>
          <View style={styles.leftColumn}>
            <Text style={styles.labelText}>PARTY'S NAME</Text>
            <Text style={styles.valueText}>{headerDetails.partyName}</Text>
            
            <Text style={[styles.labelText, styles.spacer]}>DATE</Text>
            <Text style={styles.valueText}>{headerDetails.date}</Text>
            
            <Text style={[styles.labelText, styles.spacer]}>ADDRESS</Text>
            <Text style={styles.valueText}>{headerDetails.address}</Text>
            
            <Text style={[styles.labelText, styles.spacer]}>BILL MAKING</Text>
            <Text style={styles.valueText}>{headerDetails.billMaking}</Text>
          </View>
          
          <View style={styles.rightColumn}>
            <Text style={styles.labelText}>PRE GRN NO.</Text>
            <Text style={styles.valueText}>{headerDetails.preGrnNo}</Text>
            
            <Text style={[styles.labelText, styles.spacer]}>GATE PASS NO.</Text>
            <Text style={styles.valueText}>{headerDetails.gatePassNo}</Text>
            
            <Text style={[styles.labelText, styles.spacer]}>VEHICLE NO.</Text>
            <Text style={styles.valueText}>{headerDetails.vehicleNo}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.detailsTableContainer}>
        <Text style={styles.sectionTitle}>GRN DETAILS</Text>
        
        <ScrollView horizontal>
          <DataTable style={styles.dataTable}>
            <DataTable.Header>
              <DataTable.Title style={styles.smallColumn}>#</DataTable.Title>
              <DataTable.Title style={styles.mediumColumn}>Lot No</DataTable.Title>
              <DataTable.Title style={styles.largeColumn}>Item</DataTable.Title>
              <DataTable.Title style={styles.mediumColumn}>Item Marks</DataTable.Title>
              <DataTable.Title style={styles.mediumColumn}>Vakal No</DataTable.Title>
              <DataTable.Title style={styles.mediumColumn}>Batch No</DataTable.Title>
              <DataTable.Title style={styles.mediumColumn}>Expiry Date</DataTable.Title>
              <DataTable.Title style={styles.mediumColumn}>Location</DataTable.Title>
              <DataTable.Title style={styles.largeColumn}>Scheme</DataTable.Title>
              <DataTable.Title style={styles.smallColumn}>Quantity</DataTable.Title>
              <DataTable.Title style={styles.smallColumn}>Recieved Qty</DataTable.Title>
              <DataTable.Title style={styles.smallColumn}>Deleted Qty</DataTable.Title>
              <DataTable.Title style={styles.smallColumn}>Balanced Qty</DataTable.Title>
              <DataTable.Title style={styles.mediumColumn}>Transhipment</DataTable.Title>
            </DataTable.Header>

            {grnDetails.map((item) => (
              <DataTable.Row key={item.id}>
                <DataTable.Cell style={styles.smallColumn}>{item.id}</DataTable.Cell>
                <DataTable.Cell style={styles.mediumColumn}>{item.lotNo}</DataTable.Cell>
                <DataTable.Cell style={styles.largeColumn}>{item.item}</DataTable.Cell>
                <DataTable.Cell style={styles.mediumColumn}>{item.itemMarks}</DataTable.Cell>
                <DataTable.Cell style={styles.mediumColumn}>{item.vakalNo}</DataTable.Cell>
                <DataTable.Cell style={styles.mediumColumn}>{item.batchNo}</DataTable.Cell>
                <DataTable.Cell style={styles.mediumColumn}>{item.expiryDate}</DataTable.Cell>
                <DataTable.Cell style={styles.mediumColumn}>{item.location}</DataTable.Cell>
                <DataTable.Cell style={styles.largeColumn}>{item.scheme}</DataTable.Cell>
                <DataTable.Cell style={styles.smallColumn}>{item.quantity}</DataTable.Cell>
                <DataTable.Cell style={styles.smallColumn}>{item.recievedQty}</DataTable.Cell>
                <DataTable.Cell style={styles.smallColumn}>{item.deletedQty}</DataTable.Cell>
                <DataTable.Cell style={styles.smallColumn}>{item.balancedQty}</DataTable.Cell>
                <DataTable.Cell style={styles.mediumColumn}>{item.transhipment}</DataTable.Cell>
              </DataTable.Row>
            ))}

            <DataTable.Row>
              <DataTable.Cell style={styles.smallColumn}>{''}</DataTable.Cell>
              <DataTable.Cell style={styles.mediumColumn}>{''}</DataTable.Cell>
              <DataTable.Cell style={styles.largeColumn}>Total</DataTable.Cell>
              <DataTable.Cell style={styles.mediumColumn}>{''}</DataTable.Cell>
              <DataTable.Cell style={styles.mediumColumn}>{''}</DataTable.Cell>
              <DataTable.Cell style={styles.mediumColumn}>{''}</DataTable.Cell>
              <DataTable.Cell style={styles.mediumColumn}>{''}</DataTable.Cell>
              <DataTable.Cell style={styles.mediumColumn}>{''}</DataTable.Cell>
              <DataTable.Cell style={styles.largeColumn}>{''}</DataTable.Cell>
              <DataTable.Cell style={styles.smallColumn}>15</DataTable.Cell>
              <DataTable.Cell style={styles.smallColumn}>15</DataTable.Cell>
              <DataTable.Cell style={styles.smallColumn}>0</DataTable.Cell>
              <DataTable.Cell style={styles.smallColumn}>0</DataTable.Cell>
              <DataTable.Cell style={styles.mediumColumn}>{' '}</DataTable.Cell>
            </DataTable.Row>
          </DataTable>
        </ScrollView>
      </View>
    </ScrollView>
  );
};

const windowWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 10,
    marginHorizontal: 10,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    color: '#d35400',
    fontWeight: 'bold',
    marginBottom: 15,
    fontSize: 16,
  },
  rowContainer: {
    flexDirection: windowWidth > 600 ? 'row' : 'column',
    justifyContent: 'space-between',
  },
  leftColumn: {
    flex: 1,
    marginRight: windowWidth > 600 ? 20 : 0,
  },
  rightColumn: {
    flex: 1,
    marginTop: windowWidth > 600 ? 0 : 15,
  },
  labelText: {
    color: '#555',
    fontWeight: '500',
    fontSize: 14,
  },
  valueText: {
    color: '#333',
    marginTop: 2,
    marginBottom: 5,
    fontSize: 14,
  },
  spacer: {
    marginTop: 10,
  },
  detailsTableContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 10,
    marginHorizontal: 10,
    marginBottom: 20,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dataTable: {
    minWidth: windowWidth - 50,
  },
  smallColumn: {
    flex: 0.5,
  },
  mediumColumn: {
    flex: 1,
  },
  largeColumn: {
    flex: 1.5,
  },
});

export default GrnDetailsScreen;
