/**
 * Roster Management & Spotter Line Grouping
 */

const SAMPLE_ROSTER = [
  // Forward Line 1
  { id: 'p1', number: '7', name: 'Maya R.', position: 'F', line: 'L1', spotterNote: 'Pink tape' },
  { id: 'p2', number: '12', name: 'Chloe T.', position: 'F', line: 'L1', spotterNote: 'LH stick' },
  { id: 'p3', number: '18', name: 'Emma S.', position: 'F', line: 'L1', spotterNote: 'Yellow laces' },
  // Forward Line 2
  { id: 'p4', number: '9', name: 'Ava K.', position: 'F', line: 'L2', spotterNote: 'White tape' },
  { id: 'p5', number: '14', name: 'Sophia M.', position: 'F', line: 'L2', spotterNote: 'Ponytail' },
  { id: 'p6', number: '21', name: 'Zoe B.', position: 'F', line: 'L2', spotterNote: 'RH stick' },
  // Forward Line 3
  { id: 'p7', number: '5', name: 'Mia D.', position: 'F', line: 'L3', spotterNote: 'Black tape' },
  { id: 'p8', number: '16', name: 'Harper L.', position: 'F', line: 'L3', spotterNote: 'LH stick' },
  { id: 'p9', number: '27', name: 'Ella P.', position: 'F', line: 'L3', spotterNote: 'Blue laces' },
  // Defense Pair 1
  { id: 'p10', number: '4', name: 'Brooke H.', position: 'D', line: 'D1', spotterNote: 'Tall / LH' },
  { id: 'p11', number: '22', name: 'Lily N.', position: 'D', line: 'D1', spotterNote: 'White helmet' },
  // Defense Pair 2
  { id: 'p12', number: '8', name: 'Hannah W.', position: 'D', line: 'D2', spotterNote: 'RH / Heavy shot' },
  { id: 'p13', number: '19', name: 'Grace C.', position: 'D', line: 'D2', spotterNote: 'Pink grip' },
  // Goalies
  { id: 'p14', number: '30', name: 'Audrey F.', position: 'G', line: 'G', spotterNote: 'Starter (Cat eye)' },
  { id: 'p15', number: '1', name: 'Taylor V.', position: 'G', line: 'G', spotterNote: 'Backup goalie' }
];

class RosterManager {
  constructor() {
    this.storageKey = 'hockey_roster_data_v1';
    this.players = this.loadRoster();
  }

  loadRoster() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not load roster:', e);
    }
    // Default to sample roster for immediate out-of-the-box experience
    return [...SAMPLE_ROSTER];
  }

  saveRoster() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.players));
    } catch (e) {
      console.error('Error saving roster:', e);
    }
  }

  getPlayers() {
    // Sort primarily by jersey number as integers
    return [...this.players].sort((a, b) => parseInt(a.number, 10) - parseInt(b.number, 10));
  }

  getPlayerById(id) {
    return this.players.find(p => p.id === id);
  }

  getPlayerByNumber(number) {
    return this.players.find(p => String(p.number) === String(number));
  }

  addPlayer(playerData) {
    const id = 'p_' + Date.now();
    const newPlayer = {
      id,
      number: String(playerData.number).trim(),
      name: playerData.name.trim(),
      position: playerData.position || 'F',
      line: playerData.line || 'L1',
      spotterNote: (playerData.spotterNote || '').trim()
    };
    this.players.push(newPlayer);
    this.saveRoster();
    return newPlayer;
  }

  updatePlayer(id, updatedData) {
    const idx = this.players.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.players[idx] = { ...this.players[idx], ...updatedData };
      this.saveRoster();
      return this.players[idx];
    }
    return null;
  }

  removePlayer(id) {
    this.players = this.players.filter(p => p.id !== id);
    this.saveRoster();
  }

  loadSampleRoster() {
    this.players = [...SAMPLE_ROSTER];
    this.saveRoster();
    return this.players;
  }

  clearRoster() {
    this.players = [];
    this.saveRoster();
    return this.players;
  }
}

window.rosterManager = new RosterManager();
