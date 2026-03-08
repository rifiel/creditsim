'use strict';

/**
 * FootballSection – client-side class that drives the football landing page.
 * Handles tab switching, filtering, API calls, and rendering
 * loading / empty / error states consistently.
 */
class FootballSection {
  constructor() {
    this.activeTab = 'news';
    this.activeCompetitionId = '';
    this.filterFrom = '';
    this.filterTo = '';

    this.panels = {
      news:      document.getElementById('panel-news'),
      results:   document.getElementById('panel-results'),
      fixtures:  document.getElementById('panel-fixtures'),
      standings: document.getElementById('panel-standings')
    };

    this.tabButtons = document.querySelectorAll('[data-tab]');
    this.filterBar  = document.getElementById('filterBar');
    this.detailPanel = document.getElementById('detailPanel');
    this.detailContent = document.getElementById('detailContent');
    this.btnBackToTab = document.getElementById('btnBackToTab');

    this._bindEvents();
    this._initFromURL();
    this.loadCompetitions();
    this._loadActiveTab();
  }

  // ── Initialization ─────────────────────────────────────────────────────────

  _bindEvents() {
    this.tabButtons.forEach((btn) => {
      btn.addEventListener('click', () => this._switchTab(btn.dataset.tab));
    });

    document.getElementById('btnToday').addEventListener('click', () => {
      const today = new Date().toISOString().slice(0, 10);
      document.getElementById('filterFrom').value = today;
      document.getElementById('filterTo').value   = today;
      this._applyFilter();
    });

    document.getElementById('btnThisWeek').addEventListener('click', () => {
      const now   = new Date();
      const day   = now.getDay();
      const mon   = new Date(now); mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
      const sun   = new Date(mon); sun.setDate(mon.getDate() + 6);
      document.getElementById('filterFrom').value = mon.toISOString().slice(0, 10);
      document.getElementById('filterTo').value   = sun.toISOString().slice(0, 10);
      this._applyFilter();
    });

    document.getElementById('btnApplyFilter').addEventListener('click', () => this._applyFilter());

    this.btnBackToTab.addEventListener('click', () => this._showTabsView());
  }

  _initFromURL() {
    const path = window.location.pathname;
    const teamMatch   = path.match(/\/football\/teams\/([^/]+)/);
    const playerMatch = path.match(/\/football\/players\/([^/]+)/);
    if (teamMatch)   { this._showDetail('team',   teamMatch[1]);   return; }
    if (playerMatch) { this._showDetail('player', playerMatch[1]); return; }
  }

  _applyFilter() {
    this.filterFrom = document.getElementById('filterFrom').value;
    this.filterTo   = document.getElementById('filterTo').value;
    this._loadActiveTab();
  }

  _switchTab(tab) {
    this.activeTab = tab;
    this.tabButtons.forEach((btn) => {
      const isActive = btn.dataset.tab === tab;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });
    Object.entries(this.panels).forEach(([key, el]) => {
      el.classList.toggle('d-none', key !== tab);
    });
    // Filter bar not shown for standings (has its own selector)
    this.filterBar.classList.toggle('d-none', tab === 'standings');
    this._loadActiveTab();
  }

  _loadActiveTab() {
    switch (this.activeTab) {
      case 'news':      return this.loadNews();
      case 'results':   return this.loadResults();
      case 'fixtures':  return this.loadFixtures();
      case 'standings': return this.loadStandings();
    }
  }

  // ── Competition Strip ──────────────────────────────────────────────────────

