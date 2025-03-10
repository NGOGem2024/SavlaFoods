
import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../type/type';

const SplashScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList, 'SplashScreen'>>();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate('OtpVerificationScreen'),{
         
      };
    }, 1000); 

    return () => clearTimeout(timer);
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
    marginTop: 0
  },
  text: {
    fontSize: 18,
    fontFamily: 'Roboto',
    fontWeight: 'bold',
    marginTop: 10
  }
});

export default SplashScreen;