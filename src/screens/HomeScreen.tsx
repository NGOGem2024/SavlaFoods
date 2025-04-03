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
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NavigationProp} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
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
  // Additional properties for UI
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
    item_id: number | string;
    item_name: string;
    lot_no: string;
    available_qty: number;
    box_quantity?: number;
    unit_name: string;
    vakal_no: string;
    customerID?: number | string;
    item_marks: string;
  } | null>(null);

  const {cartItems, clearCart} = useCart() || {};
  const cartItemCount = cartItems?.length || 0;

  const handleAccountSwitch = useCallback(() => {
    setCategories([]);
    setFilteredCategories([]);
    setSearchResults([]);
    fetchCustomerID();
  }, []);

  const fetchCustomerID = useCallback(async () => {
    try {
      const storedId = await AsyncStorage.getItem('customerID');
      // Also get the stored display name
      const storedDisplayName = await AsyncStorage.getItem('displayName');

      if (storedDisplayName) {
        setDisplayName(storedDisplayName);
      }

      if (storedId) {
        setCustomerID(storedId);
        fetchCategories(storedId);
      } else {
        const response = await axios.get(API_ENDPOINTS.GET_CUSTOMER_ID);
        const newId = response.data.customerID;
        if (newId) {
          await AsyncStorage.setItem('customerID', newId);
          setCustomerID(newId);
          fetchCategories(newId);

          // If there's a display name in the response, save and set it
          if (response.data.displayName) {
            await AsyncStorage.setItem(
              'displayName',
              response.data.displayName,
            );
            setDisplayName(response.data.displayName);
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
      let name = await AsyncStorage.getItem('Disp_name');
      if (name) {
        setDisplayName(name);
      } else {
        const response = await axios.get(API_ENDPOINTS.GET_CUSTOMER_INFO);
        name = response.data.Disp_name;
        setDisplayName(name);
        await AsyncStorage.setItem('Disp_name', name || '');
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
      const response = await axios.post(
        API_ENDPOINTS.ITEM_CATEGORIES,
        {CustomerID: customerId},
        {timeout: 10000},
      );

      if (response.data?.output) {
        const uniqueCategories = response.data.output.reduce(
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
        const response = await axios.post(
          API_ENDPOINTS.SEARCH_ITEMS,
          {
            searchTerm: searchTerm,
            CustomerID: CustomerID,
            includeStockDetails: true, // Make sure backend supports this flag
          },
          {timeout: 10000},
        );

        if (response.data?.success && response.data?.data) {
          // Map results and add image URLs
          const resultsWithImages = response.data.data.map(
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
      item_id: item.ITEM_ID,
      item_name: item.ITEM_NAME,
      lot_no: item.LOT_NO,
      available_qty: item.AVAILABLE_QTY || 0,
      box_quantity: item.BOX_QUANTITY || 0,
      unit_name: item.UNIT_NAME || '',
      customerID: CustomerID,
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
              <Text style={styles.lotNoLabel}>LOT NO : </Text>

              <TouchableOpacity
                style={styles.lotNoValueContainer}
                onPress={() =>
                  navigation.navigate('LotReportScreen', {
                    // Add any necessary params for LotReportScreen
                    lotNo: item.LOT_NO,
                    itemId: item.ITEM_ID,
                    customerID: CustomerID,
                  })
                }>
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
                <View style={styles.cartIconWrapper}>
                  <Text style={styles.cartIcon}>🛒</Text>
                </View>
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
        // When search is cleared, show categories
        setSearchResults([]);
        const filtered = categories.filter(category =>
          category.CATDESC.toLowerCase().includes(text.toLowerCase()),
        );
        setFilteredCategories(filtered);
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
          id = await AsyncStorage.getItem('customerID');
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

  return (
    <LayoutWrapper
      onCartPress={handleCartPress}
      onAccountSwitch={handleAccountSwitch}
      showTabBar={false}
      route={route}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search lot numbers, item marks, vakal numbers..."
          placeholderTextColor={'#000'}
          value={searchQuery}
          onChangeText={handleSearch}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearchSubmit}>
          {isSearching ? (
            <ActivityIndicator size="small" color="#F48221" />
          ) : (
            <Icon name="search" size={24} style={{color: '#000'}} />
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
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
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
  searchButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
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
    fontSize: 21,
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
