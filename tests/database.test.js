const { database, initializeDatabase } = require('../src/database/database');

describe('Database', () => {
  beforeAll(async () => {
    await database.connect();
    await database.createTables();
  });

  afterAll(async () => {
    await database.close();
  });

  describe('countCustomers', () => {
    test('should return a non-negative integer', async () => {
      const count = await database.countCustomers();
      expect(typeof count).toBe('number');
      expect(Number.isInteger(count)).toBe(true);
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should increment by 1 after inserting a new record', async () => {
      const countBefore = await database.countCustomers();

      await database.insertCustomer({
        name: 'DB Test User',
        age: 28,
        annualIncome: 55000,
        debtToIncomeRatio: 0.25,
        loanAmount: 12000,
        creditHistory: 'good',
        score: 655,
        riskCategory: 'Medium risk'
      });

      const countAfter = await database.countCustomers();
      expect(countAfter).toBe(countBefore + 1);
    });
  });

  describe('initializeDatabase', () => {
    test('should propagate errors when connect fails', async () => {
      const originalConnect = database.connect.bind(database);
      database.connect = jest.fn().mockRejectedValue(new Error('Connection failed'));

      await expect(initializeDatabase()).rejects.toThrow('Connection failed');

      database.connect = originalConnect;
    });
  });

  describe('close', () => {
    test('close should resolve without error', async () => {
      // close is already called in afterAll; test that it resolves correctly
      // We test a fresh connection/close cycle here
      const { Database } = (() => {
        // Access the Database class via prototype introspection
        return { Database: Object.getPrototypeOf(database).constructor };
      })();

      const freshDb = new Database();
      // close() on an unconnected instance should resolve (db is null)
      await expect(freshDb.close()).resolves.toBeUndefined();
    });
  });
});
