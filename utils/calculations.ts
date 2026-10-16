import {
  RoomData,
  ProductData,
  MiscellaneousData,
  CalculationResults,
  FreezerProductData,
  FreezerMiscellaneousData,
  FreezerCalculationResults,
} from '@/types/calculation';
import {
  BlastRoomData,
  BlastProductData,
  BlastMiscellaneousData,
  BlastCalculationResults,
} from '@/hooks/BlastStorageProvider';
import { estimateLatentHeat } from '@/data/products';

// Latent heat of fusion for a cold room product: the user / preset value when given,
// otherwise the freezer table value or Siebel's estimate (see estimateLatentHeat).
const getLatentHeatOfFusion = (productData: ProductData): number => {
  if (productData.latentHeatOfFusion !== undefined && productData.latentHeatOfFusion > 0) {
    return productData.latentHeatOfFusion;
  }
  return estimateLatentHeat(productData.productName, productData.cpAboveFreezing);
};

// Unit conversion utilities
export const convertTemperature = (
  value: number,
  fromUnit: 'C' | 'F',
  toUnit: 'C' | 'F',
): number => {
  if (fromUnit === toUnit) return value;
  if (fromUnit === 'C' && toUnit === 'F') return (value * 9) / 5 + 32;
  if (fromUnit === 'F' && toUnit === 'C') return ((value - 32) * 5) / 9;
  return value;
};

export const convertMass = (
  value: number,
  fromUnit: 'kg' | 'lbs',
  toUnit: 'kg' | 'lbs',
): number => {
  if (fromUnit === toUnit) return value;
  if (fromUnit === 'kg' && toUnit === 'lbs') return value * 2.20462;
  if (fromUnit === 'lbs' && toUnit === 'kg') return value / 2.20462;
  return value;
};

export const convertArea = (
  value: number,
  fromUnit: 'm²' | 'ft²',
  toUnit: 'm²' | 'ft²',
): number => {
  if (fromUnit === toUnit) return value;
  if (fromUnit === 'm²' && toUnit === 'ft²') return value * 10.7639;
  if (fromUnit === 'ft²' && toUnit === 'm²') return value / 10.7639;
  return value;
};

export const convertVolume = (
  value: number,
  fromUnit: 'm³' | 'ft³',
  toUnit: 'm³' | 'ft³',
): number => {
  if (fromUnit === toUnit) return value;
  if (fromUnit === 'm³' && toUnit === 'ft³') return value * 35.3147;
  if (fromUnit === 'ft³' && toUnit === 'm³') return value / 35.3147;
  return value;
};

// Length conversion function (for existing cold room and freezer calculations)
export const convertLength = (
  value: number,
  from: 'm' | 'ft',
  to: 'm' | 'ft',
): number => {
  if (from === to) return value;
  if (from === 'ft' && to === 'm') return value * 0.3048;
  if (from === 'm' && to === 'ft') return value / 0.3048;
  return value;
};

// Temperature conversion alias (for compatibility with existing code)
export const convertTemp = (
  value: number,
  from: 'C' | 'F',
  to: 'C' | 'F',
): number => {
  return convertTemperature(value, from, to);
};

// U-factor calculation based on insulation thickness (Excel methodology)
// U = 1 / R_total, where R_total includes insulation, air films, and structural layers
const calculateUFactor = (
  insulationThickness: number,
  insulationType: string = 'PUF',
): number => {
  // Standard thermal conductivity values (W/m·K)
  const thermalConductivity: { [key: string]: number } = {
    PUF: 0.022, // Polyurethane foam - Excel standard
    EPS: 0.036, // Expanded polystyrene
    XPS: 0.029, // Extruded polystyrene
    PIR: 0.022, // Polyisocyanurate
    Fiberglass: 0.04,
  };

  const k = thermalConductivity[insulationType] || thermalConductivity['PUF'];

  // Thermal resistances (m²·K/W)
  const R_inside_air = 0.13; // Internal air film
  const R_outside_air = 0.04; // External air film
  const R_structure = 0.15; // Structural elements (concrete/steel)

  // Insulation resistance: R = thickness(m) / k
  const R_insulation = insulationThickness / 1000 / k; // Convert mm to m

  // Total thermal resistance
  const R_total = R_inside_air + R_insulation + R_structure + R_outside_air;

  // U-factor = 1 / R_total
  return 1 / R_total;
};

// FLOOR U-FACTOR
// Insulated floor: same layered calculation as walls and ceiling.
// Uninsulated floor (thickness 0) on the ground: ISO 13370 slab-on-ground method,
// because the ground under the slab adds its own resistance (a plain air-to-air
// U-factor would overstate the floor load several times).
//   B' = A / (0.5 P)                      characteristic floor dimension (m)
//   dt = w + λg (Rsi + Rf + Rse)          equivalent thickness (m)
//   U  = 2 λg / (π B' + dt) × ln(π B' / dt + 1)   when dt < B'
//   U  = λg / (0.457 B' + dt)                     otherwise
const calculateFloorUFactor = (
  floorInsulationThickness: number,
  insulationType: string,
  lengthM: number,
  widthM: number,
  wallThicknessMm: number,
): number => {
  if (floorInsulationThickness > 0) {
    return calculateUFactor(floorInsulationThickness, insulationType);
  }
  const lambdaGround = 2.0; // W/m·K, clay / silt (ISO 13370 default)
  const R_si = 0.17; // internal surface, heat flow downward
  const R_floor = 0.15; // concrete slab / floor finish (same as structure above)
  const R_se = 0.04;
  const area = lengthM * widthM;
  const perimeter = 2 * (lengthM + widthM);
  if (area <= 0 || perimeter <= 0) return calculateUFactor(0, insulationType);
  const B = area / (0.5 * perimeter);
  const dt = wallThicknessMm / 1000 + lambdaGround * (R_si + R_floor + R_se);
  return dt < B
    ? ((2 * lambdaGround) / (Math.PI * B + dt)) * Math.log((Math.PI * B) / dt + 1)
    : lambdaGround / (0.457 * B + dt);
};

// INTERNAL (NET) VOLUME
// Room length / width / height are entered as outside dimensions (same as the
// reference spreadsheet), so the usable volume is what is left after the panels on
// every side and the floor finish (screed) are taken out.
export const calculateInternalVolume = (
  lengthM: number,
  widthM: number,
  heightM: number,
  wallThicknessMm: number,
  ceilingThicknessMm: number,
  floorThicknessMm: number,
  floorFinishMm: number = 100,
): number => {
  const tWall = wallThicknessMm / 1000;
  const innerLength = lengthM - 2 * tWall;
  const innerWidth = widthM - 2 * tWall;
  const innerHeight =
    heightM - (ceilingThicknessMm + floorThicknessMm + floorFinishMm) / 1000;
  if (innerLength <= 0 || innerWidth <= 0 || innerHeight <= 0) return 0;
  return innerLength * innerWidth * innerHeight;
};

// STORAGE CAPACITY
// Maximum storage (kg) = internal volume (ft³) x gross storage density (kg/ft³).
// The density is a gross figure per ft³ of room volume, so it already allows for
// pallets, aisles, stacking height limits and air-circulation clearances.
export const M3_TO_FT3 = 35.3147;
export const calculateMaximumStorage = (
  internalVolumeM3: number,
  storageDensityKgPerFt3: number,
): number => internalVolumeM3 * M3_TO_FT3 * storageDensityKgPerFt3;

// AIR CHANGES PER 24 HOURS (door openings + infiltration)
// Standard table used across the industry (ASHRAE / Heatcraft / Bohn load
// estimating data): average air changes per 24 h for storage rooms, by room volume.
// [volume ft³, above 0°C (32°F), below 0°C (32°F)]
const AIR_CHANGE_TABLE: [number, number, number][] = [
  [200, 44.0, 33.5],
  [250, 38.0, 29.0],
  [300, 34.5, 26.2],
  [400, 29.5, 22.5],
  [500, 26.0, 20.0],
  [600, 23.0, 18.0],
  [800, 20.0, 15.3],
  [1000, 17.5, 13.5],
  [1500, 14.0, 11.0],
  [2000, 12.0, 9.3],
  [3000, 9.5, 7.4],
  [4000, 8.2, 6.3],
  [5000, 7.2, 5.6],
  [6000, 6.5, 5.0],
  [8000, 5.5, 4.3],
  [10000, 4.9, 3.8],
  [15000, 3.9, 3.0],
  [20000, 3.5, 2.6],
  [25000, 3.0, 2.3],
  [30000, 2.7, 2.1],
  [40000, 2.3, 1.8],
  [50000, 2.0, 1.6],
  [75000, 1.6, 1.3],
  [100000, 1.4, 1.1],
];

