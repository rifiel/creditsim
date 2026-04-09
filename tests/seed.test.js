jest.mock('../src/services/creditScoring', () => ({
  calculateCreditScore: jest.fn()
}));

const { calculateCreditScore } = require('../src/services/creditScoring');
const { seedIfNeeded } = require('../src/database/seed');

describe('Database seed helper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    calculateCreditScore.mockReturnValue({ score: 700, riskCategory: 'Medium risk' });
  });

  test('skips seeding when the database already has at least 30 simulations', async () => {
    const db = {
      countCustomers: jest.fn().mockResolvedValue(30),
      insertCustomer: jest.fn()
    };

    await seedIfNeeded(db);

    expect(db.countCustomers).toHaveBeenCalledTimes(1);
    expect(db.insertCustomer).not.toHaveBeenCalled();
    expect(calculateCreditScore).not.toHaveBeenCalled();
  });

  test('seeds all records when the database has fewer than 30 simulations', async () => {
    const db = {
      countCustomers: jest.fn().mockResolvedValue(0),
      insertCustomer: jest.fn().mockResolvedValue(undefined)
    };

    await seedIfNeeded(db);

    expect(db.countCustomers).toHaveBeenCalledTimes(1);
    expect(calculateCreditScore).toHaveBeenCalledTimes(30);
    expect(db.insertCustomer).toHaveBeenCalledTimes(30);
    expect(db.insertCustomer).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Alice Johnson',
      score: 700,
      riskCategory: 'Medium risk'
    }));
    expect(db.insertCustomer).toHaveBeenLastCalledWith(expect.objectContaining({
      name: 'Diana Adams',
      score: 700,
      riskCategory: 'Medium risk'
    }));
  });
});
