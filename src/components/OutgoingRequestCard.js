// components/friends/OutgoingRequestCard.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import styles from '../styles/RequestCardStyles';

export const OutgoingRequestCard = ({ item, onCancel }) => (
  <View style={styles.requestCard}>
    <View style={styles.requestCardLeft}>
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>
          {(item.displayName || item.email).charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.requestInfo}>
        <Text style={styles.friendName}>{item.displayName || item.email}</Text>
        <Text style={styles.friendEmail}>{item.email}</Text>
        <View style={styles.statusContainer}>
          <Feather name="clock" size={14} color="#666" />
          <Text style={styles.pendingText}>Request Pending</Text>
        </View>
      </View>
    </View>
    <TouchableOpacity
      style={[styles.actionButton, styles.cancelButton]}
      onPress={() => onCancel(item.id)}
    >
      <Text style={styles.actionButtonText}>Cancel</Text>
    </TouchableOpacity>
  </View>
);