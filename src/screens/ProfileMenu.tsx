import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import axios from 'axios';
import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ToastAndroid,
  Platform,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import {RootStackParamList} from '../type/type';
import {useDisplayName} from '../contexts/DisplayNameContext';
import {API_ENDPOINTS} from '../config/api.config';

interface ProfileMenuProps {
  displayName: string | null;
  onAccountSwitch?: () => void;
}

interface AccountItem {
  label: string;
  value: string;
  customerId: number;
  groupId: number;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({
  displayName,
  onAccountSwitch,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string | null>(null);
  const [items, setItems] = useState<AccountItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);

  const {setDisplayName} = useDisplayName();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // Function to show toast message
  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.showWithGravityAndOffset(
        message,
        ToastAndroid.LONG,
        ToastAndroid.BOTTOM,
        0,
        50,
      );
    } else {
      // For iOS - use Alert as a temporary solution
      Alert.alert('', message, [{text: 'OK', style: 'cancel'}], {
        cancelable: true,
      });
    }
  };

  const fetchCustomerGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      setDebugInfo(null);

      const groupId = await AsyncStorage.getItem('FK_CUST_GROUP_ID');
      const storedCustomerId = await AsyncStorage.getItem('customerID');

      setCustomerId(storedCustomerId);
      console.log('Stored FK_CUST_GROUP_ID:', groupId);
      console.log('API Endpoint:', API_ENDPOINTS.GET_ACCOUNTS_BY_GROUP);

      if (!groupId) {
        throw new Error('No customer group ID found');
      }

      setDebugInfo(`Fetching accounts for group ID: ${groupId}`);
      const payload = {FK_CUST_GROUP_ID: parseInt(groupId)};

      // Updated to use the correct API endpoint and handle the response format
      const response = await axios.post(
        API_ENDPOINTS.GET_ACCOUNTS_BY_GROUP,
        payload,
      );

      if (
        !response.data.output ||
        !response.data.output.accounts ||
        response.data.output.accounts.length === 0
      ) {
        throw new Error('No accounts found for this group');
      }

      // Map the accounts to dropdown items using the correct response structure
      const accountItems: AccountItem[] = response.data.output.accounts.map(
        (account: {
          CustomerID: number;
          PhoneNo: string | null;
          DisplayName: string;
          CustomerGroupID: number;
          CustomerName: string;
        }) => ({
          label: account.DisplayName,
          value: account.CustomerID.toString() + '_' + Math.random().toString(36).substring(2, 7), // Make value unique
          customerId: account.CustomerID,
          groupId: account.CustomerGroupID,
        }),
      );

      setItems(accountItems);

      // Set initial value to current customer ID
      if (storedCustomerId) {
        setValue(storedCustomerId);
      }
    } catch (error: any) {
      console.error('Error fetching customer groups:', error);
      const errorMessage = error.response?.data?.message || error.message;
      setError(errorMessage);
      setDebugInfo(
        `Error: ${JSON.stringify(error.response?.data || error.message)}`,
      );

      if (error.message === 'No customer group ID found') {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove([
        'userToken',
        'Disp_name',
        'FK_CUST_GROUP_ID',
        'customerID',
      ]);
      setShowMenu(false);
      setShowLogoutConfirm(false);
      navigation.reset({
        index: 0,
        routes: [{name: 'OtpVerificationScreen'}],
      });
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const handleSwitchAccount = async () => {
    if (!value) {
      Alert.alert('Error', 'Please select an account');
      return;
    }

    try {
      setLoading(true);

      // Extract the customer ID from the value (removing the unique suffix)
      const selectedCustomerId = value.split('_')[0];
      const selectedAccount = items.find(item => item.customerId.toString() === selectedCustomerId);
      
      if (!selectedAccount) {
        throw new Error('Invalid account selected');
      }

      const groupId = await AsyncStorage.getItem('FK_CUST_GROUP_ID');
      if (!groupId) {
        throw new Error('No customer group ID found');
      }

      // Call the switchAccount API
      const payload = {
        FK_CUSTOMER_ID: selectedAccount.customerId,
        FK_CUST_GROUP_ID: parseInt(groupId),
      };

      const response = await axios.post(API_ENDPOINTS.SWITCH_ACCOUNT, payload);

      if (!response.data.output || !response.data.output.currentAccount) {
        throw new Error('Failed to switch account');
      }

      const currentAccount = response.data.output.currentAccount;

      // Store the new account information
      await Promise.all([
        AsyncStorage.setItem(
          'customerID',
          currentAccount.CustomerID.toString(),
        ),
        AsyncStorage.setItem('Disp_name', currentAccount.DisplayName),
        AsyncStorage.setItem(
          'FK_CUST_GROUP_ID',
          currentAccount.CustomerGroupID.toString(),
        ),
        AsyncStorage.setItem('userToken', currentAccount.token), // Store the new token
      ]);

      // Call the onAccountSwitch callback if provided
      if (onAccountSwitch) {
        onAccountSwitch();
      }

      setDisplayName(currentAccount.DisplayName);
      setShowSwitchModal(false);

      // Show toast message before navigation
      showToast(`Switched to ${currentAccount.DisplayName}`);

      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'HomeScreen',
            params: {
              switchedAccount: true,
              newCustomerId: currentAccount.CustomerID.toString(),
              timestamp: Date.now(), // Force refresh
            },
          },
        ],
      });
    } catch (error: any) {
      console.error('Error switching account:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message ||
          error.message ||
          'Failed to switch account',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showSwitchModal) {
      fetchCustomerGroups();
    }
  }, [showSwitchModal]);

  return (
    <>
      <TouchableOpacity onPress={() => setShowMenu(!showMenu)}>
        <Icon name="account-circle" size={28} style={{color: '#007BFA'}} />
      </TouchableOpacity>

      {/* Profile Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}>
          <View style={styles.menuContainer}>
            <TouchableOpacity activeOpacity={1}>
              <View style={styles.profileHeader}>
                <Icon
                  name="account-circle"
                  size={80}
                  style={{color: '#007BFA'}}
                />
                <Text style={styles.displayName}>{displayName || 'User'}</Text>
                <View style={styles.divider} />
              </View>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  setShowSwitchModal(true);
                }}>
                <Icon name="swap-horiz" size={24} style={{color: '#333'}} />
                <Text style={styles.menuText}>Switch Account</Text>
                <Icon name="chevron-right" size={24} style={{color: '#666'}} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setShowMenu(false);
                  setShowLogoutConfirm(true);
                }}>
                <Icon name="logout" size={24} style={{color: '#333'}} />
                <Text style={styles.menuText}>Logout</Text>
                <Icon name="chevron-right" size={24} style={{color: '#666'}} />
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Switch Account Modal */}
      <Modal
        visible={showSwitchModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSwitchModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Switch Account</Text>
            {loading ? (
              <ActivityIndicator size="large" color="#007BFA" />
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (
              <DropDownPicker
                open={open}
                value={value}
                items={items}
                setOpen={setOpen}
                setValue={setValue}
                setItems={setItems}
                placeholder="Select an account"
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                containerStyle={{marginBottom: 20}}
                selectedItemContainerStyle={styles.selectedItemContainer}
                selectedItemLabelStyle={styles.selectedItemLabel}
                // Update zIndex to ensure dropdown appears above other elements
                zIndex={1000}
              />
            )}
            <TouchableOpacity
              style={styles.switchButton}
              onPress={handleSwitchAccount}
              disabled={loading || !!error}>
              <Text style={styles.switchButtonText}>Switch</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowSwitchModal(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutConfirm(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.confirmModalContent}>
            <Text style={styles.confirmTitle}>Logout</Text>
            <Text style={styles.confirmMessage}>
              Are you sure you want to logout?
            </Text>

            <View style={styles.confirmButtonsContainer}>
              <TouchableOpacity
                style={styles.cancelConfirmButton}
                onPress={() => setShowLogoutConfirm(false)}>
                <Text style={styles.cancelConfirmText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutConfirmButton}
                onPress={handleLogout}>
                <Text style={styles.logoutConfirmText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuContainer: {
    width: 250,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    marginTop: 50,
    marginRight: 10,
    elevation: 5,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 10,
  },
  displayName: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    width: '100%',
    marginVertical: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  menuText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    marginBottom: 20,
    textAlign: 'center',
  },
  dropdown: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dropdownContainer: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
  },
  selectedItemContainer: {
    backgroundColor: '#e6f7ff',
  },
  selectedItemLabel: {
    color: '#007BFA',
  },
  switchButton: {
    backgroundColor: '#007BFA',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  switchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#ccc',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
  },
  // Logout confirmation styles
  confirmModalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    elevation: 5,
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  confirmMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  confirmButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelConfirmButton: {
    backgroundColor: '#ccc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  cancelConfirmText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutConfirmButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginLeft: 10,
  },
  logoutConfirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileMenu;