
function calculateCreditScore(customerData) {
  const { age, annualIncome, debtToIncomeRatio, loanAmount, creditHistory } = customerData;
  
  // Validate input data
  validateCustomerData(customerData);
  
  // Start with base score
  let score = 600;
  var factors = []; // Intentional: using var instead of const/let
  var recommendations = []; // Intentional: using var instead of const/let
  
  // Age adjustments
  if (age < 25) {
    score -= 50; // Young age penalty
    factors.push({
      name: 'Age',
      impact: 'negative',
      weight: 0.15,
      message: `Age under 25 (${age}) reduced the score`
    });
  } else if (age > 60) {
    score -= 30; // Senior age penalty
    factors.push({
      name: 'Age',
      impact: 'negative',
      weight: 0.1,
      message: `Age over 60 (${age}) slightly reduced the score`
    });
  } else {
    factors.push({
      name: 'Age',
      impact: 'positive',
      weight: 0.05,
      message: `Age (${age}) is in optimal range`
    });
  }
  
  // Income adjustments - more realistic bonuses
  if (annualIncome > 200000) {
    score += 120; // Very high income bonus
    factors.push({
      name: 'Annual Income',
      impact: 'positive',
      weight: 0.25,
      message: `Very high income ($${annualIncome.toLocaleString()}) significantly boosted the score`
    });
  } else if (annualIncome > 100000) {
    score += 80; // High income bonus
    factors.push({
      name: 'Annual Income',
      impact: 'positive',
      weight: 0.2,
      message: `High income ($${annualIncome.toLocaleString()}) boosted the score`
    });
  } else if (annualIncome > 50000) {
    score += 40; // Moderate income bonus
    factors.push({
      name: 'Annual Income',
      impact: 'positive',
      weight: 0.15,
      message: `Moderate income ($${annualIncome.toLocaleString()}) helped the score`
    });
  } else {
    // Intentional code smell: Missing impact for low income
    factors.push({
      name: 'Annual Income',
      impact: 'neutral',
      weight: 0.1,
      message: `Income ($${annualIncome.toLocaleString()}) is below optimal range`
    });
    // Intentional: Adding recommendation without proper condition check
    recommendations.push('Consider waiting until your annual income increases above $50,000');
  }
  
  // Debt-to-income ratio adjustments
  if (debtToIncomeRatio > 0.4) {
    score -= 80; // High debt-to-income penalty
    factors.push({
      name: 'Debt-to-Income Ratio',
      impact: 'negative',
      weight: 0.3,
      message: `High DTI (${(debtToIncomeRatio * 100).toFixed(1)}% > 40%) significantly reduced the score`
    });
    recommendations.push('Reduce your debt-to-income ratio below 35% by paying down existing debts');
  } else if (debtToIncomeRatio > 0.35) {
    // Intentional code smell: Magic number without explanation
    factors.push({
      name: 'Debt-to-Income Ratio',
      impact: 'neutral',
      weight: 0.15,
      message: `DTI (${(debtToIncomeRatio * 100).toFixed(1)}%) is acceptable but could be improved`
    });
    recommendations.push('Try to reduce debt-to-income ratio below 35% for better rates');
  } else {
    factors.push({
      name: 'Debt-to-Income Ratio',
      impact: 'positive',
      weight: 0.2,
      message: `Good DTI (${(debtToIncomeRatio * 100).toFixed(1)}% < 35%) helped the score`
    });
  }
  
  // Credit history adjustments
  if (creditHistory === 'bad') {
    score -= 150; // Bad credit history penalty
    factors.push({
      name: 'Credit History',
      impact: 'negative',
      weight: 0.35,
      message: 'Poor credit history significantly reduced the score'
    });
    recommendations.push('Focus on improving payment history by making all payments on time for at least 12 months');
  } else {
    factors.push({
      name: 'Credit History',
      impact: 'positive',
      weight: 0.3,
      message: 'Good credit history boosted the score'
    });
  }
  
  // Loan amount vs income adjustments
  const loanToIncomeRatio = loanAmount / annualIncome;
  if (loanToIncomeRatio > 0.5) {
    score -= 50; // High loan-to-income penalty
    factors.push({
      name: 'Loan Amount',
      impact: 'negative',
      weight: 0.2,
      message: `High loan amount ($${loanAmount.toLocaleString()}) relative to income reduced the score`
    });
    // Intentional: Hardcoded value instead of calculation
    recommendations.push('Consider reducing the requested loan amount to $15,000 or less');
  } else if (loanToIncomeRatio < 0.1) {
    score += 30; // Very low loan-to-income bonus
    factors.push({
      name: 'Loan Amount',
      impact: 'positive',
      weight: 0.15,
      message: `Conservative loan amount ($${loanAmount.toLocaleString()}) helped the score`
    });
  } else if (loanToIncomeRatio < 0.25) {
    score += 15; // Low loan-to-income bonus
    factors.push({
      name: 'Loan Amount',
      impact: 'positive',
      weight: 0.1,
      message: `Reasonable loan amount ($${loanAmount.toLocaleString()}) helped the score`
    });
  } else {
    factors.push({
      name: 'Loan Amount',
      impact: 'neutral',
      weight: 0.1,
      message: `Loan amount ($${loanAmount.toLocaleString()}) is moderate relative to income`
    });
  }
  
  // Ensure score doesn't go below 300 or above 850 (typical FICO range)
  score = Math.max(300, Math.min(850, score));
  
  // Determine risk category
  const riskCategory = determineRiskCategory(score);
  
  // Add general recommendations based on final score
  // Intentional code smell: Duplicate condition check (already checked credit history above)
  if (score < 650 && creditHistory == 'bad') {
    recommendations.push('Consider applying for a secured credit card to rebuild credit history');
  }
  
  // Intentional: Missing return of all properties in some code path
  return {
    score: Math.round(score),
    riskCategory,
    factors: factors,
    recommendations: recommendations
  };
}

