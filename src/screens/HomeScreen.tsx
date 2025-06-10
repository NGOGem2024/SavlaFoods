//With Search Result  Mine
import React, {useCallback, useEffect, useState} from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Animated,
  BackHandler,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  RouteProp,
  useFocusEffect,
} from '@react-navigation/native';
import {NavigationProp} from '@react-navigation/native';
import {getSecureItem, setSecureItem} from '../utils/secureStorage';
import {getSecureOrAsyncItem} from '../utils/migrationHelper';
import apiClient from '../utils/apiClient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {MainStackParamList, RootStackParamList} from '../type/type';
import {API_ENDPOINTS, BASE_IMAGE_PATH} from '../config/api.config';
import {
  fetchImageMappings,
  formatImageName,
  getCategoryImage,
  getSubcategoryImage,
  ImageMapping,
} from '../utils/imageRegistry';
import Carousel from '../components/Carousel';
import {useCart} from '../contexts/CartContext';
import {useDisplayName} from '../contexts/DisplayNameContext';
import {LayoutWrapper} from '../components/AppLayout';
import QuantitySelectorModal from '../components/QuantitySelectorModal';
import {useNetwork} from '../contexts/NetworkContext';

interface HomeScreenParams {
  initialLogin?: boolean;
  customerID?: string;
  switchedAccount?: boolean;
  newCustomerId?: string;
}

type CategoryItem = {
  imageUrl: any;
  customerID: string;
  CATID: string;
  CATCODE: string;
  CATDESC: string;
  categoryImage: string;
  subcategoryImage: string;
};

type SearchResultItem = {
  LOT_NO: string;
  ITEM_MARKS: string;
  VAKAL_NO: string;
  BATCH_NO: string;
  AVAILABLE_QTY: number;
  BOX_QUANTITY?: number;
  EXPIRY_DATE?: string;
  REMARKS?: string;
  STATUS?: string;
  UNIT_NAME: string;
  ITEM_ID: string;
  ITEM_CODE: string;
  ITEM_NAME: string;
  DESCRIPTION: string;
  ITEM_CATEG_ID: string;
  ITEM_CATEG_CODE: string;
  ITEM_CATEG_NAME: string;
  ITEM_SUB_CATEGORY_ID: string;
  SUB_CATEGORY_CODE: string;
  SUB_CATEGORY_NAME: string;
  CATEGORY_IMAGE_NAME: string;
  SUBCATEGORY_IMAGE_NAME: string;

  imageUrl?: any;
};