// Log-log interpolation between table rows (the table follows a power law);
// clamped to the first / last row outside the table range.
export const getAirChangesPer24h = (
  internalVolumeM3: number,
  roomTempC: number,
): number => {
  const col = roomTempC >= 0 ? 1 : 2;
  const v = internalVolumeM3 * M3_TO_FT3;
  if (v <= AIR_CHANGE_TABLE[0][0]) return AIR_CHANGE_TABLE[0][col];
  const last = AIR_CHANGE_TABLE[AIR_CHANGE_TABLE.length - 1];
  if (v >= last[0]) return last[col];
  for (let i = 1; i < AIR_CHANGE_TABLE.length; i++) {
    const hi = AIR_CHANGE_TABLE[i];
    if (v <= hi[0]) {
      const lo = AIR_CHANGE_TABLE[i - 1];
      const f = Math.log(v / lo[0]) / Math.log(hi[0] / lo[0]);
      return Math.exp(
        Math.log(lo[col]) + f * (Math.log(hi[col]) - Math.log(lo[col])),
      );
    }
  }
  return last[col];
};

// PSYCHROMETRICS (standard atmospheric pressure 101.325 kPa)
const ATM_KPA = 101.325;

// Saturation vapour pressure (kPa): Magnus form over water (>= 0°C) and over ice (< 0°C)
const saturationPressure = (tC: number): number =>
  tC >= 0
    ? 0.61094 * Math.exp((17.625 * tC) / (tC + 243.04))
    : 0.61115 * Math.exp((22.452 * tC) / (tC + 272.55));

// Humidity ratio (kg water / kg dry air)
const humidityRatio = (tC: number, rhPercent: number): number => {
  const pv = (Math.min(Math.max(rhPercent, 0), 100) / 100) * saturationPressure(tC);
  return (0.621945 * pv) / (ATM_KPA - pv);
};

// Moist-air enthalpy (kJ per kg dry air)
export const moistAirEnthalpy = (tC: number, rhPercent: number): number => {
  const w = humidityRatio(tC, rhPercent);
  return 1.006 * tC + w * (2501 + 1.86 * tC);
};

// Heat removed in cooling one litre of infiltrated outside air down to room
// conditions (kJ/L). The litre is counted at room conditions because the air
// changes are expressed as multiples of the room volume.
export const calculateInfiltrationEnthalpy = (
  ambientTempC: number,
  ambientRH: number,
  roomTempC: number,
  roomRH: number,
): number => {
  const dh =
    moistAirEnthalpy(ambientTempC, ambientRH) -
    moistAirEnthalpy(roomTempC, roomRH);
  const wRoom = humidityRatio(roomTempC, roomRH);
  const dryAirDensity =
    ATM_KPA / (0.287042 * (roomTempC + 273.15) * (1 + 1.607858 * wRoom)); // kg dry air / m³
  return Math.max(0, (dh * dryAirDensity) / 1000);
};

export type AirChangeInputs = {
  airChangeRate: number;
  enthalpyDiff: number;
  airChangesPer24h: number;
  dailyAirVolumeM3: number;
  isAuto: boolean;
};

// AIR CHANGE INPUTS
// Auto (default): air changes per 24 h from the room volume, spread over the hours
// of load, and the enthalpy difference from ambient / room temperature and RH.
// Manual: the user's own air change rate (L/s) and enthalpy difference (kJ/L).
export const resolveAirChange = (params: {
  mode?: 'auto' | 'manual';
  manualRate: number;
  manualEnthalpy: number;
  internalVolumeM3: number;
  ambientTempC: number;
  ambientRH: number;
  roomTempC: number;
  roomRH: number;
  hoursOfLoad: number;
}): AirChangeInputs => {
  const hours = params.hoursOfLoad > 0 ? params.hoursOfLoad : 24;
  if (params.mode === 'manual') {
    return {
      airChangeRate: params.manualRate,
      enthalpyDiff: params.manualEnthalpy,
      airChangesPer24h:
        params.internalVolumeM3 > 0
          ? (params.manualRate * 3600 * hours) / 1000 / params.internalVolumeM3
          : 0,
      dailyAirVolumeM3: (params.manualRate * 3600 * hours) / 1000,
      isAuto: false,
    };
  }
  const airChangesPer24h = getAirChangesPer24h(
    params.internalVolumeM3,
    params.roomTempC,
  );
  const dailyAirVolumeM3 = params.internalVolumeM3 * airChangesPer24h;
  return {
    airChangeRate: (dailyAirVolumeM3 * 1000) / (hours * 3600),
    enthalpyDiff: calculateInfiltrationEnthalpy(
      params.ambientTempC,
      params.ambientRH,
      params.roomTempC,
      params.roomRH,
    ),
    airChangesPer24h,
    dailyAirVolumeM3,
    isAuto: true,
  };
};

