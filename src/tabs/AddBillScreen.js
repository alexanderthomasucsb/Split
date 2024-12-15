import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons'; // Assuming you're using Expo

const AddBillScreen = ({ navigation }) => {
  const handleManualAdd = () => {
    navigation.navigate('ManualAddScreen');
  };

  const handleAddWithPicture = () => {
    navigation.navigate('AddWithPictureScreen');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Add Bill</Text>
        <Text style={styles.subtitle}>Choose how you'd like to add your bill</Text>
        
        <TouchableOpacity 
          style={styles.card} 
          onPress={handleManualAdd}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <Feather name="edit-3" size={24} color="#6C47FF" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Manual Entry</Text>
            <Text style={styles.cardDescription}>
              Enter bill details manually with our simple form
            </Text>
          </View>
          <Feather name="chevron-right" size={24} color="#6C47FF" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.card} 
          onPress={handleAddWithPicture}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <Feather name="camera" size={24} color="#6C47FF" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Scan Bill</Text>
            <Text style={styles.cardDescription}>
              Take a photo of your bill to auto-fill details
            </Text>
          </View>
          <Feather name="chevron-right" size={24} color="#6C47FF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: "#6C47FF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F1FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
  },
});

export default AddBillScreen;