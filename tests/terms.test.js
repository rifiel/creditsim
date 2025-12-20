const request = require('supertest');
const app = require('../src/app');

describe('Terms & Conditions Page', () => {
  describe('GET /terms', () => {
    test('should return 200 status code', async () => {
      const response = await request(app)
        .get('/terms')
        .expect(200);
      
      expect(response.headers['content-type']).toMatch(/html/);
    });

    test('should be publicly accessible without authentication', async () => {
      // This test ensures no auth headers are required
      await request(app)
        .get('/terms')
        .expect(200);
    });

    test('should contain Terms & Conditions title', async () => {
      const response = await request(app)
        .get('/terms');
      
      expect(response.text).toContain('Terms &amp; Conditions');
    });

    test('should contain table of contents with section links', async () => {
      const response = await request(app)
        .get('/terms');
      
      // Check for TOC section
      expect(response.text).toContain('Table of Contents');
      
      // Check for all required section links
      expect(response.text).toContain('href="#eligibility"');
      expect(response.text).toContain('href="#acceptable-use"');
      expect(response.text).toContain('href="#payments"');
      expect(response.text).toContain('href="#termination"');
      expect(response.text).toContain('href="#liability"');
    });

    test('should contain all required sections with id anchors', async () => {
      const response = await request(app)
        .get('/terms');
      
      // Check for section IDs
      expect(response.text).toContain('id="eligibility"');
      expect(response.text).toContain('id="acceptable-use"');
      expect(response.text).toContain('id="payments"');
      expect(response.text).toContain('id="termination"');
      expect(response.text).toContain('id="liability"');
    });

    test('should display effective date', async () => {
      const response = await request(app)
        .get('/terms');
      
      expect(response.text).toContain('Effective Date');
      expect(response.text).toContain('id="effectiveDate"');
    });

    test('should display update notice area', async () => {
      const response = await request(app)
        .get('/terms');
      
      expect(response.text).toContain('id="updateNotice"');
      expect(response.text).toContain('No recent updates');
    });

    test('should use semantic HTML headings', async () => {
      const response = await request(app)
        .get('/terms');
      
      // Check for h1 and h2 tags
      expect(response.text).toMatch(/<h1[^>]*>Terms &amp; Conditions<\/h1>/);
      expect(response.text).toContain('<h2>');
    });

    test('should include Bootstrap 5 for responsive layout', async () => {
      const response = await request(app)
        .get('/terms');
      
      expect(response.text).toContain('bootstrap@5.3.0');
    });

    test('should have navigation link back to home', async () => {
      const response = await request(app)
        .get('/terms');
      
      expect(response.text).toContain('href="/"');
    });
  });

  describe('Terms & Conditions Link in Main App', () => {
    test('should have Terms & Conditions link in index.html footer', async () => {
      const response = await request(app)
        .get('/');
      
      expect(response.text).toContain('href="/terms"');
      expect(response.text).toContain('Terms &amp; Conditions');
    });
  });
});
