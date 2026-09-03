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
import { useStorageContext } from '@/hooks/StorageProvider';
import { BottomNavArrows } from '@/components/BottomNavArrows';
import DoorOpeningFrequencyPicker from '@/components/DoorOpeningFrequencyPicker';

export default function MiscellaneousTab() {
  const { miscData, saveMiscData } = useStorageContext();

  const updateMiscData = (field: string, value: string | number) => {
    const newData = { ...miscData, [field]: value };
    console.log('⚙️ Updating misc data:', field, '=', value);
    saveMiscData(newData);
    setTimeout(() => {
      console.log('✅ Misc data saved');
    }, 0);
  };

  const handleNumericChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    updateMiscData(field, numValue);
  };

  const handleDoorUnitChange = (unit: string) => {
    const doorUnit = unit as 'mm' | 'm';
    const currentUnit = miscData.doorDimensionUnit || 'mm';
    if (currentUnit === doorUnit) return; // No change needed

    let newWidth = miscData.doorClearOpeningWidth || 900;
    let newHeight = miscData.doorClearOpeningHeight || 2000;

    if (currentUnit === 'mm' && doorUnit === 'm') {
      // Convert mm to m
      newWidth = Math.round((newWidth / 1000) * 1000) / 1000;
      newHeight = Math.round((newHeight / 1000) * 1000) / 1000;
    } else if (currentUnit === 'm' && doorUnit === 'mm') {
      // Convert m to mm
      newWidth = Math.round(newWidth * 1000);
      newHeight = Math.round(newHeight * 1000);
    }

    // Update all values at once to avoid race conditions
    const newData = {
      ...miscData,
      doorClearOpeningWidth: newWidth,
      doorClearOpeningHeight: newHeight,
      doorDimensionUnit: doorUnit,
    };
    saveMiscData(newData);
  };

  // Handle door dimension unit change with conversion
  const handleDoorDimensionUnitChange = (field: 'doorClearOpeningWidth' | 'doorClearOpeningHeight', newUnit: string, convertedValue: string) => {
    const doorUnit = newUnit as 'mm' | 'm';
    const currentUnit = miscData.doorDimensionUnit || 'mm';
    if (currentUnit === doorUnit) return;

    const numValue = parseFloat(convertedValue) || 0;
    const otherField = field === 'doorClearOpeningWidth' ? 'doorClearOpeningHeight' : 'doorClearOpeningWidth';
    let otherValue = miscData[otherField] || (otherField === 'doorClearOpeningWidth' ? 900 : 2000);

    // Convert the other field value
    if (currentUnit === 'mm' && doorUnit === 'm') {
      otherValue = Math.round((otherValue / 1000) * 1000) / 1000;
    } else if (currentUnit === 'm' && doorUnit === 'mm') {
      otherValue = Math.round(otherValue * 1000);
    }

    // Update all values at once
    const newData = {
      ...miscData,
      [field]: numValue,
      [otherField]: otherValue,
      doorDimensionUnit: doorUnit,
    };
    saveMiscData(newData);
  };

  // Calculate air change load (matching Excel formula exactly)
  const calculateAirChangeLoad = () => {
    const { airChangeRate = 3.4, enthalpyDiff = 0.10, hoursOfLoad = 20 } = miscData;
    // Excel: =Air change rate * Enthalpy diff * Hours of load / 1000
    return (airChangeRate * enthalpyDiff * hoursOfLoad) / 1000;
  };

  // Calculate equipment load (matching Excel)
  const calculateEquipmentLoad = () => {
    const { fanMotorRating = 0.37, equipmentQuantity = 3, equipmentUsageHours = 8 } = miscData;
    // Excel: =Fan Motor Rating (kW) * Quantity * Usage Hrs / 24
    return (fanMotorRating * equipmentQuantity * equipmentUsageHours) / 24;
  };

  // Calculate occupancy load (matching Excel)  
  const calculateOccupancyLoad = () => {
    const { occupancyCount = 1.0, occupancyHeatEquiv = 275, occupancyUsageHours = 20 } = miscData;
    // Excel: =No of people * Heat per person (W) * Usage hrs / (24 * 1000)
    return (occupancyCount * occupancyHeatEquiv * occupancyUsageHours) / (24 * 1000);
  };

  // Calculate light load (matching Excel)
  const calculateLightLoad = () => {
    const { lightPower = 70, lightUsageHours = 20 } = miscData;
    // Excel: =Light power (W) * Usage hrs / (24 * 1000)
    return (lightPower * lightUsageHours) / (24 * 1000);
  };

  // Calculate door heater load (matching Excel)
  const calculateDoorHeaterLoad = () => {
    const { doorClearOpeningWidth = 900, doorClearOpeningHeight = 2000, doorHeaterQuantity = 1, doorHeaterUsageHours = 20 } = miscData;
    // Excel: =(((D62+E62)*2)/1000)*0.025*D33*3600*F33
    // Door perimeter = 2 * (width + height) in mm, convert to meters, multiply by 0.025 kW/m
    const doorPerimeter = ((doorClearOpeningWidth + doorClearOpeningHeight) * 2) / 1000; // Convert mm to m
    const doorHeaterCapacity = doorPerimeter * 0.025; // Excel formula: 0.025 kW per meter of door perimeter
    return (doorHeaterCapacity * doorHeaterQuantity * doorHeaterUsageHours) / 24;
  };

  // Calculate total heater load (continuous operation)
  const calculateHeaterLoad = () => {
    const {
      peripheralHeaters = 1.5, peripheralHeatersQuantity = 8,
      doorHeaters = 0.27, doorHeatersQuantity = 8,
      trayHeaters = 2.2, trayHeatersQuantity = 1,
      drainHeaters = 0.04, drainHeatersQuantity = 1
    } = miscData;

    const peripheralLoad = (peripheralHeaters * peripheralHeatersQuantity) / 1000;
    const doorLoad = (doorHeaters * doorHeatersQuantity) / 1000;
    const trayLoad = (trayHeaters * trayHeatersQuantity) / 1000;
    const drainLoad = ((drainHeaters || 0) * drainHeatersQuantity) / 1000;

    return peripheralLoad + doorLoad + trayLoad + drainLoad;
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
        <View style={styles.header}>
          <Text style={styles.title}>Enzo Cool Calc</Text>
          <Text style={styles.subtitle}>Miscellaneous Loads & Equipment</Text>
        </View>

        {/* Air Change Load */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Air Change Load</Text>

          <InputField
            label="Air Change Rate"
            value={miscData.airChangeRate?.toString() || '3.4'}
            onChangeText={(value) => handleNumericChange('airChangeRate', value)}
            unit="L/S"
          />

          <InputField
            label="Enthalpy Difference"
            value={miscData.enthalpyDiff?.toString() || '0.10'}
            onChangeText={(value) => handleNumericChange('enthalpyDiff', value)}
            unit="kJ/L"
          />

          <InputField
            label="Hours of Load"
            value={miscData.hoursOfLoad?.toString() || '20'}
            onChangeText={(value) => handleNumericChange('hoursOfLoad', value)}
            unit="hrs"
          />

        </View>

        {/* Equipment Load */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equipment Load</Text>

          <InputField
            label="Fan Motor Rating"
            value={miscData.fanMotorRating?.toString() || '0.25'}
            onChangeText={(value) => handleNumericChange('fanMotorRating', value)}
            unit="kW"
          />

          <InputField
            label="Quantity"
            value={miscData.fanQuantity?.toString() || '1'}
            onChangeText={(value) => handleNumericChange('fanQuantity', value)}
          />

          <InputField
            label="Usage Hours"
            value={miscData.equipmentUsageHours?.toString() || '20'}
            onChangeText={(value) => handleNumericChange('equipmentUsageHours', value)}
            unit="hrs"
          />

        </View>

        {/* Occupancy Load */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Occupancy Load</Text>

          <InputField
            label="Number of People"
            value={miscData.occupancyCount?.toString() || '1.0'}
            onChangeText={(value) => handleNumericChange('occupancyCount', value)}
          />

          <InputField
            label="Heat per Person"
            value={miscData.occupancyHeatEquiv?.toString() || '0.275'}
            onChangeText={(value) => handleNumericChange('occupancyHeatEquiv', value)}
            unit="kW"
          />

          <InputField
            label="Usage Hours"
            value={miscData.occupancyUsageHours?.toString() || '20'}
            onChangeText={(value) => handleNumericChange('occupancyUsageHours', value)}
            unit="hrs"
          />

        </View>

        {/* Lighting Load */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lighting Load</Text>

          <InputField
            label="Light Power"
            value={miscData.lightPower?.toString() || '70'}
            onChangeText={(value) => handleNumericChange('lightPower', value)}
            unit="W"
          />

          <InputField
            label="Usage Hours"
            value={miscData.lightUsageHours?.toString() || '20'}
            onChangeText={(value) => handleNumericChange('lightUsageHours', value)}
            unit="hrs"
          />

        </View>

        {/* Heater Loads */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Heater Loads</Text>

          <InputField
            label="Door Heater Quantity"
            value={miscData.doorHeaterQuantity?.toString() || '1'}
            onChangeText={(value) => handleNumericChange('doorHeaterQuantity', value)}
            unit="doors"
          />

          <InputField
            label="Door Heater Usage Hours"
            value={miscData.doorHeaterUsageHours?.toString() || '20'}
            onChangeText={(value) => handleNumericChange('doorHeaterUsageHours', value)}
            unit="hrs"
          />

        </View>

        {/* Additional Parameters - Only Used Ones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Parameters</Text>

          <InputField
            label="Door Clear Opening Width"
            value={miscData.doorClearOpeningWidth?.toString() || '900'}
            onChangeText={(value) => handleNumericChange('doorClearOpeningWidth', value)}
            unitOptions={['mm', 'm']}
            selectedUnit={miscData.doorDimensionUnit || 'mm'}
            onUnitChange={handleDoorUnitChange}
            onUnitChangeWithConversion={(newUnit, convertedValue) => handleDoorDimensionUnitChange('doorClearOpeningWidth', newUnit, convertedValue)}
          />

          <InputField
            label="Door Clear Opening Height"
            value={miscData.doorClearOpeningHeight?.toString() || '2000'}
            onChangeText={(value) => handleNumericChange('doorClearOpeningHeight', value)}
            unitOptions={['mm', 'm']}
            selectedUnit={miscData.doorDimensionUnit || 'mm'}
            onUnitChange={handleDoorUnitChange}
            onUnitChangeWithConversion={(newUnit, convertedValue) => handleDoorDimensionUnitChange('doorClearOpeningHeight', newUnit, convertedValue)}
          />
        </View>

        {/* Door Opening Frequency */}
        <View style={styles.section}>
          <DoorOpeningFrequencyPicker
            value={miscData.doorOpeningFrequency || 'low'}
            onChange={(value) => updateMiscData('doorOpeningFrequency', value)}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety Factor</Text>

          <InputField
            label="Safety Factor"
            value={miscData.capacityIncludingSafety?.toString() || '20'}
            onChangeText={(value) => handleNumericChange('capacityIncludingSafety', value)}
            unit="%"
          />
        </View>

        <BottomNavArrows
          onLeftPress={() => router.push('/(tabs)/product' as any)}
          onRightPress={() => router.push('/(tabs)/results' as any)}
          isFixed={false}
        />
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
    paddingHorizontal: 16,
  },
  header: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 16,
    textAlign: 'left',
  },
  infoText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginTop: 8,
    fontStyle: 'italic',
  },
});