import React, {useEffect, useState} from 'react';
import {View, Image, StyleSheet, Text, ActivityIndicator} from 'react-native';
import {useNavigation, NavigationProp} from '@react-navigation/native';
import {RootStackParamList} from '../type/type';
import {migrateAllSecureKeys} from '../utils/migrationHelper';
import {getSecureItem} from '../utils/secureStorage';

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

        // Check if user is already logged in
        const token = await getSecureItem('userToken');
        
        // Navigate to appropriate screen after a short delay
        setTimeout(() => {
          if (token) {
            navigation.reset({
              index: 0,
              routes: [{name: 'Main'}],
            });
          } else {
            navigation.reset({
              index: 0,
              routes: [{name: 'OtpVerificationScreen'}],
            });
          }
        }, 1000);
      } catch (error) {
        console.error('Initialization error:', error);
        // Navigate to login screen on error
        setTimeout(() => {
          navigation.reset({
            index: 0,
            routes: [{name: 'OtpVerificationScreen'}],
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
