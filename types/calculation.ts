export interface RoomData {
  // Project identification
  projectName: string; // User-defined project name

  length: number;
  width: number;
  height: number;
  lengthUnit: 'm' | 'ft';

  // Insulation data (Excel structure)
  insulationType: string;
  wallInsulationThickness: number; // D51 in Excel
  ceilingInsulationThickness: number; // E51 in Excel
  floorInsulationThickness: number; // F51 in Excel

  // Transmission data (Excel U-factors)
  wallUFactor: number; // C8 in Excel (0.295)
  ceilingUFactor: number; // C9 in Excel (0.295)
  floorUFactor: number; // C10 in Excel (0.295)

  // Hours of load (Excel structure)
  wallHours: number; // F8 in Excel (24)
  ceilingHours: number; // F9 in Excel (24)
  floorHours: number; // F10 in Excel (24)
}

export interface ProductData {
  massBeforeFreezing: number;
  massUnit: 'kg' | 'lbs';

  // NEW: Daily Loading Percentage (affects actual mass used in calculations)
  dailyLoadingPercent: number; // Default 100%, represents % of total capacity loaded per day

  // Product temperatures - NEW FIELDS
  enteringTemp: number; // Product entering temperature
  finalTemp: number; // Product final temperature
  tempUnit: 'C' | 'F'; // Temperature unit for product temps

  cpAboveFreezing: number;
  cpBelowFreezing?: number; // Optional for products that may freeze
  freezingPoint?: number; // Optional freezing point
  latentHeatOfFusion?: number; // Optional latent heat of freezing (kJ/kg)
  pullDownHours: number;

  // Respiration
  respirationMass: number;
  watts: number;

  // Preset selection
  productName?: string; // e.g., 'Banana', 'Custom'
  overridePreset?: boolean; // if user edits fields after preset
}

// Freezer-specific product data
export interface FreezerProductData extends ProductData {
  // Latent heat for freezing
  latentHeatOfFusion: number; // kJ/kg

  // Cp below freezing
  cpBelowFreezing: number; // kJ/kg·K

  // Freezing point
  freezingPoint: number; // °C
}

// Freezer-specific miscellaneous data
export interface FreezerMiscellaneousData extends MiscellaneousData {
  // Freezer-specific parameters
  productOutgoingFreezer?: number; // Final temperature after freezing
  dailyLoading: number; // Excel shows daily loading in kg/day

  // Additional operational parameters
  equipmentPower?: number; // Total equipment power in Watts
  fanUsageHours: number; // Hours of fan usage (override to required)
  numberOfPeople?: number; // Excel shows 4 people
  peopleUsageFactor?: number; // Excel shows 0.407 kW heat equiv
  lightPowerKw?: number; // kW lighting power
  cpAboveFreezingMisc?: number;
  pullDownTime?: number;
  airFlowPerFan?: number;
  doorClearOpening?: number;
  storageCapacity?: number;
  maximumStorage?: number;
  peripheralHeaters?: number;
  peripheralHeatersQuantity?: number;
  doorHeaters?: number;
  doorHeatersQuantity?: number;
  trayHeaters?: number;
  trayHeatersQuantity?: number;
  drainHeaters?: number;
  drainHeatersQuantity?: number;

  // Heater specifications from Excel
  peripheralHeaterPower?: number; // kW per heater
  peripheralHeaterQuantity?: number; // Number of peripheral heaters
  doorHeaterPower?: number; // kW per door heater
  trayHeaterPower?: number; // kW per tray heater
  trayHeaterQuantity?: number; // Number of tray heaters
  drainHeaterPower?: number; // kW per drain heater
  drainHeaterQuantity?: number; // Number of drain heaters
}

export interface MiscellaneousData {
  // Air Change (Excel structure)
  airChangeRate: number; // C21 in Excel (3.4 L/S)
  enthalpyDiff: number; // D21 in Excel (0.10 kJ/L)
  hoursOfLoad: number; // F21 in Excel (20 hrs)

  // Equipment (Excel structure)
  fanMotorRating: number; // C25 in Excel (0.25 kW)
  fanQuantity: number; // D25 in Excel (1)
  equipmentUsageHours: number; // F25 in Excel (20 hrs)
  equipmentQuantity?: number; // Optional equipment count for miscellaneous calculators

  // Occupancy (Excel structure)
  occupancyCount: number; // C27 in Excel (1.0 people)
  occupancyHeatEquiv: number; // D27 in Excel (0.275 kW)
  occupancyUsageHours: number; // F27 in Excel (20 hrs)

  // Lighting (Excel structure)
  lightPower: number; // C29 in Excel (calculated from area)
  lightUsageHours: number; // F29 in Excel (20 hrs)

  // Door Heaters (Excel structure)
  doorHeaterCapacity: number; // C33 in Excel (calculated from door perimeter)
  doorHeaterQuantity: number; // D33 in Excel (1)
  doorHeaterUsageHours: number; // F33 in Excel (20 hrs)
  peripheralHeaters?: number;
  peripheralHeatersQuantity?: number;
  doorHeaters?: number;
  doorHeatersQuantity?: number;
  trayHeaters?: number;
  trayHeatersQuantity?: number;
  drainHeaters?: number;
  drainHeatersQuantity?: number;

