const { Database } = require('../src/database/database');

describe('Database module', () => {
  let testDb;

  beforeAll(async () => {
    testDb = new Database();
    await testDb.connect();
    await testDb.createTables();
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
    const fetched = await testDb.getCustomerById(9999999);

    expect(fetched).toBeUndefined();
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
    const customers = await testDb.getAllCustomers();

    expect(customers.some((customer) => customer.id === inserted.id)).toBe(true);
  });

  test('close succeeds on unopened database connection', async () => {
    const unopenedDb = new Database();

    await expect(unopenedDb.close()).resolves.toBeUndefined();
  });
});
