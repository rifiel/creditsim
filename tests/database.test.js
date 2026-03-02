const { Database } = require('../src/database/database');

describe('Database module', () => {
  let testDb;
  let testCustomerIds = [];

  beforeAll(async () => {
    testDb = new Database();
    await testDb.connect();
    await testDb.createTables();
  });

  beforeEach(() => {
    testCustomerIds = [];
  });

  afterEach(async () => {
    try {
      await testDb.deleteCustomersByIds(testCustomerIds);
    } finally {
      testCustomerIds = [];
    }
  });

  afterAll(async () => {
    await testDb.close();
  });

  test('insertCustomer returns inserted customer with id', async () => {
    const customerData = {
      name: 'Database Test User',
      age: 32,
      annualIncome: 72000,
      debtToIncomeRatio: 0.28,
      loanAmount: 18000,
      creditHistory: 'good',
      score: 690,
      riskCategory: 'Medium risk'
    };

    const result = await testDb.insertCustomer(customerData);
    testCustomerIds.push(result.id);

    expect(result).toEqual(expect.objectContaining(customerData));
    expect(result.id).toBeDefined();
  });

  test('getCustomerById returns matching customer', async () => {
    const customerData = {
      name: 'Database Lookup User',
      age: 40,
      annualIncome: 82000,
      debtToIncomeRatio: 0.22,
      loanAmount: 15000,
      creditHistory: 'good',
      score: 720,
      riskCategory: 'Medium risk'
    };

    const inserted = await testDb.insertCustomer(customerData);
    testCustomerIds.push(inserted.id);
    const fetched = await testDb.getCustomerById(inserted.id);

    expect(fetched).toEqual(expect.objectContaining({
      id: inserted.id,
      name: customerData.name,
      age: customerData.age,
      annualIncome: customerData.annualIncome,
      debtToIncomeRatio: customerData.debtToIncomeRatio,
      loanAmount: customerData.loanAmount,
      creditHistory: customerData.creditHistory,
      score: customerData.score,
      riskCategory: customerData.riskCategory
    }));
  });

  test('getCustomerById returns undefined for missing customer', async () => {
    const fetched = await testDb.getCustomerById(-1);

    expect(fetched).toBeUndefined();
  });

  test('getCustomerById returns undefined for invalid identifier types', async () => {
    await expect(testDb.getCustomerById(undefined)).resolves.toBeUndefined();
    await expect(testDb.getCustomerById(null)).resolves.toBeUndefined();
    await expect(testDb.getCustomerById('not-a-number')).resolves.toBeUndefined();
  });

  test('getAllCustomers includes inserted customer', async () => {
    const customerData = {
      name: 'Database List User',
      age: 29,
      annualIncome: 54000,
      debtToIncomeRatio: 0.33,
      loanAmount: 12000,
      creditHistory: 'good',
      score: 670,
      riskCategory: 'Medium risk'
    };

    const inserted = await testDb.insertCustomer(customerData);
    testCustomerIds.push(inserted.id);
    const customers = await testDb.getAllCustomers();

    const found = customers.find((customer) => customer.id === inserted.id);
    expect(found).toEqual(expect.objectContaining(customerData));
  });

  test('deleteCustomersByIds removes matching customers', async () => {
    const customerData = {
      name: 'Database Delete User',
      age: 31,
      annualIncome: 61000,
      debtToIncomeRatio: 0.26,
      loanAmount: 14000,
      creditHistory: 'good',
      score: 680,
      riskCategory: 'Medium risk'
    };

    const inserted = await testDb.insertCustomer(customerData);
    testCustomerIds.push(inserted.id);

    await testDb.deleteCustomersByIds([inserted.id]);

    const fetched = await testDb.getCustomerById(inserted.id);
    expect(fetched).toBeUndefined();
  });

  test('deleteCustomersByIds removes multiple customers', async () => {
    const firstCustomer = {
      name: 'Database Delete User A',
      age: 33,
      annualIncome: 58000,
      debtToIncomeRatio: 0.3,
      loanAmount: 16000,
      creditHistory: 'good',
      score: 675,
      riskCategory: 'Medium risk'
    };

    const secondCustomer = {
      name: 'Database Delete User B',
      age: 45,
      annualIncome: 91000,
      debtToIncomeRatio: 0.2,
      loanAmount: 22000,
      creditHistory: 'good',
      score: 735,
      riskCategory: 'Medium risk'
    };

    const firstInserted = await testDb.insertCustomer(firstCustomer);
    const secondInserted = await testDb.insertCustomer(secondCustomer);
    testCustomerIds.push(firstInserted.id, secondInserted.id);

    await testDb.deleteCustomersByIds([firstInserted.id, secondInserted.id]);

    await expect(testDb.getCustomerById(firstInserted.id)).resolves.toBeUndefined();
    await expect(testDb.getCustomerById(secondInserted.id)).resolves.toBeUndefined();
  });

  test('deleteCustomersByIds rejects non-integer ids', async () => {
    await expect(testDb.deleteCustomersByIds(['oops'])).rejects.toThrow('Customer IDs must be integers');
  });

  test('deleteCustomersByIds rejects non-array input', async () => {
    await expect(testDb.deleteCustomersByIds('not-an-array')).rejects.toThrow('Customer IDs must be an array');
  });

  test('deleteCustomersByIds rejects too many ids', async () => {
    const tooManyIds = Array.from({ length: 1001 }, (value, index) => index + 1);

    await expect(testDb.deleteCustomersByIds(tooManyIds)).rejects.toThrow('Too many customer IDs');
  });

  test('close handles uninitialized database gracefully', async () => {
    const unopenedDb = new Database();

    await expect(unopenedDb.close()).resolves.toBeUndefined();
  });
});
