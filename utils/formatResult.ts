// Number formatting for result cards and reports: loads (kW) always with two decimals so
// small loads are not shown as 0.0 and the figures can be added up by hand; other
// whole numbers (%, hours) and large values (CFM, kg, BTU/hr) without decimals.
export const formatResultValue = (value: number, unit?: string): string => {
  if (unit === 'kW') return value.toFixed(2);
  return Number.isInteger(value) || Math.abs(value) >= 100 ? Math.round(value).toString() : value.toFixed(2);
};
