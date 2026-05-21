export const DESTINATION_CATEGORIES = [
  { value: 'alam', label: 'Alam' },
  { value: 'pantai', label: 'Pantai' },
  { value: 'budaya', label: 'Budaya' },
  { value: 'sejarah', label: 'Sejarah' },
  { value: 'kuliner', label: 'Kuliner' },
  { value: 'religi', label: 'Religi' },
  { value: 'keluarga', label: 'Keluarga' },
  { value: 'petualangan', label: 'Petualangan' },
  { value: 'edukasi', label: 'Edukasi' },
  { value: 'belanja', label: 'Belanja' },
] as const;

export type DestinationCategory =
  (typeof DESTINATION_CATEGORIES)[number]['value'];

export const DESTINATION_CATEGORY_VALUES = DESTINATION_CATEGORIES.map(
  (category) => category.value,
) as [DestinationCategory, ...DestinationCategory[]];
