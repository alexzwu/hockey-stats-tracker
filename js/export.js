/**
 * Export Engine: Spreadsheet (CSV) & Formatted PDF Report
 */

class StatsExporter {
  /**
   * Escape CSV string per RFC 4180
   */
  escapeCSV(val) {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  }

  /**
   * Generates and downloads a comprehensive CSV file
   */
  exportToCSV(gameData, playerStats, goalieStats, periodStats) {
    const lines = [];

    // 1. Game Header
    lines.push(['=== HOCKEY GAME STATS REPORT ===']);
    lines.push([
      `Team: ${gameData.homeTeam || 'Our Team'}`,
      `Opponent: ${gameData.awayTeam || 'Opponent'}`,
      `Date: ${gameData.date || new Date().toISOString().slice(0, 10)}`,
      `Score: ${gameData.homeScore} - ${gameData.awayScore}`
    ].map(this.escapeCSV).join(','));
    lines.push([]);

    // 2. Period by Period Shots
    lines.push(['=== PERIOD SHOTS ON GOAL ===']);
    lines.push(['Team', 'P1', 'P2', 'P3', 'OT', 'Total'].map(this.escapeCSV).join(','));
    lines.push([
      gameData.homeTeam || 'Our Team',
      periodStats.home.P1,
      periodStats.home.P2,
      periodStats.home.P3,
      periodStats.home.OT,
      periodStats.home.total
    ].map(this.escapeCSV).join(','));
    lines.push([
      gameData.awayTeam || 'Opponent',
      periodStats.away.P1,
      periodStats.away.P2,
      periodStats.away.P3,
      periodStats.away.OT,
      periodStats.away.total
    ].map(this.escapeCSV).join(','));
    lines.push([]);

    // 3. Skater Box Score Table
    const enabledSkaterEvents = window.eventsManager.getEnabledEvents().filter(e => e.category === 'skater');
    const skaterHeaders = ['#', 'Name', 'Pos', 'Line', 'G', 'A', 'PTS', 'SOG', 'MISS'];
    
    // Add any extra active stats
    enabledSkaterEvents.forEach(evt => {
      if (!['goal', 'assist', 'sog', 'miss'].includes(evt.id)) {
        skaterHeaders.push(evt.short);
      }
    });

    lines.push(['=== SKATER STATS ===']);
    lines.push(skaterHeaders.map(this.escapeCSV).join(','));

    playerStats.forEach(p => {
      if (p.position === 'G') return; // Goalies in separate table
      const row = [
        p.number,
        p.name,
        p.position,
        p.line,
        p.goal || 0,
        p.assist || 0,
        (p.goal || 0) + (p.assist || 0),
        p.sog || 0,
        p.miss || 0
      ];

      enabledSkaterEvents.forEach(evt => {
        if (!['goal', 'assist', 'sog', 'miss'].includes(evt.id)) {
          row.push(p[evt.id] || 0);
        }
      });

      lines.push(row.map(this.escapeCSV).join(','));
    });
    lines.push([]);

    // 4. Goalie Stats Table
    lines.push(['=== GOALIE STATS ===']);
    lines.push(['#', 'Name', 'Shots Faced', 'Saves', 'Goals Against', 'Save %'].map(this.escapeCSV).join(','));
    goalieStats.forEach(g => {
      lines.push([
        g.number,
        g.name,
        g.shotsFaced || 0,
        g.saves || 0,
        g.goalsAgainst || 0,
        g.savePct || '0.0%'
      ].map(this.escapeCSV).join(','));
    });
    lines.push([]);

    // 5. Play-by-Play Event Log
    lines.push(['=== PLAY-BY-PLAY EVENT LOG ===']);
    lines.push(['Timestamp', 'Period', 'Jersey #', 'Player', 'Event'].map(this.escapeCSV).join(','));
    (gameData.events || []).forEach(evt => {
      lines.push([
        evt.timeFormatted || '',
        evt.period || '',
        evt.playerNumber || '',
        evt.playerName || '',
        evt.eventLabel || ''
      ].map(this.escapeCSV).join(','));
    });

    // Create Download Blob
    const csvContent = '\uFEFF' + lines.join('\r\n'); // Add UTF-8 BOM for Excel/Numbers compatibility
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const filename = `hockey_stats_${(gameData.homeTeam || 'team').replace(/\s+/g, '_')}_${gameData.date || 'game'}.csv`;

    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Prepares the printable report and launches print dialog for PDF export
   */
  exportToPDF() {
    // Ensure the print header has current info
    const printHeader = document.getElementById('printHeader');
    if (printHeader) {
      const homeTeam = document.getElementById('homeTeamName').value || 'Our Team';
      const awayTeam = document.getElementById('awayTeamName').value || 'Opponent';
      const homeScore = document.getElementById('homeScoreDisplay').textContent || '0';
      const awayScore = document.getElementById('awayScoreDisplay').textContent || '0';
      const gameDate = document.getElementById('gameDateInput')?.value || new Date().toLocaleDateString();

      printHeader.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #0f172a; padding-bottom: 8px;">
          <div>
            <h1 style="font-size: 20px; font-weight: 900; margin: 0; color: #0f172a;">${homeTeam} vs ${awayTeam}</h1>
            <p style="font-size: 13px; color: #475569; margin: 2px 0 0 0;">Official Game Stats Report &bull; ${gameDate}</p>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 22px; font-weight: 900; color: #0f172a;">FINAL: ${homeScore} - ${awayScore}</div>
          </div>
        </div>
      `;
    }

    // Trigger browser print (on iPhone this lets the user save as PDF or AirDrop)
    window.print();
  }
}

window.statsExporter = new StatsExporter();
