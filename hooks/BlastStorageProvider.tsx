import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { triggerGlobalUpdate } from '@/hooks/useGlobalUpdate';

export const BLAST_STORAGE_KEYS = {
    ROOM_DATA: 'enzo_blast_room_data',
    PRODUCT_DATA: 'enzo_blast_product_data',
    MISC_DATA: 'enzo_blast_misc_data',
};

// Blast freezer specific data types based on Excel
export interface BlastRoomData {
    // Project identification
    projectName: string;        // User-defined project name
    
    // Room Dimensions - Excel shows L=5, B=5, H=3.5
    length: number;             // Excel shows 5m
    width: number;              // Excel shows 5m  
    height: number;             // Excel shows 3.5m
    lengthUnit: 'm' | 'ft';

    // Temperature parameters - Excel D52, D53
    ambientTemp: number;        // Excel shows 43°C
    roomTemp: number;           // Excel shows -35°C
    tempUnit: 'C' | 'F';

    // Insulation parameters - Excel D48
    insulationType: string;          // Excel shows PUF
    wallInsulationThickness: number;     // Excel shows 150mm - USED in U-factor calculation
    ceilingInsulationThickness: number;  // Excel shows 150mm - USED in U-factor calculation
    floorInsulationThickness: number;    // Excel shows 150mm - USED in U-factor calculation

    // U-Factor parameters - Excel C8, C9, C10
    wallUFactor: number;        // Excel C8 - User input U-factor for walls
    ceilingUFactor: number;     // Excel C9 - User input U-factor for ceiling
    floorUFactor: number;       // Excel C10 - User input U-factor for floor

    // Hours parameters - Excel F8, F9, F10
    wallHours: number;          // Excel F8 - Hours for wall transmission load
    ceilingHours: number;       // Excel F9 - Hours for ceiling transmission load
    floorHours: number;         // Excel F10 - Hours for floor transmission load

    // Unit preferences
    areaUnit: 'm²' | 'ft²';     // Area unit preference
}export interface BlastProductData {
    // Batch Processing Parameters - moved from miscData to productData 
    capacityRequired: number;    // Excel shows 2000 kgs - The batch size being processed
    batchHours: number;          // Excel shows 8 Hrs - Processing time per batch

    // Product temperature parameters - Excel D54, D55
    productEnteringTemp: number; // Excel shows -5°C
    productFinalTemp: number;    // Excel shows -30°C
    tempUnit: 'C' | 'F';

    // Product Load - Excel Section 2
    // Note: Mass values are taken from capacityRequired above
    cpAboveFreezing: number;     // kJ/kg·K - Excel shows 3.49 - USED in product calculations
    cpBelowFreezing: number;     // kJ/kg·K - Excel shows 2.14 - USED in product calculations
    pullDownHours: number;       // hrs - Excel shows 8 - USED in product calculations
    latentHeat: number;          // kJ/kg - Excel shows 233 - USED in product calculations
    productName: string;         // Excel shows "Chicken"
    freezingPoint: number;       // Excel shows -1.7°C - USED in temperature difference calculations

    // Unit preferences
    massUnit: 'kg' | 'lbs';      // Mass unit preference
}

export interface BlastMiscellaneousData {
    // Air Change Load - Excel Section 3
    airChangeRate: number;       // Air change rate(L/S) - Excel shows 4.2
    enthalpyDiff: number;        // Enthalpy diff (kJ/L) - Excel shows 0.14
    hoursOfLoad: number;         // Hours of load - Excel shows 2

    // Equipment Load - Excel Section 4a
    fanMotorRating: number;      // kW - Excel shows 0.37
    equipmentQuantity: number;   // Quantity - Excel shows 3
    equipmentHours: number;      // Usage in Hrs - Excel shows 8

    // Occupancy - Excel Section 4b
    occupancyCount: number;      // No of people - Excel shows 1.0
    occupancyHeatLoad: number;   // Heat load per person - Excel shows 0.5
    occupancyHours: number;      // Hours - Excel shows 1

    // Light Load - Excel Section 4c
    lightLoad: number;           // Light load (W) - Excel shows 0.1
    lightHours: number;          // Hours - Excel shows 1.2

