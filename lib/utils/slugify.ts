/**
 * Creates a URL-friendly username/slug from a business name.
 * - Takes max 2 words
 * - Converts to lowercase
 * - Removes special characters
 * - Replaces spaces with hyphens
 */
export function createTenantUserName(name: string): string {
    const words = name.trim().split(/\s+/).slice(0, 2);
    return words
        .join('-')
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}
