import React, {useEffect, useState} from 'react';
import {View, Image, StyleSheet, Text, ActivityIndicator} from 'react-native';
import {useNavigation, NavigationProp} from '@react-navigation/native';
import {RootStackParamList} from '../type/type';
import {migrateAllSecureKeys} from '../utils/migrationHelper';
import {getSecureItem} from '../utils/secureStorage';
import axios from 'axios';

const SplashScreen: React.FC = () => {
  const navigation =
    useNavigation<NavigationProp<RootStackParamList, 'SplashScreen'>>();
  const [migrationComplete, setMigrationComplete] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Perform migration from AsyncStorage to Keychain
        const results = await migrateAllSecureKeys();
        console.log('Migration results:', results);
        setMigrationComplete(true);

        // Check if user token exists (for future use when they login)
        const token = await getSecureItem('userToken');

        // Set the token in axios defaults if it exists
        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          console.log('Token set in axios defaults on app startup');
        }

        // Always navigate to WelcomeScreen first for app review
        // This allows reviewers to see the app without forced login
        setTimeout(() => {
          console.log('Navigating to WelcomeScreen for app review flow');
          navigation.reset({
            index: 0,
            routes: [{name: 'WelcomeScreen'}],
          });
        }, 1000);
      } catch (error) {
        console.error('Initialization error:', error);
        // Navigate to WelcomeScreen on error as well
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{name: 'WelcomeScreen'}],
          });
        }, 1000);
      }
    };

    initialize();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/SavlaLogo.jpg')}
        style={styles.logo}
        resizeMode="contain"
        testID="splash-logo"
      />
      <Text style={styles.text}>Savla Foods and Cold Storage</Text>
      {!migrationComplete && (
        <ActivityIndicator style={styles.loader} size="large" color="#63A1D8" />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    width: 200,
    height: 200,
    marginTop: 0,
  },
  text: {
    fontSize: 18,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    marginTop: 10,
  },
  loader: {
    marginTop: 20,
  },
});

export default SplashScreen;
