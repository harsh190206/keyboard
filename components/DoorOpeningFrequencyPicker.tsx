import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DoorOpeningFrequencyPickerProps {
  value: 'low' | 'medium' | 'high';
  onChange: (value: 'low' | 'medium' | 'high') => void;
}

interface FrequencyOption {
  value: 'low' | 'medium' | 'high';
  label: string;
}

const FREQUENCY_OPTIONS: FrequencyOption[] = [
  { value: 'low', label: 'Low (air changes × 1.0)' },
  { value: 'medium', label: 'Medium (air changes × 1.5)' },
  { value: 'high', label: 'High (air changes × 2.0)' },
];

/**
 * DoorOpeningFrequencyPicker Component
 * 
 * Allows user to select door opening frequency level, which multiplies the air changes per 24 h:
 * - Low: x1.0
 * - Medium: x1.5
 * - High: x2.0
 */
export default function DoorOpeningFrequencyPicker({ value, onChange }: DoorOpeningFrequencyPickerProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = FREQUENCY_OPTIONS.find(opt => opt.value === value) || FREQUENCY_OPTIONS[0];

  const handleSelect = (option: FrequencyOption) => {
    onChange(option.value);
    setModalVisible(false);
  };

  const renderItem = ({ item }: { item: FrequencyOption }) => (
    <TouchableOpacity
      style={[
        styles.option,
        item.value === value && styles.selectedOption
      ]}
      onPress={() => handleSelect(item)}
    >
      <Text style={[
        styles.optionText,
        item.value === value && styles.selectedOptionText
      ]}>
        {item.label}
      </Text>
      {item.value === value && (
        <Ionicons name="checkmark" size={20} color="#2563eb" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Door Opening Frequency</Text>
      
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.selectorText}>{selectedOption.label}</Text>
        <Ionicons name="chevron-down" size={20} color="#6b7280" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Door Opening Frequency</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={FREQUENCY_OPTIONS}
              renderItem={renderItem}
              keyExtractor={(item) => item.value}
              style={styles.optionsList}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectorText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e40af',
  },
  closeButton: {
    padding: 4,
  },
  optionsList: {
    maxHeight: 400,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
  },
  selectedOption: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  selectedOptionText: {
    color: '#1e40af',
  },
});
