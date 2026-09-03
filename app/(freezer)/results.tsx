import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFreezerStorageContext } from '@/hooks/FreezerStorageProvider';
import { useAuth } from '@/hooks/AuthProvider';
import { useGlobalUpdate } from '@/hooks/useGlobalUpdate';
import { calculateFreezerHeatLoad } from '@/utils/calculations';
import { generateAndSharePDF, PDFData } from '@/utils/pdfGenerator';
import { saveCalculationToFirestore, getCalculationTypeFromTitle } from '@/utils/calculationStorage';

export default function FreezerResultsTab() {
  const { roomData, productData, miscData } = useFreezerStorageContext();
  const { userProfile, getUserDisplayName, user, saveGuestInputs } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [networkStatus, setNetworkStatus] = useState('');
  const [showSignUpModal, setShowSignUpModal] = useState(false);

  // Subscribe to global updates for real-time calculation
  useGlobalUpdate();

  const results = calculateFreezerHeatLoad(roomData, productData, miscData);
  const baseLoadKw = results.totalLoadKw || 0;
  const safetyFactorPercent = results.safetyFactorPercent ?? miscData.capacityIncludingSafety ?? 20;
  
  // Use finalCapacity from results which includes door frequency adjustment
  const finalCapacityTR = results.finalCapacity || 0;
  const finalCapacityKw = finalCapacityTR * 3.517;
  const finalCapacityBtuHr = finalCapacityKw * 3412;

  const handleSignUpFromModal = async () => {
    setShowSignUpModal(false);
    // Save current inputs before navigating to signup
    await saveGuestInputs({ roomData, productData, miscData });
    router.push('/sign-up' as any);
  };

  const handleSharePDF = async () => {
    // If user is not logged in, show the sign up modal
    if (!user) {
      setShowSignUpModal(true);
      return;
    }

    setIsGenerating(true);
    setNetworkStatus('Preparing data...');
    
    try {
      const pdfData: PDFData = {
        title: 'Freezer Room Heat Load Summary',
        subtitle: 'Key calculation results for freezer room refrigeration system',
        userName: getUserDisplayName(), // Use helper function with fallback
        projectName: roomData.projectName,
        finalResults: [
          { label: 'Total Load', value: finalCapacityKw.toFixed(1), unit: 'kW' },
          { label: 'Load', value: finalCapacityBtuHr.toFixed(0), unit: 'BTU/hr' },
          { label: 'Safety Factor', value: safetyFactorPercent.toFixed(1), unit: '%' },
        ],
        inputs: [
          {
            title: 'Ambient Conditions',
            items: [
              { label: 'Ambient Temperature', value: miscData.ambientTemp?.toString() || '35', unit: `°${miscData.tempUnit || 'C'}` },
              { label: 'Ambient RH', value: '60', unit: '%' },
            ]
          },
          {
            title: 'Room Definition',
            items: [
              { label: 'Room Length', value: roomData.length.toString(), unit: roomData.lengthUnit },
              { label: 'Room Width', value: roomData.width.toString(), unit: roomData.lengthUnit },
              { label: 'Room Height', value: roomData.height.toString(), unit: roomData.lengthUnit },
              { label: 'Insulation Thickness', value: roomData.wallInsulationThickness.toString(), unit: 'mm' },
              { label: 'Room Internal Volume', value: (roomData.length * roomData.width * roomData.height).toFixed(2), unit: 'm³' },
              { label: 'Cold Room Position', value: 'Inside', unit: '' },
              { label: 'Room Temperature', value: miscData.roomTemp?.toString() || '-15', unit: `°${miscData.tempUnit || 'C'}` },
              { label: 'Insulation', value: roomData.insulationType, unit: '40 kg/m³' },
            ]
          },
          {
            title: 'Product Definition',
            items: [
              { label: 'Product', value: 'Product', unit: '' },
              { label: 'Product Quantity', value: productData.massBeforeFreezing?.toString() || '3000', unit: productData.massUnit || 'kg' },
              { label: 'Daily Product Loading', value: productData.massBeforeFreezing?.toString() || '3000', unit: productData.massUnit || 'kg' },
              { label: 'Product Incoming Temp', value: productData.enteringTemp?.toString() || '25', unit: `°${productData.tempUnit || 'C'}` },
              { label: 'Product Final Temp', value: productData.finalTemp?.toString() || '-15', unit: `°${productData.tempUnit || 'C'}` },
              { label: 'Specific Heat Above Freezing', value: productData.cpAboveFreezing.toString(), unit: 'kJ/kg °C' },
              { label: 'Specific Heat Below Freezing', value: productData.cpBelowFreezing.toString(), unit: 'kJ/kg °C' },
              { label: 'Freezing Temp', value: productData.freezingPoint?.toString() || '-0.8', unit: `°${productData.tempUnit || 'C'}` },
              { label: 'Latent Heat of Freezing', value: productData.latentHeatOfFusion?.toString() || '233', unit: 'kJ/kg' },
              { label: 'Respiration Heat', value: '0.00', unit: 'W/kg * 24 h' },
            ]
          },
          {
            title: 'Internal Factors',
            items: [
              { label: 'No. of Workers', value: miscData.occupancyCount.toString(), unit: '' },
              { label: 'Rated Power of motors', value: miscData.fanMotorRating?.toString() || '0.25', unit: 'kW' },
              { label: 'Lightings', value: miscData.lightPower.toString(), unit: 'W' },
              { label: 'Heater Coils', value: '0', unit: 'W' },
              { label: 'Working Time', value: '5', unit: 'h' },
              { label: 'Operating Time', value: miscData.equipmentUsageHours.toString(), unit: 'h' },
            ]
          }
        ],
        sections: [
          {
            title: 'Transmission Loads',
            items: [
              { label: 'Wall Load', value: (results.wallLoad || 0).toFixed(1), unit: 'kW' },
              { label: 'Ceiling Load', value: (results.ceilingLoad || 0).toFixed(1), unit: 'kW' },
              { label: 'Floor Load', value: (results.floorLoad || 0).toFixed(1), unit: 'kW' },
              { label: 'Total Transmission Load', value: (results.totalTransmissionLoad || 0).toFixed(1), unit: 'kW' },
            ]
          },
          {
            title: 'Product Loads (Freezing Process)',
            items: [
              { label: 'Before Freezing Load', value: (results.beforeFreezingLoad || 0).toFixed(1), unit: 'kW' },
              { label: 'Latent Heat Load (Freezing)', value: (results.latentHeatLoad || 0).toFixed(1), unit: 'kW' },
              { label: 'After Freezing Load', value: (results.afterFreezingLoad || 0).toFixed(1), unit: 'kW' },
              { label: 'Total Product Load', value: (results.totalProductLoad || 0).toFixed(1), unit: 'kW' },
            ]
          },
          {
            title: 'Other Loads',
            items: [
              { label: 'Respiration Load', value: (results.respirationLoad || 0).toFixed(1), unit: 'kW' },
              { label: 'Air Change Load', value: (results.airChangeLoad || 0).toFixed(1), unit: 'kW' },
              { label: 'Equipment Load', value: (results.equipmentLoad || 0).toFixed(1), unit: 'kW' },
              { label: 'Lighting Load', value: (results.lightLoad || 0).toFixed(1), unit: 'kW' },
              { label: 'Heater Load', value: (results.doorHeaterLoad || 0).toFixed(1), unit: 'kW' },
              { label: 'Occupancy Load', value: (results.occupancyLoad || 0).toFixed(1), unit: 'kW' },
              { label: 'Compressor Air Load', value: (results.compressorLoad || 0).toFixed(1), unit: 'kW' },
              { label: 'Total Miscellaneous Load', value: (results.totalMiscLoad || 0).toFixed(1), unit: 'kW' },
            ]
          },
          {
            title: 'Heat Distribution',
            items: [
              { label: 'Sensible Heat', value: (results.sensibleHeat || 0).toFixed(1), unit: 'kW' },
              { label: 'Latent Heat', value: (results.latentHeat || 0).toFixed(1), unit: 'kW' },
              { label: 'Air Qty Required', value: (results.airQtyRequired || 0).toFixed(0), unit: 'CFM' },
            ]
          }
        ]
      };

      // Network call to save data to Firestore (with timeout)
      if (user?.uid) {
        setNetworkStatus('Saving calculation data...');
        
        try {
          console.log('[FreezerRoom] 📡 Attempting to save calculation data to Firestore');
          
          // Use 8 second timeout for better offline handling
          const saveResult = await saveCalculationToFirestore(
            user.uid, 
            'freezer_room', 
            pdfData,
            roomData,
            productData,
            8000 // 8 second timeout
          );
          
          if (saveResult.success) {
            console.log('[FreezerRoom] ✅ Calculation data saved successfully');
            setNetworkStatus('Data saved - ready to share!');
          } else {
            console.error('[FreezerRoom] ❌ Failed to save calculation data:', saveResult.error);
            
            // Check if it's a timeout/network error (offline)
            const isOfflineError = saveResult.error?.toLowerCase().includes('timeout') || 
                                  saveResult.error?.toLowerCase().includes('network') ||
                                  saveResult.error?.toLowerCase().includes('connection');
            
            if (isOfflineError) {
              // For offline errors, just show simple message and continue
              console.log('[FreezerRoom] 📱 Offline mode - continuing with PDF only');
              setNetworkStatus('Offline mode - ready to share PDF!');
            } else {
              // For other errors, show detailed info during testing
              Alert.alert(
                'Save Failed',
                `Failed to save calculation data:\n\n${saveResult.error}\n\nDetailed info:\n${saveResult.details || 'No additional details'}`,
                [{ text: 'Continue with PDF', style: 'default' }]
              );
              setNetworkStatus('Save failed - ready to share PDF!');
            }
          }
        } catch (error: any) {
          console.error('[FreezerRoom] ❌ Unexpected error saving calculation data:', error);
          
          // Check if it's likely an offline/network error
          const errorMessage = error?.message || '';
          const isOfflineError = errorMessage.toLowerCase().includes('timeout') || 
                                errorMessage.toLowerCase().includes('network') ||
                                errorMessage.toLowerCase().includes('connection');
          
          if (isOfflineError) {
            console.log('[FreezerRoom] 📱 Network timeout - continuing with PDF only');
            setNetworkStatus('Offline mode - ready to share PDF!');
          } else {
            Alert.alert(
              'Network Error',
              `Unexpected error occurred:\n\n${errorMessage}\n\nStack:\n${error?.stack || 'No stack trace'}`,
              [{ text: 'Continue with PDF', style: 'default' }]
            );
            setNetworkStatus('Network error - ready to share PDF!');
          }
        }
      } else {
        console.log('[FreezerRoom] ⚠️ No user UID available, skipping Firestore save');
        setNetworkStatus('Not logged in - ready to share PDF!');
      }

      // Always proceed with PDF generation regardless of save status
      setNetworkStatus('Generating PDF...');
      await generateAndSharePDF(pdfData);
      
    } catch (error: any) {
      console.error('[FreezerRoom] ❌ PDF generation error:', error);
      Alert.alert('PDF Error', `Failed to generate PDF: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
      setNetworkStatus('');
    }
  };

  const ResultCard = ({ title, value, unit, isHighlighted = false }: {
    title: string;
    value: number | string | undefined;
    unit: string;
    isHighlighted?: boolean;
  }) => (
    <View style={[styles.resultCard, isHighlighted && styles.highlightedCard]}>
      <Text style={[styles.resultLabel, isHighlighted && styles.highlightedLabel]}>{title}</Text>
      <Text style={[styles.resultValue, isHighlighted && styles.highlightedValue]}>
        {value !== undefined ? (typeof value === 'number' ? value.toFixed(1) : value) : '0.0'} <Text style={styles.resultUnit}>{unit}</Text>
      </Text>
    </View>
  );

  const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Sign Up Modal for PDF Sharing */}
      <Modal
        visible={showSignUpModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSignUpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="document-text-outline" size={60} color="#2563eb" />
            <Text style={styles.modalTitle}>Create Account to Share PDF</Text>
            <Text style={styles.modalText}>
              Sign up to share your calculation results as a PDF. Your data will be saved and you can access it anytime.
            </Text>
            <TouchableOpacity style={styles.modalSignUpButton} onPress={handleSignUpFromModal}>
              <Text style={styles.modalSignUpButtonText}>Create Account</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowSignUpModal(false)}>
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Enzo Cool Calc</Text>
            <Text style={styles.subtitle}>Freezer Heat Load Results</Text>

            {/* PDF Export Button */}
            <TouchableOpacity 
              style={[styles.pdfButton, isGenerating && styles.pdfButtonDisabled]} 
              onPress={handleSharePDF}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={styles.pdfButtonText}>Generating PDF...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="document-text-outline" size={20} color="#ffffff" />
                  <Text style={styles.pdfButtonText}>Share as PDF</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Network Status Indicator */}
            {networkStatus && (
              <View style={styles.networkStatusContainer}>
                <Text style={styles.networkStatusText}>{networkStatus}</Text>
              </View>
            )}
          </View>

          {/* Main Results - Highlighted */}
          <SectionCard title="Main Results">
            <ResultCard
              title={`Final Capacity (TR)`}
              value={finalCapacityTR}
              unit="TR"
              isHighlighted={true}
            />
            <ResultCard
              title={`Total Load (with ${safetyFactorPercent.toFixed(1)}% Safety + Door Adj.)`}
              value={finalCapacityKw}
              unit="kW"
              isHighlighted={true}
            />
            <ResultCard
              title="Load in BTU/hr"
              value={finalCapacityBtuHr}
              unit="BTU/hr"
              isHighlighted={true}
            />
            <ResultCard
              title="Safety Factor"
              value={safetyFactorPercent}
              unit="%"
            />
          </SectionCard>

          {/* Door Opening Frequency Adjustment */}
          <SectionCard title="Door Opening Adjustment">
            <ResultCard
              title="Door Opening Frequency"
              value={
                results.doorFrequency === 'high' ? 'High' :
                results.doorFrequency === 'medium' ? 'Medium' :
                'Low'
              }
              unit=""
            />
            <ResultCard
              title="Door Frequency Multiplier"
              value={results.doorFrequencyMultiplier}
              unit="×"
            />
          </SectionCard>

          {/* Transmission Loads */}
          <SectionCard title="Transmission Loads">
            <ResultCard title="Wall Load" value={results.wallLoad} unit="kW" />
            <ResultCard title="Ceiling Load" value={results.ceilingLoad} unit="kW" />
            <ResultCard title="Floor Load" value={results.floorLoad} unit="kW" />
            <ResultCard
              title="Total Transmission Load"
              value={results.totalTransmissionLoad}
              unit="kW"
            />
          </SectionCard>

          {/* Product Loads - Freezer Specific */}
          <SectionCard title="Product Loads (Freezing Process)">
            <ResultCard
              title="Before Freezing Load"
              value={results.beforeFreezingLoad}
              unit="kW"
            />
            <ResultCard
              title="Latent Heat Load (Freezing)"
              value={results.latentHeatLoad}
              unit="kW"
            />
            <ResultCard
              title="After Freezing Load"
              value={results.afterFreezingLoad}
              unit="kW"
            />
            <ResultCard
              title="Total Product Load"
              value={results.totalProductLoad}
              unit="kW"
            />
          </SectionCard>

          {/* Other Loads */}
          <SectionCard title="Other Loads">
            <ResultCard title="Respiration Load" value={results.respirationLoad} unit="kW" />
            <ResultCard title="Air Change Load" value={results.airChangeLoad} unit="kW" />
            <ResultCard title="Equipment Load" value={results.equipmentLoad} unit="kW" />
            <ResultCard title="Lighting Load" value={results.lightLoad} unit="kW" />
            <ResultCard title="Heater Load" value={results.doorHeaterLoad || 0} unit="kW" />
            <ResultCard title="Compressor Air Load" value={results.compressorLoad || 0} unit="kW" />
            <ResultCard title="Occupancy Load" value={results.occupancyLoad} unit="kW" />
            <ResultCard
              title="Total Miscellaneous Load"
              value={results.totalMiscLoad}
              unit="kW"
            />
          </SectionCard>

          {/* Heat Distribution */}
          <SectionCard title="Heat Distribution">
            <ResultCard title="Sensible Heat" value={results.sensibleHeat} unit="kW" />
            <ResultCard title="Latent Heat" value={results.latentHeat} unit="kW" />
            <ResultCard title="Air Quantity Required" value={results.airQtyRequired} unit="CFM" />
          </SectionCard>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Powered by Enzo</Text>
            <Text style={styles.footerSubtext}>
              Professional freezer heat load calculations following ASHRAE standards
            </Text>
          </View>
        </View>
      </ScrollView>
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
    padding: 12,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
    paddingVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '400',
  },
  pdfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#2563eb',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  pdfButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 10,
    letterSpacing: -0.1,
    textAlign: 'left',
  },
  resultCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    minHeight: 40,
  },
  highlightedCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 3,
    borderBottomWidth: 0,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  resultLabel: {
    fontSize: 13,
    color: '#374151',
    flex: 1,
    fontWeight: '400',
  },
  highlightedLabel: {
    fontWeight: '600',
    color: '#1e40af',
    fontSize: 14,
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  highlightedValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  resultUnit: {
    fontSize: 12,
    fontWeight: '400',
    color: '#64748b',
  },
  footer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '600',
    marginBottom: 3,
  },
  footerSubtext: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
    fontWeight: '400',
  },
  pdfButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  networkStatusContainer: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    alignSelf: 'center',
  },
  networkStatusText: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Modal styles for PDF sharing
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalSignUpButton: {
    width: '100%',
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalSignUpButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalCloseButton: {
    width: '100%',
    backgroundColor: '#f1f5f9',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '600',
  },
});
