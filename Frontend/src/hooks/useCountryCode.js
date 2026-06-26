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
  if (!existingPhoneNumber || countryCodes.length === 0) return;

  const phone = String(existingPhoneNumber);

  // Match longest country code first
  const matchedCountry = [...countryCodes]
    .sort((a, b) => b.code.length - a.code.length)
    .find(country => phone.startsWith(country.code));

  if (matchedCountry) {
    setSelectedCountryCode(matchedCountry.code);
  }
}, [existingPhoneNumber, countryCodes]);

  /**
   * Parse phone number and extract the digits without country code
   * @param {string} phoneNumber - Full phone number with country code
   * @returns {string} Phone number without country code
   */
  const parsePhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return "";

  const phone = String(phoneNumber);

  const matchedCountry = [...countryCodes]
    .sort((a, b) => b.code.length - a.code.length)
    .find(country => phone.startsWith(country.code));

  if (!matchedCountry) {
    return phone.replace(/^\+/, "");
  }

  return phone.slice(matchedCountry.code.length);
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
