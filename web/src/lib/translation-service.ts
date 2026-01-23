/**
 * Translation service for converting Chinese labels to English field names
 * Uses dictionary lookup first, then falls back to Google Translate API
 */

import { lookupDictionary, lookupCustomDictionary } from './translation-dictionary';

// Cache for API translations to avoid redundant calls
const translationCache: Record<string, string> = {};

/**
 * Check if a string contains Chinese characters
 */
export function containsChinese(str: string): boolean {
  return /[\u4e00-\u9fff]/.test(str);
}

/**
 * Extract Chinese characters from a string
 */
export function extractChinese(str: string): string {
  return str.replace(/[^\u4e00-\u9fff]/g, '');
}

/**
 * Translate Chinese text to English using Google Translate API
 * This uses the free web API endpoint
 */
async function googleTranslate(text: string): Promise<string | null> {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-TW&tl=en&dt=t&q=${encodeURIComponent(text)}`;

    const response = await fetch(url);
    if (!response.ok) {
      console.warn('Google Translate API error:', response.status);
      return null;
    }

    const data = await response.json();

    // Extract translation from response
    // Response format: [[["translation","original",null,null,1]],null,"zh-TW"]
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      return data[0][0][0];
    }

    return null;
  } catch (error) {
    console.warn('Google Translate API error:', error);
    return null;
  }
}

/**
 * Convert translated text to a valid field name format
 */
function toFieldNameFormat(text: string): string {
  return text
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '_')  // Replace non-alphanumeric with underscore
    .replace(/_+/g, '_')          // Collapse multiple underscores
    .replace(/^_|_$/g, '');       // Remove leading/trailing underscores
}

/**
 * Translate Chinese label to English field name
 *
 * Strategy:
 * 1. Check custom dictionary (user-added translations)
 * 2. Check built-in dictionary
 * 3. Check translation cache
 * 4. Call Google Translate API
 *
 * @param label The label to translate (may contain Chinese)
 * @returns Promise resolving to translated field name with ZZ_ prefix
 */
export async function translateToFieldName(label: string): Promise<string> {
  if (!label) return '';

  // If no Chinese characters, just convert to field name format
  if (!containsChinese(label)) {
    const fieldName = toFieldNameFormat(label);
    return fieldName ? `ZZ_${fieldName}` : '';
  }

  // Extract Chinese part for translation
  const chinesePart = label;

  // 1. Check custom dictionary first
  const customResult = lookupCustomDictionary(chinesePart);
  if (customResult) {
    return `ZZ_${customResult}`;
  }

  // 2. Check built-in dictionary
  const dictResult = lookupDictionary(chinesePart);
  if (dictResult) {
    return `ZZ_${dictResult}`;
  }

  // 3. Check cache
  if (translationCache[chinesePart]) {
    return `ZZ_${translationCache[chinesePart]}`;
  }

  // 4. Call Google Translate API
  const translated = await googleTranslate(chinesePart);
  if (translated) {
    const fieldName = toFieldNameFormat(translated);
    if (fieldName) {
      // Cache the result
      translationCache[chinesePart] = fieldName;
      return `ZZ_${fieldName}`;
    }
  }

  // If all else fails, return empty string
  return '';
}

/**
 * Synchronous version that only checks dictionaries (no API call)
 * Use this for immediate UI feedback
 */
export function translateToFieldNameSync(label: string): string | null {
  if (!label) return '';

  // If no Chinese characters, just convert to field name format
  if (!containsChinese(label)) {
    const fieldName = toFieldNameFormat(label);
    return fieldName ? `ZZ_${fieldName}` : '';
  }

  const chinesePart = label;

  // Check custom dictionary
  const customResult = lookupCustomDictionary(chinesePart);
  if (customResult) {
    return `ZZ_${customResult}`;
  }

  // Check built-in dictionary
  const dictResult = lookupDictionary(chinesePart);
  if (dictResult) {
    return `ZZ_${dictResult}`;
  }

  // Check cache
  if (translationCache[chinesePart]) {
    return `ZZ_${translationCache[chinesePart]}`;
  }

  // Return null to indicate async translation needed
  return null;
}

/**
 * Get cached translation if available
 */
export function getCachedTranslation(chinese: string): string | null {
  return translationCache[chinese] || null;
}

/**
 * Pre-populate cache with translations
 */
export function setCachedTranslation(chinese: string, english: string): void {
  translationCache[chinese] = english.toUpperCase();
}
