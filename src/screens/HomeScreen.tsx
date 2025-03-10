import React, { useCallback, useEffect, useState } from 'react';
import {
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
  View
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { MainStackParamList, RootStackParamList } from '../type/type';
import { API_ENDPOINTS, BASE_IMAGE_PATH } from '../config/api.config';
import { fetchImageMappings, formatImageName, getCategoryImage, ImageMapping } from '../utils/imageRegistry';
import Carousel from '../components/Carousel';
import Header from '../components/Header';
import { useCart } from '../contexts/CartContext';
import { useDisplayName } from '../contexts/DisplayNameContext';
import {LayoutWrapper} from '../components/AppLayout';
// import { TabBar } from '../components/BottomTabNavigator';

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

const { width } = Dimensions.get('window');

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'HomeScreen'>>();
  const [CustomerID, setCustomerID] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { displayName, setDisplayName } = useDisplayName();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<CategoryItem[]>([]);
  const [showAllCards, setShowAllCards] = useState(false);
  const [imageMappings, setImageMappings] = useState<{
    categories: ImageMapping[];
    subcategories: ImageMapping[];
  }>({ categories: [], subcategories: [] });

  const { cartItems , clearCart } = useCart() || {};
  const cartItemCount = cartItems?.length || 0;

  const handleAccountSwitch = useCallback(() => {
    setCategories([]);
    setFilteredCategories([]);
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
            await AsyncStorage.setItem('displayName', response.data.displayName);
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
      let name = await AsyncStorage.getItem("Disp_name");
      if (name) {
        setDisplayName(name);
      } else {
        const response = await axios.get(API_ENDPOINTS.GET_CUSTOMER_INFO);
        name = response.data.Disp_name;
        setDisplayName(name);
        await AsyncStorage.setItem("Disp_name", name || "");
      }
    } catch (error) {
      console.error("Error fetching Display Name:", error);
    }
  }, [setDisplayName]);
  
  // Add this useEffect
  useEffect(() => {
    fetchDisplayName();
  }, [route.params]);

  const fetchCategories = useCallback(async (customerId: string) => {
    try {
      const response = await axios.post(
        API_ENDPOINTS.ITEM_CATEGORIES,
        { CustomerID: customerId },
        { timeout: 10000 }
      );

      if (response.data?.output) {
        const uniqueCategories = response.data.output.reduce(
          (acc: CategoryItem[], current: CategoryItem) => {
            const exists = acc.find((item) => item.CATID === current.CATID);
            if (!exists) {
              return [...acc, {
                ...current,
                categoryImage: formatImageName(current.CATID, true),
                imageUrl: getCategoryImage(current.CATID)
              }];
            }
            return acc;
          },
          []
        );

        setCategories(uniqueCategories);
        setFilteredCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', 'Failed to fetch categories');
    }
  }, []);

  const handleCartPress = useCallback(() => {
    if (CustomerID) {
      navigation.navigate('PlaceOrderScreen', {
        selectedItems: [], 
        shouldRefresh: true,
        customerID: CustomerID // This must be a string, not null
      });
    } else {
      Alert.alert('Error', 'Customer ID not available');
    }
  }, [CustomerID, navigation]);
  
  const renderCardItem = useCallback(
    ({ item }: { item: CategoryItem }) => {
      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() =>
            navigation.navigate('SubCategory', {
              category: item.CATDESC,
              categoryId: item.CATID,
              customerID: CustomerID || item.customerID,
              subcategoryImage: item.subcategoryImage
            })
          }
        >
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
    [navigation, CustomerID]
  );

  const handleSearch = useCallback(
    (text: string) => {
      setSearchQuery(text);
      const filtered = categories.filter((category) =>
        category.CATDESC.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredCategories(filtered);
    },
    [categories]
  );
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
        console.error("Error initializing data:", error);
        Alert.alert("Error", "Failed to initialize data");
      }
    };

    initializeData();
  }, [
    route.params?.switchedAccount, 
    route.params?.newCustomerId,
    fetchCustomerID,
    fetchCategories
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
          placeholder="Search..."
          placeholderTextColor={'#000'}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton}>
          <Icon name="search" size={24} style={{color:"#000"}} />
        </TouchableOpacity>
      </View>

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
        data={showAllCards ? filteredCategories : filteredCategories.slice(0, 6)}
        renderItem={renderCardItem}
        numColumns={2}

        keyExtractor={(item) => item.CATID}
        contentContainerStyle={[styles.cardContainer,
          filteredCategories.length === 0 && styles.emptyContainer,
        ]}
        scrollEnabled={true}
        ListEmptyComponent={
          <View>
            <Text>No Categories Found</Text>
          </View>
        }
      />
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
    fontSize: 22,
    fontWeight: 'bold',
  },
  moreText: {
    fontSize: 16,
    color: '#F48221',
    fontWeight: 'bold',
  },
});

export default HomeScreen;