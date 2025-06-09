import Icon from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
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
import apiClient from '../utils/apiClient';
import { getSecureItem, setSecureItem, removeSecureItem } from '../utils/secureStorage';
import { getSecureOrAsyncItem, migrateKey } from '../utils/migrationHelper';

interface ProfileMenuProps {
  displayName: string | null;
  onAccountSwitch?: () => void;
}

interface AccountItem {
  label: string;
  value: string;
  customerId: number;
  groupId: number;
  token: string;
  key: string;
}

// Define response type interfaces
interface CustomerAccount {
  CustomerID: number;
  PhoneNo: string | null;
  DisplayName: string;
  CustomerGroupID: number;
  CustomerName: string;
  token: string;
  isCurrentAccount: boolean;
}

interface GetAccountsResponse {
  message: string;
  input: {
    FK_CUST_GROUP_ID: number;
  };
  output: {
    accounts: CustomerAccount[];
    currentAccount: CustomerAccount;
  };
}

interface SwitchAccountResponse {
  message: string;
  input: {
    FK_CUSTOMER_ID: number;
    FK_CUST_GROUP_ID: number;
  };
  output: {
    currentAccount: CustomerAccount;
    otherAccountsInGroup: CustomerAccount[];
  };
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

  // Add a helper function to make token comparison clearer
  const formatTokenForLogging = (token: string | null) => {
    if (!token) return 'null';

    // Get first 10 chars and last 10 chars to make differences more visible
    const firstPart = token.substring(0, 10);
    const lastPart = token.substring(token.length - 10);
    return `${firstPart}...${lastPart}`;
  };

