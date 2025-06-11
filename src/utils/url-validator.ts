/**
 * @file src/utils/url-validator.ts
 * @description Utility function to validate if a string is a valid URL.
 */

/**
 * Checks if a given string is a valid URL.
 * @param str The string to validate.
 * @returns {boolean} True if the string is a valid URL, false otherwise.
 */
export const isValidUrl = (str: string): boolean => {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};