const {width} = Dimensions.get('window');

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'HomeScreen'>>();
  const [CustomerID, setCustomerID] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const {displayName, setDisplayName} = useDisplayName();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<CategoryItem[]>(
    [],
  );
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAllCards, setShowAllCards] = useState(false);
  const [imageMappings, setImageMappings] = useState<{
    categories: ImageMapping[];
    subcategories: ImageMapping[];
  }>({categories: [], subcategories: []});
  const [fadeAnim] = useState(new Animated.Value(1));
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
    customerID?: string | number;
    item_marks: string;
  } | null>(null);
  const {isConnected, addRetryCallback, removeRetryCallback} = useNetwork();
  const [wasDisconnected, setWasDisconnected] = useState(false);

  const {cartItems, clearCart} = useCart() || {};
  const cartItemCount = cartItems?.length || 0;

  // Handle back button press to prevent navigation to login screen
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // Check if there's a search query active
        if (searchQuery.trim()) {
          // Clear the search query to return to home screen view
          setSearchQuery('');
          setSearchResults([]);
          return true; // Prevent default behavior
        }

        // If no search is active, show exit app dialog
        // Check if user is authenticated
        const isAuthenticated = CustomerID !== null;

        if (isAuthenticated) {
          // If authenticated, prevent going back to login screen
          Alert.alert(
            'Exit App',
            'Do you want to exit the app?',
            [
              {text: 'Cancel', style: 'cancel', onPress: () => {}},
              {
                text: 'Exit',
                style: 'destructive',
                onPress: () => BackHandler.exitApp(),
              },
            ],
            {cancelable: true},
          );
          return true; // Prevent default behavior
        }

        // Default behavior (allow back navigation)
        return false;
      };

      // Add back button handler
      BackHandler.addEventListener('hardwareBackPress', onBackPress);

      // Cleanup function
      return () =>
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [CustomerID, searchQuery]),
  );

  const handleAccountSwitch = useCallback(() => {
    setCategories([]);
    setFilteredCategories([]);
    setSearchResults([]);
    fetchCustomerID();
  }, []);

  const fetchCustomerID = useCallback(async () => {
    try {
      const storedId = await getSecureOrAsyncItem('customerID');
      // Also get the stored display name
      const storedDisplayName = await getSecureOrAsyncItem('displayName');

      if (storedDisplayName) {
        setDisplayName(storedDisplayName);
      }

      if (storedId) {
        setCustomerID(storedId);
        fetchCategories(storedId);
      } else {
        interface CustomerResponse {
          customerID: string;
          displayName?: string;
        }
        const response = await apiClient.get<CustomerResponse>(API_ENDPOINTS.GET_CUSTOMER_ID);
        const newId = response.customerID;
        if (newId) {
          await setSecureItem('customerID', newId);
          setCustomerID(newId);
          fetchCategories(newId);

          // If there's a display name in the response, save and set it
          if (response.displayName) {
            await setSecureItem(
              'displayName',
              response.displayName,
            );
            setDisplayName(response.displayName);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching CustomerID:', error);
      Alert.alert('Error', 'Failed to fetch customer ID');
    }
  }, [setDisplayName]);

  const fetchDisplayName = useCallback(async () => {
    try {
      let name = await getSecureOrAsyncItem('Disp_name');
      if (name) {
        setDisplayName(name);
      } else {
        interface CustomerInfoResponse {
          Disp_name: string;
        }
        const response = await apiClient.get<CustomerInfoResponse>(API_ENDPOINTS.GET_CUSTOMER_INFO);
        name = response.Disp_name;
        setDisplayName(name);
        await setSecureItem('Disp_name', name || '');
      }
    } catch (error) {
      console.error('Error fetching Display Name:', error);
    }
  }, [setDisplayName]);

  useEffect(() => {
    fetchDisplayName();
  }, [route.params]);

  const fetchCategories = useCallback(async (customerId: string) => {
    try {
      interface CategoryResponse {
        output: CategoryItem[];
      }
      
      const response = await apiClient.post<CategoryResponse>(
        API_ENDPOINTS.ITEM_CATEGORIES,
        {CustomerID: customerId},
        {timeout: 10000},
      );

      if (response?.output) {
        const uniqueCategories = response.output.reduce(
          (acc: CategoryItem[], current: CategoryItem) => {
            const exists = acc.find(item => item.CATID === current.CATID);
            if (!exists) {
              return [
                ...acc,
                {
                  ...current,
                  categoryImage: formatImageName(current.CATID, true),
                  imageUrl: getCategoryImage(current.CATID),
                },
              ];
            }
            return acc;
          },
          [],
        );

        // Sort categories alphabetically by CATDESC
        const sortedCategories = [...uniqueCategories].sort((a, b) =>
          a.CATDESC.localeCompare(b.CATDESC),
        );

        setCategories(sortedCategories);
        setFilteredCategories(sortedCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', 'Failed to fetch categories');
    }
  }, []);

  // New function to search items with lot details
  const searchItems = useCallback(
    async (searchTerm: string) => {
      if (!CustomerID || !searchTerm.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        interface SearchResponse {
          success: boolean;
          data: SearchResultItem[];
        }
        
        const response = await apiClient.post<SearchResponse>(
          API_ENDPOINTS.SEARCH_ITEMS,
          {
            searchTerm: searchTerm,
            CustomerID: CustomerID,
            includeStockDetails: true, // Make sure backend supports this flag
          },
          {timeout: 10000},
        );

        if (response?.success && response?.data) {
          // Map results and add image URLs
          const resultsWithImages = response.data.map(
            (item: SearchResultItem) => ({
              ...item,
              imageUrl: getCategoryImage(item.ITEM_CATEG_ID),
            }),
          );

          // Setup animations for cart buttons
          const animations: {[key: string]: Animated.Value} = {};
          resultsWithImages.forEach((item: {LOT_NO: any}) => {
            animations[item.LOT_NO || ''] = new Animated.Value(0);
          });
          setCartAnimations(animations);

          setSearchResults(resultsWithImages);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Error searching items:', error);
        Alert.alert('Error', 'Failed to search items');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [CustomerID],
  );

  const handleCartPress = useCallback(() => {
    if (CustomerID) {
      navigation.navigate('PlaceOrderScreen', {
        selectedItems: [],
        shouldRefresh: true,
        customerID: CustomerID,
      });
    } else {
      Alert.alert('Error', 'Customer ID not available');
    }
  }, [CustomerID, navigation]);

  const handleAddToCart = (item: SearchResultItem) => {
    if (!item.LOT_NO) {
      Alert.alert('Error', 'Invalid Lot Number');
      return;
    }

    Animated.timing(cartAnimations[item.LOT_NO], {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    setSelectedStockItem({
      item_id: Number(item.ITEM_ID),
      item_name: item.ITEM_NAME,
      lot_no: item.LOT_NO,
      available_qty: item.AVAILABLE_QTY || 0,
      box_quantity: item.BOX_QUANTITY || 0,
      unit_name: item.UNIT_NAME || '',
      customerID: CustomerID || undefined,
      vakal_no: item.VAKAL_NO || '',
      item_marks: item.ITEM_MARKS || '',
    });

    setModalVisible(true);
  };

  const formatQuantity = (quantity: number | null | undefined) => {
    if (quantity === null || quantity === undefined) return 'N/A';
    return quantity.toLocaleString();
  };

  const renderCardItem = useCallback(
    ({item}: {item: CategoryItem}) => {
      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() =>
            navigation.navigate('SubCategory', {
              category: item.CATDESC,
              categoryId: item.CATID,
              customerID: CustomerID || item.customerID,
              subcategoryImage: item.subcategoryImage,
            })
          }>
          <View style={styles.imageContainer}>
            <Image
              source={item.imageUrl}
              style={styles.cardImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.cardText}>{item.CATDESC}</Text>
        </TouchableOpacity>
      );
    },
    [navigation, CustomerID],
  );

  // Updated render function for search results - removed ItemName and CategoryName
  const renderSearchItem = useCallback(
    ({item, index}: {item: SearchResultItem; index: number}) => {
      return (
        <Animated.View
          style={[
            styles.stockCard,
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
          ]}>
          <View style={styles.stockHeader}>
            <View style={styles.lotNoContainer}>
              <Text style={styles.lotNoLabel}>LOT NO:</Text>

              <TouchableOpacity
                style={styles.lotNoValueContainer}
                onPress={() => {
                  if (CustomerID) {
                    navigation.navigate('LotReportScreen' as any, {
                      lotNo: item.LOT_NO,
                      itemId: item.ITEM_ID,
                      customerID: CustomerID,
                    });
                  } else {
                    Alert.alert('Error', 'Customer ID not available');
                  }
                }}>
                <Text style={styles.lotNoValue}>{item.LOT_NO || 'N/A'}</Text>
              </TouchableOpacity>
            </View>

                            <Animated.View
                  style={[
                    styles.addToCartContainer,
                    {
                      transform: [
                        {
                          scale:
                            cartAnimations[item.LOT_NO]?.interpolate({
                              inputRange: [0, 0.5, 1],
                              outputRange: [1, 1.2, 1],
                            }) || 1,
                        },
                      ],
                    },
                  ]}>
                  <TouchableOpacity
                    style={styles.addToCartButton}
                    onPress={() => handleAddToCart(item)}>
                    <Image
                      source={require('../assets/images/cart.png')}
                      style={{width: 32, height: 32, alignSelf: 'center'}}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                </Animated.View>
          </View>

          <View style={styles.itemNameContainer}>
            <Text style={styles.itemNameText} numberOfLines={2}>
              {item.ITEM_NAME}
            </Text>
            <Text style={styles.categoryText}>{item.ITEM_CATEG_NAME}</Text>
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Unit Name</Text>
                <Text style={styles.detailValue}>{item.UNIT_NAME || ''}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Vakal No:</Text>
                <Text style={styles.detailValue}>{item.VAKAL_NO || ''}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Item Marks</Text>
                <Text style={styles.detailValue}>{item.ITEM_MARKS || ''}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Batch No</Text>
                <Text style={styles.detailValue}>{item.BATCH_NO || ''}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Available Quantity</Text>
                <Text style={styles.detailValue}>
                  {formatQuantity(item.AVAILABLE_QTY)}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Remarks</Text>
                <Text style={styles.detailValue}>{item.REMARKS || ''}</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      );
    },
    [navigation, CustomerID, fadeAnim, cartAnimations],
  );

  const handleSearch = useCallback(
    (text: string) => {
      setSearchQuery(text);

      if (text.trim() === '') {
        // When search is cleared, show all categories
        setSearchResults([]);
        setFilteredCategories(categories); // Reset to show all categories
      } else {
        // When searching, call the API
        searchItems(text);
      }
    },
    [categories, searchItems],
  );

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      searchItems(searchQuery);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        let id: string | null = null;

        // Handle account switching
        if (route.params?.switchedAccount && route.params?.newCustomerId) {
          id = route.params.newCustomerId;
        }
        // Handle initial login
        else if (route.params?.initialLogin && route.params?.customerID) {
          id = route.params.customerID;
        }
        // Use stored CustomerID as fallback
        else {
          id = await getSecureOrAsyncItem('customerID');
        }

        if (id) {
          setCustomerID(id);
          fetchCategories(id);
        }
      } catch (error) {
        console.error('Error initializing data:', error);
        Alert.alert('Error', 'Failed to initialize data');
      }
    };

    initializeData();
  }, [
    route.params?.switchedAccount,
    route.params?.newCustomerId,
    fetchCustomerID,
    fetchCategories,
  ]);

  useEffect(() => {
    if (route.params?.switchedAccount && route.params?.newCustomerId) {
      setCustomerID(route.params.newCustomerId);
      fetchCategories(route.params.newCustomerId);
    }
  }, [route.params?.switchedAccount, route.params?.newCustomerId]);

  useEffect(() => {
    const loadImageMappings = async () => {
      const mappings = await fetchImageMappings();
      setImageMappings(mappings);
    };
    loadImageMappings();
  }, []);

  // Register data refresh callback when network is restored
  useEffect(() => {
    // If we have a CustomerID, register a callback to refetch data
    if (CustomerID) {
      const refreshData = () => {
        console.log('Network restored, refreshing home screen data...');
        fetchCategories(CustomerID);
        if (searchQuery.trim()) {
          searchItems(searchQuery);
        }
      };

      // Register the callback
      addRetryCallback('homescreen-refresh', refreshData);

      // Cleanup - remove the callback when component unmounts
      return () => {
        removeRetryCallback('homescreen-refresh');
      };
    }
  }, [
    CustomerID,
    searchQuery,
    addRetryCallback,
    removeRetryCallback,
    fetchCategories,
    searchItems,
  ]);

  // Monitor network connectivity changes for UI feedback
  useEffect(() => {
    if (isConnected === false) {
      // Network is disconnected
      setWasDisconnected(true);
    } else if (isConnected === true && wasDisconnected) {
      // Network was disconnected before but now connected again
      // UI will update automatically via the callback
      setWasDisconnected(false);
    }
  }, [isConnected, wasDisconnected]);

  return (
    <LayoutWrapper showTabBar={false} route={route}>
      <View style={styles.searchContainer}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.searchInputContainer}
          onPress={handleSearchSubmit}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search lot no, item marks, vakal no.."
            placeholderTextColor={'#999'}
            value={searchQuery}
            onChangeText={handleSearch}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            textAlignVertical="center"
            numberOfLines={1}
          />
          {isSearching ? (
            <ActivityIndicator
              size="small"
              color="#F48221"
              style={styles.searchIcon}
            />
          ) : (
            <Icon
              name="search"
              size={24}
              color="#555"
              style={styles.searchIcon}
            />
          )}
        </TouchableOpacity>
      </View>

      {!searchQuery.trim() && (
        <>
          <Carousel />

          <View style={styles.headingContainer}>
            <Text style={styles.headingText}>Categories</Text>
            <TouchableOpacity onPress={() => setShowAllCards(!showAllCards)}>
              <Text style={styles.moreText}>
                {showAllCards ? 'Less' : 'More->'}
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={
              showAllCards ? filteredCategories : filteredCategories.slice(0, 6)
            }
            renderItem={renderCardItem}
            numColumns={2}
            keyExtractor={item => item.CATID}
            contentContainerStyle={[
              styles.cardContainer,
              filteredCategories.length === 0 && styles.emptyContainer,
            ]}
            scrollEnabled={true}
            ListEmptyComponent={
              <View style={styles.emptyMessage}>
                <Text>No Categories Found</Text>
              </View>
            }
          />
        </>
      )}

      {searchQuery.trim() && (
        <>
          <View style={styles.headingContainer}>
            <Text style={styles.headingText}>Search Results</Text>
            <Text style={styles.resultCountText}>
              {searchResults.length} items found
            </Text>
          </View>

          <FlatList
            data={searchResults}
            renderItem={renderSearchItem}
            numColumns={1}
            keyExtractor={(item, index) =>
              `${item.ITEM_ID}-${item.LOT_NO}-${index}`
            }
            contentContainerStyle={[
              styles.cardContainer,
              searchResults.length === 0 && styles.emptyContainer,
            ]}
            scrollEnabled={true}
            ListEmptyComponent={
              <View style={styles.emptyMessage}>
                {isSearching ? (
                  <ActivityIndicator size="large" color="#F48221" />
                ) : (
                  <Text>No items found matching your search</Text>
                )}
              </View>
            }
          />
        </>
      )}

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
    </LayoutWrapper>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 0,
    width: '100%',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#777',
    paddingRight: 7,
    width: '100%',
  },
  searchInput: {
    flex: 1,
    height: 40,
    paddingLeft: 15,
    paddingRight: 45,
    paddingVertical: 0,
    textAlignVertical: 'center',
    fontSize: 14,
    width: '85%',
  },
  searchIcon: {
    padding: 10,
    marginLeft: 0,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    overflow: 'hidden',
  },
  cardContainer: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    minHeight: 200,
  },
  card: {
    width: (width - 40) / 2,
    margin: 5,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 150,
  },
  cardImage: {
    width: '100%',
    height: 100,
    resizeMode: 'cover',
    borderRadius: 5,
  },
  cardText: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 0,
  },
  headingText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  moreText: {
    fontSize: 16,
    color: '#F48221',
    fontWeight: 'bold',
  },
  emptyMessage: {
    alignItems: 'center',
    padding: 20,
  },
  resultCountText: {
    color: '#666',
    fontSize: 14,
  },

  // Styles for lot detail cards
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
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  lotNoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  lotNoLabel: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 4,
  },
  lotNoValueContainer: {
    backgroundColor: '#F48221',
    borderRadius: 4,
    padding: 6,
    minWidth: '30%',
  },
  lotNoValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  detailsContainer: {
    padding: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
    marginHorizontal: 4,
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
  addToCartContainer: {
    marginLeft: 8,
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 5,
    elevation: 3,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
  },
  highlightedCard: {
    borderWidth: 2,
    borderColor: '#F48221',
  },
  highlightedText: {
    fontWeight: 'bold',
  },
  itemNameContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemNameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 14,
    // color: '#F48221',
    fontWeight: 'bold',
    color: '#007BFA',
  },
});

export default HomeScreen;
