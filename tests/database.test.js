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
    test('should return the number of customers as a number', async () => {
      const count = await database.countCustomers();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should reject when the database returns an error', async () => {
      const mockError = new Error('count DB error');
      jest.spyOn(database.db, 'get').mockImplementationOnce((sql, params, cb) => cb(mockError));
      await expect(database.countCustomers()).rejects.toThrow('count DB error');
    });
  });

  describe('createTables', () => {
    test('should reject when the database returns an error', async () => {
      const mockError = new Error('create table error');
      jest.spyOn(database.db, 'run').mockImplementationOnce((sql, cb) => cb(mockError));
      await expect(database.createTables()).rejects.toThrow('create table error');
    });
  });

  describe('insertCustomer', () => {
    test('should reject when the database returns an error', async () => {
      const mockError = new Error('insert error');
      jest.spyOn(database.db, 'run').mockImplementationOnce((sql, params, cb) => {
        cb.call({ lastID: null }, mockError);
      });
      const customerData = {
        name: 'Error Test',
        age: 30,
        annualIncome: 50000,
        debtToIncomeRatio: 0.3,
        loanAmount: 15000,
        creditHistory: 'good',
        score: 640,
        riskCategory: 'High risk'
      };
      await expect(database.insertCustomer(customerData)).rejects.toThrow('insert error');
    });
  });

  describe('getAllCustomers', () => {
    test('should reject when the database returns an error', async () => {
      const mockError = new Error('fetch all error');
      jest.spyOn(database.db, 'all').mockImplementationOnce((sql, params, cb) => cb(mockError));
      await expect(database.getAllCustomers()).rejects.toThrow('fetch all error');
    });
  });

  describe('getCustomerById', () => {
    test('should reject when the database returns an error', async () => {
      const mockError = new Error('fetch by id error');
      jest.spyOn(database.db, 'get').mockImplementationOnce((sql, params, cb) => cb(mockError));
      await expect(database.getCustomerById(1)).rejects.toThrow('fetch by id error');
    });
  });

  describe('close', () => {
    test('should reject when the database returns a close error', async () => {
      const mockError = new Error('close error');
      jest.spyOn(database.db, 'close').mockImplementationOnce((cb) => cb(mockError));
      await expect(database.close()).rejects.toThrow('close error');
    });

    test('should resolve immediately when db is null', async () => {
      const savedDb = database.db;
      database.db = null;
      await expect(database.close()).resolves.toBeUndefined();
      database.db = savedDb;
    });
  });
});

describe('initializeDatabase', () => {
  test('should throw and rethrow when connection fails', async () => {
    jest.spyOn(database, 'connect').mockRejectedValueOnce(new Error('connection failed'));
    await expect(initializeDatabase()).rejects.toThrow('connection failed');
  });

  test('should return database instance when initialization succeeds', async () => {
    jest.spyOn(database, 'connect').mockResolvedValueOnce(undefined);
    jest.spyOn(database, 'createTables').mockResolvedValueOnce(undefined);
    // countCustomers returning >= 30 causes seedIfNeeded to skip seeding,
    // verifying the full success path without side effects on the real DB
    jest.spyOn(database, 'countCustomers').mockResolvedValueOnce(30);

    const result = await initializeDatabase();
    expect(result).toBe(database);
  });
});
