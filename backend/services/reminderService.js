const cron = require('node-cron');
const { sendSMS } = require('./smsService');

let Match, Team;

const loadModels = () => {
  if (!Match) Match = require('../models/Match');
  if (!Team)  Team  = require('../models/Team');
};

// ── helper: get tomorrow's date range ────────────────────────────────
const getTomorrowRange = () => {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

// ── helper: get today's matches within next 2 hours ──────────────────
const getUpcomingTwoHourRange = () => {
  const now   = new Date();
  const start = new Date(now.getTime() + 90  * 60 * 1000); // 1.5 hours from now
  const end   = new Date(now.getTime() + 150 * 60 * 1000); // 2.5 hours from now
  return { start, end };
};

// ── helper: parse match datetime ─────────────────────────────────────
const getMatchDateTime = (match) => {
  if (!match.matchDate) return null;
  const date = new Date(match.matchDate);
  if (match.matchTime) {
    const [h, m] = match.matchTime.split(':');
    date.setHours(parseInt(h), parseInt(m), 0, 0);
  }
  return date;
};

// ── helper: get captain phone for a team ─────────────────────────────
const getCaptainPhone = async (teamId) => {
  const team = await Team.findById(teamId).populate('captainId', 'name phone');
  return team?.captainId;
};

// ── helper: format match reminder message ────────────────────────────
const formatDayBeforeMessage = (match, teamName, opponentName) => {
  const date = new Date(match.matchDate);
  const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const timeStr = match.matchTime
    ? (() => {
        const [h, m] = match.matchTime.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        return `${hour % 12 || 12}:${m} ${ampm}`;
      })()
    : '';

  return `Sportfolio Reminder: ${teamName} has a match TOMORROW vs ${opponentName}. Date: ${dateStr}${timeStr ? ` at ${timeStr}` : ''}${match.venue ? ` at ${match.venue}` : ''}. ${match.roundName || ''}. Be ready!`;
};

const formatTwoHourMessage = (match, teamName, opponentName) => {
  const timeStr = match.matchTime
    ? (() => {
        const [h, m] = match.matchTime.split(':');
        const hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        return `${hour % 12 || 12}:${m} ${ampm}`;
      })()
    : 'shortly';

  return `Sportfolio: Match Alert! ${teamName} vs ${opponentName} starts at ${timeStr}${match.venue ? ` at ${match.venue}` : ''}. ${match.roundName || ''}. Good luck!`;
};

// ── JOB 1: Day before reminder — runs every day at 9:00 AM ──────────
const scheduleDayBeforeReminders = () => {
  cron.schedule('0 9 * * *', async () => {
    console.log('⏰ Running day-before match reminder check...');
    loadModels();

    try {
      const { start, end } = getTomorrowRange();

      const matches = await Match.find({
        matchDate: { $gte: start, $lte: end },
        status: 'scheduled',
      })
        .populate('team1Id', 'teamName captainId')
        .populate('team2Id', 'teamName captainId')
        .populate('tournamentId', 'name sport');

      console.log(`📊 Found ${matches.length} matches tomorrow`);

      for (const match of matches) {
        // notify team1 captain
        const captain1 = await getCaptainPhone(match.team1Id?._id);
        if (captain1?.phone) {
          const msg = formatDayBeforeMessage(
            match,
            match.team1Id?.teamName,
            match.team2Id?.teamName
          );
          await sendSMS(captain1.phone, msg);
          console.log(`📱 Day-before reminder sent to ${captain1.name} (${match.team1Id?.teamName})`);
        }

        // notify team2 captain
        const captain2 = await getCaptainPhone(match.team2Id?._id);
        if (captain2?.phone) {
          const msg = formatDayBeforeMessage(
            match,
            match.team2Id?.teamName,
            match.team1Id?.teamName
          );
          await sendSMS(captain2.phone, msg);
          console.log(`📱 Day-before reminder sent to ${captain2.name} (${match.team2Id?.teamName})`);
        }
      }

      console.log('✅ Day-before reminder job complete');
    } catch (error) {
      console.error('❌ Day-before reminder error:', error.message);
    }
  });

  console.log('✅ Scheduled day-before reminder at 9:00 AM daily');
};

// ── JOB 2: 2-hour reminder — runs every 30 minutes ──────────────────
const scheduleTwoHourReminders = () => {
  cron.schedule('*/30 * * * *', async () => {
    console.log('⏰ Running 2-hour match reminder check...');
    loadModels();

    try {
      const today = new Date();
      const todayStart = new Date(today);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      // get all scheduled matches today
      const matches = await Match.find({
        matchDate: { $gte: todayStart, $lte: todayEnd },
        status: 'scheduled',
      })
        .populate('team1Id', 'teamName captainId')
        .populate('team2Id', 'teamName captainId')
        .populate('tournamentId', 'name sport');

      const now = new Date();

      for (const match of matches) {
        const matchDateTime = getMatchDateTime(match);
        if (!matchDateTime) continue;

        const diffMs      = matchDateTime.getTime() - now.getTime();
        const diffMinutes = diffMs / (1000 * 60);

        // send if match is between 110 and 130 minutes away (~2 hours)
        if (diffMinutes >= 110 && diffMinutes <= 130) {
          // notify team1 captain
          const captain1 = await getCaptainPhone(match.team1Id?._id);
          if (captain1?.phone) {
            const msg = formatTwoHourMessage(
              match,
              match.team1Id?.teamName,
              match.team2Id?.teamName
            );
            await sendSMS(captain1.phone, msg);
            console.log(`📱 2-hour reminder sent to ${captain1.name} (${match.team1Id?.teamName})`);
          }

          // notify team2 captain
          const captain2 = await getCaptainPhone(match.team2Id?._id);
          if (captain2?.phone) {
            const msg = formatTwoHourMessage(
              match,
              match.team2Id?.teamName,
              match.team1Id?.teamName
            );
            await sendSMS(captain2.phone, msg);
            console.log(`📱 2-hour reminder sent to ${captain2.name} (${match.team2Id?.teamName})`);
          }
        }
      }

      console.log('✅ 2-hour reminder job complete');
    } catch (error) {
      console.error('❌ 2-hour reminder error:', error.message);
    }
  });

  console.log('✅ Scheduled 2-hour reminder check every 30 minutes');
};

// ── START ALL REMINDERS ───────────────────────────────────────────────
const startReminderService = () => {
  console.log('🚀 Starting Sportfolio reminder service...');
  scheduleDayBeforeReminders();
  scheduleTwoHourReminders();
  console.log('✅ Reminder service started');
};

module.exports = { startReminderService };