import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import firebase from '../../firebaseConfig';
import BillCard from '../components/BillCard';

const PastBillsScreen = ({ navigation }) => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'created', 'received'
  const currentUser = firebase.auth().currentUser;
  const db = firebase.firestore();

  useEffect(() => {
    if (!currentUser) return;

    const fetchBills = async () => {
      try {
        // Use the existing index (userId + createdAt)
        const paymentsQuery = db.collection('payments')
          .where('userId', '==', currentUser.uid)
          .orderBy('createdAt', 'desc');

        const paymentsSnapshot = await paymentsQuery.get();

        // Filter for paid status in memory
        const paidPayments = paymentsSnapshot.docs.filter(doc => 
          doc.data().status === 'paid'
        );

        const billsPromises = paidPayments.map(async doc => {
          try {
            const payment = doc.data();
            
            // Fetch the associated bill details
            const billDoc = await db.collection('bills').doc(payment.billId).get();
            
            if (!billDoc.exists) {
              console.warn(`Bill document ${payment.billId} not found`);
              return null;
            }
            
            const billData = billDoc.data();
            
            // Fetch creator details
            const creatorDoc = await db.collection('users').doc(billData.createdBy).get();
            
            if (!creatorDoc.exists) {
              console.warn(`Creator document ${billData.createdBy} not found`);
              return null;
            }
            
            const creatorData = creatorDoc.data();

            return {
              id: doc.id,
              billId: payment.billId,
              amount: payment.amount,
              status: payment.status,
              paidAt: payment.paidAt?.toDate() || payment.createdAt?.toDate() || new Date(),
              billTitle: billData.title || 'Untitled Bill',
              billDescription: billData.description || '',
              category: billData.category || 'other',
              createdAt: billData.createdAt?.toDate() || new Date(),
              isCreator: billData.createdBy === currentUser.uid,
              creatorName: billData.createdBy === currentUser.uid ? 'you' : (creatorData.displayName || creatorData.email),
              totalAmount: billData.amount,
            };
          } catch (error) {
            console.error('Error processing bill:', error);
            return null;
          }
        });

        const billsData = await Promise.all(billsPromises);
        // Filter out any null values from failed document fetches
        const validBills = billsData.filter(bill => bill !== null);
        setBills(validBills);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching past bills:', error);
        Alert.alert(
          'Error',
          'Failed to load past bills. Please try again later.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
        setLoading(false);
      }
    };

    fetchBills();
  }, []);

  const filteredBills = bills.filter(bill => {
    if (filter === 'created') return bill.isCreator;
    if (filter === 'received') return !bill.isCreator;
    return true;
  });

  const FilterButton = ({ title, value }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === value && styles.filterButtonActive
      ]}
      onPress={() => setFilter(value)}
    >
      <Text style={[
        styles.filterButtonText,
        filter === value && styles.filterButtonTextActive
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderBill = ({ item }) => (
    <BillCard
      item={item}
      currentUser={currentUser}
      onPress={() => navigation.navigate('BillDetails', { billId: item.billId })}
    />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Past Bills</Text>
      </View>

      <View style={styles.filterContainer}>
        <FilterButton title="All Bills" value="all" />
        <FilterButton title="Created" value="created" />
        <FilterButton title="Received" value="received" />
      </View>

      <FlatList
        data={filteredBills}
        renderItem={renderBill}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="file-text" size={48} color="#666" />
            <Text style={styles.emptyText}>No past bills found</Text>
          </View>
        }
      />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
  },
  backButton: {
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEC',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F5F5F5',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
});

export default PastBillsScreen;