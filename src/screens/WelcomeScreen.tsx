import React, {useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NavigationProp} from '@react-navigation/native';
import {RootStackParamList} from '../type/type';
import {getSecureItem} from '../utils/secureStorage';

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    console.log('WelcomeScreen mounted');
    checkUserLoginStatus();
  }, []);

  const checkUserLoginStatus = async () => {
    try {
      const token = await getSecureItem('userToken');
      if (token) {
        console.log('User has valid token, can skip login if needed');
        // You can add logic here to show a "Continue as logged in user" option
      }
    } catch (error) {
      console.log('No token found or error checking token');
    }
  };

  const handleLoginPress = () => {
    console.log('Navigating to login screen');
    navigation.navigate('OtpVerificationScreen');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image
        source={require('../assets/SavlaLogo.jpg')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Welcome to Savla Foods & Cold Storage</Text>
      <Text style={styles.subtitle}>
        Manage your inventory & orders with ease
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Explore App Features</Text>
        <Text style={styles.bullet}>• Browse product categories</Text>
        <Text style={styles.bullet}>• Real-time stock updates</Text>
        <Text style={styles.bullet}>• Easy order placement</Text>
        <Text style={styles.bullet}>• PDF reports</Text>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('DemoProductsScreen')}>
        <Text style={styles.buttonText}>Explore Demo</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.loginButton]}
        onPress={handleLoginPress}>
        <Text style={styles.buttonText}>Login to Continue</Text>
      </TouchableOpacity>

      <Text style={styles.demoText}>
        👆 Try the demo above to explore features without logging in
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    flexGrow: 1,
    justifyContent: 'center',
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2C3E50',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#7F8C8D',
    marginVertical: 10,
  },
  section: {
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#34495E',
  },
  bullet: {
    fontSize: 14,
    marginVertical: 2,
    color: '#555',
  },
  button: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    backgroundColor: '#3498DB',
    minWidth: 200,
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: '#2ECC71',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  demoText: {
    marginTop: 15,
    fontSize: 12,
    color: '#95A5A6',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default WelcomeScreen;
