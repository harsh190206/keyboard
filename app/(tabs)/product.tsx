import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { InputField } from '@/components/InputField';
import { ProductPicker } from '@/components/ProductPicker';
import { PRODUCT_PRESET_MAP, estimateLatentHeat } from '@/data/products';
import { calculateInternalVolume, calculateMaximumStorage, convertLength, convertMass, convertTemp, resolveRespirationHeat } from '@/utils/calculations';
import { getRespirationHeat, hasRespirationData } from '@/data/respiration';
import { useStorageContext } from '@/hooks/StorageProvider';
import { BottomNavArrows } from '@/components/BottomNavArrows';

export default function ProductTab() {
  const { productData, saveProductData, roomData, miscData } = useStorageContext();

  // Respiration heat: table value at the room temperature unless the user enters a value
  const roomTempC = convertTemp(miscData.roomTemp, miscData.tempUnit, 'C');
  const respiration = resolveRespirationHeat(productData, roomTempC);
  const productHasRespirationTable = hasRespirationData(productData.productName);

  // Storage capacity (Excel D63/D64): internal volume x gross storage density
  const internalVolume = calculateInternalVolume(
    convertLength(roomData.length, roomData.lengthUnit, 'm'),
    convertLength(roomData.width, roomData.lengthUnit, 'm'),
    convertLength(roomData.height, roomData.lengthUnit, 'm'),
    roomData.wallInsulationThickness,
    roomData.ceilingInsulationThickness,
    roomData.floorInsulationThickness,
    roomData.floorFinishThickness ?? 100,
  );
  const storageDensity = productData.storageDensity ?? 8;
  const maximumStorageKg = calculateMaximumStorage(internalVolume, storageDensity);
  const totalCapacityKg = convertMass(productData.massBeforeFreezing, productData.massUnit, 'kg');
  const exceedsStorage = maximumStorageKg > 0 && totalCapacityKg > maximumStorageKg;
  const latentHeat =
    productData.latentHeatOfFusion ??
    estimateLatentHeat(productData.productName, productData.cpAboveFreezing);

  const updateProductData = (field: string, value: string | number) => {
    const newData = { ...productData, [field]: value };
    console.log('📦 Updating product data:', field, '=', value);
    saveProductData(newData);
    setTimeout(() => {
      console.log('✅ Product data saved');
    }, 0);
  };

  const handleNumericChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    updateProductData(field, numValue);
  };

  // Handle temperature unit change with conversion for all temperature fields
  const handleTempUnitChange = (field: string, newUnit: string, convertedValue: string) => {
    const numValue = parseFloat(convertedValue) || 0;
    const conversionFactor = newUnit === '°F' || newUnit === 'F' 
      ? (v: number) => (v * 9/5) + 32 
      : (v: number) => (v - 32) * 5/9;
    
    const currentUnit = productData.tempUnit;
    const needsConversion = (currentUnit === 'C' && (newUnit === '°F' || newUnit === 'F')) || 
                            (currentUnit === 'F' && (newUnit === '°C' || newUnit === 'C'));
    
    // Determine which fields need conversion
    const newEnteringTemp = field === 'enteringTemp' ? numValue : 
      (needsConversion ? Math.round(conversionFactor(productData.enteringTemp || 30) * 100) / 100 : productData.enteringTemp);
    const newFinalTemp = field === 'finalTemp' ? numValue : 
      (needsConversion ? Math.round(conversionFactor(productData.finalTemp || 4) * 100) / 100 : productData.finalTemp);
    const newFreezingPoint = field === 'freezingPoint' ? numValue :
      (needsConversion && productData.freezingPoint !== undefined ? Math.round(conversionFactor(productData.freezingPoint) * 100) / 100 : productData.freezingPoint);
    
    const newData = { 
      ...productData, 
      enteringTemp: newEnteringTemp,
      finalTemp: newFinalTemp,
      freezingPoint: newFreezingPoint,
      tempUnit: newUnit === '°F' || newUnit === 'F' ? 'F' : 'C'
    };
    saveProductData(newData);
  };

  // Handle mass unit change with conversion
  const handleMassUnitChange = (newUnit: string, convertedValue: string) => {
    const numValue = parseFloat(convertedValue) || 0;
    const newData = { 
      ...productData, 
      massBeforeFreezing: numValue,
      massUnit: newUnit as 'kg' | 'lbs'
    };
    saveProductData(newData);
  };

  const handleSelectProduct = (name: string) => {
    const preset = PRODUCT_PRESET_MAP[name];
    if (!preset) return;
    const next = {
      ...productData,
      productName: name,
      // Auto-fill all preset values including new fields
      cpAboveFreezing: preset.cpAboveFreezing,
      cpBelowFreezing: preset.cpBelowFreezing,
      freezingPoint: preset.freezingPoint,
      latentHeatOfFusion: estimateLatentHeat(name, preset.cpAboveFreezing),
      watts: getRespirationHeat(name, roomTempC) ?? preset.respirationWattsPerTonne,
      respirationAuto: true,
      // If user changes afterwards, they can still edit fields
      overridePreset: false,
    };
    console.log('🍏 Selected product preset:', name, preset);
    saveProductData(next);
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
          <Text style={styles.subtitle}>Product Load & Cooling Process</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Information</Text>

          <ProductPicker selected={productData.productName || 'Custom'} onSelect={handleSelectProduct} />

          <InputField
            label="Product Entering Temperature"
            value={productData.enteringTemp?.toString() || '30'}
            onChangeText={(value) => handleNumericChange('enteringTemp', value)}
            keyboardType="numbers-and-punctuation"
            unitOptions={['°C', '°F']}
            selectedUnit={productData.tempUnit === 'F' ? '°F' : '°C'}
            onUnitChange={(unit) => updateProductData('tempUnit', unit === '°F' ? 'F' : 'C')}
            onUnitChangeWithConversion={(newUnit, convertedValue) => handleTempUnitChange('enteringTemp', newUnit, convertedValue)}
            allowNegative={true}
          />

          <InputField
            label="Product Final Temperature"
            value={productData.finalTemp?.toString() || '4'}
            onChangeText={(value) => handleNumericChange('finalTemp', value)}
            keyboardType="numbers-and-punctuation"
            unitOptions={['°C', '°F']}
            selectedUnit={productData.tempUnit === 'F' ? '°F' : '°C'}
            onUnitChange={(unit) => updateProductData('tempUnit', unit === '°F' ? 'F' : 'C')}
            onUnitChangeWithConversion={(newUnit, convertedValue) => handleTempUnitChange('finalTemp', newUnit, convertedValue)}
            allowNegative={true}
          />

          <InputField
            label="Pull Down Hours"
            value={productData.pullDownHours.toString()}
            onChangeText={(value) => handleNumericChange('pullDownHours', value)}
            unit="hrs"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Weight & Processing</Text>

          <InputField
            label="Total Product Capacity"
            value={productData.massBeforeFreezing.toString()}
            onChangeText={(value) => handleNumericChange('massBeforeFreezing', value)}
            unitOptions={['kg', 'lbs']}
            selectedUnit={productData.massUnit}
            onUnitChange={(unit) => updateProductData('massUnit', unit as 'kg' | 'lbs')}
            onUnitChangeWithConversion={(newUnit, convertedValue) => handleMassUnitChange(newUnit, convertedValue)}
          />

          <InputField
            label="Daily Loading %"
            value={productData.dailyLoadingPercent?.toString() || '100'}
            onChangeText={(value) => handleNumericChange('dailyLoadingPercent', value)}
            unit="%"
            placeholder="100"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage Capacity</Text>

          <InputField
            label="Storage Density (gross)"
            value={storageDensity.toString()}
            onChangeText={(value) => handleNumericChange('storageDensity', value)}
            unit="kg/ft³"
            keyboardType="decimal-pad"
          />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Internal Volume</Text>
            <Text style={styles.infoValue}>{internalVolume.toFixed(2)} m³ ({(internalVolume * 35.3147).toFixed(0)} ft³)</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Maximum Storage</Text>
            <Text style={styles.infoValue}>{Math.round(maximumStorageKg).toLocaleString()} kg</Text>
          </View>
          <Text style={styles.helperText}>
            Maximum Storage = Internal Volume (ft³) × Storage Density. Internal volume is the room size less the
            insulation on all sides and the floor finish.
          </Text>
          {exceedsStorage && (
            <Text style={styles.warningText}>
              Total Product Capacity is more than the maximum storage of this room.
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Thermal Properties</Text>

          <InputField
            label="Cp Above Freezing"
            value={productData.cpAboveFreezing.toString()}
            onChangeText={(value) => handleNumericChange('cpAboveFreezing', value)}
            unit="kJ/kg·K"
          />

          {productData.cpBelowFreezing !== undefined && (
            <InputField
              label="Cp Below Freezing"
              value={productData.cpBelowFreezing.toString()}
              onChangeText={(value) => handleNumericChange('cpBelowFreezing', value)}
              unit="kJ/kg·K"
            />
          )}

          {productData.freezingPoint !== undefined && (
            <InputField
              label="Freezing Point"
              value={productData.freezingPoint.toString()}
              onChangeText={(value) => handleNumericChange('freezingPoint', value)}
              keyboardType="numbers-and-punctuation"
              unitOptions={['°C', '°F']}
              selectedUnit={productData.tempUnit === 'F' ? '°F' : '°C'}
              onUnitChange={(unit) => updateProductData('tempUnit', unit === '°F' ? 'F' : 'C')}
              onUnitChangeWithConversion={(newUnit, convertedValue) => handleTempUnitChange('freezingPoint', newUnit, convertedValue)}
              allowNegative={true}
            />
          )}

          <InputField
            label="Latent Heat of Fusion"
            value={latentHeat.toString()}
            onChangeText={(value) => handleNumericChange('latentHeatOfFusion', value)}
            unit="kJ/kg"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Respiration Load</Text>

          <InputField
            label="Respiration Heat"
            value={respiration.fromTable ? (Math.round(respiration.wattsPerTonne * 10) / 10).toString() : productData.watts.toString()}
            onChangeText={(value) => saveProductData({ ...productData, watts: parseFloat(value) || 0, respirationAuto: false })}
            unit="W/tonne"
          />
          {respiration.fromTable ? (
            <Text style={styles.helperText}>
              From the ASHRAE respiration table for {productData.productName} at the room temperature of{' '}
              {roomTempC.toFixed(1)}°C (interpolated). Applied to the total stored quantity. Type a value to override.
            </Text>
          ) : productHasRespirationTable ? (
            <TouchableOpacity onPress={() => saveProductData({ ...productData, respirationAuto: true })}>
              <Text style={styles.linkText}>Manual value. Tap to use the table value for {productData.productName}.</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.helperText}>
              Heat given off by fresh fruit and vegetables while stored, applied to the total stored quantity. 0 for
              non-living products.
            </Text>
          )}
        </View>

        {/* Info section removed for cleaner UI */}
        <BottomNavArrows
          onLeftPress={() => router.push('/(tabs)/' as any)}
          onRightPress={() => router.push('/(tabs)/miscellaneous' as any)}
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: '#475569',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  linkText: {
    fontSize: 12,
    color: '#2563eb',
    marginTop: 6,
    textDecorationLine: 'underline',
  },
  helperText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 6,
  },
  warningText: {
    fontSize: 13,
    color: '#b45309',
    marginTop: 8,
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
  calculationCard: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  calculationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
  },
  calculationFormula: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  calculationNote: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
  },
  infoText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
});