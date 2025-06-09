import * as Keychain from 'react-native-keychain';

// Function to securely store a value
export const setSecureItem = async (key: string, value: string): Promise<boolean> => {
  try {
    // Store the data in the keychain
    await Keychain.setGenericPassword(key, value, { service: key });
    return true;
  } catch (error) {
    console.error(`Error storing ${key}:`, error);
    return false;
  }
};

// Function to retrieve a securely stored value
export const getSecureItem = async (key: string): Promise<string | null> => {
  try {
    // Retrieve the data from the keychain
    const credentials = await Keychain.getGenericPassword({ service: key });
    if (credentials) {
      return credentials.password; // The actual value is stored in the password field
    }
    return null;
  } catch (error) {
    console.error(`Error retrieving ${key}:`, error);
    return null;
  }
};

// Function to remove a securely stored value
export const removeSecureItem = async (key: string): Promise<boolean> => {
  try {
    // Remove the data from the keychain
    await Keychain.resetGenericPassword({ service: key });
    return true;
  } catch (error) {
    console.error(`Error removing ${key}:`, error);
    return false;
  }
};

// Function to check if a key exists
export const hasSecureItem = async (key: string): Promise<boolean> => {
  try {
    const result = await Keychain.getGenericPassword({ service: key });
    return !!result;
  } catch (error) {
    return false;
  }
};

// Function to migrate data from AsyncStorage to Keychain
export const migrateToKeychain = async (key: string, asyncStorageValue: string | null): Promise<void> => {
  if (asyncStorageValue) {
    await setSecureItem(key, asyncStorageValue);
  }
}; 