// src/api/openfda.ts
import axios from 'axios';

/**
 * Simple wrapper around the openFDA API to fetch drug information.
 * @param {string} query - Search term (drug name, NDC, or active ingredient)
 * @returns {Promise<any>} - Parsed JSON response from openFDA.
 */
export async function fetchDrugInfo(query: string): Promise<any> {
  const url = `https://api.fda.gov/drug/label.json?search=description:${encodeURIComponent(query)}&limit=10`;
  const response = await axios.get(url);
  return response.data;
}
