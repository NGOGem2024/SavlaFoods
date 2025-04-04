import {NavigationProp, RouteProp} from '@react-navigation/native';
import axios from 'axios';
import React, {useEffect, useState, useRef} from 'react';
import Icon from 'react-native-vector-icons/MaterialIcons';

import {API_ENDPOINTS, DEFAULT_HEADERS} from '../config/api.config';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import QuantitySelectorModal from '../components/QuantitySelectorModal';
import {LayoutWrapper} from '../components/AppLayout';

interface ItemDetails {
  DESCRIPTION: string;
  ITEM_CODE: string;
  ITEM_ID: number;
  ITEM_NAME: string;
  ITEM_SUB_CATEGORY_ID: number;
}

interface StockDetails {
  LOT_NO: string | null;
  ITEM_MARKS: string | null;
  VAKAL_NO: string | null;
  BATCH_NO: string | null;
  AVAILABLE_QTY: number | null;
  BOX_QUANTITY: number | null;
  EXPIRY_DATE: string | null;
  REMARKS: string | null;
  STATUS: string | null;
  UNIT_NAME: string | null;
}

interface APIResponse {
  input: {
    ItemID: number;
    customerID: string | number;
  };
  output: {
    itemDetails: ItemDetails;
    stockDetails: StockDetails[];
  };
}

type MainStackParamList = {
  ItemDetailsExpanded: {
    ItemID: number;
    customerID: string | number;
    shouldRefresh?: boolean;
    updatedNetQuantity?: number;
    searchedLotNo?: string;
    searchParams?: {
      customer_id: string;
      unit_name: string;
      lot_no: string;
    };
    searchResults?: Array<{
      itemId: number;
      itemName: string;
      lotNo: string;
      vakalNo: string;
      itemMarks: string;
      subCategoryName: string;
      availableQty: number;
      balanceQty: number;
      unitName: string;
      description?: string;
      batchNo?: string;
      expiryDate?: string;
    }>;
  };
  LotReportScreen: undefined;
};

type ItemDetailsExpandedRouteProp = RouteProp<
  MainStackParamList,
  'ItemDetailsExpanded'
>;
type ItemDetailsExpandedNavigationProp = NavigationProp<MainStackParamList>;

interface ItemDetailsExpandedProps {
  route: ItemDetailsExpandedRouteProp;
  navigation: ItemDetailsExpandedNavigationProp;
}

