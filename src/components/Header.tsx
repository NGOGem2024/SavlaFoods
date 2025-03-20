import React from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
// Import Icons from react-native-vector-icons instead of Expo
import Icon from 'react-native-vector-icons/MaterialIcons';
import ProfileMenu from '../screens/ProfileMenu';
import {useNavigation} from '@react-navigation/native';

const {width} = Dimensions.get('window');

type HeaderProps = {
  displayName: string | null;
  cartItemCount: number;
  onAccountSwitch?: () => void;
  onCartPress?: () => void;
};

const Header: React.FC<HeaderProps> = ({
  displayName,
  cartItemCount,
  onAccountSwitch,
  onCartPress,
}) => {
  const navigation = useNavigation();
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.leftSection}>
        <Image
          source={require('../assets/SavlaLogo.jpg')}
          style={styles.logo}
        />
      </TouchableOpacity>

      <View style={styles.centerSection}>
        <Text style={styles.headerTitle}>{displayName || 'Loading...'}</Text>
      </View>

      <View style={styles.rightSection}>
        <TouchableOpacity onPress={onCartPress} style={styles.iconButton}>
          <View style={styles.iconContainer}>
            <Icon
              name="shopping-cart"
              size={25}
              color="#007BFA"
              style={{fontFamily: 'MaterialIcons'}}
            />
            {cartItemCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* <TouchableOpacity
          onPress={onAccountSwitch}
          style={styles.iconButton}
        >
          <Icon name="person" size={25} color="#007BFA" />
        </TouchableOpacity> */}

        <ProfileMenu
          displayName={displayName}
          onAccountSwitch={onAccountSwitch}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    height: 65,
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  leftSection: {
    width: 45,
    height: 45,
    justifyContent: 'center',
  },
  centerSection: {
    flex: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 90,
    gap: 12,
  },
  logo: {
    width: 45,
    height: 45,
    resizeMode: 'contain',
  },
  headerTitle: {
    fontSize: 16,
    color: '#007BFA',
    fontWeight: 'bold',
    textAlign: 'center',
    maxWidth: width - 200,
  },
  iconButton: {
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 25,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    right: -4,
    top: -4,
    backgroundColor: 'red',
    borderRadius: 25,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default Header;
