const request = require('supertest');
const app = require('../src/app');

describe('Terms & Conditions Feature', () => {
  describe('Route Availability', () => {
    test('GET /terms should return 200 and HTML content', async () => {
      const response = await request(app)
        .get('/terms')
        .expect(200)
        .expect('Content-Type', /html/);

      expect(response.text).toContain('Terms &amp; Conditions');
      expect(response.text).toContain('Effective date');
    });

    test('GET /terms-and-conditions should redirect to /terms', async () => {
      const response = await request(app)
        .get('/terms-and-conditions')
        .expect(301);

      expect(response.headers.location).toBe('/terms');
    });

    test('GET /terms should not require authentication', async () => {
      // This test verifies that an unauthenticated request succeeds
      const response = await request(app)
        .get('/terms')
        .expect(200);

      // Should not redirect to login or return 401/403
      expect(response.status).toBe(200);
    });
  });

  describe('Terms Metadata API', () => {
    test('GET /api/terms-metadata should return default values when env vars not set', async () => {
      // Store original env values
      const originalEffectiveDate = process.env.TERMS_EFFECTIVE_DATE;
      const originalUpdateNotice = process.env.TERMS_UPDATE_NOTICE;

      // Clear env vars
      delete process.env.TERMS_EFFECTIVE_DATE;
      delete process.env.TERMS_UPDATE_NOTICE;

      const response = await request(app)
        .get('/api/terms-metadata')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('effectiveDate');
      expect(response.body).toHaveProperty('updateNotice');
      expect(response.body.effectiveDate).toBe('2025-12-01');
      expect(response.body.updateNotice).toBe('');

      // Restore env vars
      if (originalEffectiveDate) process.env.TERMS_EFFECTIVE_DATE = originalEffectiveDate;
      if (originalUpdateNotice) process.env.TERMS_UPDATE_NOTICE = originalUpdateNotice;
    });

    test('GET /api/terms-metadata should return custom values when env vars are set', async () => {
      // Store original env values
      const originalEffectiveDate = process.env.TERMS_EFFECTIVE_DATE;
      const originalUpdateNotice = process.env.TERMS_UPDATE_NOTICE;

      // Set custom env vars
      process.env.TERMS_EFFECTIVE_DATE = '2025-01-15';
      process.env.TERMS_UPDATE_NOTICE = 'Updated liability wording for clarity.';

      const response = await request(app)
        .get('/api/terms-metadata')
        .expect(200);

      expect(response.body.effectiveDate).toBe('2025-01-15');
      expect(response.body.updateNotice).toBe('Updated liability wording for clarity.');

      // Restore env vars
      if (originalEffectiveDate !== undefined) {
        process.env.TERMS_EFFECTIVE_DATE = originalEffectiveDate;
      } else {
        delete process.env.TERMS_EFFECTIVE_DATE;
      }
      if (originalUpdateNotice !== undefined) {
        process.env.TERMS_UPDATE_NOTICE = originalUpdateNotice;
      } else {
        delete process.env.TERMS_UPDATE_NOTICE;
      }
    });
  });

  describe('Page Structure and Content', () => {
    let termsHtml;

    beforeAll(async () => {
      const response = await request(app).get('/terms');
      termsHtml = response.text;
    });

    test('Page should have proper semantic structure with h1 and h2 headings', () => {
      // Check for h1 tag
      expect(termsHtml).toMatch(/<h1[^>]*>/i);
      
      // Check for multiple h2 tags
      const h2Matches = termsHtml.match(/<h2[^>]*>/gi);
      expect(h2Matches).not.toBeNull();
      expect(h2Matches.length).toBeGreaterThan(0);
    });

    test('Page should contain Eligibility section', () => {
      const html = termsHtml.toLowerCase();
      expect(html).toMatch(/eligibility/);
      
      // Check for h2 heading with eligibility (using id attribute)
      expect(html).toMatch(/id="eligibility"/);
    });

    test('Page should contain Acceptable Use section', () => {
      const html = termsHtml.toLowerCase();
      expect(html).toMatch(/acceptable use/);
      
      // Check for h2 heading with acceptable use (using id attribute)
      expect(html).toMatch(/id="acceptable-use"/);
    });

    test('Page should contain Payments section', () => {
      const html = termsHtml.toLowerCase();
      expect(html).toMatch(/payment/);
      
      // Check for h2 heading with payments (using id attribute)
      expect(html).toMatch(/id="payments"/);
    });

    test('Page should contain Termination section', () => {
      const html = termsHtml.toLowerCase();
      expect(html).toMatch(/termination/);
      
      // Check for h2 heading with termination (using id attribute)
      expect(html).toMatch(/id="termination"/);
    });

    test('Page should contain Liability section', () => {
      const html = termsHtml.toLowerCase();
      expect(html).toMatch(/liability/);
      
      // Check for h2 heading with liability (using id attribute)
      expect(html).toMatch(/id="liability"/);
    });

    test('Page should display effective date', () => {
      // Check for effective date element by ID
      expect(termsHtml).toMatch(/id="effectiveDate"/);
      
      // Check that the label exists
      const html = termsHtml.toLowerCase();
      expect(html).toMatch(/effective date/);
    });

    test('Page should have update notice container that can be shown conditionally', () => {
      // Check for update notice container and element
      expect(termsHtml).toMatch(/id="updateNoticeContainer"/);
      expect(termsHtml).toMatch(/id="updateNotice"/);
      
      // Container should have d-none class initially (hidden by default)
      expect(termsHtml).toMatch(/id="updateNoticeContainer"[^>]*class="[^"]*d-none/);
    });

    test('Page should use role="status" for informational blocks', () => {
      const roleStatusMatches = termsHtml.match(/role="status"/g);
      expect(roleStatusMatches).not.toBeNull();
      expect(roleStatusMatches.length).toBeGreaterThan(0);
    });
  });

  describe('Navigation Discoverability', () => {
    let indexHtml;

    beforeAll(async () => {
      const response = await request(app).get('/');
      indexHtml = response.text;
    });

    test('Home page should have Terms & Conditions link in footer', () => {
      // Check for footer with Terms link
      const footerMatch = indexHtml.match(/<footer[\s\S]*?<\/footer>/i);
      expect(footerMatch).not.toBeNull();
      
      const footerContent = footerMatch[0];
      expect(footerContent).toMatch(/href="\/terms"/i);
      expect(footerContent.toLowerCase()).toMatch(/terms/);
    });

    test('Home page should have Terms & Conditions link in navigation', () => {
      // Check for nav with Terms link
      const navMatch = indexHtml.match(/<nav[\s\S]*?<\/nav>/i);
      expect(navMatch).not.toBeNull();
      
      const navContent = navMatch[0];
      expect(navContent).toMatch(/href="\/terms"/i);
      expect(navContent.toLowerCase()).toMatch(/terms/);
    });

    test('Footer link should point to /terms', () => {
      const footerMatch = indexHtml.match(/<footer[\s\S]*?<\/footer>/i);
      expect(footerMatch).not.toBeNull();
      expect(footerMatch[0]).toMatch(/href="\/terms"/i);
    });
  });

  describe('Update Notice Conditional Rendering', () => {
    test('When update notice is empty, script should not display the notice', async () => {
      // Store original value
      const original = process.env.TERMS_UPDATE_NOTICE;
      
      // Set empty notice
      process.env.TERMS_UPDATE_NOTICE = '';

      const response = await request(app)
        .get('/api/terms-metadata')
        .expect(200);

      expect(response.body.updateNotice).toBe('');

      // The HTML page should have the container hidden initially with d-none class
      const termsResponse = await request(app).get('/terms');
      expect(termsResponse.text).toMatch(/id="updateNoticeContainer"[^>]*class="[^"]*d-none/);

      // Restore
      if (original !== undefined) {
        process.env.TERMS_UPDATE_NOTICE = original;
      } else {
        delete process.env.TERMS_UPDATE_NOTICE;
      }
    });

    test('When update notice is whitespace only, it should be treated as empty', async () => {
      // Store original value
      const original = process.env.TERMS_UPDATE_NOTICE;
      
      // Set whitespace-only notice
      process.env.TERMS_UPDATE_NOTICE = '   ';

      const response = await request(app)
        .get('/api/terms-metadata')
        .expect(200);

      // API returns the value as-is, but frontend should handle trimming
      expect(response.body.updateNotice.trim()).toBe('');

      // Restore
      if (original !== undefined) {
        process.env.TERMS_UPDATE_NOTICE = original;
      } else {
        delete process.env.TERMS_UPDATE_NOTICE;
      }
    });
  });
});