    // Heaters - Excel Section 4d,4e,4f,4g
    peripheralHeaterCapacity: number;  // Heater capacity(kW) - Excel shows 1.5
    peripheralHeaterCount: number;     // No of heaters - Excel shows 1
    peripheralHeaterHours: number;     // Hours - Excel shows 8

    doorHeaterCapacity: number;        // Heater capacity(kW) - Excel shows 0.27
    doorHeaterCount: number;           // No of Doors - Excel shows 1
    doorHeaterHours: number;           // Hours - Excel shows 8

    trayHeaterCapacity: number;        // Heater capacity(kW) - Excel shows 2.2
    trayHeaterCount: number;           // No of heaters - Excel shows 1
    trayHeaterHours: number;           // Hours - Excel shows 0.4

    drainHeaterCapacity: number;       // - Excel shows 0.04
    drainHeaterCount: number;          // - Excel shows 1
    drainHeaterHours: number;          // Hours - Excel shows 8

    // Compressor Air Load
    compressorPowerKW?: number;        // Compressor power in kW
    compressorAirRunningHours?: number; // Compressor running hours per day

    // Door Opening Frequency - affects final capacity
    doorOpeningFrequency: 'low' | 'medium' | 'high'; // Door opening frequency

    // Unit preferences
    volumeUnit: 'm³' | 'ft³';         // Volume unit preference
    capacityIncludingSafety: number;  // Safety factor percentage
}

// Default values based on Excel spreadsheet for blast freezer - EXACT MATCH
const defaultBlastRoomData: BlastRoomData = {
    // Project identification
    projectName: 'Blaster Project',  // Default project name for blaster
    
    // Room Dimensions - Excel shows L=5, B=5, H=3.5
    length: 5,                 // Excel shows 5m
    width: 5,                  // Excel shows 5m
    height: 3.5,               // Excel shows 3.5m
    lengthUnit: 'm',

    // Temperature parameters - Excel D52, D53
    ambientTemp: 43,           // Excel D52
    roomTemp: -35,             // Excel D53
    tempUnit: 'C',

    // Insulation parameters - Excel D48
    insulationType: 'PUF',          // Excel D47
    wallInsulationThickness: 150,   // Excel D48 - 150mm - USED in U-factor calculation
    ceilingInsulationThickness: 150, // Excel D48 - 150mm - USED in U-factor calculation
    floorInsulationThickness: 150,   // Excel D48 - 150mm - USED in U-factor calculation

    // U-Factor parameters - Excel C8, C9, C10
    wallUFactor: 0.153,        // Excel C8 - Default for 150mm PUF
    ceilingUFactor: 0.153,     // Excel C9 - Default for 150mm PUF
    floorUFactor: 0.153,        // Excel C10 - Default for 150mm PUF

    // Hours parameters - Excel F8, F9, F10
    wallHours: 8,              // Excel F8 - Default 8 hours
    ceilingHours: 8,           // Excel F9 - Default 8 hours
    floorHours: 8,             // Excel F10 - Default 8 hours

    // Unit preferences
    areaUnit: 'm²',
}; const defaultBlastProductData: BlastProductData = {
    // Batch Processing Parameters - moved from miscData
    capacityRequired: 2000,     // Excel D45 - Batch size being processed
    batchHours: 8,              // Excel D46 - Processing time per batch

    // Product temperature parameters - Excel D54, D55
    productEnteringTemp: -5,    // Excel D54
    productFinalTemp: -30,      // Excel D55
    tempUnit: 'C',

    // Product Load - Excel Section 2
    // Note: Mass values (2000 kg) are now taken from capacityRequired above
    cpAboveFreezing: 3.49,      // Excel E14 - USED in product calculations
    cpBelowFreezing: 2.14,      // Excel E16 - USED in product calculations
    pullDownHours: 8,           // Excel G14,G15,G16 - USED in product calculations
    latentHeat: 233,            // Excel F15 - USED in product calculations
    productName: 'Chicken',     // Excel shows Chicken
    freezingPoint: -1.7,        // Excel D59 - USED in temperature difference calculations

    // Unit preferences
    massUnit: 'kg',
};

