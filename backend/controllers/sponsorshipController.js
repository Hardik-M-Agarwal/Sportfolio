const Sponsorship = require("../models/Sponsorship");
const Tournament = require("../models/Tournament");
const Team = require("../models/Team");
const { createOrder, verifySignature } = require("../services/paymentService");

const tierAmounts = {
  platinum: 50000,
  gold: 25000,
  silver: 15000,
  bronze: 7000,
};

// @POST /api/sponsorships/create-order
const createSponsorshipOrder = async (req, res) => {
  try {
    const { tournamentId, tier, businessName } = req.body;

    if (!tournamentId || !tier || !businessName?.trim()) {
      return res.status(400).json({ message: "Tournament, tier and business name are required" });
    }

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    // check tier is offered by this tournament
    if (!tournament.sponsorshipTiers.includes(tier)) {
      return res.status(400).json({ message: `This tournament does not offer ${tier} tier` });
    }

    // check if sponsor already sponsored this tournament at this tier
    const existing = await Sponsorship.findOne({
      tournamentId,
      sponsorId: req.user.id,
      tier,
    });
    if (existing) {
      return res.status(400).json({ message: `You have already sponsored this tournament at ${tier} tier` });
    }

    const amount = tierAmounts[tier];

    const order = await createOrder(
      amount,
      `sponsor_${Date.now()}`,
      {
        tournamentId: tournamentId.toString(),
        tier,
        businessName,
        sponsorId: req.user.id.toString(),
      }
    );

    res.status(200).json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      tier,
      amount,
      tournament: {
        name: tournament.name,
      },
    });
  } catch (error) {
    console.error("Create sponsorship order error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @POST /api/sponsorships/verify-payment
const verifySponsorshipPayment = async (req, res) => {
  try {
    const {
      tournamentId,
      tier,
      businessName,
      logoUrl,
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
      return res.status(400).json({ message: "Payment verification failed. Invalid signature." });
    }

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    const amount = tierAmounts[tier];

    const sponsorship = await Sponsorship.create({
      tournamentId,
      sponsorId: req.user.id,
      businessName,
      tier,
      amount,
      logoUrl: logoUrl || "",
      paymentStatus: "paid",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      prizeContribution: 0, // organiser sets this later
    });

    res.status(201).json({
      success: true,
      sponsorship,
      message: "Sponsorship payment successful!",
    });
  } catch (error) {
    console.error("Verify sponsorship payment error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "You have already sponsored this tournament at this tier" });
    }
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/sponsorships/tournament/:tournamentId
// get all sponsorships for a tournament
const getSponsorshipsByTournament = async (req, res) => {
  try {
    const sponsorships = await Sponsorship.find({
      tournamentId: req.params.tournamentId,
      paymentStatus: "paid",
    })
      .populate("sponsorId", "name email phone")
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, sponsorships });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/sponsorships/my
// get all sponsorships by logged in sponsor
const getMySponsorships = async (req, res) => {
  try {
    const sponsorships = await Sponsorship.find({ sponsorId: req.user.id })
      .populate("tournamentId", "name sport venue startDate endDate status organiserId")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, sponsorships });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @PUT /api/sponsorships/:id/prize-contribution
// organiser sets prize contribution for a sponsorship
const setPrizeContribution = async (req, res) => {
  try {
    const { prizeContribution } = req.body;
    const sponsorship = await Sponsorship.findById(req.params.id)
      .populate("tournamentId");

    if (!sponsorship) {
      return res.status(404).json({ message: "Sponsorship not found" });
    }

    // only organiser of that tournament can set this
    if (sponsorship.tournamentId.organiserId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (prizeContribution > sponsorship.amount) {
      return res.status(400).json({
        message: "Prize contribution cannot exceed sponsorship amount",
      });
    }

    sponsorship.prizeContribution = prizeContribution;
    await sponsorship.save();

    res.status(200).json({ success: true, sponsorship });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @PUT /api/sponsorships/:id/impact-report
// organiser updates impact report after tournament
const updateImpactReport = async (req, res) => {
  try {
    const { teamsReached, playersReached, matchesPlayed, estimatedAudience } = req.body;
    const sponsorship = await Sponsorship.findById(req.params.id)
      .populate("tournamentId");

    if (!sponsorship) {
      return res.status(404).json({ message: "Sponsorship not found" });
    }

    if (sponsorship.tournamentId.organiserId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    sponsorship.impactReport = { teamsReached, playersReached, matchesPlayed, estimatedAudience };
    await sponsorship.save();

    res.status(200).json({ success: true, sponsorship });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSponsorshipOrder,
  verifySponsorshipPayment,
  getSponsorshipsByTournament,
  getMySponsorships,
  setPrizeContribution,
  updateImpactReport,
};