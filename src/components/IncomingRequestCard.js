// components/friends/IncomingRequestCard.js
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import styles from '../styles/RequestCardStyles';

export const IncomingRequestCard = ({ item, onAccept, onDecline }) => (
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
      </View>
    </View>
    <View style={styles.requestButtons}>
      <TouchableOpacity
        style={[styles.actionButton, styles.acceptButton]}
        onPress={() => onAccept(item.id)}
      >
        <Feather name="check" size={16} color="#fff" />
        <Text style={styles.actionButtonText}>Accept</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionButton, styles.declineButton]}
        onPress={() => onDecline(item.id)}
      >
        <Feather name="x" size={16} color="#fff" />
        <Text style={styles.actionButtonText}>Decline</Text>
      </TouchableOpacity>
    </View>
  </View>
);