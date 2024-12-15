import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  SafeAreaView,
  Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';

export const GroupModal = ({
  visible,
  onClose,
  friends,
  currentUser,
  groupName,
  setGroupName,
  selectedFriends,
  setSelectedFriends,
  onCreateGroup
}) => {
  const toggleFriendSelection = (friend) => {
    const isSelected = selectedFriends.some(f => f.id === friend.id);
    if (isSelected) {
      setSelectedFriends(selectedFriends.filter(f => f.id !== friend.id));
    } else {
      setSelectedFriends([...selectedFriends, friend]);
    }
  };

  const renderFriendItem = ({ item }) => {
    const isSelected = selectedFriends.some(f => f.id === item.id);
    return (
      <TouchableOpacity
        style={[
          styles.friendItem,
          isSelected && styles.selectedFriendItem
        ]}
        onPress={() => toggleFriendSelection(item)}
      >
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{item.displayName || item.email}</Text>
          {isSelected && (
            <Feather 
              name="check-circle" 
              size={20} 
              color="#40C057" 
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Friend Group</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Feather name="x" size={24} color="#212529" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Group Name"
            value={groupName}
            onChangeText={setGroupName}
          />

          <Text style={styles.sectionTitle}>Select Friends</Text>
          <FlatList
            data={friends}
            renderItem={renderFriendItem}
            keyExtractor={(item) => item.id}
            style={styles.friendsList}
          />

          <TouchableOpacity 
            style={styles.createGroupButton}
            onPress={onCreateGroup}
          >
            <Text style={styles.createGroupButtonText}>Create Group</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = {
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
  },
  modalCloseButton: {
    padding: 4,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 12,
  },
  friendsList: {
    marginBottom: 20,
  },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  selectedFriendItem: {
    backgroundColor: 'rgba(64, 192, 87, 0.1)',
  },
  friendName: {
    fontSize: 16,
    color: '#212529',
  },
  createGroupButton: {
    backgroundColor: '#6C47FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  createGroupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
};