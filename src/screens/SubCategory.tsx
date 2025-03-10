import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import axios from 'axios';
import React, {useCallback, useEffect, useState} from 'react';
import {LayoutWrapper} from '../components/AppLayout';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
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
  const [imageMappings, setImageMappings] = useState<{
    categories: ImageMapping[];
    subcategories: ImageMapping[];
  }>({categories: [], subcategories: []});

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
        let id = await AsyncStorage.getItem('customerID');
        if (id) {
          setCustomerID(id);
        } else {
          const response = await axios.get(`${API_BASE_URL}/getCustomerID`);
          id = response.data.customerID;
          if (id) {
            setCustomerID(id);
            await AsyncStorage.setItem('customerID', id);
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

        setSubCategories(uniqueSubCategories);
        setFilteredSubCategories(uniqueSubCategories);
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
              onError={error => {
                console.warn(
                  `Failed to load image for subcategory ${item.SUBCATID}:`,
                  error,
                );
              }}
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
    // <SafeAreaView style={styles.safeArea}>
    // <StatusBar barStyle="dark-content" backgroundColor="#ddd" />
    <LayoutWrapper showHeader={true} route={route}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search subcategories..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton}>
          <MaterialIcons name="search" size={24} style={{color:"#000"}} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredSubCategories}
        renderItem={renderSubCategoryItem}
        keyExtractor={item => item.SUBCATID}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        onRefresh={fetchSubCategories}
        refreshing={refreshing}
        ListEmptyComponent={() => (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>
              {error || 'No subcategories found'}
            </Text>
          </View>
        )}
      />

      {/* <TabBar route={{name: route.name}} /> */}
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
  searchContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  searchButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
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
});

export default SubCategory;
