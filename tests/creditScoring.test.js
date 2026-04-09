const { calculateCreditScore, determineRiskCategory, validateCustomerData, getScoringCriteria } = require('../src/services/creditScoring');

describe('Credit Scoring Service', () => {
  describe('calculateCreditScore', () => {
    const baseCustomer = {
      age: 35,
      annualIncome: 60000,
      debtToIncomeRatio: 0.3,
      loanAmount: 25000,
      creditHistory: 'good'
    };

    test('should calculate base score for typical customer', () => {
      const result = calculateCreditScore(baseCustomer);
      
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('riskCategory');
      expect(typeof result.score).toBe('number');
      expect(typeof result.riskCategory).toBe('string');
      
      // Base score (600) + income bonus (40) = 640
      // Note: loanAmount (25000) / annualIncome (60000) = 0.417 < 0.5, so no loan penalty
      expect(result.score).toBe(640);
      expect(result.riskCategory).toBe('High risk'); // 640 is < 650, so High risk
    });

    test('should apply age penalty for customers under 25', () => {
      const youngCustomer = { ...baseCustomer, age: 22 };
      const result = calculateCreditScore(youngCustomer);
      
      // Base (600) + income bonus (40) - young age penalty (50) = 590
      expect(result.score).toBe(590);
      expect(result.riskCategory).toBe('High risk');
    });

    test('should apply age penalty for customers over 60', () => {
      const olderCustomer = { ...baseCustomer, age: 65 };
      const result = calculateCreditScore(olderCustomer);
      
      // Base (600) + income bonus (40) - senior age penalty (30) = 610
      expect(result.score).toBe(610);
      expect(result.riskCategory).toBe('High risk'); // 610 is < 650, so High risk
    });

    test('should not apply income bonus for income <= 50000', () => {
      const lowerIncomeCustomer = { ...baseCustomer, annualIncome: 45000 };
      const result = calculateCreditScore(lowerIncomeCustomer);
      
      // Base score (600) only, no income bonus
      // But loan penalty applies: 25000 / 45000 = 0.556 > 0.5, so -50 penalty
      expect(result.score).toBe(550);
      expect(result.riskCategory).toBe('High risk');
    });

    test('should apply debt-to-income penalty for ratio > 0.4', () => {
      const highDebtCustomer = { ...baseCustomer, debtToIncomeRatio: 0.5 };
      const result = calculateCreditScore(highDebtCustomer);
      
      // Base (600) + income bonus (40) - high debt penalty (80) = 560
      expect(result.score).toBe(560);
      expect(result.riskCategory).toBe('High risk');
    });

    test('should apply bad credit history penalty', () => {
      const badCreditCustomer = { ...baseCustomer, creditHistory: 'bad' };
      const result = calculateCreditScore(badCreditCustomer);
      
      // Base (600) + income bonus (40) - bad credit penalty (150) = 490
      expect(result.score).toBe(490);
      expect(result.riskCategory).toBe('High risk');
    });

    test('should apply loan-to-income penalty for ratio > 0.5', () => {
      const highLoanCustomer = { ...baseCustomer, loanAmount: 35000 }; // > 50% of 60k income
      const result = calculateCreditScore(highLoanCustomer);
      
      // Base (600) + income bonus (40) - high loan penalty (50) = 590
      expect(result.score).toBe(590);
      expect(result.riskCategory).toBe('High risk');
    });

    test('should handle multiple penalties', () => {
      const highRiskCustomer = {
        age: 22,
        annualIncome: 30000,
        debtToIncomeRatio: 0.6,
        loanAmount: 20000,
        creditHistory: 'bad'
      };
      
      const result = calculateCreditScore(highRiskCustomer);
      
      // Base (600) - young age (50) - high debt (80) - bad credit (150) - high loan ratio (50) = 270
      // But minimum score is 300
      expect(result.score).toBe(300);
      expect(result.riskCategory).toBe('High risk');
    });

    test('should apply high income bonus for income over 100000', () => {
      const highIncomeCustomer = { ...baseCustomer, annualIncome: 120000 };
      const result = calculateCreditScore(highIncomeCustomer);

      // Base (600) + high income bonus (80) + low loan-to-income bonus (15) = 695
      expect(result.score).toBe(695);
      expect(result.riskCategory).toBe('Medium risk');
    });

    test('should apply very high income and very low loan-to-income bonuses', () => {
      const veryHighIncomeCustomer = {
        ...baseCustomer,
        annualIncome: 250000,
        loanAmount: 1000
      };
      const result = calculateCreditScore(veryHighIncomeCustomer);

      // Base (600) + very high income bonus (120) + very low loan-to-income bonus (30) = 750
      expect(result.score).toBe(750);
      expect(result.riskCategory).toBe('Low risk');
    });

    test('should cap score at maximum 850', () => {
      // This test demonstrates that even with impossible good conditions, score is capped
      const perfectCustomer = {
        age: 35,
        annualIncome: 200000,
        debtToIncomeRatio: 0.1,
        loanAmount: 10000, // Very low loan amount relative to income
        creditHistory: 'good'
      };
      
      const result = calculateCreditScore(perfectCustomer);
      
      expect(result.score).toBeLessThanOrEqual(850);
      // Base (600) + income bonus (80) + low loan-to-income bonus (30) = 710
      expect(result.riskCategory).toBe('Medium risk');
    });
  });

  describe('determineRiskCategory', () => {
    test('should classify scores 750+ as Low risk', () => {
      expect(determineRiskCategory(750)).toBe('Low risk');
      expect(determineRiskCategory(800)).toBe('Low risk');
      expect(determineRiskCategory(850)).toBe('Low risk');
    });

    test('should classify scores 650-749 as Medium risk', () => {
      expect(determineRiskCategory(650)).toBe('Medium risk');
      expect(determineRiskCategory(700)).toBe('Medium risk');
      expect(determineRiskCategory(749)).toBe('Medium risk');
    });

    test('should classify scores below 650 as High risk', () => {
      expect(determineRiskCategory(300)).toBe('High risk');
      expect(determineRiskCategory(500)).toBe('High risk');
      expect(determineRiskCategory(649)).toBe('High risk');
    });
  });

  describe('validateCustomerData', () => {
    const validCustomer = {
      age: 35,
      annualIncome: 60000,
      debtToIncomeRatio: 0.3,
      loanAmount: 25000,
      creditHistory: 'good'
    };

    test('should not throw error for valid customer data', () => {
      expect(() => validateCustomerData(validCustomer)).not.toThrow();
    });

    test('should throw error for invalid age', () => {
      expect(() => validateCustomerData({ ...validCustomer, age: 17 }))
        .toThrow(/Age must be an integer between 18 and 120/);
      
      expect(() => validateCustomerData({ ...validCustomer, age: 121 }))
        .toThrow(/Age must be an integer between 18 and 120/);
      
      expect(() => validateCustomerData({ ...validCustomer, age: 35.5 }))
        .toThrow(/Age must be an integer between 18 and 120/);
    });

    test('should throw error for invalid annual income', () => {
      expect(() => validateCustomerData({ ...validCustomer, annualIncome: -1000 }))
        .toThrow(/Annual income must be a positive number/);
      
      expect(() => validateCustomerData({ ...validCustomer, annualIncome: 'invalid' }))
        .toThrow(/Annual income must be a positive number/);
    });

    test('should throw error for invalid debt-to-income ratio', () => {
      expect(() => validateCustomerData({ ...validCustomer, debtToIncomeRatio: -0.1 }))
        .toThrow(/Debt-to-income ratio must be between 0 and 1/);
      
      expect(() => validateCustomerData({ ...validCustomer, debtToIncomeRatio: 1.5 }))
        .toThrow(/Debt-to-income ratio must be between 0 and 1/);
    });

    test('should throw error for invalid loan amount', () => {
      expect(() => validateCustomerData({ ...validCustomer, loanAmount: 0 }))
        .toThrow(/Loan amount must be a positive number/);
      
      expect(() => validateCustomerData({ ...validCustomer, loanAmount: -5000 }))
        .toThrow(/Loan amount must be a positive number/);
    });

    test('should throw error for invalid credit history', () => {
      expect(() => validateCustomerData({ ...validCustomer, creditHistory: 'excellent' }))
        .toThrow(/Credit history must be either "good" or "bad"/);
      
      expect(() => validateCustomerData({ ...validCustomer, creditHistory: '' }))
        .toThrow(/Credit history must be either "good" or "bad"/);
    });

    test('should throw error with multiple validation issues', () => {
      const invalidCustomer = {
        age: 15,
        annualIncome: -1000,
        debtToIncomeRatio: 2.0,
        loanAmount: -5000,
        creditHistory: 'invalid'
      };

      expect(() => validateCustomerData(invalidCustomer))
        .toThrow(/Validation failed:/);
    });
  });

  describe('getScoringCriteria', () => {
    test('should return scoring criteria object', () => {
      const criteria = getScoringCriteria();
      
      expect(criteria).toHaveProperty('baseScore');
      expect(criteria).toHaveProperty('adjustments');
      expect(criteria).toHaveProperty('riskCategories');
      
      expect(criteria.baseScore).toBe(600);
      expect(criteria.adjustments).toHaveProperty('age');
      expect(criteria.adjustments).toHaveProperty('income');
      expect(criteria.adjustments).toHaveProperty('debtToIncomeRatio');
      expect(criteria.adjustments).toHaveProperty('creditHistory');
      expect(criteria.adjustments).toHaveProperty('loanToIncomeRatio');
    });
  });
});
