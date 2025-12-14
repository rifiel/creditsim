/**
 * Public Holidays Provider Service
 * 
 * Provides access to public holidays data via Nager.Date API
 * with caching support to reduce external API calls.
 */

const https = require('https');

class PublicHolidaysProvider {
  constructor() {
    this.baseUrl = process.env.HOLIDAYS_API_URL || 'https://date.nager.at/api/v3';
    this.timeout = parseInt(process.env.HOLIDAYS_API_TIMEOUT || '5000', 10);
    
    // Simple in-memory cache with TTL
    this.cache = new Map();
    this.cacheTTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  }

  /**
   * Make an HTTPS GET request to the Nager.Date API
   * @param {string} path - API path
   * @returns {Promise<any>} - Parsed JSON response
   */
  async makeRequest(path) {
    return new Promise((resolve, reject) => {
      const url = `${this.baseUrl}${path}`;
      
      const request = https.get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          clearTimeout(timeoutId);
          
          if (res.statusCode === 200) {
            try {
              const parsed = JSON.parse(data);
              resolve(parsed);
            } catch (error) {
              reject(new Error('Failed to parse response'));
            }
          } else if (res.statusCode === 404) {
            resolve(null);
          } else {
            reject(new Error(`API returned status ${res.statusCode}`));
          }
        });
      }).on('error', (error) => {
        clearTimeout(timeoutId);
        reject(error);
      });

      const timeoutId = setTimeout(() => {
        request.destroy();
        reject(new Error('Request timeout'));
      }, this.timeout);
    });
  }

  /**
   * Get data from cache or fetch from API
   * @param {string} key - Cache key
   * @param {Function} fetcher - Function to fetch data if not in cache
   * @returns {Promise<any>} - Cached or fetched data
   */
  async getCached(key, fetcher) {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data;
    }

    const data = await fetcher();
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    return data;
  }

  /**
   * List all available countries
   * @returns {Promise<Array>} - Array of country objects with code and name
   */
  async listCountries() {
    try {
      return await this.getCached('countries', async () => {
        const countries = await this.makeRequest('/AvailableCountries');
        
        // Map Nager.Date response to our format
        return countries.map(country => ({
          code: country.countryCode,
          name: country.name
        }));
      });
    } catch (error) {
      console.error('Failed to fetch countries:', error);
      throw new Error('Unable to retrieve country list');
    }
  }

  /**
   * Get public holidays for a specific country and year
   * @param {string} country - ISO 3166-1 alpha-2 country code
   * @param {number} year - Year (1900-2100)
   * @param {boolean} observed - Include observed flag (not used by Nager.Date)
   * @returns {Promise<Object>} - Holidays data
   */
  async getHolidays(country, year, observed = false) {
    try {
      const cacheKey = `holidays:${country}:${year}`;
      
      return await this.getCached(cacheKey, async () => {
        const holidays = await this.makeRequest(`/PublicHolidays/${year}/${country}`);
        
        if (!holidays) {
          return {
            country,
            year,
            holidays: []
          };
        }

        // Map Nager.Date response to our format
        const mappedHolidays = holidays.map(holiday => ({
          date: holiday.date,
          name: holiday.name,
          localName: holiday.localName || holiday.name,
          type: holiday.types && holiday.types.length > 0 ? holiday.types.join(', ') : 'Public',
          observed: holiday.fixed === false, // Nager.Date marks non-fixed dates
          notes: holiday.counties && holiday.counties.length > 0 
            ? `Counties: ${holiday.counties.join(', ')}` 
            : ''
        }));

        return {
          country,
          year,
          holidays: mappedHolidays
        };
      });
    } catch (error) {
      console.error(`Failed to fetch holidays for ${country}/${year}:`, error);
      throw new Error('Unable to retrieve holidays');
    }
  }

  /**
   * Clear the cache (useful for testing)
   */
  clearCache() {
    this.cache.clear();
  }
}

// Singleton instance
const publicHolidaysProvider = new PublicHolidaysProvider();

module.exports = {
  publicHolidaysProvider,
  PublicHolidaysProvider
};
