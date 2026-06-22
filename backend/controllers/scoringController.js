const Match = require("../models/Match");
const Tournament = require("../models/Tournament");
const Team = require("../models/Team");
const Scorecard = require("../models/Scorecard");
const MatchEvent = require("../models/MatchEvent");
const PlayerStat = require("../models/PlayerStat");

// default score states per sport
const getDefaultScoreState = (sport, team1Name, team2Name) => {
  switch (sport) {
    case "cricket":
      return {
        currentInnings: 1,
        team1: {
          name: team1Name, runs: 0, wickets: 0,
          balls: 0, overs: "0.0", extras: 0,
        },
        team2: {
          name: team2Name, runs: 0, wickets: 0,
          balls: 0, overs: "0.0", extras: 0,
        },
        currentBatting: "team1",
        ballHistory: [],
      };
    case "football":
      return {
        team1: { name: team1Name, goals: 0 },
        team2: { name: team2Name, goals: 0 },
        half: 1, minute: 0,
        events: [],
      };
    case "badminton":
      return {
        team1: { name: team1Name, sets: 0, currentSetPoints: 0 },
        team2: { name: team2Name, sets: 0, currentSetPoints: 0 },
        currentSet: 1,
        sets: [],
      };
    case "kabaddi":
      return {
        team1: { name: team1Name, score: 0 },
        team2: { name: team2Name, score: 0 },
        half: 1,
      };
    case "basketball":
      return {
        team1: { name: team1Name, score: 0, quarters: [0, 0, 0, 0] },
        team2: { name: team2Name, score: 0, quarters: [0, 0, 0, 0] },
        currentQuarter: 1,
      };
    case "volleyball":
      return {
        team1: { name: team1Name, sets: 0, currentSetPoints: 0 },
        team2: { name: team2Name, sets: 0, currentSetPoints: 0 },
        currentSet: 1,
        sets: [],
      };
    default:
      return {
        team1: { name: team1Name, score: 0 },
        team2: { name: team2Name, score: 0 },
      };
  }
};

