'use strict';

/**
 * Football Data Provider Client
 * Wraps calls to an external football data API.
 * Config via env vars:
 *   FOOTBALL_API_KEY      – API key for the provider
 *   FOOTBALL_API_BASE_URL – Base URL (default: https://api.football-data.org/v4)
 */

const FOOTBALL_API_BASE_URL =
  process.env.FOOTBALL_API_BASE_URL || 'https://api.football-data.org/v4';
const FOOTBALL_API_KEY = process.env.FOOTBALL_API_KEY || '';

const DEFAULT_TIMEOUT_MS = 8000;
const MAX_RETRIES = 2;

class ProviderError extends Error {
  constructor(message, type, statusCode) {
    super(message);
    this.name = 'ProviderError';
    this.type = type; // 'NOT_FOUND' | 'TIMEOUT' | 'UPSTREAM'
    this.statusCode = statusCode;
  }
}

/**
 * Sleep helper for retry back-off.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a fetch with timeout and bounded retries.
 * @param {string} url
 * @param {RequestInit} options
 * @param {number} attempt
 */
async function fetchWithRetry(url, options, attempt = 0) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);

    if (response.status === 404) {
      throw new ProviderError('Resource not found', 'NOT_FOUND', 404);
    }

    if (!response.ok) {
      throw new ProviderError(
        `Provider returned HTTP ${response.status}`,
        'UPSTREAM',
        response.status
      );
    }

    return await response.json();
  } catch (err) {
    clearTimeout(timer);

    if (err instanceof ProviderError) {
      // Do not retry on 404 or known provider errors
      if (err.type === 'NOT_FOUND') throw err;
      if (attempt >= MAX_RETRIES) throw err;
      await sleep(200 * (attempt + 1));
      return fetchWithRetry(url, options, attempt + 1);
    }

    // AbortError = timeout
    if (err.name === 'AbortError') {
      if (attempt >= MAX_RETRIES) {
        throw new ProviderError('Provider request timed out', 'TIMEOUT', 504);
      }
      await sleep(200 * (attempt + 1));
      return fetchWithRetry(url, options, attempt + 1);
    }

    // Network / other errors
    if (attempt >= MAX_RETRIES) {
      throw new ProviderError(
        `Provider unreachable: ${err.message}`,
        'UPSTREAM',
        502
      );
    }
    await sleep(200 * (attempt + 1));
    return fetchWithRetry(url, options, attempt + 1);
  }
}

/**
 * Build standard request options.
 */
function buildOptions() {
  const headers = { 'Content-Type': 'application/json' };
  if (FOOTBALL_API_KEY) {
    headers['X-Auth-Token'] = FOOTBALL_API_KEY;
  }
  return { method: 'GET', headers };
}

/**
 * Football Provider Client
 */
const footballProviderClient = {
  /**
   * Fetch competitions (leagues).
   */
  async getCompetitions() {
    const url = `${FOOTBALL_API_BASE_URL}/competitions`;
    return fetchWithRetry(url, buildOptions());
  },

  /**
   * Fetch top-level news headlines (external feed stub).
   * @param {{ competitionId?: string, from?: string, to?: string, limit?: number, offset?: number }} params
   */
  async getNews(params = {}) {
    const qs = new URLSearchParams();
    if (params.competitionId) qs.set('competitions', params.competitionId);
    if (params.from) qs.set('dateFrom', params.from);
    if (params.to) qs.set('dateTo', params.to);
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.offset) qs.set('offset', String(params.offset));
    const url = `${FOOTBALL_API_BASE_URL}/news?${qs.toString()}`;
    return fetchWithRetry(url, buildOptions());
  },

  /**
   * Fetch match results.
   * @param {{ competitionId?: string, date?: string, from?: string, to?: string, limit?: number, offset?: number }} params
   */
  async getResults(params = {}) {
    const qs = new URLSearchParams({ status: 'FINISHED' });
    if (params.competitionId) qs.set('competitions', params.competitionId);
    if (params.date) {
      qs.set('dateFrom', params.date);
      qs.set('dateTo', params.date);
    } else {
      if (params.from) qs.set('dateFrom', params.from);
      if (params.to) qs.set('dateTo', params.to);
    }
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.offset) qs.set('offset', String(params.offset));
    const url = `${FOOTBALL_API_BASE_URL}/matches?${qs.toString()}`;
    return fetchWithRetry(url, buildOptions());
  },

  /**
   * Fetch upcoming fixtures.
   * @param {{ competitionId?: string, date?: string, from?: string, to?: string, limit?: number, offset?: number }} params
   */
  async getFixtures(params = {}) {
    const qs = new URLSearchParams({ status: 'SCHEDULED,TIMED,IN_PLAY' });
    if (params.competitionId) qs.set('competitions', params.competitionId);
    if (params.date) {
      qs.set('dateFrom', params.date);
      qs.set('dateTo', params.date);
    } else {
      if (params.from) qs.set('dateFrom', params.from);
      if (params.to) qs.set('dateTo', params.to);
    }
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.offset) qs.set('offset', String(params.offset));
    const url = `${FOOTBALL_API_BASE_URL}/matches?${qs.toString()}`;
    return fetchWithRetry(url, buildOptions());
  },

  /**
   * Fetch standings for a competition.
   * @param {string} competitionId
   */
  async getStandings(competitionId) {
    const url = `${FOOTBALL_API_BASE_URL}/competitions/${encodeURIComponent(competitionId)}/standings`;
    return fetchWithRetry(url, buildOptions());
  },

  /**
   * Fetch team profile.
   * @param {string} teamId
   */
  async getTeam(teamId) {
    const url = `${FOOTBALL_API_BASE_URL}/teams/${encodeURIComponent(teamId)}`;
    return fetchWithRetry(url, buildOptions());
  },

  /**
   * Fetch recent matches for a team.
   * @param {string} teamId
   */
  async getTeamMatches(teamId) {
    const url = `${FOOTBALL_API_BASE_URL}/teams/${encodeURIComponent(teamId)}/matches?status=FINISHED&limit=5`;
    return fetchWithRetry(url, buildOptions());
  },

  /**
   * Fetch player profile.
   * @param {string} playerId
   */
  async getPlayer(playerId) {
    const url = `${FOOTBALL_API_BASE_URL}/persons/${encodeURIComponent(playerId)}`;
    return fetchWithRetry(url, buildOptions());
  }
};

module.exports = { footballProviderClient, ProviderError };
