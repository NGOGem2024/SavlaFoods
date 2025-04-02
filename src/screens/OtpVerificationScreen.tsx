//Mine
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import {RouteProp, useNavigation} from '@react-navigation/native';
// import {StackNavigationProp} from '@react-navigation/stack';
// import React, {useState} from 'react';
// import {
//   Alert,
//   Dimensions,
//   Image,
//   Keyboard,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   TouchableWithoutFeedback,
//   View,
//   ActivityIndicator,
// } from 'react-native';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// import {RootStackParamList, MainStackParamList} from '../type/type';
// import axios from 'axios';
// import {API_ENDPOINTS, DEFAULT_HEADERS} from '../config/api.config';
// import {useCustomer} from '../contexts/DisplayNameContext';

// const {height: SCREEN_HEIGHT, width: SCREEN_WIDTH} = Dimensions.get('window');

// type OtpVerificationScreenNavigationProp = StackNavigationProp<
//   RootStackParamList,
//   'HomeScreen'
// >;
// type OtpVerificationScreenRouteProp = RouteProp<
//   RootStackParamList,
//   'OtpVerificationScreen'
// >;

// const OtpVerificationScreen: React.FC<{
//   route: OtpVerificationScreenRouteProp;
// }> = ({route}) => {
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const [errorMessage, setErrorMessage] = useState('');
//   const navigation = useNavigation<OtpVerificationScreenNavigationProp>();
//   const {setCustomerID} = useCustomer();

//   const loginWithUsernameAndPassword = async () => {
//     if (!username || !password) {
//       Alert.alert('Please enter both username and password');
//       return;
//     }

//     setIsLoading(true);
//     try {
//       console.log('🟢 Making login request to:', API_ENDPOINTS.LOGIN);
//       console.log('🔹 With data:', {
//         sf_userName: username,
//         sf_userPwd: password,
//       });

//       const response = await axios({
//         method: 'post',
//         url: API_ENDPOINTS.LOGIN,
//         data: {
//           sf_userName: username,
//           sf_userPwd: password,
//         },
//         headers: DEFAULT_HEADERS,
//       });

//       console.log('✅ Full response:', response);
//       console.log('📩 Response headers:', response.headers);
//       console.log('📌 Response status:', response.status);
//       console.log('📤 Response received:', response.data);

//       if (response.data?.output) {
//         const {token, CustomerID, DisplayName, CustomerGroupID} =
//           response.data.output;

//         // Update context

//         setCustomerID(CustomerID.toString()); // Update context

//         await AsyncStorage.setItem('customerID', CustomerID.toString());

//         console.log('🟢 Received Token:', token);
//         if (!token) {
//           console.error('❌ Token is undefined or empty!');
//           Alert.alert('Error', 'Authentication failed. No token received.');
//           return;
//         }

//         // Store Token in AsyncStorage
//         await Promise.all([
//           AsyncStorage.setItem('userToken', token),
//           AsyncStorage.setItem('customerID', CustomerID.toString()),
//           AsyncStorage.setItem('Disp_name', DisplayName),
//           AsyncStorage.setItem('FK_CUST_GROUP_ID', CustomerGroupID.toString()),
//         ]);

//         // Also check that AsyncStorage is working properly
//         const storedID = await AsyncStorage.getItem('customerID');
//         console.log('Stored customerID in AsyncStorage:', storedID);
//         // Verify Token Storage
//         const storedToken = await AsyncStorage.getItem('userToken');
//         console.log('📌 Token Stored in AsyncStorage:', storedToken);

//         // Set Authorization Header
//         axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

//         // Navigate to Home
//         navigation.navigate('Main', {
//           screen: 'HomeScreen',
//           params: {
//             initialLogin: true,
//             customerID: CustomerID.toString(),
//           },
//         });
//       } else {
//         console.error('❌ Invalid response format:', response.data);
//         Alert.alert('Error', 'Invalid response from server');
//       }
//     } catch (error) {
//       Alert.alert('Invalid username or password. Please try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   };
//   return (
//     <View style={styles.container}>
//       {/* Fixed Background Image */}
//       <View style={styles.fixedBackground}>
//         <Image
//           source={require('../assets/wish/bgimg.png')}
//           style={styles.backgroundImage}
//         />
//       </View>

