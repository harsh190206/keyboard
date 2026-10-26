// HEAT OF RESPIRATION DATA (fresh fruit and vegetables)
//
// Sources, as provided by the client:
//   - Table 6 "Approximate Heat of Respiration Rates at Temperature Indicated"
//     (Btu/lb/24 h at 32, 40 and 60 °F; compiled in part from ASHRAE Handbook of
//     Fundamentals 1989)
//   - "Thermal Properties of Products" table (mW/kg at 20 °C; 2006 ASHRAE Handbook -
//     Refrigeration, Chapter 9) for Banana, Mango, Papaya, Pears and Tomato
//   - Client e-mail: Cut flowers about 650 mW/kg at 10 °C; no respiration for pulses
//
// Values are stored as [temperature °C, W/tonne] points (1 mW/kg = 1 W/tonne).
// The rate at the storage (room) temperature is interpolated linearly between points;
// outside the covered range the nearest point is used, which also covers the "-"
// entries of Table 6 (agreed with the client).

// 1 Btu/lb/24 h = 1055.056 J / 0.45359237 kg / 86400 s = 0.026921 W/kg = 26.921 W/tonne
const BTU_PER_LB_DAY_TO_W_PER_TONNE = 1055.056 / 0.45359237 / 86400 * 1000;

const fToC = (f: number) => ((f - 32) * 5) / 9;

type Point = [number, number]; // [°C, W/tonne]

// Table 6 rows: [32 °F, 40 °F, 60 °F] in Btu/lb/24 h; null where the table shows "-"
const TABLE_6: Record<string, [number | null, number | null, number | null]> = {
  'Apples': [0.45, 0.8, 2.05],
  'Asparagus': [4.7, 9.0, 18.5],
  'Beans - Green': [3.15, 5.15, 19.1],
  'Beans - Lima': [1.35, 2.6, 12.2],
  'Beets': [1.35, 1.75, 3.6],
  'Blueberries': [0.85, null, null],
  'Broccoli': [3.75, 7.0, 21.0],
  'Brussels Sprouts': [2.9, 4.4, 10.1],
  'Cabbage': [0.6, 0.85, 2.05],
  'Carrots': [1.05, 1.75, 4.05],
  'Cauliflower': [1.95, 2.25, 5.05],
  'Celery': [0.8, 1.2, 4.1],
  'Cherries': [0.75, 1.4, 6.0],
  'Corn': [4.65, 6.0, 19.2],
  'Cranberries': [0.33, 0.45, null],
  'Cucumbers': [0.28, null, null],
  'Grapefruit': [0.35, 0.5, 1.55],
  'Grapes': [0.3, 0.6, 1.75],
  'Lemons': [0.35, 0.65, 1.8],
  'Lettuce - Head': [1.15, 1.35, 4.0],
  'Lettuce - Leaf': [2.2, 3.2, 7.2],
  'Melons - Cantaloupes': [0.65, 1.0, 4.3],
  'Melons - Honeydews': [null, 0.5, 1.4],
  'Mushrooms': [3.1, null, null],
  'Okra': [null, 6.0, 15.8],
  'Onions': [0.45, 0.5, 1.2],
  'Onions - Green': [1.8, 4.9, 9.0],
  'Oranges': [0.35, 0.7, 2.2],
  'Peaches': [0.6, 0.85, 4.2],
  'Pears': [0.4, 0.85, 5.4],
  'Peas': [4.2, 7.4, 21.0],
  'Peppers - Green': [1.35, 2.4, 4.3],
  'Peppers - Sweet': [1.35, 2.4, 4.3],
  'Plums': [0.3, 0.6, 1.3],
  'Potatoes - Immature': [null, 1.3, 2.4],
  'Potatoes - Mature': [null, 0.8, 1.0],
  'Raspberries': [2.4, 3.8, 10.1],
  'Spinach': [2.3, 5.1, 18.5],
  'Strawberries': [1.6, 2.7, 9.0],
  'Sweet Potatoes': [0.9, 1.25, 2.7],
  'Tomatoes - Green': [0.3, 0.55, 3.1],
  'Tomatoes - Ripe': [0.5, 0.65, 2.8],
  'Turnips': [0.95, 1.1, 2.65],
};

