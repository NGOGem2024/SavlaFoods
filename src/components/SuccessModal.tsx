import React from 'react';
import {View, Text, StyleSheet, Modal, TouchableOpacity} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';

interface SuccessModalProps {
  isVisible: boolean;
  itemCount: number;
  onClose: () => void;
  onGoToCart: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isVisible,
  itemCount,
  onClose,
  onGoToCart,
}) => {
  return (
    <Modal transparent={true} visible={isVisible} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.iconContainer}>
            <View style={styles.checkCircle}>
              <Icon name="check" size={40} color="#00C853" />
            </View>
          </View>

          <Text style={styles.successTitle}>Added to Cart</Text>
          <Text style={styles.successSubtitle}>
            {itemCount} {itemCount === 1 ? 'item' : 'items'} added to your cart
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.orderMoreButton} onPress={onClose}>
              <Text style={styles.orderMoreText}>Order More</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.goToCartButton}
              onPress={onGoToCart}>
              <Text style={styles.goToCartText}>Go to Cart</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  iconContainer: {
    marginBottom: 24,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 200, 83, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  orderMoreButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderMoreText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  goToCartButton: {
    flex: 1,
    backgroundColor: '#FF8A25',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goToCartText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SuccessModal;