//       {/* Scrollable Content */}
//       <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
//         <KeyboardAvoidingView
//           style={styles.content}
//           behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//           keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
//           <ScrollView
//             style={styles.scrollView}
//             contentContainerStyle={styles.scrollViewContent}
//             bounces={false}
//             showsVerticalScrollIndicator={false}
//             keyboardShouldPersistTaps="handled">
//             <View style={styles.header}>
//               <Image
//                 source={require('../assets/SavlaLogo.jpg')}
//                 style={styles.logo}
//               />
//               <Text style={styles.title}>LOGIN</Text>
//               <Text style={styles.subtitle}>Sign in with your credentials</Text>
//             </View>

//             <View style={styles.formContainer}>
//               <View style={styles.inputContainer}>
//                 <MaterialIcons name="person" size={24} style={styles.icon} />
//                 <TextInput
//                   style={styles.input}
//                   placeholder="Username"
//                   value={username}
//                   onChangeText={setUsername}
//                   placeholderTextColor="#999"
//                   autoCapitalize="none"
//                   editable={!isLoading}
//                 />
//               </View>

//               <View style={styles.inputContainer}>
//                 <MaterialIcons name="lock" size={24} style={styles.icon} />
//                 <TextInput
//                   style={styles.input}
//                   placeholder="Password"
//                   value={password}
//                   onChangeText={setPassword}
//                   secureTextEntry={!showPassword}
//                   placeholderTextColor="#999"
//                   autoCapitalize="none"
//                   editable={!isLoading}
//                 />
//                 <TouchableOpacity
//                   onPress={() => setShowPassword(!showPassword)}
//                   style={styles.eyeIcon}>
//                   <MaterialIcons
//                     name={showPassword ? 'visibility-off' : 'visibility'}
//                     size={24}
//                     style={{color: '#999'}}
//                   />
//                 </TouchableOpacity>
//               </View>

//               <TouchableOpacity
//                 style={[styles.button, isLoading && styles.buttonLoading]}
//                 onPress={loginWithUsernameAndPassword}
//                 disabled={isLoading}>
//                 {isLoading ? (
//                   <ActivityIndicator color="#fff" />
//                 ) : (
//                   <Text style={styles.buttonText}>Login</Text>
//                 )}
//               </TouchableOpacity>
//             </View>
//           </ScrollView>
//         </KeyboardAvoidingView>
//       </TouchableWithoutFeedback>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: 'transparent',
//   },
//   fixedBackground: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     zIndex: 0,
//   },
//   backgroundImage: {
//     width: SCREEN_WIDTH,
//     height: SCREEN_HEIGHT,
//     position: 'absolute',
//   },
//   content: {
//     flex: 1,
//     zIndex: 1,
//   },
//   scrollView: {
//     flex: 1,
//     backgroundColor: 'transparent',
//   },
//   scrollViewContent: {
//     flexGrow: 1,
//     alignItems: 'center',
//     paddingBottom: 20,
//   },
//   header: {
//     alignItems: 'center',
//     width: '100%',
//     paddingHorizontal: 20,
//     paddingTop: Platform.OS === 'ios' ? 60 : 40,
//   },
//   logo: {
//     width: 100,
//     height: 100,
//     marginTop: 120,
//   },
//   title: {
//     fontSize: 26,
//     fontWeight: 'bold',
//     color: '#473c3c',
//     marginTop: 25,
//   },
//   subtitle: {
//     fontSize: 18,
//     color: '#6b6464',
//     marginTop: 8,
//   },
//   formContainer: {
//     width: '90%',
//     padding: 20,
//     alignItems: 'center',
//     marginTop: 20,
//   },
//   inputContainer: {
//     width: '100%',
//     height: 50,
//     borderRadius: 25,
//     backgroundColor: '#fff',
//     marginBottom: 15,
//     paddingHorizontal: 15,
//     shadowColor: '#fb932c',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   input: {
//     flex: 1,
//     height: '100%',
//     fontSize: 16,
//     color: '#333',
//   },
//   icon: {
//     marginRight: 10,
//     color: '#999',
//   },
//   eyeIcon: {
//     padding: 5,
//   },
//   button: {
//     width: '100%',
//     height: 50,
//     backgroundColor: '#F48221',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRadius: 25,
//     marginTop: 10,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.25,
//     shadowRadius: 3.84,
//     elevation: 5,
//   },
//   buttonLoading: {
//     backgroundColor: '#ffa559',
//   },
//   buttonText: {
//     color: '#fff',
//     fontSize: 18,
//     fontWeight: '600',
//   },
// });

