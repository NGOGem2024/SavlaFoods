import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import {API_ENDPOINTS} from '../config/api.config';
import {RouteProp} from '@react-navigation/native';
import {LayoutWrapper} from '../components/AppLayout';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

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

type GrnDetailsScreenRouteProp = RouteProp<
  {GrnDetailsScreen: RouteParams},
  'GrnDetailsScreen'
>;

interface GrnDetailsProps {
  route: GrnDetailsScreenRouteProp;
}

const GrnDetailsScreen: React.FC<GrnDetailsProps> = ({route}) => {
  // Extract parameters from route
  const {grnNo, customerId} = route.params || {};

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
    BILL_MAKING: '',
  });
  const [grnDetails, setGrnDetails] = useState<GrnItemDetails[]>([]);

  // Fetch data from API
  useEffect(() => {
    const fetchGrnDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Log the parameters for debugging
        console.log(
          `Fetching GRN details for GRN No: ${grnNo}, CustomerID: ${customerId}`,
        );

        // Construct the API URL with the grnNo path parameter and customerId query parameter
        const url = `${API_ENDPOINTS.GET_GRN_DETAILS}/${grnNo}?customerId=${customerId}`;
        console.log('API URL:', url);

        const response = await axios.get(url);

        // Log the response for debugging
        console.log('API Response:', JSON.stringify(response.data, null, 2));

        if (response.data) {
          // Set header details
          setHeaderDetails(
            response.data.header || {
              CUSTOMER_NAME: '',
              PRE_GRN_NO: '',
              GRN_DATE: '',
              GATEPASS_NO: '',
              ADDRESS: '',
              VEHICLE_NO: '',
              BILL_MAKING: '',
            },
          );

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
      totalBalancedQty,
    };
  };

  const formatAddress = (address: string) => {
    if (!address) return '';

    // Normalize the address string
    const cleanAddress = address.replace(/\s+/g, ' ').trim();

    // Extract pincode using a robust regex pattern
    const pincodeRegex = /(pincode|pin|code)[:\s-]*(\d{6})/i;
    const pincodeMatch = cleanAddress.match(pincodeRegex);
    const pincode = pincodeMatch ? `Pincode - ${pincodeMatch[2]}` : '';

    // Remove pincode from main address
    let mainAddress = cleanAddress.replace(pincodeRegex, '').trim();

    // Split address into logical components
    const parts = mainAddress
      .split(/,\s*(?![^(]*\))/) // Split on commas not within parentheses
      .map(part => part.trim())
      .filter(part => part.length > 0);

    // Group into lines of 3 components each
    const lines = [];
    while (parts.length > 0) {
      const lineParts = parts.splice(0, 3);
      lines.push(lineParts.join(', '));
    }

    // Add pincode if found
    if (pincode) {
      lines.push(pincode);
    }

    return lines.join('\n');
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
    <LayoutWrapper showHeader={true} showTabBar={true} route={route}>
      <ScrollView style={styles.container}>
        {/* Header Details Section */}
        <View style={styles.detailsContainer}>
          <Text style={styles.sectionTitle}>GRN HEADER DETAILS</Text>

          <View style={styles.rowContainer}>
            <View style={styles.leftColumn}>
              <Text style={[styles.labelText]}>DATE</Text>
              <Text style={styles.valueText}>{headerDetails.GRN_DATE}</Text>

              <Text style={[styles.labelText, styles.spacer]}>ADDRESS</Text>
              <Text style={styles.addressText}>
                {formatAddress(headerDetails.ADDRESS)}
              </Text>
            </View>

            <View style={styles.rightColumn}>
              <Text style={[styles.labelText]}>VEHICLE NO</Text>
              <Text style={styles.valueText}>{headerDetails.VEHICLE_NO}</Text>
            </View>
          </View>
        </View>

        {/* GRN Details Section */}
        
        <View style={styles.detailsTableContainer}>
          <Text style={styles.sectionTitle}>GRN DETAILS</Text>

          <View style={styles.scrollHintContainer}>
            <MaterialIcons name="swipe" size={18} color="#64748B" />
            <Text style={styles.scrollHintText} numberOfLines={1} ellipsizeMode="tail">
              Scroll horizontally to view all data
            </Text>
          </View>

          {/* Custom Table Implementation */}
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View style={styles.tableContainer}>
              {/* Table Header */}
              <View style={styles.tableHeaderRow}>
                <View style={styles.tableHeaderCell60}>
                  <Text style={styles.tableHeaderText}>#</Text>
                </View>
                <View style={styles.tableHeaderCell100}>
                  <Text style={styles.tableHeaderText}>Lot No</Text>
                </View>
                <View style={styles.tableHeaderCell180}>
                  <Text style={styles.tableHeaderText}>Items</Text>
                </View>
                <View style={styles.tableHeaderCell110}>
                  <Text style={styles.tableHeaderText}>Item Marks</Text>
                </View>
                <View style={styles.tableHeaderCell120}>
                  <Text style={styles.tableHeaderText}>Vakal No</Text>
                </View>
                <View style={styles.tableHeaderCell100}>
                  <Text style={styles.tableHeaderText}>Batch No</Text>
                </View>
                <View style={styles.tableHeaderCell100}>
                  <Text style={styles.tableHeaderText}>Expiry Date</Text>
                </View>
                <View style={styles.tableHeaderCell80}>
                  <Text style={styles.tableHeaderText}>Quantity</Text>
                </View>
              </View>

              {/* Table Body */}
              {grnDetails.map((item, index) => (
                <View
                  key={index}
                  style={[
                    styles.tableRow,
                    index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
                  ]}>
                  <View style={styles.tableHeaderCell60}>
                    <Text style={styles.tableRowText}>{index + 1}</Text>
                  </View>
                  <View style={styles.tableHeaderCell100}>
                    <Text style={styles.tableRowText}>{item.LOT_NO}</Text>
                  </View>
                  <View style={styles.tableHeaderCell180}>
                    <Text style={styles.tableRowText}>{item.ITEM_NAME}</Text>
                  </View>
                  <View style={styles.tableHeaderCell110}>
                    <Text style={styles.tableRowText}>{item.ITEM_MARKS}</Text>
                  </View>
                  <View style={styles.tableHeaderCell140}>
                    <Text style={styles.tableRowText}>
                      {item.VAKAL_NO || '-'}
                    </Text>
                  </View>
                  <View style={styles.tableHeaderCell100}>
                    <Text style={styles.tableRowText}>
                      {item.BATCH_NO || '-'}
                    </Text>
                  </View>
                  <View style={styles.tableHeaderCell100}>
                    <Text style={styles.tableRowText}>
                      {item.EXPIRY_DATE || '-'}
                    </Text>
                  </View>
                  <View style={styles.tableHeaderCell60}>
                    <Text style={styles.tableRowText}>{item.QUANTITY}</Text>
                  </View>
                </View>
              ))}

              {/* Total Row */}
              <View style={[styles.tableRow, styles.totalRow]}>
                <View style={styles.tableHeaderCell60}>
                  <Text style={styles.tableRowText}></Text>
                </View>
                <View style={styles.tableHeaderCell100}>
                  <Text style={styles.tableRowText}></Text>
                </View>
                <View style={styles.tableHeaderCell180}>
                  <Text style={styles.tableRowText}></Text>
                </View>
                <View style={styles.tableHeaderCell110}>
                  <Text style={styles.tableRowText}></Text>
                </View>
                <View style={styles.tableHeaderCell80}>
                  <Text style={styles.tableRowText}></Text>
                </View>
                <View style={styles.tableHeaderCell150}>
                  <Text style={styles.tableRowText}></Text>
                </View>
                <View style={styles.tableHeaderCell100}>
                  <Text style={styles.totalText}>Total </Text>
                </View>
                <View style={styles.tableHeaderCell60}>
                  <Text style={styles.totalText}>{totals.totalQuantity}</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </LayoutWrapper>
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
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    color: '#F48221',
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
    shadowOffset: {width: 0, height: 1},
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
    minWidth: Dimensions.get('window').width - 32, // Prevent horizontal scroll on small devices
  },
  tableRowText: {
    fontSize: 13,
    lineHeight: 18, // Ensure consistent row heights
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
  addressText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
    marginTop: 2,
    marginBottom: 5,
    includeFontPadding: false,
    textAlignVertical: 'top',
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
  tableHeaderCell140: {
    width: 140,
    paddingHorizontal: 6,
    justifyContent: 'center',
  },
  tableHeaderCell150: {
    width: 150,
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
  },
  scrollHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flex: 1,
    paddingHorizontal: 28,
    textAlign: 'center',
    justifyContent: 'center',
  },
  scrollHintText: {
    fontSize: 13,
    color: '#64748B',
    flexShrink: 1,
    textAlign: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
});

export default GrnDetailsScreen;