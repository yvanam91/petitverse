export function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .normalize('NFD') // Split accented characters into their base characters and diacritical marks
        .replace(/[\u0300-\u036f]/g, '') // Remove all the accents, which happen to be all in the \u03xx range
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w-]+/g, '') // Remove all non-word chars
        .replace(/--+/g, '-') // Replace multiple - with single -
}
