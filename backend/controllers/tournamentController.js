const Tournament = require("../models/Tournament");
const { autoUpdateStatus } = require("../utils/tournamentUtils");
const Team = require('../models/Team');

const createTournament = async (req, res) => {
  try {
    const {
      name,
      sport,
      format,
      venue,
      startDate,
      endDate,
      registrationStartDate,
      registrationEndDate,
      maxTeams,
      entryFee,
      prizeStructure,
      sponsorshipTiers,
      sportConfig,
    } = req.body;

    const tournament = await Tournament.create({
  name,
  sport,
  format,
  organiserId: req.user.id,
  venue,
  startDate,
  endDate,
  registrationStartDate,
  registrationEndDate: new Date(new Date(registrationEndDate).setHours(23, 59, 59, 999)),
  maxTeams,
  entryFee,
  prizeStructure,
  sponsorshipTiers,
  sportConfig,
});

    res.status(201).json({ success: true, tournament });
  } catch (error) {
    console.error('Create tournament error:', error);
    res.status(500).json({ message: error.message });
  }
};

const getMyTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.find({ organiserId: req.user.id })
      .sort({ createdAt: -1 });

    const updated = await Promise.all(
      tournaments.map(async (t) => {
        const updatedT = await autoUpdateStatus(t);

        const [registeredCount, paidCount] = await Promise.all([
          Team.countDocuments({
            tournamentId: t._id,
            isWaitlisted: false,
          }),
          Team.countDocuments({
            tournamentId: t._id,
            isWaitlisted: false,
            paymentStatus: { $in: ['paid', 'cash'] },
          }),
        ]);

        return {
          ...updatedT.toObject(),
          registeredCount,
          paidTeams: paidCount,
        };
      })
    );

    res.status(200).json({ success: true, tournaments: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate("organiserId", "name email");
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }
    await autoUpdateStatus(tournament);
    res.status(200).json({ success: true, tournament });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTournamentByCode = async (req, res) => {
  try {
    const tournament = await Tournament.findOne({
      tournamentCode: req.params.code.toUpperCase(),
    }).populate("organiserId", "name email phone");

    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    await autoUpdateStatus(tournament);

    const Team = require("../models/Team");
    const registeredCount = await Team.countDocuments({
      tournamentId: tournament._id,
      isWaitlisted: false,
    });

    res.status(200).json({
      success: true,
      tournament: { ...tournament.toObject(), registeredCount },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPublicTournaments = async (req, res) => {
  try {
    const { sport, city, status, search } = req.query;

    const query = { isPublic: true };
    if (sport) query.sport = sport;
    if (city) query['venue.city'] = { $regex: city, $options: 'i' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'venue.city': { $regex: search, $options: 'i' } },
      ];
    }

    const tournaments = await Tournament.find(query)
      .populate("organiserId", "name email phone")
      .sort({ createdAt: -1 });

    const Team = require("../models/Team");

    // auto update status + attach team count
    const tournamentsWithCount = await Promise.all(
      tournaments.map(async (t) => {
        const updated = await autoUpdateStatus(t);
        const registeredCount = await Team.countDocuments({
          tournamentId: t._id,
          isWaitlisted: false,
        });
        return { ...updated.toObject(), registeredCount };
      })
    );

    // apply status filter AFTER auto update
    const filtered = status
      ? tournamentsWithCount.filter((t) => t.status === status)
      : tournamentsWithCount;

    res.status(200).json({ success: true, tournaments: filtered });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }
    if (tournament.organiserId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this tournament" });
    }
    const updated = await Tournament.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, tournament: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }
    if (tournament.organiserId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this tournament" });
    }
    await tournament.deleteOne();
    res.status(200).json({ success: true, message: "Tournament deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTournament,
  getMyTournaments,
  getTournament,
  getTournamentByCode,
  getPublicTournaments,
  updateTournament,
  deleteTournament,
};