const express = require('express');
const { query, validationResult } = require('express-validator');
const { publicHolidaysProvider } = require('../services/publicHolidaysProvider');

const router = express.Router();

// Validation middleware for holidays endpoint
const validateHolidaysQuery = [
  query('country')
    .notEmpty()
    .withMessage('Country code is required')
    .isLength({ min: 2, max: 2 })
    .withMessage('Country code must be 2 characters (ISO 3166-1 alpha-2)')
    .isAlpha()
    .withMessage('Country code must contain only letters')
    .toUpperCase(),
  
  query('year')
    .notEmpty()
    .withMessage('Year is required')
    .isInt({ min: 1900, max: 2100 })
    .withMessage('Year must be an integer between 1900 and 2100')
    .toInt(),
  
  query('observed')
    .optional()
    .isBoolean()
    .withMessage('Observed must be a boolean value')
    .toBoolean()
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return res.status(400).json({
      error: 'validation_error',
      message: firstError.msg
    });
  }
  next();
};

/**
 * GET /api/public-holidays/countries
 * Get list of supported countries
 */
router.get('/countries', async (req, res) => {
  try {
    const countries = await publicHolidaysProvider.listCountries();
    
    res.json({
      countries
    });
  } catch (error) {
    console.error('Error in /api/public-holidays/countries:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to retrieve country list'
    });
  }
});

/**
 * GET /api/public-holidays?country=US&year=2025&observed=true
 * Get public holidays for a specific country and year
 */
router.get('/', validateHolidaysQuery, handleValidationErrors, async (req, res) => {
  try {
    const { country, year, observed = false } = req.query;
    
    const result = await publicHolidaysProvider.getHolidays(country, year, observed);
    
    res.json(result);
  } catch (error) {
    console.error('Error in /api/public-holidays:', error);
    res.status(500).json({
      error: 'internal_error',
      message: 'Failed to retrieve holidays'
    });
  }
});

module.exports = router;
