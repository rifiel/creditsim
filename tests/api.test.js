const request = require('supertest');
const app = require('../src/app');
const { database } = require('../src/database/database');

describe('API Endpoints', () => {
  beforeAll(async () => {
    // Initialize database for testing
    await database.connect();
    await database.createTables();
  });

  afterAll(async () => {
    // Clean up database connection
    await database.close();
  });

  describe('POST /api/simulate', () => {
    const validCustomerData = {
      name: 'John Doe',
      age: 35,
      annualIncome: 60000,
      debtToIncomeRatio: 0.3,
      loanAmount: 25000,
      creditHistory: 'good'
    };

    test('should calculate credit score for valid customer data', async () => {
      const response = await request(app)
        .post('/api/simulate')
        .send(validCustomerData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('score');
      expect(response.body).toHaveProperty('riskCategory');
      expect(response.body).toHaveProperty('factors');
      expect(response.body).toHaveProperty('recommendations');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('customer');

      expect(typeof response.body.score).toBe('number');
      expect(['Low risk', 'Medium risk', 'High risk']).toContain(response.body.riskCategory);
      expect(response.body.customer.name).toBe('John Doe');
      
      // Validate factors structure
      expect(Array.isArray(response.body.factors)).toBe(true);
      expect(response.body.factors.length).toBeGreaterThan(0);
      response.body.factors.forEach(factor => {
        expect(factor).toHaveProperty('name');
        expect(factor).toHaveProperty('impact');
        expect(factor).toHaveProperty('weight');
        expect(factor).toHaveProperty('message');
      });
      
      // Validate recommendations structure
      expect(Array.isArray(response.body.recommendations)).toBe(true);
    });

    test('should return 400 for missing required fields', async () => {
      const invalidData = { ...validCustomerData };
      delete invalidData.name;

      const response = await request(app)
        .post('/api/simulate')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Validation failed');
      expect(response.body).toHaveProperty('details');
    });

    test('should return 400 for invalid age', async () => {
      const invalidData = { ...validCustomerData, age: 17 };

      const response = await request(app)
        .post('/api/simulate')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    test('should return 400 for invalid debt-to-income ratio', async () => {
      const invalidData = { ...validCustomerData, debtToIncomeRatio: 1.5 };

      const response = await request(app)
        .post('/api/simulate')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });

    test('should return 400 for invalid credit history', async () => {
      const invalidData = { ...validCustomerData, creditHistory: 'excellent' };

      const response = await request(app)
        .post('/api/simulate')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /api/simulations', () => {
    test('should return list of simulations', async () => {
      const response = await request(app)
        .get('/api/simulations')
        .expect(200);

      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('simulations');
      expect(Array.isArray(response.body.simulations)).toBe(true);
      expect(typeof response.body.count).toBe('number');
    });

    test('should return simulations in correct format', async () => {
      // First create a simulation
      await request(app)
        .post('/api/simulate')
        .send({
          name: 'Test User',
          age: 30,
          annualIncome: 50000,
          debtToIncomeRatio: 0.4,
          loanAmount: 20000,
          creditHistory: 'good'
        });

      const response = await request(app)
        .get('/api/simulations')
        .expect(200);

      if (response.body.simulations.length > 0) {
        const simulation = response.body.simulations[0];
        expect(simulation).toHaveProperty('id');
        expect(simulation).toHaveProperty('name');
        expect(simulation).toHaveProperty('score');
        expect(simulation).toHaveProperty('riskCategory');
        expect(simulation).toHaveProperty('loanAmount');
        expect(simulation).toHaveProperty('createdAt');
      }
    });
  });

  describe('GET /api/simulation/:id', () => {
    let simulationId;

    beforeAll(async () => {
      // Create a simulation to test with
      const response = await request(app)
        .post('/api/simulate')
        .send({
          name: 'Test User for ID',
          age: 28,
          annualIncome: 55000,
          debtToIncomeRatio: 0.25,
          loanAmount: 15000,
          creditHistory: 'good'
        });
      
      simulationId = response.body.id;
    });

    test('should return specific simulation by ID', async () => {
      const response = await request(app)
        .get(`/api/simulation/${simulationId}`)
        .expect(200);

      expect(response.body).toHaveProperty('simulation');
      
      const simulation = response.body.simulation;
      expect(simulation).toHaveProperty('id');
      expect(simulation).toHaveProperty('name');
      expect(simulation).toHaveProperty('age');
      expect(simulation).toHaveProperty('annualIncome');
      expect(simulation).toHaveProperty('debtToIncomeRatio');
      expect(simulation).toHaveProperty('loanAmount');
      expect(simulation).toHaveProperty('creditHistory');
      expect(simulation).toHaveProperty('score');
      expect(simulation).toHaveProperty('riskCategory');
      expect(simulation).toHaveProperty('createdAt');
      
      expect(simulation.id).toBe(simulationId);
      expect(simulation.name).toBe('Test User for ID');
    });

    test('should return 404 for non-existent simulation', async () => {
      const response = await request(app)
        .get('/api/simulation/99999')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Simulation not found');
    });

    test('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/simulation/invalid')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /api/scoring-criteria', () => {
    test('should return scoring criteria', async () => {
      const response = await request(app)
        .get('/api/scoring-criteria')
        .expect(200);

      expect(response.body).toHaveProperty('criteria');
      expect(response.body).toHaveProperty('disclaimer');
      
      const criteria = response.body.criteria;
      expect(criteria).toHaveProperty('baseScore');
      expect(criteria).toHaveProperty('adjustments');
      expect(criteria).toHaveProperty('riskCategories');
      expect(criteria.baseScore).toBe(600);
    });
  });

  describe('GET /api/health', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body.status).toBe('healthy');
    });
  });

  describe('GET /', () => {
    test('should serve the main HTML page', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/text\/html/);
    });
  });

  describe('404 handling', () => {
    test('should return 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/non-existent')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Endpoint not found');
    });
  });

  describe('Score Explanation Integration Tests', () => {
    test('should return factors and recommendations for high-risk customer', async () => {
      const highRiskCustomer = {
        name: 'High Risk Customer',
        age: 22,
        annualIncome: 30000,
        debtToIncomeRatio: 0.45,
        loanAmount: 20000,
        creditHistory: 'bad'
      };

      const response = await request(app)
        .post('/api/simulate')
        .send(highRiskCustomer)
        .expect(201);

      // Verify factors are returned
      expect(response.body.factors).toBeDefined();
      expect(Array.isArray(response.body.factors)).toBe(true);
      expect(response.body.factors.length).toBeGreaterThan(0);

      // Verify at least one negative factor exists
      const negativeFactor = response.body.factors.find(f => f.impact === 'negative');
      expect(negativeFactor).toBeDefined();

      // Verify recommendations are returned
      expect(response.body.recommendations).toBeDefined();
      expect(Array.isArray(response.body.recommendations)).toBe(true);
      expect(response.body.recommendations.length).toBeGreaterThan(0);

      // Verify the score is in high-risk range
      expect(response.body.score).toBeLessThan(650);
      expect(response.body.riskCategory).toBe('High risk');
    });

    test('should return factors and minimal recommendations for low-risk customer', async () => {
      const lowRiskCustomer = {
        name: 'Low Risk Customer',
        age: 40,
        annualIncome: 150000,
        debtToIncomeRatio: 0.15,
        loanAmount: 10000,
        creditHistory: 'good'
      };

      const response = await request(app)
        .post('/api/simulate')
        .send(lowRiskCustomer)
        .expect(201);

      // Verify factors are returned
      expect(response.body.factors).toBeDefined();
      expect(Array.isArray(response.body.factors)).toBe(true);

      // Verify most factors are positive
      const positiveFactors = response.body.factors.filter(f => f.impact === 'positive');
      expect(positiveFactors.length).toBeGreaterThan(0);

      // Verify recommendations are returned (may be empty or minimal)
      expect(response.body.recommendations).toBeDefined();
      expect(Array.isArray(response.body.recommendations)).toBe(true);

      // Verify the score is in good range
      expect(response.body.score).toBeGreaterThanOrEqual(650);
    });

    test('should include specific DTI recommendation when DTI is high', async () => {
      const highDtiCustomer = {
        name: 'High DTI Customer',
        age: 35,
        annualIncome: 60000,
        debtToIncomeRatio: 0.5,
        loanAmount: 15000,
        creditHistory: 'good'
      };

      const response = await request(app)
        .post('/api/simulate')
        .send(highDtiCustomer)
        .expect(201);

      // Verify DTI recommendation is present
      const dtiRecommendation = response.body.recommendations.find(r =>
        r.toLowerCase().includes('debt-to-income')
      );
      expect(dtiRecommendation).toBeDefined();

      // Verify DTI factor shows as negative
      const dtiFactor = response.body.factors.find(f => f.name === 'Debt-to-Income Ratio');
      expect(dtiFactor).toBeDefined();
      expect(dtiFactor.impact).toBe('negative');
    });
  });
});
