import { freezerProducts } from './freezerProducts';

export type ProductPreset = {
  name: string;
  cpAboveFreezing: number; // kJ/kg·K
  cpBelowFreezing?: number; // kJ/kg·K (for products that may freeze)
  freezingPoint?: number; // °C (freezing point temperature)
  latentHeatOfFusion?: number; // kJ/kg (from the client's product tables where available)
  // W/Tonne. Used only for products without respiration table data; for the others the
  // value is taken from data/respiration.ts at the room temperature.
  respirationWattsPerTonne: number;
  hasRespiration: boolean;
};

export const PRODUCT_PRESETS: ProductPreset[] = [
  {
    name: 'Custom',
    cpAboveFreezing: 4.1,
    cpBelowFreezing: 2.1,
    freezingPoint: -2,
    respirationWattsPerTonne: 50,
    hasRespiration: true,
  },

  // Dairy Products
  {
    name: 'Butter',
    cpAboveFreezing: 2.4,
    cpBelowFreezing: 1.8,
    freezingPoint: -15,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },
  {
    name: 'Cheese Fat',
    cpAboveFreezing: 2.8,
    cpBelowFreezing: 2.0,
    freezingPoint: -10,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },
  {
    name: 'Cheese Lean',
    cpAboveFreezing: 3.2,
    cpBelowFreezing: 2.2,
    freezingPoint: -8,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },
  {
    name: 'Curd',
    cpAboveFreezing: 3.6,
    cpBelowFreezing: 2.4,
    freezingPoint: -3,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },
  {
    name: 'Margarine',
    cpAboveFreezing: 2.5,
    cpBelowFreezing: 1.9,
    freezingPoint: -12,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },
  {
    name: 'Milk',
    cpAboveFreezing: 3.9,
    cpBelowFreezing: 2.8,
    freezingPoint: -0.5,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },
  {
    name: 'Ice Cream',
    cpAboveFreezing: 3.14,
    cpBelowFreezing: 1.72,
    freezingPoint: -2.8,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },
  {
    name: 'Dairy Mean Value',
    cpAboveFreezing: 3.2,
    cpBelowFreezing: 2.2,
    freezingPoint: -5,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },

  // Fish & Seafood
  {
    name: 'Fish',
    cpAboveFreezing: 3.7,
    cpBelowFreezing: 2.5,
    freezingPoint: -2,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },
  {
    name: 'Fish Mean Value',
    cpAboveFreezing: 3.6,
    cpBelowFreezing: 2.4,
    freezingPoint: -2,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },
  {
    name: 'Sea Fish Fat',
    cpAboveFreezing: 3.4,
    cpBelowFreezing: 2.3,
    freezingPoint: -2.5,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },
  {
    name: 'Sea Fish Lean',
    cpAboveFreezing: 3.8,
    cpBelowFreezing: 2.6,
    freezingPoint: -1.8,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },
  {
    name: 'Sea Fish Smoked',
    cpAboveFreezing: 3.2,
    cpBelowFreezing: 2.2,
    freezingPoint: -3,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },
  {
    name: 'Shell Fish',
    cpAboveFreezing: 3.9,
    cpBelowFreezing: 2.7,
    freezingPoint: -1.5,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },

  // Fruits
  {
    name: 'Pineapple',
    cpAboveFreezing: 3.8,
    cpBelowFreezing: 2.1,
    freezingPoint: -1.2,
    respirationWattsPerTonne: 120,
    hasRespiration: true,
  },
  {
    name: 'Apple',
    cpAboveFreezing: 3.6,
    cpBelowFreezing: 2.0,
    freezingPoint: -1.5,
    respirationWattsPerTonne: 250,
    hasRespiration: true,
  },
  {
    name: 'Apricots',
    cpAboveFreezing: 3.7,
    cpBelowFreezing: 2.1,
    freezingPoint: -1.1,
    respirationWattsPerTonne: 180,
    hasRespiration: true,
  },
  {
    name: 'Banana',
    cpAboveFreezing: 3.56, // Thermal Properties table (client)
    cpBelowFreezing: 2.03,
    freezingPoint: -0.8,
    latentHeatOfFusion: 248,
    respirationWattsPerTonne: 242.5,
    hasRespiration: true,
  },
  {
    name: 'Cherries',
    cpAboveFreezing: 3.5,
    cpBelowFreezing: 1.9,
    freezingPoint: -1.8,
    respirationWattsPerTonne: 200,
    hasRespiration: true,
  },
  {
    name: 'Grapes',
    cpAboveFreezing: 3.4,
    cpBelowFreezing: 1.8,
    freezingPoint: -2.1,
    respirationWattsPerTonne: 150,
    hasRespiration: true,
  },
  {
    name: 'Mangoes',
    cpAboveFreezing: 3.74, // Thermal Properties table (client)
    cpBelowFreezing: 1.95,
    freezingPoint: -0.9,
    latentHeatOfFusion: 273,
    respirationWattsPerTonne: 449.1,
    hasRespiration: true,
  },
  {
    name: 'Fruit Mean Value',
    cpAboveFreezing: 3.6,
    cpBelowFreezing: 2.0,
    freezingPoint: -1.6,
    respirationWattsPerTonne: 200,
    hasRespiration: true,
  },
  {
    name: 'Melons',
    cpAboveFreezing: 3.9,
    cpBelowFreezing: 2.2,
    freezingPoint: -0.8,
    respirationWattsPerTonne: 100,
    hasRespiration: true,
  },
  {
    name: 'Pears',
    cpAboveFreezing: 3.08, // Thermal Properties table (client)
    cpBelowFreezing: 2.06,
    freezingPoint: -1.6,
    latentHeatOfFusion: 280,
    respirationWattsPerTonne: 266,
    hasRespiration: true,
  },
  {
    name: 'Strawberries',
    cpAboveFreezing: 3.8,
    cpBelowFreezing: 2.1,
    freezingPoint: -0.9,
    respirationWattsPerTonne: 280,
    hasRespiration: true,
  },
  {
    name: 'Papaya',
    cpAboveFreezing: 3.51, // Thermal Properties table (client)
    cpBelowFreezing: 1.75,
    freezingPoint: -1.24,
    latentHeatOfFusion: 293.9,
    respirationWattsPerTonne: 291,
    hasRespiration: true,
  },
  // Client Table 7 "Storage requirements and properties of perishable products"
  // (converted: Btu/lb.F x 4.1868, Btu/lb x 2.326, F -> C)
  { name: 'Blueberries', cpAboveFreezing: 3.60, cpBelowFreezing: 1.88, freezingPoint: -1.3, latentHeatOfFusion: 274, respirationWattsPerTonne: 0, hasRespiration: true },
  { name: 'Cranberries', cpAboveFreezing: 3.77, cpBelowFreezing: 1.93, freezingPoint: -0.9, latentHeatOfFusion: 288, respirationWattsPerTonne: 0, hasRespiration: true },
  { name: 'Melons (Honeydew)', cpAboveFreezing: 3.94, cpBelowFreezing: 2.01, freezingPoint: -0.9, latentHeatOfFusion: 307, respirationWattsPerTonne: 0, hasRespiration: true },
  { name: 'Oranges', cpAboveFreezing: 3.77, cpBelowFreezing: 1.93, freezingPoint: -0.8, latentHeatOfFusion: 288, respirationWattsPerTonne: 0, hasRespiration: true },
  { name: 'Peaches', cpAboveFreezing: 3.77, cpBelowFreezing: 1.93, freezingPoint: -0.9, latentHeatOfFusion: 288, respirationWattsPerTonne: 0, hasRespiration: true },
  { name: 'Plums', cpAboveFreezing: 3.68, cpBelowFreezing: 1.88, freezingPoint: -0.8, latentHeatOfFusion: 274, respirationWattsPerTonne: 0, hasRespiration: true },

  // Other Food Items
  {
    name: 'Beer',
    cpAboveFreezing: 3.9,
    cpBelowFreezing: 2.8,
    freezingPoint: -2.3,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },
  {
    name: 'Bread',
    cpAboveFreezing: 2.8,
    cpBelowFreezing: 2.0,
    freezingPoint: -5,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },
  {
    name: 'Chocolate',
    cpAboveFreezing: 1.8,
    cpBelowFreezing: 1.4,
    freezingPoint: -8,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },
  {
    name: 'Cut Flowers',
    cpAboveFreezing: 3.7,
    cpBelowFreezing: 2.1,
    freezingPoint: -1,
    respirationWattsPerTonne: 400,
    hasRespiration: true,
  },
  {
    name: 'Dough',
    cpAboveFreezing: 3.2,
    cpBelowFreezing: 2.3,
    freezingPoint: -3,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },
  {
    name: 'Eggs',
    cpAboveFreezing: 3.1,
    cpBelowFreezing: 2.2,
    freezingPoint: -2.2,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },
  {
    name: 'Pulses',
    cpAboveFreezing: 2.5,
    cpBelowFreezing: 1.5,
    freezingPoint: -0.5,
    respirationWattsPerTonne: 0, // no respiration load for pulses (client)
    hasRespiration: false,
  },
  {
    name: 'Ice',
    cpAboveFreezing: 4.2,
    cpBelowFreezing: 2.1,
    freezingPoint: 0,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },

  // Meat & Poultry
  {
    name: 'Meat',
    cpAboveFreezing: 3.35,
    cpBelowFreezing: 2.3,
    freezingPoint: -1.7,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },
  {
    name: 'Chicken',
    cpAboveFreezing: 3.4,
    cpBelowFreezing: 2.4,
    freezingPoint: -1.5,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },
  {
    name: 'Chicken Lean',
    cpAboveFreezing: 3.74,
    cpBelowFreezing: 1.96,
    freezingPoint: -0.8,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },
  {
    name: 'Pig Fat',
    cpAboveFreezing: 2.8,
    cpBelowFreezing: 2.0,
    freezingPoint: -3,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },
  {
    name: 'Pig Lean',
    cpAboveFreezing: 3.6,
    cpBelowFreezing: 2.5,
    freezingPoint: -1.8,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },

  // Vegetables
  {
    name: 'Beans',
    cpAboveFreezing: 3.2,
    cpBelowFreezing: 2.0,
    freezingPoint: -0.6,
    respirationWattsPerTonne: 180,
    hasRespiration: true,
  },
  {
    name: 'Cabbage',
    cpAboveFreezing: 3.9,
    cpBelowFreezing: 2.2,
    freezingPoint: -0.9,
    respirationWattsPerTonne: 140,
    hasRespiration: true,
  },
  {
    name: 'Carrots',
    cpAboveFreezing: 3.6,
    cpBelowFreezing: 2.0,
    freezingPoint: -1.4,
    respirationWattsPerTonne: 160,
    hasRespiration: true,
  },
  {
    name: 'Cucumber',
    cpAboveFreezing: 4.0,
    cpBelowFreezing: 2.3,
    freezingPoint: -0.5,
    respirationWattsPerTonne: 110,
    hasRespiration: true,
  },
  {
    name: 'Lettuce',
    cpAboveFreezing: 4.0,
    cpBelowFreezing: 2.3,
    freezingPoint: -0.2,
    respirationWattsPerTonne: 200,
    hasRespiration: true,
  },
  {
    name: 'Mushroom',
    cpAboveFreezing: 3.8,
    cpBelowFreezing: 2.1,
    freezingPoint: -0.9,
    respirationWattsPerTonne: 300,
    hasRespiration: true,
  },
  {
    name: 'Onions',
    cpAboveFreezing: 3.7,
    cpBelowFreezing: 2.1,
    freezingPoint: -0.8,
    respirationWattsPerTonne: 120,
    hasRespiration: true,
  },
  {
    name: 'Peas',
    cpAboveFreezing: 3.4,
    cpBelowFreezing: 1.9,
    freezingPoint: -0.6,
    respirationWattsPerTonne: 250,
    hasRespiration: true,
  },
  {
    name: 'Potato',
    cpAboveFreezing: 3.5,
    cpBelowFreezing: 1.9,
    freezingPoint: -0.6,
    respirationWattsPerTonne: 120,
    hasRespiration: true,
  },
  {
    name: 'Roots',
    cpAboveFreezing: 3.5,
    cpBelowFreezing: 1.9,
    freezingPoint: -1.0,
    respirationWattsPerTonne: 150,
    hasRespiration: true,
  },
  {
    name: 'Sweet Potato',
    cpAboveFreezing: 3.4,
    cpBelowFreezing: 1.9,
    freezingPoint: -1.4,
    respirationWattsPerTonne: 140,
    hasRespiration: true,
  },
  {
    name: 'Tomatoes',
    cpAboveFreezing: 4.02, // Thermal Properties table (client)
    cpBelowFreezing: 1.77,
    freezingPoint: -0.6,
    latentHeatOfFusion: 311,
    respirationWattsPerTonne: 120.3,
    hasRespiration: true,
  },
  // Client Table 7 (converted: Btu/lb.F x 4.1868, Btu/lb x 2.326, F -> C)
  { name: 'Asparagus', cpAboveFreezing: 3.94, cpBelowFreezing: 2.01, freezingPoint: -0.6, latentHeatOfFusion: 312, respirationWattsPerTonne: 0, hasRespiration: true },
  { name: 'Beets', cpAboveFreezing: 3.77, cpBelowFreezing: 1.93, freezingPoint: -1.1, latentHeatOfFusion: 293, respirationWattsPerTonne: 0, hasRespiration: true },
  { name: 'Broccoli', cpAboveFreezing: 3.85, cpBelowFreezing: 1.97, freezingPoint: -1.7, latentHeatOfFusion: 302, respirationWattsPerTonne: 0, hasRespiration: true },
  { name: 'Brussels Sprouts', cpAboveFreezing: 3.68, cpBelowFreezing: 1.93, freezingPoint: -0.8, latentHeatOfFusion: 284, respirationWattsPerTonne: 0, hasRespiration: true },
  { name: 'Cauliflower', cpAboveFreezing: 3.89, cpBelowFreezing: 1.97, freezingPoint: -1.7, latentHeatOfFusion: 307, respirationWattsPerTonne: 0, hasRespiration: true },
  { name: 'Celery', cpAboveFreezing: 3.98, cpBelowFreezing: 2.01, freezingPoint: -0.5, latentHeatOfFusion: 314, respirationWattsPerTonne: 0, hasRespiration: true },
  { name: 'Okra', cpAboveFreezing: 3.85, cpBelowFreezing: 1.93, freezingPoint: -1.8, latentHeatOfFusion: 298, respirationWattsPerTonne: 0, hasRespiration: true },
  { name: 'Peppers (Sweet)', cpAboveFreezing: 3.94, cpBelowFreezing: 1.97, freezingPoint: -0.7, latentHeatOfFusion: 307, respirationWattsPerTonne: 0, hasRespiration: true },
  { name: 'Sweet Corn', cpAboveFreezing: 3.31, cpBelowFreezing: 1.76, freezingPoint: -0.6, latentHeatOfFusion: 247, respirationWattsPerTonne: 0, hasRespiration: true },
  {
    name: 'Vegetables Generic',
    cpAboveFreezing: 3.89,
    cpBelowFreezing: 2.05,
    freezingPoint: -0.5,
    respirationWattsPerTonne: 150,
    hasRespiration: true,
  },

  // Frozen & Blast Products (extended library)
  {
    name: 'Chicken (Lean)',
    cpAboveFreezing: 3.4,
    cpBelowFreezing: 1.8,
    freezingPoint: -0.7,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },
  {
    name: 'Pork',
    cpAboveFreezing: 3.6,
    cpBelowFreezing: 1.9,
    freezingPoint: -0.6,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },
  {
    name: 'Turkey',
    cpAboveFreezing: 3.4,
    cpBelowFreezing: 1.8,
    freezingPoint: -0.7,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },
  {
    name: 'Salmon',
    cpAboveFreezing: 3.5,
    cpBelowFreezing: 1.8,
    freezingPoint: -1.1,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },
  {
    name: 'Vegetables',
    cpAboveFreezing: 3.89,
    cpBelowFreezing: 2.05,
    freezingPoint: -0.5,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },
  {
    name: 'Beans (Frozen)',
    cpAboveFreezing: 3.2,
    cpBelowFreezing: 1.7,
    freezingPoint: -0.6,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },
  {
    name: 'Carrots (Frozen)',
    cpAboveFreezing: 3.6,
    cpBelowFreezing: 1.9,
    freezingPoint: -0.5,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },
  {
    name: 'Peas (Frozen)',
    cpAboveFreezing: 3.4,
    cpBelowFreezing: 1.8,
    freezingPoint: -0.6,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },
  {
    name: 'Potato (Frozen)',
    cpAboveFreezing: 3.5,
    cpBelowFreezing: 1.8,
    freezingPoint: -0.4,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },
  {
    name: 'Corn (Frozen)',
    cpAboveFreezing: 3.3,
    cpBelowFreezing: 1.7,
    freezingPoint: -0.5,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },
  {
    name: 'Pineapple (Frozen)',
    cpAboveFreezing: 3.8,
    cpBelowFreezing: 2.1,
    freezingPoint: -1.2,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },
  {
    name: 'Apple (Frozen)',
    cpAboveFreezing: 3.6,
    cpBelowFreezing: 1.9,
    freezingPoint: -0.8,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },
  {
    name: 'Banana (Frozen)',
    cpAboveFreezing: 3.6,
    cpBelowFreezing: 1.9,
    freezingPoint: -0.7,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },
  {
    name: 'Grapes (Frozen)',
    cpAboveFreezing: 3.4,
    cpBelowFreezing: 1.8,
    freezingPoint: -2.1,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },
  {
    name: 'Strawberries (Frozen)',
    cpAboveFreezing: 3.8,
    cpBelowFreezing: 2.0,
    freezingPoint: -0.6,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },
  {
    name: 'Bread (Frozen)',
    cpAboveFreezing: 2.8,
    cpBelowFreezing: 1.5,
    freezingPoint: -2.0,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },
  {
    name: 'Dough (Frozen)',
    cpAboveFreezing: 3.2,
    cpBelowFreezing: 1.7,
    freezingPoint: -1.5,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },
  {
    name: 'Eggs (Frozen)',
    cpAboveFreezing: 3.1,
    cpBelowFreezing: 1.6,
    freezingPoint: -1.8,
    respirationWattsPerTonne: 0,
    hasRespiration: false,
  },
];

export const PRODUCT_PRESET_MAP = PRODUCT_PRESETS.reduce<
  Record<string, ProductPreset>
>((acc, p) => {
  acc[p.name] = p;
  return acc;
}, {});

// Latent heat of fusion (kJ/kg) for a cold room product:
//   1. the value from the freezer product table when a product of the same name exists
//   2. otherwise Siebel's estimate from the water content implied by Cp above freezing:
//        water fraction x = (Cp_above - 0.84) / 3.35,  L = 335 x
export const estimateLatentHeat = (name: string | undefined, cpAboveFreezing: number): number => {
  const preset = name ? PRODUCT_PRESET_MAP[name] : undefined;
  if (preset?.latentHeatOfFusion !== undefined) return preset.latentHeatOfFusion;
  const key = (name || '').toLowerCase();
  if (key && key !== 'custom') {
    const match = freezerProducts.find((p) => p.name.toLowerCase() === key);
    if (match) return match.latentHeatOfFusion;
  }
  const waterFraction = Math.min(Math.max((cpAboveFreezing - 0.84) / 3.35, 0), 1);
  return Math.round(335 * waterFraction);
};
