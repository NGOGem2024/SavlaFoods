//Mayur
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import axios from 'axios';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {LayoutWrapper} from '../components/AppLayout';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  fetchImageMappings,
  formatImageName,
  getSubcategoryImage,
  ImageMapping,
} from '../utils/imageRegistry';
import {API_BASE_URL} from '../config/api.config';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {getSecureItem, setSecureItem} from '../utils/secureStorage';
import {getSecureOrAsyncItem} from '../utils/migrationHelper';

interface CustomToastProps {
  message: string;
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

type MainStackParamList = {
  SubCategory: {
    category: string;
    categoryId: string;
  };
  ItemDetailScreen: {
    subcategoryId: string;
    subcategoryName: string;
    subcategoryImage: string;
    customerID: string;
  };
};

type SubCategoryScreenRouteProp = RouteProp<MainStackParamList, 'SubCategory'>;

type SubCategoryItem = {
  CustomerID: string;
  CATID: string;
  CATDESC: string;
  SUBCATID: string;
  SUBCATCODE: string;
  SUBCATDESC: string;
  subcategoryImage: string;
  imageUrl: any;
};

type NavigationProp = {
  navigate: (screen: string, params: any) => void;
};

const {width} = Dimensions.get('window');

// Custom Toast component for iOS
const CustomToast: React.FC<CustomToastProps> = ({
  message,
  visible,
  setVisible,
}) => {
  // Component logic

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setVisible(false));
    }
  }, [visible, fadeAnim, setVisible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}>
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