const ItemDetailsExpanded: React.FC<ItemDetailsExpandedProps> = ({
  route,
  navigation,
}) => {
  const customerID = route.params?.customerID;
  const searchedLotNo = route.params?.searchedLotNo;
  const [itemDetails, setItemDetails] = useState<ItemDetails | null>(null);
  const [stockDetails, setStockDetails] = useState<StockDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchedLotNo || '');
  const [isTableView, setIsTableView] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [cartAnimations, setCartAnimations] = useState<{
    [key: string]: Animated.Value;
  }>({});
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<{
    item_id: number;
    item_name: string;
    lot_no: string;
    available_qty: number;
    box_quantity: number;
    unit_name: string;
    vakal_no: string;
    customerID?: number | string;
    item_marks: string;
  } | null>(null);

  // Reference to highlighted item
  const highlightedItemRef = useRef<ScrollView>(null);
  const [highlightedLotNoIndex, setHighlightedLotNoIndex] = useState<
    number | null
  >(null);

  const handleAddToCart = (lotNo: string | null) => {
    if (!lotNo) {
      Alert.alert('Error', 'Invalid Lot Number');
      return;
    }

    const selectedStock = stockDetails.find(stock => stock.LOT_NO === lotNo);

    if (!selectedStock) {
      Alert.alert('Error', 'Stock item not found');
      return;
    }

    Animated.timing(cartAnimations[lotNo], {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setSelectedStockItem({
      item_id: itemDetails?.ITEM_ID || 0,
      item_name: itemDetails?.ITEM_NAME || '',
      lot_no: lotNo,
      available_qty: selectedStock.AVAILABLE_QTY || 0,
      box_quantity: selectedStock.BOX_QUANTITY || 0,
      unit_name: selectedStock.UNIT_NAME || '',
      customerID: customerID,
      vakal_no: selectedStock.VAKAL_NO || '',
      item_marks: selectedStock.ITEM_MARKS || '',
    });

    setModalVisible(true);
  };

  useEffect(() => {
    const animations: {[key: string]: Animated.Value} = {};
    stockDetails.forEach(stock => {
      animations[stock.LOT_NO || ''] = new Animated.Value(0);
    });
    setCartAnimations(animations);
  }, [stockDetails]);

  const fetchStockDetails = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);

    try {
      const {ItemID} = route.params;
      const response = await axios.post<APIResponse>(
        API_ENDPOINTS.GET_ITEM_DETAILS,
        {
          ItemID,
          CustomerID: customerID,
        },
        {
          headers: DEFAULT_HEADERS,
          timeout: 10000,
        },
      );

      if (response.data?.output) {
        const {stockDetails, itemDetails} = response.data.output;
        if (!stockDetails || stockDetails.length === 0) {
          setError('No stock details available');
          setStockDetails([]);
        } else {
          setItemDetails(itemDetails);

          // Sort stockDetails to prioritize the searched lot number if exists
          if (searchedLotNo) {
            const sortedStockDetails = [...stockDetails].sort((a, b) => {
              if (a.LOT_NO === searchedLotNo) return -1;
              if (b.LOT_NO === searchedLotNo) return 1;
              return 0;
            });
            setStockDetails(sortedStockDetails);

            // Find the index of the searched lot number for highlighting
            const index = sortedStockDetails.findIndex(
              item => item.LOT_NO === searchedLotNo,
            );
            if (index !== -1) {
              setHighlightedLotNoIndex(index);
            }
          } else {
            setStockDetails(stockDetails);
          }

          setError(null);
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError('No Data Available');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!route.params?.ItemID || !customerID) {
      setError('Invalid item ID or customer ID');
      setLoading(false);
      return;
    }

    fetchStockDetails();
  }, [route.params.ItemID, customerID]);

  // Add this new function here
  const handleBack = () => {
    navigation.goBack();
  };
  const onRefresh = () => {
    setRefreshing(true);
    fetchStockDetails(false);
  };

  useEffect(() => {
    if (!route.params?.ItemID || !customerID) {
      setError('Invalid item ID or customer ID');
      setLoading(false);
      return;
    }

    if (route.params?.shouldRefresh) {
      const {updatedNetQuantity} = route.params;

      if (updatedNetQuantity !== undefined) {
        updateStockDetailsWithNetQuantity(updatedNetQuantity);
      } else {
        fetchStockDetails();
      }
    } else {
      fetchStockDetails();
    }
  }, [route.params?.ItemID, customerID, route.params?.shouldRefresh]);

  // Scroll to highlighted lot number
  useEffect(() => {
    if (highlightedLotNoIndex !== null && highlightedItemRef.current) {
      setTimeout(() => {
        highlightedItemRef.current?.scrollTo({
          y: highlightedLotNoIndex * 180, // Approximate height of a card
          animated: true,
        });
      }, 500);
    }
  }, [highlightedLotNoIndex]);

  const updateStockDetailsWithNetQuantity = (netQuantity: number) => {
    setStockDetails(prevStockDetails =>
      prevStockDetails.map(stock => ({
        ...stock,
        AVAILABLE_QTY: netQuantity,
      })),
    );
  };

  const fadeIn = (index: number) => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      delay: index * 10,
      useNativeDriver: true,
    }).start();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString || dateString === 'null') return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const formatQuantity = (quantity: number | null) => {
    if (quantity === null) return 'N/A';
    return quantity.toLocaleString();
  };

  const filteredStockDetails = stockDetails.filter(stock => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (stock.LOT_NO?.toString().toLowerCase().includes(searchLower) ?? false) ||
      (stock.UNIT_NAME?.toString().toLowerCase().includes(searchLower) ??
        false) ||
      (stock.BATCH_NO?.toString().toLowerCase().includes(searchLower) ??
        false) ||
      (stock.AVAILABLE_QTY?.toString().toLowerCase().includes(searchLower) ??
        false) ||
      (stock.BOX_QUANTITY?.toString().toLowerCase().includes(searchLower) ??
        false) ||
      (stock.EXPIRY_DATE?.toString().toLowerCase().includes(searchLower) ??
        false) ||
      (stock.STATUS?.toString().toLowerCase().includes(searchLower) ?? false) ||
      (stock.REMARKS?.toString().toLowerCase().includes(searchLower) ?? false)
    );
  });

  const renderCardView = () => (
    <ScrollView
      ref={highlightedItemRef}
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      {filteredStockDetails.length > 0 ? (
        filteredStockDetails.map((stock, index) => {
          const isHighlighted = searchedLotNo && stock.LOT_NO === searchedLotNo;

          return (
            <Animated.View
              key={index}
              style={[
                styles.stockCard,
                isHighlighted && styles.highlightedCard,
                {
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0],
                      }),
                    },
                  ],
                },
              ]}
              onLayout={() => fadeIn(index)}>
              <View style={styles.stockHeader}>
                <View style={styles.lotNoContainer}>
                  <Text style={styles.lotNoLabel}>LOT NO : </Text>
                  <TouchableOpacity
                    style={styles.lotNoValueContainer}
                    // onPress={() => navigation.navigate('LotReportScreen')}
                  >
                    <Text
                      style={[
                        styles.lotNoValue,
                        isHighlighted && styles.highlightedText,
                      ]}>
                      {stock.LOT_NO || 'N/A'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Animated.View
                  style={[
                    styles.addToCartContainer,
                    {
                      transform: [
                        {
                          scale:
                            cartAnimations[stock.LOT_NO || '']?.interpolate({
                              inputRange: [0, 0.5, 1],
                              outputRange: [1, 1.2, 1],
                            }) || 1,
                        },
                      ],
                    },
                  ]}>
                  <TouchableOpacity
                    style={styles.addToCartButton}
                    onPress={() => handleAddToCart(stock.LOT_NO)}>
                    <View style={styles.cartIconWrapper}>
                      <Text style={styles.cartIcon}>🛒</Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              </View>
              <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Unit Name</Text>
                    <Text style={styles.detailValue}>
                      {stock.UNIT_NAME || ''}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Vakal No:</Text>
                    <Text style={styles.detailValue}>{stock.VAKAL_NO || ''}</Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Item Marks</Text>
                    <Text style={styles.detailValue}>
                      {stock.ITEM_MARKS || ''}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Batch No</Text>
                    <Text style={styles.detailValue}>{stock.BATCH_NO || ''}</Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Available Quantity</Text>
                    <Text style={styles.detailValue}>
                      {formatQuantity(stock.AVAILABLE_QTY)}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Remarks</Text>
                    <Text style={styles.detailValue}>{stock.REMARKS || ''}</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          );
        })
      ) : (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>
            Please enter a valid Lot No. No matching items found.
          </Text>
        </View>
      )}
    </ScrollView>
  );

  const renderTableView = () => (
    <View style={styles.tableContainer}>
      {filteredStockDetails.length > 0 ? (
        <ScrollView
          horizontal
          style={styles.horizontalScrollView}
          scrollEnabled={true}>
          <View>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, {width: 120}]}>Lot No</Text>
              <Text style={[styles.tableHeaderCell, {width: 100}]}>
                Unit Name
              </Text>
              <Text style={[styles.tableHeaderCell, {width: 150}]}>Vakal No</Text>
              <Text style={[styles.tableHeaderCell, {width: 150}]}>
                Item Marks
              </Text>
              <Text style={[styles.tableHeaderCell, {width: 120}]}>Batch No</Text>
              <Text style={[styles.tableHeaderCell, {width: 100}]}>
                Available Qty
              </Text>
              <Text style={[styles.tableHeaderCell, {width: 100}]}>Remarks</Text>
              <Text style={[styles.tableHeaderCell, {width: 80}]}>Action</Text>
            </View>
            <ScrollView
              style={styles.verticalScrollView}
              scrollEnabled={true}
              nestedScrollEnabled={true}>
              {filteredStockDetails.map((stock, index) => {
                const isHighlighted =
                  searchedLotNo && stock.LOT_NO === searchedLotNo;

                return (
                  <View
                    key={index}
                    style={[
                      styles.tableRow,
                      isHighlighted && styles.highlightedTableRow,
                    ]}>
                    <View style={[styles.tableCellContainer, {width: 120}]}>
                      <Text
                        style={[
                          styles.tableCell,
                          styles.lotNoTableCell,
                          isHighlighted && styles.highlightedText,
                        ]}>
                        {stock.LOT_NO || 'N/A'}
                      </Text>
                    </View>
                    <View style={[styles.tableCellContainer, {width: 100}]}>
                      <Text style={styles.tableCell}>
                        {stock.UNIT_NAME || 'N/A'}
                      </Text>
                    </View>
                    <View style={[styles.tableCellContainer, {width: 150}]}>
                      <Text style={styles.tableCell}>
                        {stock.VAKAL_NO || 'N/A'}
                      </Text>
                    </View>
                    <View style={[styles.tableCellContainer, {width: 150}]}>
                      <Text style={styles.tableCell}>
                        {stock.ITEM_MARKS || 'N/A'}
                      </Text>
                    </View>
                    <View style={[styles.tableCellContainer, {width: 120}]}>
                      <Text style={styles.tableCell}>
                        {stock.BATCH_NO || 'N/A'}
                      </Text>
                    </View>
                    <View style={[styles.tableCellContainer, {width: 100}]}>
                      <Text style={styles.tableCell}>
                        {formatQuantity(stock.AVAILABLE_QTY)}
                      </Text>
                    </View>
                    <View style={[styles.tableCellContainer, {width: 100}]}>
                      <Text style={styles.tableCell}>
                        {stock.REMARKS || 'N/A'}
                      </Text>
                    </View>
                    <View style={[styles.tableCellContainer, {width: 80}]}>
                      <TouchableOpacity
                        style={styles.tableAddToCartButton}
                        onPress={() => handleAddToCart(stock.LOT_NO)}>
                        <Text style={styles.tableCartIcon}>🛒</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </ScrollView>
      ) : (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>
            Please enter a valid Lot No. No matching items found.
          </Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  if (error) {
    return (
      <LayoutWrapper showHeader={true} showTabBar={true} route={route}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Icon name="arrow-back" size={24} color="#007bff" />
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper showHeader={true} showTabBar={true} route={route}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.mainContainer}>
          <View style={styles.headerContainer}>
            <View style={styles.searchContainer}>
              <Icon name="search" size={24} style={{color: '#000'}} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by LotNo..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#888"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.rightHeaderSection}>
              {isTableView &&
                (refreshing ? (
                  <ActivityIndicator
                    size="small"
                    color="#007bff"
                    style={styles.refreshIndicator}
                  />
                ) : (
                  <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={onRefresh}>
                    <Icon name="refresh" size={20} color="#007bff" />
                  </TouchableOpacity>
                ))}
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    !isTableView && styles.toggleButtonActive,
                  ]}
                  onPress={() => setIsTableView(false)}>
                  <Icon
                    name="credit-card" // Change to the appropriate icon name
                    size={23}
                    style={{color: !isTableView ? '#F48221' : '#F48221'}}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.toggleButton,
                    isTableView && styles.toggleButtonActive,
                  ]}
                  onPress={() => setIsTableView(true)}>
                  <Icon
                    name="grid-on" // Change to the appropriate icon name
                    size={23}
                    style={{color: isTableView ? '#007bff' : '#007bff'}}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {isTableView ? renderTableView() : renderCardView()}
          
          {/* Render modal outside of the views to ensure it's always visible */}
          {selectedStockItem && (
            <QuantitySelectorModal
              isVisible={isModalVisible}
              item={selectedStockItem}
              onClose={() => {
                setModalVisible(false);
                setSelectedStockItem(null);
              }}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </LayoutWrapper>
  );
};

const styles = StyleSheet.create({
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  highlightedTableRow: {
    backgroundColor: '#F9FAFB',
  },
  highlightedText: {
    color: '#F48221',
    fontWeight: '700',
  },
  highlightedCard: {},
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#007bff',
    fontWeight: '500',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  rightHeaderSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#1F2937',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    padding: 8,
    borderRadius: 6,
    marginHorizontal: 2,
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  toggleIcon: {
    fontSize: 18,
  },
  container: {
    flex: 1,
  },
  stockCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    margin: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  stockHeader: {
    flexDirection: 'row',
    padding: 10,
    marginBottom: 5,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3,
  },
  lotNoContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  lotNoLabel: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    alignSelf: 'center',
  },
  lotNoValueContainer: {
    // backgroundColor: 'rgba(244, 130, 33, 0.2)',
    backgroundColor: '#F48221',
    borderRadius: 7,
    padding: 6,
    width: '30%',
    // color: 'F48221',
    // borderWidth: 1,
    // borderColor: '#F48221',
  },
  lotNoValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  detailsContainer: {
    padding: 8,
    paddingTop: 4,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
    marginHorizontal: 8,
    rowGap: -5,
  },
  detailLabel: {
    color: '#F48221',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailValue: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '500',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1a73e8',
    borderWidth: 1,
    borderColor: '#dadce0',
  },
  tableHeaderCell: {
    padding: 10,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    borderRightWidth: 1,
    borderRightColor: '#4285f4',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#dadce0',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#dadce0',
    backgroundColor: '#FFFFFF',
  },
  tableCell: {
    padding: 10,
    fontSize: 13,
    color: '#1F2937',
    borderRightWidth: 2,
    borderRightColor: '#dadce0',
  },
  tableCellContainer: {
    borderRightWidth: 1,
    borderRightColor: '#dadce0',
    justifyContent: 'center',
  },
  tableAddToCartButton: {
    backgroundColor: '#FFFDD0',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 'auto',
    alignSelf: 'center',
  },
  tableCartIcon: {
    fontSize: 16,
  },
  lotNoTableCell: {
    color: '#F48221',
    fontWeight: '600',
  },
  quantityTableCell: {
    color: 'black',
    fontWeight: '600',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff5733',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    elevation: 2,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  addToCartContainer: {
    marginLeft: 8,
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDD0',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  cartIconWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  cartIcon: {
    fontSize: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    marginBottom: 15,
  },
  quantityInput: {
    width: '100%',
    padding: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 20,
  },
  confirmButton: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 5,
    flexDirection: 'row',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  confirmButtonText1: {
    color: 'white',
    fontWeight: 'bold',
  },
  tableContainer: {
    flex: 1,
    position: 'relative',
  },
  horizontalScrollView: {
    flex: 1,
  },
  verticalScrollView: {
    height: '100%',
    maxHeight: '100%',
  },
  refreshIndicator: {
    marginRight: 10,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    marginRight: 10,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  noResultsText: {
    fontSize: 16,
    color: '#ff5733',
    textAlign: 'center',
    fontWeight: '500',
  },
  tableCartButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: 5,
  },
  keyboardAvoidView: {
    flex: 1,
    width: '100%',
  },
});

export default ItemDetailsExpanded;
