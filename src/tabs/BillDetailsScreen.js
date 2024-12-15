import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  SafeAreaView, 
  ActivityIndicator,
  Image 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import ImageView from "react-native-image-viewing";
import firebase from '../../firebaseConfig';
import { categories } from '../components/CategorySelector';
import PaymentStatusBar from './PaymentStatusBar';


const BillDetailsScreen = ({ route, navigation }) => {
  const { billId } = route.params;
  const [billDetails, setBillDetails] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isImageVisible, setIsImageVisible] = useState(false);
  
  const currentUser = firebase.auth().currentUser;
  const db = firebase.firestore();

  const refreshPayments = async () => {
    try {
      const paymentsSnapshot = await db.collection('payments')
        .where('billId', '==', billId)
        .get();

      const paymentsData = paymentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        amount: doc.data().amount || 0,
        status: doc.data().status || 'pending'
      }));
      
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error refreshing payments:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshPayments();
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const fetchBillDetails = async () => {
      try {
        // Fetch bill details
        const billDoc = await db.collection('bills').doc(billId).get();
        
        if (!billDoc.exists) {
          throw new Error('Bill not found');
        }

        const billData = billDoc.data();
        
        if (!billData) {
          throw new Error('Bill data is empty');
        }

        // Fetch creator details
        let creatorData = {};
        if (billData.createdBy) {
          const creatorDoc = await db.collection('users').doc(billData.createdBy).get();
          creatorData = creatorDoc.data() || {};
        }

        // Fetch all participants' details
        let participants = [];
        if (Array.isArray(billData.participants)) {
          const participantsPromises = billData.participants.map(async (userId) => {
            try {
              const userDoc = await db.collection('users').doc(userId).get();
              return {
                id: userId,
                ...(userDoc.exists ? userDoc.data() : { email: 'Unknown User' })
              };
            } catch (error) {
              console.error(`Error fetching participant ${userId}:`, error);
              return {
                id: userId,
                email: 'Unknown User'
              };
            }
          });

          participants = await Promise.all(participantsPromises);
        }

        // Fetch all payments
        const paymentsSnapshot = await db.collection('payments')
          .where('billId', '==', billId)
          .get();

        const paymentsData = paymentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          amount: doc.data().amount || 0,
          status: doc.data().status || 'pending'
        }));

        // Combine all data
        setBillDetails({
          id: billId,
          ...billData,
          creator: creatorData,
          participants: participants,
          createdAt: billData.createdAt?.toDate() || new Date(),
          amount: billData.amount || 0,
          title: billData.title || 'Untitled Bill',
          description: billData.description || '',
          category: billData.category || 'other',
          receiptItems: billData.receiptItems || [],
        });

        await refreshPayments();
        setLoading(false);
      } catch (error) {
        console.error('Error fetching bill details:', error);
        Alert.alert('Error', 'Failed to load bill details');
        navigation.replace('Main');
      }
    };

    fetchBillDetails();
  }, [billId]);

  const handleMarkAsPaid = async (paymentId) => {
    try {
      await db.collection('payments').doc(paymentId).update({
        status: 'paid',
        paidAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      
      // Refresh payments
      const paymentsSnapshot = await db.collection('payments')
        .where('billId', '==', billId)
        .get();

      const paymentsData = paymentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        amount: doc.data().amount || 0,
        status: doc.data().status || 'pending'
      }));
      
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error updating payment:', error);
      Alert.alert('Error', 'Failed to update payment status');
    }
  };

  const getCategoryDetails = (categoryId) => {
    return categories.find(cat => cat.id === categoryId) || categories.find(cat => cat.id === 'other');
  };

  const calculateOutstandingAmount = () => {
    if (!payments.length) return billDetails.amount;
    
    const paidAmount = payments
      .filter(payment => payment.status === 'paid')
      .reduce((sum, payment) => sum + payment.amount, 0);
    
    return billDetails.amount - paidAmount;
  };

  const isFullyPaid = () => {
    return calculateOutstandingAmount() <= 0;
  };

  const getParticipantName = (userId) => {
    if (!billDetails) return '';
    const participant = billDetails.participants.find(p => p.id === userId);
    if (userId === currentUser.uid) return 'You';
    return participant ? (participant.displayName || participant.email) : 'Unknown User';
  };
  
  const renderReceiptImage = () => {
    if (billDetails?.receiptImage && !imageError) {
      const images = [{ uri: billDetails.receiptImage }];
      
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Receipt Image</Text>
          <TouchableOpacity onPress={() => setIsImageVisible(true)}>
            <Image
              source={{ uri: billDetails.receiptImage }}
              style={styles.receiptImage}
              resizeMode="contain"
              onError={() => setImageError(true)}
            />
            <View style={styles.imageHintContainer}>
              <Feather name="maximize" size={16} color="#666" />
              <Text style={styles.imageHintText}>Tap to view</Text>
            </View>
          </TouchableOpacity>

          <ImageView
            images={images}
            imageIndex={0}
            visible={isImageVisible}
            onRequestClose={() => setIsImageVisible(false)}
            doubleTapToZoomEnabled={true}
            presentationStyle="overFullScreen"
          />
        </View>
      );
    }
    return null;
  };

  const renderPaymentCard = (payment) => {
    const isCurrentUserPayment = payment.userId === currentUser.uid;
    const isPending = payment.status === 'pending';

    return (
      <View 
        key={payment.id} 
        style={[
          styles.paymentCard, 
          { 
            borderLeftColor: payment.status === 'paid' ? '#34C759' : categoryDetails.color
          }
        ]}
      >
        <View style={styles.paymentInfo}>
          <Text style={styles.participantName}>
            {getParticipantName(payment.userId)}
          </Text>
          <Text style={[styles.paymentAmount, { color: categoryDetails.color }]}>
            ${payment.amount.toFixed(2)}
          </Text>
        </View>

        <View style={styles.paymentStatus}>
          <Text style={[
            styles.statusBadge,
            { color: payment.status === 'paid' ? '#34C759' : categoryDetails.color }
          ]}>
            {payment.status.toUpperCase()}
          </Text>
        </View>

        {isCurrentUserPayment && isPending && (
          <View style={styles.paymentButtons}>
            {billDetails.creator?.venmoUsername && (
              <TouchableOpacity
                style={[styles.payButton, { backgroundColor: '#008CFF' }]}
                onPress={() => {
                  navigation.navigate('VenmoPayment', {
                    recipientId: billDetails.creator.venmoUsername,
                    amount: payment.amount,
                    userName: billDetails.creator.displayName || billDetails.creator.email,
                    billTitle: billDetails.title,
                    paymentId: payment.id,
                  });
                }}
              >
                <Text style={styles.payButtonText}>Pay with Venmo</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.payButton, { backgroundColor: '#6C47FF' }]}
              onPress={() => handleMarkAsPaid(payment.id)}
            >
              <Text style={styles.payButtonText}>Mark as Paid</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading || !billDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading bill details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const categoryDetails = getCategoryDetails(billDetails.category);
  const outstandingAmount = calculateOutstandingAmount();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.replace('Main')}
        >
          <Feather name="arrow-left" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bill Details</Text>
      </View>

      <ScrollView 
        style={[styles.content, { backgroundColor: `${categoryDetails.color}10` }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainCard}>
          <View style={styles.categoryIconContainer}>
            <View style={[styles.categoryIcon, { backgroundColor: `${categoryDetails.color}20` }]}>
              <Feather name={categoryDetails.icon} size={24} color={categoryDetails.color} />
            </View>
            <Text style={styles.billTitle}>{billDetails.title}</Text>
          </View>

          <View style={[
            styles.statusBanner,
            { backgroundColor: isFullyPaid() ? '#34C75920' : '#FF3B3020' }
          ]}>
            <Feather 
              name={isFullyPaid() ? "check-circle" : "alert-circle"} 
              size={20} 
              color={isFullyPaid() ? '#34C759' : '#FF3B30'} 
            />
            <Text style={[
              styles.statusText,
              { color: isFullyPaid() ? '#34C759' : '#FF3B30' }
            ]}>
              {isFullyPaid() ? 'Fully Paid' : `Outstanding: $${outstandingAmount.toFixed(2)}`}
            </Text>
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Total Amount</Text>
              <Text style={[styles.detailValue, { color: categoryDetails.color }]}>
                ${billDetails.amount.toFixed(2)}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Created By</Text>
              <Text style={styles.detailValue}>
                {billDetails.creator.displayName || billDetails.creator.email}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>
                {billDetails.createdAt.toLocaleDateString()}
              </Text>
            </View>

            {billDetails.description && (
              <View style={styles.descriptionContainer}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.description}>{billDetails.description}</Text>
              </View>
            )}
          </View>

          <PaymentStatusBar 
            payments={payments}
            totalAmount={billDetails.amount}
          />
        </View>

        {billDetails.receiptItems && billDetails.receiptItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Receipt Items</Text>
            {billDetails.receiptItems.map((item, index) => (
              <View key={index} style={styles.receiptItem}>
                <View style={styles.receiptItemHeader}>
                  <Text style={styles.itemDescription}>
                    {item.description}
                  </Text>
                  <Text style={[styles.itemAmount, { color: categoryDetails.color }]}>
                    ${parseFloat(item.total).toFixed(2)}
                  </Text>
                </View>
                <Text style={styles.itemSharedBy}>
                  Split between: {item.assignments?.length > 0 
                    ? item.assignments.map(userId => getParticipantName(userId)).join(', ')
                    : 'All participants'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {renderReceiptImage()}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payments</Text>
          {payments.map(payment => renderPaymentCard(payment))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
  },
  backButton: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  mainCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  billTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  detailsGrid: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  descriptionContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ECECEC',
  },
  description: {
    fontSize: 16,
    color: '#333',
    marginTop: 4,
  },
  section: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  receiptItem: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  receiptItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  itemSharedBy: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  receiptImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
  },
  paymentCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentStatus: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  payButton: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    height: 35,
    justifyContent: 'center',
  },
  payButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  statusBadge: {
    fontWeight: '600',
    fontSize: 14,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '500',
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BillDetailsScreen;