  // Add function to decode JWT without verification
  const decodeJwt = (token: string): any => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Error decoding JWT:', e);
      return null;
    }
  };

  // Helper function to decode JWT and check if it matches the expected customer ID
  const verifyTokenMatchesCustomer = (
    token: string,
    customerId: number,
    displayName: string,
  ) => {
    const decoded = decodeJwt(token);
    if (!decoded) {
      console.warn(`❌ Could not decode token for ${displayName}`);
      return false;
    }

    console.log(`Token payload for ${displayName}:`, decoded);

    if (decoded.customerId !== customerId) {
      console.warn(
        `❌ Token customerId (${decoded.customerId}) doesn't match account ID (${customerId})`,
      );
      return false;
    }

    if (decoded.displayName !== displayName) {
      console.warn(
        `❌ Token displayName (${decoded.displayName}) doesn't match account name (${displayName})`,
      );
      return false;
    }

    return true;
  };

  const fetchCustomerGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      setDebugInfo(null);

      const groupId = await getSecureOrAsyncItem('FK_CUST_GROUP_ID');
      const storedCustomerId = await getSecureOrAsyncItem('customerID');
      const currentToken = await getSecureOrAsyncItem('userToken');

      setCustomerId(storedCustomerId);
      console.log('Stored FK_CUST_GROUP_ID:', groupId);
      console.log('API Endpoint:', API_ENDPOINTS.GET_ACCOUNTS_BY_GROUP);
      console.log('Current User Token:', formatTokenForLogging(currentToken));

      if (!groupId) {
        throw new Error('No customer group ID found');
      }

      setDebugInfo(`Fetching accounts for group ID: ${groupId}`);
      const payload = {FK_CUST_GROUP_ID: parseInt(groupId)};

      // Use apiClient with proper type
      const response = await apiClient.post<GetAccountsResponse>(
        API_ENDPOINTS.GET_ACCOUNTS_BY_GROUP,
        payload,
      );

      if (
        !response.output ||
        !response.output.accounts ||
        response.output.accounts.length === 0
      ) {
        throw new Error('No accounts found for this group');
      }

      // Verify that each account has a unique token
      const tokenMap = new Map<string, string>();
      response.output.accounts.forEach(account => {
        if (tokenMap.has(account.token)) {
          console.warn(
            `⚠️ WARNING: Account ${
              account.DisplayName
            } has the same token as ${tokenMap.get(account.token)}`,
          );
        } else {
          tokenMap.set(account.token, account.DisplayName);
        }

        // Verify token matches the customer it's for
        verifyTokenMatchesCustomer(
          account.token,
          account.CustomerID,
          account.DisplayName,
        );
      });

      if (tokenMap.size !== response.output.accounts.length) {
        console.warn(
          `⚠️ CRITICAL: Found only ${tokenMap.size} unique tokens for ${response.output.accounts.length} accounts!`,
        );
      } else {
        console.log(
          `✅ All ${response.output.accounts.length} accounts have unique tokens`,
        );
      }

      // Log each account and its token for debugging with clearer token format
      console.log('Available accounts with tokens:');
      response.output.accounts.forEach(account => {
        console.log(
          `Account: ${account.DisplayName} (ID: ${account.CustomerID})`,
        );
        console.log(`Token: ${formatTokenForLogging(account.token)}`);
        console.log(`Is Current: ${account.isCurrentAccount}`);
        console.log('-------------------');
      });

      // Log current account
      console.log('Current account from API:');
      if (response.output.currentAccount) {
        console.log(`Name: ${response.output.currentAccount.DisplayName}`);
        console.log(`ID: ${response.output.currentAccount.CustomerID}`);
        console.log(
          `Token: ${formatTokenForLogging(
            response.output.currentAccount.token,
          )}`,
        );
      } else {
        console.log('No current account returned from API');
      }

      // Map the accounts to dropdown items using the correct response structure
      const accountItems: AccountItem[] = response.output.accounts.map(
        (account: CustomerAccount) => ({
          label: account.DisplayName,
          value: `${account.CustomerID}_${account.DisplayName.replace(
            /\s+/g,
            '_',
          )}`,
          customerId: account.CustomerID,
          groupId: account.CustomerGroupID,
          token: account.token,
          key: `${account.CustomerID}_${account.DisplayName.replace(
            /\s+/g,
            '_',
          )}`,
        }),
      );

      setItems(accountItems);

      // Find current account from response and set as initial value
      const currentAccount = response.output.currentAccount;
      if (currentAccount) {
        setValue(
          `${currentAccount.CustomerID}_${currentAccount.DisplayName.replace(
            /\s+/g,
            '_',
          )}`,
        );
      } else if (storedCustomerId) {
        // Try to find matching item
        const matchingItem = accountItems.find(
          item => item.customerId.toString() === storedCustomerId,
        );
        if (matchingItem) {
          setValue(matchingItem.value);
        } else {
          setValue(null);
        }
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
      // Remove items from secure storage
      await Promise.all([
        removeSecureItem('userToken'),
        removeSecureItem('Disp_name'),
        removeSecureItem('FK_CUST_GROUP_ID'),
        removeSecureItem('customerID'),
      ]);
      
      setShowMenu(false);
      setShowLogoutConfirm(false);
      navigation.reset({
        index: 0,
        routes: [{name: 'OtpVerificationScreen'}],
      });
    } catch (error) {
      console.error('Error during logout:', error);
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

      // Find the selected account from items array
      const selectedAccount = items.find(item => item.value === value);

      if (!selectedAccount) {
        throw new Error('Invalid account selected');
      }

      console.log('Switching to account:', selectedAccount.label);
      console.log('Account ID:', selectedAccount.customerId);
      console.log(
        'Account token:',
        formatTokenForLogging(selectedAccount.token),
      );
      console.log('Account value:', selectedAccount.value);

      // Get the group ID
      const groupId = await getSecureOrAsyncItem('FK_CUST_GROUP_ID');
      if (!groupId) {
        throw new Error('No customer group ID found');
      }

      // Use the token directly from the selected account item
      if (selectedAccount.token) {
        console.log('Using token directly from account data');

        // Get the current token for comparison
        const oldToken = await getSecureOrAsyncItem('userToken');
        console.log('Old token:', formatTokenForLogging(oldToken));
        console.log('New token:', formatTokenForLogging(selectedAccount.token));

        // Decode and verify tokens
        if (oldToken) {
          const oldDecoded = decodeJwt(oldToken);
          console.log('Old token payload:', oldDecoded);
        }

        const newDecoded = decodeJwt(selectedAccount.token);
        console.log('New token payload:', newDecoded);

        // Verify the new token contains the correct customer info
        const isValid = verifyTokenMatchesCustomer(
          selectedAccount.token,
          selectedAccount.customerId,
          selectedAccount.label,
        );

        if (!isValid) {
          console.warn(
            '⚠️ WARNING: The token does not match the selected account!',
          );
        }

        // Compare tokens to make it very clear if they're different
        if (oldToken === selectedAccount.token) {
          console.warn('WARNING: New token is identical to old token!');
        } else {
          console.log('TOKENS ARE DIFFERENT - this is expected');
        }

        // Store the new account information including the token
        await Promise.all([
          setSecureItem(
            'customerID',
            selectedAccount.customerId.toString(),
          ),
          setSecureItem('Disp_name', selectedAccount.label),
          setSecureItem(
            'FK_CUST_GROUP_ID',
            selectedAccount.groupId.toString(),
          ),
          setSecureItem('userToken', selectedAccount.token),
        ]);

        // Verify token was stored
        const verifyToken = await getSecureItem('userToken');
        console.log(
          'Verified stored token:',
          formatTokenForLogging(verifyToken),
        );

        // Additional verification that tokens are different
        if (oldToken === verifyToken) {
          console.warn('WARNING: Token did not change after storage!');
        } else {
          console.log('✅ Token successfully changed');
        }

        // Call the onAccountSwitch callback if provided
        if (onAccountSwitch) {
          onAccountSwitch();
        }

        setDisplayName(selectedAccount.label);
        setShowSwitchModal(false);

        // Show toast message before navigation
        showToast(`Switched to ${selectedAccount.label}`);

        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'HomeScreen',
              params: {
                switchedAccount: true,
                newCustomerId: selectedAccount.customerId.toString(),
                timestamp: Date.now(), // Force refresh
              },
            },
          ],
        });

        return;
      }

      // Fallback: Call the switchAccount API if we don't have the token
      console.log('Falling back to switchAccount API call');
      const payload = {
        FK_CUSTOMER_ID: selectedAccount.customerId,
        FK_CUST_GROUP_ID: parseInt(groupId),
        DISP_NAME: selectedAccount.label, // Add display name to help identify which account to switch to
      };

      // Use apiClient with proper type
      const response = await apiClient.post<SwitchAccountResponse>(
        API_ENDPOINTS.SWITCH_ACCOUNT,
        payload,
      );

      if (!response.output || !response.output.currentAccount) {
        throw new Error('Failed to switch account');
      }

      const currentAccount = response.output.currentAccount;
      console.log('API response current account:', currentAccount.DisplayName);
      console.log(
        'API response token:',
        formatTokenForLogging(currentAccount.token),
      );

      // Store the new account information
      await Promise.all([
        setSecureItem(
          'customerID',
          currentAccount.CustomerID.toString(),
        ),
        setSecureItem('Disp_name', currentAccount.DisplayName),
        setSecureItem(
          'FK_CUST_GROUP_ID',
          currentAccount.CustomerGroupID.toString(),
        ),
        setSecureItem('userToken', currentAccount.token), // Store the new token
      ]);

      // Verify token was stored
      const verifyToken = await getSecureItem('userToken');
      console.log('Verified stored token:', formatTokenForLogging(verifyToken));

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
        <Icon name="account-circle" size={28} style={{color: '#63A1D8'}} />
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
                  style={{color: '#63A1D8'}}
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
                listMode="SCROLLVIEW"
                scrollViewProps={{
                  nestedScrollEnabled: true,
                }}
                // Use key-based unique identifiers
                schema={{
                  label: 'label',
                  value: 'value',
                }}
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
    backgroundColor: 'red',
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
