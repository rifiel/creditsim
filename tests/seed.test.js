const { seedIfNeeded } = require('../src/database/seed');

describe('seedIfNeeded', () => {
  test('should skip seeding when count is already >= 30', async () => {
    const mockDb = {
      countCustomers: jest.fn().mockResolvedValue(30),
      insertCustomer: jest.fn()
    };

    await seedIfNeeded(mockDb);

    expect(mockDb.insertCustomer).not.toHaveBeenCalled();
  });

  test('should seed all records when database has fewer than 30 records', async () => {
    const mockDb = {
      countCustomers: jest.fn().mockResolvedValue(0),
      insertCustomer: jest.fn().mockResolvedValue({ id: 1 })
    };

    await seedIfNeeded(mockDb);

    expect(mockDb.insertCustomer).toHaveBeenCalledTimes(30);
  });

  test('should seed when database has some but fewer than 30 records', async () => {
    const mockDb = {
      countCustomers: jest.fn().mockResolvedValue(15),
      insertCustomer: jest.fn().mockResolvedValue({ id: 1 })
    };

    await seedIfNeeded(mockDb);

    expect(mockDb.insertCustomer).toHaveBeenCalledTimes(30);
  });

  test('each inserted record should have score and riskCategory computed', async () => {
    const inserted = [];
    const mockDb = {
      countCustomers: jest.fn().mockResolvedValue(0),
      insertCustomer: jest.fn().mockImplementation((record) => {
        inserted.push(record);
        return Promise.resolve({ id: inserted.length, ...record });
      })
    };

    await seedIfNeeded(mockDb);

    expect(inserted).toHaveLength(30);
    for (const record of inserted) {
      expect(record).toHaveProperty('score');
      expect(record).toHaveProperty('riskCategory');
      expect(typeof record.score).toBe('number');
      expect(['Low risk', 'Medium risk', 'High risk']).toContain(record.riskCategory);
    }
  });
});
