// components/friends/FriendCard.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import styles from '../styles/FriendCardStyles';

export const FriendCard = ({ item, onRemove }) => (
  <View style={styles.friendCard}>
    <View style={styles.avatarContainer}>
      <Text style={styles.avatarText}>
        {(item.displayName || item.email).charAt(0).toUpperCase()}
      </Text>
    </View>
    <View style={styles.friendInfo}>
      <Text style={styles.friendName}>{item.displayName || item.email}</Text>
      <Text style={styles.friendEmail}>{item.email}</Text>
    </View>
    <TouchableOpacity
      style={styles.iconButton}
      onPress={() => onRemove(item.id, item.displayName || item.email)}
    >
      <Feather name="user-x" size={20} color="#FF3B30" />
    </TouchableOpacity>
  </View>
);