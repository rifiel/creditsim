
function calculateCreditScore(customerData) {
  const { age, annualIncome, debtToIncomeRatio, loanAmount, creditHistory } = customerData;
  
  // Validate input data
  validateCustomerData(customerData);
  
  // Start with base score
  let score = 600;
  const factors = [];
  const recommendations = [];
  
  // Age adjustments
  if (age < 25) {
    score -= 50; // Young age penalty
    factors.push({
      name: 'Age',
      impact: 'negative',
      weight: 0.1,
      message: `Young age (${age}) reduced the score by 50 points`
    });
    recommendations.push('Build credit history over time; age is a factor that will improve naturally');
  } else if (age > 60) {
    score -= 30; // Senior age penalty
    factors.push({
      name: 'Age',
      impact: 'negative',
      weight: 0.08,
      message: `Senior age (${age}) reduced the score by 30 points`
    });
  } else {
    factors.push({
      name: 'Age',
      impact: 'neutral',
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
      message: `Very high income ($${annualIncome.toLocaleString()}) increased the score by 120 points`
    });
  } else if (annualIncome > 100000) {
    score += 80; // High income bonus
    factors.push({
      name: 'Annual Income',
      impact: 'positive',
      weight: 0.2,
      message: `High income ($${annualIncome.toLocaleString()}) increased the score by 80 points`
    });
  } else if (annualIncome > 50000) {
    score += 40; // Moderate income bonus
    factors.push({
      name: 'Annual Income',
      impact: 'positive',
      weight: 0.15,
      message: `Moderate income ($${annualIncome.toLocaleString()}) increased the score by 40 points`
    });
  } else {
    factors.push({
      name: 'Annual Income',
      impact: 'negative',
      weight: 0.15,
      message: `Income ($${annualIncome.toLocaleString()}) is below preferred threshold`
    });
    recommendations.push('Increase annual income through salary negotiation, additional income sources, or career advancement');
  }
  
  // Debt-to-income ratio adjustments
  if (debtToIncomeRatio > 0.4) {
    score -= 80; // High debt-to-income penalty
    factors.push({
      name: 'Debt-to-Income Ratio',
      impact: 'negative',
      weight: 0.3,
      message: `High DTI (${(debtToIncomeRatio * 100).toFixed(1)}% > 40%) reduced the score by 80 points`
    });
    recommendations.push('Reduce debt-to-income ratio below 40% by paying down existing debts or increasing income');
  } else if (debtToIncomeRatio > 0.35) {
    factors.push({
      name: 'Debt-to-Income Ratio',
      impact: 'negative',
      weight: 0.2,
      message: `Elevated DTI (${(debtToIncomeRatio * 100).toFixed(1)}%) may affect approval`
    });
    recommendations.push('Consider reducing debt-to-income ratio below 35% for better loan terms');
  } else {
    factors.push({
      name: 'Debt-to-Income Ratio',
      impact: 'positive',
      weight: 0.2,
      message: `Healthy DTI (${(debtToIncomeRatio * 100).toFixed(1)}%) is favorable`
    });
  }
  
  // Credit history adjustments
  if (creditHistory === 'bad') {
    score -= 150; // Bad credit history penalty
    factors.push({
      name: 'Credit History',
      impact: 'negative',
      weight: 0.35,
      message: 'Poor credit history reduced the score by 150 points'
    });
    recommendations.push('Improve payment history by making all payments on time and addressing outstanding delinquencies');
    recommendations.push('Consider working with a credit counselor to develop a debt repayment plan');
  } else {
    factors.push({
      name: 'Credit History',
      impact: 'positive',
      weight: 0.35,
      message: 'Good credit history is a strong positive factor'
    });
  }
  
  // Loan amount vs income adjustments
  const loanToIncomeRatio = loanAmount / annualIncome;
  if (loanToIncomeRatio > 0.5) {
    score -= 50; // High loan-to-income penalty
    factors.push({
      name: 'Loan Amount',
      impact: 'negative',
      weight: 0.15,
      message: `Loan amount ($${loanAmount.toLocaleString()}) is high relative to income (${(loanToIncomeRatio * 100).toFixed(1)}% of annual income)`
    });
    recommendations.push(`Lower requested loan amount below $${Math.round(annualIncome * 0.5).toLocaleString()} (50% of annual income)`);
  } else if (loanToIncomeRatio < 0.1) {
    score += 30; // Very low loan-to-income bonus
    factors.push({
      name: 'Loan Amount',
      impact: 'positive',
      weight: 0.1,
      message: `Conservative loan amount ($${loanAmount.toLocaleString()}) increased the score by 30 points`
    });
  } else if (loanToIncomeRatio < 0.25) {
    score += 15; // Low loan-to-income bonus
    factors.push({
      name: 'Loan Amount',
      impact: 'positive',
      weight: 0.1,
      message: `Moderate loan amount ($${loanAmount.toLocaleString()}) increased the score by 15 points`
    });
  } else {
    factors.push({
      name: 'Loan Amount',
      impact: 'neutral',
      weight: 0.1,
      message: `Loan amount ($${loanAmount.toLocaleString()}) is reasonable relative to income`
    });
  }
  
  // Ensure score doesn't go below 300 or above 850 (typical FICO range)
  score = Math.max(300, Math.min(850, score));
  
  // Determine risk category
  const riskCategory = determineRiskCategory(score);
  
  // Add general recommendations based on risk category
  if (riskCategory === 'High risk') {
    if (recommendations.length === 0) {
      recommendations.push('Focus on improving credit history and reducing debt obligations');
    }
    recommendations.push('Consider applying for a smaller loan amount or working with a co-signer');
  } else if (riskCategory === 'Medium risk' && recommendations.length === 0) {
    recommendations.push('Your application is borderline; addressing any negative factors could improve approval chances');
  }
  
  return {
    score: Math.round(score),
    riskCategory,
    factors,
    recommendations: recommendations.length > 0 ? recommendations : ['Your credit profile is strong; maintain current financial practices']
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
