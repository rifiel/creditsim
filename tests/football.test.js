'use strict';

/**
 * Football API – critical test cases.
 *
 * The provider client is mocked so tests run without a real football API key.
 */

const request = require('supertest');

// ── Mock the provider client before requiring app ─────────────────────────
jest.mock('../src/storage/footballProviderClient', () => {
  const { ProviderError } = jest.requireActual('../src/storage/footballProviderClient');
  return {
    ProviderError,
    footballProviderClient: {
      getCompetitions: jest.fn(),
      getNews:         jest.fn(),
      getResults:      jest.fn(),
      getFixtures:     jest.fn(),
      getStandings:    jest.fn(),
      getTeam:         jest.fn(),
      getTeamMatches:  jest.fn(),
      getPlayer:       jest.fn()
    }
  };
});

const { footballProviderClient, ProviderError } =
  require('../src/storage/footballProviderClient');

// Enable the football feature flag BEFORE requiring the app
process.env.FOOTBALL_SECTION_ENABLED = 'true';
const app = require('../src/app');

// ── Fixtures ──────────────────────────────────────────────────────────────

describe('GET /api/football/fixtures', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 with normalized matches for a valid competitionId and date range', async () => {
    footballProviderClient.getFixtures.mockResolvedValue({
      matches: [
        {
          id: 'm1',
          homeTeam: { name: 'Arsenal' },
          awayTeam: { name: 'Chelsea' },
          utcDate: '2026-03-10T15:00:00Z',
          status: 'SCHEDULED',
          score: { fullTime: { home: null, away: null } },
          competition: { code: 'PL', name: 'Premier League', emblem: null }
        }
      ]
    });

    const res = await request(app)
      .get('/api/football/fixtures?competitionId=PL&from=2026-03-10&to=2026-03-17')
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('matches');
    expect(Array.isArray(res.body.data.matches)).toBe(true);
    expect(res.body.data.matches.length).toBe(1);

    const match = res.body.data.matches[0];
    expect(match).toHaveProperty('matchId', 'm1');
    expect(match).toHaveProperty('homeTeam', 'Arsenal');
    expect(match).toHaveProperty('awayTeam', 'Chelsea');
    expect(match).toHaveProperty('kickoffAt', '2026-03-10T15:00:00Z');
    expect(match).toHaveProperty('competition');
    expect(match.competition.name).toBe('Premier League');

    expect(res.body).toHaveProperty('message', 'OK');
    expect(res.body).toHaveProperty('metadata');
  });

  test('returns 400 for invalid date format in "from"', async () => {
    const res = await request(app)
      .get('/api/football/fixtures?from=not-a-date')
      .expect(400);

    expect(res.body.error).toBe('Validation failed');
    expect(Array.isArray(res.body.details)).toBe(true);
  });
});

// ── Standings validation ───────────────────────────────────────────────────

describe('GET /api/football/standings', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 400 with field-level error when competitionId is missing', async () => {
    const res = await request(app)
      .get('/api/football/standings')
      .expect(400);

    expect(res.body.error).toBe('Validation failed');
    expect(Array.isArray(res.body.details)).toBe(true);
    const paths = res.body.details.map((d) => d.path);
    expect(paths).toContain('competitionId');
  });

  test('returns 400 when competitionId is 1 character (too short)', async () => {
    const res = await request(app)
      .get('/api/football/standings?competitionId=X')
      .expect(400);

    expect(res.body.error).toBe('Validation failed');
  });

  test('returns 200 with standings table when provider succeeds', async () => {
    footballProviderClient.getStandings.mockResolvedValue({
      competition: { code: 'PL', name: 'Premier League', emblem: null },
      season: { startDate: '2025-08-01' },
      standings: [
        {
          table: [
            {
              position: 1,
              team: { id: 57, name: 'Arsenal', crest: null },
              playedGames: 28,
              won: 18,
              draw: 5,
              lost: 5,
              goalsFor: 60,
              goalsAgainst: 30,
              goalDifference: 30,
              points: 59
            }
          ]
        }
      ]
    });

    const res = await request(app)
      .get('/api/football/standings?competitionId=PL')
      .expect(200);

    expect(res.body.data).toHaveProperty('table');
    expect(res.body.data.table[0].rank).toBe(1);
    expect(res.body.data.table[0].team).toBe('Arsenal');
    expect(res.body.data.table[0].points).toBe(59);
  });
});

// ── Upstream failure → 502 ─────────────────────────────────────────────────

