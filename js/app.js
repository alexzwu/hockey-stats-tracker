/**
 * Main Application Logic & Game Controller
 */

class HockeyStatsApp {
  constructor() {
    this.storageKey = 'hockey_current_game_v1';
    this.selectedPlayerId = null;
    this.currentLineFilter = 'ALL';
    this.game = this.loadGame();
  }

  init() {
    this.setupNavigation();
    this.setupScoreboardInputs();
    this.renderLineFilters();
    this.renderSpotterGrid();
    this.renderEventButtons();
    this.renderLiveFeed();
    this.renderStatsTables();
    this.renderSettings();
    this.renderRosterTab();
    this.updateScoreboardDisplay();
    this.updateUndoButton();

    // Re-render when window gains focus or orientation changes
    window.addEventListener('resize', () => this.renderSpotterGrid());
  }

  loadGame() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Error loading game:', e);
    }

    return this.createNewGameObject();
  }

  createNewGameObject() {
    return {
      id: 'game_' + Date.now(),
      date: new Date().toISOString().slice(0, 10),
      homeTeam: 'Our Team',
      awayTeam: 'Opponent',
      homeScore: 0,
      awayScore: 0,
      opponentShots: { P1: 0, P2: 0, P3: 0, OT: 0 },
      currentPeriod: 'P1',
      events: []
    };
  }

  saveGame() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.game));
      this.updateScoreboardDisplay();
      this.updateUndoButton();
    } catch (e) {
      console.error('Failed to save game:', e);
    }
  }

  /* --- Navigation --- */
  setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');

        const targetTab = item.getAttribute('data-tab');
        document.querySelectorAll('.tab-content').forEach(tab => {
          tab.classList.remove('active');
        });
        const activeTabEl = document.getElementById(targetTab);
        if (activeTabEl) {
          activeTabEl.classList.add('active');
        }

        if (targetTab === 'stats-tab') {
          this.renderStatsTables();
        } else if (targetTab === 'roster-tab') {
          this.renderRosterTab();
        } else if (targetTab === 'settings-tab') {
          this.renderSettings();
        }
      });
    });
  }

  /* --- Scoreboard & Period Controls --- */
  setupScoreboardInputs() {
    const homeInput = document.getElementById('homeTeamName');
    const awayInput = document.getElementById('awayTeamName');

    if (homeInput) {
      homeInput.value = this.game.homeTeam;
      homeInput.addEventListener('input', (e) => {
        this.game.homeTeam = e.target.value;
        this.saveGame();
      });
    }

    if (awayInput) {
      awayInput.value = this.game.awayTeam;
      awayInput.addEventListener('input', (e) => {
        this.game.awayTeam = e.target.value;
        this.saveGame();
      });
    }

    // Period buttons
    document.querySelectorAll('.chip-period').forEach(chip => {
      chip.addEventListener('click', () => {
        const period = chip.getAttribute('data-period');
        this.setPeriod(period);
      });
    });

    // Undo button
    const undoBtn = document.getElementById('btnUndo');
    if (undoBtn) {
      undoBtn.addEventListener('click', () => this.undoLastEvent());
    }

    // Opponent SOG counter
    const oppSogBtn = document.getElementById('btnOpponentSOG');
    if (oppSogBtn) {
      oppSogBtn.addEventListener('click', () => {
        this.recordOpponentShot();
      });
    }

    // Opponent Goal counter
    const oppGoalBtn = document.getElementById('btnOpponentGoal');
    if (oppGoalBtn) {
      oppGoalBtn.addEventListener('click', () => {
        this.recordOpponentGoal();
      });
    }
  }

  setPeriod(period) {
    this.game.currentPeriod = period;
    document.querySelectorAll('.chip-period').forEach(chip => {
      chip.classList.toggle('active', chip.getAttribute('data-period') === period);
    });
    this.saveGame();
    this.showToast(`Switched to Period ${period}`);
  }

  updateScoreboardDisplay() {
    const homeScoreEl = document.getElementById('homeScoreDisplay');
    const awayScoreEl = document.getElementById('awayScoreDisplay');
    const homeShotsEl = document.getElementById('homeShotsDisplay');
    const awayShotsEl = document.getElementById('awayShotsDisplay');

    if (homeScoreEl) homeScoreEl.textContent = this.game.homeScore;
    if (awayScoreEl) awayScoreEl.textContent = this.game.awayScore;

    // Calculate Shots on Goal
    const homeSOG = this.game.events.filter(e => e.eventId === 'sog' || e.eventId === 'goal').length;
    const oppSOG = Object.values(this.game.opponentShots).reduce((a, b) => a + b, 0);

    if (homeShotsEl) homeShotsEl.textContent = `SOG: ${homeSOG}`;
    if (awayShotsEl) awayShotsEl.textContent = `SOG: ${oppSOG}`;

    // Period chips
    document.querySelectorAll('.chip-period').forEach(chip => {
      chip.classList.toggle('active', chip.getAttribute('data-period') === this.game.currentPeriod);
    });
  }

  updateUndoButton() {
    const undoBtn = document.getElementById('btnUndo');
    if (!undoBtn) return;

    if (this.game.events.length > 0) {
      const last = this.game.events[this.game.events.length - 1];
      undoBtn.disabled = false;
      undoBtn.innerHTML = `
        <svg style="width:14px;height:14px" viewBox="0 0 24 24"><path fill="currentColor" d="M12.5 8c-2.65 0-5.05 1-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>
        Undo (#${last.playerNumber} ${last.eventLabel})
      `;
    } else {
      undoBtn.disabled = true;
      undoBtn.innerHTML = `
        <svg style="width:14px;height:14px" viewBox="0 0 24 24"><path fill="currentColor" d="M12.5 8c-2.65 0-5.05 1-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></svg>
        Undo
      `;
    }
  }

  /* --- Spotter Roster Grid --- */
  renderLineFilters() {
    const container = document.getElementById('lineFilterBar');
    if (!container) return;

    const filters = [
      { id: 'ALL', label: 'All Players' },
      { id: 'L1', label: 'Line 1 (F)' },
      { id: 'L2', label: 'Line 2 (F)' },
      { id: 'L3', label: 'Line 3 (F)' },
      { id: 'D1', label: 'D-Pair 1' },
      { id: 'D2', label: 'D-Pair 2' },
      { id: 'G', label: 'Goalies' }
    ];

    container.innerHTML = filters.map(f => `
      <button class="line-filter-btn ${this.currentLineFilter === f.id ? 'active' : ''}" data-line="${f.id}">
        ${f.label}
      </button>
    `).join('');

    container.querySelectorAll('.line-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentLineFilter = btn.getAttribute('data-line');
        this.renderLineFilters();
        this.renderSpotterGrid();
      });
    });
  }

  renderSpotterGrid() {
    const container = document.getElementById('playerSpotterGrid');
    if (!container) return;

    let players = window.rosterManager.getPlayers();
    if (this.currentLineFilter !== 'ALL') {
      players = players.filter(p => p.line === this.currentLineFilter);
    }

    if (players.length === 0) {
      container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-dim); padding: 20px;">No players in this group. Go to "Roster" to add players.</div>`;
      return;
    }

    container.innerHTML = players.map(p => {
      const isSelected = this.selectedPlayerId === p.id;
      return `
        <div class="player-card ${isSelected ? 'selected' : ''}" data-player-id="${p.id}">
          <div class="jersey-num">${p.number}</div>
          <div class="player-name">${p.name}</div>
          ${p.spotterNote ? `<div class="spotter-tag" title="${p.spotterNote}">${p.spotterNote}</div>` : ''}
        </div>
      `;
    }).join('');

    container.querySelectorAll('.player-card').forEach(card => {
      card.addEventListener('click', () => {
        const pId = card.getAttribute('data-player-id');
        this.selectPlayer(pId);
      });
    });
  }

  selectPlayer(playerId) {
    if (this.selectedPlayerId === playerId) {
      // Toggle deselect if tapped again
      this.selectedPlayerId = null;
    } else {
      this.selectedPlayerId = playerId;
    }
    this.renderSpotterGrid();
    this.updateSelectedPlayerIndicator();
  }

  updateSelectedPlayerIndicator() {
    const indicator = document.getElementById('selectedPlayerIndicator');
    if (!indicator) return;

    if (this.selectedPlayerId) {
      const p = window.rosterManager.getPlayerById(this.selectedPlayerId);
      if (p) {
        indicator.innerHTML = `
          <span>Logging for: <strong>#${p.number} ${p.name}</strong> (${p.position})</span>
          ${p.spotterNote ? `<span style="font-size:0.75rem; color:#facc15; font-weight:normal;">[${p.spotterNote}]</span>` : ''}
        `;
        return;
      }
    }
    indicator.innerHTML = `<span style="color: var(--text-dim);">Tap a player above to log stats</span>`;
  }

  /* --- Event Buttons Pad --- */
  renderEventButtons() {
    const container = document.getElementById('eventsButtonGrid');
    if (!container) return;

    const enabledEvents = window.eventsManager.getEnabledEvents();

    container.innerHTML = enabledEvents.map(evt => `
      <button class="event-btn ${evt.colorClass}" data-event-id="${evt.id}">
        <span>${evt.label}</span>
        <span class="event-sub">${evt.short}</span>
      </button>
    `).join('');

    container.querySelectorAll('.event-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const evtId = btn.getAttribute('data-event-id');
        this.recordEvent(evtId);
      });
    });
  }

  /* --- Recording Stats Events --- */
  recordEvent(eventId) {
    if (!this.selectedPlayerId) {
      this.showToast('Please tap a player number first!');
      // Shake the spotter grid slightly to draw attention
      const grid = document.getElementById('playerSpotterGrid');
      if (grid) {
        grid.style.transform = 'translateY(-3px)';
        setTimeout(() => grid.style.transform = 'none', 150);
      }
      return;
    }

    const player = window.rosterManager.getPlayerById(this.selectedPlayerId);
    if (!player) return;

    const eventConfig = window.eventsManager.getAllEvents().find(e => e.id === eventId);
    const label = eventConfig ? eventConfig.label : eventId;

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const newEvent = {
      id: 'evt_' + Date.now(),
      timestamp: now.getTime(),
      timeFormatted,
      period: this.game.currentPeriod,
      playerId: player.id,
      playerNumber: player.number,
      playerName: player.name,
      eventId,
      eventLabel: label,
      category: eventConfig ? eventConfig.category : 'skater'
    };

    // If goal, increase score
    if (eventId === 'goal') {
      this.game.homeScore += 1;
    }

    this.game.events.push(newEvent);
    this.saveGame();

    this.showToast(`Logged: #${player.number} ${player.name} - ${label}`);
    this.renderLiveFeed();
    this.renderStatsTables();
    this.updateScoreboardDisplay();
    this.updateUndoButton();
  }

  recordOpponentShot() {
    this.game.opponentShots[this.game.currentPeriod] = (this.game.opponentShots[this.game.currentPeriod] || 0) + 1;
    this.saveGame();
    this.showToast(`Opponent Shot on Goal recorded (${this.game.currentPeriod})`);
    this.updateScoreboardDisplay();
  }

  recordOpponentGoal() {
    this.game.awayScore += 1;
    this.game.opponentShots[this.game.currentPeriod] = (this.game.opponentShots[this.game.currentPeriod] || 0) + 1;
    this.saveGame();
    this.showToast(`Opponent Goal recorded`);
    this.updateScoreboardDisplay();
  }

  undoLastEvent() {
    if (this.game.events.length === 0) return;

    const undone = this.game.events.pop();
    if (undone.eventId === 'goal') {
      this.game.homeScore = Math.max(0, this.game.homeScore - 1);
    }

    this.saveGame();
    this.showToast(`Undone: #${undone.playerNumber} ${undone.eventLabel}`);
    this.renderLiveFeed();
    this.renderStatsTables();
    this.updateScoreboardDisplay();
    this.updateUndoButton();
  }

  deleteEventAtIndex(index) {
    if (index >= 0 && index < this.game.events.length) {
      const removed = this.game.events.splice(index, 1)[0];
      if (removed.eventId === 'goal') {
        this.game.homeScore = Math.max(0, this.game.homeScore - 1);
      }
      this.saveGame();
      this.showToast(`Deleted event: #${removed.playerNumber} ${removed.eventLabel}`);
      this.renderLiveFeed();
      this.renderStatsTables();
      this.updateScoreboardDisplay();
      this.updateUndoButton();
    }
  }

  /* --- Live Feed --- */
  renderLiveFeed() {
    const list = document.getElementById('liveFeedList');
    if (!list) return;

    if (this.game.events.length === 0) {
      list.innerHTML = `<li style="text-align: center; color: var(--text-dim); padding: 10px; font-size: 0.78rem;">No events recorded yet for this game.</li>`;
      return;
    }

    // Show recent events top-down
    const recent = [...this.game.events].reverse().slice(0, 15);
    list.innerHTML = recent.map((evt, idx) => {
      const originalIdx = this.game.events.length - 1 - idx;
      return `
        <li class="feed-item ${evt.eventId}">
          <div>
            <strong>[${evt.period}] #${evt.playerNumber} ${evt.playerName}</strong>: ${evt.eventLabel}
            <span style="font-size:0.68rem; color:var(--text-dim); margin-left:6px;">${evt.timeFormatted}</span>
          </div>
          <button class="feed-item-del" title="Delete this event" onclick="window.hockeyApp.deleteEventAtIndex(${originalIdx})">&times;</button>
        </li>
      `;
    }).join('');
  }

  /* --- Stats Calculations & Tables --- */
  calculateStats() {
    const players = window.rosterManager.getPlayers();
    const skaterStats = [];
    const goalieStats = [];

    // Skaters
    players.forEach(p => {
      const playerEvents = this.game.events.filter(e => e.playerId === p.id);
      const statObj = {
        id: p.id,
        number: p.number,
        name: p.name,
        position: p.position,
        line: p.line
      };

      // Tally each event
      window.eventsManager.getAllEvents().forEach(evt => {
        statObj[evt.id] = playerEvents.filter(e => e.eventId === evt.id).length;
      });

      statObj.pts = (statObj.goal || 0) + (statObj.assist || 0);

      if (p.position === 'G') {
        const saves = statObj.save || 0;
        // Shots faced by this goalie in events or general
        const shotsFaced = saves + this.game.awayScore;
        const savePct = shotsFaced > 0 ? ((saves / shotsFaced) * 100).toFixed(1) + '%' : '0.0%';
        goalieStats.push({
          ...statObj,
          shotsFaced,
          saves,
          goalsAgainst: this.game.awayScore,
          savePct
        });
      } else {
        skaterStats.push(statObj);
      }
    });

    // Period breakdown
    const periods = ['P1', 'P2', 'P3', 'OT'];
    const periodStats = {
      home: { P1: 0, P2: 0, P3: 0, OT: 0, total: 0 },
      away: {
        P1: this.game.opponentShots.P1 || 0,
        P2: this.game.opponentShots.P2 || 0,
        P3: this.game.opponentShots.P3 || 0,
        OT: this.game.opponentShots.OT || 0,
        total: Object.values(this.game.opponentShots).reduce((a, b) => a + b, 0)
      }
    };

    periods.forEach(per => {
      const count = this.game.events.filter(e => e.period === per && (e.eventId === 'sog' || e.eventId === 'goal')).length;
      periodStats.home[per] = count;
      periodStats.home.total += count;
    });

    return { skaterStats, goalieStats, periodStats };
  }

  renderStatsTables() {
    const { skaterStats, goalieStats, periodStats } = this.calculateStats();

    // 1. Period Table
    const periodContainer = document.getElementById('periodStatsTableBody');
    if (periodContainer) {
      periodContainer.innerHTML = `
        <tr>
          <td><strong>${this.game.homeTeam || 'Our Team'}</strong></td>
          <td>${periodStats.home.P1}</td>
          <td>${periodStats.home.P2}</td>
          <td>${periodStats.home.P3}</td>
          <td>${periodStats.home.OT}</td>
          <td class="highlight">${periodStats.home.total}</td>
        </tr>
        <tr>
          <td><strong>${this.game.awayTeam || 'Opponent'}</strong></td>
          <td>${periodStats.away.P1}</td>
          <td>${periodStats.away.P2}</td>
          <td>${periodStats.away.P3}</td>
          <td>${periodStats.away.OT}</td>
          <td class="highlight">${periodStats.away.total}</td>
        </tr>
      `;
    }

    // 2. Skater Table
    const skaterContainer = document.getElementById('skaterStatsTableContainer');
    if (skaterContainer) {
      const enabled = window.eventsManager.getEnabledEvents().filter(e => e.category === 'skater');

      let thHtml = `
        <th>#</th>
        <th>Player</th>
        <th>Pos</th>
        <th>G</th>
        <th>A</th>
        <th>PTS</th>
        <th>SOG</th>
        <th>MISS</th>
      `;

      // Add extra enabled headers
      enabled.forEach(evt => {
        if (!['goal', 'assist', 'sog', 'miss'].includes(evt.id)) {
          thHtml += `<th>${evt.short}</th>`;
        }
      });

      let trRows = skaterStats.map(p => {
        let rowHtml = `
          <td><strong>${p.number}</strong></td>
          <td>${p.name}</td>
          <td>${p.position}</td>
          <td class="${p.goal > 0 ? 'highlight' : ''}">${p.goal || 0}</td>
          <td>${p.assist || 0}</td>
          <td class="highlight">${p.pts || 0}</td>
          <td>${p.sog || 0}</td>
          <td>${p.miss || 0}</td>
        `;

        enabled.forEach(evt => {
          if (!['goal', 'assist', 'sog', 'miss'].includes(evt.id)) {
            rowHtml += `<td>${p[evt.id] || 0}</td>`;
          }
        });

        return `<tr>${rowHtml}</tr>`;
      }).join('');

      skaterContainer.innerHTML = `
        <table class="stats-table">
          <thead><tr>${thHtml}</tr></thead>
          <tbody>${trRows}</tbody>
        </table>
      `;
    }

    // 3. Goalie Table
    const goalieContainer = document.getElementById('goalieStatsTableContainer');
    if (goalieContainer) {
      let trRows = goalieStats.map(g => `
        <tr>
          <td><strong>${g.number}</strong></td>
          <td>${g.name}</td>
          <td>${g.saves || 0}</td>
          <td>${g.goalsAgainst || 0}</td>
          <td class="highlight">${g.savePct}</td>
        </tr>
      `).join('');

      goalieContainer.innerHTML = `
        <table class="stats-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Goalie</th>
              <th>Saves</th>
              <th>Goals Against</th>
              <th>Save %</th>
            </tr>
          </thead>
          <tbody>${trRows || '<tr><td colspan="5" style="text-align:center;">No goalies on roster</td></tr>'}</tbody>
        </table>
      `;
    }
  }

  /* --- Settings & Event Customization --- */
  renderSettings() {
    const list = document.getElementById('eventTogglesList');
    if (!list) return;

    const allEvents = window.eventsManager.getAllEvents();
    list.innerHTML = allEvents.map(evt => `
      <div class="toggle-item">
        <div class="toggle-label">
          <span>${evt.label} (${evt.short})</span>
          ${evt.isCustom ? `<button class="btn-danger" style="padding:2px 6px; font-size:0.65rem;" onclick="window.hockeyApp.deleteCustomEvent('${evt.id}')">Delete</button>` : ''}
        </div>
        <label class="toggle-switch">
          <input type="checkbox" ${evt.enabled ? 'checked' : ''} onchange="window.hockeyApp.toggleEvent('${evt.id}', this.checked)">
          <span class="slider"></span>
        </label>
      </div>
    `).join('');
  }

  toggleEvent(eventId, isEnabled) {
    window.eventsManager.toggleEvent(eventId, isEnabled);
    this.renderEventButtons();
    this.renderStatsTables();
    this.showToast(`Updated event settings`);
  }

  deleteCustomEvent(eventId) {
    window.eventsManager.deleteCustomEvent(eventId);
    this.renderSettings();
    this.renderEventButtons();
    this.renderStatsTables();
  }

  addCustomEventFromForm() {
    const nameInput = document.getElementById('customEventName');
    const shortInput = document.getElementById('customEventShort');
    if (!nameInput || !shortInput) return;

    const name = nameInput.value.trim();
    const short = shortInput.value.trim();
    if (!name || !short) {
      alert('Please provide both an event name and short code (e.g. "Zone Exit", "ZE")');
      return;
    }

    window.eventsManager.addCustomEvent(name, short);
    nameInput.value = '';
    shortInput.value = '';
    this.renderSettings();
    this.renderEventButtons();
    this.renderStatsTables();
    this.showToast(`Added custom event: ${name}`);
  }

  /* --- Roster Tab --- */
  renderRosterTab() {
    const container = document.getElementById('rosterListContainer');
    if (!container) return;

    const players = window.rosterManager.getPlayers();
    container.innerHTML = players.map(p => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-sm); margin-bottom: 8px;">
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="font-size:1.5rem; font-weight:900; color:var(--accent-cyan); min-width:36px;">#${p.number}</div>
          <div>
            <div style="font-weight:700; font-size:0.9rem;">${p.name} <span style="font-size:0.75rem; color:var(--text-muted);">(${p.position} &bull; ${p.line})</span></div>
            ${p.spotterNote ? `<div style="font-size:0.75rem; color:#facc15;">Spotter Note: ${p.spotterNote}</div>` : ''}
          </div>
        </div>
        <button class="btn-danger" onclick="window.hockeyApp.deletePlayer('${p.id}')">Remove</button>
      </div>
    `).join('');
  }

  addPlayerFromForm() {
    const num = document.getElementById('newPlayerNum')?.value;
    const name = document.getElementById('newPlayerName')?.value;
    const pos = document.getElementById('newPlayerPos')?.value;
    const line = document.getElementById('newPlayerLine')?.value;
    const note = document.getElementById('newPlayerNote')?.value;

    if (!num || !name) {
      alert('Please provide a jersey number and player name.');
      return;
    }

    window.rosterManager.addPlayer({
      number: num,
      name,
      position: pos,
      line,
      spotterNote: note
    });

    // Clear inputs
    document.getElementById('newPlayerNum').value = '';
    document.getElementById('newPlayerName').value = '';
    document.getElementById('newPlayerNote').value = '';

    this.renderRosterTab();
    this.renderSpotterGrid();
    this.showToast(`Added #${num} ${name}`);
  }

  deletePlayer(playerId) {
    if (confirm('Are you sure you want to remove this player from the roster?')) {
      window.rosterManager.removePlayer(playerId);
      this.renderRosterTab();
      this.renderSpotterGrid();
      this.showToast('Player removed');
    }
  }

  loadSampleRoster() {
    if (confirm('Reset roster to the default sample team?')) {
      window.rosterManager.loadSampleRoster();
      this.renderRosterTab();
      this.renderSpotterGrid();
      this.showToast('Sample roster loaded');
    }
  }

  startNewGame() {
    if (confirm('Start a new game? This will reset the scoreboard and event logs for this game (your roster and event settings will be kept).')) {
      this.game = this.createNewGameObject();
      this.saveGame();
      this.selectedPlayerId = null;
      this.renderSpotterGrid();
      this.updateScoreboardDisplay();
      this.renderLiveFeed();
      this.renderStatsTables();
      this.updateUndoButton();
      this.showToast('Started new game!');
    }
  }

  /* --- Exports --- */
  exportCSV() {
    const { skaterStats, goalieStats, periodStats } = this.calculateStats();
    window.statsExporter.exportToCSV(this.game, skaterStats, goalieStats, periodStats);
    this.showToast('Spreadsheet (.CSV) downloaded!');
  }

  exportPDF() {
    window.statsExporter.exportToPDF();
  }

  /* --- Feedback --- */
  showToast(message) {
    const toast = document.getElementById('toastMsg');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2200);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.hockeyApp = new HockeyStatsApp();
  window.hockeyApp.init();
});