const defaultBlastMiscData: BlastMiscellaneousData = {
    // Air Change Load - Excel Section 3
    airChangeRate: 4.2,         // Excel D20
    enthalpyDiff: 0.14,         // Excel E20
    hoursOfLoad: 2,             // Excel F20

    // Equipment Load - Excel Section 4a
    fanMotorRating: 0.37,       // Excel D23
    equipmentQuantity: 3,       // Excel E23
    equipmentHours: 8,          // Excel F23

    // Occupancy - Excel Section 4b
    occupancyCount: 1.0,        // Excel E25
    occupancyHeatLoad: 0.5,     // Excel E25
    occupancyHours: 1,          // Excel F25

    // Light Load - Excel Section 4c
    lightLoad: 0.1,             // Excel D27
    lightHours: 1.2,            // Excel F27

    // Heaters - Excel Section 4d,4e,4f,4g
    peripheralHeaterCapacity: 1.5,  // Excel D29
    peripheralHeaterCount: 1,       // Excel E29
    peripheralHeaterHours: 8,       // Excel F29

    doorHeaterCapacity: 0.27,       // Excel D31
    doorHeaterCount: 1,             // Excel E31
    doorHeaterHours: 8,             // Excel F31

    trayHeaterCapacity: 2.2,        // Excel D33
    trayHeaterCount: 1,             // Excel E33
    trayHeaterHours: 0.4,           // Excel F33

    drainHeaterCapacity: 0.04,      // Excel D34
    drainHeaterCount: 1,            // Excel E34
    drainHeaterHours: 8,            // Excel F34

    // Compressor Air Load
    compressorPowerKW: 0,           // Default 0 kW
    compressorAirRunningHours: 0,   // Default 0 hours

    // Door Opening Frequency
    doorOpeningFrequency: 'low',    // Default low frequency

    // Unit preferences
    volumeUnit: 'm³',
    capacityIncludingSafety: 10, // Default safety factor percentage (changed from 20% to 10%)
};

export interface BlastCalculationResults {
    // Transmission loads - Excel calculations (Section 1)
    wallLoad: number;              // Excel G8: =((E8*D8*C8)/1000)*3600*F8
    ceilingLoad: number;           // Excel G9: =((E9*D9*C9)/1000)*3600*F9
    floorLoad: number;             // Excel G10: =((E10*D10*C10)/1000)*3600*F10
    totalTransmissionLoad: number; // Sum of wall+ceiling+floor

    // Product loads - Excel calculations (Section 2)
    beforeFreezingLoad: number;    // Excel G14: =C14*D14*E14*(D46/F14)
    latentHeatLoad: number;        // Excel G15: =(C15*D15)*(D46/F15)
    afterFreezingLoad: number;     // Excel G16: =(C16*D16*E16)*(D46/F16)
    totalProductLoad: number;      // Sum of before+latent+after

    // Air change load - Excel calculation (Section 3)
    airChangeLoad: number;         // Excel G20: =C20*D20*3600*F20

    // Equipment loads - Excel calculations (Section 4)
    equipmentLoad: number;         // Excel G23: =(C23*D23*3600*F23)
    occupancyLoad: number;         // Excel G25: =(C25*D25)*3600*F25
    lightLoad: number;             // Excel G27: =(C27*3.6)*F27
    peripheralHeaterLoad: number;  // Excel G29: =(C29*D29*3600*F29)
    doorHeaterLoad: number;        // Excel G31: =(C31*D31*3600*F31)
    trayHeaterLoad: number;        // Excel G33: =(C33*D33*3600*F33)
    drainHeaterLoad: number;       // Excel G34: =(C34*D34*3600*F34)
    compressorLoad: number;        // Compressor air load: compressorPowerKW x 3600 x running hours
    totalMiscLoad: number;         // Sum of all miscellaneous loads

    // Individual TR calculations - Excel formulas
    wallLoadTR: number;            // Excel: =G8/(3600*3.517*24)
    ceilingLoadTR: number;         // Excel: =G9/(3600*3.517*24)
    floorLoadTR: number;           // Excel: =G10/(3600*3.517*24)
    beforeFreezingLoadTR: number;  // Excel: =G14/(3600*3.517*24)
    latentHeatLoadTR: number;      // Excel: =G15/(3600*3.517*24)
    afterFreezingLoadTR: number;   // Excel: =G16/(3600*3.517*24)
    airChangeLoadTR: number;        // Excel: =G20/(3600*3.517*24)
    equipmentLoadTR: number;       // Excel: =G23/(3600*3.517*24)
    occupancyLoadTR: number;       // Excel: =G25/(3600*3.517*24)
    lightLoadTR: number;           // Excel: =G27/(3600*3.517*24)
    peripheralHeaterLoadTR: number; // Excel: =G29/(3600*3.517*24)
    doorHeaterLoadTR: number;       // Excel: =G31/(3600*3.517*24)
    trayHeaterLoadTR: number;       // Excel: =G33/(3600*3.517*24)
    drainHeaterLoadTR: number;      // Excel: =G34/(3600*3.517*24)
    compressorLoadTR: number;       // Compressor air load (TR)

