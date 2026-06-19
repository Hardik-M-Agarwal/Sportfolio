const Team = require("../models/Team");
const Tournament = require("../models/Tournament");
const { autoUpdateStatus } = require("../utils/tournamentUtils");
const { createOrder, verifySignature } = require("../services/paymentService");

const validateRegistration = async (tournamentId, captainId, players) => {
  const tournament = await Tournament.findById(tournamentId);
  if (!tournament) throw { status: 404, message: "Tournament not found" };

  await autoUpdateStatus(tournament);

  if (tournament.status !== "registration") {
    if (tournament.status === "upcoming")
      throw { status: 400, message: "Registration has not opened yet" };
    if (tournament.status === "ongoing" || tournament.status === "completed")
      throw { status: 400, message: "Registration has closed" };
  }

  const existingTeam = await Team.findOne({ tournamentId, captainId });
  if (existingTeam)
    throw { status: 400, message: "You have already registered a team for this tournament" };

  const requiredPlayers = tournament.sportConfig?.teamSize;
  if (requiredPlayers && players.length !== requiredPlayers)
    throw {
      status: 400,
      message: `This tournament requires exactly ${requiredPlayers} players per team`,
    };

  return tournament;
};

// @POST /api/teams/create-order
const createOrderHandler = async (req, res) => {
  try {
    const { tournamentId, teamName, players } = req.body;

    if (!teamName?.trim()) {
      return res.status(400).json({ message: "Team name is required" });
    }

    const tournament = await validateRegistration(tournamentId, req.user.id, players);

    const registeredTeams = await Team.countDocuments({
      tournamentId,
      isWaitlisted: false,
    });
    const isWaitlisted = registeredTeams >= tournament.maxTeams;

    if (isWaitlisted) {
      const team = await Team.create({
        tournamentId,
        captainId: req.user.id,
        teamName,
        players,
        paymentAmount: tournament.entryFee,
        paymentStatus: "pending",
        isWaitlisted: true,
        isApproved: false,
      });

      return res.status(201).json({
        success: true,
        isWaitlisted: true,
        team,
        message: "Tournament is full. You have been added to the waitlist.",
      });
    }

    const order = await createOrder(
      tournament.entryFee,
      `receipt_${Date.now()}`,
      {
        tournamentId: tournamentId.toString(),
        teamName,
        captainId: req.user.id.toString(),
      }
    );

    res.status(200).json({
      success: true,
      isWaitlisted: false,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      tournament: {
        name: tournament.name,
        entryFee: tournament.entryFee,
      },
    });
  } catch (error) {
    console.error("Create order error:", error);
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    res.status(500).json({ message: error.message });
  }
};

// @POST /api/teams/verify-payment
const verifyPayment = async (req, res) => {
  try {
    const {
      tournamentId,
      teamName,
      players,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const isValid = verifySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return res.status(400).json({
        message: "Payment verification failed. Invalid signature.",
      });
    }

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    const registeredTeams = await Team.countDocuments({
      tournamentId,
      isWaitlisted: false,
    });
    const isWaitlisted = registeredTeams >= tournament.maxTeams;

    const team = await Team.create({
      tournamentId,
      captainId: req.user.id,
      teamName,
      players,
      paymentStatus: "paid",
      paymentAmount: tournament.entryFee,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      isWaitlisted,
      isApproved: true,
    });

    res.status(201).json({
      success: true,
      team,
      message: "Payment successful! Your team has been registered.",
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        message: "You have already registered a team for this tournament",
      });
    }
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/teams/my
const getMyTeams = async (req, res) => {
  try {
    const teams = await Team.find({ captainId: req.user.id })
      .populate(
        "tournamentId",
        "name sport format venue startDate endDate status entryFee prizeStructure maxTeams sportConfig"
      )
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, teams });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/teams/tournament/:tournamentId
const getTeamsByTournament = async (req, res) => {
  try {
    const teams = await Team.find({ tournamentId: req.params.tournamentId })
      .populate("captainId", "name email phone")
      .sort({ createdAt: 1 });
    res.status(200).json({ success: true, teams });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/teams/:id
const getTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate("captainId", "name email phone")
      .populate("tournamentId", "name sport venue startDate endDate status entryFee");
    if (!team) return res.status(404).json({ message: "Team not found" });
    res.status(200).json({ success: true, team });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @PUT /api/teams/:id/approve
const approveTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate("tournamentId");
    if (!team) return res.status(404).json({ message: "Team not found" });
    if (team.tournamentId.organiserId.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });
    team.isApproved = true;
    await team.save();
    res.status(200).json({ success: true, team });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @PUT /api/teams/:id/mark-paid
const markTeamPaid = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate("tournamentId");
    if (!team) return res.status(404).json({ message: "Team not found" });
    if (team.tournamentId.organiserId.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });
    team.paymentStatus = "cash";
    team.isApproved = true;
    await team.save();
    res.status(200).json({ success: true, team });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @DELETE /api/teams/:id
const withdrawTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: "Team not found" });
    if (team.captainId.toString() !== req.user.id)
      return res.status(403).json({ message: "Not authorized" });
    await team.deleteOne();
    res.status(200).json({ success: true, message: "Team withdrawn successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder: createOrderHandler,
  verifyPayment,
  getMyTeams,
  getTeamsByTournament,
  getTeam,
  approveTeam,
  markTeamPaid,
  withdrawTeam,
};