// export default OtpVerificationScreen;
// function showErrorPopup(arg0: string) {
//   throw new Error('Function not implemented.');
// }

//Mayur
import AsyncStorage from '@react-native-async-storage/async-storage';
import {RouteProp, useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import React, {useState, useEffect} from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ActivityIndicator,
  PixelRatio,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {RootStackParamList, MainStackParamList} from '../type/type';
import axios from 'axios';
import {API_ENDPOINTS, DEFAULT_HEADERS} from '../config/api.config';
import {useCustomer} from '../contexts/DisplayNameContext';

// Get screen dimensions
const {height: SCREEN_HEIGHT, width: SCREEN_WIDTH} = Dimensions.get('window');

// Base dimension for scaling (iPhone 8/SE size as reference)
const baseWidth = 375;
const baseHeight = 667;

// Scale factor based on screen width
const widthScale = SCREEN_WIDTH / baseWidth;
const heightScale = SCREEN_HEIGHT / baseHeight;

// Responsive scaling functions
const scale = (size: number) => Math.round(size * widthScale);
const verticalScale = (size: number) => Math.round(size * heightScale);

// For padding, margins, etc. - less aggressive scaling
const moderateScale = (size: number, factor = 0.5) =>
  Math.round(size + (scale(size) - size) * factor);

// For fonts with pixel density adjustment
const normalize = (size: number) => {
  const newSize = scale(size);
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    // Android handles fonts differently
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
  }
};

type OtpVerificationScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'HomeScreen'
>;
type OtpVerificationScreenRouteProp = RouteProp<
  RootStackParamList,
  'OtpVerificationScreen'
>;

