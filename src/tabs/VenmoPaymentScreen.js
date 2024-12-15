import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, TouchableOpacity, View, Text, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { Feather } from '@expo/vector-icons';
import firebase from '../../firebaseConfig';

const VenmoPaymentScreen = ({ navigation, route }) => {
  const { recipientId, amount, userName, billTitle, paymentId } = route.params;
  const encodedBillTitle = encodeURIComponent(billTitle);
  const paymentUrl = `https://venmo.com/?txn=pay&audience=private&recipients=${recipientId}&amount=${amount}&note=${encodedBillTitle}`;
  const accountUrl = `https://venmo.com/${recipientId}`;
  const [webUrl, setWebUrl] = useState(paymentUrl);
  const [hasAttemptedPayment, setHasAttemptedPayment] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleMarkAsPaid = async () => {
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) return;

    try {
      const db = firebase.firestore();
       await db.collection('payments').doc(paymentId).update({
        status: 'paid',
        paidAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

        Alert.alert(
            'Success',
            'Payment marked as completed',
            [{ text: 'Go back to Split', onPress: () => navigation.goBack() }]
        );
    } catch (error) {
      console.error('Error marking payment as paid:', error);
      Alert.alert('Error', 'Failed to mark payment as paid');
    }
  };

  const handleLoadError = () => {
    setWebUrl(accountUrl);
  };

  const handleNavigationStateChange = (navState) => {
    //console.log('Navigation state:', navState.url);
    
    if (attempts > 50) {
      setWebUrl(accountUrl);
      return;
    }

    if (navState.url.includes('venmo://') || 
        (hasAttemptedPayment && (
          navState.url === paymentUrl || 
          navState.url.includes('account.venmo.com')
        ))) {
      setHasAttemptedPayment(true);
      setWebUrl(accountUrl);
    } else if (navState.url === paymentUrl) {
      setAttempts(prev => prev + 1);
      setHasAttemptedPayment(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="#6C47FF" />
          <Text style={styles.headerTitle}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.amountContainer}>
        <View style={styles.paymentDetails}>
          <Text style={styles.amountLabel}>Pay: </Text>
          <Text style={styles.amountValue}>${amount.toFixed(2)}</Text>
          <Text style={styles.amountLabel}> to </Text>
          <Text style={styles.recipientText}>{userName}</Text>
          <Text style={styles.amountLabel}> for </Text>
          <Text style={styles.amountLabel}><Text style={styles.boldText}>{billTitle}</Text></Text>
        </View>
      </View>

      <WebView
        source={{ uri: webUrl }}
        style={styles.webview}
        startInLoadingState={true}
        onError={handleLoadError}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={(request) => {
          return request.url.startsWith('https://');
        }}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.markAsPaidButton}
          onPress={handleMarkAsPaid}
        >
          <Text style={styles.markAsPaidButtonText}>Mark as Paid</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#6C47FF',
  },
  amountContainer: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    alignItems: 'center',
  },
  paymentDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  amountLabel: {
    fontSize: 14,
    color: '#666666',
  },
  amountValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00B386',
  },
  recipientText: {
    fontSize: 14,
    color: '#6C47FF',
  },
  webview: {
    flex: 1,
  },
  boldText: {
    fontWeight: 'bold',
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  markAsPaidButton: {
    backgroundColor: '#6C47FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  markAsPaidButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default VenmoPaymentScreen;
