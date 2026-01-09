const request = require('supertest');
const app = require('../src/app');
const path = require('path');
const fs = require('fs').promises;

describe('What\'s New Feature', () => {
  describe('GET /whats-new', () => {
    test('should serve the whats-new.html page', async () => {
      const response = await request(app)
        .get('/whats-new')
        .expect(200)
        .expect('Content-Type', /html/);

      expect(response.text).toContain('What\'s New');
      expect(response.text).toContain('whatsNew.js');
    });
  });

  describe('GET /data/whats-new.json', () => {
    test('should serve the whats-new.json data file', async () => {
      const response = await request(app)
        .get('/data/whats-new.json')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(Array.isArray(response.body)).toBe(true);
    });

    test('should return updates with correct structure', async () => {
      const response = await request(app)
        .get('/data/whats-new.json')
        .expect(200);

      const updates = response.body;
      expect(updates.length).toBeGreaterThan(0);

      // Check first update has required fields
      const firstUpdate = updates[0];
      expect(firstUpdate).toHaveProperty('id');
      expect(firstUpdate).toHaveProperty('title');
      expect(firstUpdate).toHaveProperty('date');
      expect(firstUpdate).toHaveProperty('summary');
      expect(firstUpdate).toHaveProperty('details');
      expect(firstUpdate).toHaveProperty('imageUrl');
      expect(firstUpdate).toHaveProperty('imageAlt');
      expect(firstUpdate).toHaveProperty('links');
    });

    test('should have valid date format for all updates', async () => {
      const response = await request(app)
        .get('/data/whats-new.json')
        .expect(200);

      const updates = response.body;
      updates.forEach(update => {
        // Check date is in YYYY-MM-DD format
        expect(update.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        
        // Check date is valid
        const date = new Date(update.date);
        expect(date.toString()).not.toBe('Invalid Date');
      });
    });
  });

  describe('GET /whatsNew.js', () => {
    test('should serve the whatsNew.js script', async () => {
      const response = await request(app)
        .get('/whatsNew.js')
        .expect(200)
        .expect('Content-Type', /javascript/);

      expect(response.text).toContain('WhatsNewPage');
      expect(response.text).toContain('loadUpdates');
    });
  });

  describe('Navigation Links', () => {
    test('home page should include link to whats-new', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.text).toContain('/whats-new');
      expect(response.text).toContain('What\'s New');
    });

    test('whats-new page should include link to home', async () => {
      const response = await request(app)
        .get('/whats-new')
        .expect(200);

      expect(response.text).toContain('href="/"');
      expect(response.text).toContain('Home');
    });
  });

  describe('Accessibility', () => {
    test('whats-new page should have proper heading hierarchy', async () => {
      const response = await request(app)
        .get('/whats-new')
        .expect(200);

      // Should have one h1
      const h1Count = (response.text.match(/<h1/g) || []).length;
      expect(h1Count).toBe(1);

      // Should contain h1 with "What's New"
      expect(response.text).toMatch(/<h1[^>]*>.*What's New.*<\/h1>/s);
    });

    test('whats-new page should have role attributes for status updates', async () => {
      const response = await request(app)
        .get('/whats-new')
        .expect(200);

      expect(response.text).toContain('role="status"');
    });

    test('whats-new page should have semantic time elements in template', async () => {
      const response = await request(app)
        .get('/whatsNew.js')
        .expect(200);

      // Check that the JS creates time elements with datetime attribute
      expect(response.text).toContain('<time datetime');
    });
  });

  describe('Empty State Handling', () => {
    test('whatsNew.js should handle empty updates array', async () => {
      const response = await request(app)
        .get('/whatsNew.js')
        .expect(200);

      // Check for empty state method
      expect(response.text).toContain('showEmptyState');
      expect(response.text).toContain('No updates yet');
    });
  });

  describe('Error Handling', () => {
    test('whatsNew.js should handle fetch errors', async () => {
      const response = await request(app)
        .get('/whatsNew.js')
        .expect(200);

      // Check for error handling
      expect(response.text).toContain('showError');
      expect(response.text).toContain('catch');
    });
  });

  describe('XSS Prevention', () => {
    test('whatsNew.js should escape HTML content', async () => {
      const response = await request(app)
        .get('/whatsNew.js')
        .expect(200);

      // Check for HTML escaping function
      expect(response.text).toContain('escapeHtml');
    });
  });
});
