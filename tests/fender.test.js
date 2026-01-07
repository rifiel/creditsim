const request = require('supertest');
const app = require('../src/app');
const { database } = require('../src/database/database');

describe('Fender Page Tests', () => {
  beforeAll(async () => {
    // Initialize database for testing
    await database.connect();
    await database.createTables();
  });

  afterAll(async () => {
    // Clean up database connection
    await database.close();
  });

  describe('GET /fender', () => {
    test('should serve the Fender page successfully', async () => {
      const response = await request(app)
        .get('/fender')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/html/);
      expect(response.text).toContain('FENDER GUITARS');
      expect(response.text).toContain('Featured Models');
    });

    test('should include Fender CSS stylesheet link', async () => {
      const response = await request(app)
        .get('/fender')
        .expect(200);

      expect(response.text).toContain('styles/fender.css');
    });

    test('should include Bootstrap CSS and JS', async () => {
      const response = await request(app)
        .get('/fender')
        .expect(200);

      expect(response.text).toContain('bootstrap@5.3.0');
      expect(response.text).toContain('bootstrap-icons');
    });

    test('should have proper meta tags for responsiveness', async () => {
      const response = await request(app)
        .get('/fender')
        .expect(200);

      expect(response.text).toContain('<meta name="viewport"');
      expect(response.text).toContain('width=device-width');
    });

    test('should include navigation with link back to home', async () => {
      const response = await request(app)
        .get('/fender')
        .expect(200);

      expect(response.text).toContain('<nav');
      expect(response.text).toContain('href="/"');
    });

    test('should include featured models grid container', async () => {
      const response = await request(app)
        .get('/fender')
        .expect(200);

      expect(response.text).toContain('id="modelsGrid"');
      expect(response.text).toContain('Featured Models');
    });

    test('should include model data in JavaScript', async () => {
      const response = await request(app)
        .get('/fender')
        .expect(200);

      expect(response.text).toContain('featuredModels');
      expect(response.text).toContain('American Professional II Stratocaster');
      expect(response.text).toContain('Player Telecaster');
    });

    test('should have placeholder modal for unavailable details', async () => {
      const response = await request(app)
        .get('/fender')
        .expect(200);

      expect(response.text).toContain('id="placeholderModal"');
      expect(response.text).toContain('Coming Soon');
    });

    test('should include proper accessibility attributes', async () => {
      const response = await request(app)
        .get('/fender')
        .expect(200);

      expect(response.text).toContain('aria-label');
      expect(response.text).toContain('alt=');
      expect(response.text).toMatch(/lang="en"/);
    });

    test('should serve static CSS file', async () => {
      const response = await request(app)
        .get('/styles/fender.css')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/css/);
      expect(response.text).toContain('.fender-hero');
      expect(response.text).toContain('--fender-gold');
    });
  });

  describe('Fender Page Content Validation', () => {
    test('should contain all required model specifications', async () => {
      const response = await request(app)
        .get('/fender')
        .expect(200);

      // Check for key spec fields in the data structure
      expect(response.text).toContain('body:');
      expect(response.text).toContain('pickups:');
      expect(response.text).toContain('neck:');
      expect(response.text).toContain('fingerboard:');
      expect(response.text).toContain('bridge:');
      expect(response.text).toContain('price:');
    });

    test('should have proper CTA buttons structure', async () => {
      const response = await request(app)
        .get('/fender')
        .expect(200);

      expect(response.text).toContain('cta-primary');
      expect(response.text).toContain('cta-secondary');
      expect(response.text).toContain('View Details');
      expect(response.text).toContain('Inquire / Buy');
    });

    test('should include security attributes for external links', async () => {
      const response = await request(app)
        .get('/fender')
        .expect(200);

      // Check for rel="noopener noreferrer" on external links
      expect(response.text).toContain('rel="noopener noreferrer"');
    });
  });
});
