import React from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import firebase from '../../firebaseConfig';
import VenmoLinker from './VenmoLinker';

const VenmoUsernameModal = ({ 
  visible, 
  onClose, 
  onSuccess, 
  initialValue = '' 
}) => {
  const [venmoInput, setVenmoInput] = React.useState(initialValue);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showVerification, setShowVerification] = React.useState(false);

  React.useEffect(() => {
    setVenmoInput(initialValue);
  }, [initialValue]);

  const handleVerify = () => {
    if (!venmoInput) return;
    setShowVerification(true);
  };

  const handleSave = async () => {
    if (!venmoInput) return;
    
    setIsLoading(true);
    try {
      const currentUser = firebase.auth().currentUser;
      if (currentUser) {
        await firebase.firestore()
          .collection('users')
          .doc(currentUser.uid)
          .update({
            venmoUsername: venmoInput
          });
      }
      
      onSuccess?.(venmoInput);
      onClose();
    } catch (error) {
      console.error('Error updating Venmo username:', error);
      Alert.alert('Error', 'Failed to update Venmo username. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {!showVerification ? (
            <>
              <Text style={styles.modalTitle}>Venmo Username</Text>
              <Text style={styles.modalSubtitle}>Enter your Venmo username (without the @ symbol)</Text>
              
              <TextInput
                style={styles.input}
                value={venmoInput}
                onChangeText={setVenmoInput}
                placeholder="Username"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={onClose}
                  disabled={isLoading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: '#34A853' }]}
                  onPress={handleVerify}
                  disabled={isLoading || !venmoInput}
                >
                  <Text style={styles.saveButtonText}>Verify</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.modalTitle}>Verify Your Venmo Account</Text>
              <Text style={styles.modalSubtitle}>Please confirm this is your Venmo account</Text>
              
              <VenmoLinker recipientId={venmoInput} buttonText="Confirm Account with Venmo" />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowVerification(false)}
                >
                  <Text style={styles.cancelButtonText}>Back</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: '#34A853' }]}
                  onPress={handleSave}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>This is my Venmo account</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  saveButton: {
    backgroundColor: '#34A853',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default VenmoUsernameModal;
