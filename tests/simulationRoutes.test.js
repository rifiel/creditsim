const express = require('express');
const request = require('supertest');

/**
 * Build an isolated Express app instance with mocked route dependencies.
 */
function buildApp() {
  const database = {
    insertCustomer: jest.fn(),
    getAllCustomers: jest.fn(),
    getCustomerById: jest.fn()
  };
  const calculateCreditScore = jest.fn().mockReturnValue({ score: 680, riskCategory: 'Medium risk' });
  const getScoringCriteria = jest.fn().mockReturnValue({ baseScore: 600 });

  jest.doMock('../src/database/database', () => ({ database }));
  jest.doMock('../src/services/creditScoring', () => ({
    calculateCreditScore,
    getScoringCriteria
  }));

  const router = require('../src/routes/simulation');
  const app = express();
  app.use(express.json());
  app.use('/api', router);

  return { app, database, calculateCreditScore, getScoringCriteria };
}

describe('Simulation routes', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('returns 500 when saving a simulation fails', async () => {
    const { app, database } = buildApp();
    database.insertCustomer.mockRejectedValue(new Error('database write failed'));

    const response = await request(app)
      .post('/api/simulate')
      .send({
        name: 'Edge Case User',
        age: 35,
        annualIncome: 60000,
        debtToIncomeRatio: 0.3,
        loanAmount: 25000,
        creditHistory: 'good'
      })
      .expect(500);

    expect(response.body).toEqual({
      error: 'Failed to calculate credit score',
      message: 'database write failed'
    });
  });

  test('returns 500 when listing simulations fails', async () => {
    const { app, database } = buildApp();
    database.getAllCustomers.mockRejectedValue(new Error('database read failed'));

    const response = await request(app)
      .get('/api/simulations')
      .expect(500);

    expect(response.body).toEqual({
      error: 'Failed to fetch simulations',
      message: 'database read failed'
    });
  });

  test('returns 500 when loading a simulation by id fails', async () => {
    const { app, database } = buildApp();
    database.getCustomerById.mockRejectedValue(new Error('lookup failed'));

    const response = await request(app)
      .get('/api/simulation/1')
      .expect(500);

    expect(response.body).toEqual({
      error: 'Failed to fetch simulation',
      message: 'lookup failed'
    });
  });

  test('returns 400 when the simulation id is zero', async () => {
    const { app } = buildApp();

    const response = await request(app)
      .get('/api/simulation/0')
      .expect(400);

    expect(response.body.error).toBe('Validation failed');
    expect(response.body.details[0].msg).toBe('ID must be a positive integer');
  });

  test('returns 500 when scoring criteria lookup throws', async () => {
    const { app, getScoringCriteria } = buildApp();
    getScoringCriteria.mockImplementation(() => {
      throw new Error('criteria unavailable');
    });

    const response = await request(app)
      .get('/api/scoring-criteria')
      .expect(500);

    expect(response.body).toEqual({
      error: 'Failed to fetch scoring criteria',
      message: 'criteria unavailable'
    });
  });
});
