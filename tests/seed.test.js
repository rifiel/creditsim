const { seedIfNeeded } = require('../src/database/seed');

describe('Seed', () => {
  describe('seedIfNeeded', () => {
    test('should skip seeding when database already has 30 records', async () => {
      const mockDb = {
        countCustomers: jest.fn().mockResolvedValue(30),
        insertCustomer: jest.fn()
      };

      await seedIfNeeded(mockDb);

      expect(mockDb.countCustomers).toHaveBeenCalledTimes(1);
      expect(mockDb.insertCustomer).not.toHaveBeenCalled();
    });

    test('should skip seeding when database has more than 30 records', async () => {
      const mockDb = {
        countCustomers: jest.fn().mockResolvedValue(55),
        insertCustomer: jest.fn()
      };

      await seedIfNeeded(mockDb);

      expect(mockDb.insertCustomer).not.toHaveBeenCalled();
    });

    test('should seed all records when database is empty', async () => {
      const mockDb = {
        countCustomers: jest.fn().mockResolvedValue(0),
        insertCustomer: jest.fn().mockResolvedValue({ id: 1 })
      };

      await seedIfNeeded(mockDb);

      expect(mockDb.insertCustomer).toHaveBeenCalledTimes(30);
    });

    test('should seed all records when database has fewer than 30 records', async () => {
      const mockDb = {
        countCustomers: jest.fn().mockResolvedValue(10),
        insertCustomer: jest.fn().mockResolvedValue({ id: 1 })
      };

      await seedIfNeeded(mockDb);

      expect(mockDb.insertCustomer).toHaveBeenCalledTimes(30);
    });

    test('should insert records with calculated score and valid riskCategory', async () => {
      const insertedRecords = [];
      const mockDb = {
        countCustomers: jest.fn().mockResolvedValue(0),
        insertCustomer: jest.fn().mockImplementation(async (record) => {
          insertedRecords.push(record);
          return { id: insertedRecords.length };
        })
      };

      await seedIfNeeded(mockDb);

      expect(insertedRecords.length).toBe(30);
      for (const record of insertedRecords) {
        expect(record).toHaveProperty('score');
        expect(record).toHaveProperty('riskCategory');
        expect(typeof record.score).toBe('number');
        expect(record.score).toBeGreaterThanOrEqual(300);
        expect(record.score).toBeLessThanOrEqual(850);
        expect(['Low risk', 'Medium risk', 'High risk']).toContain(record.riskCategory);
      }
    });

    test('should preserve original customer fields when inserting', async () => {
      const insertedRecords = [];
      const mockDb = {
        countCustomers: jest.fn().mockResolvedValue(0),
        insertCustomer: jest.fn().mockImplementation(async (record) => {
          insertedRecords.push(record);
          return { id: insertedRecords.length };
        })
      };

      await seedIfNeeded(mockDb);

      const firstRecord = insertedRecords[0];
      expect(firstRecord).toHaveProperty('name');
      expect(firstRecord).toHaveProperty('age');
      expect(firstRecord).toHaveProperty('annualIncome');
      expect(firstRecord).toHaveProperty('debtToIncomeRatio');
      expect(firstRecord).toHaveProperty('loanAmount');
      expect(firstRecord).toHaveProperty('creditHistory');
    });
  });
});
