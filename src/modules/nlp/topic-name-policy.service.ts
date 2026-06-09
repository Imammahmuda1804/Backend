import { Injectable } from '@nestjs/common';

@Injectable()
export class TopicNamePolicyService {
  buildPrompt(keywords: string[], representativeDocs: string[]) {
    const exampleReviews = representativeDocs.length
      ? `\nContoh ulasan:\n${representativeDocs
          .slice(0, 3)
          .map((document) => `- ${document}`)
          .join('\n')}\n`
      : '';

    return `Tugas Anda adalah memberi LABEL KATEGORI untuk filter ulasan pariwisata berdasarkan kumpulan kata kunci dan contoh ulasan berikut:
[ ${keywords.join(', ')} ]
${exampleReviews}

Aturan ketat:
1. Bahasa Indonesia, ramah untuk user, dan cocok sebagai label UI.
2. Maksimal 3 kata dan maksimal 28 karakter.
3. Label harus spesifik dan langsung, contoh: Tiket mahal, Akses susah, Toilet kotor, Spot foto bagus.
4. Gunakan contoh ulasan untuk memahami konteks, jangan hanya menyalin keyword mentah.
5. JANGAN gabungkan beberapa label menjadi satu.
6. JANGAN gunakan awalan seperti "Tentang", "Keluhan", "Masalah", atau "Kondisi".
7. Outputkan nama label saja, tanpa tanda kutip, titik, atau penjelasan.`;
  }

  createFallbackName(topicId: number, keywords: string[]) {
    const usableKeywords = keywords
      .map((keyword) => keyword.trim())
      .filter(Boolean)
      .slice(0, 2);

    if (usableKeywords.length === 0) return `Topic ${topicId}`;
    return usableKeywords.map((keyword) => this.capitalize(keyword)).join(' ');
  }

  extractValidName(value: string, keywords: string[]) {
    const candidates = [
      this.sanitize(value),
      ...this.splitCandidates(value),
      ...this.sliceCandidates(value),
    ];
    return (
      candidates.find((candidate) => this.isValid(candidate, keywords)) ?? null
    );
  }

  sanitize(value: string) {
    return value
      .replace(/^["'`]|["'`]$/g, '')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/^\d+[).\-\s]+/, '')
      .replace(/\s+/g, ' ')
      .replace(/[.,;:]+$/g, '')
      .trim();
  }

  private capitalize(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private splitCandidates(value: string) {
    return value
      .split(/[\n\r,;|/]+/)
      .map((candidate) => this.sanitize(candidate))
      .filter(Boolean);
  }

  private sliceCandidates(value: string) {
    const words = this.sanitize(value).split(/\s+/).filter(Boolean);
    const candidates: string[] = [];

    for (let size = 2; size <= 3; size++) {
      for (let index = 0; index <= words.length - size; index++) {
        candidates.push(words.slice(index, index + size).join(' '));
      }
    }
    return candidates;
  }

  private isValid(value: string, keywords: string[]) {
    const name = this.sanitize(value);
    return (
      this.hasValidShape(name) &&
      this.isNotRawKeyword(name, keywords) &&
      this.isNotGenericName(name)
    );
  }

  private hasValidShape(name: string) {
    return [
      Boolean(name && name.length <= 28),
      name.split(/\s+/).length <= 3,
      !/topic\s*\d+/i.test(name),
      !/[|/\\]|\n|\r/.test(name),
      (name.match(/dan/gi) || []).length <= 1,
    ].every(Boolean);
  }

  private isNotRawKeyword(name: string, keywords: string[]) {
    const normalizedName = name.toLowerCase();
    const keywordSet = new Set(
      keywords.map((keyword) => keyword.toLowerCase()),
    );
    return keywords.length <= 1 || !keywordSet.has(normalizedName);
  }

  private isNotGenericName(name: string) {
    const genericNames = new Set([
      'wisata',
      'tempat wisata',
      'pengalaman wisata',
      'destinasi',
      'ulasan',
      'perjalanan',
    ]);
    return !genericNames.has(name.toLowerCase());
  }
}
