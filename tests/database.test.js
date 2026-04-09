const path = require('path');

function loadDatabaseModule({
  openError = null,
  runError = null,
  allError = null,
  getError = null,
  closeError = null,
  allRows = [{ id: 1 }],
  getRow = { id: 1 },
  lastID = 42,
  seedReject = null
} = {}) {
  jest.resetModules();

  const runMock = jest.fn((sql, params, callback) => {
    const cb = typeof params === 'function' ? params : callback;
    if (cb) {
      cb.call({ lastID }, runError);
    }
  });
  const allMock = jest.fn((sql, params, callback) => callback(allError, allRows));
  const getMock = jest.fn((sql, params, callback) => callback(getError, getRow));
  const closeMock = jest.fn((callback) => callback(closeError));

  const DatabaseMock = jest.fn((dbPath, flags, callback) => {
    const instance = {
      run: runMock,
      all: allMock,
      get: getMock,
      close: closeMock
    };
    callback(openError);
    return instance;
  });

  const seedIfNeeded = seedReject
    ? jest.fn().mockRejectedValue(seedReject)
    : jest.fn().mockResolvedValue(undefined);

  jest.doMock('sqlite3', () => ({
    verbose: () => ({
      Database: DatabaseMock,
      OPEN_READWRITE: 1,
      OPEN_CREATE: 2
    })
  }));

  jest.doMock('../src/database/seed', () => ({
    seedIfNeeded
  }));

  const module = require('../src/database/database');

  return {
    ...module,
    seedIfNeeded,
    mocks: {
      DatabaseMock,
      runMock,
      allMock,
      getMock,
      closeMock
    }
  };
}

describe('Database module', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('connect opens the configured SQLite database and enables foreign keys', async () => {
    const { database, mocks } = loadDatabaseModule();

    await database.connect();

    expect(mocks.DatabaseMock).toHaveBeenCalledWith(
      path.join('/home/runner/work/creditsim/creditsim/src/database', '../../data/creditsim.db'),
      3,
      expect.any(Function)
    );
    expect(mocks.runMock).toHaveBeenCalledWith('PRAGMA foreign_keys = ON');
  });

  test('connect rejects when SQLite fails to open the database', async () => {
    const error = new Error('open failed');
    const { database } = loadDatabaseModule({ openError: error });

    await expect(database.connect()).rejects.toThrow('open failed');
  });

  test('createTables rejects when the customers table cannot be created', async () => {
    const error = new Error('create failed');
    const { database } = loadDatabaseModule({ runError: error });

    await database.connect();

    await expect(database.createTables()).rejects.toThrow('create failed');
  });

  test('insertCustomer resolves with the inserted customer id', async () => {
    const { database } = loadDatabaseModule({ lastID: 99 });
    const customer = {
      name: 'Jane Doe',
      age: 40,
      annualIncome: 90000,
      debtToIncomeRatio: 0.2,
      loanAmount: 20000,
      creditHistory: 'good',
      score: 700,
      riskCategory: 'Medium risk'
    };

    await database.connect();

    await expect(database.insertCustomer(customer)).resolves.toEqual({ id: 99, ...customer });
  });

  test('insertCustomer rejects when SQLite returns an insert error', async () => {
    const error = new Error('insert failed');
    const { database } = loadDatabaseModule({ runError: error });

    await database.connect();

    await expect(database.insertCustomer({
      name: 'Jane Doe',
      age: 40,
      annualIncome: 90000,
      debtToIncomeRatio: 0.2,
      loanAmount: 20000,
      creditHistory: 'good',
      score: 700,
      riskCategory: 'Medium risk'
    })).rejects.toThrow('insert failed');
  });

  test('getAllCustomers and getCustomerById reject when SQLite queries fail', async () => {
    const error = new Error('query failed');
    const { database } = loadDatabaseModule({ allError: error, getError: error });

    await database.connect();

    await expect(database.getAllCustomers()).rejects.toThrow('query failed');
    await expect(database.getCustomerById(1)).rejects.toThrow('query failed');
  });

  test('countCustomers returns the stored row count', async () => {
    const { database } = loadDatabaseModule({ getRow: { count: 12 } });

    await database.connect();

    await expect(database.countCustomers()).resolves.toBe(12);
  });

  test('countCustomers rejects when SQLite cannot return the count', async () => {
    const error = new Error('count failed');
    const { database } = loadDatabaseModule({ getError: error });

    await database.connect();

    await expect(database.countCustomers()).rejects.toThrow('count failed');
  });

  test('close resolves when there is no open database connection', async () => {
    const { database } = loadDatabaseModule();

    await expect(database.close()).resolves.toBeUndefined();
  });

  test('close rejects when SQLite fails to close the connection', async () => {
    const error = new Error('close failed');
    const { database } = loadDatabaseModule({ closeError: error });

    await database.connect();

    await expect(database.close()).rejects.toThrow('close failed');
  });

  test('initializeDatabase connects, creates tables, and seeds when setup succeeds', async () => {
    const { database, initializeDatabase, seedIfNeeded } = loadDatabaseModule();

    const result = await initializeDatabase();

    expect(result).toBe(database);
    expect(seedIfNeeded).toHaveBeenCalledWith(database);
  });

  test('initializeDatabase rejects when seeding fails', async () => {
    const error = new Error('seed failed');
    const { initializeDatabase } = loadDatabaseModule({ seedReject: error });

    await expect(initializeDatabase()).rejects.toThrow('seed failed');
  });
});