    // Final results - Excel calculations
    totalLoadKJ: number;           // Excel G36: =SUM(G8:G34)
    totalLoadKw: number;           // Excel G37: =G36/(3600*D46)
    totalLoadTR: number;           // Excel G38: =G37/3.517
    capacityIncludingSafety: number; // Excel G39: TR with safety factor applied
    finalCapacity: number;         // Final capacity after door frequency adjustment (TR)
    safetyFactorPercent: number;  // User-defined safety factor percentage
    doorFrequency: 'low' | 'medium' | 'high'; // Door opening frequency
    doorFrequencyMultiplier: number; // Multiplier applied for door frequency
    sensibleHeatKJ24Hr: number;    // Excel G40: =SUM(G8:G14)+SUM(G16:G17)+0.4*C
    latentHeatKJ24Hr: number;      // Excel G41: =G15+0.6*G20+0.6*G25
    shr: number;                   // Excel G42: =G40/(G40+G41)
    airQtyRequiredCfm: number;     // Excel G43: =((G37*12000)*G42)/(5*1.08)
    refrigerationCapacity: number;  // Final TR with 20% safety factor
}

type BlastStorageContextValue = {
    roomData: BlastRoomData;
    productData: BlastProductData;
    miscData: BlastMiscellaneousData;
    saveRoomData: (d: BlastRoomData) => void;
    saveProductData: (d: BlastProductData) => void;
    saveMiscData: (d: BlastMiscellaneousData) => void;
    resetToDefaults: () => void;
    calculateResults: () => BlastCalculationResults;
};

const BlastStorageContext = createContext<BlastStorageContextValue | undefined>(undefined);

export const BlastStorageProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const [roomData, setRoomData] = useState<BlastRoomData>(defaultBlastRoomData);
    const [productData, setProductData] = useState<BlastProductData>(defaultBlastProductData);
    const [miscData, setMiscData] = useState<BlastMiscellaneousData>(defaultBlastMiscData);

    // Load from storage once - simplified for Expo compatibility
    useEffect(() => {
        // For now, just use defaults - storage can be added later if needed
        console.log('Blast freezer calculator initialized with default values');
    }, []);

    const saveRoomData = (data: BlastRoomData) => {
        setRoomData({ ...data });
        triggerGlobalUpdate();
    };

    const saveProductData = (data: BlastProductData) => {
        setProductData({ ...data });
        triggerGlobalUpdate();
    };

    const saveMiscData = (data: BlastMiscellaneousData) => {
        setMiscData({ ...data });
        triggerGlobalUpdate();
    };

    const resetToDefaults = () => {
        setRoomData({ ...defaultBlastRoomData });
        setProductData({ ...defaultBlastProductData });
        setMiscData({ ...defaultBlastMiscData });
        triggerGlobalUpdate();
    };

    // Calculate results using EXACT Excel formulas with U-factor calculation
    const calculateResults = (): BlastCalculationResults => {
        // Use the centralized calculation function from utils
        const { calculateBlastHeatLoad } = require('@/utils/calculations');
        return calculateBlastHeatLoad(roomData, productData, miscData);
    };

    const value = useMemo<BlastStorageContextValue>(() => ({
        roomData,
        productData,
        miscData,
        saveRoomData,
        saveProductData,
        saveMiscData,
        resetToDefaults,
        calculateResults,
    }), [roomData, productData, miscData]);

    return (
        <BlastStorageContext.Provider value={value}>
            {children}
        </BlastStorageContext.Provider>
    );
};

export const useBlastStorageContext = () => {
    const ctx = useContext(BlastStorageContext);
    if (!ctx) throw new Error('useBlastStorageContext must be used within BlastStorageProvider');
    return ctx;
};
