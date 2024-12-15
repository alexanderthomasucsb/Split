import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import firebase from '../../firebaseConfig';
import VenmoUsernameModal from '../components/VenmoUsernameModal';

const SettingsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [isVenmoModalVisible, setIsVenmoModalVisible] = useState(false);

  useEffect(() => {
    const currentUser = firebase.auth().currentUser;
    if (currentUser) {
      fetchUserProfile(currentUser.uid);
    }
  }, []);

  const fetchUserProfile = async (userId) => {
    try {
      const doc = await firebase.firestore()
        .collection('users')
        .doc(userId)
        .get();
      
      if (doc.exists) {
        setUserProfile(doc.data());
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await firebase.auth().signOut();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Sign In' }],
              });
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ],
    );
  };

  const handleVenmoSuccess = (username) => {
    setUserProfile(prev => ({
      ...prev,
      venmoUsername: username
    }));
    Alert.alert('Success', 'Venmo username updated successfully');
  };

  const SettingsGroup = ({ title, children }) => (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.groupContent}>
        {children}
      </View>
    </View>
  );

  const SettingsItem = ({ icon, title, subtitle, onPress, destructive }) => (
    <TouchableOpacity
      style={styles.settingsItem}
      onPress={onPress}
    >
      <View style={styles.settingsItemLeft}>
        <View style={[styles.iconContainer, destructive && styles.destructiveIcon]}>
          <Feather name={icon} size={20} color={destructive ? '#FF3B30' : '#6C47FF'} />
        </View>
        <View>
          <Text style={[styles.settingsItemText, destructive && styles.destructiveText]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.settingsItemSubtext}>{subtitle}</Text>
          )}
        </View>
      </View>
      {onPress && <Feather name="chevron-right" size={20} color="#666" />}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        <SettingsGroup title="Account">
          <SettingsItem
            icon="user"
            title="Profile"
            subtitle={userProfile?.email}
          />
          <SettingsItem
            icon="dollar-sign"
            title="Venmo Username"
            subtitle={userProfile?.venmoUsername || 'Not set'}
            onPress={() => setIsVenmoModalVisible(true)}
          />
                  </SettingsGroup>

        <SettingsGroup title="Bills">
        <SettingsItem
            icon="file-text"
            title="Past Bills"
            subtitle="View your bill history"
            onPress={() => navigation.navigate('PastBills')}
          />

        <SettingsItem
          icon="file-text"
          title="Spending Insights"
          subtitle="View your spending insights"
          onPress={() => navigation.navigate('SpendingInsights')}
        />
        
          <SettingsItem
            icon="users"
            title="Friends"
            subtitle="Manage your friends list"
            onPress={() => navigation.navigate('Friends')}
          />
        </SettingsGroup>

        <SettingsGroup title="Information">
          <SettingsItem
            icon="info"
            title="Version"
            subtitle="1.0.0"
          />
        </SettingsGroup>

        <SettingsGroup title="Account Actions">
          <SettingsItem
            icon="log-out"
            title="Sign Out"
            subtitle="Sign out of your account"
            onPress={handleSignOut}
            destructive
          />
        </SettingsGroup>

        <Text style={styles.footer}>
          Bill Splitting App © 2024
        </Text>
      </ScrollView>
      <VenmoUsernameModal
        visible={isVenmoModalVisible}
        onClose={() => setIsVenmoModalVisible(false)}
        onSuccess={handleVenmoSuccess}
        initialValue={userProfile?.venmoUsername || ''}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#6C47FF',
  },
  group: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginLeft: 20,
    marginBottom: 8,
  },
  groupContent: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ECECEC',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F5F1FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  destructiveIcon: {
    backgroundColor: '#FFE5E5',
  },
  settingsItemText: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  settingsItemSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  destructiveText: {
    color: '#FF3B30',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    padding: 20,
    paddingBottom: 40,
  },
});

export default SettingsScreen;