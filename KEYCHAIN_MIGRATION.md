# Migration from AsyncStorage to react-native-keychain

This document outlines the migration from AsyncStorage to react-native-keychain for secure data storage in the Savla Foods application.

## Why Use Keychain Instead of AsyncStorage?

1. **Security**: AsyncStorage stores data in plain text, while Keychain encrypts data.
2. **Performance**: Keychain is more efficient for storing small, sensitive pieces of data.
3. **Persistence**: Data in Keychain persists even when the app is uninstalled (on iOS).
4. **Authentication**: Keychain can be configured to require device authentication.

## Implementation Details

### 1. New Utility Files

- `src/utils/secureStorage.ts`: Core functions for interacting with Keychain
- `src/utils/migrationHelper.ts`: Helper functions for migrating data from AsyncStorage to Keychain

### 2. Migration Process

The migration process happens automatically when the app starts, in the SplashScreen component. The process:

1. Checks for keys in AsyncStorage
2. If a key exists in AsyncStorage but not in Keychain, it's migrated
3. After migration, the app continues to use Keychain for all secure storage operations

### 3. Modified Files

The following files have been updated to use Keychain instead of AsyncStorage:

- `src/utils/apiClient.ts`: Updated to use Keychain for token storage
- `src/screens/ProfileMenu.tsx`: Updated to use Keychain for user data
- `src/screens/SplashScreen.tsx`: Added migration process
- `App.tsx`: Added migration initialization

### 4. Usage Guidelines

#### Reading Secure Data

```typescript
import { getSecureItem } from '../utils/secureStorage';

// Get a value
const token = await getSecureItem('userToken');

```

#### Writing Secure Data

```typescript
import { setSecureItem } from '../utils/secureStorage';

// Store a value
await setSecureItem('userToken', 'your-secure-token');

```

#### Removing Secure Data

```typescript
import { removeSecureItem } from '../utils/secureStorage';

// Remove a value
await removeSecureItem('userToken');

```

### 5. Transition Period

During the transition period, you can use the `getSecureOrAsyncItem` function to retrieve data from either storage method:

```typescript
import { getSecureOrAsyncItem } from '../utils/migrationHelper';

// This will check Keychain first, then AsyncStorage, and migrate if found
const value = await getSecureOrAsyncItem('key');

```

## Security Considerations

1. The Keychain implementation uses the generic password API with service-specific identifiers
2. Each key is stored as a separate entry in the Keychain
3. No additional encryption is applied as Keychain already provides encryption

## Future Improvements

1. Add biometric authentication for accessing sensitive data
2. Implement timeout-based automatic logout
3. Add secure storage for larger objects with encryption