const TABLE_6_TEMPS_C = [fToC(32), fToC(40), fToC(60)];

const table6Points = (row: string): Point[] =>
  TABLE_6[row].flatMap((btu, i) =>
    btu === null ? [] : [[TABLE_6_TEMPS_C[i], btu * BTU_PER_LB_DAY_TO_W_PER_TONNE] as Point],
  );

// App product name -> respiration points. Products not listed here have no table
// data; their respiration heat is entered by the user.
const RESPIRATION_POINTS: Record<string, Point[]> = {
  // Table 6
  'Apple': table6Points('Apples'),
  'Asparagus': table6Points('Asparagus'),
  'Beans': table6Points('Beans - Green'),
  'Beets': table6Points('Beets'),
  'Blueberries': table6Points('Blueberries'),
  'Broccoli': table6Points('Broccoli'),
  'Brussels Sprouts': table6Points('Brussels Sprouts'),
  'Cabbage': table6Points('Cabbage'),
  'Carrots': table6Points('Carrots'),
  'Cauliflower': table6Points('Cauliflower'),
  'Celery': table6Points('Celery'),
  'Cherries': table6Points('Cherries'),
  'Sweet Corn': table6Points('Corn'),
  'Cranberries': table6Points('Cranberries'),
  'Cucumber': table6Points('Cucumbers'),
  'Grapes': table6Points('Grapes'),
  'Lettuce': table6Points('Lettuce - Head'),
  'Melons': table6Points('Melons - Cantaloupes'),
  'Melons (Honeydew)': table6Points('Melons - Honeydews'),
  'Mushroom': table6Points('Mushrooms'),
  'Okra': table6Points('Okra'),
  'Onions': table6Points('Onions'),
  'Oranges': table6Points('Oranges'),
  'Peaches': table6Points('Peaches'),
  'Peas': table6Points('Peas'),
  'Peppers (Sweet)': table6Points('Peppers - Sweet'),
  'Plums': table6Points('Plums'),
  'Potato': table6Points('Potatoes - Mature'),
  'Strawberries': table6Points('Strawberries'),
  'Sweet Potato': table6Points('Sweet Potatoes'),

  // Table 6 plus the 20 °C value from the Thermal Properties table
  'Pears': [...table6Points('Pears'), [20, 266]],
  'Tomatoes': [...table6Points('Tomatoes - Ripe'), [20, 120.3]],

  // Thermal Properties table (20 °C only)
  'Banana': [[20, 242.5]],
  'Mangoes': [[20, 449.1]],
  'Papaya': [[20, 291]],

  // Client e-mail
  'Cut Flowers': [[10, 650]],
  'Pulses': [[20, 0]],
};

export const hasRespirationData = (productName?: string): boolean =>
  !!productName && RESPIRATION_POINTS[productName] !== undefined;

// Heat of respiration (W/tonne) of a product at the given storage temperature, or
// undefined when there is no table data for the product.
export const getRespirationHeat = (
  productName: string | undefined,
  storageTempC: number,
): number | undefined => {
  const points = productName ? RESPIRATION_POINTS[productName] : undefined;
  if (!points || points.length === 0) return undefined;
  const sorted = [...points].sort((a, b) => a[0] - b[0]);
  if (storageTempC <= sorted[0][0]) return sorted[0][1];
  const last = sorted[sorted.length - 1];
  if (storageTempC >= last[0]) return last[1];
  for (let i = 1; i < sorted.length; i++) {
    const [t1, q1] = sorted[i];
    if (storageTempC <= t1) {
      const [t0, q0] = sorted[i - 1];
      return q0 + ((q1 - q0) * (storageTempC - t0)) / (t1 - t0);
    }
  }
  return last[1];
};
