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
import { useFreezerStorageContext } from '@/hooks/FreezerStorageProvider';
import { BottomNavArrows } from '@/components/BottomNavArrows';
import DoorOpeningFrequencyPicker from '@/components/DoorOpeningFrequencyPicker';
import AirChangeSection from '@/components/AirChangeSection';
import { calculateInternalVolume, convertLength, convertTemp } from '@/utils/calculations';

export default function FreezerMiscellaneousTab() {
  const { miscData, saveMiscData, roomData } = useFreezerStorageContext();

  const internalVolume = calculateInternalVolume(
    convertLength(roomData.length, roomData.lengthUnit, 'm'),
    convertLength(roomData.width, roomData.lengthUnit, 'm'),
    convertLength(roomData.height, roomData.lengthUnit, 'm'),
    roomData.wallInsulationThickness,
    roomData.ceilingInsulationThickness,
    roomData.floorInsulationThickness,
    roomData.floorFinishThickness ?? 100,
  );

  const updateMiscData = (field: string, value: string | number) => {
    const newData = { ...miscData, [field]: value };
    console.log('🔧 Updating freezer misc data:', field, '=', value);
    saveMiscData(newData);
    setTimeout(() => {
      console.log('✅ Freezer misc data saved');
    }, 0);
  };

  const handleValueChange = (field: string, value: string) => {
    const numericValue = parseFloat(value) || 0;
    updateMiscData(field, numericValue);
  };

  const handleUnitChange = (field: string, unit: string) => {
    updateMiscData(field, unit);
  };

  const handleDoorUnitChange = (unit: string) => {
    const doorUnit = unit as 'mm' | 'm';
    const currentUnit = miscData.doorDimensionUnit || 'mm';
    if (currentUnit === doorUnit) return; // No change needed

    let newWidth = miscData.doorClearOpeningWidth || 900;
    let newHeight = miscData.doorClearOpeningHeight || 1800;

    if (currentUnit === 'mm' && doorUnit === 'm') {
      // Convert mm to m
      newWidth = newWidth / 1000;
      newHeight = newHeight / 1000;
    } else if (currentUnit === 'm' && doorUnit === 'mm') {
      // Convert m to mm
      newWidth = newWidth * 1000;
      newHeight = newHeight * 1000;
    }

    updateMiscData('doorClearOpeningWidth', newWidth);
    updateMiscData('doorClearOpeningHeight', newHeight);
    updateMiscData('doorDimensionUnit', doorUnit);
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Air Change Load</Text>

          <AirChangeSection
            mode={miscData.airChangeMode ?? 'auto'}
            airChangeRate={miscData.airChangeRate}
            enthalpyDiff={miscData.enthalpyDiff}
            hoursOfLoad={miscData.hoursOfLoad}
            internalVolume={internalVolume}
            ambientTempC={convertTemp(miscData.ambientTemp, miscData.tempUnit, 'C')}
            ambientRH={miscData.ambientRH ?? 55}
            roomTempC={convertTemp(miscData.roomTemp, miscData.tempUnit, 'C')}
            roomRH={miscData.insideRoomRH ?? 85}
            onChange={(patch) => saveMiscData({ ...miscData, ...patch })}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Equipment Load</Text>

          <InputField
            label="Fan Motor Rating"
            value={miscData.fanMotorRating.toString()}
            onChangeText={(value) => handleValueChange('fanMotorRating', value)}
            unit="kW"
          />

          <InputField
            label="Fan Quantity"
            value={miscData.fanQuantity.toString()}
            onChangeText={(value) => handleValueChange('fanQuantity', value)}
            unit="units"
          />

          <InputField
            label="Fan Usage Hours"
            value={miscData.fanUsageHours.toString()}
            onChangeText={(value) => handleValueChange('fanUsageHours', value)}
            unit="hrs"
          />

          <InputField
            label="Equipment Power"
            value={(miscData.equipmentPower ?? 0).toString()}
            onChangeText={(value) => handleValueChange('equipmentPower', value)}
            unit="W"
          />

          <InputField
            label="Equipment Usage Hours"
            value={miscData.equipmentUsageHours.toString()}
            onChangeText={(value) => handleValueChange('equipmentUsageHours', value)}
            unit="hrs"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Occupancy Load</Text>

          <InputField
            label="Number of People"
            value={(miscData.numberOfPeople ?? 0).toString()}
            onChangeText={(value) => handleValueChange('numberOfPeople', value)}
            unit="people"
          />

          <InputField
            label="People Usage Factor"
            value={(miscData.peopleUsageFactor ?? 0).toString()}
            onChangeText={(value) => handleValueChange('peopleUsageFactor', value)}
            unit="factor"
          />

          <InputField
            label="Occupancy Usage Hours"
            value={miscData.occupancyUsageHours.toString()}
            onChangeText={(value) => handleValueChange('occupancyUsageHours', value)}
            unit="hrs"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lighting Load</Text>

          <InputField
            label="Light Power"
            value={(miscData.lightPowerKw ?? 0).toString()}
            onChangeText={(value) => handleValueChange('lightPowerKw', value)}
            unit="kW"
          />

          <InputField
            label="Light Usage Hours"
            value={miscData.lightUsageHours.toString()}
            onChangeText={(value) => handleValueChange('lightUsageHours', value)}
            unit="hrs"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Heater Loads</Text>

          <Text style={styles.subsectionTitle}>Peripheral Heaters</Text>
          <InputField
            label="Heater Power"
            value={(miscData.peripheralHeaterPower ?? 0).toString()}
            onChangeText={(value) => handleValueChange('peripheralHeaterPower', value)}
            unit="kW"
          />

          <InputField
            label="Number of Heaters"
            value={(miscData.peripheralHeaterQuantity ?? 0).toString()}
            onChangeText={(value) => handleValueChange('peripheralHeaterQuantity', value)}
            unit="units"
          />

          <Text style={styles.subsectionTitle}>Door Heaters</Text>
          <InputField
            label="Door Heater Power"
            value={(miscData.doorHeaterPower ?? 0).toString()}
            onChangeText={(value) => handleValueChange('doorHeaterPower', value)}
            unit="kW"
          />

          <InputField
            label="Number of Doors"
            value={miscData.doorHeaterQuantity.toString()}
            onChangeText={(value) => handleValueChange('doorHeaterQuantity', value)}
            unit="units"
          />

          <Text style={styles.subsectionTitle}>Tray Heaters</Text>
          <InputField
            label="Tray Heater Power"
            value={(miscData.trayHeaterPower ?? 0).toString()}
            onChangeText={(value) => handleValueChange('trayHeaterPower', value)}
            unit="kW"
          />

          <InputField
            label="Number of Trays"
            value={(miscData.trayHeaterQuantity ?? 0).toString()}
            onChangeText={(value) => handleValueChange('trayHeaterQuantity', value)}
            unit="units"
          />

          <Text style={styles.subsectionTitle}>Drain Heaters</Text>
          <InputField
            label="Drain Heater Power"
            value={(miscData.drainHeaterPower ?? 0).toString()}
            onChangeText={(value) => handleValueChange('drainHeaterPower', value)}
            unit="kW"
          />

          <InputField
            label="Number of Drains"
            value={(miscData.drainHeaterQuantity ?? 0).toString()}
            onChangeText={(value) => handleValueChange('drainHeaterQuantity', value)}
            unit="units"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Door Clear Opening</Text>

          <InputField
            label="Door Width"
            value={miscData.doorClearOpeningWidth.toString()}
            onChangeText={(value) => handleValueChange('doorClearOpeningWidth', value)}
            unitOptions={['mm', 'm']}
            selectedUnit={miscData.doorDimensionUnit || 'mm'}
            onUnitChange={handleDoorUnitChange}
          />

          <InputField
            label="Door Height"
            value={miscData.doorClearOpeningHeight.toString()}
            onChangeText={(value) => handleValueChange('doorClearOpeningHeight', value)}
            unitOptions={['mm', 'm']}
            selectedUnit={miscData.doorDimensionUnit || 'mm'}
            onUnitChange={handleDoorUnitChange}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compressor Air Load</Text>

          <InputField
            label="Compressor Power"
            value={miscData.compressorPowerKW?.toString() || '0'}
            onChangeText={(value) => handleValueChange('compressorPowerKW', value)}
            unit="kW"
          />

          <InputField
            label="Compressor Running Hours"
            value={miscData.compressorAirRunningHours?.toString() || '0'}
            onChangeText={(value) => handleValueChange('compressorAirRunningHours', value)}
            unit="hrs/day"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety Factor</Text>

          <InputField
            label="Safety Factor"
            value={miscData.capacityIncludingSafety.toString()}
            onChangeText={(value) => handleValueChange('capacityIncludingSafety', value)}
            unit="%"
          />
        </View>

        {/* NEW: Door Opening Frequency */}
        <View style={styles.section}>
          <DoorOpeningFrequencyPicker
            value={miscData.doorOpeningFrequency || 'low'}
            onChange={(value) => updateMiscData('doorOpeningFrequency', value)}
          />
          
          <Text style={styles.infoText}>
            💡 Frequent door openings increase infiltration load. The adjustment is applied to the final capacity after the safety factor.
          </Text>
        </View>

        <BottomNavArrows
          onLeftPress={() => router.push('/(freezer)/product' as any)}
          onRightPress={() => router.push('/(freezer)/results' as any)}
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
