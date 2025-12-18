const express = require('express');
const { query, validationResult } = require('express-validator');
const { getHolidayOffers } = require('../services/xmas');

const router = express.Router();

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
 * GET /api/xmas/offers
 * Get special holiday offers
 */
router.get('/offers', async (req, res) => {
  try {
    const offers = getHolidayOffers();
    
    res.json({
      data: {
        offers
      },
      message: 'Offers retrieved successfully',
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    });
    
  } catch (error) {
    console.error('Error in /xmas/offers:', error);
    res.status(500).json({
      error: 'Failed to fetch holiday offers',
      message: error.message
    });
  }
});

module.exports = router;
