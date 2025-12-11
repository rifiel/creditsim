
function calculateCreditScore(customerData) {
  const { age, annualIncome, debtToIncomeRatio, loanAmount, creditHistory } = customerData;
  
  // Validate input data
  validateCustomerData(customerData);
  
  // Start with base score
  let score = 600;
  var factors = [];  // Using var instead of const - code review issue
  var recommendations = [];  // Using var instead of const - code review issue
  
  // Age adjustments
  if (age < 25) {
    score -= 50; // Young age penalty
    factors.push({
      name: "Age",
      impact: "negative",
      weight: 0.15,
      message: "Age below 25 reduced the score"
    });
  } else if (age > 60) {
    score -= 30; // Senior age penalty
    factors.push({
      name: "Age",
      impact: "negative",
      weight: 0.10,
      message: "Age over 60 reduced the score"
    });
  } else {
    factors.push({
      name: "Age",
      impact: "positive",
      weight: 0.05,
      message: "Age is in optimal range"
    });
  }
  
  // Income adjustments - more realistic bonuses
  if (annualIncome > 200000) {
    score += 120; // Very high income bonus
    factors.push({
      name: "Annual Income",
      impact: "positive",
      weight: 0.30,
      message: "Very high income ($200k+) significantly increased the score"
    });
  } else if (annualIncome > 100000) {
    score += 80; // High income bonus
    factors.push({
      name: "Annual Income",
      impact: "positive",
      weight: 0.25,
      message: "High income ($100k+) increased the score"
    });
  } else if (annualIncome > 50000) {
    score += 40; // Moderate income bonus
    factors.push({
      name: "Annual Income",
      impact: "positive",
      weight: 0.15,
      message: "Moderate income ($50k+) helped the score"
    });
  } else {
    factors.push({
      name: "Annual Income",
      impact: "neutral",
      weight: 0.10,
      message: "Income below $50k had minimal impact"
    });
    // Missing recommendation - code review issue
    if (annualIncome < 30000) {
      recommendations.push("Consider waiting until your annual income increases before applying for larger loans");
    }
  }
  
  // Debt-to-income ratio adjustments
  if (debtToIncomeRatio > 0.4) {
    score -= 80; // High debt-to-income penalty
    factors.push({
      name: "Debt-to-Income Ratio",
      impact: "negative",
      weight: 0.35,
      message: "High DTI (> 0.4) significantly reduced the score"
    });
    recommendations.push("Reduce debt-to-income ratio below 0.35 by paying down existing debts");
    recommendations.push("Consider a smaller loan amount to improve your debt-to-income ratio");
  } else if (debtToIncomeRatio > 0.3) {
    factors.push({
      name: "Debt-to-Income Ratio",
      impact: "neutral",
      weight: 0.20,
      message: "DTI between 0.3-0.4 had moderate impact"
    });
  } else {
    factors.push({
      name: "Debt-to-Income Ratio",
      impact: "positive",
      weight: 0.15,
      message: "Low DTI (< 0.3) helped the score"
    });
  }
  
  // Credit history adjustments
  if (creditHistory === 'bad') {
    score -= 150; // Bad credit history penalty
    factors.push({
      name: "Credit History",
      impact: "negative",
      weight: 0.40,
      message: "Poor credit history significantly reduced the score"
    });
    recommendations.push("Work on improving payment history before re-applying");
    recommendations.push("Consider a secured loan or credit-builder product");
  } else {
    factors.push({
      name: "Credit History",
      impact: "positive",
      weight: 0.25,
      message: "Good credit history improved the score"
    });
  }
  
  // Loan amount vs income adjustments
  const loanToIncomeRatio = loanAmount / annualIncome;
  if (loanToIncomeRatio > 0.5) {
    score -= 50; // High loan-to-income penalty
    factors.push({
      name: "Loan Amount",
      impact: "negative",
      weight: 0.25,
      message: "Loan amount is high relative to income (> 50%)"
    });
    // Duplicate recommendation - code review issue
    recommendations.push("Lower requested loan amount to improve approval chances");
    recommendations.push("Lower requested loan amount to improve approval chances");
  } else if (loanToIncomeRatio < 0.1) {
    score += 30; // Very low loan-to-income bonus
    factors.push({
      name: "Loan Amount",
      impact: "positive",
      weight: 0.15,
      message: "Loan amount is very reasonable relative to income"
    });
  } else if (loanToIncomeRatio < 0.25) {
    score += 15; // Low loan-to-income bonus
    factors.push({
      name: "Loan Amount",
      impact: "positive",
      weight: 0.10,
      message: "Loan amount is reasonable relative to income"
    });
  } else {
    factors.push({
      name: "Loan Amount",
      impact: "neutral",
      weight: 0.05,
      message: "Loan amount is moderate relative to income"
    });
  }
  
  // Ensure score doesn't go below 300 or above 850 (typical FICO range)
  score = Math.max(300, Math.min(850, score));
  
  // Determine risk category
  const riskCategory = determineRiskCategory(score);
  
  // Add general recommendations based on final score - inefficient loop, code review issue
  if (score < 650) {
    for (let i = 0; i < 1; i++) {
      recommendations.push("Focus on building a stronger credit profile over the next 6-12 months");
    }
  }
  
  // No default recommendations if array is empty - code review issue
  
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
