import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
const PaymentStatusBar = ({ payments, totalAmount }) => {
  // Calculate total paid amount
  const paidAmount = payments.reduce((sum, payment) => 
    payment.status === 'paid' ? sum + payment.amount : sum, 0
  );
  // Calculate progress percentage
  const progressPercentage = Math.min((paidAmount / totalAmount) * 100, 100);
  return (
    <View style={styles.container}>
      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressBar, 
            { width: `${progressPercentage}%` }
          ]} 
        />
      </View>
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          ${paidAmount.toFixed(2)} of ${totalAmount.toFixed(2)} paid
        </Text>
        <Text style={styles.percentageText}>
          {Math.round(progressPercentage)}%
        </Text>
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#ECECEC',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statsText: {
    fontSize: 14,
    color: '#666',
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
  },
});
export default PaymentStatusBar;