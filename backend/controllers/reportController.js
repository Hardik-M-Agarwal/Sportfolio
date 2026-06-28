const PDFDocument = require('pdfkit');
const Tournament  = require('../models/Tournament');
const Team        = require('../models/Team');
const Match       = require('../models/Match');
const Expense     = require('../models/Expense');
const Sponsorship = require('../models/Sponsorship');
const PlayerStat  = require('../models/PlayerStat');

// ── helpers ───────────────────────────────────────────────────────────
const fmt = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN')}`;

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

const C = {
  black:  '#111111',
  dark:   '#1f2937',
  mid:    '#6b7280',
  light:  '#9ca3af',
  border: '#e5e7eb',
  bg:     '#f9fafb',
  accent: '#2563eb',
  green:  '#059669',
  red:    '#dc2626',
  purple: '#7c3aed',
  amber:  '#d97706',
  white:  '#ffffff',
};

const STAT_LABELS = {
  cricket: {
    batting_runs: 'Runs', batting_balls: 'Balls', batting_fours: '4s',
    batting_sixes: '6s', batting_strike_rate: 'SR',
    bowling_wickets: 'Wkts', bowling_runs: 'Runs Given',
    bowling_overs: 'Overs', bowling_economy: 'Economy',
    fielding_catches: 'Catches',
  },
  football: {
    goals: 'Goals', assists: 'Assists',
    yellow_cards: 'Yellow', red_cards: 'Red',
  },
  badminton: {
    points_won: 'Points Won', sets_won: 'Sets Won',
  },
  kabaddi: {
    raid_points: 'Raid Pts', tackle_points: 'Tackle Pts',
    super_raids: 'Super Raids', super_tackles: 'Super Tackles',
  },
  basketball: {
    two_points: '2PT', three_points: '3PT', free_throws: 'FT',
    total_points: 'Points', fouls: 'Fouls',
  },
  volleyball: {
    points: 'Points', spikes: 'Spikes', blocks: 'Blocks', serves: 'Serves',
  },
};

const sectionHeader = (doc, text, y, margin, inner, color = C.dark) => {
  doc.rect(margin, y, inner, 26).fill(color);
  doc.fontSize(9).font('Helvetica-Bold').fillColor(C.white).text(text, margin + 10, y + 9);
  return y + 26;
};

const checkPage = (doc, y, needed = 60) => {
  if (y + needed > doc.page.height - 70) {
    doc.addPage();
    return 50;
  }
  return y;
};

const drawFooter = (doc, margin, inner, tournamentName, reportType) => {
  const footerY = doc.page.height - 50;
  doc.moveTo(margin, footerY).lineTo(margin + inner, footerY).strokeColor(C.border).lineWidth(1).stroke();
  doc.fontSize(8).font('Helvetica').fillColor(C.light)
     .text(`Sportfolio · ${reportType} · ${tournamentName} · ${fmtDate(new Date())}`,
       margin, footerY + 10, { align: 'center', width: inner });
};

