import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { InputField } from '@/components/InputField';
import { InsulationTypePicker } from '@/components/InsulationTypePicker';
import InsulationThicknessPicker from '@/components/InsulationThicknessPicker';
import { useStorageContext } from '@/hooks/StorageProvider';
import { BottomNavArrows } from '@/components/BottomNavArrows';

export default function RoomDetailsTab() {
  const { roomData, saveRoomData, miscData, saveMiscData } = useStorageContext();

  const updateRoomData = (field: string, value: string | number) => {
    const newData = { ...roomData, [field]: value };
    console.log('🏠 Updating room data:', field, '=', value);
    saveRoomData(newData);
    // Force immediate re-render by changing a different state
    setTimeout(() => {
      console.log('✅ Room data saved');
    }, 0);
  };

  const handleDimensionChange = (field: 'length' | 'width' | 'height', value: string) => {
    const numValue = parseFloat(value) || 0;
    updateRoomData(field, numValue);
  };

  // Handle unit change with value conversion for dimensions
  const handleDimensionUnitChange = (field: 'length' | 'width' | 'height', newUnit: string, convertedValue: string) => {
    const numValue = parseFloat(convertedValue) || 0;
    // Update both the field value and the unit
    const newData = { ...roomData, [field]: numValue, lengthUnit: newUnit as 'm' | 'ft' };
    saveRoomData(newData);
  };

  // Handle unit change with value conversion for all dimensions at once
  const handleAllDimensionsUnitChange = (newUnit: string, currentField: 'length' | 'width' | 'height', convertedValue: string) => {
    const numValue = parseFloat(convertedValue) || 0;
    const conversionFactor = newUnit === 'ft' ? 3.28084 : 1 / 3.28084;
    
    // Convert all dimensions to the new unit
    const newLength = currentField === 'length' ? numValue : Math.round(roomData.length * (roomData.lengthUnit === newUnit ? 1 : conversionFactor) * 100) / 100;
    const newWidth = currentField === 'width' ? numValue : Math.round(roomData.width * (roomData.lengthUnit === newUnit ? 1 : conversionFactor) * 100) / 100;
    const newHeight = currentField === 'height' ? numValue : Math.round(roomData.height * (roomData.lengthUnit === newUnit ? 1 : conversionFactor) * 100) / 100;
    
    const newData = { 
      ...roomData, 
      length: newLength,
      width: newWidth,
      height: newHeight,
      lengthUnit: newUnit as 'm' | 'ft' 
    };
    saveRoomData(newData);
  };


  const handleHoursChange = (field: 'wallHours' | 'ceilingHours' | 'floorHours', value: string) => {
    const numValue = parseFloat(value) || 0;
    updateRoomData(field, numValue);
  };

  const updateMiscData = (field: string, value: string | number) => {
    const newData = { ...miscData, [field]: value };
    saveMiscData(newData);
  };

  const handleTemperatureChange = (field: 'ambientTemp' | 'roomTemp', value: string) => {
    const numValue = parseFloat(value) || 0;
    updateMiscData(field, numValue);
  };

  // Handle unit change with value conversion for temperatures
  const handleTempUnitChange = (field: 'ambientTemp' | 'roomTemp', newUnit: string, convertedValue: string) => {
    const numValue = parseFloat(convertedValue) || 0;
    const conversionFactor = newUnit === 'F' ? (v: number) => (v * 9/5) + 32 : (v: number) => (v - 32) * 5/9;
    
    // Convert both temperatures to the new unit
    const otherField = field === 'ambientTemp' ? 'roomTemp' : 'ambientTemp';
    const otherValue = miscData[otherField];
    const convertedOtherValue = miscData.tempUnit === newUnit ? otherValue : Math.round(conversionFactor(otherValue) * 100) / 100;
    
    const newData = { 
      ...miscData, 
      [field]: numValue,
      [otherField]: convertedOtherValue,
      tempUnit: newUnit as 'C' | 'F' 
    };
    saveMiscData(newData);
  };

  const handleRHChange = (field: 'ambientRH' | 'insideRoomRH', value: string) => {
    const numValue = parseFloat(value) || 0;
    updateMiscData(field, numValue);
  };

  const handleNumericChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    updateMiscData(field, numValue);
  };


  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Enzo Cool Calc</Text>
            <Text style={styles.subtitle}>Room Details & Transmission Load</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Project Information</Text>

            <InputField
              label="Project Name"
              value={roomData.projectName ?? ''}
              onChangeText={(value) => updateRoomData('projectName', value)}
              placeholder="Coldroom Project"
              keyboardType="default"
            />
          </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Room Dimensions</Text>

          <InputField
            label="Length"
            value={roomData.length.toString()}
            onChangeText={(value) => handleDimensionChange('length', value)}
            unitOptions={['m', 'ft']}
            selectedUnit={roomData.lengthUnit}
            onUnitChange={(unit) => updateRoomData('lengthUnit', unit as 'm' | 'ft')}
            onUnitChangeWithConversion={(newUnit, convertedValue) => handleAllDimensionsUnitChange(newUnit, 'length', convertedValue)}
          />

          <InputField
            label="Width"
            value={roomData.width.toString()}
            onChangeText={(value) => handleDimensionChange('width', value)}
            unitOptions={['m', 'ft']}
            selectedUnit={roomData.lengthUnit}
            onUnitChange={(unit) => updateRoomData('lengthUnit', unit as 'm' | 'ft')}
            onUnitChangeWithConversion={(newUnit, convertedValue) => handleAllDimensionsUnitChange(newUnit, 'width', convertedValue)}
          />

          <InputField
            label="Height"
            value={roomData.height.toString()}
            onChangeText={(value) => handleDimensionChange('height', value)}
            unitOptions={['m', 'ft']}
            selectedUnit={roomData.lengthUnit}
            onUnitChange={(unit) => updateRoomData('lengthUnit', unit as 'm' | 'ft')}
            onUnitChangeWithConversion={(newUnit, convertedValue) => handleAllDimensionsUnitChange(newUnit, 'height', convertedValue)}
          />

        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Temperature Settings</Text>

          <InputField
            label="Ambient Temperature"
            value={miscData.ambientTemp.toString()}
            onChangeText={(value) => handleTemperatureChange('ambientTemp', value)}
            keyboardType="numbers-and-punctuation"
            unitOptions={['C', 'F']}
            selectedUnit={miscData.tempUnit}
            onUnitChange={(unit) => updateMiscData('tempUnit', unit as 'C' | 'F')}
            onUnitChangeWithConversion={(newUnit, convertedValue) => handleTempUnitChange('ambientTemp', newUnit, convertedValue)}
            allowNegative={true}
          />

          <InputField
            label="Room Temperature"
            value={miscData.roomTemp.toString()}
            onChangeText={(value) => handleTemperatureChange('roomTemp', value)}
            keyboardType="numbers-and-punctuation"
            unitOptions={['C', 'F']}
            selectedUnit={miscData.tempUnit}
            onUnitChange={(unit) => updateMiscData('tempUnit', unit as 'C' | 'F')}
            onUnitChangeWithConversion={(newUnit, convertedValue) => handleTempUnitChange('roomTemp', newUnit, convertedValue)}
            allowNegative={true}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compressor Running Hours</Text>

          <InputField
            label="Compressor Running Hours"
            value={miscData.compressorRunningHours?.toString() || '18'}
            onChangeText={(value) => handleNumericChange('compressorRunningHours', value)}
            unit="hrs/day"
            placeholder="18"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Humidity Settings</Text>
          
          <InputField
            label="Ambient Relative Humidity"
            value={miscData.ambientRH.toString()}
            onChangeText={(value) => handleRHChange('ambientRH', value)}
            keyboardType="decimal-pad"
            unit="%"
            placeholder="55"
          />

          <InputField
            label="Inside Room Relative Humidity"
            value={miscData.insideRoomRH.toString()}
            onChangeText={(value) => handleRHChange('insideRoomRH', value)}
            keyboardType="decimal-pad"
            unit="%"
            placeholder="85"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insulation Parameters</Text>

          <Text style={styles.subsectionTitle}>Insulation Type</Text>
          <InsulationTypePicker
            selected={roomData.insulationType}
            onSelect={(type) => updateRoomData('insulationType', type)}
          />

          <Text style={styles.subsectionTitle}>Insulation Thickness</Text>
          <InsulationThicknessPicker
            label="Wall Insulation Thickness"
            value={roomData.wallInsulationThickness}
            onChange={(value) => updateRoomData('wallInsulationThickness', value)}
          />

          <InsulationThicknessPicker
            label="Ceiling Insulation Thickness"
            value={roomData.ceilingInsulationThickness}
            onChange={(value) => updateRoomData('ceilingInsulationThickness', value)}
          />

          <InsulationThicknessPicker
            label="Floor Insulation Thickness"
            value={roomData.floorInsulationThickness}
            onChange={(value) => updateRoomData('floorInsulationThickness', value)}
            allowNone
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transmission Load Parameters</Text>

          <Text style={styles.subsectionTitle}>Hours of Load</Text>
          <InputField
            label="Wall Hours"
            value={roomData.wallHours.toString()}
            onChangeText={(value) => handleHoursChange('wallHours', value)}
            unit="hrs"
          />

          <InputField
            label="Ceiling Hours"
            value={roomData.ceilingHours.toString()}
            onChangeText={(value) => handleHoursChange('ceilingHours', value)}
            unit="hrs"
          />

          <InputField
            label="Floor Hours"
            value={roomData.floorHours.toString()}
            onChangeText={(value) => handleHoursChange('floorHours', value)}
            unit="hrs"
          />
        </View>

        {/* Info note removed for cleaner UI */}

        <BottomNavArrows
          onLeftPress={() => router.push('/(tabs)/results' as any)}
          onRightPress={() => router.push('/(tabs)/product' as any)}
          isFixed={false}
        />
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 8,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 22,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 16,
    letterSpacing: -0.3,
    textAlign: 'left',
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#1e40af',
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
});