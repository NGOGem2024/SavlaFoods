import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useNavigation, NavigationProp} from '@react-navigation/native';
import {RootStackParamList} from '../type/type';

const demoProducts = [
  {
    id: '1',
    name: 'Dryfruits',

    variety: '8 varieties',
    shelfLife: '12 months',

    image: require('../assets/images/categories/C1.jpg'),
  },
  {
    id: '2',
    name: 'Fruits',
    variety: '25 varieties',
    shelfLife: '7 days',
    image: require('../assets/images/categories/C7.webp'),
  },
  {
    id: '3',
    name: 'Vegetables',
    variety: '8 varieties',
    shelfLife: '10 days',
    image: require('../assets/images/categories/C10.webp'),
  },
  {
    id: '4',
    name: 'Spices',
    variety: '15 varieties',
    shelfLife: '24 months',
    image: require('../assets/images/categories/C12.webp'),
  },
  {
    id: '5',
    name: 'Frozen Food',
    variety: '20 varieties',
    shelfLife: '6 months',
    image: require('../assets/images/categories/C8.jpg'),
  },
];

const DemoProductsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handleProductPress = (productName: string) => {
    Alert.alert(
      'Demo Mode',
      `You selected ${productName}. Login to access full inventory management features.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Login Now',
          onPress: () => navigation.navigate('OtpVerificationScreen'),
        },
      ],
    );
  };

  const renderProductItem = ({item}: {item: any}) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleProductPress(item.name)}>
      <Image source={item.image} style={styles.image} />
      <View style={styles.productInfo}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.price}>{item.variety}</Text>
        <Text style={styles.meta}>Shelf Life: {item.shelfLife}</Text>
        {/* <Text style={styles.stock}>Stock: {item.stock}</Text> */}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Demo Product Catalog</Text>
      </View>

      <View style={styles.demoNotice}>
        <Text style={styles.demoNoticeText}>
          🎯 This is a demo view. Login to access full features!
        </Text>
      </View>

      <FlatList
        data={demoProducts}
        keyExtractor={item => item.id}
        renderItem={renderProductItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={styles.loginPrompt}
        onPress={() => navigation.navigate('OtpVerificationScreen')}>
        <Text style={styles.loginPromptText}>
          Ready to get started? Login Now →
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: '#f8f9fa',
  },
  backButton: {
    marginRight: 15,
  },
  meta: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  backButtonText: {
    fontSize: 16,
    color: '#3498DB',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  demoNotice: {
    backgroundColor: '#E8F6FF',
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3498DB',
  },
  demoNoticeText: {
    fontSize: 14,
    color: '#2980B9',
    textAlign: 'center',
  },
  listContainer: {
    padding: 20,
  },
  card: {
    flexDirection: 'row',
    padding: 15,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  productInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    color: '#27AE60',
    fontWeight: '500',
    marginBottom: 2,
  },
  stock: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  loginPrompt: {
    backgroundColor: '#2ECC71',
    margin: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  loginPromptText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DemoProductsScreen;
