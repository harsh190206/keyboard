import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { InputField } from '@/components/InputField';
import { resolveAirChange } from '@/utils/calculations';

interface AirChangeSectionProps {
  mode: 'auto' | 'manual';
  airChangeRate: number;
  enthalpyDiff: number;
  hoursOfLoad: number;
  internalVolume: number; // m³
  ambientTempC: number;
  ambientRH: number;
  roomTempC: number;
  roomRH: number;
  doorOpeningFrequency?: 'low' | 'medium' | 'high';
  // Receives all changed fields at once so they are saved in a single update
  onChange: (patch: { airChangeMode?: 'auto' | 'manual'; airChangeRate?: number; enthalpyDiff?: number; hoursOfLoad?: number }) => void;
}

/**
 * Air change (infiltration) inputs.
 * Auto: air changes per 24 h from the room's internal volume (standard table) and the
 * enthalpy difference from ambient / room temperature and RH, so both follow the room.
 * Manual: the user enters the air change rate and enthalpy difference directly.
 * In both modes the door opening frequency factor (1.0 / 1.5 / 2.0) multiplies the air changes.
 */
export default function AirChangeSection(props: AirChangeSectionProps) {
  const { mode, hoursOfLoad, onChange } = props;
  const isAuto = mode !== 'manual';

  const auto = resolveAirChange({
    mode: 'auto',
    manualRate: props.airChangeRate,
    manualEnthalpy: props.enthalpyDiff,
    internalVolumeM3: props.internalVolume,
    ambientTempC: props.ambientTempC,
    ambientRH: props.ambientRH,
    roomTempC: props.roomTempC,
    roomRH: props.roomRH,
    hoursOfLoad,
  });
  const design = resolveAirChange({
    mode: isAuto ? 'auto' : 'manual',
    manualRate: props.airChangeRate,
    manualEnthalpy: props.enthalpyDiff,
    internalVolumeM3: props.internalVolume,
    ambientTempC: props.ambientTempC,
    ambientRH: props.ambientRH,
    roomTempC: props.roomTempC,
    roomRH: props.roomRH,
    hoursOfLoad,
    doorOpeningFrequency: props.doorOpeningFrequency,
  });
  const frequencyLabel =
    props.doorOpeningFrequency === 'high' ? 'High' : props.doorOpeningFrequency === 'medium' ? 'Medium' : 'Low';
  const doorFactorText = `Door opening frequency ${frequencyLabel}: air changes × ${design.doorFactor.toFixed(1)}`;

  const switchMode = (next: 'auto' | 'manual') => {
    if (next === mode) return;
    if (next === 'manual') {
      // Start manual entry from the current calculated values
      onChange({
        airChangeMode: next,
        airChangeRate: Number(auto.airChangeRate.toFixed(2)),
        enthalpyDiff: Number(auto.enthalpyDiff.toFixed(4)),
      });
    } else {
      onChange({ airChangeMode: next });
    }
  };

  const parse = (value: string) => parseFloat(value) || 0;

  return (
    <View>
      <View style={styles.toggle}>
        {(['auto', 'manual'] as const).map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.toggleButton, (option === 'auto') === isAuto && styles.toggleButtonActive]}
            onPress={() => switchMode(option)}
          >
            <Text style={[styles.toggleText, (option === 'auto') === isAuto && styles.toggleTextActive]}>
              {option === 'auto' ? 'Auto (calculated)' : 'Manual'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isAuto ? (
        <>
          <View style={styles.row}>
            <Text style={styles.label}>Air Changes per 24 h (standard)</Text>
            <Text style={styles.value}>{design.baseAirChangesPer24h.toFixed(1)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Door Opening Factor ({frequencyLabel})</Text>
            <Text style={styles.value}>× {design.doorFactor.toFixed(1)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Air Changes per 24 h (design)</Text>
            <Text style={styles.value}>{design.airChangesPer24h.toFixed(1)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Air Change Rate</Text>
            <Text style={styles.value}>{design.airChangeRate.toFixed(2)} L/S</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Enthalpy Difference</Text>
            <Text style={styles.value}>{design.enthalpyDiff.toFixed(4)} kJ/L</Text>
          </View>
          <Text style={styles.helper}>
            Based on internal volume {props.internalVolume.toFixed(1)} m³, ambient {props.ambientTempC.toFixed(1)}°C /{' '}
            {props.ambientRH}% RH and room {props.roomTempC.toFixed(1)}°C / {props.roomRH}% RH. Changes with room
            size, conditions and door opening frequency (selected further down this screen).
          </Text>
        </>
      ) : (
        <>
          <InputField
            label="Air Change Rate"
            value={props.airChangeRate.toString()}
            onChangeText={(value) => onChange({ airChangeRate: parse(value) })}
            unit="L/S"
          />
          <InputField
            label="Enthalpy Difference"
            value={props.enthalpyDiff.toString()}
            onChangeText={(value) => onChange({ enthalpyDiff: parse(value) })}
            unit="kJ/L"
          />
          <Text style={styles.helper}>{doorFactorText} (applied rate {design.airChangeRate.toFixed(2)} L/S).</Text>
        </>
      )}

      <InputField
        label="Hours of Load"
        value={hoursOfLoad.toString()}
        onChangeText={(value) => onChange({ hoursOfLoad: parse(value) })}
        unit="hrs"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 3,
    marginBottom: 12,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#2563eb',
  },
  toggleText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  toggleTextActive: {
    color: '#ffffff',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  label: {
    fontSize: 14,
    color: '#475569',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  helper: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 8,
  },
});