export const calculateHeatLoad = (
  roomData: RoomData,
  productData: ProductData,
  miscData: MiscellaneousData,
): CalculationResults => {
  // Convert all units to metric for calculation (matching Excel)
  const length = convertLength(roomData.length, roomData.lengthUnit, 'm');
  const width = convertLength(roomData.width, roomData.lengthUnit, 'm');
  const height = convertLength(roomData.height, roomData.lengthUnit, 'm');

  // Apply Daily Loading % to total capacity
  const totalCapacityKg = convertMass(
    productData.massBeforeFreezing,
    productData.massUnit,
    'kg',
  );
  const dailyLoadingPercent = productData.dailyLoadingPercent ?? 100;
  const productMass = (totalCapacityKg * dailyLoadingPercent) / 100;
  const respirationMassKg = (totalCapacityKg * dailyLoadingPercent) / 100;

  console.log(
    `[Daily Loading] Total Capacity: ${totalCapacityKg} kg, Daily Loading: ${dailyLoadingPercent}%, Actual Mass: ${productMass.toFixed(
      2,
    )} kg`,
  );

  // Convert temperatures to Celsius for calculation
  const ambientTempC = convertTemp(
    miscData.ambientTemp,
    miscData.tempUnit,
    'C',
  );
  const roomTempC = convertTemp(miscData.roomTemp, miscData.tempUnit, 'C');
  const productIncomingC = convertTemp(
    productData.enteringTemp,
    productData.tempUnit,
    'C',
  );
  const productOutgoingC = convertTemp(
    productData.finalTemp,
    productData.tempUnit,
    'C',
  );

  // Calculate temperature differences (Excel exact logic)
  const wallTempDiff = ambientTempC - roomTempC;
  const ceilingTempDiff = ambientTempC - roomTempC;
  const floorTempDiff = 28 - roomTempC; // Excel uses 28°C for floor, not ambient temp
  const productTempDiff = productIncomingC - productOutgoingC;

  // Calculate areas
  // Wall area = perimeter x height = 2*(L+B)*H
  // (was previously 2*(B+H)*L, which mixes height into the perimeter and
  //  multiplies by length - that inflated the wall area on any room where L != H)
  const totalWallArea = 2 * (length + width) * height;
  const ceilingArea = length * width;
  const floorArea = length * width;

  // Internal (net) volume: outside dimensions minus panels and floor finish
  const internalVolume = calculateInternalVolume(
    length,
    width,
    height,
    roomData.wallInsulationThickness,
    roomData.ceilingInsulationThickness,
    roomData.floorInsulationThickness,
    roomData.floorFinishThickness ?? 100,
  );

  // Storage capacity: internal volume (ft³) x gross storage density (kg/ft³)
  const storageDensity = productData.storageDensity ?? 8;
  const maximumStorage = calculateMaximumStorage(internalVolume, storageDensity);

  // Calculate U-factors based on insulation thickness (Excel methodology)
  // A thickness of 0 means "no insulation" (only air films + structure remain).
  const wallUFactor = calculateUFactor(
    roomData.wallInsulationThickness,
    roomData.insulationType,
  );
  const ceilingUFactor = calculateUFactor(
    roomData.ceilingInsulationThickness,
    roomData.insulationType,
  );
  const floorUFactor = calculateFloorUFactor(
    roomData.floorInsulationThickness,
    roomData.insulationType,
    length,
    width,
    roomData.wallInsulationThickness,
  );

  // TRANSMISSION LOADS (kJ/24Hr) - EXACT Excel formulas
  // Excel: =((E8*D8*C8)/1000)*3600*F8
  const wallLoad =
    ((wallTempDiff * totalWallArea * wallUFactor) / 1000) *
    3600 *
    roomData.wallHours;
  const ceilingLoad =
    ((ceilingTempDiff * ceilingArea * ceilingUFactor) / 1000) *
    3600 *
    roomData.ceilingHours;
  const floorLoad =
    ((floorTempDiff * floorArea * floorUFactor) / 1000) *
    3600 *
    roomData.floorHours;
  const totalTransmissionLoad = wallLoad + ceilingLoad + floorLoad;

  // PRODUCT LOAD — Refrigeration Product Load Master Equation
  // Q = m × [Ca(Tin − Tf) + L + Cb(Tf − Tout)] / (CoolingTime × 3600)
  //
  // Q  = Product refrigeration load (kW)
  // m  = Daily product loading (kg)
  // Ca = Specific heat ABOVE freezing (kJ/kg·°C)
  // Cb = Specific heat BELOW freezing (kJ/kg·°C)
  // L  = Latent heat of freezing (kJ/kg)
  // Tin  = Incoming product temperature (°C)
  // Tf   = Freezing temperature of the product (°C)
  // Tout = Final storage temperature (°C)
  // CoolingTime = Pull-down / cooling time (hours)
  // 3600 = hours → seconds conversion
  //
  // Three possible cooling stages with automatic case detection:
  //   1) Cooling above freezing  → Ca(Tin − Tf)
  //   2) Freezing (phase change) → L
  //   3) Cooling below freezing  → Cb(Tf − Tout)

  const Tin_cr = productIncomingC; // Incoming product temperature (°C)
  const Tf_cr = productData.freezingPoint ?? -100; // Freezing point (°C), default very low if not set
  const Tout_cr = productOutgoingC; // Final storage temperature (°C)
  const Ca_cr = productData.cpAboveFreezing; // kJ/kg·°C
  const Cb_cr = productData.cpBelowFreezing ?? productData.cpAboveFreezing; // kJ/kg·°C, fallback to Ca
  const L_cr = getLatentHeatOfFusion(productData); // kJ/kg, lookup from freezerProducts if not provided
  const m_cr = productMass; // kg (daily loading mass)
  const coolingTime_cr = productData.pullDownHours; // hours

  // CORRECT ENGINEERING LOGIC:
  // Each term activates only when temperature crosses its region
  let Q_per_kg = 0; // Total energy per kg (kJ/kg)

  // Term 1: Cooling ABOVE freezing (if Tin > Tf)
  if (Tin_cr > Tf_cr) {
    Q_per_kg += Ca_cr * Math.max(0, Tin_cr - Math.max(Tout_cr, Tf_cr));
  }

  // Term 2: Latent heat (ONLY if Tin > Tf AND Tout < Tf)
  if (Tin_cr > Tf_cr && Tout_cr < Tf_cr) {
    Q_per_kg += L_cr;
  }

  // Term 3: Cooling BELOW freezing (if Tout < Tf)
  if (Tout_cr < Tf_cr) {
    Q_per_kg += Cb_cr * Math.max(0, Math.min(Tin_cr, Tf_cr) - Tout_cr);
  }

  // For logging breakdown:
  const aboveFreezingTerm_cr = Tin_cr > Tf_cr ? Ca_cr * Math.max(0, Tin_cr - Math.max(Tout_cr, Tf_cr)) : 0;
  const latentTerm_cr = (Tin_cr > Tf_cr && Tout_cr < Tf_cr) ? L_cr : 0;
  const belowFreezingTerm_cr = Tout_cr < Tf_cr ? Cb_cr * Math.max(0, Math.min(Tin_cr, Tf_cr) - Tout_cr) : 0;

  // Master equation → Q in kW
  const productLoadKW_cr = (m_cr * Q_per_kg) / (coolingTime_cr * 3600);

  // Convert to kJ/24Hr for internal consistency with rest of calculation pipeline
  const productLoadBase = productLoadKW_cr * 24 * 3600;

  const productLoadCase_cr =
    Tin_cr > Tf_cr && Tout_cr > Tf_cr
      ? '1 (above freezing only)'
      : Tin_cr <= Tf_cr && Tout_cr < Tf_cr
        ? '2 (below freezing only)'
        : '3 (freezing occurs)';
  console.log(
    `[Cold Room - Product Load Master Eq] Case: ${productLoadCase_cr}`,
  );
  console.log(
    `[Cold Room - Product Load Master Eq] Tin=${Tin_cr}°C, Tf=${Tf_cr}°C, Tout=${Tout_cr}°C, m=${m_cr}kg, CT=${coolingTime_cr}hrs`,
  );
  console.log(
    `[Cold Room - Product Load Master Eq] Above=${aboveFreezingTerm_cr.toFixed(2)}, Latent=${latentTerm_cr.toFixed(2)}, Below=${belowFreezingTerm_cr.toFixed(2)} → Q=${productLoadKW_cr.toFixed(4)} kW`,
  );

  // Apply Inside RH Correction to Product Load
  // Formula: Q_adj,RH_in = Q_base × [1 + k × (RH_ref - RH_in) / 10]
  // Where: RH_ref = 85%, k = 0.05 (5% per 10% RH change)
  const insideRH = miscData.insideRoomRH ?? 85;
  const RH_ref_inside = 85;
  const k_inside = 0.05;
  const rhCorrectionInside = 1 + k_inside * ((RH_ref_inside - insideRH) / 10);
  const productLoad = productLoadBase * rhCorrectionInside;

  console.log(
    `[RH Correction - Product Load] Base: ${productLoadBase.toFixed(
      2,
    )} kJ/24hr, Inside RH: ${insideRH}%, Correction Factor: ${rhCorrectionInside.toFixed(
      4,
    )}, Adjusted: ${productLoad.toFixed(2)} kJ/24hr`,
  );

  // RESPIRATION LOAD (kJ/24Hr) - EXACT Excel formula
  // Excel: =(C17*D17*3.6*24/1000) = (Mass * Watts/Tonne * 3.6 * 24) / 1000
  const respirationLoad =
    (respirationMassKg * productData.watts * 3.6 * 24) / 1000;

  // AIR CHANGE LOAD (kJ/24Hr) - Excel formula
  // Excel: =C21*D21*3600*F21 = Air change rate * Enthalpy diff * 3600 * Hours
  // In auto mode the rate comes from the room volume (standard air changes per 24 h)
  // and the enthalpy difference from ambient / room temperature and RH.
  const ambientRH = miscData.ambientRH ?? 55;
  const airChange = resolveAirChange({
    mode: miscData.airChangeMode ?? 'auto',
    manualRate: miscData.airChangeRate,
    manualEnthalpy: miscData.enthalpyDiff,
    internalVolumeM3: internalVolume,
    ambientTempC,
    ambientRH,
    roomTempC,
    roomRH: insideRH,
    hoursOfLoad: miscData.hoursOfLoad,
  });
  const airChangeLoadBase =
    airChange.airChangeRate *
    airChange.enthalpyDiff *
    3600 *
    miscData.hoursOfLoad;

  // Ambient RH correction for a manually entered enthalpy difference:
  // Q_adj = Q_base × [1 + 0.05 × (RH_ambient - 55) / 10].
  // Not applied in auto mode, where RH is already inside the enthalpy calculation.
  const RH_ref_ambient = 55;
  const k_ambient = 0.05;
  const rhCorrectionAmbient = airChange.isAuto
    ? 1
    : 1 + k_ambient * ((ambientRH - RH_ref_ambient) / 10);
  const airChangeLoad = airChangeLoadBase * rhCorrectionAmbient;

  console.log(
    `[RH Correction - Air Change Load] Base: ${airChangeLoadBase.toFixed(
      2,
    )} kJ/24hr, Ambient RH: ${ambientRH}%, Correction Factor: ${rhCorrectionAmbient.toFixed(
      4,
    )}, Adjusted: ${airChangeLoad.toFixed(2)} kJ/24hr`,
  );

  // EQUIPMENT LOAD (kJ/24Hr) - EXACT Excel formula
  // Excel: =(C25*D25*3600*F25) = Fan Rating * Quantity * 3600 * Hours
  const equipmentLoad =
    miscData.fanMotorRating *
    miscData.fanQuantity *
    3600 *
    miscData.equipmentUsageHours;

  // OCCUPANCY LOAD (kJ/24Hr) - EXACT Excel formula
  // Excel: =(C27*D27*F27)*3600 = People * Heat per person * Hours * 3600
  const occupancyLoad =
    miscData.occupancyCount *
    miscData.occupancyHeatEquiv *
    miscData.occupancyUsageHours *
    3600;

  // LIGHT LOAD (kJ/24Hr) - EXACT Excel formula
  // Excel: =(C29*3600*F29) = Light power * 3600 * Hours
  // C29 should be user input in Watts, convert to kW
  const lightPower = miscData.lightPower / 1000; // Convert W to kW
  const lightLoad = lightPower * 3600 * miscData.lightUsageHours;

  // DOOR HEATERS LOAD (kJ/24Hr) - EXACT Excel formula
  // Excel: =C33*D33*3600*F33 where C33 = (((D62+E62)*2)/1000)*0.025
  // Door perimeter = 2 * (width + height) - this is the correct formula
  let doorWidth = miscData.doorClearOpeningWidth || 900; // default value
  let doorHeight = miscData.doorClearOpeningHeight || 2000; // default value

  // Convert to mm if units are in meters
  if (miscData.doorDimensionUnit === 'm') {
    doorWidth = doorWidth * 1000; // Convert m to mm
    doorHeight = doorHeight * 1000; // Convert m to mm
  }

  const doorPerimeter = ((doorWidth + doorHeight) * 2) / 1000; // Convert mm to m
  const doorHeaterCapacity = doorPerimeter * 0.025; // Excel formula: 0.025 kW per meter of door perimeter
  const doorHeaterLoad =
    doorHeaterCapacity *
    miscData.doorHeaterQuantity *
    3600 *
    miscData.doorHeaterUsageHours;

  const totalMiscLoad =
    equipmentLoad + occupancyLoad + lightLoad + doorHeaterLoad;

  // TOTAL LOAD CALCULATIONS - EXACT Excel formulas
  const totalLoadKJ =
    wallLoad +
    ceilingLoad +
    floorLoad +
    productLoad +
    respirationLoad +
    airChangeLoad +
    equipmentLoad +
    occupancyLoad +
    lightLoad +
    doorHeaterLoad;

  // Convert to kW (Excel: G41 = G40/(24*3600))
  const totalLoadKwBase = totalLoadKJ / (24 * 3600);

  // NEW: Apply Compressor Running Hours Adjustment
  // Formula: Q_adjusted = Q_total × (24 / Compressor running hours)
  // If compressor runs fewer hours, capacity must be higher to meet same daily load
  const compressorHours = miscData.compressorRunningHours ?? 18;
  const hoursAdjustmentFactor = 24 / compressorHours;
  const totalLoadKw = totalLoadKwBase * hoursAdjustmentFactor;

  console.log(
    `[Compressor Hours Adjustment] Base Load: ${totalLoadKwBase.toFixed(
      2,
    )} kW, Running Hours: ${compressorHours} hrs/day, Adjustment Factor: ${hoursAdjustmentFactor.toFixed(
      4,
    )}, Adjusted Load: ${totalLoadKw.toFixed(2)} kW`,
  );

  // Refrigeration capacity in TR (Excel: G42 = G41/3.517)
  const refrigerationCapacityTR = totalLoadKw / 3.517;

  // Capacity including safety (Excel: G43 = G42*(100+D43)/100)
  const safetyFactorPercent = miscData.capacityIncludingSafety ?? 20;
  const capacityIncludingSafety =
    (refrigerationCapacityTR * (100 + safetyFactorPercent)) / 100;

  // NEW: Apply door opening frequency adjustment AFTER safety factor
  // Low: 0% (1.0x), Medium: +5% (1.05x), High: +10% (1.10x)
  const doorFrequency = miscData.doorOpeningFrequency || 'low';
  const doorFrequencyMultiplier =
    doorFrequency === 'high' ? 1.1 : doorFrequency === 'medium' ? 1.05 : 1.0;
  const finalCapacity = capacityIncludingSafety * doorFrequencyMultiplier;

  console.log('🚪 Door frequency adjustment:', {
    doorFrequency,
    multiplier: doorFrequencyMultiplier,
    capacityBeforeDoor: capacityIncludingSafety.toFixed(3),
    finalCapacity: finalCapacity.toFixed(3),
  });

  // Individual TR calculations (Excel: =G8/(3600*3.517*24))
  // The same compressor-running-hours factor that is applied to the total must be
  // applied here as well, otherwise the breakdown does not add up to the total TR.
  const trConversionFactor = (3600 * 3.517 * 24) / hoursAdjustmentFactor;
  const wallLoadTR = wallLoad / trConversionFactor;
  const ceilingLoadTR = ceilingLoad / trConversionFactor;
  const floorLoadTR = floorLoad / trConversionFactor;
  const productLoadTR = productLoad / trConversionFactor;
  const respirationLoadTR = respirationLoad / trConversionFactor;
  const airChangeLoadTR = airChangeLoad / trConversionFactor;
  const equipmentLoadTR = equipmentLoad / trConversionFactor;
  const occupancyLoadTR = occupancyLoad / trConversionFactor;
  const lightLoadTR = lightLoad / trConversionFactor;
  const doorHeaterLoadTR = doorHeaterLoad / trConversionFactor;
  const totalLoadTR =
    wallLoadTR +
    ceilingLoadTR +
    floorLoadTR +
    productLoadTR +
    respirationLoadTR +
    airChangeLoadTR +
    equipmentLoadTR +
    occupancyLoadTR +
    lightLoadTR +
    doorHeaterLoadTR;

  // Sensible and Latent Heat
  // Only the genuinely moisture-related fractions belong in the latent bucket:
  //   - the phase-change (latent heat of fusion) part of the product load
  //   - 60% of the infiltration/air-change load
  //   - 60% of the occupancy load (people are ~40% sensible in a cold space)
  // Respiration heat is sensible, not latent, and transmission/equipment/lighting
  // /door-heater loads are fully sensible. sensibleHeat + latentHeat === totalLoadKJ.
  const productLatentLoad =
    ((m_cr * latentTerm_cr * 24) / coolingTime_cr) * rhCorrectionInside;
  const productSensibleLoad = productLoad - productLatentLoad;

  const sensibleHeat =
    wallLoad +
    ceilingLoad +
    floorLoad +
    productSensibleLoad +
    respirationLoad +
    0.4 * airChangeLoad +
    equipmentLoad +
    0.4 * occupancyLoad +
    lightLoad +
    doorHeaterLoad;
  const latentHeat =
    productLatentLoad + 0.6 * airChangeLoad + 0.6 * occupancyLoad;
  const sensibleHeatRatio =
    totalLoadKJ > 0 ? sensibleHeat / totalLoadKJ : 0;

  // Air Quantity Required (Excel: G47 = ((G42*12000)*G46)/(5*1.08))
  const airQtyRequired =
    (refrigerationCapacityTR * 12000 * sensibleHeatRatio) / (5 * 1.08);


  return {
    // Transmission loads (kJ/24Hr)
    wallLoad,
    ceilingLoad,
    floorLoad,
    totalTransmissionLoad,

    // Product loads (kJ/24Hr)
    productLoad,

    // Respiration load (kJ/24Hr)
    respirationLoad,

    // Air change load (kJ/24Hr)
    airChangeLoad,

    // Miscellaneous loads (kJ/24Hr)
    equipmentLoad,
    occupancyLoad,
    lightLoad,
    doorHeaterLoad,
    totalMiscLoad,

    // Final results
    totalLoadKJ,
    totalLoadKw,
    refrigerationCapacityTR,
    capacityIncludingSafety,
    finalCapacity,
    safetyFactorPercent,
    doorFrequency,
    doorFrequencyMultiplier,

    // Sensible and Latent Heat
    sensibleHeat,
    latentHeat,
    sensibleHeatRatio,

    // Air Quantity Required
    airQtyRequired,

    // Individual TR values
    wallLoadTR,
    ceilingLoadTR,
    floorLoadTR,
    productLoadTR,
    respirationLoadTR,
    airChangeLoadTR,
    equipmentLoadTR,
    occupancyLoadTR,
    lightLoadTR,
    doorHeaterLoadTR,
    totalLoadTR,

    // Temperature differences
    wallTempDiff,
    ceilingTempDiff,
    floorTempDiff,
    productTempDiff,

    // Additional Excel matching properties
    internalVolume,
    storageDensity,
    maximumStorage,

    // Air change inputs actually used
    airChangeRateUsed: airChange.airChangeRate,
    enthalpyDiffUsed: airChange.enthalpyDiff,
    airChangesPer24h: airChange.airChangesPer24h,
    airChangeIsAuto: airChange.isAuto,
  };
};