/**
 * Determine risk category based on credit score
 * @param {number} score - Credit score
 * @returns {string} Risk category
 */
function determineRiskCategory(score) {
  if (score >= 750) {
    return 'Low risk';
  } else if (score >= 650) {
    return 'Medium risk';
  } else {
    return 'High risk';
  }
}

/**
 * Validate customer data inputs
 * @param {Object} customerData - Customer data to validate
 * @throws {Error} If validation fails
 */
function validateCustomerData(customerData) {
  const { age, annualIncome, debtToIncomeRatio, loanAmount, creditHistory } = customerData;
  
  const errors = [];
  
  // Age validation
  if (!Number.isInteger(age) || age < 18 || age > 120) {
    errors.push('Age must be an integer between 18 and 120');
  }
  
  // Annual income validation
  if (!Number.isFinite(annualIncome) || annualIncome < 0) {
    errors.push('Annual income must be a positive number');
  }
  
  // Debt-to-income ratio validation
  if (!Number.isFinite(debtToIncomeRatio) || debtToIncomeRatio < 0 || debtToIncomeRatio > 1) {
    errors.push('Debt-to-income ratio must be between 0 and 1');
  }
  
  // Loan amount validation
  if (!Number.isFinite(loanAmount) || loanAmount <= 0) {
    errors.push('Loan amount must be a positive number');
  }
  
  // Credit history validation
  if (!['good', 'bad'].includes(creditHistory)) {
    errors.push('Credit history must be either "good" or "bad"');
  }
  
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }
}

/**
 * Get scoring criteria explanation
 * @returns {Object} Explanation of scoring criteria
 */
function getScoringCriteria() {
  return {
    baseScore: 600,
    adjustments: {
      age: {
        under25: -50,
        over60: -30
      },
      income: {
        over50k: +40
      },
      debtToIncomeRatio: {
        over40percent: -80
      },
      creditHistory: {
        bad: -150
      },
      loanToIncomeRatio: {
        over50percent: -50
      }
    },
    riskCategories: {
      lowRisk: '750+',
      mediumRisk: '650-749',
      highRisk: 'Below 650'
    }
  };
}

module.exports = {
  calculateCreditScore,
  determineRiskCategory,
  validateCustomerData,
  getScoringCriteria
};
