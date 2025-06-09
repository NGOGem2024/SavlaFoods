import AsyncStorage from '@react-native-async-storage/async-storage';
import { setSecureItem, getSecureItem } from './secureStorage';

// List of keys that should be migrated to secure storage
const SECURE_KEYS = [
  'userToken',
  'customerID',
  'Disp_name',
  'FK_CUST_GROUP_ID',
];

/**
 * Migrates a specific key from AsyncStorage to Keychain if it exists
 * @param key The key to migrate
 * @returns true if migration was successful or not needed, false if it failed
 */
export const migrateKey = async (key: string): Promise<boolean> => {
  try {
    // Check if the key already exists in Keychain
    const secureValue = await getSecureItem(key);
    if (secureValue !== null) {
      // Already migrated
      return true;
    }
    
    // Get value from AsyncStorage
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      // Store in Keychain
      await setSecureItem(key, value);
      console.log(`Successfully migrated ${key} to secure storage`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error migrating ${key}:`, error);
    return false;
  }
};

/**
 * Migrates all secure keys from AsyncStorage to Keychain
 * @returns An object with results of each key migration
 */
export const migrateAllSecureKeys = async (): Promise<Record<string, boolean>> => {
  const results: Record<string, boolean> = {};
  
  for (const key of SECURE_KEYS) {
    results[key] = await migrateKey(key);
  }
  
  return results;
};

/**
 * Checks if a value exists in AsyncStorage but not in Keychain
 * @param key The key to check
 * @returns true if migration is needed, false otherwise
 */
export const isMigrationNeeded = async (key: string): Promise<boolean> => {
  const asyncValue = await AsyncStorage.getItem(key);
  if (asyncValue === null) {
    return false;
  }
  
  const secureValue = await getSecureItem(key);
  return secureValue === null;
};

/**
 * Gets a value from either Keychain or AsyncStorage, preferring Keychain
 * This is useful during the transition period
 * @param key The key to retrieve
 * @returns The value or null if not found
 */
export const getSecureOrAsyncItem = async (key: string): Promise<string | null> => {
  // First try to get from secure storage
  const secureValue = await getSecureItem(key);
  if (secureValue !== null) {
    return secureValue;
  }
  
  // If not found, try AsyncStorage and migrate if found
  const asyncValue = await AsyncStorage.getItem(key);
  if (asyncValue !== null) {
    await setSecureItem(key, asyncValue);
    return asyncValue;
  }
  
  return null;
}; 