import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

const BillSplitSection = ({
  currentUser,
  selectedFriends,
  friends,
  splitMode,
  splitType,
  friendSplits,
  onRemoveFriend,
  onUpdateSplitAmount,
  onToggleSplitMode,
  onToggleSplitType,
  calculateCurrentUserSplit,
  calculateSplitAmount,
  styles, // Pass styles from parent
  scrollViewRef,
  friendPositions,
}) => {
  const [tempValue, setTempValue] = useState({});

  useEffect(() => {
    setTempValue({});
  }, [splitMode, splitType]);

  if (selectedFriends.length === 0) {
    return null;
  }

  return (
    <View style={styles.selectedFriendsContainer}>
      <View style={styles.splitControls}>
        <TouchableOpacity
          style={[styles.splitModeButton, splitMode === 'equal' && styles.splitModeButtonActive]}
          onPress={onToggleSplitMode}
        >
          <Text style={[styles.splitModeButtonText, splitMode === 'equal' && styles.splitModeButtonTextActive]}>
            Split Equally
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.splitModeButton, splitMode === 'custom' && styles.splitModeButtonActive]}
          onPress={onToggleSplitMode}
        >
          <Text style={[styles.splitModeButtonText, splitMode === 'custom' && styles.splitModeButtonTextActive]}>
            Custom Split
          </Text>
        </TouchableOpacity>
      </View>

      {splitMode === 'custom' && (
        <TouchableOpacity
          style={styles.splitTypeToggle}
          onPress={onToggleSplitType}
        >
          <Text style={styles.splitTypeText}>
            Currently splitting by: {splitType === 'percentage' ? 'Percentage of total ' : 'Custom amounts '}
          </Text>
          <Feather name="refresh-ccw" size={16} color="#007AFF" />
        </TouchableOpacity>
      )}

      {/* Current User Split Display */}
      <View style={[styles.selectedFriendItem, styles.currentUserSplit]}>
        <View style={styles.selectedFriendInfo}>
          <Text style={styles.selectedFriendName}>You</Text>
          <Text style={styles.selectedFriendEmail}>{currentUser.email}</Text>
        </View>
        <View style={styles.selectedFriendActions}>
          <Text style={[styles.splitAmount, styles.yourSplitAmount]}>
            ${calculateCurrentUserSplit().toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Friends Split Display */}
      {selectedFriends.map(friendId => {
        const friend = friends.find(f => f.id === friendId);
        if (!friend) return null;
        
        return (
          <View 
            key={friendId} 
            style={styles.selectedFriendItem}
            onLayout={(event) => {
              const { y } = event.nativeEvent.layout;
              friendPositions.current[friendId] = y;
            }}
          >
            <View style={styles.selectedFriendInfo}>
              <Text style={styles.selectedFriendName}>{friend.name}</Text>
              <Text style={styles.selectedFriendEmail}>{friend.email}</Text>
            </View>
            <View style={styles.selectedFriendActions}>
              <Text style={styles.splitTypeText}>{splitType === 'amount' ? '$' : splitMode === 'custom' ? '%' : ''}</Text>
              {splitMode === 'custom' && (
                <TextInput
                  style={styles.splitInput}
                  keyboardType="numeric"
                  value={tempValue[friendId] !== undefined ? tempValue[friendId] : splitType === 'amount' ? String(friendSplits[friendId]?.value.toFixed(2) || '') : String(friendSplits[friendId]?.value.toFixed(0) || '')}
                  onChangeText={(text) => {
                    setTempValue({...tempValue, [friendId]: text});
                    onUpdateSplitAmount(friendId, parseFloat(text) || 0);
                  }}
                  onFocus={() => {
                    const yPosition = friendPositions.current[friendId];
                    if (yPosition) {
                      scrollViewRef.current?.scrollTo({
                        y: yPosition - 100,
                        animated: true,
                      });
                    }
                  }}
                  onEndEditing={() => {
                    const tempTextValue = tempValue[friendId] || '';
                    const value = parseFloat(tempTextValue) || 0;
                    onUpdateSplitAmount(friendId, value);
                  }}
                  placeholder={splitType === 'percentage' ? '%0' : '$0.00'}
                  returnKeyType="done"
                />
              )}
              <Text style={styles.splitAmount}>
                ${calculateSplitAmount(friendId).toFixed(2)}
              </Text>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => onRemoveFriend(friendId)}
              >
                <Feather name="x" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </View>
  );
};

export default BillSplitSection;