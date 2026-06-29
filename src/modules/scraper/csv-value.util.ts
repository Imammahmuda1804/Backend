export function escapeCsvValue(value: unknown): string {
  const stringValue = value === null || value === undefined
    ? ''
    : typeof value === 'object' && !(value instanceof Date)
      ? JSON.stringify(value) ?? ''
      : String(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
}
