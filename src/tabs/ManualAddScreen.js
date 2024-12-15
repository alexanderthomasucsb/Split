import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  Alert, 
  ScrollView, 
  Platform, 
  Modal, 
  KeyboardAvoidingView 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import firebase from '../../firebaseConfig';
import { styles } from '../styles/ManualAddScreenStyles';
import CategorySelector, { categories } from '../components/CategorySelector';
import BillSplitSection from '../components/BillSplitSection';

const ManualAddScreen = ({ navigation }) => {
  const [billAmount, setBillAmount] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showFriendSelector, setShowFriendSelector] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [splitMode, setSplitMode] = useState('equal');
  const [splitType, setSplitType] = useState('percentage');
  const [totalSplits, setTotalSplits] = useState({});
  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({ name: '', amount: '' });
  const [billSplitType, setBillSplitType] = useState('total');
  const [currentItemId, setCurrentItemId] = useState(null);
  
  const scrollViewRef = useRef(null);
  const friendPositions = useRef({});
  
  const currentUser = firebase.auth().currentUser;
  const db = firebase.firestore();

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = db.collection('friendships')
      .where('status', '==', 'accepted')
      .where('participants', 'array-contains', currentUser.uid)
      .onSnapshot(async snapshot => {
        try {
          const friendsPromises = snapshot.docs.map(async doc => {
            const friendship = doc.data();
            const friendId = friendship.participants.find(id => id !== currentUser.uid);
            const friendDoc = await db.collection('users').doc(friendId).get();
            
            return {
              id: friendId,
              name: friendDoc.data()?.displayName || friendDoc.data()?.email,
              email: friendDoc.data()?.email,
            };
          });

          const friendsData = await Promise.all(friendsPromises);
          setFriends(friendsData);
          setLoading(false);
        } catch (error) {
          console.error('Error fetching friends:', error);
          setLoading(false);
        }
      });

    return () => unsubscribe();
  }, []);

  const updateSplitAmount = (friendId, value, type = splitType) => {
    const newSplits = { ...totalSplits };
    
    if (type === 'percentage') {
      newSplits[friendId] = {
        type: 'percentage',
        value: Math.min(Math.max(parseFloat(value) || 0, 0), 100)
      };
    } else {
      newSplits[friendId] = {
        type: 'amount',
        value: Math.min(Math.max(parseFloat(value) || 0, 0), parseFloat(billAmount) || 0)
      };
    }
    
    setTotalSplits(newSplits);
  };



  const calculateSplitAmount = (friendId) => {
    if (!billAmount) return 0;
    const totalAmount = parseFloat(billAmount);
    
    if (splitMode === 'equal') {
      const totalParticipants = selectedFriends.length + 1;
      return (totalAmount / totalParticipants);
    }
    
    if (!totalSplits[friendId]) {
      return 0;
    }

    if (totalSplits[friendId].type === 'percentage') {
      return ((totalAmount * totalSplits[friendId].value) / 100);
    }
    
    return totalSplits[friendId].value;
  };

  const calculateCurrentUserSplit = () => {
    if (!billAmount) return 0;
    const totalAmount = parseFloat(billAmount);
    
    if (splitMode === 'equal') {
      const totalParticipants = selectedFriends.length + 1;
      return (totalAmount / totalParticipants);
    }
    
    let totalFriendsSplit = 0;
    selectedFriends.forEach(friendId => {
      if (totalSplits[friendId]) {
        totalFriendsSplit += calculateSplitAmount(friendId);
      }
    });
  
    return (totalAmount - totalFriendsSplit);
  };

  const toggleSplitMode = () => {
    const newMode = splitMode === 'equal' ? 'custom' : 'equal';
    setSplitMode(newMode);
    let newSplits = totalSplits;
    const allParticipants = [currentUser.uid, ...selectedFriends];
    if (newMode === 'equal') {
      const equalSplit = 100 / allParticipants.length;
      newSplits = {};
      allParticipants.forEach(friendId => {
        newSplits[friendId] = {
          type: 'percentage',
          value: equalSplit
        };
      });
      setSplitType('percentage');
      setTotalSplits(newSplits);
    }
    else {
      setSplitMode('custom');
      setTotalSplits(newSplits);
    }
  };

  const toggleSplitType = () => {
    const allParticipants = [currentUser.uid, ...selectedFriends];
    const newType = splitType === 'percentage' ? 'amount' : 'percentage';
    setSplitType(newType);
    
    const newSplits = {};
    allParticipants.forEach(friendId => {
      const currentSplit = totalSplits[friendId] || { type: 'percentage', value: 0 };
      if (newType === 'amount') {
        newSplits[friendId] = {
          type: 'amount',
          value: parseFloat(currentSplit.value * parseFloat(billAmount)/100)
        };
      } else {
        const totalAmount = parseFloat(billAmount) || 0;
        newSplits[friendId] = {
          type: 'percentage',
          value: totalAmount ? (currentSplit.value / totalAmount) * 100 : 0
        };
      }
    });
    setTotalSplits(newSplits);
  };

  const removeFriend = (friendId) => {
    setSelectedFriends(prev => prev.filter(id => id !== friendId));
    const newSplits = { ...totalSplits };
    delete newSplits[friendId];
    setTotalSplits(newSplits);
  };

  const addItem = () => {
    if (!currentItem.name || !currentItem.amount) {
      Alert.alert('Error', 'Please enter item name and amount');
      return;
    }

    setItems(prev => [...prev, {
      id: Date.now().toString(),
      description: currentItem.name,
      total: parseFloat(currentItem.amount),
      assignments: [currentUser.uid]
    }]);

    setBillAmount(prev => {
      const prevAmount = parseFloat(prev) || 0;
      return (prevAmount + parseFloat(currentItem.amount)).toString();
    });
    
    setCurrentItem({ name: '', amount: '' });
    
    
  };

  const removeItem = (itemId) => {
    setItems(prev => {
      const itemToRemove = prev.find(item => item.id === itemId);
      const newItems = prev.filter(item => item.id !== itemId);
      
      setBillAmount(prev => {
        const prevAmount = parseFloat(prev) || 0;
        return (prevAmount - itemToRemove.total).toString();
      });
      
      return newItems;
    });
  };

  const handleAddBill = async () => {
    if (!billAmount || !title) {
      Alert.alert('Error', 'Please enter bill amount and title');
      return;
    }

    if (selectedFriends.length === 0) {
      Alert.alert('Error', 'Please select at least one friend');
      return;
    }

    setLoading(true);
    try {
      // Create bill document with the correct item structure
      const billRef = await db.collection('bills').add({
        amount: parseFloat(billAmount),
        title: title,
        description: description || '',
        category: category || 'other',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdBy: currentUser.uid,
        status: 'pending',
        participants: [currentUser.uid, ...selectedFriends],
        totalParticipants: selectedFriends.length + 1,
        receiptItems: billSplitType === 'items' ? items.map(item => ({
          description: item.description,  // This is already correct from the addItem function
          total: parseFloat(item.total),  // This is already correct from the addItem function
          assignments: item.assignments || [currentUser.uid]  // Using assignments from the item
        })) : [],
        splits: totalSplits
      });

      const individualShares = {};
      if (billSplitType === 'items'){
        items.forEach((item) => {
          const sharedBy = item.assignments;
          const shareAmount = item.total / sharedBy.length;
          
          sharedBy.forEach(userId => {
            individualShares[userId] = (individualShares[userId] || 0) + shareAmount;
          });
        });
      }
      else {
        Object.keys(totalSplits).forEach(friendId => {
          individualShares[friendId] = calculateSplitAmount(friendId);
        });
        individualShares[currentUser.uid] = calculateCurrentUserSplit();
      }
      
      const payments = [currentUser.uid, ...selectedFriends].map(userId => ({
        billId: billRef.id,
        userId: userId,
        amount: individualShares[userId] || 0,
        status: userId === currentUser.uid ? 'paid' : 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      }));

      await Promise.all(
        payments.map(payment => db.collection('payments').add(payment))
      );

      Alert.alert('Success', 'Bill added and split successfully!');
      navigation.replace('BillDetails', { billId: billRef.id });
    } catch (error) {
      console.error('Error adding bill:', error);
      Alert.alert('Error', 'Failed to add bill');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find(cat => cat.id === category);

  const renderItemsSplitSection = () => {
    if (splitMode !== 'items') return null;

    return (
      <View style={styles.itemsSection}>
        <Text style={[styles.label, styles.marginTop]}>Items</Text>
        
        <View style={styles.itemForm}>
          <TextInput
            style={[styles.input, styles.itemInput]}
            placeholder="Item name"
            value={currentItem.name}
            onChangeText={name => setCurrentItem(prev => ({ ...prev, name }))}
          />
          <TextInput
            style={[styles.input, styles.itemAmountInput]}
            placeholder="Amount"
            keyboardType="numeric"
            value={currentItem.amount}
            onChangeText={amount => setCurrentItem(prev => ({ ...prev, amount }))}
          />
          <TouchableOpacity 
            style={styles.addItemButton}
            onPress={addItem}
          >
            <Feather name="plus" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {items.map(item => (
          <View key={item.id} style={styles.itemContainer}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemName}>{item.description}</Text>
              <Text style={styles.itemAmount}>${parseFloat(item.total).toFixed(2)}</Text>
              <TouchableOpacity onPress={() => removeItem(item.id)}>
                <Feather name="trash-2" size={20} color="#FF4444" />
              </TouchableOpacity>
            </View>
            <BillSplitSection
              currentUser={currentUser}
              selectedFriends={selectedFriends}
              friends={friends}
              splitMode={splitMode}
              splitType={splitType}
              friendSplits={item.splits}
              onRemoveFriend={removeFriend}
              onUpdateSplitAmount={(friendId, value, type) => {
                const newItems = [...items];
                const itemIndex = newItems.findIndex(i => i.id === item.id);
                if (itemIndex !== -1) {
                  newItems[itemIndex].splits[friendId] = { type, value };
                  setItems(newItems);
                }
              }}
              calculateCurrentUserSplit={() => calculateItemSplit(item)}
              calculateSplitAmount={(friendId) => calculateItemSplitForFriend(item, friendId)}
              styles={styles}
              scrollViewRef={scrollViewRef}
              friendPositions={friendPositions}
            />
          </View>
        ))}
      </View>
    );
  };

  const calculateItemSplit = (item) => {
    if (!item.amount) return '0.00';
    const totalAmount = parseFloat(item.amount);
    
    let totalFriendsSplit = 0;
    selectedFriends.forEach(friendId => {
      if (item.splits[friendId]) {
        if (item.splits[friendId].type === 'percentage') {
          totalFriendsSplit += (totalAmount * item.splits[friendId].value) / 100;
        } else {
          totalFriendsSplit += item.splits[friendId].value;
        }
      }
    });
    
    return (totalAmount - totalFriendsSplit).toFixed(2);
  };

  const calculateItemSplitForFriend = (item, friendId) => {
    if (!item.amount) return '0.00';
    const totalAmount = parseFloat(item.amount);
    
    if (!item.splits[friendId]) {
      return '0.00';
    }

    if (item.splits[friendId].type === 'percentage') {
      return ((totalAmount * item.splits[friendId].value) / 100).toFixed(2);
    }
    
    return item.splits[friendId].value.toFixed(2);
  };

  const addItemSplit = (itemId, friendId) => {
    setItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            splits: {
              ...item.splits,
              [friendId]: { type: 'equal', value: 0 }
            }
          };
        }
        return item;
      });
    });
  };

  const removeItemSplit = (itemId, friendId) => {
    setItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === itemId) {
          const newSplits = { ...item.splits };
          delete newSplits[friendId];
          return {
            ...item,
            splits: newSplits
          };
        }
        return item;
      });
    });
  };

  const handleFriendSelection = (friendId) => {
    if (currentItemId) {
      // Handle item split
      setItems(prevItems => {
        return prevItems.map(item => {
          if (item.id === currentItemId) {
            const newSplits = { ...item.splits };
            if (newSplits[friendId]) {
              delete newSplits[friendId];
            } else {
              newSplits[friendId] = { type: 'equal', value: 0 };
            }
            return { ...item, splits: newSplits };
          }
          return item;
        });
      });
    } else {
      // Handle bill level split
      setSelectedFriends(prev =>
        prev.includes(friendId)
          ? prev.filter(id => id !== friendId)
          : [...prev, friendId]
      );
    }
  };

  const updateItemSplitMode = (itemId, mode) => {
    setItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === itemId) {
          const splits = item.splits || {};
          if (mode === 'equal') {
            const participantCount = Object.keys(splits).length || 1;
            const equalSplit = 100 / participantCount;
            Object.keys(splits).forEach(key => {
              splits[key] = equalSplit;
            });
          }
          return {
            ...item,
            splitMode: mode,
            splits: splits
          };
        }
        return item;
      });
    });
  };



  const toggleItemParticipant = (itemId, participantId) => {
    setItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === itemId) {
          const assignments = item.assignments || [];
          return {
            ...item,
            assignments: assignments.includes(participantId)
              ? assignments.filter(id => id !== participantId)
              : [...assignments, participantId]
          };
        }
        return item;
      });
    });
  };
  function getInitialSplits(allParticipants) {
    const splits = Object.fromEntries(allParticipants.map(userId => [
      userId,
      {
        type: 'percentage',
        value: 100 / (selectedFriends.length + 1)
      }
    ]))
    return splits
  };
  const updateItemSplit = (itemId, participantId, value) => {
    setItems(prevItems => {
      return prevItems.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            splits: {
              ...item.splits,
              [participantId]: parseFloat(value) || 0
            }
          };
        }
        return item;
      });
    });
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.label : 'Other';
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView 
          style={styles.container}
          ref={scrollViewRef}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Feather name="arrow-left" size={24} color="#6C47FF" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Add New Bill</Text>
            </View>

            <Text style={styles.label}>Title</Text>
            <TextInput
              style={[styles.input, styles.marginBottom]}
              placeholder="e.g., Dinner at Restaurant"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={[styles.label, styles.smallLabel]}>Category</Text>
            <TouchableOpacity
              style={[styles.categoryButton, styles.compactCategoryButton]}
              onPress={() => setShowCategoryModal(true)}
            >
              <View style={styles.categoryButtonInner}>
                <Feather 
                  name={selectedCategory?.icon || 'grid'} 
                  size={16} 
                  color="#6C47FF" 
                />
                <Text style={[styles.categoryButtonText, styles.compactCategoryText]}>
                  {selectedCategory?.label || 'Other'}
                </Text>
                <Feather name="chevron-down" size={16} color="#666" />
              </View>
            </TouchableOpacity>

            <Text style={styles.label}>How would you like to enter the bill?</Text>
            <View style={styles.splitTypeContainer}>
              <TouchableOpacity 
                style={[
                  styles.splitTypeButton, 
                  billSplitType === 'total' && styles.splitTypeButtonActive
                ]}
                onPress={() => {
                  setBillSplitType('total');
                  setItems([]);
                }}
              >
                <View style={styles.splitTypeContent}>
                  <Feather 
                    name="dollar-sign" 
                    size={28} 
                    color={billSplitType === 'total' ? '#6C47FF' : '#666'} 
                  />
                  <Text style={[
                    styles.splitTypeText,
                    billSplitType === 'total' && styles.splitTypeTextActive
                  ]}>Total</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.splitTypeButton, 
                  billSplitType === 'items' && styles.splitTypeButtonActive
                ]}
                onPress={() => {
                  setBillSplitType('items');
                  setBillAmount('');
                }}
              >
                <View style={styles.splitTypeContent}>
                  <Feather 
                    name="list" 
                    size={28} 
                    color={billSplitType === 'items' ? '#6C47FF' : '#666'} 
                  />
                  <Text style={[
                    styles.splitTypeText,
                    billSplitType === 'items' && styles.splitTypeTextActive
                  ]}>By Item</Text>
                </View>
              </TouchableOpacity>
            </View>

            {billSplitType === 'total' && (
              <View style={styles.amountContainer}>
                <Text style={styles.label}>Amount</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter Amount"
                  keyboardType="numeric"
                  value={billAmount}
                  onChangeText={(text) => {
                    setBillAmount(text);
                    setTotalSplits(getInitialSplits([currentUser.uid, ...selectedFriends]));
                  }}
                />
              </View>
            )}

            <Text style={[styles.label, styles.marginTop]}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add any relevant details"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <Text style={[styles.label, styles.marginTop]}>Split With</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowFriendSelector(true)}
            >
              <Feather name="users" size={20} color="#6C47FF" />
              <Text style={styles.dropdownButtonText}>
                {selectedFriends.length > 0 
                  ? `${selectedFriends.length} friends selected` 
                  : 'Select friends'}
              </Text>
              <Feather name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>

            {selectedFriends.length > 0 && billSplitType === 'total' && (
              <BillSplitSection
                currentUser={currentUser}
                selectedFriends={selectedFriends}
                friends={friends}
                splitMode={splitMode}
                splitType={splitType}
                friendSplits={totalSplits}
                onRemoveFriend={removeFriend}
                onUpdateSplitAmount={updateSplitAmount}
                onToggleSplitMode={toggleSplitMode}
                onToggleSplitType={toggleSplitType}
                calculateCurrentUserSplit={calculateCurrentUserSplit}
                calculateSplitAmount={calculateSplitAmount}
                styles={styles}
                scrollViewRef={scrollViewRef}
                friendPositions={friendPositions}
              />
            )}

            {billSplitType === 'items' && (
              <View style={styles.itemsSection}>
                <Text style={[styles.label, styles.marginTop]}>Items</Text>
                <View style={styles.itemForm}>
                  <TextInput
                    style={[styles.input, styles.itemInput]}
                    placeholder="Item name"
                    value={currentItem.name}
                    onChangeText={name => setCurrentItem(prev => ({ ...prev, name }))}
                  />
                  <TextInput
                    style={[styles.input, styles.itemAmountInput]}
                    placeholder="Amount"
                    keyboardType="numeric"
                    value={currentItem.amount}
                    onChangeText={amount => setCurrentItem(prev => ({ ...prev, amount }))}
                  />
                  <TouchableOpacity 
                    style={styles.addItemButton}
                    onPress={addItem}
                  >
                    <Feather name="plus" size={24} color="#FFF" />
                  </TouchableOpacity>
                </View>

                {items.map(item => (
                  <View key={item.id} style={styles.itemContainer}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemName}>{item.description}</Text>
                      <Text style={styles.itemAmount}>${parseFloat(item.total).toFixed(2)}</Text>
                      <TouchableOpacity onPress={() => removeItem(item.id)}>
                        <Feather name="trash-2" size={20} color="#FF4444" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.itemSplitSection}>
                      <View style={styles.participantsRow}>
                        <TouchableOpacity
                          style={[
                            styles.participantChip,
                            item.assignments?.includes(currentUser.uid) && styles.participantChipSelected
                          ]}
                          onPress={() => toggleItemParticipant(item.id, currentUser.uid)}
                        >
                          <Text style={styles.participantChipText}>Me</Text>
                        </TouchableOpacity>
                        {selectedFriends.map(friendId => {
                          const friend = friends.find(f => f.id === friendId);
                          return (
                            <TouchableOpacity
                              key={friendId}
                              style={[
                                styles.participantChip,
                                item.assignments?.includes(friendId) && styles.participantChipSelected
                              ]}
                              onPress={() => toggleItemParticipant(item.id, friendId)}
                            >
                              <Text style={styles.participantChipText}>
                                {friend?.name?.split(' ')[0] || friend?.email?.split('@')[0]}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      <View style={styles.splitSummary}>
                        {item.assignments?.map(participantId => {
                          const isCurrentUser = participantId === currentUser.uid;
                          const friend = friends.find(f => f.id === participantId);
                          const name = isCurrentUser ? 'Me' : 
                            (friend?.name?.split(' ')[0] || friend?.email?.split('@')[0]);
                          const amount = parseFloat(item.total) / (item.assignments?.length || 1);

                          return (
                            <Text key={participantId} style={styles.splitSummaryText}>
                              {name}: ${amount.toFixed(2)}
                            </Text>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                ))}

                <Text style={styles.totalAmount}>
                  Total: ${items.reduce((sum, item) => sum + parseFloat(item.total || 0), 0).toFixed(2)}
                </Text>
              </View>
            )}

            <TouchableOpacity 
              style={styles.addButton} 
              onPress={handleAddBill}
            >
              <Text style={styles.addButtonText}>Add Bill</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Category Selection Modal */}
        <CategorySelector
          showModal={showCategoryModal}
          onClose={() => setShowCategoryModal(false)}
          selectedCategory={category}
          onSelectCategory={setCategory}
        />

        {/* Friend Selection Modal */}
        <Modal
          visible={showFriendSelector}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowFriendSelector(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Friends</Text>
                <TouchableOpacity
                  onPress={() => setShowFriendSelector(false)}
                  style={styles.modalCloseButton}
                >
                  <Feather name="x" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                {friends.map((friend) => (
                  <TouchableOpacity
                    key={friend.id}
                    style={styles.friendItem}
                    onPress={() => {
                      setSelectedFriends(prev =>
                        prev.includes(friend.id)
                          ? prev.filter(id => id !== friend.id)
                          : [...prev, friend.id]
                      );
                    }}
                  >
                    <View style={styles.friendInfo}>
                      <Text style={styles.friendName}>{friend.name}</Text>
                      <Text style={styles.friendEmail}>{friend.email}</Text>
                    </View>
                    <View style={[
                      styles.checkbox,
                      selectedFriends.includes(friend.id) && styles.checkedBox
                    ]} />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={styles.modalDoneButton}
                onPress={() => {
                  setShowFriendSelector(false);
                  setTotalSplits(getInitialSplits([currentUser.uid, ...selectedFriends]));
                }}
              >
                <Text style={styles.modalDoneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ManualAddScreen;