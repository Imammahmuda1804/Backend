// Membuat slug URL dari nama destinasi.
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Hapus karakter spesial
    .replace(/[\s_]+/g, '-') // Ganti spasi/underscore dengan dash
    .replace(/-+/g, '-') // Hapus multiple dashes
    .replace(/^-+|-+$/g, ''); // Hapus dash di awal/akhir
}

// Membuat slug unik dengan suffix angka.
export function generateUniqueSlug(
  baseName: string,
  existingSlugs: string[],
): string {
  const baseSlug = generateSlug(baseName);

  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  let counter = 1;
  let uniqueSlug = `${baseSlug}-${counter}`;

  while (existingSlugs.includes(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }

  return uniqueSlug;
}
