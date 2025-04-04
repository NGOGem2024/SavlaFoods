import {NavigationProp, RouteProp} from '@react-navigation/native';
import axios from 'axios';
import React, {useCallback, useEffect, useState} from 'react';
import {API_ENDPOINTS, BASE_IMAGE_PATH} from '../config/api.config';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons'; // Changed import
import {MainStackParamList} from '../type/type';
import {LayoutWrapper} from '../components/AppLayout';
import {getSubcategoryImage} from '../utils/imageRegistry';

const {width} = Dimensions.get('window');

interface Item {
  ITEM_SUB_CATEGORY_ID: number;
  ITEM_ID: number;
  ITEM_CODE: string;
  DESCRIPTION: string;
  ITEM_NAME: string;
  customerID: string;
}

type ItemDetailScreenRouteProp = RouteProp<
  MainStackParamList,
  'ItemDetailScreen'
>;
type ItemDetailScreenNavigationProp = NavigationProp<MainStackParamList>;

interface ItemDetailScreenProps {
  route: ItemDetailScreenRouteProp;
  navigation: ItemDetailScreenNavigationProp;
}

const ItemDetailScreen: React.FC<ItemDetailScreenProps> = ({
  route,
  navigation,
}) => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const customerID = route.params?.customerID;
  const subcategoryId = route.params?.subcategoryId;
  const subcategoryName = route.params?.subcategoryName || 'Items';
  const subcategoryImage = route.params?.subcategoryImage;

  useEffect(() => {
    if (!subcategoryId || !customerID) {
      setError('Invalid subcategory ID or Customer ID');
      setLoading(false);
      return;
    }
    fetchItems();
  }, [subcategoryId, customerID]);

  // const fetchItems = useCallback(
  //   async (showLoader = true) => {
  //     if (showLoader) setLoading(true);
  //     setError(null);

  //     try {
  //       console.log(
  //         'Fetching items for subcategory ID:',
  //         subcategoryId,
  //         'CustomerID:',
  //         customerID,
  //       );

  //       const payload = {
  //         SubCategoryID: subcategoryId,
  //         CustomerID: customerID,
  //       };

  //       console.log('Sending request with payload:', payload);
  //       const response = await axios.post(API_ENDPOINTS.GET_ITEMS, payload, {
  //         headers: {
  //           'Content-Type': 'application/json',
  //           Accept: 'application/json',
  //         },
  //         timeout: 10000,
  //       });

  //       console.log('API Response:', response.data);
  //       if (
  //         response.data?.status === 'success' &&
  //         response.data?.output?.items
  //       ) {
  //         setItems(response.data.output.items);
  //       } else {
  //         setError(response.data?.message || 'No items available');
  //         setItems([]);
  //       }
  //     } catch (err) {
  //       const errorMessage = axios.isAxiosError(err)
  //         ? err.response?.data?.message || err.message
  //         : 'Unexpected error occurred';

  //       setError(`Error: ${errorMessage}`);
  //       console.error('Fetch Items Error:', err);
  //       setItems([]);
  //     } finally {
  //       setLoading(false);
  //       setRefreshing(false);
  //     }
  //   },
  //   [subcategoryId, customerID],
  // );

  const fetchItems = useCallback(
    async (showLoader = true) => {
      if (showLoader) setLoading(true);
      setError(null);

      try {
        console.log(
          'Fetching items for subcategory ID:',
          subcategoryId,
          'CustomerID:',
          customerID,
        );

        const payload = {
          SubCategoryID: subcategoryId,
          CustomerID: customerID,
        };

        console.log('Sending request with payload:', payload);
        const response = await axios.post(API_ENDPOINTS.GET_ITEMS, payload, {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          timeout: 10000,
        });

        console.log('API Response:', response.data);
        if (
          response.data?.status === 'success' &&
          response.data?.output?.items
        ) {
          // More robust filtering to remove items with no meaningful data
          const filteredItems = response.data.output.items.filter(
            (item: Item) =>
              // Check for meaningful content in key fields
              item.ITEM_NAME &&
              item.ITEM_NAME.trim() !== '' &&
              item.DESCRIPTION &&
              item.DESCRIPTION.trim() !== '' &&
              // Additional checks to ensure the item has useful data
              item.ITEM_CODE &&
              item.ITEM_CODE.trim() !== '' &&
              // Optional: Add more specific checks if needed
              item.ITEM_ID !== null &&
              item.ITEM_ID !== undefined,
          );

          console.log(
            `Total items: ${response.data.output.items.length}, Filtered items: ${filteredItems.length}`,
          );

          setItems(filteredItems);

          // If no items after filtering, set an appropriate error message
          if (filteredItems.length === 0) {
            setError('No items with complete information found');
          }
        } else {
          setError(response.data?.message || 'No items available');
          setItems([]);
        }
      } catch (err) {
        const errorMessage = axios.isAxiosError(err)
          ? err.response?.data?.message || err.message
          : 'Unexpected error occurred';

        setError(`Error: ${errorMessage}`);
        console.error('Fetch Items Error:', err);
        setItems([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [subcategoryId, customerID],
  );

  const handleViewDetails = useCallback(
    (item: Item) => {
      if (!item.ITEM_ID) {
        Alert.alert('Error', 'Invalid item ID');
        return;
      }
      console.log(item.ITEM_ID);

      navigation.navigate('ItemDetailsExpanded', {
        ItemID: item.ITEM_ID,
        itemName: item.ITEM_NAME,
        customerID: customerID,
      });
    },
    [navigation, customerID],
  );

  const renderHeaderImage = useCallback(() => {
    let imageSource;

    // First check if we have a local image in the registry
    const localImage = getSubcategoryImage(subcategoryId);
    if (localImage) {
      console.log(
        'Using local image from registry for subcategory ID:',
        subcategoryId,
      );
      imageSource = localImage;
    }
    // Then check if we have a subcategoryImage string
    else if (
      subcategoryImage &&
      typeof subcategoryImage === 'string' &&
      subcategoryImage.trim() !== ''
    ) {
      // Check if it's already a complete URL
      if (subcategoryImage.startsWith('http')) {
        console.log('Using complete image URL:', subcategoryImage);
        imageSource = {uri: subcategoryImage};
      } else {
        // It's a relative path or just a filename, construct the full URL
        const baseUrl = 'http://202.189.234.140:5000/assets/images/';
        // Remove any leading slash if present
        const cleanImageName = subcategoryImage.startsWith('/')
          ? subcategoryImage.substring(1)
          : subcategoryImage;

        const imageUrl = `${baseUrl}${cleanImageName}`;
        console.log('Constructed image URL:', imageUrl);
        imageSource = {uri: imageUrl};
      }
    } else {
      // No image information available, use default
      console.log('No image information found, using default');
      imageSource = require('../assets/images/default.jpg');
    }

    return (
      <View style={styles.imageContainer}>
        <Image
          source={imageSource}
          style={styles.headerImage}
          resizeMode="contain"
          onError={e => {
            console.error('Image loading error:', e.nativeEvent.error);
            setImageError(true);
          }}
        />
        {imageError && (
          <View style={styles.fallbackImageContainer}>
            <Text style={styles.imageErrorText}>Image not available</Text>
            <Ionicons
              name="image-outline"
              size={40}
              style={{color: '#cccccc'}}
            />
          </View>
        )}
      </View>
    );
  }, [subcategoryId, subcategoryImage, imageError]);

  const renderItem = useCallback(
    ({item}: {item: Item}) => {
      return (
        <TouchableOpacity
          style={styles.itemCard}
          onPress={() => handleViewDetails(item)}>
          <View style={styles.itemContent}>
            <View style={styles.itemMainInfo}>
              <Text style={styles.itemName}>{item.ITEM_NAME}</Text>
              <Text style={styles.description}>{item.DESCRIPTION}</Text>
              <TouchableOpacity
                style={styles.viewDetailsButton}
                onPress={() => handleViewDetails(item)}>
                <Ionicons
                  name="arrow-forward-outline"
                  size={20}
                  style={{color: '#2196f3'}}
                />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [handleViewDetails],
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchItems(false);
  }, [fetchItems]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <LayoutWrapper showHeader={true} route={route}>
      <View style={styles.container}>
        <StatusBar backgroundColor="#ffffff" barStyle="dark-content" />
        <View style={styles.header}>
          <View style={styles.headerContentWrapper}>
            <View style={styles.titleContainer}>
              <Text style={styles.headerText} numberOfLines={2}>
                {subcategoryName}
              </Text>
              <View style={styles.statsContainer}>
                <Ionicons
                  name="cube-outline"
                  size={16}
                  style={{color: '#666666'}}
                />
                <Text style={styles.statsText}>
                  {items.length} {items.length === 0 || items.length === 1 ? 'Item Available' : 'Items Available'}
                </Text>
              </View>
            </View>
            {renderHeaderImage()}
          </View>
          <View style={styles.divider} />
        </View>

        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={item => item.ITEM_ID.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{error || 'No items found'}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => fetchItems()}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={styles.listContainer}
        />
      </View>
    </LayoutWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  fallbackImageContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  headerContentWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    marginRight: 10,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F48221',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  statsText: {
    marginLeft: 5,
    color: '#666',
    fontSize: 12,
  },
  imageContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  imageErrorText: {
    color: 'red',
    fontSize: 10,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 10,
  },
  listContainer: {
    paddingHorizontal: 15,
  },
  itemCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemMainInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  viewDetailsButton: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#2196f3',
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
  },
});

export default ItemDetailScreen;
