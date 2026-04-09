// Mock getScoringCriteria to throw while keeping calculateCreditScore real
jest.mock('../src/services/creditScoring', () => {
  const actual = jest.requireActual('../src/services/creditScoring');
  return {
    ...actual,
    getScoringCriteria: jest.fn().mockImplementation(() => {
      throw new Error('Scoring criteria service error');
    })
  };
});

const request = require('supertest');
const app = require('../src/app');
const { database } = require('../src/database/database');

describe('Scoring Criteria Route - error handling', () => {
  beforeAll(async () => {
    await database.connect();
    await database.createTables();
  });

  afterAll(async () => {
    await database.close();
  });

  test('GET /api/scoring-criteria - should return 500 when service throws', async () => {
    const response = await request(app)
      .get('/api/scoring-criteria')
      .expect(500);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Failed to fetch scoring criteria');
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe('Scoring criteria service error');
  });
});
