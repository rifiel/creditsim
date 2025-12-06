const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { database } = require('../database/database');
const { calculateCreditScore, getScoringCriteria } = require('../services/creditScoring');

const router = express.Router();

// Validation middleware
const validateCustomerData = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters'),
  
  body('age')
    .isInt({ min: 18, max: 120 })
    .withMessage('Age must be an integer between 18 and 120'),
  
  body('annualIncome')
    .isFloat({ min: 0 })
    .withMessage('Annual income must be a positive number'),
  
  body('debtToIncomeRatio')
    .isFloat({ min: 0, max: 1 })
    .withMessage('Debt-to-income ratio must be between 0 and 1'),
  
  body('loanAmount')
    .isFloat({ min: 1 })
    .withMessage('Loan amount must be a positive number'),
  
  body('creditHistory')
    .isIn(['good', 'bad'])
    .withMessage('Credit history must be either "good" or "bad"')
];

const validateIdParam = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer')
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * POST /api/simulate
 * Simulate credit score for a customer
 */
router.post('/simulate', validateCustomerData, handleValidationErrors, async (req, res) => {
  try {
    const customerData = req.body;
    
    // Calculate credit score
    const { score, riskCategory, factors, recommendations } = calculateCreditScore(customerData);
    
    // Prepare data for database
    const customerRecord = {
      ...customerData,
      score,
      riskCategory
    };
    
    // Save to database
    const savedCustomer = await database.insertCustomer(customerRecord);
    
    // Return response
    res.status(201).json({
      id: savedCustomer.id,
      score,
      riskCategory,
      factors,
      recommendations,
      message: 'Credit score calculated successfully',
      customer: {
        name: customerData.name,
        age: customerData.age,
        annualIncome: customerData.annualIncome,
        debtToIncomeRatio: customerData.debtToIncomeRatio,
        loanAmount: customerData.loanAmount,
        creditHistory: customerData.creditHistory
      }
    });
    
  } catch (error) {
    console.error('Error in /simulate:', error);
    res.status(500).json({
      error: 'Failed to calculate credit score',
      message: error.message
    });
  }
});

/**
 * GET /api/simulations
 * Get all previous simulations
 */
router.get('/simulations', async (req, res) => {
  try {
    const simulations = await database.getAllCustomers();
    
    res.json({
      count: simulations.length,
      simulations: simulations.map(sim => ({
        id: sim.id,
        name: sim.name,
        score: sim.score,
        riskCategory: sim.riskCategory,
        loanAmount: sim.loanAmount,
        createdAt: sim.createdAt
      }))
    });
    
  } catch (error) {
    console.error('Error in /simulations:', error);
    res.status(500).json({
      error: 'Failed to fetch simulations',
      message: error.message
    });
  }
});

/**
 * GET /api/simulation/:id
 * Get a specific simulation by ID
 */
router.get('/simulation/:id', validateIdParam, handleValidationErrors, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const simulation = await database.getCustomerById(id);
    
    if (!simulation) {
      return res.status(404).json({
        error: 'Simulation not found',
        message: `No simulation found with ID ${id}`
      });
    }
    
    res.json({
      simulation: {
        id: simulation.id,
        name: simulation.name,
        age: simulation.age,
        annualIncome: simulation.annualIncome,
        debtToIncomeRatio: simulation.debtToIncomeRatio,
        loanAmount: simulation.loanAmount,
        creditHistory: simulation.creditHistory,
        score: simulation.score,
        riskCategory: simulation.riskCategory,
        createdAt: simulation.createdAt
      }
    });
    
  } catch (error) {
    console.error('Error in /simulation/:id:', error);
    res.status(500).json({
      error: 'Failed to fetch simulation',
      message: error.message
    });
  }
});

/**
 * GET /api/scoring-criteria
 * Get explanation of scoring criteria
 */
router.get('/scoring-criteria', (req, res) => {
  try {
    const criteria = getScoringCriteria();
    res.json({
      criteria,
      disclaimer: 'This is a demonstration scoring model and should not be used for actual credit decisions.'
    });
  } catch (error) {
    console.error('Error in /scoring-criteria:', error);
    res.status(500).json({
      error: 'Failed to fetch scoring criteria',
      message: error.message
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;
