export interface AcademicYearGroup {
  label: string;
  options: string[];
}

const ordinal = (year: number): string => {
  const remainder = year % 100;
  const suffix = remainder >= 11 && remainder <= 13
    ? 'th'
    : year % 10 === 1 ? 'st' : year % 10 === 2 ? 'nd' : year % 10 === 3 ? 'rd' : 'th';
  return `${year}${suffix}`;
};

const years = (stage: string, count: number): string[] =>
  Array.from({ length: count }, (_, index) => `${ordinal(index + 1)} ${stage}`);

export const ACADEMIC_YEAR_GROUPS: AcademicYearGroup[] = [
  { label: 'Kindergarten', options: ['KG1', 'KG2'] },
  { label: 'Primary', options: years('Primary', 6) },
  { label: 'Preparatory', options: years('Preparatory', 3) },
  { label: 'Secondary', options: years('Secondary', 3) },
];

const orderedAcademicYears = ACADEMIC_YEAR_GROUPS.flatMap((group) => group.options);
const allAcademicYears = new Set(orderedAcademicYears.map((year) => year.toLocaleLowerCase()));

export function compareAcademicYears(left: string, right: string): number {
  const leftYear = normalizeAcademicYear(left);
  const rightYear = normalizeAcademicYear(right);
  const leftIndex = orderedAcademicYears.findIndex((year) => year.toLocaleLowerCase() === leftYear.toLocaleLowerCase());
  const rightIndex = orderedAcademicYears.findIndex((year) => year.toLocaleLowerCase() === rightYear.toLocaleLowerCase());
  if (leftIndex >= 0 && rightIndex >= 0) return leftIndex - rightIndex;
  if (leftIndex >= 0) return -1;
  if (rightIndex >= 0) return 1;
  return leftYear.localeCompare(rightYear, undefined, { numeric: true, sensitivity: 'base' });
}

export function normalizeAcademicYear(value: string): string {
  const trimmed = value.trim();
  const kindergarten = trimmed.match(/^(?:kg\s*|kindergarten\s*)([12])$/i);
  if (kindergarten) return `KG${kindergarten[1]}`;

  const match = trimmed.match(/^(\d+)(?:st|nd|rd|th)?\s+(primary|preparatory|secondary)$/i);
  if (match) {
    const year = `${ordinal(Number(match[1]))} ${match[2][0].toUpperCase()}${match[2].slice(1).toLowerCase()}`;
    if (allAcademicYears.has(year.toLocaleLowerCase())) return year;
  }

  const exact = ACADEMIC_YEAR_GROUPS.flatMap((group) => group.options)
    .find((year) => year.toLocaleLowerCase() === trimmed.toLocaleLowerCase());
  return exact ?? trimmed;
}
