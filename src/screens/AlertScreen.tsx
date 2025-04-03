import React from 'react';
import {View, Text, FlatList, StyleSheet, TouchableOpacity} from 'react-native';
import {useNotification} from '../contexts/NotificationContext';

const Alerts = () => {
  const {notifications, clearNotifications} = useNotification();

  const renderNotification = ({item}: {item: any}) => (
    <View style={styles.notificationItem}>
      <Text style={styles.notificationMessage}>{item.message}</Text>
      <Text style={styles.notificationTimestamp}>
        {new Date(item.timestamp).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Alerts</Text>
      {notifications.length > 0 ? (
        <>
          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={item => item.id}
          />
          <TouchableOpacity
            onPress={clearNotifications}
            style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear All Notifications</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.noNotifications}>No new notifications</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    marginTop: 50,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#000',
  },
  notificationItem: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  notificationMessage: {
    fontSize: 16,
    marginBottom: 5,
    color: '#000',
  },
  notificationTimestamp: {
    fontSize: 12,
    color: '#666',
  },
  noNotifications: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
  },
  clearButton: {
    backgroundColor: '#F48221',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Alerts;
