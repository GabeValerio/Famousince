/**
 * Convert a string to a URL-friendly slug
 * @param text - The text to convert to a slug
 * @returns A URL-friendly slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate a unique slug for a job listing
 * @param title - The job title
 * @param location - The job location (optional, for uniqueness)
 * @returns A unique slug
 */
export function generateJobSlug(title: string, location?: string): string {
  const baseSlug = slugify(title);
  
  if (location) {
    const locationSlug = slugify(location);
    return `${baseSlug}-${locationSlug}`;
  }
  
  return baseSlug;
}

/**
 * Example slugs:
 * "Senior Software Engineer" -> "senior-software-engineer"
 * "Marketing Manager" + "New York" -> "marketing-manager-new-york"
 * "Full-Stack Developer (Remote)" -> "full-stack-developer-remote"
 */ 