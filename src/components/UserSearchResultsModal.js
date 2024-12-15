import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, Alert, StyleSheet, TextInput } from 'react-native';
import firebase from '../../firebaseConfig';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

export const UserSearchResultsModal = ({ visible, onClose, currentUser, db, setModalVisible, setNewFriendEmail }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [displayedUsers, setDisplayedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Search users when query changes
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 1) {
        setDisplayedUsers([]);
        return;
      }

      setIsLoading(true);
      try {
        const usersRef = collection(db, 'users');
        const q = query(
          usersRef,
          where('email', '>=', searchQuery.toLowerCase()),
          where('email', '<=', searchQuery.toLowerCase() + '\uf8ff'),
          limit(10)
        );

        const querySnapshot = await getDocs(q);
        const users = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(user => user.id !== currentUser.uid); // Exclude current user

        setDisplayedUsers(users);
      } catch (error) {
        console.error('Error searching users:', error);
        Alert.alert('Error', 'Failed to search users');
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce the search to avoid too many queries
    const timeoutId = setTimeout(searchUsers, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, db, currentUser]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      supportedOrientations={['portrait', 'landscape']}
      hardwareAccelerated
    >
      <View 
        style={[styles.modalContainer, { pointerEvents: 'box-none' }]}
      >
        <View 
          style={styles.modalContent}
          pointerEvents="auto"
        >
          <Text style={styles.modalTitle}>Select User</Text>
          
          {/* Add Search Bar */}
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />

          <Text style={styles.modalSubtitle}>Choose a user to send friend request:</Text>

          <View style={styles.contentContainer}>
            <FlatList
              data={displayedUsers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.userItem}
                  onPress={() => {
                    const friendId = item.id;

                    // Check if already friends or if request exists
                    db.collection('friendships')
                      .where('participants', 'array-contains', currentUser.uid)
                      .get()
                      .then(friendshipSnapshot => {
                        const existingFriendship = friendshipSnapshot.docs.find(doc => {
                          const data = doc.data();
                          return data.participants.includes(friendId);
                        });

                        if (existingFriendship) {
                          const status = existingFriendship.data().status;
                          if (status === 'accepted') {
                            Alert.alert('Error', 'Already friends with this user');
                          } else {
                            Alert.alert('Error', 'Friend request already pending');
                          }
                          return;
                        }

                        // Create friend request
                        return db.collection('friendships').add({
                          participants: [currentUser.uid, friendId],
                          senderId: currentUser.uid,
                          receiverId: friendId,
                          status: 'pending',
                          createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                      })
                      .then(() => {
                        setModalVisible(false);
                        setNewFriendEmail('');
                        Alert.alert('Success', 'Friend request sent!');
                      })
                      .catch(error => {
                        console.error('Error sending friend request:', error);
                        Alert.alert('Error', error.message);
                      });
                  }}
                >
                  <Text style={styles.userEmail}>{item.email}</Text>
                </TouchableOpacity>
              )}
            />
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    position: 'absolute',
    top: 150,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    paddingBottom: 10,
    width: '80%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: 'column',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  userItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userEmail: {
    fontSize: 16,
  },
  closeButton: {
    marginTop: 10,
    marginBottom: 45,
    padding: 10,
    backgroundColor: '#e74c3c',
    borderRadius: 5,
    alignItems: 'center',
    width: '100%',
  },
  closeButtonText: {
    fontSize: 16,
    color: 'white',
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  contentContainer: {
    flex: 1,
    maxHeight: '80%',
  },
});