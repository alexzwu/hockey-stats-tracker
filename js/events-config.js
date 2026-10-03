/**
 * Configuration & Customization of Trackable Events
 */

const DEFAULT_EVENTS = [
  { id: 'sog', label: 'Shot on Goal', short: 'SOG', category: 'skater', colorClass: 'sog', defaultEnabled: true, desc: 'Shot on net saved or scoring' },
  { id: 'goal', label: 'Goal', short: 'G', category: 'skater', colorClass: 'goal', defaultEnabled: true, desc: 'Goal scored' },
  { id: 'assist', label: 'Assist', short: 'A', category: 'skater', colorClass: 'assist', defaultEnabled: true, desc: 'Primary or secondary assist' },
  { id: 'miss', label: 'Missed Shot', short: 'MISS', category: 'skater', colorClass: 'miss', defaultEnabled: true, desc: 'Shot wide or over crossbar' },
  { id: 'block', label: 'Blocked Shot', short: 'BLK', category: 'skater', colorClass: 'block', defaultEnabled: true, desc: 'Shot blocked by defender' },
  { id: 'save', label: 'Goalie Save', short: 'SV', category: 'goalie', colorClass: 'save', defaultEnabled: true, desc: 'Save made by goalie' },
  { id: 'pass', label: 'Pass Complete', short: 'PASS', category: 'skater', colorClass: 'pass', defaultEnabled: false, desc: 'Successful tape-to-tape pass' },
  { id: 'turnover', label: 'Turnover / Giveaway', short: 'TO', category: 'skater', colorClass: 'turnover', defaultEnabled: false, desc: 'Lost puck possession' },
  { id: 'takeaway', label: 'Takeaway', short: 'TK', category: 'skater', colorClass: 'pass', defaultEnabled: false, desc: 'Puck stolen from opponent' },
  { id: 'faceoff_win', label: 'Faceoff Win', short: 'FOW', category: 'skater', colorClass: 'faceoff', defaultEnabled: false, desc: 'Won faceoff draw' },
  { id: 'faceoff_loss', label: 'Faceoff Loss', short: 'FOL', category: 'skater', colorClass: 'faceoff', defaultEnabled: false, desc: 'Lost faceoff draw' },
  { id: 'penalty', label: 'Penalty', short: 'PIM', category: 'skater', colorClass: 'penalty', defaultEnabled: false, desc: '2 or 5 min infraction' }
];

class EventsConfigManager {
  constructor() {
    this.storageKey = 'hockey_events_config_v1';
    this.events = this.loadConfig();
  }

  loadConfig() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure defaults are present if schema updated
        return DEFAULT_EVENTS.map(def => {
          const found = parsed.find(p => p.id === def.id);
          return found ? { ...def, ...found } : { ...def, enabled: def.defaultEnabled };
        }).concat(parsed.filter(p => !DEFAULT_EVENTS.some(def => def.id === p.id)));
      }
    } catch (e) {
      console.warn('Could not load events config:', e);
    }
    return DEFAULT_EVENTS.map(def => ({ ...def, enabled: def.defaultEnabled }));
  }

  saveConfig() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.events));
    } catch (e) {
      console.error('Error saving events config:', e);
    }
  }

  getEnabledEvents() {
    return this.events.filter(e => e.enabled);
  }

  getAllEvents() {
    return this.events;
  }

  toggleEvent(eventId, isEnabled) {
    const item = this.events.find(e => e.id === eventId);
    if (item) {
      item.enabled = isEnabled;
      this.saveConfig();
    }
  }

  addCustomEvent(label, shortCode, category = 'skater') {
    const id = 'custom_' + Date.now();
    const newEvent = {
      id,
      label,
      short: shortCode.toUpperCase(),
      category,
      colorClass: 'custom',
      defaultEnabled: true,
      enabled: true,
      desc: 'Custom tracked stat',
      isCustom: true
    };
    this.events.push(newEvent);
    this.saveConfig();
    return newEvent;
  }

  deleteCustomEvent(eventId) {
    this.events = this.events.filter(e => e.id !== eventId || !e.isCustom);
    this.saveConfig();
  }

  resetDefaults() {
    this.events = DEFAULT_EVENTS.map(def => ({ ...def, enabled: def.defaultEnabled }));
    this.saveConfig();
    return this.events;
  }
}

window.eventsManager = new EventsConfigManager();
