'use strict';

/**
 * Football Service
 * Business logic and normalization layer between routes and the provider client.
 * All provider responses are normalized into stable internal DTOs.
 */

const { footballProviderClient, ProviderError } = require('../storage/footballProviderClient');

class FootballServiceError extends Error {
  constructor(message, type, statusCode) {
    super(message);
    this.name = 'FootballServiceError';
    this.type = type; // 'NOT_FOUND' | 'UPSTREAM' | 'TIMEOUT'
    this.statusCode = statusCode;
  }
}

/**
 * Convert provider errors into service-level errors (no provider internals leaked).
 */
function handleProviderError(err) {
  if (err instanceof ProviderError) {
    if (err.type === 'NOT_FOUND') {
      throw new FootballServiceError('Resource not found', 'NOT_FOUND', 404);
    }
    if (err.type === 'TIMEOUT') {
      throw new FootballServiceError(
        'Football data service is temporarily unavailable. Please try again.',
        'UPSTREAM',
        502
      );
    }
    throw new FootballServiceError(
      'Football data service is temporarily unavailable. Please try again.',
      'UPSTREAM',
      502
    );
  }
  throw new FootballServiceError(
    'An unexpected error occurred while fetching football data.',
    'UPSTREAM',
    502
  );
}

// ─── Normalizers ────────────────────────────────────────────────────────────

function normalizeCompetition(comp) {
  return {
    id: String(comp.code || comp.id || ''),
    name: comp.name || '',
    logoUrl: comp.emblem || comp.emblemUrl || comp.logoUrl || null,
    area: comp.area ? comp.area.name : null
  };
}

function normalizeArticle(article) {
  return {
    id: String(article.id || ''),
    title: article.title || '',
    url: article.url || null,
    publishedAt: article.publishedAt || article.utcDate || null,
    competition: article.competition ? normalizeCompetition(article.competition) : null
  };
}

function normalizeMatch(match) {
  const homeScore =
    match.score && match.score.fullTime
      ? match.score.fullTime.home
      : null;
  const awayScore =
    match.score && match.score.fullTime
      ? match.score.fullTime.away
      : null;
  const score =
    homeScore !== null && awayScore !== null
      ? `${homeScore}-${awayScore}`
      : null;

  return {
    matchId: String(match.id || ''),
    homeTeam: match.homeTeam ? match.homeTeam.name : '',
    awayTeam: match.awayTeam ? match.awayTeam.name : '',
    score,
    status: match.status || '',
    kickoffAt: match.utcDate || null,
    finishedAt: match.status === 'FINISHED' ? match.utcDate : null,
    competition: match.competition ? normalizeCompetition(match.competition) : null
  };
}

function normalizeStandingRow(entry) {
  return {
    rank: entry.position,
    team: entry.team ? entry.team.name : '',
    teamId: entry.team ? String(entry.team.id) : '',
    logoUrl: entry.team ? (entry.team.crest || entry.team.crestUrl || null) : null,
    played: entry.playedGames,
    won: entry.won,
    draw: entry.draw,
    lost: entry.lost,
    goalsFor: entry.goalsFor,
    goalsAgainst: entry.goalsAgainst,
    goalDifference: entry.goalDifference,
    points: entry.points
  };
}

function normalizePlayer(person) {
  return {
    id: String(person.id || ''),
    name: person.name || '',
    position: person.position || null,
    nationality: person.nationality || null,
    dateOfBirth: person.dateOfBirth || null,
    currentTeam: person.currentTeam
      ? {
          id: String(person.currentTeam.id),
          name: person.currentTeam.name,
          logoUrl: person.currentTeam.crest || person.currentTeam.crestUrl || null
        }
      : null
  };
}

function normalizeTeam(team) {
  return {
    id: String(team.id || ''),
    name: team.name || team.shortName || '',
    shortName: team.shortName || team.tla || '',
    logoUrl: team.crest || team.crestUrl || null,
    founded: team.founded || null,
    venue: team.venue || null,
    website: team.website || null,
    competitions: Array.isArray(team.runningCompetitions)
      ? team.runningCompetitions.map(normalizeCompetition)
      : [],
    squad: Array.isArray(team.squad)
      ? team.squad.map((p) => ({
          id: String(p.id),
          name: p.name,
          position: p.position || null
        }))
      : []
  };
}