const OtpVerificationScreen: React.FC<{
  route: OtpVerificationScreenRouteProp;
}> = ({route}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [dimensions, setDimensions] = useState({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  });
  const navigation = useNavigation<OtpVerificationScreenNavigationProp>();
  const {setCustomerID} = useCustomer();

  // Handle screen rotation or dimension changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({window}) => {
      setDimensions({
        width: window.width,
        height: window.height,
      });
    });
    return () => subscription.remove();
  }, []);

  const loginWithUsernameAndPassword = async () => {
    if (!username || !password) {
      Alert.alert('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🟢 Making login request to:', API_ENDPOINTS.LOGIN);
      console.log('🔹 With data:', {
        sf_userName: username,
        sf_userPwd: password,
      });

      const response = await axios({
        method: 'post',
        url: API_ENDPOINTS.LOGIN,
        data: {
          sf_userName: username,
          sf_userPwd: password,
        },
        headers: DEFAULT_HEADERS,
      });

      console.log('✅ Full response:', response);
      console.log('📩 Response headers:', response.headers);
      console.log('📌 Response status:', response.status);
      console.log('📤 Response received:', response.data);

      if (response.data?.output) {
        const {token, CustomerID, DisplayName, CustomerGroupID} =
          response.data.output;

        // Update context
        setCustomerID(CustomerID.toString()); // Update context

        await AsyncStorage.setItem('customerID', CustomerID.toString());

        console.log('🟢 Received Token:', token);
        if (!token) {
          console.error('❌ Token is undefined or empty!');
          Alert.alert('Error', 'Authentication failed. No token received.');
          return;
        }

        // Store Token in AsyncStorage
        await Promise.all([
          AsyncStorage.setItem('userToken', token),
          AsyncStorage.setItem('customerID', CustomerID.toString()),
          AsyncStorage.setItem('Disp_name', DisplayName),
          AsyncStorage.setItem('FK_CUST_GROUP_ID', CustomerGroupID.toString()),
        ]);

        // Also check that AsyncStorage is working properly
        const storedID = await AsyncStorage.getItem('customerID');
        console.log('Stored customerID in AsyncStorage:', storedID);
        // Verify Token Storage
        const storedToken = await AsyncStorage.getItem('userToken');
        console.log('📌 Token Stored in AsyncStorage:', storedToken);

        // Set Authorization Header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Navigate to Home
        navigation.navigate('Main', {
          screen: 'HomeScreen',
          params: {
            initialLogin: true,
            customerID: CustomerID.toString(),
          },
        });
      } else {
        console.error('❌ Invalid response format:', response.data);
        Alert.alert('Error', 'Invalid response from server');
      }
    } catch (error) {
      Alert.alert('Invalid username or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <View style={styles.container}>
      {/* Fixed Background Image */}
      <View style={styles.fixedBackground}>
        <Image
          source={require('../assets/wish/bgimg.png')}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      </View>

      {/* Scrollable Content */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.content}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={
            Platform.OS === 'ios' ? moderateScale(10) : moderateScale(20)
          }>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            bounces={true}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
            keyboardDismissMode="on-drag">
            <View style={styles.contentWrapper}>
              <View style={styles.header}>
                <Image
                  source={require('../assets/SavlaLogo.jpg')}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={styles.title}>LOGIN</Text>
                <Text style={styles.subtitle}>
                  Sign in with your credentials
                </Text>
              </View>

              <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                  <MaterialIcons
                    name="person"
                    size={scale(24)}
                    style={styles.icon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Username"
                    value={username}
                    onChangeText={setUsername}
                    placeholderTextColor="#999"
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <MaterialIcons
                    name="lock"
                    size={scale(24)}
                    style={styles.icon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    placeholderTextColor="#999"
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}>
                    <MaterialIcons
                      name={showPassword ? 'visibility-off' : 'visibility'}
                      size={scale(24)}
                      style={{color: '#999'}}
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonLoading]}
                  onPress={loginWithUsernameAndPassword}
                  disabled={isLoading}>
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Login</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  fixedBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  backgroundImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'absolute',
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollViewContent: {
    flexGrow: 1,
    minHeight: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: moderateScale(50),
  },
  contentWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? moderateScale(20) : 0,
    marginTop: verticalScale(40),
  },
  header: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: moderateScale(20),
    marginTop: verticalScale(20),
  },
  logo: {
    width: scale(100),
    height: scale(100),
    marginTop: verticalScale(20),
    alignSelf: 'center',
  },
  title: {
    fontSize: normalize(26),
    fontWeight: 'bold',
    color: '#473c3c',
    marginTop: verticalScale(20),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: normalize(18),
    color: '#6b6464',
    marginTop: verticalScale(8),
    textAlign: 'center',
  },
  formContainer: {
    width: '90%',
    padding: moderateScale(20),
    alignItems: 'center',
    marginTop: verticalScale(20),
  },
  inputContainer: {
    width: '100%',
    height: verticalScale(45),
    borderRadius: moderateScale(30),
    backgroundColor: '#fff',
    marginBottom: verticalScale(15),
    paddingHorizontal: moderateScale(20),
    shadowColor: '#fb932c',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: normalize(16),
    color: '#333',
    marginLeft: moderateScale(5),
  },
  icon: {
    marginRight: moderateScale(5),
    color: '#999',
  },
  eyeIcon: {
    padding: moderateScale(5),
  },
  button: {
    width: '100%',
    height: verticalScale(45),
    backgroundColor: '#F48221',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: moderateScale(30),
    marginTop: verticalScale(25),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 4,
  },
  buttonLoading: {
    backgroundColor: '#ffa559',
  },
  buttonText: {
    color: '#fff',
    fontSize: normalize(18),
    fontWeight: '600',
  },
});

export default OtpVerificationScreen;
function showErrorPopup(arg0: string) {
  throw new Error('Function not implemented.');
}
