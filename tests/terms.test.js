const request = require('supertest');
const app = require('../src/app');
const { database } = require('../src/database/database');

describe('Terms & Conditions Page', () => {
  beforeAll(async () => {
    // Initialize database for testing
    await database.connect();
    await database.createTables();
  });

  afterAll(async () => {
    // Clean up database connection
    await database.close();
  });

  describe('GET /terms', () => {
    test('should serve the Terms & Conditions page', async () => {
      const response = await request(app)
        .get('/terms')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/text\/html/);
    });

    test('should be accessible without authentication', async () => {
      const response = await request(app)
        .get('/terms')
        .expect(200);

      expect(response.status).toBe(200);
    });

    test('should contain required page elements', async () => {
      const response = await request(app)
        .get('/terms')
        .expect(200);

      const html = response.text;

      // Check for title
      expect(html).toContain('Terms & Conditions');

      // Check for effective date
      expect(html).toContain('Effective date:');
      expect(html).toContain('Last updated:');

      // Check for table of contents
      expect(html).toContain('Table of Contents');

      // Check for all required sections
      expect(html).toContain('id="eligibility"');
      expect(html).toContain('id="acceptable-use"');
      expect(html).toContain('id="payments"');
      expect(html).toContain('id="termination"');
      expect(html).toContain('id="liability"');

      // Check for semantic headings
      expect(html).toMatch(/<h1[^>]*>Terms & Conditions<\/h1>/);
      expect(html).toMatch(/<h2[^>]*>.*Eligibility.*<\/h2>/);
      expect(html).toMatch(/<h2[^>]*>.*Acceptable Use.*<\/h2>/);
      expect(html).toMatch(/<h2[^>]*>.*Payments.*<\/h2>/);
      expect(html).toMatch(/<h2[^>]*>.*Termination.*<\/h2>/);
      expect(html).toMatch(/<h2[^>]*>.*Liability.*<\/h2>/);
    });

    test('should contain navigation links to sections', async () => {
      const response = await request(app)
        .get('/terms')
        .expect(200);

      const html = response.text;

      // Check for TOC anchor links
      expect(html).toContain('href="#eligibility"');
      expect(html).toContain('href="#acceptable-use"');
      expect(html).toContain('href="#payments"');
      expect(html).toContain('href="#termination"');
      expect(html).toContain('href="#liability"');
    });

    test('should contain Bootstrap 5 styling', async () => {
      const response = await request(app)
        .get('/terms')
        .expect(200);

      const html = response.text;

      // Check for Bootstrap CSS
      expect(html).toContain('bootstrap@5.3.0');
      expect(html).toContain('bootstrap-icons');
    });

    test('should contain accessibility features', async () => {
      const response = await request(app)
        .get('/terms')
        .expect(200);

      const html = response.text;

      // Check for nav with aria-label
      expect(html).toContain('aria-label="Terms table of contents"');
      
      // Check for semantic HTML
      expect(html).toContain('<nav');
      expect(html).toContain('<section');
    });

    test('should have link back to home page', async () => {
      const response = await request(app)
        .get('/terms')
        .expect(200);

      const html = response.text;

      // Check for home link
      expect(html).toContain('href="/"');
      expect(html).toMatch(/Back to Home|Home/);
    });
  });

  describe('Navigation and Footer Links', () => {
    test('index page should contain Terms link in navigation', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      const html = response.text;

      // Check for Terms link in navigation
      expect(html).toContain('href="/terms"');
    });

    test('index page should contain Terms link in footer', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      const html = response.text;

      // Check for footer Terms link
      expect(html).toContain('Terms & Conditions');
      expect(html).toContain('href="/terms"');
    });

    test('terms page should contain Terms link in footer', async () => {
      const response = await request(app)
        .get('/terms')
        .expect(200);

      const html = response.text;

      // Check for footer Terms link
      expect(html).toContain('Terms & Conditions');
      expect(html).toContain('href="/terms"');
    });
  });
});
