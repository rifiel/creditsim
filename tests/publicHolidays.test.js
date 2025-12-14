const request = require('supertest');
const app = require('../src/app');
const { PublicHolidaysProvider } = require('../src/services/publicHolidaysProvider');

describe('Public Holidays API', () => {
  let provider;

  beforeAll(() => {
    provider = new PublicHolidaysProvider();
  });

  afterEach(() => {
    // Clear cache between tests
    provider.clearCache();
  });

  describe('GET /api/public-holidays/countries', () => {
    test.skip('should return list of countries (requires external API)', async () => {
      const response = await request(app)
        .get('/api/public-holidays/countries')
        .expect(200);

      expect(response.body).toHaveProperty('countries');
      expect(Array.isArray(response.body.countries)).toBe(true);
      
      if (response.body.countries.length > 0) {
        const country = response.body.countries[0];
        expect(country).toHaveProperty('code');
        expect(country).toHaveProperty('name');
        expect(typeof country.code).toBe('string');
        expect(typeof country.name).toBe('string');
      }
    });

    test.skip('should include US in the country list (requires external API)', async () => {
      const response = await request(app)
        .get('/api/public-holidays/countries')
        .expect(200);

      const usCountry = response.body.countries.find(c => c.code === 'US');
      expect(usCountry).toBeDefined();
      expect(usCountry.name).toBe('United States');
    });
  });

  describe('GET /api/public-holidays', () => {
    test.skip('should return holidays for valid country and year (requires external API)', async () => {
      const response = await request(app)
        .get('/api/public-holidays')
        .query({ country: 'US', year: 2025 })
        .expect(200);

      expect(response.body).toHaveProperty('country');
      expect(response.body).toHaveProperty('year');
      expect(response.body).toHaveProperty('holidays');
      expect(response.body.country).toBe('US');
      expect(response.body.year).toBe(2025);
      expect(Array.isArray(response.body.holidays)).toBe(true);
    });

    test.skip('should return holidays with correct structure (requires external API)', async () => {
      const response = await request(app)
        .get('/api/public-holidays')
        .query({ country: 'US', year: 2025 })
        .expect(200);

      if (response.body.holidays.length > 0) {
        const holiday = response.body.holidays[0];
        expect(holiday).toHaveProperty('date');
        expect(holiday).toHaveProperty('name');
        expect(holiday).toHaveProperty('localName');
        expect(holiday).toHaveProperty('type');
        expect(holiday).toHaveProperty('observed');
        expect(holiday).toHaveProperty('notes');
      }
    });

    test('should return 400 for missing country', async () => {
      const response = await request(app)
        .get('/api/public-holidays')
        .query({ year: 2025 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('validation_error');
      expect(response.body.message).toContain('Country');
    });

    test('should return 400 for missing year', async () => {
      const response = await request(app)
        .get('/api/public-holidays')
        .query({ country: 'US' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('validation_error');
      expect(response.body.message).toContain('Year');
    });

    test('should return 400 for invalid country code', async () => {
      const response = await request(app)
        .get('/api/public-holidays')
        .query({ country: 'USA', year: 2025 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('validation_error');
    });

    test('should return 400 for invalid year (too low)', async () => {
      const response = await request(app)
        .get('/api/public-holidays')
        .query({ country: 'US', year: 1899 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('validation_error');
    });

    test('should return 400 for invalid year (too high)', async () => {
      const response = await request(app)
        .get('/api/public-holidays')
        .query({ country: 'US', year: 2101 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('validation_error');
    });

    test.skip('should handle observed parameter (requires external API)', async () => {
      const response = await request(app)
        .get('/api/public-holidays')
        .query({ country: 'US', year: 2025, observed: true })
        .expect(200);

      expect(response.body).toHaveProperty('holidays');
    });

    test.skip('should convert country code to uppercase (requires external API)', async () => {
      const response = await request(app)
        .get('/api/public-holidays')
        .query({ country: 'us', year: 2025 })
        .expect(200);

      expect(response.body.country).toBe('US');
    });
  });

  describe('PublicHolidaysProvider Service', () => {
    test.skip('should list countries (requires external API)', async () => {
      const countries = await provider.listCountries();
      
      expect(Array.isArray(countries)).toBe(true);
      expect(countries.length).toBeGreaterThan(0);
      
      const country = countries[0];
      expect(country).toHaveProperty('code');
      expect(country).toHaveProperty('name');
    });

    test.skip('should get holidays for a country and year (requires external API)', async () => {
      const result = await provider.getHolidays('US', 2025);
      
      expect(result).toHaveProperty('country');
      expect(result).toHaveProperty('year');
      expect(result).toHaveProperty('holidays');
      expect(result.country).toBe('US');
      expect(result.year).toBe(2025);
      expect(Array.isArray(result.holidays)).toBe(true);
    });

    test.skip('should cache countries data (requires external API)', async () => {
      // First call
      const countries1 = await provider.listCountries();
      
      // Second call should use cache
      const countries2 = await provider.listCountries();
      
      expect(countries1).toEqual(countries2);
    });

    test.skip('should cache holidays data (requires external API)', async () => {
      // First call
      const holidays1 = await provider.getHolidays('US', 2025);
      
      // Second call should use cache
      const holidays2 = await provider.getHolidays('US', 2025);
      
      expect(holidays1).toEqual(holidays2);
    });

    test('should clear cache', () => {
      // Just test the method exists and doesn't throw
      provider.clearCache();
      expect(provider.cache.size).toBe(0);
    });
  });

  describe('GET /public-holidays page route', () => {
    test('should serve the public holidays HTML page', async () => {
      const response = await request(app)
        .get('/public-holidays')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/text\/html/);
      expect(response.text).toContain('Public Holidays');
    });
  });
});
