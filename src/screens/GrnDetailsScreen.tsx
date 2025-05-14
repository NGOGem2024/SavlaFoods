import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api.config';
import { RouteProp } from '@react-navigation/native';

// Define types for the API response
interface GrnHeaderDetails {
  CUSTOMER_NAME: string;
  PRE_GRN_NO: string | number;
  GRN_DATE: string;
  GATEPASS_NO: string;
  ADDRESS: string;
  VEHICLE_NO: string;
  BILL_MAKING: string;
}

interface GrnItemDetails {
  LOT_NO: number;
  ITEM_NAME: string;
  ITEM_MARKS: string;
  VAKAL_NO: string | null;
  BATCH_NO: string | null;
  EXPIRY_DATE: string | null;
  LOCATION: string;
  SCHEME: string;
  QUANTITY: number;
  RECEIVED_QTY: number;
  DELETED_QTY: number;
  BALANCE_QTY: number;
  IS_TRANSSHIPMENT: string;
}

// Define types for route params
interface RouteParams {
  grnNo: string;
  customerId: string;
  item?: any;
}

type GrnDetailsScreenRouteProp = RouteProp<{ GrnDetailsScreen: RouteParams }, 'GrnDetailsScreen'>;

interface GrnDetailsProps {
  route: GrnDetailsScreenRouteProp;
}

