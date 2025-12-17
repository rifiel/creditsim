
function calculateCreditScore(customerData) {
  const { age, annualIncome, debtToIncomeRatio, loanAmount, creditHistory } = customerData;
  
  // Validate input data
  validateCustomerData(customerData);
  
  // Start with base score
  let score = 600;
  
  // Age adjustments
  if (age < 25) {
    score -= 50; // Young age penalty
  } else if (age > 60) {
    score -= 30; // Senior age penalty
  }
  
  // Income adjustments - more realistic bonuses
  if (annualIncome > 200000) {
    score += 120; // Very high income bonus
  } else if (annualIncome > 100000) {
    score += 80; // High income bonus
  } else if (annualIncome > 50000) {
    score += 40; // Moderate income bonus
  }
  
  // Debt-to-income ratio adjustments
  if (debtToIncomeRatio > 0.4) {
    score -= 80; // High debt-to-income penalty
  }
  
  // Credit history adjustments
  if (creditHistory === 'bad') {
    score -= 150; // Bad credit history penalty
  }
  
  // Loan amount vs income adjustments
  const loanToIncomeRatio = loanAmount / annualIncome;
  if (loanToIncomeRatio > 0.5) {
    score -= 50; // High loan-to-income penalty
  } else if (loanToIncomeRatio < 0.1) {
    score += 30; // Very low loan-to-income bonus
  } else if (loanToIncomeRatio < 0.25) {
    score += 15; // Low loan-to-income bonus
  }
  
  // Ensure score doesn't go below 300 or above 850 (typical FICO range)
  score = Math.max(300, Math.min(850, score));
  
  // Determine risk category
  const riskCategory = determineRiskCategory(score);
  
  return {
    score: Math.round(score),
    riskCategory
  };
}

/**
 * Calculate credit score with detailed explanation and recommendations
 * @param {Object} customerData - Customer data
 * @returns {Object} Score, risk category, factors, and recommendations
 */
function calculateCreditScoreWithExplanation(customerData) {
  const { age, annualIncome, debtToIncomeRatio, loanAmount, creditHistory } = customerData;
  
  // Validate input data
  validateCustomerData(customerData);
  
  var factors = [];
  var recommendations = [];
  
  // Start with base score
  let score = 600;
  
  // Age factor analysis
  let ageImpact = "neutral";
  let ageWeight = 0.1;
  var ageMessage = "Age is within optimal range";
  
  if (age < 25) {
    score -= 50;
    ageImpact = "negative";
    ageMessage = "Young age (< 25) reduced the score by 50 points";
    recommendations.push("Consider waiting until age 25+ for better rates");
  } else if (age > 60) {
    score -= 30;
    ageImpact = "negative";
    ageMessage = "Senior age (> 60) reduced the score by 30 points";
  }
  
  factors.push({
    name: "Age",
    impact: ageImpact,
    weight: ageWeight,
    message: ageMessage
  });
  
  // Income factor analysis
  let incomeImpact = "neutral";
  let incomeWeight = 0.25;
  let incomeBonus = 0;
  
  if (annualIncome > 200000) {
    incomeBonus = 120;
    score += incomeBonus;
    incomeImpact = "positive";
  } else if (annualIncome > 100000) {
    incomeBonus = 80;
    score += incomeBonus;
    incomeImpact = "positive";
  } else if (annualIncome > 50000) {
    incomeBonus = 40;
    score += incomeBonus;
    incomeImpact = "positive";
  } else {
    recommendations.push("Increase annual income above $50,000 for better score");
  }
  
  factors.push({
    name: "Annual Income",
    impact: incomeImpact,
    weight: incomeWeight,
    message: incomeBonus > 0 ? `High income added ${incomeBonus} points` : "Income is below optimal threshold"
  });
  
  // Debt-to-income ratio analysis
  let dtiImpact = "positive";
  let dtiWeight = 0.3;
  let dtiMessage = "Debt-to-income ratio is healthy (≤ 0.4)";
  
  if (debtToIncomeRatio > 0.4) {
    score -= 80;
    dtiImpact = "negative";
    dtiMessage = "High DTI (> 0.4) reduced the score by 80 points";
    recommendations.push("Reduce debt-to-income ratio below 0.35 by paying down existing debts");
  }
  
  factors.push({
    name: "Debt-to-Income Ratio",
    impact: dtiImpact,
    weight: dtiWeight,
    message: dtiMessage
  });
  
  // Credit history analysis
  let historyImpact = "positive";
  let historyWeight = 0.25;
  var historyMessage = "Good credit history maintained";
  
  if (creditHistory === 'bad') {
    score -= 150;
    historyImpact = "negative";
    historyMessage = "Poor credit history reduced the score by 150 points";
    recommendations.push("Work on improving payment history before reapplying");
  }
  
  factors.push({
    name: "Credit History",
    impact: historyImpact,
    weight: historyWeight,
    message: historyMessage
  });
  
  // Loan-to-income ratio analysis
  const loanToIncomeRatio = loanAmount / annualIncome;
  let ltiImpact = "neutral";
  let ltiWeight = 0.1;
  let ltiMessage = "Loan amount is reasonable relative to income";
  let ltiAdjustment = 0;
  
  if (loanToIncomeRatio > 0.5) {
    ltiAdjustment = -50;
    score -= 50;
    ltiImpact = "negative";
    ltiMessage = "High loan-to-income ratio (> 0.5) reduced score by 50 points";
    if (score < 650) {
      recommendations.push("Lower requested loan amount to improve approval chances");
    }
  } else if (loanToIncomeRatio < 0.1) {
    ltiAdjustment = 30;
    score += 30;
    ltiImpact = "positive";
    ltiMessage = "Very low loan-to-income ratio (< 0.1) added 30 points";
  } else if (loanToIncomeRatio < 0.25) {
    ltiAdjustment = 15;
    score += 15;
    ltiImpact = "positive";
    ltiMessage = "Low loan-to-income ratio (< 0.25) added 15 points";
  }
  
  factors.push({
    name: "Loan Amount",
    impact: ltiImpact,
    weight: ltiWeight,
    message: ltiMessage
  });
  
  // Ensure score doesn't go below 300 or above 850
  score = Math.max(300, Math.min(850, score));
  
  // Determine risk category
  const riskCategory = determineRiskCategory(score);
  
  // Add general recommendations based on risk level
  if (riskCategory === "High risk") {
    recommendations.push("Consider a co-signer to strengthen your application");
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
  calculateCreditScoreWithExplanation,
  determineRiskCategory,
  validateCustomerData,
  getScoringCriteria
};