// ─── Service Methods ─────────────────────────────────────────────────────────

const footballService = {
  /**
   * GET /api/football/summary
   * Featured competitions + today's snippets.
   */
  async getSummary(params = {}) {
    try {
      const data = await footballProviderClient.getCompetitions(params.competitionId);
      const competitions = Array.isArray(data.competitions)
        ? data.competitions.slice(0, 5).map(normalizeCompetition)
        : [];

      // Fetch today's matches (both scheduled and finished)
      const today = new Date().toISOString().slice(0, 10);
      let todayFixtures = [];
      let todayResults = [];
      let topNews = [];

      try {
        const fixtureData = await footballProviderClient.getFixtures({
          from: today,
          to: today,
          competitionId: params.competitionId
        });
        todayFixtures = Array.isArray(fixtureData.matches)
          ? fixtureData.matches.slice(0, 5).map(normalizeMatch)
          : [];
      } catch (_) { /* non-fatal */ }

      try {
        const resultData = await footballProviderClient.getResults({
          date: today,
          competitionId: params.competitionId
        });
        todayResults = Array.isArray(resultData.matches)
          ? resultData.matches.slice(0, 5).map(normalizeMatch)
          : [];
      } catch (_) { /* non-fatal */ }

      return {
        featuredCompetitions: competitions,
        topNews,
        todayFixtures,
        todayResults
      };
    } catch (err) {
      return handleProviderError(err);
    }
  },

  /**
   * GET /api/football/news
   */
  async getNews(params = {}) {
    try {
      const data = await footballProviderClient.getNews(params);
      const articles = Array.isArray(data.articles || data.items)
        ? (data.articles || data.items).map(normalizeArticle)
        : [];
      return { articles, count: articles.length };
    } catch (err) {
      return handleProviderError(err);
    }
  },

  /**
   * GET /api/football/results
   */
  async getResults(params = {}) {
    try {
      const data = await footballProviderClient.getResults(params);
      const matches = Array.isArray(data.matches)
        ? data.matches.map(normalizeMatch)
        : [];
      return { matches, count: data.resultSet ? data.resultSet.count : matches.length };
    } catch (err) {
      return handleProviderError(err);
    }
  },

  /**
   * GET /api/football/fixtures
   */
  async getFixtures(params = {}) {
    try {
      const data = await footballProviderClient.getFixtures(params);
      const matches = Array.isArray(data.matches)
        ? data.matches.map(normalizeMatch)
        : [];
      return { matches, count: data.resultSet ? data.resultSet.count : matches.length };
    } catch (err) {
      return handleProviderError(err);
    }
  },

  /**
   * GET /api/football/standings
   */
  async getStandings(competitionId) {
    try {
      const data = await footballProviderClient.getStandings(competitionId);
      const table =
        Array.isArray(data.standings) && data.standings.length > 0
          ? (data.standings[0].table || []).map(normalizeStandingRow)
          : [];
      return {
        competition: data.competition ? normalizeCompetition(data.competition) : null,
        season: data.season || null,
        table
      };
    } catch (err) {
      return handleProviderError(err);
    }
  },

  /**
   * GET /api/football/teams/:teamId
   */
  async getTeam(teamId) {
    try {
      const [teamData, matchData] = await Promise.all([
        footballProviderClient.getTeam(teamId),
        footballProviderClient.getTeamMatches(teamId).catch(() => ({ matches: [] }))
      ]);
      const team = normalizeTeam(teamData);
      team.recentMatches = Array.isArray(matchData.matches)
        ? matchData.matches.slice(0, 5).map(normalizeMatch)
        : [];
      return team;
    } catch (err) {
      return handleProviderError(err);
    }
  },

  /**
   * GET /api/football/players/:playerId
   */
  async getPlayer(playerId) {
    try {
      const data = await footballProviderClient.getPlayer(playerId);
      return normalizePlayer(data);
    } catch (err) {
      return handleProviderError(err);
    }
  }
};

module.exports = { footballService, FootballServiceError };
