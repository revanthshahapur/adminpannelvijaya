/**
 * API Configuration
 * Uses environment variables to set the base URL
 * - Local: http://localhost:5000
 * - Production: https://my-school-pwjd.onrender.com
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const apiConfig = {
  baseURL: API_BASE_URL,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

/**
 * Helper function to build API endpoints
 * @param endpoint - The API endpoint path (e.g., "/api/students")
 * @returns Full URL
 */
export const buildApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${normalizedEndpoint}`;
};

export default apiConfig;