const GrnDetailsScreen: React.FC<GrnDetailsProps> = ({ route }) => {
  // Extract parameters from route
  const { grnNo, customerId } = route.params || {};
  
  // State for API data
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [headerDetails, setHeaderDetails] = useState<GrnHeaderDetails>({
    CUSTOMER_NAME: '',
    PRE_GRN_NO: '',
    GRN_DATE: '',
    GATEPASS_NO: '',
    ADDRESS: '',
    VEHICLE_NO: '',
    BILL_MAKING: ''
  });
  const [grnDetails, setGrnDetails] = useState<GrnItemDetails[]>([]);

  // Fetch data from API
  useEffect(() => {
    const fetchGrnDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Log the parameters for debugging
        console.log(`Fetching GRN details for GRN No: ${grnNo}, CustomerID: ${customerId}`);
        
        // Construct the API URL with the grnNo path parameter and customerId query parameter
        const url = `${API_ENDPOINTS.GET_GRN_DETAILS}/${grnNo}?customerId=${customerId}`;
        console.log('API URL:', url);
        
        const response = await axios.get(url);
        
        // Log the response for debugging
        console.log('API Response:', JSON.stringify(response.data, null, 2));
        
        if (response.data) {
          // Set header details
          setHeaderDetails(response.data.header || {
            CUSTOMER_NAME: '',
            PRE_GRN_NO: '',
            GRN_DATE: '',
            GATEPASS_NO: '',
            ADDRESS: '',
            VEHICLE_NO: '',
            BILL_MAKING: ''
          });
          
          // Filter out the total row to display separately
          const details = response.data.details || [];
          if (details.length > 0) {
            const lastRow = details[details.length - 1];
            
            // Check if the last row is a total row (has only quantity fields)
            if (!lastRow.LOT_NO && lastRow.QUANTITY !== undefined) {
              setGrnDetails(details.slice(0, -1) as GrnItemDetails[]); // Set all rows except the last one
            } else {
              setGrnDetails(details as GrnItemDetails[]);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching GRN details:', err);
        setError((err as Error).message || 'Failed to fetch GRN details');
      } finally {
        setIsLoading(false);
      }
    };

    if (grnNo) {
      fetchGrnDetails();
    } else {
      setError('GRN Number is required');
      setIsLoading(false);
    }
  }, [grnNo, customerId]);

  // Calculate totals from the data
  const calculateTotals = () => {
    let totalQuantity = 0;
    let totalReceivedQty = 0;
    let totalDeletedQty = 0;
    let totalBalancedQty = 0;
    
    grnDetails.forEach(item => {
      totalQuantity += Number(item.QUANTITY || 0);
      totalReceivedQty += Number(item.RECEIVED_QTY || 0);
      totalDeletedQty += Number(item.DELETED_QTY || 0);
      totalBalancedQty += Number(item.BALANCE_QTY || 0);
    });
    
    return {
      totalQuantity,
      totalReceivedQty,
      totalDeletedQty,
      totalBalancedQty
    };
  };

  const totals = calculateTotals();

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F48221" />
        <Text style={styles.loadingText}>Loading GRN details...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>


      {/* Header Details Section */}
      <View style={styles.detailsContainer}>
        <Text style={styles.sectionTitle}>GRN HEADER DETAILS</Text>
        
        <View style={styles.rowContainer}>
          <View style={styles.leftColumn}>
            <Text style={[styles.labelText]}>DATE</Text>
            <Text style={styles.valueText}>{headerDetails.GRN_DATE}</Text>
            
            <Text style={[styles.labelText, styles.spacer]}>ADDRESS</Text>
            <Text style={styles.valueText}>{headerDetails.ADDRESS}</Text>
            
            <Text style={[styles.labelText, styles.spacer]}>BILL MAKING</Text>
            <Text style={styles.valueText}>{headerDetails.BILL_MAKING}</Text>
          </View>
          
          <View style={styles.rightColumn}>
            <Text style={styles.labelText}>PRE GRN NO.</Text>
            <Text style={styles.valueText}>{headerDetails.PRE_GRN_NO}</Text>
            
            <Text style={[styles.labelText, styles.spacer]}>GATE PASS NO.</Text>
            <Text style={styles.valueText}>{headerDetails.GATEPASS_NO}</Text>
            
            <Text style={[styles.labelText, styles.spacer]}>VEHICLE NO.</Text>
            <Text style={styles.valueText}>{headerDetails.VEHICLE_NO}</Text>
          </View>
        </View>
      </View>
      
      {/* GRN Details Section */}
      <View style={styles.detailsTableContainer}>
        <Text style={styles.sectionTitle}>GRN DETAILS</Text>
        
        {/* Custom Table Implementation */}
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={styles.tableHeaderRow}>
              <View style={styles.tableHeaderCell60}><Text style={styles.tableHeaderText}>#</Text></View>
              <View style={styles.tableHeaderCell100}><Text style={styles.tableHeaderText}>Lot No</Text></View>
              <View style={styles.tableHeaderCell180}><Text style={styles.tableHeaderText}>Item</Text></View>
              <View style={styles.tableHeaderCell110}><Text style={styles.tableHeaderText}>Item Marks</Text></View>
              <View style={styles.tableHeaderCell100}><Text style={styles.tableHeaderText}>Vakal No</Text></View>
              <View style={styles.tableHeaderCell100}><Text style={styles.tableHeaderText}>Batch No</Text></View>
              <View style={styles.tableHeaderCell100}><Text style={styles.tableHeaderText}>Expiry Date</Text></View>
              <View style={styles.tableHeaderCell100}><Text style={styles.tableHeaderText}>Location</Text></View>
              <View style={styles.tableHeaderCell180}><Text style={styles.tableHeaderText}>Scheme</Text></View>
              <View style={styles.tableHeaderCell80}><Text style={styles.tableHeaderText}>Quantity</Text></View>
              <View style={styles.tableHeaderCell100}><Text style={styles.tableHeaderText}>Received Qty</Text></View>
              <View style={styles.tableHeaderCell100}><Text style={styles.tableHeaderText}>Deleted Qty</Text></View>
              <View style={styles.tableHeaderCell100}><Text style={styles.tableHeaderText}>Balanced Qty</Text></View>
              <View style={styles.tableHeaderCell120}><Text style={styles.tableHeaderText}>Transhipment</Text></View>
            </View>
            
            {/* Table Body */}
            {grnDetails.map((item, index) => (
              <View key={index} style={[styles.tableRow, index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd]}>
                <View style={styles.tableHeaderCell60}><Text style={styles.tableRowText}>{index + 1}</Text></View>
                <View style={styles.tableHeaderCell100}><Text style={styles.tableRowText}>{item.LOT_NO}</Text></View>
                <View style={styles.tableHeaderCell180}><Text style={styles.tableRowText}>{item.ITEM_NAME}</Text></View>
                <View style={styles.tableHeaderCell120}><Text style={styles.tableRowText}>{item.ITEM_MARKS}</Text></View>
                <View style={styles.tableHeaderCell110}><Text style={styles.tableRowText}>{item.VAKAL_NO || '-'}</Text></View>
                <View style={styles.tableHeaderCell80}><Text style={styles.tableRowText}>{item.BATCH_NO || '-'}</Text></View>
                <View style={styles.tableHeaderCell110}><Text style={styles.tableRowText}>{item.EXPIRY_DATE || '-'}</Text></View>
                <View style={styles.tableHeaderCell80}><Text style={styles.tableRowText}>{item.LOCATION || '-'}</Text></View>
                <View style={styles.tableHeaderCell200}><Text style={styles.tableRowText}>{item.SCHEME}</Text></View>
                <View style={styles.tableHeaderCell100}><Text style={styles.tableRowText}>{item.QUANTITY}</Text></View>
                <View style={styles.tableHeaderCell100}><Text style={styles.tableRowText}>{item.RECEIVED_QTY}</Text></View>
                <View style={styles.tableHeaderCell100}><Text style={styles.tableRowText}>{item.DELETED_QTY}</Text></View>
                <View style={styles.tableHeaderCell100}><Text style={styles.tableRowText}>{item.BALANCE_QTY}</Text></View>
                <View style={styles.tableHeaderCell120}><Text style={styles.tableRowText}>{item.IS_TRANSSHIPMENT}</Text></View>
              </View>
            ))}
            
            {/* Total Row */}
            <View style={[styles.tableRow, styles.totalRow]}>
              <View style={styles.tableHeaderCell60}><Text style={styles.tableRowText}></Text></View>
              <View style={styles.tableHeaderCell100}><Text style={styles.tableRowText}></Text></View>
              <View style={styles.tableHeaderCell180}><Text style={styles.totalText}>Total</Text></View>
              <View style={styles.tableHeaderCell120}><Text style={styles.tableRowText}></Text></View>
              <View style={styles.tableHeaderCell100}><Text style={styles.tableRowText}></Text></View>
              <View style={styles.tableHeaderCell100}><Text style={styles.tableRowText}></Text></View>
              <View style={styles.tableHeaderCell100}><Text style={styles.tableRowText}></Text></View>
              <View style={styles.tableHeaderCell100}><Text style={styles.tableRowText}></Text></View>
              <View style={styles.tableHeaderCell180}><Text style={styles.tableRowText}></Text></View>
              <View style={styles.tableHeaderCell100}><Text style={styles.totalText}>{totals.totalQuantity}</Text></View>
              <View style={styles.tableHeaderCell100}><Text style={styles.totalText}>{totals.totalReceivedQty}</Text></View>
              <View style={styles.tableHeaderCell100}><Text style={styles.totalText}>{totals.totalDeletedQty}</Text></View>
              <View style={styles.tableHeaderCell100}><Text style={styles.totalText}>{totals.totalBalancedQty}</Text></View>
              <View style={styles.tableHeaderCell120}><Text style={styles.tableRowText}></Text></View>
            </View>
          </View>
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
    color: 'grey',
    fontWeight: '500',
    fontSize: 14,
  },
  valueText: {
    color: '#111827',
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
  // Custom Table Styles
  tableContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginTop: 10,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f2f2f2',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    padding: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    padding: 8,
  },
  tableRowEven: {
    backgroundColor: '#ffffff',
  },
  tableRowOdd: {
    backgroundColor: '#f9f9f9',
  },
  totalRow: {
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 0,
  },
  // Fixed width cells for better alignment
  tableHeaderCell60: {
    width: 60,
    paddingHorizontal: 6,
    justifyContent: 'center',
  },
  tableHeaderCell80: {
    width: 80,
    paddingHorizontal: 6,
    justifyContent: 'center',
  },
  tableHeaderCell100: {
    width: 100,
    paddingHorizontal: 6,
    justifyContent: 'center',
  },
  tableHeaderCell110: {
    width: 110,
    paddingHorizontal: 6,
    justifyContent: 'center',
  },
  tableHeaderCell120: {
    width: 120,
    paddingHorizontal: 6,
    justifyContent: 'center',
  },
  tableHeaderCell180: {
    width: 180,
    paddingHorizontal: 6,
    justifyContent: 'center',
  },
  tableHeaderCell200: {
    width: 200,
    paddingHorizontal: 6,
    justifyContent: 'center',
  },
  tableHeaderText: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  tableRowText: {
    fontSize: 13,
  },
  totalText: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
    textAlign: 'center',
  }
});

export default GrnDetailsScreen;
