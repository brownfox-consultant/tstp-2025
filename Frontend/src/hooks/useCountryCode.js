import { useState, useEffect } from 'react';
import countryCodesData from '@/data/countryCodes.json';

/**
 * Custom hook for managing country codes
 * @param {string} initialCode - Initial country code (default: "+91")
 * @param {string} existingPhoneNumber - Existing phone number to parse (optional)
 * @returns {Object} Country code utilities
 */
export const useCountryCode = (initialCode = "+91", existingPhoneNumber = null) => {
  const [countryCodes, setCountryCodes] = useState([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState(initialCode);
  const [isLoading, setIsLoading] = useState(true);

  // Load country codes from local JSON file
  useEffect(() => {
    try {
      // Country codes are already sorted alphabetically in the JSON file
      setCountryCodes(countryCodesData);
      setIsLoading(false);
    } catch (err) {
      console.error("Country data loading error:", err);
      // Fallback to basic codes
      setCountryCodes([
        { name: "India", cca2: "IN", code: "+91" },
        { name: "USA", cca2: "US", code: "+1" }
      ]);
      setIsLoading(false);
    }
  }, []);

  // Parse existing phone number to extract country code
  useEffect(() => {
    if (existingPhoneNumber) {
      const phoneStr = String(existingPhoneNumber);
      const match = phoneStr.match(/^(\+\d+)(\d{10})$/);
      if (match) {
        setSelectedCountryCode(match[1]);
      }
    }
  }, [existingPhoneNumber]);

  /**
   * Parse phone number and extract the digits without country code
   * @param {string} phoneNumber - Full phone number with country code
   * @returns {string} Phone number without country code
   */
  const parsePhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return '';
    const phoneStr = String(phoneNumber);
    const match = phoneStr.match(/^(\+\d+)(\d{10})$/);
    return match ? match[2] : phoneStr.replace(/^\+\d+/, '');
  };

  /**
   * Format phone number with country code for submission
   * @param {string} phoneNumber - Phone number without country code
   * @returns {string} Full phone number with country code
   */
  const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return '';
    return `${selectedCountryCode}${phoneNumber}`;
  };

  return {
    countryCodes,
    selectedCountryCode,
    setSelectedCountryCode,
    isLoading,
    parsePhoneNumber,
    formatPhoneNumber,
  };
};
