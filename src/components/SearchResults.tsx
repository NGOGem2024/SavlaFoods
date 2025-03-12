import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import {API_ENDPOINTS} from '../config/api.config';

const {width} = Dimensions.get('window');

const SearchResults = ({
  searchQuery,
  customerID,
  navigation,
  visible,
  onCloseSearch,
}) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  const searchItems = useCallback(async () => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        API_ENDPOINTS.SEARCH_ITEMS,
        {
          searchTerm: searchQuery,
          CustomerID: customerID,
        },
        {timeout: 10000},
      );

      if (response.data?.success && response.data?.data) {
        setResults(response.data.data);

        // Animate items
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to fetch search results. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, customerID, fadeAnim]);

  React.useEffect(() => {
    if (visible) {
      const delayDebounce = setTimeout(() => {
        searchItems();
      }, 500);

      return () => clearTimeout(delayDebounce);
    }
  }, [searchQuery, visible, searchItems]);

  const fadeIn = index => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  };

  const handleItemPress = item => {
    navigation.navigate('ItemDetailsExpanded', {
      ItemID: item.ITEM_ID,
      customerID: customerID,
      searchedLotNo: item.LOT_NO,
    });
  };

  const renderSearchItem = ({item, index}) => {
    return (
      <Animated.View
        style={[
          styles.searchCard,
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
        <TouchableOpacity
          style={styles.searchCardInner}
          onPress={() => handleItemPress(item)}>
          <View style={styles.searchCardHeader}>
            <View style={styles.lotNoContainer}>
              <Text style={styles.lotNoLabel}>LOT NO: </Text>
              <Text style={styles.lotNoValue}>{item.LOT_NO || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Item Name</Text>
                <Text style={styles.detailValue}>{item.ITEM_NAME || ''}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Unit</Text>
                <Text style={styles.detailValue}>{item.UNIT_NAME || ''}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Category</Text>
                <Text style={styles.detailValue}>
                  {item.ITEM_CATEG_NAME || ''}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Sub Category</Text>
                <Text style={styles.detailValue}>
                  {item.SUB_CATEGORY_NAME || ''}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Vakal No</Text>
                <Text style={styles.detailValue}>{item.VAKAL_NO || ''}</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Item Marks</Text>
                <Text style={styles.detailValue}>{item.ITEM_MARKS || ''}</Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Available Qty</Text>
                <Text style={styles.detailValue}>
                  {item.AVAILABLE_QTY?.toLocaleString() || '0'}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Batch No</Text>
                <Text style={styles.detailValue}>{item.BATCH_NO || ''}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (!visible) return null;

  return (
    <View style={styles.searchResultsContainer}>
      <View style={styles.searchResultsHeader}>
        <Text style={styles.searchResultsTitle}>Search Results</Text>
        <TouchableOpacity style={styles.closeButton} onPress={onCloseSearch}>
          <Icon name="close" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F48221" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Icon name="search-off" size={48} color="#999" />
          <Text style={styles.noResultsText}>
            {searchQuery.trim().length < 2
              ? 'Enter at least 2 characters to search'
              : 'No results found'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderSearchItem}
          keyExtractor={(item, index) =>
            `${item.ITEM_ID}-${item.LOT_NO}-${index}`
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  searchResultsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f5f5f5',
    zIndex: 100,
  },
  searchResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  searchResultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  listContainer: {
    padding: 10,
  },
  loadingContainer: {
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
    color: 'red',
    textAlign: 'center',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noResultsText: {
    fontSize: 16,
    color: '#777',
    marginTop: 10,
    textAlign: 'center',
  },
  searchCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    overflow: 'hidden',
  },
  searchCardInner: {
    padding: 15,
  },
  searchCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  lotNoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lotNoLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
  },
  lotNoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F48221',
  },
  detailsContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 10,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
});

export default SearchResults;
