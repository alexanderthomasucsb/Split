import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Modal
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';
import firebase from '../../firebaseConfig';
import CategorySelector, { categories } from '../components/CategorySelector';
import styles from '../styles/AddWithPictureScreenStyles';
import ImageView from "react-native-image-viewing";

const AddWithPictureScreen = ({ navigation }) => {
  // Image and Receipt Data States
  const [imageUri, setImageUri] = useState(null);
  const [items, setItems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  // Bill Details States
  const [billAmount, setBillAmount] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  
  // UI States
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showFriendSelector, setShowFriendSelector] = useState(false);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Split States
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendSplits, setFriendSplits] = useState({});
  
  const currentUser = firebase.auth().currentUser;
  const db = firebase.firestore();

  // Fetch friends list
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
        } catch (error) {
          console.error('Error fetching friends:', error);
          Alert.alert('Error', 'Failed to load friends list');
        }
      });

    return () => unsubscribe();
  }, []);

  const takePicture = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your camera to take a picture.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.images,
        allowsEditing: false,
        aspect: [3, 4],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        processReceipt(result.assets[0].base64);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take picture');
    } finally {
      setShowImagePickerModal(false);
    }
  };

  const selectFromLibrary = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library to select a receipt.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.images,
        allowsEditing: false,
        aspect: [3, 4],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        processReceipt(result.assets[0].base64);
      }
    } catch (error) {
      console.error('Image picking error:', error);
      Alert.alert('Error', 'Failed to select image');
    } finally {
      setShowImagePickerModal(false);
    }
  };

  const selectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        const response = await fetch(result.uri);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result.split(',')[1];
          setImageUri(result.uri);
          processReceipt(base64data);
        };
      }
    } catch (error) {
      console.error('File picking error:', error);
      Alert.alert('Error', 'Failed to select file');
    } finally {
      setShowImagePickerModal(false);
    }
  };

  const processReceipt = async (base64Data) => {
    if (!base64Data) return;

    setProcessing(true);
    try {
      const response = await axios.post('https://api.veryfi.com/api/v8/partner/documents/', {
        file_data: base64Data,
        categories: ['Grocery', 'Utilities'],
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Client-Id': 'vrfgg8zdNriSgmwfeFtvn60sLZXXDTgGyf52Tt1',
          'Authorization': 'apikey nadavavital:5bd7d76e76268b00d6ce8418e2726b51',
        }
      });

      if (response.data.line_items) {
        const lineItems = [...response.data.line_items];
        if (response.data.tax) {
          lineItems.push({
            description: 'Tax',
            total: response.data.tax,
            isSystemGenerated: true
          });
        }
        setItems(lineItems);
        
        if (response.data.total) {
          setBillAmount(response.data.total.toString());
        }
        
        if (response.data.vendor?.name) {
          setTitle(`Bill from ${response.data.vendor.name}`);
        }
      }
    } catch (error) {
      console.error('Receipt processing error:', error);
      Alert.alert('Error', 'Failed to process receipt');
    } finally {
      setProcessing(false);
    }
  };

  const uploadImage = async (uri) => {
    try {
      setUploading(true);
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const filename = `receipts/${currentUser.uid}/${Date.now()}.jpg`;
      const ref = firebase.storage().ref().child(filename);
      
      const snapshot = await ref.put(blob);
      const downloadURL = await snapshot.ref.getDownloadURL();
      
      return downloadURL;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    } finally {
      setUploading(false);
    }
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
      let imageUrl = null;
      if (imageUri) {
        try {
          imageUrl = await uploadImage(imageUri);
        } catch (error) {
          console.error('Image upload failed:', error);
          const shouldContinue = await new Promise((resolve) => {
            Alert.alert(
              'Warning',
              'Failed to upload receipt image. Continue without image?',
              [
                { text: 'Cancel', onPress: () => resolve(false) },
                { text: 'Continue', onPress: () => resolve(true) }
              ]
            );
          });

          if (!shouldContinue) {
            setLoading(false);
            return;
          }
        }
      }

      // Create bill document
      const billRef = await db.collection('bills').add({
        amount: parseFloat(billAmount),
        title: title,
        description: description || '',
        category: category,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdBy: currentUser.uid,
        status: 'pending',
        participants: [currentUser.uid, ...selectedFriends],
        totalParticipants: selectedFriends.length + 1,
        receiptItems: items.map((item, index) => ({
          ...item,
          assignments: friendSplits[index]?.sharedBy || [currentUser.uid]
        })),
        receiptImage: imageUrl,
      });

      // Calculate and create payments
      const individualShares = {};
      items.forEach((item, index) => {
        const sharedBy = friendSplits[index]?.sharedBy || [currentUser.uid];
        const shareAmount = item.total / sharedBy.length;
        
        sharedBy.forEach(userId => {
          individualShares[userId] = (individualShares[userId] || 0) + shareAmount;
        });
      });

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
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.label : 'Other';
  };

  const getAssignedFriends = (itemIndex) => {
    const assignments = friendSplits[itemIndex]?.sharedBy || [currentUser.uid];
    return assignments.map(userId => {
      if (userId === currentUser.uid) return 'You';
      const friend = friends.find(f => f.id === userId);
      return friend ? friend.name : 'Unknown';
    }).join(', ');
  };

  const toggleFriendForItem = (itemIndex, friendId) => {
    setFriendSplits(prev => {
      const newSplits = { ...prev };
      // Initialize with empty array instead of including currentUser
      const currentItem = newSplits[itemIndex] || { sharedBy: [] };
      
      if (currentItem.sharedBy.includes(friendId)) {
        // Remove friend if they're already assigned
        newSplits[itemIndex] = {
          ...currentItem,
          sharedBy: currentItem.sharedBy.filter(id => id !== friendId)
        };
      } else {
        // Add only the selected friend
        newSplits[itemIndex] = {
          ...currentItem,
          sharedBy: [...currentItem.sharedBy, friendId]
        };
      }
      
      return newSplits;
    });
  };

  const [isImageVisible, setIsImageVisible] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color="#6C47FF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Bill with Picture</Text>
        </View>
  
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.imageSection}>
            <View style={styles.imageContainer}>
              <TouchableOpacity 
                style={styles.imageButton}
                onPress={() => imageUri ? setIsImageVisible(true) : setShowImagePickerModal(true)}
              >
                {imageUri ? (
                  <View style={styles.imageWrapper}>
                    <View style={styles.maximizeIcon}>
                      <Feather name="maximize" size={16} color="#666" />
                    </View>
                    <Image 
                      source={{ uri: imageUri }} 
                      style={styles.selectedImage}
                      resizeMode="contain"
                    />
                    <View style={styles.imageHintContainer}>
                      <Feather name="maximize" size={16} color="#666" />
                      <Text style={styles.imageHintText}>Tap to view</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Feather name="camera" size={40} color="#6C47FF" />
                    <Text style={styles.imagePlaceholderText}>
                      Tap to add receipt
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {imageUri && (
                <TouchableOpacity 
                  style={styles.changeImageButton}
                  onPress={() => setShowImagePickerModal(true)}
                >
                  <Feather name="camera" size={16} color="#6C47FF" />
                  <Text style={styles.changeImageText}>Select another image</Text>
                </TouchableOpacity>
              )}
            </View>

            {imageUri && (
              <ImageView
                images={[{ uri: imageUri }]}
                imageIndex={0}
                visible={isImageVisible}
                onRequestClose={() => setIsImageVisible(false)}
                doubleTapToZoomEnabled={true}
                presentationStyle="overFullScreen"
              />
            )}
          </View>
  
          {processing && (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="small" color="#6C47FF" />
              <Text style={styles.processingText}>Processing receipt...</Text>
            </View>
          )}
  
          <View style={styles.form}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter bill title"
              placeholderTextColor="#999"
            />
  
            <View style={styles.horizontalContainer}>
              <View style={styles.flex1}>
                <Text style={styles.label}>Amount</Text>
                <TextInput
                  style={styles.input}
                  value={billAmount}
                  onChangeText={setBillAmount}
                  keyboardType="decimal-pad"
                  placeholder="Enter amount"
                  placeholderTextColor="#999"
                />
              </View>
              
              <View style={styles.horizontalSpacing} />
              
              <View style={styles.flex1}>
                <Text style={styles.label}>Category</Text>
                <TouchableOpacity
                  style={styles.categoryButton}
                  onPress={() => setShowCategoryModal(true)}
                >
                  <Feather 
                    name={categories.find(cat => cat.id === category)?.icon || 'grid'} 
                    size={20} 
                    color="#6C47FF" 
                  />
                  <Text style={styles.categoryButtonText}>
                    {getCategoryName(category)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
  
            <Text style={styles.label}>Split With</Text>
            <TouchableOpacity
              style={styles.friendButton}
              onPress={() => setShowFriendSelector(true)}
            >
              <Feather name="users" size={20} color="#6C47FF" />
              <Text style={styles.friendButtonText}>
                {selectedFriends.length > 0 
                  ? `${selectedFriends.length} friends selected` 
                  : 'Select friends'}
              </Text>
            </TouchableOpacity>
  
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add description"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
  
            {items.length > 0 && (
              <View style={styles.itemsSection}>
                <Text style={styles.sectionTitle}>Receipt Items</Text>
                {items.map((item, index) => (
                  <View key={index} style={styles.itemCard}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemDescription}>
                        {item.description || `Item ${index + 1}`}
                      </Text>
                      <Text style={styles.itemAmount}>
                        ${item.total?.toFixed(2)}
                      </Text>
                    </View>
                    
                    <Text style={styles.assignLabel}>Assign to:</Text>
                    <View style={styles.assignees}>
                      <TouchableOpacity
                        style={[
                          styles.assigneeChip,
                          friendSplits[index]?.sharedBy?.includes(currentUser.uid) && 
                          styles.assigneeChipSelected
                        ]}
                        onPress={() => toggleFriendForItem(index, currentUser.uid)}
                      >
                        <Text style={[
                          styles.assigneeChipText,
                          friendSplits[index]?.sharedBy?.includes(currentUser.uid) && 
                          styles.assigneeChipTextSelected
                        ]}>
                          You
                        </Text>
                      </TouchableOpacity>
                      
                      {selectedFriends.map(friendId => {
                        const friend = friends.find(f => f.id === friendId);
                        return (
                          <TouchableOpacity
                            key={friendId}
                            style={[
                              styles.assigneeChip,
                              friendSplits[index]?.sharedBy?.includes(friendId) && 
                              styles.assigneeChipSelected
                            ]}
                            onPress={() => toggleFriendForItem(index, friendId)}
                          >
                            <Text style={[
                              styles.assigneeChipText,
                              friendSplits[index]?.sharedBy?.includes(friendId) && 
                              styles.assigneeChipTextSelected
                            ]}>
                              {friend?.name || friend?.email}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>
            )}
  
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddBill}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.addButtonText}>Add Bill</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
  
        {/* Image Picker Modal */}
        <Modal
          visible={showImagePickerModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowImagePickerModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Image Source</Text>
                <TouchableOpacity
                  onPress={() => setShowImagePickerModal(false)}
                  style={styles.modalCloseButton}
                >
                  <Feather name="x" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={styles.squareOption}
                  onPress={takePicture}
                >
                  <View style={styles.iconContainer}>
                    <Feather name="camera" size={32} color="#6C47FF" />
                  </View>
                  <Text style={styles.squareOptionText}>Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.squareOption}
                  onPress={selectFromLibrary}
                >
                  <View style={styles.iconContainer}>
                    <Feather name="image" size={32} color="#6C47FF" />
                  </View>
                  <Text style={styles.squareOptionText}>Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.squareOption}
                  onPress={selectFile}
                >
                  <View style={styles.iconContainer}>
                    <Feather name="file" size={32} color="#6C47FF" />
                  </View>
                  <Text style={styles.squareOptionText}>File</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Category Selector Modal */}
        <CategorySelector
          showModal={showCategoryModal}
          selectedCategory={category}
          onSelectCategory={setCategory}
          onClose={() => setShowCategoryModal(false)}
        />
  
        {/* Friend Selector Modal */}
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
                onPress={() => setShowFriendSelector(false)}
              >
                <Text style={styles.modalDoneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
  
        {(uploading || processing) && (
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.overlayText}>
              {uploading ? 'Uploading image...' : 'Processing receipt...'}
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AddWithPictureScreen;