// ─────────────────────────────────────────────────────────────────────
// FINANCIAL SUMMARY PDF
// ─────────────────────────────────────────────────────────────────────
const generateFinancialSummary = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const [tournament, teams, matches, expenses, sponsorships] = await Promise.all([
      Tournament.findById(tournamentId).populate('organiserId', 'name email phone'),
      Team.find({ tournamentId }).populate('captainId', 'name email phone'),
      Match.find({ tournamentId }),
      Expense.find({ tournamentId }).sort({ category: 1 }),
      Sponsorship.find({ tournamentId }).populate('sponsorId', 'name email phone'),
    ]);

    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });
    if (tournament.organiserId._id.toString() !== req.user.id)
      return res.status(403).json({ message: 'Not authorized' });

    const paidTeams        = teams.filter((t) => ['paid', 'cash'].includes(t.paymentStatus));
    const registeredTeams  = teams.filter((t) => !t.isWaitlisted);
    const completedMatches = matches.filter((m) => m.status === 'completed');
    const entryRevenue     = paidTeams.length * tournament.entryFee;
    const sponsorRevenue   = sponsorships.reduce((s, sp) => s + sp.amount, 0);
    const totalRevenue     = entryRevenue + sponsorRevenue;
    const totalExpenses    = expenses.reduce((s, e) => s + e.amount, 0);
    const netSurplus       = totalRevenue - totalExpenses;
    const prizePool        = Math.round(
      tournament.entryFee * registeredTeams.length * tournament.prizeStructure.percentage / 100
    ) + sponsorships.reduce((s, sp) => s + sp.prizeContribution, 0);

    const categoryTotals = {};
    expenses.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    const doc    = new PDFDocument({ margin: 50, size: 'A4' });
    const pageW  = doc.page.width;
    const margin = 50;
    const inner  = pageW - margin * 2;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition',
      `attachment; filename="financial-summary-${tournament.name.replace(/\s+/g, '-')}.pdf"`);
    doc.pipe(res);

    // header
    doc.rect(0, 0, pageW, 110).fill(C.dark);
    doc.fontSize(22).font('Helvetica-Bold').fillColor(C.white).text('SPORTFOLIO', margin, 28);
    doc.fontSize(10).font('Helvetica').fillColor('#93c5fd').text('Financial Summary Report', margin, 54);
    doc.fontSize(9).fillColor('#9ca3af')
       .text(`Generated: ${fmtDate(new Date())}`, margin, 28, { align: 'right', width: inner });

    let y = 130;
    doc.fontSize(18).font('Helvetica-Bold').fillColor(C.black).text(tournament.name, margin, y); y += 28;
    doc.fontSize(10).font('Helvetica').fillColor(C.mid)
       .text(`${tournament.sport.toUpperCase()}  ·  ${tournament.format.toUpperCase()}  ·  ${tournament.venue.name}, ${tournament.venue.city}`, margin, y); y += 18;
    doc.fontSize(10).fillColor(C.light).text(`${fmtDate(tournament.startDate)} → ${fmtDate(tournament.endDate)}`, margin, y); y += 24;
    doc.moveTo(margin, y).lineTo(margin + inner, y).strokeColor(C.border).lineWidth(1).stroke(); y += 18;

    // revenue boxes
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.dark).text('REVENUE OVERVIEW', margin, y); y += 16;
    const boxW = (inner - 16) / 3;
    [
      { label: 'Entry Revenue',       value: fmt(entryRevenue),   color: C.green,  sub: `${paidTeams.length} teams paid` },
      { label: 'Sponsorship Revenue', value: fmt(sponsorRevenue), color: C.accent, sub: `${sponsorships.length} sponsor(s)` },
      { label: 'Total Revenue',       value: fmt(totalRevenue),   color: C.dark,   sub: 'Entry + Sponsorship' },
    ].forEach((b, i) => {
      const bx = margin + i * (boxW + 8);
      doc.rect(bx, y, boxW, 72).fill(C.bg);
      doc.rect(bx, y, 3, 72).fill(b.color);
      doc.fontSize(8).font('Helvetica').fillColor(C.mid).text(b.label.toUpperCase(), bx + 10, y + 10, { width: boxW - 20 });
      doc.fontSize(15).font('Helvetica-Bold').fillColor(b.color).text(b.value, bx + 10, y + 26, { width: boxW - 20 });
      doc.fontSize(8).font('Helvetica').fillColor(C.light).text(b.sub, bx + 10, y + 52, { width: boxW - 20 });
    });
    y += 86;

    const expBoxW = (inner - 8) / 2;
    [
      { label: 'Total Expenses', value: fmt(totalExpenses), color: C.red, sub: `${expenses.length} expense(s) logged` },
      { label: netSurplus >= 0 ? 'Net Surplus' : 'Net Deficit',
        value: fmt(Math.abs(netSurplus)),
        color: netSurplus >= 0 ? C.green : C.red,
        sub: totalRevenue > 0 ? `${Math.round(netSurplus / totalRevenue * 100)}% margin` : '—' },
    ].forEach((b, i) => {
      const bx = margin + i * (expBoxW + 8);
      doc.rect(bx, y, expBoxW, 72).fill(C.bg);
      doc.rect(bx, y, 3, 72).fill(b.color);
      doc.fontSize(8).font('Helvetica').fillColor(C.mid).text(b.label.toUpperCase(), bx + 10, y + 10, { width: expBoxW - 20 });
      doc.fontSize(15).font('Helvetica-Bold').fillColor(b.color).text(b.value, bx + 10, y + 26, { width: expBoxW - 20 });
      doc.fontSize(8).font('Helvetica').fillColor(C.light).text(b.sub, bx + 10, y + 52, { width: expBoxW - 20 });
    });
    y += 86;

    if (expenses.length > 0) {
      y = checkPage(doc, y, 80);
      doc.fontSize(11).font('Helvetica-Bold').fillColor(C.dark).text('EXPENSES BY CATEGORY', margin, y); y += 16;
      const catLabels = { venue: 'Venue', officials: 'Officials', equipment: 'Equipment',
        marketing: 'Marketing', hospitality: 'Hospitality', awards: 'Awards',
        transport: 'Transport', miscellaneous: 'Miscellaneous' };
      doc.rect(margin, y, inner, 22).fill('#f3f4f6');
      doc.fontSize(8).font('Helvetica-Bold').fillColor(C.mid)
         .text('CATEGORY', margin + 10, y + 7)
         .text('AMOUNT', margin + inner - 120, y + 7)
         .text('% OF TOTAL', margin + inner - 60, y + 7);
      y += 22;
      Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).forEach(([cat, amount], idx) => {
        if (idx % 2 === 1) doc.rect(margin, y, inner, 22).fill('#fafafa');
        doc.fontSize(9).font('Helvetica').fillColor(C.dark)
           .text(catLabels[cat] || cat, margin + 10, y + 7)
           .text(fmt(amount), margin + inner - 120, y + 7)
           .text(`${Math.round(amount / totalExpenses * 100)}%`, margin + inner - 60, y + 7);
        const barW = Math.round((amount / totalExpenses) * 80);
        doc.rect(margin + inner - 160, y + 9, 80, 4).fill('#e5e7eb');
        doc.rect(margin + inner - 160, y + 9, barW, 4).fill(C.accent);
        y += 22;
      });
      doc.rect(margin, y, inner, 24).fill(C.dark);
      doc.fontSize(9).font('Helvetica-Bold').fillColor(C.white)
         .text('TOTAL EXPENSES', margin + 10, y + 8).text(fmt(totalExpenses), margin + inner - 120, y + 8);
      y += 34;
    }

    if (sponsorships.length > 0) {
      y = checkPage(doc, y, 60); y += 10;
      doc.fontSize(11).font('Helvetica-Bold').fillColor(C.dark).text('SPONSORSHIPS', margin, y); y += 16;
      doc.rect(margin, y, inner, 22).fill('#f3f4f6');
      doc.fontSize(8).font('Helvetica-Bold').fillColor(C.mid)
         .text('SPONSOR', margin + 10, y + 7).text('TIER', margin + inner - 200, y + 7)
         .text('AMOUNT', margin + inner - 130, y + 7).text('PRIZE CONTRIB', margin + inner - 75, y + 7);
      y += 22;
      sponsorships.forEach((sp, idx) => {
        if (idx % 2 === 1) doc.rect(margin, y, inner, 22).fill('#fafafa');
        doc.fontSize(9).font('Helvetica').fillColor(C.dark)
           .text(sp.businessName, margin + 10, y + 7, { width: inner - 250 })
           .text(sp.tier.toUpperCase(), margin + inner - 200, y + 7)
           .text(fmt(sp.amount), margin + inner - 130, y + 7)
           .text(fmt(sp.prizeContribution), margin + inner - 75, y + 7);
        y += 22;
      });
      y += 10;
    }

    y = checkPage(doc, y, 120); y += 10;
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.dark).text('PRIZE POOL DISTRIBUTION', margin, y); y += 16;
    doc.rect(margin, y, inner, 22).fill('#f3f4f6');
    doc.fontSize(8).font('Helvetica-Bold').fillColor(C.mid)
       .text('POSITION', margin + 10, y + 7).text('%', margin + inner - 100, y + 7).text('AMOUNT', margin + inner - 60, y + 7);
    y += 22;
    const dist = tournament.prizeStructure.distribution;
    [
      { label: '1st Place (Winner)',    pct: dist.winner },
      { label: '2nd Place (Runner-up)', pct: dist.runnerUp },
      { label: '3rd Place',             pct: dist.third },
      { label: 'Special Awards',        pct: dist.special },
    ].forEach((d, idx) => {
      if (idx % 2 === 1) doc.rect(margin, y, inner, 22).fill('#fafafa');
      const amt = Math.round(prizePool * d.pct / 100);
      doc.fontSize(9).font('Helvetica').fillColor(C.dark)
         .text(d.label, margin + 10, y + 7).text(`${d.pct}%`, margin + inner - 100, y + 7).text(fmt(amt), margin + inner - 60, y + 7);
      y += 22;
    });
    doc.rect(margin, y, inner, 24).fill(C.purple);
    doc.fontSize(9).font('Helvetica-Bold').fillColor(C.white)
       .text('TOTAL PRIZE POOL', margin + 10, y + 8).text(fmt(prizePool), margin + inner - 60, y + 8);
    y += 34;

    y = checkPage(doc, y, 100); y += 10;
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.dark).text('TOURNAMENT OVERVIEW', margin, y); y += 16;
    const stats = [
      ['Teams Registered', `${registeredTeams.length} / ${tournament.maxTeams}`],
      ['Teams Paid', `${paidTeams.length}`],
      ['Matches Played', `${completedMatches.length} / ${matches.length}`],
      ['Entry Fee', fmt(tournament.entryFee)],
      ['Prize %', `${tournament.prizeStructure.percentage}%`],
      ['Organiser', tournament.organiserId.name],
    ];
    const colW = (inner - 8) / 2;
    stats.forEach((s, idx) => {
      const col = idx % 2, row = Math.floor(idx / 2);
      const sx = margin + col * (colW + 8), sy = y + row * 28;
      doc.fontSize(8).font('Helvetica').fillColor(C.light).text(s[0].toUpperCase(), sx, sy);
      doc.fontSize(10).font('Helvetica-Bold').fillColor(C.dark).text(s[1], sx, sy + 11);
    });

    drawFooter(doc, margin, inner, tournament.name, 'Financial Summary');
    doc.end();
  } catch (error) {
    console.error('Financial PDF error:', error);
    if (!res.headersSent) res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────
// TEAM PERFORMANCE PDF
// ─────────────────────────────────────────────────────────────────────
const generateTeamPerformance = async (req, res) => {
  try {
    const { tournamentId }    = req.params;
    const filterTeamId        = req.query.teamId || null; // captain filters to their team

    const [tournament, allTeams, allMatches, playerStats] = await Promise.all([
      Tournament.findById(tournamentId).populate('organiserId', 'name email'),
      Team.find({ tournamentId, isWaitlisted: false }).populate('captainId', 'name email phone'),
      Match.find({ tournamentId })
           .populate('team1Id', 'teamName')
           .populate('team2Id', 'teamName')
           .populate('result.winnerId', 'teamName'),
      PlayerStat.find({ tournamentId }),
    ]);

    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });

    const isOrganiser = tournament.organiserId._id.toString() === req.user.id;
    const isCaptain   = allTeams.some((t) => t.captainId?._id?.toString() === req.user.id);
    if (!isOrganiser && !isCaptain)
      return res.status(403).json({ message: 'Not authorized' });

    // filter to single team if captain is downloading
    const teams   = filterTeamId
      ? allTeams.filter((t) => t._id.toString() === filterTeamId)
      : allTeams;

    // for captain: only matches involving their team
    const matches = allMatches.filter((m) => m.status === 'completed' && (
      filterTeamId
        ? m.team1Id?._id?.toString() === filterTeamId || m.team2Id?._id?.toString() === filterTeamId
        : true
    ));

    const isCaptainReport = !!filterTeamId;
    const myTeam          = isCaptainReport ? teams[0] : null;

    // ── standings (all teams) ─────────────────────────────────────
    const teamMap = {};
    allTeams.forEach((t) => {
      teamMap[t._id.toString()] = { team: t, played: 0, won: 0, lost: 0, drawn: 0, points: 0 };
    });
    allMatches.filter((m) => m.status === 'completed').forEach((m) => {
      const t1id = m.team1Id?._id?.toString();
      const t2id = m.team2Id?._id?.toString();
      const wid  = m.result?.winnerId?._id?.toString();
      if (t1id && teamMap[t1id]) teamMap[t1id].played++;
      if (t2id && teamMap[t2id]) teamMap[t2id].played++;
      if (wid) {
        const loserId = wid === t1id ? t2id : t1id;
        if (teamMap[wid])     { teamMap[wid].won++;     teamMap[wid].points     += 3; }
        if (teamMap[loserId]) { teamMap[loserId].lost++; }
      } else if (t1id && t2id) {
        if (teamMap[t1id]) { teamMap[t1id].drawn++; teamMap[t1id].points += 1; }
        if (teamMap[t2id]) { teamMap[t2id].drawn++; teamMap[t2id].points += 1; }
      }
    });
    const standings = Object.values(teamMap).sort((a, b) => b.points - a.points || b.won - a.won);
    const myRecord  = filterTeamId ? teamMap[filterTeamId] : null;

    // ── aggregate player stats ────────────────────────────────────
    const playerAgg = {};
    playerStats
      .filter((ps) => !filterTeamId || ps.teamId?.toString() === filterTeamId)
      .forEach((ps) => {
        const key = `${ps.teamId?.toString()}_${ps.playerName}`;
        if (!playerAgg[key]) {
          playerAgg[key] = { playerName: ps.playerName, teamId: ps.teamId?.toString(), sport: ps.sport, stats: {} };
        }
        Object.entries(ps.stats || {}).forEach(([k, v]) => {
          playerAgg[key].stats[k] = (playerAgg[key].stats[k] || 0) + Number(v || 0);
        });
      });

    const sport      = tournament.sport;
    const statLabels = STAT_LABELS[sport] || {};
    const statKeys   = Object.keys(statLabels).slice(0, 6);

    // ── BUILD PDF ─────────────────────────────────────────────────
    const doc    = new PDFDocument({ margin: 50, size: 'A4' });
    const pageW  = doc.page.width;
    const margin = 50;
    const inner  = pageW - margin * 2;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition',
      `attachment; filename="team-performance-${tournament.name.replace(/\s+/g, '-')}.pdf"`);
    doc.pipe(res);

    // ── HEADER ────────────────────────────────────────────────────
    doc.rect(0, 0, pageW, 110).fill(C.dark);
    doc.fontSize(22).font('Helvetica-Bold').fillColor(C.white).text('SPORTFOLIO', margin, 28);
    doc.fontSize(10).font('Helvetica').fillColor('#93c5fd')
       .text(isCaptainReport ? 'Team Performance Report' : 'All Teams Performance Report', margin, 54);
    doc.fontSize(9).fillColor('#9ca3af')
       .text(`Generated: ${fmtDate(new Date())}`, margin, 28, { align: 'right', width: inner });

    let y = 130;
    doc.fontSize(18).font('Helvetica-Bold').fillColor(C.black).text(tournament.name, margin, y); y += 28;
    doc.fontSize(10).font('Helvetica').fillColor(C.mid)
       .text(`${tournament.sport.toUpperCase()}  ·  ${tournament.format.toUpperCase()}  ·  ${tournament.venue.name}, ${tournament.venue.city}`, margin, y); y += 18;
    doc.fontSize(10).fillColor(C.light).text(`${fmtDate(tournament.startDate)} → ${fmtDate(tournament.endDate)}`, margin, y); y += 24;
    doc.moveTo(margin, y).lineTo(margin + inner, y).strokeColor(C.border).lineWidth(1).stroke(); y += 20;

    // ── CAPTAIN: MY TEAM SUMMARY CARD ────────────────────────────
    if (isCaptainReport && myTeam && myRecord) {
      doc.rect(margin, y, inner, 80).fill(C.dark);
      doc.rect(margin, y, 4, 80).fill(C.accent);

      doc.fontSize(16).font('Helvetica-Bold').fillColor(C.white)
         .text(myTeam.teamName, margin + 16, y + 12);
      doc.fontSize(9).font('Helvetica').fillColor('#9ca3af')
         .text(`Captain: ${myTeam.captainId?.name || '—'}  ·  Players: ${myTeam.players?.length || 0}`, margin + 16, y + 34);

      // W/L/D boxes inside card
      const wlW = 70;
      [
        { label: 'PLAYED', val: myRecord.played, col: C.white },
        { label: 'WON',    val: myRecord.won,    col: '#4ade80' },
        { label: 'LOST',   val: myRecord.lost,   col: '#f87171' },
        { label: 'DRAWN',  val: myRecord.drawn,  col: '#fbbf24' },
        { label: 'POINTS', val: myRecord.points, col: '#60a5fa' },
      ].forEach((box, bi) => {
        const bx = margin + inner - (5 - bi) * (wlW + 6);
        doc.fontSize(18).font('Helvetica-Bold').fillColor(box.col).text(String(box.val), bx, y + 14, { width: wlW, align: 'center' });
        doc.fontSize(7).font('Helvetica').fillColor('#9ca3af').text(box.label, bx, y + 40, { width: wlW, align: 'center' });
      });
      y += 96;
    } else {
      // organiser: quick stat bar
      const qStats = [
        { label: 'Total Teams',    value: allTeams.length },
        { label: 'Matches Played', value: allMatches.filter((m) => m.status === 'completed').length },
        { label: 'Sport',          value: tournament.sport.charAt(0).toUpperCase() + tournament.sport.slice(1) },
        { label: 'Format',         value: tournament.format },
      ];
      const qW = (inner - 24) / 4;
      qStats.forEach((s, i) => {
        const bx = margin + i * (qW + 8);
        doc.rect(bx, y, qW, 58).fill(C.bg);
        doc.rect(bx, y, 3, 58).fill(C.accent);
        doc.fontSize(7).font('Helvetica').fillColor(C.light).text(s.label.toUpperCase(), bx + 8, y + 8, { width: qW - 16 });
        doc.fontSize(14).font('Helvetica-Bold').fillColor(C.dark).text(String(s.value), bx + 8, y + 22, { width: qW - 16 });
      });
      y += 72;
    }

    // ── STANDINGS (always shown) ──────────────────────────────────
    y = checkPage(doc, y, 60);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.dark)
       .text(isCaptainReport ? 'TOURNAMENT STANDINGS' : 'STANDINGS', margin, y); y += 14;
    y = sectionHeader(doc, '   #   TEAM                        P    W    L    D    PTS', y, margin, inner, C.accent);

    standings.forEach(({ team, played, won, lost, drawn, points }, idx) => {
      y = checkPage(doc, y, 24);
      const isMyTeam = filterTeamId && team._id.toString() === filterTeamId;

      if (isMyTeam)    doc.rect(margin, y, inner, 24).fill('#dbeafe');
      else if (idx === 0) doc.rect(margin, y, inner, 24).fill('#fef9c3');
      else if (idx % 2 === 0) doc.rect(margin, y, inner, 24).fill('#f9fafb');

      doc.fontSize(9).font(isMyTeam ? 'Helvetica-Bold' : 'Helvetica').fillColor(C.dark)
         .text(`${idx + 1}.`, margin + 10, y + 8, { width: 20 })
         .text(team.teamName + (isMyTeam ? ' ★' : ''), margin + 30, y + 8, { width: inner * 0.45 });

      [played, won, lost, drawn, points].forEach((val, ci) => {
        const cx = margin + inner * [0.55, 0.64, 0.73, 0.82, 0.91][ci];
        doc.fontSize(9).font(ci === 4 ? 'Helvetica-Bold' : 'Helvetica')
           .fillColor(ci === 1 ? C.green : ci === 2 ? C.red : C.dark)
           .text(String(val), cx, y + 8, { width: 30 });
      });
      y += 24;
    });
    y += 16;

    // ── MY MATCH RESULTS (captain) / ALL MATCHES (organiser) ─────
    if (matches.length > 0) {
      y = checkPage(doc, y, 60);
      doc.fontSize(11).font('Helvetica-Bold').fillColor(C.dark)
         .text(isCaptainReport ? 'MY MATCH RESULTS' : 'MATCH RESULTS', margin, y); y += 14;
      y = sectionHeader(doc, '   MATCH         TEAMS                              RESULT', y, margin, inner, C.dark);

      matches.forEach((m, idx) => {
        y = checkPage(doc, y, 28);

        const t1Name   = m.team1Id?.teamName || 'Team 1';
        const t2Name   = m.team2Id?.teamName || 'Team 2';
        const winner   = m.result?.winnerId?.teamName;
        const winnerId = m.result?.winnerId?._id?.toString();
        const label    = m.roundName || `Match ${m.matchNumber}`;

        // for captain: determine win/loss
        const myTeamWon  = filterTeamId && winnerId === filterTeamId;
        const myTeamLost = filterTeamId && winnerId && winnerId !== filterTeamId;

        if (myTeamWon)         doc.rect(margin, y, inner, 28).fill('#f0fdf4');
        else if (myTeamLost)   doc.rect(margin, y, inner, 28).fill('#fff1f2');
        else if (idx % 2 === 0) doc.rect(margin, y, inner, 28).fill('#f9fafb');

        doc.fontSize(8).font('Helvetica').fillColor(C.mid)
           .text(label, margin + 10, y + 6, { width: 90 });

        // scores if available
        const t1Score = m.result?.team1Score ? ` (${m.result.team1Score})` : '';
        const t2Score = m.result?.team2Score ? ` (${m.result.team2Score})` : '';
        doc.fontSize(9).font('Helvetica').fillColor(C.dark)
           .text(`${t1Name}${t1Score}  vs  ${t2Name}${t2Score}`, margin + 110, y + 6, { width: inner * 0.5 });

        // result
        const resultText = winner ? `${winner} won` : 'Draw';
        const resultColor = myTeamWon ? C.green : myTeamLost ? C.red : C.mid;
        doc.fontSize(9).font('Helvetica-Bold').fillColor(resultColor)
           .text(resultText, margin + inner - 110, y + 6, { width: 110, align: 'right' });

        // result notes
        if (m.result?.notes) {
          doc.fontSize(7).font('Helvetica').fillColor(C.light)
             .text(m.result.notes, margin + 110, y + 18, { width: inner - 120 });
        }
        y += 28;
      });
      y += 16;
    }

    // ── PER TEAM: PLAYERS + STATS ─────────────────────────────────
    teams.forEach((team) => {
      y = checkPage(doc, y, 80);

      const tid    = team._id.toString();
      const record = teamMap[tid] || { played: 0, won: 0, lost: 0, drawn: 0, points: 0 };

      // team header
      doc.rect(margin, y, inner, 36).fill(C.dark);
      doc.rect(margin, y, 4, 36).fill(C.accent);
      doc.fontSize(13).font('Helvetica-Bold').fillColor(C.white)
         .text(team.teamName, margin + 14, y + 8);
      doc.fontSize(8).font('Helvetica').fillColor('#9ca3af')
         .text(`Captain: ${team.captainId?.name || '—'}  ·  P:${record.played}  W:${record.won}  L:${record.lost}  D:${record.drawn}  Pts:${record.points}`,
           margin + 14, y + 24);
      y += 46;

      // players list
      y = checkPage(doc, y, 30);
      doc.fontSize(9).font('Helvetica-Bold').fillColor(C.mid).text('PLAYERS', margin + 10, y); y += 14;

      const teamPlayers = team.players || [];
      const pColW = (inner - 20) / 2;
      teamPlayers.forEach((p, pidx) => {
        const col = pidx % 2, row = Math.floor(pidx / 2);
        if (col === 0 && row > 0) y = checkPage(doc, y, 18);
        const px = margin + 10 + col * (pColW + 10);
        const py = y + row * 18;
        doc.fontSize(8).font('Helvetica').fillColor(C.dark)
           .text(`• ${p.name}${p.phone ? '  ' + p.phone : ''}`, px, py, { width: pColW });
      });
      y += Math.ceil(teamPlayers.length / 2) * 18 + 12;

      // player stats
      const teamStats = Object.values(playerAgg)
        .filter((ps) => ps.teamId === tid)
        .sort((a, b) => a.playerName.localeCompare(b.playerName));

      if (teamStats.length > 0 && statKeys.length > 0) {
        y = checkPage(doc, y, 50);
        doc.fontSize(9).font('Helvetica-Bold').fillColor(C.mid).text('PLAYER STATS', margin + 10, y); y += 12;

        const statColW = Math.floor((inner - 160) / statKeys.length);

        // header
        doc.rect(margin, y, inner, 22).fill('#f3f4f6');
        doc.fontSize(7).font('Helvetica-Bold').fillColor(C.mid)
           .text('PLAYER', margin + 10, y + 8, { width: 140 });
        statKeys.forEach((k, ki) => {
          doc.text((statLabels[k] || k).toUpperCase(), margin + 155 + ki * statColW, y + 8, { width: statColW });
        });
        y += 22;

        teamStats.forEach((ps, pidx) => {
          y = checkPage(doc, y, 22);
          if (pidx % 2 === 1) doc.rect(margin, y, inner, 22).fill('#fafafa');
          doc.fontSize(8).font('Helvetica').fillColor(C.dark)
             .text(ps.playerName, margin + 10, y + 7, { width: 140 });
          statKeys.forEach((k, ki) => {
            const val = ps.stats[k] !== undefined ? String(ps.stats[k]) : '—';
            doc.text(val, margin + 155 + ki * statColW, y + 7, { width: statColW });
          });
          y += 22;
        });
      }
      y += 24;
    });

    drawFooter(doc, margin, inner, tournament.name, isCaptainReport ? 'Team Performance' : 'All Teams Performance');
    doc.end();
  } catch (error) {
    console.error('Team performance PDF error:', error);
    if (!res.headersSent) res.status(500).json({ message: error.message });
  }
};

