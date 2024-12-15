import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Alert 
} from 'react-native';
import { Feather } from '@expo/vector-icons';

const ReceiptItemSplitter = ({ 
  items, 
  selectedFriends,
  friends, 
  currentUser, 
  onSplitUpdate 
}) => {
  const [itemAssignments, setItemAssignments] = useState(() => {
    // Initialize assignments in the initial state
    const initialAssignments = {};
    items.forEach((item, index) => {
      initialAssignments[index] = {
        sharedBy: [currentUser.uid],
        amount: item.total || 0
      };
    });
    return initialAssignments;
  });
  
  // Update assignments when items or friends change
  useEffect(() => {
    const newAssignments = {};
    items.forEach((item, index) => {
      // Preserve existing assignments if they exist
      if (itemAssignments[index]) {
        newAssignments[index] = itemAssignments[index];
      } else {
        newAssignments[index] = {
          sharedBy: [currentUser.uid],
          amount: item.total || 0
        };
      }
    });
    setItemAssignments(newAssignments);
  }, [items.length]); // Only re-run if the number of items changes

  // Notify parent of changes in a separate effect
  useEffect(() => {
    onSplitUpdate(itemAssignments);
  }, [itemAssignments]);

  const togglePersonForItem = (itemIndex, personId) => {
    setItemAssignments(prev => {
      const newAssignments = { ...prev };
      const item = newAssignments[itemIndex] || { 
        sharedBy: [currentUser.uid], 
        amount: items[itemIndex].total || 0 
      };
      
      if (item.sharedBy.includes(personId)) {
        // Remove person if they're already assigned
        if (item.sharedBy.length > 1) { // Prevent removing if they're the last person
          item.sharedBy = item.sharedBy.filter(id => id !== personId);
        } else {
          Alert.alert("Cannot Remove", "At least one person must be assigned to the item.");
          return prev;
        }
      } else {
        // Add person
        item.sharedBy = [...item.sharedBy, personId];
      }
      
      newAssignments[itemIndex] = item;
      return newAssignments;
    });
  };

  const calculatePersonTotal = (personId) => {
    return Object.entries(itemAssignments).reduce((total, [index, item]) => {
      if (item.sharedBy.includes(personId)) {
        const itemAmount = items[parseInt(index)].total || 0;
        return total + (itemAmount / item.sharedBy.length);
      }
      return total;
    }, 0);
  };

  const getFriendName = (friendId) => {
    const friend = friends.find(f => f.id === friendId);
    return friend ? (friend.name || friend.email) : 'Unknown';
  };

  const renderPersonBadge = (personId, itemIndex) => {
    const isAssigned = itemAssignments[itemIndex]?.sharedBy.includes(personId);
    const isCurrentUser = personId === currentUser.uid;
    const displayName = isCurrentUser ? 'You' : getFriendName(personId);

    return (
      <TouchableOpacity
        key={personId}
        style={[
          styles.personBadge,
          isAssigned && styles.personBadgeSelected
        ]}
        onPress={() => togglePersonForItem(itemIndex, personId)}
      >
        <Text style={[
          styles.personBadgeText,
          isAssigned && styles.personBadgeTextSelected
        ]}>
          {displayName}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Assign Items</Text>
      
      <ScrollView style={styles.itemsList}>
        {items.map((item, index) => (
          <View key={index} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemDescription}>
                {item.description || `Item ${index + 1}`}
              </Text>
              <Text style={styles.itemPrice}>
                ${item.total ? item.total.toFixed(2) : '0.00'}
              </Text>
            </View>
            
            <Text style={styles.splitLabel}>Split between:</Text>
            <View style={styles.badgesContainer}>
              {renderPersonBadge(currentUser.uid, index)}
              {selectedFriends.map(friendId => 
                renderPersonBadge(friendId, index)
              )}
            </View>
            
            <View style={styles.splitInfo}>
              <Text style={styles.splitAmount}>
                Each pays: $
                {(item.total / (itemAssignments[index]?.sharedBy.length || 1)).toFixed(2)}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>You owe:</Text>
          <Text style={styles.summaryAmount}>
            ${calculatePersonTotal(currentUser.uid).toFixed(2)}
          </Text>
        </View>
        {selectedFriends.map(friendId => (
          <View key={friendId} style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{getFriendName(friendId)} owes:</Text>
            <Text style={styles.summaryAmount}>
              ${calculatePersonTotal(friendId).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  itemsList: {
    maxHeight: 400,
  },
  itemCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginHorizontal: 15,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemDescription: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 10,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
  },
  splitLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  personBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    marginBottom: 8,
  },
  personBadgeSelected: {
    backgroundColor: '#007AFF',
  },
  personBadgeText: {
    fontSize: 14,
    color: '#666',
  },
  personBadgeTextSelected: {
    color: '#fff',
  },
  splitInfo: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  splitAmount: {
    fontSize: 14,
    color: '#666',
  },
  summary: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    marginHorizontal: 15,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ReceiptItemSplitter;