// FREEZER CALCULATIONS - Based on Excel formulas EXACTLY
export const calculateFreezerHeatLoad = (
  roomData: RoomData,
  productData: FreezerProductData,
  miscData: FreezerMiscellaneousData,
): FreezerCalculationResults => {
  // Convert all units to metric for calculation (matching Excel)
  const length = convertLength(roomData.length, roomData.lengthUnit, 'm');
  const width = convertLength(roomData.width, roomData.lengthUnit, 'm');
  const height = convertLength(roomData.height, roomData.lengthUnit, 'm');

  // Apply Daily Loading % to total capacity
  const totalCapacityKg = convertMass(
    productData.massBeforeFreezing,
    productData.massUnit,
    'kg',
  );
  const dailyLoadingPercent = productData.dailyLoadingPercent ?? 100;
  const productMass = (totalCapacityKg * dailyLoadingPercent) / 100;
  const dailyLoadingKg = productMass; // For freezer, daily loading = actual mass being processed
  const respirationMassKg = (totalCapacityKg * dailyLoadingPercent) / 100;

  console.log(
    `[Freezer - Daily Loading] Total Capacity: ${totalCapacityKg} kg, Daily Loading: ${dailyLoadingPercent}%, Actual Mass: ${productMass.toFixed(
      2,
    )} kg`,
  );

  // Convert temperatures to Celsius for calculation
  const ambientTempC = convertTemp(
    miscData.ambientTemp,
    miscData.tempUnit,
    'C',
  );
  const roomTempC = convertTemp(miscData.roomTemp, miscData.tempUnit, 'C');
  const productIncomingC = convertTemp(
    miscData.productIncoming,
    miscData.tempUnit,
    'C',
  );
  const productOutgoingC = convertTemp(
    miscData.productOutgoing,
    miscData.tempUnit,
    'C',
  );
  const freezingPointC = productData.freezingPoint;

  // Calculate temperature differences (Excel exact logic)
  const wallTempDiff = ambientTempC - roomTempC;
  const ceilingTempDiff = ambientTempC - roomTempC;
  const floorTempDiff = 28 - roomTempC; // Excel uses 28°C for floor, not ambient temp

  // Calculate areas EXACTLY as Excel
  // Wall area calculation: 2*(L*H) + 2*(B*H)
  const wallArea1 = length * height * 2; // Two walls (length sides)
  const wallArea2 = width * height * 2; // Two walls (width sides)
  const totalWallArea = wallArea1 + wallArea2;
  const ceilingArea = length * width;
  const floorArea = length * width;

  // Internal (net) volume and storage capacity (same method as the cold room)
  const internalVolume = calculateInternalVolume(
    length,
    width,
    height,
    roomData.wallInsulationThickness,
    roomData.ceilingInsulationThickness,
    roomData.floorInsulationThickness,
    roomData.floorFinishThickness ?? 100,
  );
  const storageDensity = productData.storageDensity ?? 10;
  const maximumStorage = calculateMaximumStorage(internalVolume, storageDensity);

  // Calculate U-factors based on insulation thickness (Excel methodology)
  const wallUFactor = calculateUFactor(
    roomData.wallInsulationThickness,
    roomData.insulationType,
  );
  const ceilingUFactor = calculateUFactor(
    roomData.ceilingInsulationThickness,
    roomData.insulationType,
  );
  const floorUFactor = calculateFloorUFactor(
    roomData.floorInsulationThickness,
    roomData.insulationType,
    length,
    width,
    roomData.wallInsulationThickness,
  );

  // TRANSMISSION LOADS (kJ/24Hr) - EXACT Excel formulas
  // Excel: =((E8*D8*C8)/1000)*3600*F8
  const wallLoad =
    ((wallTempDiff * totalWallArea * wallUFactor) / 1000) *
    3600 *
    roomData.wallHours;
  const ceilingLoad =
    ((ceilingTempDiff * ceilingArea * ceilingUFactor) / 1000) *
    3600 *
    roomData.ceilingHours;
  const floorLoad =
    ((floorTempDiff * floorArea * floorUFactor) / 1000) *
    3600 *
    roomData.floorHours;
  const totalTransmissionLoad = wallLoad + ceilingLoad + floorLoad;

  // PRODUCT LOAD — Refrigeration Product Load Master Equation
  // Q = m × [Ca(Tin − Tf) + L + Cb(Tf − Tout)] / (CoolingTime × 3600)
  //
  // Q  = Product refrigeration load (kW)
  // m  = Daily product loading (kg)
  // Ca = Specific heat ABOVE freezing (kJ/kg·°C)
  // Cb = Specific heat BELOW freezing (kJ/kg·°C)
  // L  = Latent heat of freezing (kJ/kg)
  // Tin  = Incoming product temperature (°C)
  // Tf   = Freezing temperature of the product (°C)
  // Tout = Final storage temperature (°C)
  // CoolingTime = Pull-down / cooling time (hours)
  // 3600 = hours → seconds conversion
  //
  // Three possible cooling stages with automatic case detection:
  //   1) Cooling above freezing  → Ca(Tin − Tf)
  //   2) Freezing (phase change) → L
  //   3) Cooling below freezing  → Cb(Tf − Tout)

  const Tin = productIncomingC; // Incoming product temperature (°C)
  const Tf = freezingPointC; // Product freezing point (°C)
  const Tout = productOutgoingC; // Final storage temperature (°C)
  const Ca = productData.cpAboveFreezing; // kJ/kg·°C
  const Cb = productData.cpBelowFreezing; // kJ/kg·°C
  const L = productData.latentHeatOfFusion; // kJ/kg
  const m = dailyLoadingKg; // kg (daily loading mass)
  const coolingTime = productData.pullDownHours; // hours

  // CORRECT ENGINEERING LOGIC:
  // Each term activates only when temperature crosses its region
  let Q_per_kg_fz = 0; // Total energy per kg (kJ/kg)

  // Term 1: Cooling ABOVE freezing (if Tin > Tf)
  if (Tin > Tf) {
    Q_per_kg_fz += Ca * Math.max(0, Tin - Math.max(Tout, Tf));
  }

  // Term 2: Latent heat (ONLY if Tin > Tf AND Tout < Tf)
  if (Tin > Tf && Tout < Tf) {
    Q_per_kg_fz += L;
  }

  // Term 3: Cooling BELOW freezing (if Tout < Tf)
  if (Tout < Tf) {
    Q_per_kg_fz += Cb * Math.max(0, Math.min(Tin, Tf) - Tout);
  }

  // For logging breakdown:
  const aboveFreezingTerm = Tin > Tf ? Ca * Math.max(0, Tin - Math.max(Tout, Tf)) : 0;
  const latentTerm = (Tin > Tf && Tout < Tf) ? L : 0;
  const belowFreezingTerm = Tout < Tf ? Cb * Math.max(0, Math.min(Tin, Tf) - Tout) : 0;

  // Master equation → Q in kW
  const productLoadKW = (m * Q_per_kg_fz) / (coolingTime * 3600);

  // Convert individual phase loads to kJ/24Hr for internal consistency
  // (kW → kJ/24Hr  =  kW × 24 × 3600, which simplifies to m × term × 24 / coolingTime)
  const beforeFreezingLoad = (m * aboveFreezingTerm * 24) / coolingTime;
  const latentHeatLoad = (m * latentTerm * 24) / coolingTime;
  const afterFreezingLoad = (m * belowFreezingTerm * 24) / coolingTime;

  const totalProductLoad =
    beforeFreezingLoad + latentHeatLoad + afterFreezingLoad;
  const productLoad = totalProductLoad; // For compatibility with base interface

  const productLoadCase =
    Tin > Tf && Tout > Tf
      ? '1 (above freezing only)'
      : Tin <= Tf && Tout < Tf
        ? '2 (below freezing only)'
        : '3 (freezing occurs)';
  console.log(`[Freezer - Product Load Master Eq] Case: ${productLoadCase}`);
  console.log(
    `[Freezer - Product Load Master Eq] Tin=${Tin}°C, Tf=${Tf}°C, Tout=${Tout}°C, m=${m}kg, CT=${coolingTime}hrs`,
  );
  console.log(
    `[Freezer - Product Load Master Eq] Above=${aboveFreezingTerm.toFixed(2)}, Latent=${latentTerm.toFixed(2)}, Below=${belowFreezingTerm.toFixed(2)} → Q=${productLoadKW.toFixed(4)} kW`,
  );

  // RESPIRATION LOAD (kJ/24Hr) - EXACT Excel formula
  // Excel: =(C19*D19*3.6*24/1000) where C19=D51 (daily loading)
  const respirationLoad =
    (dailyLoadingKg * productData.watts * 3.6 * 24) / 1000;

  // AIR CHANGE LOAD (kJ/24Hr) - Excel formula
  // Excel: =C23*D23*3600*F23
  // Auto mode: air changes from the room volume (below-0°C column of the standard
  // table) and the enthalpy difference from ambient / room temperature and RH.
  const airChange = resolveAirChange({
    mode: miscData.airChangeMode ?? 'auto',
    manualRate: miscData.airChangeRate,
    manualEnthalpy: miscData.enthalpyDiff,
    internalVolumeM3: internalVolume,
    ambientTempC,
    ambientRH: miscData.ambientRH ?? 55,
    roomTempC,
    roomRH: miscData.insideRoomRH ?? 85,
    hoursOfLoad: miscData.hoursOfLoad,
  });
  const airChangeLoad =
    airChange.airChangeRate *
    airChange.enthalpyDiff *
    3600 *
    miscData.hoursOfLoad;

  // MISCELLANEOUS LOADS (kJ/24Hr) - EXACT Excel calculations

  // Fan Motor Rating - Excel shows 0.37 KW with Quantity 3, Usage 16/24 hrs
  // NOTE: `??` (not `||`) so that a deliberate user entry of 0 is respected.
  const fanMotorRating = miscData.fanMotorRating ?? 0.37; // kW per fan
  const fanQuantity = miscData.fanQuantity ?? 6; // Number of fans
  const fanUsageHours = miscData.fanUsageHours ?? 24; // Hours of usage
  const fanMotorLoad = fanMotorRating * fanQuantity * 3600 * fanUsageHours;

  // No of people - Excel shows 4 with Heat Equiv 0.407 kW
  const numberOfPeople = miscData.numberOfPeople ?? 4;
  const peopleUsageFactor = miscData.peopleUsageFactor ?? 0.407; // kW heat equiv
  const peopleLoad =
    numberOfPeople * peopleUsageFactor * 3600 * miscData.occupancyUsageHours;

  // Light load - Excel shows 0.14 kW with Usage 16 hrs
  const lightPowerKw = miscData.lightPowerKw ?? 0.14;
  const lightUsageHrs = miscData.lightUsageHours ?? 16;
  const lightLoadExact = lightPowerKw * 3600 * lightUsageHrs;

  // Heater capacity - Excel shows different heater types (continuous operation)
  // Peripheral heaters
  const peripheralHeaterPower = miscData.peripheralHeaterPower ?? 1.5; // kW per heater
  const peripheralHeaterQuantity = miscData.peripheralHeaterQuantity ?? 8; // Number of heaters
  const peripheralHeatersLoad =
    peripheralHeaterPower * peripheralHeaterQuantity * 3600 * 24; // 24 hrs continuous

  // Door heaters - Excel formula: =IF(D59>5.(((D68+E68)*2)/1000)*0.025.(((D68+E68)*2)/1000)*0.045)
  let doorWidth = miscData.doorClearOpeningWidth ?? 900; // default value
  let doorHeight = miscData.doorClearOpeningHeight ?? 1800; // default value

  // Convert to mm if units are in meters
  if (miscData.doorDimensionUnit === 'm') {
    doorWidth = doorWidth * 1000; // Convert m to mm
    doorHeight = doorHeight * 1000; // Convert m to mm
  }

  const doorPerimeter = (doorWidth + doorHeight) * 2; // mm
  const doorPerimeterM = doorPerimeter / 1000; // convert to meters

  // Excel logic: if room temp > 5°C, use 0.025, else use 0.045
  const doorHeaterFactor = roomTempC > 5 ? 0.025 : 0.045;
  // Use the user-entered door heater power when supplied (the Miscellaneous screen
  // exposes this field); otherwise derive it from the door perimeter.
  const doorHeaterPower =
    miscData.doorHeaterPower ?? doorPerimeterM * doorHeaterFactor; // kW per door
  const doorHeaterQuantity = miscData.doorHeaterQuantity ?? 1; // Number of doors
  const doorHeatersLoad = doorHeaterPower * doorHeaterQuantity * 3600 * 24; // 24 hrs continuous

  // Tray heaters - Excel shows 2 kW, 2 heaters, 2 hrs
  const trayHeaterPower = miscData.trayHeaterPower ?? 2; // kW per tray
  const trayHeaterQuantity = miscData.trayHeaterQuantity ?? 2; // Number of trays
  const trayHeatersLoad = trayHeaterPower * trayHeaterQuantity * 3600 * 2; // 2 hrs usage

  // Drain heaters
  const drainHeaterPower = miscData.drainHeaterPower ?? 0.04; // kW per drain
  const drainHeaterQuantity = miscData.drainHeaterQuantity ?? 1; // Number of drains
  const drainHeatersLoad = drainHeaterPower * drainHeaterQuantity * 3600 * 24; // 24 hrs continuous

  // Total heater load
  const heaterLoad =
    peripheralHeatersLoad +
    doorHeatersLoad +
    trayHeatersLoad +
    drainHeatersLoad;

  // Equipment load (using fan motor load calculated above)
  const equipmentLoad = fanMotorLoad;

  // Occupancy load (using people load calculated above)
  const occupancyLoad = peopleLoad;

  // Light load (using exact calculation above)
  const lightLoad = lightLoadExact;

  // Steam humidifiers: Excel shows 0 for freezer
  const steamHumidifierLoad = 0;

  // COMPRESSOR AIR LOAD (kJ/24Hr)
  // The Miscellaneous screen exposes "Compressor Power (kW)" and "Compressor
  // Running Hours (hrs/day)"; both were previously collected but never used in any
  // formula, so changing them had no effect on the result. Same shape as every
  // other miscellaneous load: kW x 3600 s/h x hours. Both default to 0.
  const compressorLoad =
    (miscData.compressorPowerKW ?? 0) *
    3600 *
    (miscData.compressorAirRunningHours ?? 0);

  const totalMiscLoad =
    equipmentLoad +
    occupancyLoad +
    lightLoad +
    heaterLoad +
    compressorLoad +
    steamHumidifierLoad;

  // TOTAL LOAD CALCULATIONS - EXACT Excel formulas
  const totalLoadKJ =
    totalTransmissionLoad +
    totalProductLoad +
    respirationLoad +
    airChangeLoad +
    totalMiscLoad;

  // Convert to kW (Excel: G41 = G40/(24*3600))
  const totalLoadKw = totalLoadKJ / (24 * 3600);

  // Refrigeration capacity in TR (Excel: G42 = G41/3.517)
  const refrigerationCapacityTR = totalLoadKw / 3.517;

  // Capacity including safety (Excel: G43 = G42*(100+D43)/100)
  const safetyFactorPercent = miscData.capacityIncludingSafety ?? 20;
  const capacityTR =
    (refrigerationCapacityTR * (100 + safetyFactorPercent)) / 100;

  // NEW: Apply door opening frequency adjustment AFTER safety factor
  // Low: 0% (1.0x), Medium: +5% (1.05x), High: +10% (1.10x)
  const doorFrequency = miscData.doorOpeningFrequency || 'low';
  const doorFrequencyMultiplier =
    doorFrequency === 'high' ? 1.1 : doorFrequency === 'medium' ? 1.05 : 1.0;
  const finalCapacity = capacityTR * doorFrequencyMultiplier;

  console.log('🚪 [Freezer] Door frequency adjustment:', {
    doorFrequency,
    multiplier: doorFrequencyMultiplier,
    capacityBeforeDoor: capacityTR.toFixed(3),
    finalCapacity: finalCapacity.toFixed(3),
  });

  // Individual TR calculations (Excel: =G8/(3600*3.517*24))
  const trConversionFactor = 3600 * 3.517 * 24;
  const wallLoadTR = wallLoad / trConversionFactor;
  const ceilingLoadTR = ceilingLoad / trConversionFactor;
  const floorLoadTR = floorLoad / trConversionFactor;
  const productLoadTR = totalProductLoad / trConversionFactor;
  const respirationLoadTR = respirationLoad / trConversionFactor;
  const airChangeLoadTR = airChangeLoad / trConversionFactor;
  const equipmentLoadTR = equipmentLoad / trConversionFactor;
  const occupancyLoadTR = occupancyLoad / trConversionFactor;
  const lightLoadTR = lightLoad / trConversionFactor;
  const heaterLoadTR = heaterLoad / trConversionFactor;
  const compressorLoadTR = compressorLoad / trConversionFactor;
  const totalLoadTR =
    wallLoadTR +
    ceilingLoadTR +
    floorLoadTR +
    productLoadTR +
    respirationLoadTR +
    airChangeLoadTR +
    equipmentLoadTR +
    occupancyLoadTR +
    lightLoadTR +
    heaterLoadTR +
    compressorLoadTR;

  // Sensible and Latent Heat
  // The latent bucket holds the phase-change part of the product load plus the
  // moisture-driven fractions of infiltration and occupancy. The previous version
  // dropped latentHeatLoad from both buckets entirely, so sensible + latent did not
  // add up to the total load and the SHR came out too low.
  const sensibleHeat =
    totalTransmissionLoad +
    beforeFreezingLoad +
    afterFreezingLoad +
    respirationLoad +
    0.4 * airChangeLoad +
    equipmentLoad +
    0.4 * occupancyLoad +
    lightLoad +
    heaterLoad +
    compressorLoad;
  const latentHeat =
    latentHeatLoad + 0.6 * airChangeLoad + 0.6 * occupancyLoad;
  const sensibleHeatRatio = totalLoadKJ > 0 ? sensibleHeat / totalLoadKJ : 0;

  // Air Quantity Required (Excel: G47 = ((G42*12000)*G46)/(5*1.08))
  const airQtyRequired =
    (refrigerationCapacityTR * 12000 * sensibleHeatRatio) / (5 * 1.08);

  // Additional Excel matching calculations
  const loadInKJ = totalLoadKJ;
  const loadInKw = totalLoadKw;
  const loadInBtu = totalLoadKw * 3412; // Convert kW to BTU/hr

  // Daily loading calculations (Excel formulas)
  const dailyLoading = (miscData as any).dailyLoading || 3000; // Excel: 3000 kg/Day

  // Temperature differences for display
  const productTempDiff = productIncomingC - productOutgoingC;

  const kWFactor = 24 * 3600; // Divisor to convert kJ/24hr to kW

  return {
    wallLoad: wallLoad / kWFactor, // Convert kJ/24hr to kW
    ceilingLoad: ceilingLoad / kWFactor,
    floorLoad: floorLoad / kWFactor,
    totalTransmissionLoad: totalTransmissionLoad / kWFactor,
    productLoad: productLoad / kWFactor,
    beforeFreezingLoad: beforeFreezingLoad / kWFactor,
    latentHeatLoad: latentHeatLoad / kWFactor,
    afterFreezingLoad: afterFreezingLoad / kWFactor,
    totalProductLoad: totalProductLoad / kWFactor,
    respirationLoad: respirationLoad / kWFactor,
    airChangeLoad: airChangeLoad / kWFactor,
    equipmentLoad: equipmentLoad / kWFactor,
    occupancyLoad: occupancyLoad / kWFactor,
    lightLoad: lightLoad / kWFactor,
    doorHeaterLoad:
      (doorHeatersLoad + trayHeatersLoad + drainHeatersLoad) / kWFactor, // Combined heater loads
    compressorLoad: compressorLoad / kWFactor,
    totalMiscLoad: totalMiscLoad / kWFactor,
    totalLoadKJ,
    totalLoadKw,
    refrigerationCapacityTR,
    capacityIncludingSafety: capacityTR,
    finalCapacity,
    safetyFactorPercent,
    doorFrequency,
    doorFrequencyMultiplier,
    sensibleHeat: sensibleHeat / kWFactor,
    latentHeat: latentHeat / kWFactor,
    sensibleHeatRatio,
    airQtyRequired,

    // Individual TR values
    wallLoadTR,
    ceilingLoadTR,
    floorLoadTR,
    productLoadTR,
    respirationLoadTR,
    airChangeLoadTR,
    equipmentLoadTR,
    occupancyLoadTR,
    lightLoadTR,
    doorHeaterLoadTR: heaterLoadTR,
    compressorLoadTR,
    totalLoadTR,

    // Temperature differences
    wallTempDiff,
    ceilingTempDiff,
    floorTempDiff,
    productTempDiff,

    // Additional properties
    internalVolume,
    storageDensity,
    maximumStorage,

    // Air change inputs actually used
    airChangeRateUsed: airChange.airChangeRate,
    enthalpyDiffUsed: airChange.enthalpyDiff,
    airChangesPer24h: airChange.airChangesPer24h,
    airChangeIsAuto: airChange.isAuto,
  };
};

