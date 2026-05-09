"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSlug = generateSlug;
exports.generateUniqueSlug = generateUniqueSlug;
function generateSlug(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}
function generateUniqueSlug(baseName, existingSlugs) {
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
//# sourceMappingURL=slug.util.js.map