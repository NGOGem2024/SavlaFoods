import React, {useState, useEffect} from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {API_ENDPOINTS} from '../config/api.config';
import apiClient from '../utils/apiClient';

// API response type definition
interface LotDetails {
  LOT_NO: number;
  UNIT_NAME: string;
  DESCRIPTION: string;
  ITEM_MARKS: string;
  VAKAL_NO: string;
  AVAILABLE_QTY: number;
  CATEGORY_NAME?: string;
}

interface Transaction {
  TRANSACTION_TYPE: 'INWARD' | 'OUTWARD';
  TRANSACTION_ID: number | null;
  GRN_NO?: string;
  DELIVERY_CHALLAN_NO?: string;
  TRANSACTION_DATE: string;
  QUANTITY: number;
  ITEM_MARKS: string;
  VAKAL_NO: string;
  BATCH_NO: string | null;
  EXPIRY_DATE: string | null;
  UNIT_NAME: string;
  HANDLED_BY: string;
  REMARKS: string;
  GATEPASS_NO: string | null;
  GATE_PASS_DATE: string | null;
  CUSTOMER_NAME: string;
  RUNNING_BALANCE: number;
}

interface LotReportResponse {
  success: boolean;
  lotDetails: LotDetails;
  transactions: Transaction[];
  summary: {
    totalInward: number;
    totalOutward: number;
    currentBalance: number;
    availableQuantity: number;
  };
}

const outwardData = [
  {
    outNo: 'DC103524',
    date: '01/12/2021',
    vehicle: 'MH 17 AG 6604',
    deliveredTo: 'F-28',
    qty: 1,
  },
  {
    outNo: 'DC106871',
    date: '09/12/2021',
    vehicle: 'MH 04 AG 7880',
    deliveredTo: 'F-28',
    qty: 2,
  },
  {
    outNo: 'DC45023',
    date: '29/07/2022',
    vehicle: 'MH 04 AG 7880',
    deliveredTo: 'F-28',
    qty: 2,
  },
  {
    outNo: 'DC57232',
    date: '29/08/2022',
    vehicle: 'MH 17 AG 6604',
    deliveredTo: 'F-28',
    qty: 2,
  },
  {
    outNo: 'DC9954',
    date: '29/04/2023',
    vehicle: 'MH 17 AG 6604',
    deliveredTo: 'F-28',
    qty: 1,
  },
];

