/**
 * Utility for generating unique SKU codes in the format SKU-YYYYMMDD-XXX
 * @param counter - Counter for the SKU (1-based, 3 digits, zero-padded)
 * @param date - Date object (defaults to today)
 * @returns SKU string in the format SKU-YYYYMMDD-XXX
 * @example
 *   generateSKU(5, new Date('2024-06-01')) // SKU-20240601-005
 */
export function generateSKU(counter: number, date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;
  const counterStr = String(counter).padStart(3, '0');
  return `SKU-${dateStr}-${counterStr}`;
}
