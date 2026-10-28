// Load breakdown for the result screens and PDF reports.
//
// Every load is rounded to the two decimals that are displayed, and every total is
// the sum of those displayed values, so that a reader adding up the figures by hand
// gets exactly the totals shown (otherwise e.g. 0.60 + 0.21 + 0.17 could show a total
// of 0.97). The rounding changes the total by at most a few hundredths of a kW.

export const round2 = (value: number): number => Math.round((value || 0) * 100) / 100;

export type LoadGroupInput = {
  title: string; // section title, e.g. "Transmission Loads"
  summaryLabel: string; // row label in the Load Summary, e.g. "Transmission"
  totalLabel?: string; // total row inside the section (omitted for single-item groups)
  items: { label: string; kw: number }[];
  // Non-load information shown inside the section (not added to any total)
  extras?: { label: string; value: number | string; unit: string }[];
};

export type LoadGroup = LoadGroupInput & {
  extras: { label: string; value: number | string; unit: string }[];
  total: number;
};

export type LoadBreakdown = {
  groups: LoadGroup[];
  sum: number; // sum of all loads (kW)
  safety: number; // safety allowance (kW)
  total: number; // total load incl. safety (kW)
  totalTR: number;
  totalBtuHr: number;
};

export const buildLoadBreakdown = (groups: LoadGroupInput[], safetyPercent: number): LoadBreakdown => {
  const built = groups.map((group) => {
    const items = group.items.map((item) => ({ ...item, kw: round2(item.kw) }));
    return {
      ...group,
      items,
      extras: group.extras ?? [],
      total: round2(items.reduce((sum, item) => sum + item.kw, 0)),
    };
  });
  const sum = round2(built.reduce((acc, group) => acc + group.total, 0));
  const safety = round2((sum * safetyPercent) / 100);
  const total = round2(sum + safety);
  return { groups: built, sum, safety, total, totalTR: total / 3.517, totalBtuHr: total * 3412 };
};

type PdfItem = { label: string; value: string; unit: string };

// PDF report sections: the Load Summary followed by one section per load group
export const loadBreakdownPdfSections = (
  breakdown: LoadBreakdown,
  safetyPercent: number,
  basis: string,
): { title: string; items: PdfItem[] }[] => [
  {
    title: 'Load Summary',
    items: [
      ...breakdown.groups.map((group) => ({ label: group.summaryLabel, value: group.total.toFixed(2), unit: 'kW' })),
      { label: 'Sum of All Loads', value: breakdown.sum.toFixed(2), unit: 'kW' },
      { label: `Safety Allowance (${safetyPercent}%)`, value: breakdown.safety.toFixed(2), unit: 'kW' },
      { label: `Total Load (incl. ${safetyPercent}% Safety)`, value: breakdown.total.toFixed(2), unit: 'kW' },
      { label: 'Load Basis', value: basis, unit: '' },
    ],
  },
  ...breakdown.groups.map((group) => ({
    title: group.title,
    items: [
      ...group.items.map((item) => ({ label: item.label, value: item.kw.toFixed(2), unit: 'kW' })),
      ...group.extras.map((extra) => ({
        label: extra.label,
        value: typeof extra.value === 'number' ? extra.value.toFixed(2) : extra.value,
        unit: extra.unit,
      })),
      ...(group.totalLabel ? [{ label: group.totalLabel, value: group.total.toFixed(2), unit: 'kW' }] : []),
    ],
  })),
];