  // Compressor Air Load
  compressorPowerKW?: number; // Compressor power in kW
  compressorAirRunningHours?: number; // Compressor running hours per day

  // NEW: Relative Humidity (RH) Parameters
  ambientRH: number; // Ambient RH (%) - default 55% (base 50-60%)
  insideRoomRH: number; // Inside room RH (%) - default 85% (base design)

  // NEW: Compressor Operating Hours
  compressorRunningHours: number; // Compressor running hours per day - default 24

  // NEW: Door Opening Frequency
  doorOpeningFrequency: 'low' | 'medium' | 'high'; // Door opening frequency - affects final load

  // Temperature parameters (Excel structure)
  ambientTemp: number; // D55 in Excel (45°C)
  roomTemp: number; // D56 in Excel (2°C)
  productIncoming: number; // D57 in Excel (30°C)
  productOutgoing: number; // D58 in Excel (4°C)
  tempUnit: 'C' | 'F';

  // Additional Excel parameters
  doorClearOpeningWidth: number; // D62 in Excel (900 mm) - used for door heater calculation
  doorClearOpeningHeight: number; // E62 in Excel (2000 mm) - used for door heater calculation
  doorDimensionUnit: 'mm' | 'm'; // Unit for door dimensions
  capacityIncludingSafety: number; // D43 in Excel (default 20%) - user-set safety factor percentage

  // REMOVED UNUSED PARAMETERS:
  // dailyLoading - only used in freezer calculations, not cold room
  // cpAboveFreezing - duplicate of productData.cpAboveFreezing
  // pullDownTime - duplicate of productData.pullDownHours
  // storageCapacity - only used to calculate maximumStorage which is not used in heat load
  // maximumStorage - calculated but not used in any heat load formulas
}

export interface CalculationResults {
  // Transmission loads (Excel structure)
  wallLoad: number; // G8 in Excel (kJ/24Hr)
  ceilingLoad: number; // G9 in Excel (kJ/24Hr)
  floorLoad: number; // G10 in Excel (kJ/24Hr)
  totalTransmissionLoad: number; // Sum of G8:G10

  // Product loads (Excel structure)
  productLoad: number; // G14 in Excel (kJ/24Hr)

  // Respiration load (Excel structure)
  respirationLoad: number; // G17 in Excel (kJ/24Hr)

  // Air change load (Excel structure)
  airChangeLoad: number; // G21 in Excel (kJ/24Hr)

  // Miscellaneous loads (Excel structure)
  equipmentLoad: number; // G25 in Excel (kJ/24Hr)
  occupancyLoad: number; // G27 in Excel (kJ/24Hr)
  lightLoad: number; // G29 in Excel (kJ/24Hr)
  doorHeaterLoad: number; // G33 in Excel (kJ/24Hr)
  compressorLoad?: number; // Compressor air load (from compressorPowerKW x running hours)
  totalMiscLoad: number; // Sum of G25, G27, G29, G33

  // Final results (Excel structure)
  totalLoadKJ: number; // G40 in Excel (kJ/24Hr)
  totalLoadKw: number; // G41 in Excel (kW)
  refrigerationCapacityTR: number; // G42 in Excel (TR)
  capacityIncludingSafety: number; // G43 in Excel (TR with safety)
  finalCapacity: number; // Final capacity after door frequency adjustment (TR)
  safetyFactorPercent: number; // User-defined safety factor percentage
  doorFrequency: 'low' | 'medium' | 'high'; // Door opening frequency
  doorFrequencyMultiplier: number; // Multiplier applied for door frequency

  // Sensible and Latent Heat (Excel structure)
  sensibleHeat: number; // G44 in Excel (kJ/24Hr)
  latentHeat: number; // G45 in Excel (kJ/24Hr)
  sensibleHeatRatio: number; // G46 in Excel (SHR)

  // Air Quantity Required (Excel structure)
  airQtyRequired: number; // G47 in Excel (cfm)

  // Individual TR values (Excel structure)
  wallLoadTR: number; // H8 in Excel (TR)
  ceilingLoadTR: number; // H9 in Excel (TR)
  floorLoadTR: number; // H10 in Excel (TR)
  productLoadTR: number; // H14 in Excel (TR)
  respirationLoadTR: number; // H17 in Excel (TR)
  airChangeLoadTR: number; // H21 in Excel (TR)
  equipmentLoadTR: number; // H25 in Excel (TR)
  occupancyLoadTR: number; // H27 in Excel (TR)
  lightLoadTR: number; // H29 in Excel (TR)
  doorHeaterLoadTR: number; // H33 in Excel (TR)
  compressorLoadTR?: number; // Compressor air load (TR)
  totalLoadTR: number; // H39 in Excel (TR)

  // Temperature differences (Excel structure)
  wallTempDiff: number; // E8 in Excel (K)
  ceilingTempDiff: number; // E9 in Excel (K)
  floorTempDiff: number; // E10 in Excel (K)
  productTempDiff: number; // E14 in Excel (K)

  // Additional Excel matching properties
  internalVolume: number; // D4 in Excel (m³)
  // maximumStorage - removed as it's not used in heat load calculations
}

// Freezer-specific calculation results
export interface FreezerCalculationResults extends CalculationResults {
  // Freezer-specific loads
  beforeFreezingLoad: number;
  latentHeatLoad: number;
  afterFreezingLoad: number;
  totalProductLoad: number;
}
