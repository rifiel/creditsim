'use strict';

const express = require('express');
const { query, param, validationResult } = require('express-validator');
const { footballService, FootballServiceError } = require('../services/football');

const router = express.Router();

// ─── Validation Rules ────────────────────────────────────────────────────────

const competitionIdRule = query('competitionId')
  .optional()
  .trim()
  .isLength({ min: 2, max: 50 })
  .withMessage('competitionId must be between 2 and 50 characters');

const fromDateRule = query('from')
  .optional()
  .isISO8601()
  .withMessage('from must be a valid ISO 8601 date');

const toDateRule = query('to')
  .optional()
  .isISO8601()
  .withMessage('to must be a valid ISO 8601 date');

const dateRule = query('date')
  .optional()
  .isISO8601()
  .withMessage('date must be a valid ISO 8601 date');

const limitRule = query('limit')
  .optional()
  .isInt({ min: 1, max: 50 })
  .withMessage('limit must be an integer between 1 and 50');

const offsetRule = query('offset')
  .optional()
  .isInt({ min: 0, max: 10000 })
  .withMessage('offset must be an integer between 0 and 10000');

const teamIdRule = param('teamId')
  .trim()
  .matches(/^[A-Za-z0-9_-]{1,64}$/)
  .withMessage('teamId must be 1–64 alphanumeric, underscore, or hyphen characters');

const playerIdRule = param('playerId')
  .trim()
  .matches(/^[A-Za-z0-9_-]{1,64}$/)
  .withMessage('playerId must be 1–64 alphanumeric, underscore, or hyphen characters');

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function standardResponse(data) {
  return {
    data,
    message: 'OK',
    metadata: {
      timestamp: new Date().toISOString(),
      version: '1.0'
    }
  };
}

function handleServiceError(err, res) {
  if (err instanceof FootballServiceError) {
    if (err.type === 'NOT_FOUND') {
      return res.status(404).json({ error: err.message });
    }
    return res.status(502).json({ error: err.message });
  }
  console.error('Unexpected football route error:', err);
  return res.status(500).json({ error: 'An unexpected error occurred.' });
}

// ─── Routes ──────────────────────────────────────────────────────────────────

/**
 * GET /api/football/summary
 */
router.get(
  '/summary',
  [competitionIdRule, handleValidationErrors],
  async (req, res) => {
    try {
      const params = {};
      if (req.query.competitionId) params.competitionId = req.query.competitionId;
      const data = await footballService.getSummary(params);
      res.json(standardResponse(data));
    } catch (err) {
      handleServiceError(err, res);
    }
  }
);

/**
 * GET /api/football/news
 */
router.get(
  '/news',
  [competitionIdRule, fromDateRule, toDateRule, limitRule, offsetRule, handleValidationErrors],
  async (req, res) => {
    try {
      const params = {};
      if (req.query.competitionId) params.competitionId = req.query.competitionId;
      if (req.query.from) params.from = req.query.from;
      if (req.query.to) params.to = req.query.to;
      if (req.query.limit) params.limit = parseInt(req.query.limit, 10);
      if (req.query.offset) params.offset = parseInt(req.query.offset, 10);
      const data = await footballService.getNews(params);
      res.json(standardResponse(data));
    } catch (err) {
      handleServiceError(err, res);
    }
  }
);

/**
 * GET /api/football/results
 */
router.get(
  '/results',
  [competitionIdRule, dateRule, fromDateRule, toDateRule, limitRule, offsetRule, handleValidationErrors],
  async (req, res) => {
    try {
      const params = {};
      if (req.query.competitionId) params.competitionId = req.query.competitionId;
      if (req.query.date) params.date = req.query.date;
      if (req.query.from) params.from = req.query.from;
      if (req.query.to) params.to = req.query.to;
      if (req.query.limit) params.limit = parseInt(req.query.limit, 10);
      if (req.query.offset) params.offset = parseInt(req.query.offset, 10);
      const data = await footballService.getResults(params);
      res.json(standardResponse(data));
    } catch (err) {
      handleServiceError(err, res);
    }
  }
);

/**
 * GET /api/football/fixtures
 */
router.get(
  '/fixtures',
  [competitionIdRule, dateRule, fromDateRule, toDateRule, limitRule, offsetRule, handleValidationErrors],
  async (req, res) => {
    try {
      const params = {};
      if (req.query.competitionId) params.competitionId = req.query.competitionId;
      if (req.query.date) params.date = req.query.date;
      if (req.query.from) params.from = req.query.from;
      if (req.query.to) params.to = req.query.to;
      if (req.query.limit) params.limit = parseInt(req.query.limit, 10);
      if (req.query.offset) params.offset = parseInt(req.query.offset, 10);
      const data = await footballService.getFixtures(params);
      res.json(standardResponse(data));
    } catch (err) {
      handleServiceError(err, res);
    }
  }
);

/**
 * GET /api/football/standings
 * competitionId is required
 */
router.get(
  '/standings',
  [
    query('competitionId')
      .trim()
      .notEmpty()
      .withMessage('competitionId is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('competitionId must be between 2 and 50 characters'),
    handleValidationErrors
  ],
  async (req, res) => {
    try {
      const data = await footballService.getStandings(req.query.competitionId);
      res.json(standardResponse(data));
    } catch (err) {
      handleServiceError(err, res);
    }
  }
);

/**
 * GET /api/football/teams/:teamId
 */
router.get(
  '/teams/:teamId',
  [teamIdRule, handleValidationErrors],
  async (req, res) => {
    try {
      const data = await footballService.getTeam(req.params.teamId);
      res.json(standardResponse(data));
    } catch (err) {
      handleServiceError(err, res);
    }
  }
);

/**
 * GET /api/football/players/:playerId
 */
router.get(
  '/players/:playerId',
  [playerIdRule, handleValidationErrors],
  async (req, res) => {
    try {
      const data = await footballService.getPlayer(req.params.playerId);
      res.json(standardResponse(data));
    } catch (err) {
      handleServiceError(err, res);
    }
  }
);

module.exports = router;