// @POST /api/scoring/:matchId/start
// scorer starts the match
const startMatch = async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId)
      .populate("team1Id", "teamName")
      .populate("team2Id", "teamName")
      .populate("tournamentId", "sport");

    if (!match) return res.status(404).json({ message: "Match not found" });

    // check scorer is assigned to this match
    if (match.scorerId?.toString() !== req.user.id &&
        match.tournamentId.organiserId?.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to score this match" });
    }

    const sport = match.tournamentId.sport;

    let scorecard = await Scorecard.findOne({ matchId: match._id });
    if (!scorecard) {
      scorecard = await Scorecard.create({
        matchId: match._id,
        tournamentId: match.tournamentId._id,
        sport,
        status: "live",
        scorerId: req.user.id,
        scoreState: getDefaultScoreState(
          sport,
          match.team1Id.teamName,
          match.team2Id.teamName
        ),
      });
    } else {
      scorecard.status = "live";
      await scorecard.save();
    }

    // update match status
    match.status = "ongoing";
    await match.save();

    // emit via socket
    req.io.to(`match_${match._id}`).emit("match_started", { scorecard });

    res.status(200).json({ success: true, scorecard });
  } catch (error) {
    console.error("Start match error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @POST /api/scoring/:matchId/event
// scorer adds an event (goal, ball, point etc)
const addEvent = async (req, res) => {
  try {
    const { eventType, teamId, playerName, data } = req.body;

    const match = await Match.findById(req.params.matchId)
      .populate("tournamentId", "sport organiserId");

    if (!match) return res.status(404).json({ message: "Match not found" });

    const scorecard = await Scorecard.findOne({ matchId: match._id });
    if (!scorecard) return res.status(404).json({ message: "Scorecard not found. Start the match first." });

    // update score state based on event
    const updatedState = updateScoreState(
      scorecard.sport,
      scorecard.scoreState,
      eventType,
      teamId,
      data,
      match
    );

    scorecard.scoreState = updatedState;
    scorecard.markModified("scoreState");
    await scorecard.save();

    // create event record
    const event = await MatchEvent.create({
      matchId: match._id,
      tournamentId: match.tournamentId._id,
      teamId,
      eventType,
      playerName,
      data,
      scoreSnapshot: {
        team1Score: updatedState.team1,
        team2Score: updatedState.team2,
      },
    });

    // update player stats
    if (playerName && teamId) {
      await updatePlayerStats(match._id, match.tournamentId._id, teamId, playerName, scorecard.sport, eventType, data);
    }

    // emit to all viewers
    req.io.to(`match_${match._id}`).emit("score_update", {
      scorecard,
      event,
    });

    res.status(200).json({ success: true, scorecard, event });
  } catch (error) {
    console.error("Add event error:", error);
    res.status(500).json({ message: error.message });
  }
};

// score state updater per sport
const updateScoreState = (sport, state, eventType, teamId, data, match) => {
  const s = { ...state };
  const isTeam1 = teamId?.toString() === match.team1Id?.toString();
  const teamKey = isTeam1 ? "team1" : "team2";
  const otherKey = isTeam1 ? "team2" : "team1";

  switch (sport) {
    case "cricket": {
      if (eventType === "ball") {
        const battingTeam = s.currentBatting === "team1" ? "team1" : "team2";
        s[battingTeam].balls += 1;
        s[battingTeam].runs += data.runs || 0;
        s[battingTeam].extras += data.extras || 0;

        // calculate overs
        const balls = s[battingTeam].balls;
        s[battingTeam].overs = `${Math.floor(balls / 6)}.${balls % 6}`;

        // ball history
        s.ballHistory = [...(s.ballHistory || []), {
          runs: data.runs,
          extras: data.extras,
          isWicket: data.isWicket,
          type: data.ballType || "normal",
        }];

        if (data.isWicket) {
          s[battingTeam].wickets += 1;
        }
      }
      if (eventType === "innings_complete") {
        s.currentBatting = s.currentBatting === "team1" ? "team2" : "team1";
        s.currentInnings = 2;
        s.ballHistory = [];
      }
      break;
    }
    case "football": {
      if (eventType === "goal") {
        s[teamKey].goals += 1;
      }
      if (eventType === "half_time") {
        s.half = 2;
      }
      s.minute = data?.minute || s.minute;
      break;
    }
    case "badminton": {
      if (eventType === "point") {
        s[teamKey].currentSetPoints += 1;

        // check set win (first to 21, must win by 2)
        const t1 = s.team1.currentSetPoints;
        const t2 = s.team2.currentSetPoints;
        if ((t1 >= 21 || t2 >= 21) && Math.abs(t1 - t2) >= 2) {
          const setWinner = t1 > t2 ? "team1" : "team2";
          s[setWinner].sets += 1;
          s.sets = [...(s.sets || []), { team1: t1, team2: t2 }];
          s.team1.currentSetPoints = 0;
          s.team2.currentSetPoints = 0;
          s.currentSet += 1;
        }
      }
      break;
    }
    case "kabaddi": {
      if (eventType === "raid_point" || eventType === "tackle_point") {
        s[teamKey].score += data?.points || 1;
      }
      if (eventType === "all_out") {
        s[teamKey].score += 2; // bonus for all out
      }
      if (eventType === "half_time") {
        s.half = 2;
      }
      break;
    }
    case "basketball": {
      const pts = eventType === "three_point" ? 3 : eventType === "free_throw" ? 1 : 2;
      if (eventType !== "foul" && eventType !== "quarter_complete") {
        s[teamKey].score += pts;
        s[teamKey].quarters[s.currentQuarter - 1] += pts;
      }
      if (eventType === "quarter_complete") {
        s.currentQuarter = Math.min(s.currentQuarter + 1, 4);
      }
      break;
    }
    case "volleyball": {
      if (eventType === "point") {
        s[teamKey].currentSetPoints += 1;
        const t1 = s.team1.currentSetPoints;
        const t2 = s.team2.currentSetPoints;
        if ((t1 >= 25 || t2 >= 25) && Math.abs(t1 - t2) >= 2) {
          const setWinner = t1 > t2 ? "team1" : "team2";
          s[setWinner].sets += 1;
          s.sets = [...(s.sets || []), { team1: t1, team2: t2 }];
          s.team1.currentSetPoints = 0;
          s.team2.currentSetPoints = 0;
          s.currentSet += 1;
        }
      }
      break;
    }
    default:
      break;
  }

  return s;
};

// update player stats
const updatePlayerStats = async (matchId, tournamentId, teamId, playerName, sport, eventType, data) => {
  try {
    let stat = await PlayerStat.findOne({ matchId, teamId, playerName });
    if (!stat) {
      stat = new PlayerStat({ matchId, tournamentId, teamId, playerName, sport, stats: {} });
    }

    const s = { ...stat.stats };

    switch (sport) {
      case "cricket":
        if (eventType === "ball") {
          if (data.batsmanName === playerName) {
            s.runs = (s.runs || 0) + (data.runs || 0);
            s.balls = (s.balls || 0) + 1;
            if (data.runs === 4) s.fours = (s.fours || 0) + 1;
            if (data.runs === 6) s.sixes = (s.sixes || 0) + 1;
          }
          if (data.bowlerName === playerName) {
            s.ballsBowled = (s.ballsBowled || 0) + 1;
            s.runsConceded = (s.runsConceded || 0) + (data.runs || 0);
            if (data.isWicket) s.wickets = (s.wickets || 0) + 1;
          }
          if (data.isWicket && data.catchName === playerName) {
            s.catches = (s.catches || 0) + 1;
          }
        }
        break;
      case "football":
        if (eventType === "goal") s.goals = (s.goals || 0) + 1;
        if (eventType === "assist") s.assists = (s.assists || 0) + 1;
        if (eventType === "yellow_card") s.yellowCards = (s.yellowCards || 0) + 1;
        if (eventType === "red_card") s.redCards = (s.redCards || 0) + 1;
        break;
      case "badminton":
        if (eventType === "point") s.pointsWon = (s.pointsWon || 0) + 1;
        break;
      case "kabaddi":
        if (eventType === "raid_point") s.raidPoints = (s.raidPoints || 0) + (data?.points || 1);
        if (eventType === "tackle_point") s.tacklePoints = (s.tacklePoints || 0) + (data?.points || 1);
        break;
      case "basketball":
        if (eventType === "two_point") s.points = (s.points || 0) + 2;
        if (eventType === "three_point") s.points = (s.points || 0) + 3;
        if (eventType === "free_throw") s.points = (s.points || 0) + 1;
        if (eventType === "assist") s.assists = (s.assists || 0) + 1;
        break;
      case "volleyball":
        if (eventType === "point") s.pointsWon = (s.pointsWon || 0) + 1;
        break;
    }

    stat.stats = s;
    stat.markModified("stats");
    await stat.save();
  } catch (error) {
    console.error("Update player stats error:", error);
  }
};

// @GET /api/scoring/:matchId/scorecard
// public — get live scorecard
const getScorecard = async (req, res) => {
  try {
    const scorecard = await Scorecard.findOne({ matchId: req.params.matchId })
      .populate("scorerId", "name");

    const match = await Match.findById(req.params.matchId)
      .populate("team1Id", "teamName players")
      .populate("team2Id", "teamName players")
      .populate("tournamentId", "name sport venue sportConfig");

    if (!match) return res.status(404).json({ message: "Match not found" });

    const events = await MatchEvent.find({ matchId: req.params.matchId })
      .sort({ timestamp: -1 })
      .limit(50);

    const playerStats = await PlayerStat.find({ matchId: req.params.matchId });

    res.status(200).json({
      success: true,
      match,
      scorecard,
      events,
      playerStats,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/scoring/:matchId/events
const getEvents = async (req, res) => {
  try {
    const events = await MatchEvent.find({ matchId: req.params.matchId })
      .sort({ timestamp: -1 })
      .limit(100);
    res.status(200).json({ success: true, events });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @PUT /api/scoring/:matchId/assign-scorer
// organiser assigns scorer to match
const assignScorer = async (req, res) => {
  try {
    const { scorerId } = req.body;
    const match = await Match.findById(req.params.matchId)
      .populate("tournamentId");

    if (!match) return res.status(404).json({ message: "Match not found" });
    if (match.tournamentId.organiserId.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });

    match.scorerId = scorerId;
    await match.save();

    res.status(200).json({ success: true, match });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/scoring/scorers/:tournamentId
// get all scorers registered for a tournament
const getScorersByTournament = async (req, res) => {
  try {
    const User = require("../models/User");
    const scorers = await User.find({
      role: "scorer",
      tournamentId: req.params.tournamentId,
      isVerified: true,
    }).select("name email phone");

    res.status(200).json({ success: true, scorers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/scoring/my-matches
// scorer sees their assigned matches
const getMyAssignedMatches = async (req, res) => {
  try {
    const user = await require("../models/User").findById(req.user.id);
    const matches = await Match.find({
      $or: [
        { scorerId: req.user.id },
        { tournamentId: user.tournamentId },
      ],
    })
      .populate("team1Id", "teamName")
      .populate("team2Id", "teamName")
      .populate("tournamentId", "name sport venue")
      .sort({ round: 1, matchNumber: 1 });

    res.status(200).json({ success: true, matches });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  startMatch,
  addEvent,
  getScorecard,
  getEvents,
  assignScorer,
  getScorersByTournament,
  getMyAssignedMatches,
};