  async loadCompetitions() {
    try {
      const resp = await this._fetch('/api/football/summary');
      if (!resp.ok) return;
      const json = await resp.json();
      const competitions = json.data && json.data.featuredCompetitions || [];
      const strip = document.querySelector('#competitionStrip .container');
      competitions.forEach((comp) => {
        const pill = document.createElement('span');
        pill.className = 'competition-pill';
        pill.dataset.id = comp.id;
        pill.setAttribute('role', 'button');
        pill.setAttribute('tabindex', '0');
        if (comp.logoUrl) {
          const img = document.createElement('img');
          img.src = comp.logoUrl;
          img.alt = comp.name;
          img.loading = 'lazy';
          pill.appendChild(img);
        }
        pill.appendChild(document.createTextNode(comp.name));
        pill.addEventListener('click', () => this._selectCompetition(pill, comp.id));
        pill.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') this._selectCompetition(pill, comp.id);
        });
        strip.appendChild(pill);
      });
    } catch (_) { /* non-fatal */ }
  }

  _selectCompetition(pill, id) {
    document.querySelectorAll('.competition-pill').forEach((p) => {
      p.classList.remove('active');
      p.removeAttribute('aria-pressed');
    });
    pill.classList.add('active');
    pill.setAttribute('aria-pressed', 'true');
    this.activeCompetitionId = id;
    this._loadActiveTab();
  }

  // ── News ───────────────────────────────────────────────────────────────────

  async loadNews() {
    this._showSkeleton(this.panels.news);
    const qs = this._buildQS({ competitionId: this.activeCompetitionId, from: this.filterFrom, to: this.filterTo });
    try {
      const resp = await this._fetch(`/api/football/news${qs}`);
      const json = await resp.json();
      if (!resp.ok) { this._showError(this.panels.news, json.error); return; }
      const articles = json.data && json.data.articles || [];
      if (!articles.length) { this._showEmpty(this.panels.news, 'No news found for this selection.'); return; }
      this.panels.news.innerHTML = articles.map((a) => `
        <div class="news-card">
          <div class="d-flex justify-content-between align-items-start gap-2">
            <a href="${this._esc(a.url || '#')}" target="_blank" rel="noopener noreferrer">
              ${this._esc(a.title)}
            </a>
            ${a.competition ? `<span class="match-competition-badge flex-shrink-0">${this._esc(a.competition.name)}</span>` : ''}
          </div>
          <div class="news-date mt-1">${this._formatDate(a.publishedAt)}</div>
        </div>
      `).join('');
    } catch (_) {
      this._showError(this.panels.news);
    }
  }

  // ── Results ────────────────────────────────────────────────────────────────

  async loadResults() {
    this._showSkeleton(this.panels.results);
    const qs = this._buildQS({
      competitionId: this.activeCompetitionId,
      from: this.filterFrom,
      to: this.filterTo
    });
    try {
      const resp = await this._fetch(`/api/football/results${qs}`);
      const json = await resp.json();
      if (!resp.ok) { this._showError(this.panels.results, json.error); return; }
      const matches = json.data && json.data.matches || [];
      if (!matches.length) { this._showEmpty(this.panels.results, 'No results found for this selection.'); return; }
      this.panels.results.innerHTML = matches.map((m) => this._matchCard(m, true)).join('');
    } catch (_) {
      this._showError(this.panels.results);
    }
  }

  // ── Fixtures ───────────────────────────────────────────────────────────────

  async loadFixtures() {
    this._showSkeleton(this.panels.fixtures);
    const qs = this._buildQS({
      competitionId: this.activeCompetitionId,
      from: this.filterFrom,
      to: this.filterTo
    });
    try {
      const resp = await this._fetch(`/api/football/fixtures${qs}`);
      const json = await resp.json();
      if (!resp.ok) { this._showError(this.panels.fixtures, json.error); return; }
      const matches = json.data && json.data.matches || [];
      if (!matches.length) { this._showEmpty(this.panels.fixtures, 'No upcoming fixtures found.'); return; }
      this.panels.fixtures.innerHTML = matches.map((m) => this._matchCard(m, false)).join('');
    } catch (_) {
      this._showError(this.panels.fixtures);
    }
  }

  // ── Standings ──────────────────────────────────────────────────────────────

  async loadStandings(competitionId) {
    const cid = competitionId || this.activeCompetitionId;
    if (!cid) {
      this.panels.standings.innerHTML = `
        <div class="filter-bar d-flex align-items-center gap-2">
          <label class="fw-semibold small text-muted mb-0">Competition:</label>
          <input type="text" id="standingsCompetitionInput" class="form-control form-control-sm" style="max-width:200px;" placeholder="e.g. PL">
          <button class="btn btn-success btn-sm" id="btnLoadStandings">Load</button>
        </div>
        <div class="state-box">
          <span class="state-icon">🏆</span>
          <h5>Select a competition</h5>
          <p class="text-muted">Enter a competition ID (e.g. PL for Premier League) to view the standings.</p>
        </div>`;
      document.getElementById('btnLoadStandings').addEventListener('click', () => {
        const val = document.getElementById('standingsCompetitionInput').value.trim();
        if (val) this.loadStandings(val);
      });
      return;
    }
    this._showSkeleton(this.panels.standings);
    try {
      const resp = await this._fetch(`/api/football/standings?competitionId=${encodeURIComponent(cid)}`);
      const json = await resp.json();
      if (!resp.ok) { this._showError(this.panels.standings, json.error || (json.details && json.details[0] && json.details[0].msg)); return; }
      const { competition, table } = json.data || {};
      if (!table || !table.length) { this._showEmpty(this.panels.standings, 'No standings available.'); return; }
      this.panels.standings.innerHTML = `
        <h5 class="fw-bold mb-3">${competition ? this._esc(competition.name) : this._esc(cid)} – Standings</h5>
        <div class="table-responsive">
          <table class="table standings-table align-middle">
            <thead>
              <tr>
                <th>#</th>
                <th>Team</th>
                <th class="text-center">P</th>
                <th class="text-center d-none d-sm-table-cell">W</th>
                <th class="text-center d-none d-sm-table-cell">D</th>
                <th class="text-center d-none d-sm-table-cell">L</th>
                <th class="text-center">GD</th>
                <th class="text-center fw-bold">Pts</th>
              </tr>
            </thead>
            <tbody>
              ${table.map((row) => `
                <tr>
                  <td class="rank">${row.rank}</td>
                  <td class="team-name">
                    <a href="/football/teams/${this._esc(row.teamId)}" class="text-decoration-none text-dark team-link"
                       data-team-id="${this._esc(row.teamId)}">
                      ${this._esc(row.team)}
                    </a>
                  </td>
                  <td class="text-center">${row.played}</td>
                  <td class="text-center d-none d-sm-table-cell">${row.won}</td>
                  <td class="text-center d-none d-sm-table-cell">${row.draw}</td>
                  <td class="text-center d-none d-sm-table-cell">${row.lost}</td>
                  <td class="text-center">${row.goalDifference > 0 ? '+' : ''}${row.goalDifference}</td>
                  <td class="text-center fw-bold">${row.points}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>`;

      // Intercept team links for SPA navigation
      this.panels.standings.querySelectorAll('.team-link').forEach((a) => {
        a.addEventListener('click', (e) => {
          e.preventDefault();
          this._showDetail('team', a.dataset.teamId);
        });
      });
    } catch (_) {
      this._showError(this.panels.standings);
    }
  }

  // ── Team / Player Detail ───────────────────────────────────────────────────

  async _showDetail(type, id) {
    // Hide main panels, show detail panel
    Object.values(this.panels).forEach((p) => p.classList.add('d-none'));
    this.filterBar.classList.add('d-none');
    document.querySelector('.football-tabs').classList.add('d-none');
    this.detailPanel.classList.remove('d-none');

    this.detailContent.innerHTML = `
      <div>${[1,2,3].map(() => `<div class="skeleton skeleton-card mb-2"></div>`).join('')}</div>`;

    try {
      if (type === 'team') {
        await this._renderTeam(id);
      } else {
        await this._renderPlayer(id);
      }
    } catch (_) {
      this._showError(this.detailContent);
    }
  }

  _showTabsView() {
    this.detailPanel.classList.add('d-none');
    document.querySelector('.football-tabs').classList.remove('d-none');
    this.filterBar.classList.toggle('d-none', this.activeTab === 'standings');
    Object.entries(this.panels).forEach(([key, el]) => {
      el.classList.toggle('d-none', key !== this.activeTab);
    });
    history.pushState(null, '', '/football');
  }

  async _renderTeam(teamId) {
    const resp = await this._fetch(`/api/football/teams/${encodeURIComponent(teamId)}`);
    const json = await resp.json();
    if (!resp.ok) { this._showError(this.detailContent, json.error); return; }
    const team = json.data;
    const logoHtml = team.logoUrl
      ? `<img src="${this._esc(team.logoUrl)}" alt="${this._esc(team.name)} logo" class="team-logo me-3" loading="lazy">`
      : `<div class="team-logo-placeholder me-3">⚽</div>`;

    const formHtml = (team.recentMatches || []).map((m) => {
      const result = m.score
        ? (m.homeTeam === team.name
            ? (parseInt(m.score) > parseInt(m.score.split('-')[1]) ? 'W' : parseInt(m.score) === parseInt(m.score.split('-')[1]) ? 'D' : 'L')
            : 'D')
        : '?';
      return `<span class="form-badge ${result}" title="${this._esc(m.homeTeam)} vs ${this._esc(m.awayTeam)} ${m.score || ''}">${result}</span>`;
    }).join(' ');

    this.detailContent.innerHTML = `
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body">
          <div class="d-flex align-items-center mb-3">
            ${logoHtml}
            <div>
              <h3 class="mb-1 fw-bold">${this._esc(team.name)}</h3>
              ${team.founded ? `<small class="text-muted">Founded ${team.founded}</small>` : ''}
              ${team.venue ? `<small class="text-muted ms-2">• ${this._esc(team.venue)}</small>` : ''}
            </div>
          </div>
          ${team.competitions.length ? `
            <div class="mb-3">
              <strong class="small text-muted d-block mb-1">COMPETITIONS</strong>
              ${team.competitions.map((c) => `<span class="match-competition-badge me-1">${this._esc(c.name)}</span>`).join('')}
            </div>` : ''}
          ${formHtml ? `
            <div class="mb-3">
              <strong class="small text-muted d-block mb-1">RECENT FORM</strong>
              ${formHtml}
            </div>` : ''}
          ${team.squad.length ? `
            <div>
              <strong class="small text-muted d-block mb-2">SQUAD</strong>
              <div class="row">
                ${team.squad.slice(0, 20).map((p) => `
                  <div class="col-12 col-sm-6 col-md-4">
                    <div class="squad-row d-flex justify-content-between">
                      <a href="/football/players/${this._esc(p.id)}" class="text-decoration-none player-link"
                         data-player-id="${this._esc(p.id)}">${this._esc(p.name)}</a>
                      <span class="text-muted small">${this._esc(p.position || '—')}</span>
                    </div>
                  </div>`).join('')}
              </div>
            </div>` : ''}
        </div>
      </div>`;

    this.detailContent.querySelectorAll('.player-link').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        this._showDetail('player', a.dataset.playerId);
      });
    });

    history.pushState(null, '', `/football/teams/${encodeURIComponent(teamId)}`);
  }

  async _renderPlayer(playerId) {
    const resp = await this._fetch(`/api/football/players/${encodeURIComponent(playerId)}`);
    const json = await resp.json();
    if (!resp.ok) { this._showError(this.detailContent, json.error); return; }
    const p = json.data;

    this.detailContent.innerHTML = `
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body">
          <div class="d-flex align-items-center mb-3">
            <div class="team-logo-placeholder me-3">👤</div>
            <div>
              <h3 class="mb-1 fw-bold">${this._esc(p.name)}</h3>
              ${p.position ? `<span class="badge bg-success me-1">${this._esc(p.position)}</span>` : ''}
              ${p.nationality ? `<span class="badge bg-secondary">${this._esc(p.nationality)}</span>` : ''}
            </div>
          </div>
          <div class="row g-3">
            ${p.dateOfBirth ? `<div class="col-6 col-md-3"><small class="text-muted d-block">Date of Birth</small><strong>${this._esc(p.dateOfBirth)}</strong></div>` : ''}
            ${p.currentTeam ? `<div class="col-6 col-md-3"><small class="text-muted d-block">Current Team</small>
              <a href="/football/teams/${this._esc(p.currentTeam.id)}" class="fw-bold text-decoration-none team-link"
                 data-team-id="${this._esc(p.currentTeam.id)}">${this._esc(p.currentTeam.name)}</a></div>` : ''}
          </div>
        </div>
      </div>`;

    this.detailContent.querySelectorAll('.team-link').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        this._showDetail('team', a.dataset.teamId);
      });
    });

    history.pushState(null, '', `/football/players/${encodeURIComponent(playerId)}`);
  }

  // ── Rendering Helpers ──────────────────────────────────────────────────────

  _matchCard(m, isResult) {
    return `
      <div class="match-card">
        <div class="d-flex align-items-center justify-content-between gap-2">
          <span class="match-team flex-fill text-end">${this._esc(m.homeTeam)}</span>
          <div class="text-center px-2">
            ${isResult && m.score
              ? `<div class="match-score">${this._esc(m.score)}</div>`
              : `<div class="match-vs">VS</div><div class="match-kickoff">${this._formatTime(m.kickoffAt)}</div>`}
          </div>
          <span class="match-team flex-fill">${this._esc(m.awayTeam)}</span>
        </div>
        <div class="d-flex justify-content-between mt-1">
          ${m.competition ? `<span class="match-competition-badge">${this._esc(m.competition.name)}</span>` : '<span></span>'}
          <span class="match-kickoff">${this._formatDate(m.kickoffAt)}</span>
        </div>
      </div>`;
  }

  _showSkeleton(panel) {
    panel.innerHTML = [1, 2, 3, 4].map(() =>
      `<div class="skeleton skeleton-card"></div>`
    ).join('');
  }

  _showEmpty(panel, message = 'Nothing to show here.') {
    panel.innerHTML = `
      <div class="state-box">
        <span class="state-icon">📭</span>
        <h5>No content available</h5>
        <p class="text-muted">${this._esc(message)}</p>
      </div>`;
  }

  _showError(panel, message) {
    const msg = message || 'Something went wrong. Please try again.';
    panel.innerHTML = `
      <div class="error-box">
        <div class="fs-2 mb-2">⚠️</div>
        <h5>Failed to load data</h5>
        <p class="mb-2">${this._esc(msg)}</p>
        <button class="btn btn-sm btn-outline-danger retry-btn">
          <i class="bi bi-arrow-clockwise me-1"></i>Retry
        </button>
      </div>`;
    panel.querySelector('.retry-btn').addEventListener('click', () => this._loadActiveTab());
  }

  // ── Utilities ──────────────────────────────────────────────────────────────

  _buildQS(params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v); });
    const str = qs.toString();
    return str ? `?${str}` : '';
  }

  async _fetch(url) {
    return fetch(url);
  }

  _esc(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  _formatDate(iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (_) { return iso; }
  }

  _formatTime(iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } catch (_) { return iso; }
  }
}

// Boot when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window._footballSection = new FootballSection();
});
