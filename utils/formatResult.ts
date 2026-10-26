// Number formatting for result cards and reports: two decimals so that small loads
// (e.g. 70 W of lighting = 0.04 kW) are not shown as 0.0; whole numbers (%, hours)
// and large values (CFM, kg, BTU/hr) are shown without decimals.
export const formatResultValue = (value: number): string =>
  Number.isInteger(value) || Math.abs(value) >= 100 ? Math.round(value).toString() : value.toFixed(2);