const LotReportScreen = () => {
  const [selectedTab, setSelectedTab] = useState<'Inwards' | 'Outwards'>(
    'Inwards',
  );
  const [lotDetails, setLotDetails] = useState<LotDetails | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchLotNo, setSearchLotNo] = useState<string>('122520');

  useEffect(() => {
    const fetchLotReport = async () => {
      try {
        setLoading(true);
        // Example lotNo and customerId - these would come from navigation params in a real app
        const lotNo = searchLotNo;
        const customerId = '1279';

        const response = await apiClient.get<LotReportResponse>(
          `${API_ENDPOINTS.GET_LOT_REPORT}/${lotNo}?customerId=${customerId}`,
        );

        // Log the API response in a readable format
        console.log('=== LOT REPORT API RESPONSE ===');
        console.log('Success:', response.success);
        console.log(
          'Lot Details:',
          JSON.stringify(response.lotDetails, null, 2),
        );
        console.log('Summary:', JSON.stringify(response.summary, null, 2));
        console.log('Total Transactions:', response.transactions.length);
        console.log(
          'First Transaction (Sample):',
          response.transactions.length > 0
            ? JSON.stringify(response.transactions[0], null, 2)
            : 'No transactions',
        );
        console.log('================================');

        if (response && response.success) {
          setLotDetails(response.lotDetails);
          setTransactions(response.transactions);
        } else {
          setError('Failed to load lot details');
        }
      } catch (err) {
        console.error('Error fetching lot report:', err);
        setError('An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchLotReport();
  }, [searchLotNo]);

  // Filter transactions based on the selected tab
  const filteredTransactions = transactions.filter(
    transaction =>
      transaction.TRANSACTION_TYPE ===
      (selectedTab === 'Inwards' ? 'INWARD' : 'OUTWARD'),
  );

  const handleSearch = () => {
    // The API call is triggered automatically via the useEffect when searchLotNo changes
    setLoading(true);
  };

  const handleRefresh = () => {
    // Refresh the current lot data
    setLoading(true);
    // Trigger the API call by setting the searchLotNo to itself
    setSearchLotNo(prev => prev);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <MaterialIcons
            name="search"
            size={24}
            color="#777"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Lot No."
            placeholderTextColor="#999"
            value={searchLotNo}
            onChangeText={setSearchLotNo}
            keyboardType="numeric"
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <MaterialIcons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading lot details...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <>
          <View style={styles.detailsContainer}>
            <Text style={styles.lotNo}>
              Lot No:{' '}
              <Text style={styles.lotNoHighlight}>{lotDetails?.LOT_NO}</Text>
            </Text>
            <Text style={styles.detailText}>
              Unit Name:{' '}
              <Text style={styles.detailBold}>{lotDetails?.UNIT_NAME}</Text>
            </Text>
            <Text style={styles.detailText}>
              Item Description:{' '}
              <Text style={styles.detailBold}>{lotDetails?.DESCRIPTION}</Text>
            </Text>
            <Text style={styles.detailText}>
              Category Name:{' '}
              <Text style={styles.detailBold}>{lotDetails?.CATEGORY_NAME}</Text>
            </Text>
            <Text style={styles.detailText}>
              Item Mark:{' '}
              <Text style={styles.detailBold}>{lotDetails?.ITEM_MARKS}</Text>
            </Text>
            <Text style={styles.detailText}>
              Vakkal:{' '}
              <Text style={styles.detailBold}>{lotDetails?.VAKAL_NO}</Text>
            </Text>
            <Text style={styles.detailText}>
              Available Qty:{' '}
              <Text style={styles.detailBold}>{lotDetails?.AVAILABLE_QTY}</Text>
            </Text>
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.inwardTabButton,
                selectedTab === 'Inwards' && styles.activeInwardTab,
              ]}
              onPress={() => setSelectedTab('Inwards')}>
              <Text
                style={[
                  styles.tabText,
                  selectedTab === 'Inwards' && styles.activeTabText,
                ]}>
                Inwards
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.outwardTabButton,
                selectedTab === 'Outwards' && styles.activeOutwardTab,
              ]}
              onPress={() => setSelectedTab('Outwards')}>
              <Text
                style={[
                  styles.tabText,
                  selectedTab === 'Outwards' && styles.activeTabText,
                ]}>
                Outwards
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={[styles.scrollHintContainer, {backgroundColor: '#f8f8f8'}]}>
            <MaterialIcons name="swipe" size={16} color="#64748B" />
            <Text style={styles.scrollHintText}>
              Swipe horizontally to see all columns
            </Text>
          </View>

          {filteredTransactions.length > 0 ? (
            <>
              {selectedTab === 'Inwards' ? (
                <View style={styles.tableContainer}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={true}
                    contentContainerStyle={{flexGrow: 1}}>
                    <View style={{width: '100%'}}>
                      <View style={styles.inwardTableHeader}>
                        <Text style={styles.headerCell}>GRN No</Text>
                        <Text style={styles.headerCell}>
                          Transaction{'\n'}Date
                        </Text>
                        <Text style={styles.headerCell}>Quantity</Text>
                        <Text style={styles.headerCell}>Item Marks</Text>
                        <Text style={styles.headerCell}>Vakal No</Text>
                        <Text style={styles.headerCell}>Batch No</Text>
                        <Text style={styles.headerCell}>Expiry Date</Text>
                        <Text style={styles.headerCell}>Unit Name</Text>
                        <Text style={styles.headerCell}>Handled By</Text>
                        <Text style={styles.headerCell}>Remarks</Text>
                        <Text style={styles.headerCell}>Gatepass{'\n'}No</Text>
                        <Text style={styles.headerCell}>
                          Gate Pass{'\n'}Date
                        </Text>
                        <Text style={styles.headerCell}>
                          Running{'\n'}Balance
                        </Text>
                      </View>
                      <FlatList
                        data={filteredTransactions}
                        keyExtractor={(item, index) =>
                          `${item.TRANSACTION_ID || ''}-${index}`
                        }
                        renderItem={({item, index}) => (
                          <View
                            style={[
                              styles.tableRow,
                              index % 2 === 0 ? styles.evenRow : styles.oddRow,
                            ]}>
                            <Text style={styles.tableCell}>
                              {item.GRN_NO || '-'}
                            </Text>
                            <Text style={styles.tableCell}>
                              {item.TRANSACTION_DATE || '-'}
                            </Text>
                            <Text style={styles.tableCell}>
                              {item.QUANTITY || '-'}
                            </Text>
                            <Text style={styles.tableCell}>
                              {item.ITEM_MARKS || '-'}
                            </Text>
                            <Text style={styles.tableCell}>
                              {item.VAKAL_NO || '-'}
                            </Text>
                            <Text style={styles.tableCell}>
                              {item.BATCH_NO || '-'}
                            </Text>
                            <Text style={styles.tableCell}>
                              {item.EXPIRY_DATE || '-'}
                            </Text>
                            <Text style={styles.tableCell}>
                              {item.UNIT_NAME || '-'}
                            </Text>
                            <Text style={styles.tableCell}>
                              {item.HANDLED_BY || '-'}
                            </Text>
                            <Text style={styles.tableCell}>
                              {item.REMARKS || '-'}
                            </Text>
                            <Text style={styles.tableCell}>
                              {item.GATEPASS_NO || '-'}
                            </Text>
                            <Text style={styles.tableCell}>
                              {item.GATE_PASS_DATE || '-'}
                            </Text>
                            <Text style={styles.tableCell}>
                              {item.RUNNING_BALANCE || '-'}
                            </Text>
                          </View>
                        )}
                        style={styles.flatList}
                        ListEmptyComponent={() => (
                          <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>
                              No Inwards transactions found
                            </Text>
                          </View>
                        )}
                      />
                    </View>
                  </ScrollView>
                </View>
              ) : (
                <View style={styles.tableContainer}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={true}
                    contentContainerStyle={{flexGrow: 1}}>
                    <View style={{width: '100%'}}>
                      <View style={styles.outwardTableHeader}>
                        <Text style={[styles.headerCell, {width: 110}]}>
                          Delivery{'\n'}Challan No
                        </Text>
                        <Text style={styles.headerCell}>
                          Transaction{'\n'}Date
                        </Text>
                        <Text style={styles.headerCell}>Quantity</Text>
                        <Text style={styles.headerCell}>Item Marks</Text>
                        <Text style={styles.headerCell}>Vakal No</Text>
                        <Text style={styles.headerCell}>Batch No</Text>
                        <Text style={styles.headerCell}>Expiry Date</Text>
                        <Text style={styles.headerCell}>Unit Name</Text>
                        <Text style={styles.headerCell}>Handled By</Text>
                        <Text style={styles.headerCell}>Remarks</Text>
                        <Text style={styles.headerCell}>Gatepass{'\n'}No</Text>
                        <Text style={styles.headerCell}>
                          Gate Pass{'\n'}Date
                        </Text>
                        <Text style={styles.headerCell}>
                          Running{'\n'}Balance
                        </Text>
                      </View>
                      <FlatList
                        data={filteredTransactions}
                        keyExtractor={(item, index) =>
                          `${item.TRANSACTION_ID || ''}-${index}`
                        }
                        renderItem={({item, index}) => (
                          <View
                            style={[
                              styles.tableRow,
                              index % 2 === 0 ? styles.evenRow : styles.oddRow,
                            ]}>
                            <Text style={[styles.tableCell, {width: 110}]}>
                              {item.DELIVERY_CHALLAN_NO || '-'}
                            </Text>
                            <Text style={styles.tableCell}>
                              {item.TRANSACTION_DATE || '-'}
                            </Text>
                            <Text style={styles.tableCell}>
                              {item.QUANTITY || '-'}
                            </Text>
                            <Text style={styles.tableCell}>
                              {item.ITEM_MARKS || '-'}
                            </Text>
                            <Text style={styles.tableCell}>
                              {item.VAKAL_NO || '-'}
                            </Text>
                            <Text style={styles.tableCell}>
                              {item.BATCH_NO || '-'}
                            </Text>
                            <Text style={styles.tableCell}>
                              {item.EXPIRY_DATE || '-'}
                            </Text>
                            <Text style={styles.tableCell}>
                              {item.UNIT_NAME || '-'}
                            </Text>
                            <Text style={styles.tableCell}>
                              {item.HANDLED_BY || '-'}
                            </Text>
                            <Text style={styles.tableCell}>
                              {item.REMARKS || '-'}
                            </Text>
                            <Text style={styles.tableCell}>
                              {item.GATEPASS_NO || '-'}
                            </Text>
                            <Text style={styles.tableCell}>
                              {item.GATE_PASS_DATE || '-'}
                            </Text>
                            <Text style={styles.tableCell}>
                              {item.RUNNING_BALANCE || '-'}
                            </Text>
                          </View>
                        )}
                        style={styles.flatList}
                        ListEmptyComponent={() => (
                          <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>
                              No Outwards transactions found
                            </Text>
                          </View>
                        )}
                      />
                    </View>
                  </ScrollView>
                </View>
              )}
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No {selectedTab} transactions found
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 5,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    height: 46,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 0,
  },
  refreshButton: {
    padding: 8,
    backgroundColor: '#D3D3D3',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
  detailsContainer: {
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  lotNo: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  lotNoHighlight: {
    color: '#F28C28',
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
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  inwardTabButton: {
    flex: 1,
    padding: 10,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 5,
    // borderWidth: 1,
    // borderColor: '#D0D0D0',
  },
  outwardTabButton: {
    flex: 1,
    padding: 10,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 5,
    // borderWidth: 1,
    // borderColor: '#D0D0D0',
  },
  activeInwardTab: {
    backgroundColor: '#F28C28',
    borderColor: '#e67e22',
  },
  activeOutwardTab: {
    backgroundColor: '#007bff',
    borderColor: '#0069d9',
  },
  tabText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#fff',
  },
  flatList: {
    backgroundColor: '#fff',
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#007bff',
    padding: 12,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  inwardTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#007bff',
    padding: 12,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  outwardTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#007bff',
    padding: 12,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  headerCell: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    width: 100,
    textAlign: 'center',
    paddingHorizontal: 5,
    height: 30,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tableCell: {
    color: '#333',
    fontSize: 13,
    width: 100,
    textAlign: 'center',
    paddingHorizontal: 5,
  },
  evenRow: {
    backgroundColor: '#f5f9ff',
  },
  oddRow: {
    backgroundColor: '#ffffff',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 8,
  },
  emptyText: {
    color: '#666',
    fontStyle: 'italic',
  },
  tableContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 0,
    paddingHorizontal: 0,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  scrollHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  scrollHintText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#64748B',
  },
});

export default LotReportScreen;
