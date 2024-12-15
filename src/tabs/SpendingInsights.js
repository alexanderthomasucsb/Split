import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import firebase from '../../firebaseConfig';
import {PieChart } from 'react-native-chart-kit';

const SpendingInsightsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState(null);
  const [timeframe, setTimeframe] = useState('month'); // 'month', 'quarter', 'year'

  const currentUser = firebase.auth().currentUser;
  const db = firebase.firestore();

  useEffect(() => {
    const fetchSpendingInsights = async () => {
      try {
        if (!currentUser) return;

        // Get current date and calculate time ranges
        const now = new Date();
        let startDate;
        switch (timeframe) {
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'quarter':
            startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
            break;
          case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        }

        // Fetch paid payments for the user within the timeframe
        const paymentsQuery = db.collection('payments')
          .where('userId', '==', currentUser.uid)
          .where('status', '==', 'paid')
          .where('paidAt', '>=', firebase.firestore.Timestamp.fromDate(startDate))
          .orderBy('paidAt', 'desc');

        const paymentsSnapshot = await paymentsQuery.get();

        // Aggregate spending by category
        const categorySpending = {};
        let totalSpending = 0;

        await Promise.all(paymentsSnapshot.docs.map(async (doc) => {
          const payment = doc.data();
          
          // Fetch bill details to get category
          const billDoc = await db.collection('bills').doc(payment.billId).get();
          if (billDoc.exists) {
            const billData = billDoc.data();
            const category = billData.category || 'other';
            
            categorySpending[category] = (categorySpending[category] || 0) + payment.amount;
            totalSpending += payment.amount;
          }
        }));

        // Prepare insights data
        const insights = {
          totalSpending,
          categoryBreakdown: Object.entries(categorySpending)
            .map(([category, amount]) => ({
              name: category,
              amount,
              percentage: ((amount / totalSpending) * 100).toFixed(1),
              color: getCategoryColor(category)
            }))
            .sort((a, b) => b.amount - a.amount),
          recentTransactions: await Promise.all(paymentsSnapshot.docs.slice(0, 5).map(async (doc) => {
            const payment = doc.data();

            const billDoc = await db.collection('bills').doc(payment.billId).get();
            const billTitle = billDoc.exists ? billDoc.data().title : 'Unnamed Bill';

            return {
              id: doc.id,
              title: billTitle,
              amount: payment.amount,
              paidAt: payment.paidAt?.toDate() || new Date(),
            };
          }))
        };

        setInsights(insights);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching spending insights:', error);
        setLoading(false);
      }
    };

    fetchSpendingInsights();
  }, [timeframe]);

  // Helper function to assign colors to categories
  const getCategoryColor = (category) => {
    const categoryColors = {
      'food': '#FF6B6B',
      'utilities': '#4ECDC4',
      'rent': '#45B7D1',
      'entertainment': '#FDCB6E',
      'transportation': '#6C5CE7',
      'other': '#A3CB38'
    };
    return categoryColors[category.toLowerCase()] || '#6C5CE7';
  };

  // Timeframe filter button component
  const TimeframeButton = ({ title, value }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        timeframe === value && styles.filterButtonActive
      ]}
      onPress={() => setTimeframe(value)}
    >
      <Text style={[
        styles.filterButtonText,
        timeframe === value && styles.filterButtonTextActive
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Prepare data for pie chart
  const pieChartData = insights.categoryBreakdown.map(category => ({
    name: category.name,
    population: category.amount,
    color: category.color,
    legendFontColor: '#7F7F7F',
    legendFontSize: 15
  }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Spending Insights</Text>
      </View>

      <View style={styles.filterContainer}>
        <TimeframeButton title="Month" value="month" />
        <TimeframeButton title="Quarter" value="quarter" />
        <TimeframeButton title="Year" value="year" />
      </View>

      <ScrollView>
        {/* Total Spending Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Total Spending</Text>
          <Text style={styles.summaryAmount}>
            ${insights.totalSpending.toFixed(2)}
          </Text>
        </View>

        {/* Category Breakdown Pie Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Spending by Category</Text>
          <PieChart
            data={pieChartData}
            width={Dimensions.get('window').width - 40}
            height={220}
            chartConfig={{
              color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
            }}
            accessor={'population'}
            backgroundColor={'transparent'}
            paddingLeft={'15'}
            center={[10, 0]}
            absolute
          />
        </View>

        {/* Category Breakdown List */}
        <View style={styles.breakdownContainer}>
          <Text style={styles.breakdownTitle}>Category Details</Text>
          {insights.categoryBreakdown.map((category, index) => (
            <View key={index} style={styles.categoryItem}>
              <View 
                style={[
                  styles.categoryColorIndicator, 
                  { backgroundColor: category.color }
                ]} 
              />
              <Text style={styles.categoryName}>{category.name}</Text>
              <Text style={styles.categoryAmount}>
                ${category.amount.toFixed(2)} ({category.percentage}%)
              </Text>
            </View>
          ))}
        </View>

        {/* Recent Transactions */}
        <View style={styles.recentTransactionsContainer}>
          <Text style={styles.recentTransactionsTitle}>Recent Transactions</Text>
          {insights.recentTransactions.map((transaction, index) => (
            <View key={index} style={styles.transactionItem}>
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionTitle}>{transaction.title}</Text>
                <Text style={styles.transactionDate}>
                  {transaction.paidAt.toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.transactionAmount}>
                ${transaction.amount.toFixed(2)}
              </Text>
            </View>
          ))}
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
  summaryContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F7F7F7',
  },
  summaryTitle: {
    fontSize: 16,
    color: '#666',
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  chartContainer: {
    padding: 20,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  breakdownContainer: {
    padding: 20,
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryColorIndicator: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    marginRight: 10,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  recentTransactionsContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ECECEC',
  },
  recentTransactionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  transactionDate: {
    fontSize: 16,
    color: '#666',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SpendingInsightsScreen;