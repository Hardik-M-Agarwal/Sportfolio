const Match = require("../models/Match");
const Team = require("../models/Team");
const Tournament = require("../models/Tournament");
const { generateKnockout, generateLeague, generateLeagueKnockout } = require("../utils/bracketUtils");

// @POST /api/matches/generate/:tournamentId
const generateSchedule = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    if (tournament.organiserId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // get all approved + paid teams
    const teams = await Team.find({
      tournamentId: tournament._id,
      isWaitlisted: false,
      isApproved: true,
    });

    if (teams.length < 2) {
      return res.status(400).json({ message: "At least 2 approved teams are required to generate schedule" });
    }

    // delete existing matches if regenerating
    await Match.deleteMany({ tournamentId: tournament._id });

    let matchData = [];

    if (tournament.format === "knockout") {
      matchData = generateKnockout(teams);
    } else if (tournament.format === "league") {
      matchData = generateLeague(teams);
    } else if (tournament.format === "league+knockout") {
      matchData = generateLeagueKnockout(teams);
    }

    // insert all matches with tournamentId
    const matches = await Match.insertMany(
      matchData.map((m) => ({ ...m, tournamentId: tournament._id }))
    );

    // populate team names
    const populated = await Match.find({ tournamentId: tournament._id })
      .populate("team1Id", "teamName")
      .populate("team2Id", "teamName")
      .sort({ round: 1, matchNumber: 1 });

    res.status(201).json({
      success: true,
      message: `${matches.length} matches generated successfully`,
      matches: populated,
    });
  } catch (error) {
    console.error("Generate schedule error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/matches/tournament/:tournamentId
const getMatchesByTournament = async (req, res) => {
  try {
    const matches = await Match.find({ tournamentId: req.params.tournamentId })
      .populate("team1Id", "teamName")
      .populate("team2Id", "teamName")
      .populate("result.winnerId", "teamName")
      .sort({ round: 1, matchNumber: 1 });

    res.status(200).json({ success: true, matches });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/matches/:id
const getMatch = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate("team1Id", "teamName players")
      .populate("team2Id", "teamName players")
      .populate("result.winnerId", "teamName");

    if (!match) return res.status(404).json({ message: "Match not found" });
    res.status(200).json({ success: true, match });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @PUT /api/matches/:id/schedule
// organiser sets date, time, venue, ground
const scheduleMatch = async (req, res) => {
  try {
    const { matchDate, matchTime, venue, ground } = req.body;
    const match = await Match.findById(req.params.id).populate("tournamentId");

    if (!match) return res.status(404).json({ message: "Match not found" });
    if (match.tournamentId.organiserId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    match.matchDate = matchDate;
    match.matchTime = matchTime;
    match.venue = venue;
    match.ground = ground;
    await match.save();

    res.status(200).json({ success: true, match });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @PUT /api/matches/:id/result
// organiser enters match result
const enterResult = async (req, res) => {
  try {
    const { winnerId, team1Score, team2Score, notes } = req.body;
    const match = await Match.findById(req.params.id).populate("tournamentId");

    if (!match) return res.status(404).json({ message: "Match not found" });
    if (match.tournamentId.organiserId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    match.result = { winnerId, team1Score, team2Score, notes };
    match.status = "completed";
    await match.save();

    const populated = await Match.findById(match._id)
      .populate("team1Id", "teamName")
      .populate("team2Id", "teamName")
      .populate("result.winnerId", "teamName");

    res.status(200).json({ success: true, match: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/matches/team/:teamId
// captain sees their team's matches
const getMatchesByTeam = async (req, res) => {
  try {
    const matches = await Match.find({
      $or: [
        { team1Id: req.params.teamId },
        { team2Id: req.params.teamId },
      ],
    })
      .populate("team1Id", "teamName")
      .populate("team2Id", "teamName")
      .populate("result.winnerId", "teamName")
      .populate("tournamentId", "name sport venue")
      .sort({ round: 1, matchNumber: 1 });

    res.status(200).json({ success: true, matches });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  generateSchedule,
  getMatchesByTournament,
  getMatch,
  scheduleMatch,
  enterResult,
  getMatchesByTeam,
};