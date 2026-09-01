/**
 * Centralized Form Validation Helpers for HR Sports & Nutrition Store
 */

/**
 * Validates Email Address format (e.g., user@domain.com)
 * @param {string} email
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  const cleanEmail = email.trim();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(cleanEmail);
};

/**
 * Validates 10-digit Mobile / Phone Number (accepts optional +91 / 0 prefix, spaces, dashes)
 * @param {string} phone
 * @returns {boolean}
 */
export const isValidPhone = (phone) => {
  if (!phone || typeof phone !== "string") return false;
  let digits = phone.trim().replace(/[\s\-\+\(\)]/g, "");
  if (digits.startsWith("91") && digits.length === 12) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0") && digits.length === 11) {
    digits = digits.slice(1);
  }
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(digits);
};

/**
 * Validates Password (min 6 characters)
 * @param {string} password
 * @returns {boolean}
 */
export const isValidPassword = (password) => {
  if (!password || typeof password !== "string") return false;
  return password.length >= 6;
};

/**
 * Returns specific error message for password validation failures
 * @param {string} password
 * @returns {string}
 */
export const getPasswordErrorMessage = (password) => {
  if (!password) return "Password is required.";
  if (password.length < 6) return "Password must be at least 6 characters long.";
  return "";
};

