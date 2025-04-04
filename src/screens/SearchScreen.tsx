import React, {useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Modal,
  FlatList,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import axios from 'axios';
import {API_ENDPOINTS, DEFAULT_HEADERS} from '../config/api.config';
// import {CustomerProvider} from '../contexts/DisplayNameContext';
import {useCustomer} from '../contexts/DisplayNameContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// import {useCustomer} from '../contexts/DisplayNameContext';

type SearchType =
  | 'searchCategories'
  | 'searchItemsAndSubCategories'
  | 'searchByLotNumber';

type RootStackParamList = {
  Search: undefined;
  SubCategory: {category: string; categoryId: string; customerID: string};
  ItemDetailScreen: {
    subcategoryId: string;
    subcategoryName: string;
    subcategoryImage: string;
    customerID: string;
  };
  ItemDetailsExpanded: {
    ItemID: number;
    customerID: string;
    searchParams: {customer_id: string; unit_name: string; lot_no: string};
    searchResults: any[];
  };
};

type SearchScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Search'
>;

// const FIXED_CUSTOMER_ID = '1279';
// Search options data
const searchOptions = [
  {
    label: 'Search by Sub-Categories',
    value: 'searchItemsAndSubCategories',
  },
  {
    label: 'Search by Lot Number',
    value: 'searchByLotNumber',
  },
  {
    label: 'Search by Categories',
    value: 'searchCategories',
  },
];

const SearchScreen: React.FC = () => {
  const navigation = useNavigation<SearchScreenNavigationProp>();
  const {customerID} = useCustomer(); // Get customerID from context

  // console.log('Current customerID in SearchScreen:', customerID);
  // const {customerID} = useCustomer();
  const [selectedSearchType, setSelectedSearchType] = useState<SearchType>(
    'searchItemsAndSubCategories',
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Get the label for the currently selected search type
  const getSelectedLabel = () => {
    const selectedOption = searchOptions.find(
      option => option.value === selectedSearchType,
    );
    return selectedOption?.label || '';
  };

  const handleSearch = useCallback(async () => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      setError('Please enter a search term');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      let endpoint;
      const searchData = {
        searchTerm: trimmedQuery,
        CustomerID: customerID,
      };
      switch (selectedSearchType) {
        case 'searchCategories':
          endpoint = API_ENDPOINTS.SEARCH_STOCK_CATEGORIES;
          break;
        case 'searchItemsAndSubCategories':
          endpoint = API_ENDPOINTS.SEARCH_STOCK_SUBCATEGORIES;
          break;
        case 'searchByLotNumber':
          endpoint = API_ENDPOINTS.SEARCH_BY_LOT_NUMBER;
          break;
      }
      const response = await axios.post(endpoint, searchData, {
        headers: DEFAULT_HEADERS,
      });
      const {success, data, message} = response.data;
      if (success && data?.length > 0) {
        switch (selectedSearchType) {
          case 'searchCategories':
            navigation.navigate('SubCategory', {
              category: data[0].CATDESC,
              categoryId: data[0].CATID,
              customerID: customerID,
            });
            break;
          case 'searchItemsAndSubCategories':
            navigation.navigate('ItemDetailScreen', {
              subcategoryId: data[0].ITEM_SUB_CATEGORY_ID.toString(),
              subcategoryName: data[0].SUB_CATEGORY_NAME,
              subcategoryImage: data[0].SUBCATEGORY_IMAGE_NAME || '',
              customerID: customerID,
            });
            break;

          case 'searchByLotNumber':
            const searchResults: SearchResult[] = data.map((item: any) => ({
              itemId: item.ITEM_ID,
              itemName: item.ITEM_NAME,
              lotNo: item.LOT_NO,
              vakalNo: item.VAKAL_NO || '',
              itemMarks: item.ITEM_MARKS || '',
              subCategoryName: item.SUB_CATEGORY_NAME,
              availableQty: item.AVAILABLE_QTY,
              balanceQty: item.BOX_QUANTITY || 0,
              unitName: item.UNIT_NAME,
              description: item.DESCRIPTION,
              batchNo: item.BATCH_NO,
              expiryDate: item.EXPIRY_DATE,
            }));

            navigation.navigate('ItemDetailsExpanded', {
              ItemID: searchResults[0].itemId,
              customerID: customerID,
              searchParams: {
                customer_id: customerID,
                unit_name: searchResults[0].unitName,
                lot_no: searchResults[0].lotNo,
              },
              searchResults,
              searchedLotNo: trimmedQuery, // Pass the searched lot number
            });
            break;
        }
      } else {
        setError(message || 'No matching items found');
      }
    } catch (error: any) {
      console.error('Search error:', error);
      setError(
        error.response?.data?.message || 'An error occurred while searching',
      );
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedSearchType, navigation, customerID]);

  // Render each option in the bottom sheet
  const renderOption = ({item}) => (
    <TouchableOpacity
      style={[
        styles.optionItem,
        selectedSearchType === item.value && styles.selectedOption,
      ]}
      onPress={() => {
        setSelectedSearchType(item.value);
        setIsModalVisible(false);
      }}>
      <Text
        style={[
          styles.optionText,
          selectedSearchType === item.value && styles.selectedOptionText,
        ]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <MaterialIcons
              name="arrow-back"
              size={28}
              style={{color: '#007AFF'}}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Search</Text>
        </View>

        {/* Search Type Selector Button */}
        <View style={styles.selectorContainer}>
          <Text style={styles.selectorLabel}>Search Type:</Text>
          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setIsModalVisible(true)}>
            <Text style={styles.selectorButtonText}>{getSelectedLabel()}</Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Enter search term"
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {error && <Text style={styles.errorText}>{error}</Text>}
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Search</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Sheet Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsModalVisible(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Search Type</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={searchOptions}
              renderItem={renderOption}
              keyExtractor={item => item.value}
              style={styles.optionsList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFF',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000',
    textAlign: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 40,
    borderBottomWidth: 0,
    borderBottomColor: '#ddd',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 10,
    marginLeft: -10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#007AFF',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  // Selector styles
  selectorContainer: {
    marginBottom: 20,
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#000',
  },
  selectorButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 15,
    height: 50,
  },
  selectorButtonText: {
    fontSize: 16,
    color: '#000',
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#007AFF',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: '#FFF',
    color: '#000',
  },
  errorText: {
    color: '#D32F2F',
    marginBottom: 10,
    fontSize: 14,
    textAlign: 'center',
  },
  searchButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20, // Extra padding for iOS home indicator
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    fontSize: 20,
    color: '#888',
    padding: 4,
  },
  optionsList: {
    padding: 8,
  },
  optionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedOption: {
    backgroundColor: '#e6f2ff',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedOptionText: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
});

export default SearchScreen;