const SubCategory: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<SubCategoryScreenRouteProp>();
  const [CustomerID, setCustomerID] = useState<string | null>(null);
  const [subCategories, setSubCategories] = useState<SubCategoryItem[]>([]);
  const [filteredSubCategories, setFilteredSubCategories] = useState<
    SubCategoryItem[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [imageMappings, setImageMappings] = useState<{
    categories: ImageMapping[];
    subcategories: ImageMapping[];
  }>({categories: [], subcategories: []});

  // Show toast function
  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.showWithGravity(
        message,
        ToastAndroid.SHORT,
        ToastAndroid.BOTTOM,
      );
    } else {
      // For iOS
      setToastMessage(message);
      setToastVisible(true);
    }
  };

  useEffect(() => {
    const loadImageMappings = async () => {
      const mappings = await fetchImageMappings();
      setImageMappings(mappings);
    };
    loadImageMappings();
  }, []);

  useEffect(() => {
    const fetchCustomerID = async () => {
      try {
        let id = await getSecureOrAsyncItem('customerID');
        if (id) {
          setCustomerID(id);
        } else {
          const response = await axios.get(`${API_BASE_URL}/getCustomerID`);
          id = response.data.customerID;
          if (id) {
            setCustomerID(id);
            await setSecureItem('customerID', id);
          }
        }
      } catch (error) {
        console.error('Error fetching CustomerID:', error);
        setError('Failed to fetch Customer ID');
      }
    };

    fetchCustomerID();
  }, []);

  useEffect(() => {
    if (CustomerID && route.params.categoryId) {
      fetchSubCategories();
    }
  }, [CustomerID, route.params.categoryId]);

  const fetchSubCategories = useCallback(async () => {
    if (!CustomerID || !route.params.categoryId) {
      console.log('Waiting for CustomerID or categoryId...');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(
        `${API_BASE_URL}/sf/getItemCatSubCat`,
        {
          CustomerID: CustomerID,
        },
        {
          timeout: 10000,
        },
      );

      if (response.data && response.data.output) {
        const filteredSubCategories = response.data.output.filter(
          (item: SubCategoryItem) => item.CATID === route.params.categoryId,
        );

        const uniqueSubCategories = filteredSubCategories.map(
          (item: SubCategoryItem) => ({
            ...item,
            CustomerID: CustomerID || '',
            subcategoryImage: formatImageName(item.SUBCATID, false),
            imageUrl: getSubcategoryImage(item.SUBCATID),
          }),
        );

        // Sort subcategories alphabetically by SUBCATDESC
        const sortedSubCategories = [...uniqueSubCategories].sort((a, b) =>
          a.SUBCATDESC.localeCompare(b.SUBCATDESC),
        );

        setSubCategories(sortedSubCategories);
        setFilteredSubCategories(sortedSubCategories);
      } else {
        setError('No data received from server');
      }
    } catch (err) {
      console.error('Error fetching subcategories:', err);
      if (axios.isAxiosError(err)) {
        if (err.response) {
          setError(`Server error: ${err.response.status}`);
        } else if (err.request) {
          setError('Network error. Please check your connection.');
        } else {
          setError('An unexpected error occurred');
        }
      } else {
        setError('Failed to load subcategories');
      }
      Alert.alert('Error', 'Failed to load subcategories. Please try again.', [
        {text: 'OK'},
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [CustomerID, route.params.categoryId]);

  const handleSearch = useCallback(
    (text: string) => {
      setSearchQuery(text);
      const filtered = subCategories.filter(subcategory =>
        subcategory.SUBCATDESC.toLowerCase().includes(text.toLowerCase()),
      );
      setFilteredSubCategories(filtered);
    },
    [subCategories],
  );

  const handleSort = useCallback(
    (order: 'asc' | 'desc') => {
      setSortOrder(order);
      const sorted = [...filteredSubCategories].sort((a, b) => {
        if (order === 'asc') {
          return a.SUBCATDESC.localeCompare(b.SUBCATDESC);
        } else {
          return b.SUBCATDESC.localeCompare(a.SUBCATDESC);
        }
      });
      setFilteredSubCategories(sorted);

      showToast(
        `Sorted in ${order === 'asc' ? 'ascending' : 'descending'} order`,
      );
    },
    [filteredSubCategories],
  );

  const handleSubCategoryPress = useCallback(
    (item: SubCategoryItem) => {
      console.log('Navigating to ItemDetailScreen with:', {
        subcategoryId: item.SUBCATID,
        subcategoryName: item.SUBCATDESC,
        subcategoryImage: item.imageUrl,
        customerID: item.CustomerID || CustomerID,
      });

      navigation.navigate('ItemDetailScreen', {
        subcategoryId: item.SUBCATID,
        subcategoryName: item.SUBCATDESC,
        subcategoryImage: item.imageUrl,
        customerID: item.CustomerID || CustomerID || '',
      });
    },
    [navigation, CustomerID],
  );

  const renderSubCategoryItem = useCallback(
    ({item}: {item: SubCategoryItem}) => {
      return (
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.7}
          onPress={() => handleSubCategoryPress(item)}>
          <View style={styles.imageContainer}>
            <Image
              source={item.imageUrl}
              style={styles.cardImage}
              resizeMode="contain"
              // onError={error => {
              //   console.warn(
              //     `Failed to load image for subcategory ${item.SUBCATID}:`,
              //     error,
              //   );
              // }}
            />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.categoryCode}>{item.SUBCATCODE}</Text>
            <Text style={styles.categoryName} numberOfLines={2}>
              {item.SUBCATDESC}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [handleSubCategoryPress],
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }
  return (
    <LayoutWrapper showHeader={true} route={route}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.mainContainer}>
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Icon
                name="search"
                size={24}
                color="#777"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by subcategories..."
                placeholderTextColor="#888"
                value={searchQuery}
                onChangeText={handleSearch}
              />
            </View>

            <View style={styles.sortButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.sortButton,
                  sortOrder === 'asc' ? styles.activeSort : styles.inactiveSort,
                ]}
                onPress={() => handleSort('asc')}>
                <MaterialIcons
                  name="arrow-upward"
                  size={20}
                  style={[
                    styles.sortIcon,
                    sortOrder === 'asc'
                      ? styles.activeSortIcon
                      : styles.inactiveSortIcon,
                  ]}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sortButton,
                  sortOrder === 'desc'
                    ? styles.activeSort
                    : styles.inactiveSort,
                ]}
                onPress={() => handleSort('desc')}>
                <MaterialIcons
                  name="arrow-downward"
                  size={20}
                  style={[
                    styles.sortIcon,
                    sortOrder === 'desc'
                      ? styles.activeSortIcon
                      : styles.inactiveSortIcon,
                  ]}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <FlatList
          data={filteredSubCategories}
          renderItem={renderSubCategoryItem}
          keyExtractor={item => item.SUBCATID}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          onRefresh={fetchSubCategories}
          refreshing={refreshing}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={() => (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>
                {error || 'No subcategories found'}
              </Text>
            </View>
          )}
        />

        {Platform.OS === 'ios' && (
          <CustomToast
            message={toastMessage}
            visible={toastVisible}
            setVisible={setToastVisible}
          />
        )}
      </KeyboardAvoidingView>
    </LayoutWrapper>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContainer: {
    flexDirection: 'column',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'space-between',
    // width: '90%',
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#f5f5f5',
    borderRadius: 18,
    paddingHorizontal: 5,
    marginRight: 8,
    fontSize: 14,
    width: '20%',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 8,
    height: 40,
  },

  searchIcon: {
    marginRight: 6,
  },

  searchButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 18,
    marginRight: 8,
  },
  sortButtonsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    padding: 4.3,
    marginLeft: 8,
  },
  sortButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    marginHorizontal: 2,
  },
  activeSort: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 2,
  },
  inactiveSort: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  sortIcon: {
    margin: 0,
  },
  activeSortIcon: {
    color: '#2196F3',
  },
  inactiveSortIcon: {
    color: '#90A4AE',
  },
  listContainer: {
    padding: 10,
  },
  card: {
    flex: 1,
    margin: 5,
    borderRadius: 10,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    maxWidth: (width - 30) / 2,
  },
  imageContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    padding: 10,
  },
  categoryCode: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  keyboardAvoidView: {
    flex: 1,
    width: '100%',
  },
  toast: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#2196F3',
    padding: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 6,
    maxWidth: width * 0.8,
  },
  toastIcon: {
    marginRight: 8,
  },
  toastText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});
export default SubCategory;
