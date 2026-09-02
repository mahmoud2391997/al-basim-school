import type { AcademicYear } from "../api-client/generated/api.schemas";

export const SELECTED_ACADEMIC_YEAR_KEY = "al-bassam-selected-academic-year";

export function getAcademicYearForDate(date = new Date()): { startYear: number; endYear: number; label: string } {
  const year = date.getFullYear();
  // The school year starts in September; September 2026 maps to 2026 / 2027.
  const isAfterSeptember = date.getMonth() >= 8;
  const startYear = isAfterSeptember ? year : year - 1;
  return { startYear, endYear: startYear + 1, label: `${startYear} / ${startYear + 1}` };
}

export function getDefaultAcademicYear(years: AcademicYear[], date = new Date()): AcademicYear | undefined {
  return years.find((year) => year.isCurrent) ??
    years.find((year) => date >= new Date(`${year.startDate}T00:00:00`) && date <= new Date(`${year.endDate}T23:59:59`)) ??
    years.find((year) => year.label === getAcademicYearForDate(date).label) ??
    years[0];
}

let selectedAcademicYearId: number | undefined;

export function getStoredAcademicYearId(): number | undefined {
  return selectedAcademicYearId;
}

export function setStoredAcademicYearId(id: number) {
  selectedAcademicYearId = id;
}