module.exports = { generateFinancialSummary, generateTeamPerformance };

// ─────────────────────────────────────────────────────────────────────
// SPONSOR IMPACT PDF
// ─────────────────────────────────────────────────────────────────────
const generateSponsorImpact = async (req, res) => {
  try {
    const { tournamentId, sponsorshipId } = req.params;
    const axios = require('axios');
    const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:5050';

    const [tournament, sponsorship, teams, matches] = await Promise.all([
      Tournament.findById(tournamentId).populate('organiserId', 'name email'),
      require('../models/Sponsorship').findById(sponsorshipId)
        .populate('sponsorId', 'name email phone')
        .populate('tournamentId', 'name'),
      Team.find({ tournamentId, isWaitlisted: false }),
      Match.find({ tournamentId, status: 'completed' }),
    ]);

    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });
    if (!sponsorship) return res.status(404).json({ message: 'Sponsorship not found' });

    // auth — organiser OR the sponsor who owns this sponsorship
    const isOrganiser = tournament.organiserId._id.toString() === req.user.id;
    const isSponsor   = sponsorship.sponsorId?._id?.toString() === req.user.id;
    if (!isOrganiser && !isSponsor)
      return res.status(403).json({ message: 'Not authorized' });

    // derive city tier
    const tier1 = ['mumbai', 'delhi', 'bangalore', 'bengaluru', 'chennai', 'hyderabad', 'kolkata'];
    const tier2 = ['pune', 'surat', 'nagpur', 'jaipur', 'lucknow', 'kanpur', 'ahmedabad', 'indore'];
    const city  = tournament.venue?.city?.toLowerCase() || '';
    const cityTier = tier1.some((c) => city.includes(c)) ? 1
                   : tier2.some((c) => city.includes(c)) ? 2 : 3;

    // tournament days
    const days = Math.max(1, Math.ceil(
      (new Date(tournament.endDate) - new Date(tournament.startDate)) / (1000 * 60 * 60 * 24)
    ) + 1);

    // num matches
    const getNumMatches = (n, format) => {
      if (format === 'knockout') return n - 1;
      if (format === 'league')   return n * (n - 1) / 2;
      return Math.floor(n * (n - 1) / 4) + Math.floor(n / 2) - 1;
    };

    // call ML service
    let roiData = null;
    try {
      const mlRes = await axios.post(`${ML_URL}/predict/sponsor-roi`, {
        sport:                tournament.sport,
        city_tier:            cityTier,
        num_teams:            teams.length || tournament.maxTeams,
        num_matches:          matches.length || getNumMatches(tournament.maxTeams, tournament.format),
        venue_capacity:       tournament.venue?.capacity || 300,
        team_size:            tournament.sportConfig?.teamSize || 11,
        tournament_days:      days,
        has_existing_sponsor: 1,
        format:               tournament.format,
        sponsorship_tier:     sponsorship.tier,
      }, { timeout: 15000 });
      roiData = mlRes.data?.data;
    } catch (mlErr) {
      console.warn('ML service unavailable for sponsor report, using estimates:', mlErr.message);
      // fallback estimates
      const players = teams.length * (tournament.sportConfig?.teamSize || 11);
      roiData = {
        estimated_reach: players * 8,
        cost_per_person: Math.round(sponsorship.amount / (players * 8) * 10) / 10,
        roi_rating:      'good',
        reach_breakdown: {
          players,
          family:           Math.round(players * 1.8),
          venue_spectators: Math.round((tournament.venue?.capacity || 300) * 0.6),
          social_media:     Math.round(players * 1.2),
          word_of_mouth:    Math.round(players * 3),
        },
      };
    }

    const ROI_RATING_LABEL = {
      excellent: 'Excellent ROI',
      good:      'Good ROI',
      fair:      'Fair ROI',
      poor:      'Poor ROI',
    };
    const ROI_RATING_COLOR = {
      excellent: C.green,
      good:      C.accent,
      fair:      C.amber,
      poor:      C.red,
    };

    // ── BUILD PDF ─────────────────────────────────────────────────
    const doc    = new PDFDocument({ margin: 50, size: 'A4' });
    const pageW  = doc.page.width;
    const margin = 50;
    const inner  = pageW - margin * 2;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition',
      `attachment; filename="sponsor-impact-${tournament.name.replace(/\s+/g, '-')}.pdf"`);
    doc.pipe(res);

    // ── HEADER ────────────────────────────────────────────────────
    doc.rect(0, 0, pageW, 110).fill(C.dark);
    doc.fontSize(22).font('Helvetica-Bold').fillColor(C.white).text('SPORTFOLIO', margin, 28);
    doc.fontSize(10).font('Helvetica').fillColor('#f59e0b').text('Sponsor Impact Report', margin, 54);
    doc.fontSize(9).fillColor('#9ca3af')
       .text(`Generated: ${fmtDate(new Date())}`, margin, 28, { align: 'right', width: inner });

    let y = 130;
    doc.fontSize(18).font('Helvetica-Bold').fillColor(C.black).text(tournament.name, margin, y); y += 28;
    doc.fontSize(10).font('Helvetica').fillColor(C.mid)
       .text(`${tournament.sport.toUpperCase()}  ·  ${tournament.format.toUpperCase()}  ·  ${tournament.venue?.name}, ${tournament.venue?.city}`, margin, y); y += 18;
    doc.fontSize(10).fillColor(C.light)
       .text(`${fmtDate(tournament.startDate)} → ${fmtDate(tournament.endDate)}`, margin, y); y += 24;
    doc.moveTo(margin, y).lineTo(margin + inner, y).strokeColor(C.border).lineWidth(1).stroke(); y += 20;

    // ── SPONSORSHIP DETAILS ───────────────────────────────────────
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.dark).text('YOUR SPONSORSHIP', margin, y); y += 14;

    const tierColors = { platinum: '#7c3aed', gold: '#d97706', silver: '#6b7280', bronze: '#c2410c' };
    const tierBg     = { platinum: '#f5f3ff', gold: '#fffbeb', silver: '#f9fafb', bronze: '#fff7ed' };
    const tColor     = tierColors[sponsorship.tier] || C.accent;
    const tBg        = tierBg[sponsorship.tier] || C.bg;

    doc.rect(margin, y, inner, 80).fill(tBg);
    doc.rect(margin, y, 4, 80).fill(tColor);

    doc.fontSize(16).font('Helvetica-Bold').fillColor(tColor)
       .text(sponsorship.businessName, margin + 16, y + 10);
    doc.fontSize(9).font('Helvetica').fillColor(C.mid)
       .text(`Sponsor: ${sponsorship.sponsorId?.name || '—'}  ·  ${sponsorship.sponsorId?.email || '—'}`, margin + 16, y + 30);

    // tier badge
    doc.rect(margin + inner - 100, y + 10, 90, 24).fill(tColor);
    doc.fontSize(10).font('Helvetica-Bold').fillColor(C.white)
       .text(sponsorship.tier.toUpperCase(), margin + inner - 100, y + 17, { width: 90, align: 'center' });

    // amounts row
    [
      { label: 'Amount Paid',       value: fmt(sponsorship.amount) },
      { label: 'Prize Contribution', value: fmt(sponsorship.prizeContribution) },
      { label: 'Operating Revenue', value: fmt(sponsorship.amount - sponsorship.prizeContribution) },
    ].forEach((item, i) => {
      const ix = margin + 16 + i * 155;
      doc.fontSize(7).font('Helvetica').fillColor(C.light).text(item.label.toUpperCase(), ix, y + 50, { width: 140 });
      doc.fontSize(11).font('Helvetica-Bold').fillColor(C.dark).text(item.value, ix, y + 62, { width: 140 });
    });
    y += 96;

    // ── AUDIENCE REACH ────────────────────────────────────────────
    y = checkPage(doc, y, 80);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.dark).text('ESTIMATED AUDIENCE REACH', margin, y); y += 6;
    doc.fontSize(8).font('Helvetica').fillColor(C.light)
       .text('Powered by XGBoost ML model trained on 50,000 tournament records', margin, y + 10); y += 26;

    // big reach number
    doc.rect(margin, y, inner, 70).fill(C.dark);
    doc.fontSize(36).font('Helvetica-Bold').fillColor(C.white)
       .text((roiData.estimated_reach || 0).toLocaleString('en-IN'), margin, y + 10, { align: 'center', width: inner });
    doc.fontSize(10).font('Helvetica').fillColor('#9ca3af')
       .text('ESTIMATED PEOPLE REACHED', margin, y + 52, { align: 'center', width: inner });
    y += 82;

    // breakdown bars
    const breakdown = roiData.reach_breakdown || {};
    const total     = roiData.estimated_reach || 1;
    const breakdownItems = [
      { icon: 'Players + Teams',    value: breakdown.players           || 0 },
      { icon: 'Family Spectators',  value: breakdown.family            || 0 },
      { icon: 'Venue Spectators',   value: breakdown.venue_spectators  || 0 },
      { icon: 'Social Media',       value: breakdown.social_media      || 0 },
      { icon: 'Word of Mouth',      value: breakdown.word_of_mouth     || 0 },
    ];

    breakdownItems.forEach((item, idx) => {
      y = checkPage(doc, y, 26);
      if (idx % 2 === 0) doc.rect(margin, y, inner, 26).fill(C.bg);

      const pct  = Math.round((item.value / total) * 100);
      const barW = Math.round((item.value / total) * (inner - 220));

      doc.fontSize(9).font('Helvetica').fillColor(C.dark)
         .text(item.icon, margin + 10, y + 8, { width: 140 });
      doc.fontSize(9).font('Helvetica-Bold').fillColor(C.dark)
         .text(item.value.toLocaleString('en-IN'), margin + 160, y + 8, { width: 60, align: 'right' });

      doc.rect(margin + 230, y + 10, inner - 230, 6).fill('#e5e7eb');
      doc.rect(margin + 230, y + 10, Math.max(barW, 4), 6).fill(tColor);

      doc.fontSize(8).font('Helvetica').fillColor(C.light)
         .text(`${pct}%`, margin + inner - 30, y + 8, { width: 30, align: 'right' });
      y += 26;
    });

    // divider + CPP + rating
    y += 8;
    doc.moveTo(margin, y).lineTo(margin + inner, y).strokeColor(C.border).lineWidth(1).stroke();
    y += 14;

    const ratingColor = ROI_RATING_COLOR[roiData.roi_rating] || C.accent;
    const ratingLabel = ROI_RATING_LABEL[roiData.roi_rating] || 'Good ROI';

    const metricW = (inner - 8) / 2;
    [
      { label: 'Cost Per Person',  value: `Rs. ${roiData.cost_per_person || 0}`, color: C.accent },
      { label: 'ROI Rating',       value: ratingLabel,                            color: ratingColor },
    ].forEach((m, i) => {
      const bx = margin + i * (metricW + 8);
      doc.rect(bx, y, metricW, 56).fill(C.bg);
      doc.rect(bx, y, 3, 56).fill(m.color);
      doc.fontSize(7).font('Helvetica').fillColor(C.light).text(m.label.toUpperCase(), bx + 10, y + 8, { width: metricW - 20 });
      doc.fontSize(16).font('Helvetica-Bold').fillColor(m.color).text(m.value, bx + 10, y + 22, { width: metricW - 20 });
    });
    y += 70;

    // ── TOURNAMENT RESULTS ────────────────────────────────────────
    y = checkPage(doc, y, 60);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(C.dark).text('TOURNAMENT RESULTS', margin, y); y += 14;

    const tStats = [
      ['Teams',          `${teams.length} / ${tournament.maxTeams}`],
      ['Matches Played', `${matches.length}`],
      ['Tournament Days', `${days}`],
      ['City Tier',      `Tier ${cityTier}`],
    ];
    const tsColW = (inner - 24) / 4;
    tStats.forEach((s, i) => {
      const bx = margin + i * (tsColW + 8);
      doc.rect(bx, y, tsColW, 56).fill(C.bg);
      doc.rect(bx, y, 3, 56).fill(C.mid);
      doc.fontSize(7).font('Helvetica').fillColor(C.light).text(s[0].toUpperCase(), bx + 8, y + 8, { width: tsColW - 16 });
      doc.fontSize(15).font('Helvetica-Bold').fillColor(C.dark).text(s[1], bx + 8, y + 22, { width: tsColW - 16 });
    });
    y += 70;

    // ── THANK YOU NOTE ────────────────────────────────────────────
    y = checkPage(doc, y, 80);
    doc.rect(margin, y, inner, 80).fill(tBg);
    doc.rect(margin, y, inner, 3).fill(tColor);

    doc.fontSize(13).font('Helvetica-Bold').fillColor(tColor)
       .text('Thank You for Your Support!', margin + 20, y + 16);
    doc.fontSize(9).font('Helvetica').fillColor(C.dark)
       .text(
         `Thank you, ${sponsorship.businessName}, for sponsoring ${tournament.name}. Your ${sponsorship.tier} sponsorship helped make this tournament possible and reached an estimated ${(roiData.estimated_reach || 0).toLocaleString('en-IN')} people. We look forward to partnering with you again!`,
         margin + 20, y + 36, { width: inner - 40, lineGap: 4 }
       );
    y += 96;

    drawFooter(doc, margin, inner, tournament.name, 'Sponsor Impact Report');
    doc.end();
  } catch (error) {
    console.error('Sponsor impact PDF error:', error);
    if (!res.headersSent) res.status(500).json({ message: error.message });
  }
};

// re-export all three
module.exports = { generateFinancialSummary, generateTeamPerformance, generateSponsorImpact };