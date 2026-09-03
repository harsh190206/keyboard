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
import { useBlastStorageContext } from '@/hooks/BlastStorageProvider';
import { BottomNavArrows } from '@/components/BottomNavArrows';
import DoorOpeningFrequencyPicker from '@/components/DoorOpeningFrequencyPicker';

export default function BlastMiscellaneousTab() {
    const { miscData, saveMiscData } = useBlastStorageContext();

    const handleValueChange = (field: string, value: string) => {
        const numericValue = parseFloat(value) || 0;
        saveMiscData({
            ...miscData,
            [field]: numericValue,
        });
    };

    const handleStringChange = (field: string, value: string) => {
        saveMiscData({
            ...miscData,
            [field]: value,
        });
    };

    const handleUnitChange = (field: string, unit: string) => {
        saveMiscData({
            ...miscData,
            [field]: unit,
        });
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
                        <Text style={styles.subtitle}>Other Loads & Equipment</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Other Loads</Text>
                        <Text style={styles.subSectionTitle}>Air Change Load</Text>

                        <InputField
                            label="Air Change Rate"
                            value={miscData.airChangeRate.toString()}
                            onChangeText={(value) => handleValueChange('airChangeRate', value)}
                            keyboardType="decimal-pad"
                            placeholder="4.2"
                            unit="L/S"
                        />

                        <InputField
                            label="Enthalpy Difference"
                            value={miscData.enthalpyDiff.toString()}
                            onChangeText={(value) => handleValueChange('enthalpyDiff', value)}
                            keyboardType="decimal-pad"
                            placeholder="0.14"
                            unit="kJ/L"
                        />

                        <InputField
                            label="Hours of Load"
                            value={miscData.hoursOfLoad.toString()}
                            onChangeText={(value) => handleValueChange('hoursOfLoad', value)}
                            keyboardType="decimal-pad"
                            placeholder="2"
                            unit="hrs"
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Equipment Load</Text>

                        <InputField
                            label="Fan Motor Rating"
                            value={miscData.fanMotorRating.toString()}
                            onChangeText={(value) => handleValueChange('fanMotorRating', value)}
                            keyboardType="decimal-pad"
                            placeholder="0.37"
                            unit="kW"
                        />

                        <InputField
                            label="Equipment Quantity"
                            value={miscData.equipmentQuantity.toString()}
                            onChangeText={(value) => handleValueChange('equipmentQuantity', value)}
                            keyboardType="decimal-pad"
                            placeholder="3"
                        />

                        <InputField
                            label="Equipment Hours"
                            value={miscData.equipmentHours.toString()}
                            onChangeText={(value) => handleValueChange('equipmentHours', value)}
                            keyboardType="decimal-pad"
                            placeholder="8"
                            unit="hrs"
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Occupancy Load</Text>

                        <InputField
                            label="Occupancy Count"
                            value={miscData.occupancyCount.toString()}
                            onChangeText={(value) => handleValueChange('occupancyCount', value)}
                            keyboardType="decimal-pad"
                            placeholder="1.0"
                            unit="people"
                        />

                        <InputField
                            label="Occupancy Heat Load"
                            value={miscData.occupancyHeatLoad.toString()}
                            onChangeText={(value) => handleValueChange('occupancyHeatLoad', value)}
                            keyboardType="decimal-pad"
                            placeholder="0.5"
                            unit="kW/person"
                        />

                        <InputField
                            label="Occupancy Hours"
                            value={miscData.occupancyHours.toString()}
                            onChangeText={(value) => handleValueChange('occupancyHours', value)}
                            keyboardType="decimal-pad"
                            placeholder="1"
                            unit="hrs"
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Light Load</Text>

                        <InputField
                            label="Light Load"
                            value={miscData.lightLoad.toString()}
                            onChangeText={(value) => handleValueChange('lightLoad', value)}
                            keyboardType="decimal-pad"
                            placeholder="0.1"
                            unit="kW"
                        />

                        <InputField
                            label="Light Hours"
                            value={miscData.lightHours.toString()}
                            onChangeText={(value) => handleValueChange('lightHours', value)}
                            keyboardType="decimal-pad"
                            placeholder="1.2"
                            unit="hrs"
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Heater Loads</Text>

                        <Text style={styles.subSectionTitle}>Peripheral Heaters</Text>
                        <InputField
                            label="Heater Capacity"
                            value={miscData.peripheralHeaterCapacity.toString()}
                            onChangeText={(value) => handleValueChange('peripheralHeaterCapacity', value)}
                            keyboardType="decimal-pad"
                            placeholder="1.5"
                            unit="kW"
                        />

                        <InputField
                            label="Number of Heaters"
                            value={miscData.peripheralHeaterCount.toString()}
                            onChangeText={(value) => handleValueChange('peripheralHeaterCount', value)}
                            keyboardType="decimal-pad"
                            placeholder="1"
                        />

                        <InputField
                            label="Hours"
                            value={miscData.peripheralHeaterHours.toString()}
                            onChangeText={(value) => handleValueChange('peripheralHeaterHours', value)}
                            keyboardType="decimal-pad"
                            placeholder="8"
                            unit="hrs"
                        />

                        <Text style={styles.subSectionTitle}>Door Heaters</Text>
                        <InputField
                            label="Heater Capacity"
                            value={miscData.doorHeaterCapacity.toString()}
                            onChangeText={(value) => handleValueChange('doorHeaterCapacity', value)}
                            keyboardType="decimal-pad"
                            placeholder="0.27"
                            unit="kW"
                        />

                        <InputField
                            label="Number of Doors"
                            value={miscData.doorHeaterCount.toString()}
                            onChangeText={(value) => handleValueChange('doorHeaterCount', value)}
                            keyboardType="decimal-pad"
                            placeholder="1"
                        />

                        <InputField
                            label="Hours"
                            value={miscData.doorHeaterHours.toString()}
                            onChangeText={(value) => handleValueChange('doorHeaterHours', value)}
                            keyboardType="decimal-pad"
                            placeholder="8"
                            unit="hrs"
                        />

                        <Text style={styles.subSectionTitle}>Tray Heaters</Text>
                        <InputField
                            label="Heater Capacity"
                            value={miscData.trayHeaterCapacity.toString()}
                            onChangeText={(value) => handleValueChange('trayHeaterCapacity', value)}
                            keyboardType="decimal-pad"
                            placeholder="2.2"
                            unit="kW"
                        />

                        <InputField
                            label="Number of Heaters"
                            value={miscData.trayHeaterCount.toString()}
                            onChangeText={(value) => handleValueChange('trayHeaterCount', value)}
                            keyboardType="decimal-pad"
                            placeholder="1"
                        />

                        <InputField
                            label="Hours"
                            value={miscData.trayHeaterHours.toString()}
                            onChangeText={(value) => handleValueChange('trayHeaterHours', value)}
                            keyboardType="decimal-pad"
                            placeholder="0.4"
                            unit="hrs"
                        />

                        <Text style={styles.subSectionTitle}>Drain Heaters</Text>
                        <InputField
                            label="Heater Capacity"
                            value={miscData.drainHeaterCapacity.toString()}
                            onChangeText={(value) => handleValueChange('drainHeaterCapacity', value)}
                            keyboardType="decimal-pad"
                            placeholder="0.04"
                            unit="kW"
                        />

                        <InputField
                            label="Number of Heaters"
                            value={miscData.drainHeaterCount.toString()}
                            onChangeText={(value) => handleValueChange('drainHeaterCount', value)}
                            keyboardType="decimal-pad"
                            placeholder="1"
                        />

                        <InputField
                            label="Hours"
                            value={miscData.drainHeaterHours.toString()}
                            onChangeText={(value) => handleValueChange('drainHeaterHours', value)}
                            keyboardType="decimal-pad"
                            placeholder="8"
                            unit="hrs"
                        />
                    </View>



                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Compressor Air Load</Text>

                        <InputField
                            label="Compressor Power"
                            value={miscData.compressorPowerKW?.toString() || '0'}
                            onChangeText={(value) => handleValueChange('compressorPowerKW', value)}
                            keyboardType="decimal-pad"
                            placeholder="0"
                            unit="kW"
                        />

                        <InputField
                            label="Compressor Running Hours"
                            value={miscData.compressorAirRunningHours?.toString() || '0'}
                            onChangeText={(value) => handleValueChange('compressorAirRunningHours', value)}
                            keyboardType="decimal-pad"
                            placeholder="0"
                            unit="hrs/day"
                        />
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Safety Factor</Text>

                        <InputField
                            label="Safety Factor"
                            value={miscData.capacityIncludingSafety.toString()}
                            onChangeText={(value) => handleValueChange('capacityIncludingSafety', value)}
                            keyboardType="decimal-pad"
                            unit="%"
                        />
                    </View>

                    {/* NEW: Door Opening Frequency */}
                    <View style={styles.section}>
                        <DoorOpeningFrequencyPicker
                            value={miscData.doorOpeningFrequency || 'low'}
                            onChange={(value) => handleStringChange('doorOpeningFrequency', value)}
                        />
                        
                        <Text style={styles.infoText}>
                            💡 Frequent door openings increase infiltration load. The adjustment is applied to the final capacity after the safety factor.
                        </Text>
                    </View>

                    <BottomNavArrows
                        onLeftPress={() => router.push('/(blast)/product' as any)}
                        onRightPress={() => router.push('/(blast)/results' as any)}
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
    subSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
        marginTop: 16,
    },
    infoText: {
        fontSize: 13,
        color: '#64748b',
        lineHeight: 18,
        marginTop: 8,
    },
});
