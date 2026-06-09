type CsvSerializer = {
  matches: (value: unknown) => boolean;
  serialize: (value: unknown) => string;
};

const CSV_SERIALIZERS: CsvSerializer[] = [
  {
    matches: (value) => value === null || value === undefined,
    serialize: () => '',
  },
  {
    matches: (value) => typeof value === 'string',
    serialize: (value) => value as string,
  },
  {
    matches: (value) => typeof value === 'number' || typeof value === 'boolean',
    serialize: (value) => String(value),
  },
  {
    matches: (value) => value instanceof Date,
    serialize: (value) => (value as Date).toISOString(),
  },
  {
    matches: (value) => typeof value === 'object',
    serialize: (value) => JSON.stringify(value) ?? '',
  },
];

export function escapeCsvValue(value: unknown): string {
  const stringValue = serializeCsvValue(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
}

function serializeCsvValue(value: unknown): string {
  return (
    CSV_SERIALIZERS.find((serializer) => serializer.matches(value))?.serialize(
      value,
    ) ?? ''
  );
}
