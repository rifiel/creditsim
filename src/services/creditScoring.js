
function calculateCreditScore(customerData) {
  const { age, annualIncome, debtToIncomeRatio, loanAmount, creditHistory } = customerData;
  
  // Validate input data
  validateCustomerData(customerData);
  
  // Start with base score
  let score = 600;
  let factors = [];
  let recommendations = [];
  
  // Age adjustments
  if (age < 25) {
    score -= 50;
    factors.push({
      name: 'Age',
      impact: 'negative',
      weight: 0.15,
      message: `Young age (${age} years) reduced the score by 50 points`
    });
    recommendations.push('Building a longer credit history over time will improve your score');
  } else if (age > 60) {
    score -= 30;
    factors.push({
      name: 'Age',
      impact: 'negative',
      weight: 0.10,
      message: `Senior age (${age} years) reduced the score by 30 points`
    });
  } else {
    factors.push({
      name: 'Age',
      impact: 'positive',
      weight: 0.08,
      message: `Age (${age} years) is in optimal range`
    });
  }
  
  // Income adjustments - more realistic bonuses
  if (annualIncome > 200000) {
    score += 120;
    factors.push({
      name: 'Annual Income',
      impact: 'positive',
      weight: 0.25,
      message: `Very high income ($${annualIncome.toLocaleString()}) increased score by 120 points`
    });
  } else if (annualIncome > 100000) {
    score += 80;
    factors.push({
      name: 'Annual Income',
      impact: 'positive',
      weight: 0.20,
      message: `High income ($${annualIncome.toLocaleString()}) increased score by 80 points`
    });
  } else if (annualIncome > 50000) {
    score += 40;
    factors.push({
      name: 'Annual Income',
      impact: 'positive',
      weight: 0.15,
      message: `Moderate income ($${annualIncome.toLocaleString()}) increased score by 40 points`
    });
  } else {
    factors.push({
      name: 'Annual Income',
      impact: 'neutral',
      weight: 0.10,
      message: `Income ($${annualIncome.toLocaleString()}) is below optimal threshold`
    });
    recommendations.push('Increasing your annual income above $50,000 would improve your credit score');
  }
  
  // Debt-to-income ratio adjustments
  if (debtToIncomeRatio > 0.4) {
    score -= 80;
    factors.push({
      name: 'Debt-to-Income Ratio',
      impact: 'negative',
      weight: 0.30,
      message: `High DTI (${(debtToIncomeRatio * 100).toFixed(1)}%) reduced score by 80 points`
    });
    recommendations.push('Reduce your debt-to-income ratio below 40% to significantly improve your score');
  } else if (debtToIncomeRatio > 0.35) {
    factors.push({
      name: 'Debt-to-Income Ratio',
      impact: 'neutral',
      weight: 0.20,
      message: `Moderate DTI (${(debtToIncomeRatio * 100).toFixed(1)}%) - room for improvement`
    });
    recommendations.push('Consider reducing your debt-to-income ratio below 35%');
  } else {
    factors.push({
      name: 'Debt-to-Income Ratio',
      impact: 'positive',
      weight: 0.15,
      message: `Good DTI (${(debtToIncomeRatio * 100).toFixed(1)}%) - well managed debt`
    });
  }
  
  // Credit history adjustments
  if (creditHistory === 'bad') {
    score -= 150;
    factors.push({
      name: 'Credit History',
      impact: 'negative',
      weight: 0.35,
      message: 'Poor credit history reduced score by 150 points'
    });
    recommendations.push('Focus on making all payments on time to rebuild your credit history');
    recommendations.push('Consider a secured credit card to start rebuilding credit');
  } else {
    factors.push({
      name: 'Credit History',
      impact: 'positive',
      weight: 0.30,
      message: 'Good credit history positively affects your score'
    });
  }
  
  // Loan amount vs income adjustments
  var loanToIncomeRatio = loanAmount / annualIncome;
  if (loanToIncomeRatio > 0.5) {
    score -= 50;
    factors.push({
      name: 'Loan Amount',
      impact: 'negative',
      weight: 0.20,
      message: `High loan-to-income ratio (${(loanToIncomeRatio * 100).toFixed(1)}%) reduced score by 50 points`
    });
    recommendations.push(`Consider requesting a lower loan amount (currently $${loanAmount.toLocaleString()})`);
  } else if (loanToIncomeRatio < 0.1) {
    score += 30;
    factors.push({
      name: 'Loan Amount',
      impact: 'positive',
      weight: 0.10,
      message: `Very low loan-to-income ratio (${(loanToIncomeRatio * 100).toFixed(1)}%) increased score by 30 points`
    });
  } else if (loanToIncomeRatio < 0.25) {
    score += 15;
    factors.push({
      name: 'Loan Amount',
      impact: 'positive',
      weight: 0.12,
      message: `Low loan-to-income ratio (${(loanToIncomeRatio * 100).toFixed(1)}%) increased score by 15 points`
    });
  } else {
    factors.push({
      name: 'Loan Amount',
      impact: 'neutral',
      weight: 0.15,
      message: `Moderate loan-to-income ratio (${(loanToIncomeRatio * 100).toFixed(1)}%)`
    });
  }
  
  // Ensure score doesn't go below 300 or above 850 (typical FICO range)
  score = Math.max(300, Math.min(850, score));
  
  // Determine risk category
  const riskCategory = determineRiskCategory(score);
  
  // Add general recommendations based on final score
  if (score < 650) {
    if (recommendations.length == 0) {
      recommendations.push('Focus on improving multiple factors to raise your score above 650');
    }
  }
  
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