// BLAST FREEZER CALCULATIONS - EXACT Excel formulas
export const calculateBlastHeatLoad = (
  roomData: BlastRoomData,
  productData: BlastProductData,
  miscData: BlastMiscellaneousData,
): BlastCalculationResults => {
  // Convert room dimensions to meters
  const length = convertLength(roomData.length, roomData.lengthUnit, 'm');
  const width = convertLength(roomData.width, roomData.lengthUnit, 'm');
  const height = convertLength(roomData.height, roomData.lengthUnit, 'm');

  // Convert temperatures to Celsius
  const ambientTempC = convertTemperature(
    roomData.ambientTemp,
    roomData.tempUnit,
    'C',
  );
  const roomTempC = convertTemperature(
    roomData.roomTemp,
    roomData.tempUnit,
    'C',
  );
  const productEnteringTempC = convertTemperature(
    productData.productEnteringTemp,
    productData.tempUnit,
    'C',
  );
  const productFinalTempC = convertTemperature(
    productData.productFinalTemp,
    productData.tempUnit,
    'C',
  );
  const freezingPointC = convertTemperature(
    productData.freezingPoint,
    productData.tempUnit,
    'C',
  );

  // Convert masses to kg - Use capacityRequired from productData as the primary mass
  const capacityRequiredKg = convertMass(
    productData.capacityRequired,
    productData.massUnit,
    'kg',
  );
  const massKg = capacityRequiredKg; // Excel uses same mass for all calculations

  // Calculate areas EXACTLY as Excel
  // Wall area: 2*(L*H) + 2*(B*H) = 2*(5*3.5) + 2*(5*3.5) = 35 + 35 = 70 m²
  const wallArea = length * height * 2 + width * height * 2;
  const ceilingArea = length * width; // 5 * 5 = 25 m²
  const floorArea = length * width; // 5 * 5 = 25 m²

  // Calculate temperature differences EXACTLY as Excel
  const wallTempDiff = ambientTempC - roomTempC; // 43 - (-35) = 78K
  const ceilingTempDiff = ambientTempC - roomTempC; // 43 - (-35) = 78K
  const floorTempDiff = 28 - roomTempC; // 28 - (-35) = 63K (Excel uses 28°C for floor)

  // Calculate U-factors based on insulation thickness (Excel methodology)
  const wallUFactor = calculateUFactor(
    roomData.wallInsulationThickness,
    roomData.insulationType,
  );
  const ceilingUFactor = calculateUFactor(
    roomData.ceilingInsulationThickness,
    roomData.insulationType,
  );
  const floorUFactor = calculateUFactor(
    roomData.floorInsulationThickness,
    roomData.insulationType,
  );

  // TRANSMISSION LOADS - Excel formulas G8, G9, G10
  // Excel: =((E8*D8*C8)/1000)*3600*F8
  // Where: E8=TD, D8=Area, C8=U-factor, F8=Hours (user input)
  const wallLoad =
    ((wallTempDiff * wallArea * wallUFactor) / 1000) *
    3600 *
    roomData.wallHours;
  const ceilingLoad =
    ((ceilingTempDiff * ceilingArea * ceilingUFactor) / 1000) *
    3600 *
    roomData.ceilingHours;
  const floorLoad =
    ((floorTempDiff * floorArea * floorUFactor) / 1000) *
    3600 *
    roomData.floorHours;
  const totalTransmissionLoad = wallLoad + ceilingLoad + floorLoad;

  // PRODUCT LOADS - stage-aware, same master equation used by the cold room and
  // freezer calculators:
  //   Q = m x [ Ca(Tin - Tf) + L + Cb(Tf - Tout) ] x (BatchHours / PullDownHours)
  // Each stage only contributes when the product temperature actually crosses it.
  // The previous version applied all three stages unconditionally, which produced a
  // NEGATIVE "before freezing" term whenever the product entered already frozen
  // (Tin < Tf) and still charged the full latent heat even though no phase change
  // takes place.
  const batchRatio = productData.batchHours / productData.pullDownHours;

  // Stage 1: sensible cooling ABOVE the freezing point
  const tempDiffBeforeFreezing =
    productEnteringTempC > freezingPointC
      ? productEnteringTempC - Math.max(productFinalTempC, freezingPointC)
      : 0;

  // Stage 3: sensible cooling BELOW the freezing point
  const tempDiffAfterFreezing =
    productFinalTempC < freezingPointC
      ? Math.min(productEnteringTempC, freezingPointC) - productFinalTempC
      : 0;

  const beforeFreezingLoad =
    massKg * productData.cpAboveFreezing * tempDiffBeforeFreezing * batchRatio;

  // Stage 2: latent heat only when the product actually crosses the freezing point
  const crossesFreezing =
    productEnteringTempC > freezingPointC && productFinalTempC < freezingPointC;
  const latentHeatLoad = crossesFreezing
    ? massKg * productData.latentHeat * batchRatio
    : 0;

  const afterFreezingLoad =
    massKg * productData.cpBelowFreezing * tempDiffAfterFreezing * batchRatio;

  const totalProductLoad =
    beforeFreezingLoad + latentHeatLoad + afterFreezingLoad;

  console.log(
    `[Blast - Product Load] Tin=${productEnteringTempC}C, Tf=${freezingPointC}C, Tout=${productFinalTempC}C -> ` +
      `before=${beforeFreezingLoad.toFixed(0)}, latent=${latentHeatLoad.toFixed(0)}, after=${afterFreezingLoad.toFixed(0)} kJ`,
  );

  // AIR CHANGE LOAD - Excel formula G20
  // Excel: =C20*D20*3600*F20
  // C20=4.2, D20=0.14, F20=2, Result: =4.2*0.14*3600*2 = 4233.6 kJ
  const airChangeLoad =
    miscData.airChangeRate *
    miscData.enthalpyDiff *
    3600 *
    miscData.hoursOfLoad;

  // MISCELLANEOUS LOADS - Excel formulas G23, G25, G27, G29, G31, G33, G34
  // Excel G23: =(C23*D23*3600*F23) - Equipment load in kJ
  // C23=0.37, D23=3, F23=8, Result: =0.37*3*3600*8 = 31968 kJ
  const equipmentLoad =
    miscData.fanMotorRating *
    miscData.equipmentQuantity *
    3600 *
    miscData.equipmentHours;

  // Excel G25: =(C25*D25)*3600*F25 - Occupancy load in kJ
  // C25=1.0, D25=0.5, F25=1, Result: =1.0*0.5*3600*1 = 1800 kJ
  const occupancyLoad =
    miscData.occupancyCount *
    miscData.occupancyHeatLoad *
    3600 *
    miscData.occupancyHours;

  // Light load in kJ. lightLoad is entered in kW (see the "kW" unit on the input),
  // so the conversion is kW x 3600 s/h x hours. The old x3.6 factor was the W-based
  // conversion and made this load 1000x too small.
  const lightLoad = miscData.lightLoad * 3600 * miscData.lightHours;

  // Excel G29: =(C29*D29*3600*F29) - Peripheral heater load in kJ
  // C29=1.5, D29=1, F29=8, Result: =1.5*1*3600*8 = 43200 kJ
  const peripheralHeaterLoad =
    miscData.peripheralHeaterCapacity *
    miscData.peripheralHeaterCount *
    3600 *
    miscData.peripheralHeaterHours;

  // Excel G31: =(C31*D31*3600*F31) - Door heater load in kJ
  // C31=0.27, D31=1, F31=8, Result: =0.27*1*3600*8 = 7776 kJ
  const doorHeaterLoad =
    miscData.doorHeaterCapacity *
    miscData.doorHeaterCount *
    3600 *
    miscData.doorHeaterHours;

  // Excel G33: =(C33*D33*3600*F33) - Tray heater load in kJ
  // C33=2.2, D33=1, F33=0.4, Result: =2.2*1*3600*0.4 = 3168 kJ
  const trayHeaterLoad =
    miscData.trayHeaterCapacity *
    miscData.trayHeaterCount *
    3600 *
    miscData.trayHeaterHours;

  // Excel G34: =(C34*D34*3600*F34) - Drain heater load in kJ
  // C34=0.04, D34=1, F34=8, Result: =0.04*1*3600*8 = 1152 kJ
  const drainHeaterLoad =
    miscData.drainHeaterCapacity *
    miscData.drainHeaterCount *
    3600 *
    miscData.drainHeaterHours;

  // COMPRESSOR AIR LOAD (kJ)
  // The Miscellaneous screen exposes "Compressor Power (kW)" and "Compressor
  // Running Hours (hrs/day)"; both were previously collected but never used in any
  // formula, so changing them had no effect on the result. Both default to 0.
  const compressorLoad =
    (miscData.compressorPowerKW ?? 0) *
    3600 *
    (miscData.compressorAirRunningHours ?? 0);

  const totalMiscLoad =
    equipmentLoad +
    occupancyLoad +
    lightLoad +
    peripheralHeaterLoad +
    doorHeaterLoad +
    trayHeaterLoad +
    drainHeaterLoad +
    compressorLoad;

  // FINAL CALCULATIONS - Excel formulas G36, G37, G38, G39, G40, G41, G42, G43
  // Excel G36: =SUM(G8:G34) = 24059+8592+6940+(-23034)+466000+121124+4233.6+31968+1800+0.432+43200+7776+3168+1152 = 696925 kJ
  const totalLoadKJ =
    totalTransmissionLoad + totalProductLoad + airChangeLoad + totalMiscLoad;

  // Excel G37: =G36/(3600*D46) = 696925/(3600*8) = 24.20 kW
  const totalLoadKw = totalLoadKJ / (3600 * productData.batchHours);

  // Excel G38: =G37/3.517 = 24.20/3.517 = 6.88 TR
  const totalLoadTR = totalLoadKw / 3.517;

  // Excel G39: =G38*(100+D39)/100 (20% safety factor)
  const safetyFactorPercent = miscData.capacityIncludingSafety ?? 20;
  const refrigerationCapacity =
    (totalLoadTR * (100 + safetyFactorPercent)) / 100;

  // NEW: Apply door opening frequency adjustment AFTER safety factor
  // Low: 0% (1.0x), Medium: +5% (1.05x), High: +10% (1.10x)
  const doorFrequency = miscData.doorOpeningFrequency || 'low';
  const doorFrequencyMultiplier =
    doorFrequency === 'high' ? 1.1 : doorFrequency === 'medium' ? 1.05 : 1.0;
  const finalCapacity = refrigerationCapacity * doorFrequencyMultiplier;

  console.log('🚪 [Blast] Door frequency adjustment:', {
    doorFrequency,
    multiplier: doorFrequencyMultiplier,
    capacityBeforeDoor: refrigerationCapacity.toFixed(3),
    finalCapacity: finalCapacity.toFixed(3),
  });

  // Sensible / latent split. Everything that is not phase change or moisture driven
  // is sensible, including the miscellaneous equipment, lighting and heater loads
  // (these were previously left out of both buckets, skewing the SHR).
  const sensibleHeatKJ24Hr =
    totalTransmissionLoad +
    beforeFreezingLoad +
    afterFreezingLoad +
    0.4 * airChangeLoad +
    equipmentLoad +
    0.4 * occupancyLoad +
    lightLoad +
    peripheralHeaterLoad +
    doorHeaterLoad +
    trayHeaterLoad +
    drainHeaterLoad +
    compressorLoad;

  const latentHeatKJ24Hr =
    latentHeatLoad + 0.6 * airChangeLoad + 0.6 * occupancyLoad;

  // Excel G42: =G40/(G40+G41)
  const shr = sensibleHeatKJ24Hr / (sensibleHeatKJ24Hr + latentHeatKJ24Hr);

  // Excel G43: =((G37*12000)*G42)/(5*1.08). G37 is in kW, but 12000 BTU/h is the
  // value of one TR, so the load must be in TR here (the sheet overstated the air
  // quantity by a factor of 3.517).
  const airQtyRequiredCfm = (totalLoadTR * 12000 * shr) / (5 * 1.08);

  // Individual TR calculations - Excel formulas: =G8/(3600*3.517*24)
  const trConversionFactor = 3600 * 3.517 * 24;
  const wallLoadTR = wallLoad / trConversionFactor;
  const ceilingLoadTR = ceilingLoad / trConversionFactor;
  const floorLoadTR = floorLoad / trConversionFactor;
  const beforeFreezingLoadTR = beforeFreezingLoad / trConversionFactor;
  const latentHeatLoadTR = latentHeatLoad / trConversionFactor;
  const afterFreezingLoadTR = afterFreezingLoad / trConversionFactor;
  const airChangeLoadTR = airChangeLoad / trConversionFactor;
  const equipmentLoadTR = equipmentLoad / trConversionFactor;
  const occupancyLoadTR = occupancyLoad / trConversionFactor;
  const lightLoadTR = lightLoad / trConversionFactor;
  const peripheralHeaterLoadTR = peripheralHeaterLoad / trConversionFactor;
  const doorHeaterLoadTR = doorHeaterLoad / trConversionFactor;
  const trayHeaterLoadTR = trayHeaterLoad / trConversionFactor;
  const drainHeaterLoadTR = drainHeaterLoad / trConversionFactor;
  const compressorLoadTR = compressorLoad / trConversionFactor;

  return {
    wallLoad,
    ceilingLoad,
    floorLoad,
    totalTransmissionLoad,
    beforeFreezingLoad,
    latentHeatLoad,
    afterFreezingLoad,
    totalProductLoad,
    airChangeLoad,
    equipmentLoad,
    occupancyLoad,
    lightLoad,
    peripheralHeaterLoad,
    doorHeaterLoad,
    trayHeaterLoad,
    drainHeaterLoad,
    compressorLoad,
    totalMiscLoad,
    totalLoadKJ,
    totalLoadKw,
    totalLoadTR,
    capacityIncludingSafety: refrigerationCapacity,
    finalCapacity,
    safetyFactorPercent,
    doorFrequency,
    doorFrequencyMultiplier,
    sensibleHeatKJ24Hr,
    latentHeatKJ24Hr,
    shr,
    airQtyRequiredCfm,
    refrigerationCapacity,
    // Individual TR calculations
    wallLoadTR,
    ceilingLoadTR,
    floorLoadTR,
    beforeFreezingLoadTR,
    latentHeatLoadTR,
    afterFreezingLoadTR,
    airChangeLoadTR,
    equipmentLoadTR,
    occupancyLoadTR,
    lightLoadTR,
    peripheralHeaterLoadTR,
    doorHeaterLoadTR,
    trayHeaterLoadTR,
    drainHeaterLoadTR,
    compressorLoadTR,
  };
};
