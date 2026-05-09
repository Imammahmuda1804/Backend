/**
 * Generate URL-friendly slug dari nama destinasi
 *
 * @example
 * generateSlug('Pantai Kuta Bali')    => 'pantai-kuta-bali'
 * generateSlug('Candi Borobudur!!!')  => 'candi-borobudur'
 * generateSlug('Gunung Bromo (Jatim)') => 'gunung-bromo-jatim'
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Hapus karakter spesial
    .replace(/[\s_]+/g, '-') // Ganti spasi/underscore dengan dash
    .replace(/-+/g, '-') // Hapus multiple dashes
    .replace(/^-+|-+$/g, ''); // Hapus dash di awal/akhir
}

/**
 * Generate unique slug dengan menambahkan suffix angka jika sudah ada
 *
 * @param baseName - Nama asli
 * @param existingSlugs - Array slug yang sudah ada di database
 * @returns Slug unik
 */
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
