import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import styles from '../styles/CategorySelectorStyles';

const categories = [
  { id: 'food', label: 'Food & Drinks', icon: 'coffee', color: '#F97316' },
  { id: 'transport', label: 'Transportation', icon: 'truck', color: '#3B82F6' },
  { id: 'entertainment', label: 'Entertainment', icon: 'film', color: '#A855F7' },
  { id: 'shopping', label: 'Shopping', icon: 'shopping-bag', color: '#22C55E' },
  { id: 'utilities', label: 'Utilities', icon: 'home', color: '#EAB308' },
  { id: 'health', label: 'Health', icon: 'heart', color: '#EF4444' },
  { id: 'education', label: 'Education', icon: 'book', color: '#6366F1' },
  { id: 'travel', label: 'Travel', icon: 'map', color: '#14B8A6' },
  { id: 'other', label: 'Other', icon: 'grid', color: '#6B7280' },
];

const CategorySelector = ({ 
  showModal, 
  onClose, 
  selectedCategory, 
  onSelectCategory, 
}) => {
  const renderCategoryButton = ({ id, label, icon, color }) => (
    <TouchableOpacity
      key={id}
      style={[
        styles.categoryButton,
        { backgroundColor: color } // Remove the conditional and always use the category color
      ]}
      onPress={() => {
        onSelectCategory(id);
        onClose();
      }}
      activeOpacity={0.7}
    >
      <Feather 
        name={icon} 
        size={28} 
        color="#FFFFFF"  // Always use white for the icon
      />
      <Text 
        style={[
          styles.categoryLabel,
          { color: '#FFFFFF' }  // Always use white for the text
        ]}
        numberOfLines={2}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={showModal}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="x" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.gridContainer}
          >
            {categories.map(category => renderCategoryButton(category))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export { categories };
export default CategorySelector;