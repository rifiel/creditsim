const request = require('supertest');
const app = require('../src/app');
const { getHolidayOffers } = require('../src/services/xmas');

describe('Christmas/Holiday API Endpoints', () => {
  describe('GET /api/xmas/offers', () => {
    test('should return list of holiday offers', async () => {
      const response = await request(app)
        .get('/api/xmas/offers')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('offers');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('metadata');
      
      expect(Array.isArray(response.body.data.offers)).toBe(true);
      expect(response.body.data.offers.length).toBeGreaterThan(0);
      
      // Check offer structure
      const firstOffer = response.body.data.offers[0];
      expect(firstOffer).toHaveProperty('id');
      expect(firstOffer).toHaveProperty('title');
      expect(firstOffer).toHaveProperty('code');
      expect(firstOffer).toHaveProperty('description');
      
      expect(typeof firstOffer.id).toBe('string');
      expect(typeof firstOffer.title).toBe('string');
      expect(typeof firstOffer.code).toBe('string');
      expect(typeof firstOffer.description).toBe('string');
    });

    test('should have metadata with timestamp and version', async () => {
      const response = await request(app)
        .get('/api/xmas/offers')
        .expect(200);

      expect(response.body.metadata).toHaveProperty('timestamp');
      expect(response.body.metadata).toHaveProperty('version');
      
      expect(response.body.metadata.version).toBe('1.0');
      
      // Validate timestamp format (ISO 8601)
      const timestamp = new Date(response.body.metadata.timestamp);
      expect(timestamp.toString()).not.toBe('Invalid Date');
    });

    test('should return success message', async () => {
      const response = await request(app)
        .get('/api/xmas/offers')
        .expect(200);

      expect(response.body.message).toBe('Offers retrieved successfully');
    });
  });

  describe('GET /xmas', () => {
    test('should serve xmas.html page', async () => {
      const response = await request(app)
        .get('/xmas')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/html');
      expect(response.text).toContain('Holiday Season');
      expect(response.text).toContain('Happy Holidays');
    });
  });
});

describe('Christmas Service', () => {
  describe('getHolidayOffers', () => {
    test('should return array of offers', () => {
      const offers = getHolidayOffers();
      
      expect(Array.isArray(offers)).toBe(true);
      expect(offers.length).toBeGreaterThan(0);
    });

    test('each offer should have required properties', () => {
      const offers = getHolidayOffers();
      
      offers.forEach(offer => {
        expect(offer).toHaveProperty('id');
        expect(offer).toHaveProperty('title');
        expect(offer).toHaveProperty('code');
        expect(offer).toHaveProperty('description');
        
        expect(typeof offer.id).toBe('string');
        expect(typeof offer.title).toBe('string');
        expect(typeof offer.code).toBe('string');
        expect(typeof offer.description).toBe('string');
        
        expect(offer.id.length).toBeGreaterThan(0);
        expect(offer.title.length).toBeGreaterThan(0);
        expect(offer.code.length).toBeGreaterThan(0);
        expect(offer.description.length).toBeGreaterThan(0);
      });
    });

    test('should return same offers on multiple calls (static)', () => {
      const offers1 = getHolidayOffers();
      const offers2 = getHolidayOffers();
      
      expect(offers1).toEqual(offers2);
    });
  });
});
