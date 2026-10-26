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
import { useFreezerStorageContext } from '@/hooks/FreezerStorageProvider';
import { BottomNavArrows } from '@/components/BottomNavArrows';

export default function FreezerRoomDetailsTab() {
  const { roomData, saveRoomData, miscData, saveMiscData } = useFreezerStorageContext();

  const updateRoomData = (field: string, value: string | number) => {
    const newData = { ...roomData, [field]: value };
    console.log('🏠 Updating freezer room data:', field, '=', value);
    saveRoomData(newData);
    // Force immediate re-render by changing a different state
    setTimeout(() => {
      console.log('✅ Freezer room data saved');
    }, 0);
  };

  const handleDimensionChange = (field: 'length' | 'width' | 'height', value: string) => {
    const numValue = parseFloat(value) || 0;
    updateRoomData(field, numValue);
  };


  const handleHoursChange = (field: 'wallHours' | 'ceilingHours' | 'floorHours', value: string) => {
    const numValue = parseFloat(value) || 0;
    updateRoomData(field, numValue);
  };

  const handleInsulationChange = (field: 'wallInsulationThickness' | 'ceilingInsulationThickness' | 'floorInsulationThickness', value: string) => {
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
            <Text style={styles.subtitle}>Freezer Room Details & Transmission Load</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Project Information</Text>

            <InputField
              label="Project Name"
              value={roomData.projectName ?? ''}
              onChangeText={(value) => updateRoomData('projectName', value)}
              placeholder="Freezer Project"
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
          />

          <InputField
            label="Width"
            value={roomData.width.toString()}
            onChangeText={(value) => handleDimensionChange('width', value)}
            unitOptions={['m', 'ft']}
            selectedUnit={roomData.lengthUnit}
            onUnitChange={(unit) => updateRoomData('lengthUnit', unit as 'm' | 'ft')}
          />

          <InputField
            label="Height"
            value={roomData.height.toString()}
            onChangeText={(value) => handleDimensionChange('height', value)}
            unitOptions={['m', 'ft']}
            selectedUnit={roomData.lengthUnit}
            onUnitChange={(unit) => updateRoomData('lengthUnit', unit as 'm' | 'ft')}
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
            allowNegative={true}
          />

          <InputField
            label="Freezer Room Temperature"
            value={miscData.roomTemp.toString()}
            onChangeText={(value) => handleTemperatureChange('roomTemp', value)}
            keyboardType="numbers-and-punctuation"
            unitOptions={['C', 'F']}
            selectedUnit={miscData.tempUnit}
            onUnitChange={(unit) => updateMiscData('tempUnit', unit as 'C' | 'F')}
            allowNegative={true}
          />

          <InputField
            label="Compressor Running Hours"
            value={(miscData.compressorRunningHours ?? 18).toString()}
            onChangeText={(value) => updateMiscData('compressorRunningHours', parseFloat(value) || 0)}
            unit="hrs/day"
          />

          <InputField
            label="Ambient RH"
            value={(miscData.ambientRH ?? 55).toString()}
            onChangeText={(value) => updateMiscData('ambientRH', parseFloat(value) || 0)}
            unit="%"
          />

          <InputField
            label="Inside Room RH"
            value={(miscData.insideRoomRH ?? 85).toString()}
            onChangeText={(value) => updateMiscData('insideRoomRH', parseFloat(value) || 0)}
            unit="%"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insulation Parameters</Text>

          <Text style={styles.subsectionTitle}>Insulation Type</Text>
          <InsulationTypePicker
            selected={roomData.insulationType}
            onSelect={(type) => updateRoomData('insulationType', type)}
          />

          <Text style={styles.subsectionTitle}>Insulation Thickness (mm)</Text>
          <InputField
            label="Wall Insulation Thickness"
            value={roomData.wallInsulationThickness.toString()}
            onChangeText={(value) => handleInsulationChange('wallInsulationThickness', value)}
            unit="mm"
          />

          <InputField
            label="Ceiling Insulation Thickness"
            value={roomData.ceilingInsulationThickness.toString()}
            onChangeText={(value) => handleInsulationChange('ceilingInsulationThickness', value)}
            unit="mm"
          />

          <InputField
            label="Floor Insulation Thickness"
            value={roomData.floorInsulationThickness.toString()}
            onChangeText={(value) => handleInsulationChange('floorInsulationThickness', value)}
            unit="mm"
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
          onLeftPress={() => router.push('/(freezer)/results' as any)}
          onRightPress={() => router.push('/(freezer)/product' as any)}
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
