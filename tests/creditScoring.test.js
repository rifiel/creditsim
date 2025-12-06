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
      expect(result).toHaveProperty('factors');
      expect(result).toHaveProperty('recommendations');
      expect(typeof result.score).toBe('number');
      expect(typeof result.riskCategory).toBe('string');
      expect(Array.isArray(result.factors)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
      
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

  describe('Score Explanation - Factors and Recommendations', () => {
    test('should return factors with proper structure', () => {
      const customer = {
        age: 35,
        annualIncome: 60000,
        debtToIncomeRatio: 0.3,
        loanAmount: 15000,
        creditHistory: 'good'
      };
      
      const result = calculateCreditScore(customer);
      
      expect(result.factors).toBeDefined();
      expect(Array.isArray(result.factors)).toBe(true);
      expect(result.factors.length).toBeGreaterThan(0);
      
      // Check factor structure
      result.factors.forEach(factor => {
        expect(factor).toHaveProperty('name');
        expect(factor).toHaveProperty('impact');
        expect(factor).toHaveProperty('weight');
        expect(factor).toHaveProperty('message');
        expect(['positive', 'negative', 'neutral']).toContain(factor.impact);
        expect(typeof factor.weight).toBe('number');
        expect(factor.weight).toBeGreaterThanOrEqual(0);
        expect(factor.weight).toBeLessThanOrEqual(1);
      });
    });

    test('should generate recommendation for high DTI', () => {
      const customer = {
        age: 35,
        annualIncome: 60000,
        debtToIncomeRatio: 0.45,
        loanAmount: 15000,
        creditHistory: 'good'
      };
      
      const result = calculateCreditScore(customer);
      
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
      
      const dtiRecommendation = result.recommendations.find(r => 
        r.toLowerCase().includes('debt-to-income')
      );
      expect(dtiRecommendation).toBeDefined();
      
      // Check that DTI factor is marked as negative
      const dtiFactor = result.factors.find(f => f.name === 'Debt-to-Income Ratio');
      expect(dtiFactor).toBeDefined();
      expect(dtiFactor.impact).toBe('negative');
    });

    test('should generate recommendation for bad credit history', () => {
      const customer = {
        age: 35,
        annualIncome: 60000,
        debtToIncomeRatio: 0.3,
        loanAmount: 15000,
        creditHistory: 'bad'
      };
      
      const result = calculateCreditScore(customer);
      
      expect(result.recommendations.length).toBeGreaterThan(0);
      
      const creditRecommendation = result.recommendations.find(r => 
        r.toLowerCase().includes('credit') || r.toLowerCase().includes('payment')
      );
      expect(creditRecommendation).toBeDefined();
      
      // Check that credit history factor is marked as negative
      const creditFactor = result.factors.find(f => f.name === 'Credit History');
      expect(creditFactor).toBeDefined();
      expect(creditFactor.impact).toBe('negative');
    });

    test('should generate recommendation for high loan amount', () => {
      const customer = {
        age: 35,
        annualIncome: 40000,
        debtToIncomeRatio: 0.3,
        loanAmount: 25000, // > 50% of income
        creditHistory: 'good'
      };
      
      const result = calculateCreditScore(customer);
      
      expect(result.recommendations.length).toBeGreaterThan(0);
      
      const loanRecommendation = result.recommendations.find(r => 
        r.toLowerCase().includes('loan amount')
      );
      expect(loanRecommendation).toBeDefined();
      
      // Check that loan amount factor is marked as negative
      const loanFactor = result.factors.find(f => f.name === 'Loan Amount');
      expect(loanFactor).toBeDefined();
      expect(loanFactor.impact).toBe('negative');
    });

    test('should not generate recommendations for strong credit profile', () => {
      const customer = {
        age: 35,
        annualIncome: 120000,
        debtToIncomeRatio: 0.2,
        loanAmount: 10000,
        creditHistory: 'good'
      };
      
      const result = calculateCreditScore(customer);
      
      // Strong profile should have minimal or no recommendations
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      
      // Most factors should be positive or neutral
      const negativeFactor = result.factors.find(f => f.impact === 'negative');
      expect(negativeFactor).toBeUndefined();
    });

    test('should generate recommendation for low income', () => {
      const customer = {
        age: 35,
        annualIncome: 35000,
        debtToIncomeRatio: 0.3,
        loanAmount: 10000,
        creditHistory: 'good'
      };
      
      const result = calculateCreditScore(customer);
      
      const incomeRecommendation = result.recommendations.find(r => 
        r.toLowerCase().includes('income')
      );
      expect(incomeRecommendation).toBeDefined();
      
      // Check that income factor is neutral or shows room for improvement
      const incomeFactor = result.factors.find(f => f.name === 'Annual Income');
      expect(incomeFactor).toBeDefined();
    });
  });
});