describe('Upstream provider failure', () => {
  beforeEach(() => jest.clearAllMocks());

  test('provider timeout returns 502 with user-friendly message (no provider internals)', async () => {
    footballProviderClient.getFixtures.mockRejectedValue(
      new ProviderError('connection timed out after 8000ms', 'TIMEOUT', 504)
    );

    const res = await request(app)
      .get('/api/football/fixtures?competitionId=PL')
      .expect(502);

    expect(res.body).toHaveProperty('error');
    // Must NOT expose internal provider details
    expect(res.body.error).not.toMatch(/8000ms/);
    expect(res.body.error).not.toMatch(/connection timed out/);
    // Should be user-friendly
    expect(typeof res.body.error).toBe('string');
    expect(res.body.error.length).toBeGreaterThan(0);
  });

  test('provider upstream error returns 502', async () => {
    footballProviderClient.getResults.mockRejectedValue(
      new ProviderError('Provider returned HTTP 503', 'UPSTREAM', 503)
    );

    const res = await request(app)
      .get('/api/football/results?competitionId=PL')
      .expect(502);

    expect(res.body).toHaveProperty('error');
    expect(res.body.error).not.toContain('503');
  });
});

// ── Team detail – 404 ─────────────────────────────────────────────────────

describe('GET /api/football/teams/:teamId', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 404 when team is not found by provider', async () => {
    footballProviderClient.getTeam.mockRejectedValue(
      new ProviderError('Resource not found', 'NOT_FOUND', 404)
    );
    footballProviderClient.getTeamMatches.mockResolvedValue({ matches: [] });

    const res = await request(app)
      .get('/api/football/teams/unknown-team')
      .expect(404);

    expect(res.body).toHaveProperty('error');
  });

  test('returns 400 for invalid teamId (too long)', async () => {
    const longId = 'a'.repeat(65);
    const res = await request(app)
      .get(`/api/football/teams/${longId}`)
      .expect(400);

    expect(res.body.error).toBe('Validation failed');
  });

  test('returns 200 with team profile when provider succeeds', async () => {
    footballProviderClient.getTeam.mockResolvedValue({
      id: 57,
      name: 'Arsenal FC',
      shortName: 'Arsenal',
      tla: 'ARS',
      crest: 'https://example.com/arsenal.png',
      founded: 1886,
      venue: 'Emirates Stadium',
      website: 'https://www.arsenal.com',
      runningCompetitions: [{ code: 'PL', name: 'Premier League', emblem: null }],
      squad: [{ id: 1, name: 'Bukayo Saka', position: 'Right Winger' }]
    });
    footballProviderClient.getTeamMatches.mockResolvedValue({ matches: [] });

    const res = await request(app)
      .get('/api/football/teams/57')
      .expect(200);

    expect(res.body.data).toHaveProperty('name', 'Arsenal FC');
    expect(res.body.data).toHaveProperty('logoUrl', 'https://example.com/arsenal.png');
    expect(res.body.data.competitions[0].name).toBe('Premier League');
    expect(res.body.data.squad[0].name).toBe('Bukayo Saka');
  });
});

// ── Player detail ─────────────────────────────────────────────────────────

describe('GET /api/football/players/:playerId', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 200 with player profile when provider succeeds', async () => {
    footballProviderClient.getPlayer.mockResolvedValue({
      id: 8004,
      name: 'Bukayo Saka',
      position: 'Right Winger',
      nationality: 'England',
      dateOfBirth: '2001-09-05',
      currentTeam: { id: 57, name: 'Arsenal FC', crest: null }
    });

    const res = await request(app)
      .get('/api/football/players/8004')
      .expect(200);

    expect(res.body.data.name).toBe('Bukayo Saka');
    expect(res.body.data.position).toBe('Right Winger');
    expect(res.body.data.currentTeam.name).toBe('Arsenal FC');
  });

  test('returns 404 for unknown player', async () => {
    footballProviderClient.getPlayer.mockRejectedValue(
      new ProviderError('Resource not found', 'NOT_FOUND', 404)
    );

    const res = await request(app)
      .get('/api/football/players/99999')
      .expect(404);

    expect(res.body).toHaveProperty('error');
  });
});

// ── Feature flag ──────────────────────────────────────────────────────────

describe('Football section feature flag', () => {
  test('football endpoints are registered when FOOTBALL_SECTION_ENABLED=true', async () => {
    // Already enabled by process.env above; just verify the routes respond
    footballProviderClient.getFixtures.mockResolvedValue({ matches: [] });
    const res = await request(app).get('/api/football/fixtures?competitionId=PL');
    expect(res.status).not.toBe(404);
  });
});
