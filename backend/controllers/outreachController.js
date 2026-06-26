const OutreachContact = require("../models/OutreachContact");
const Tournament = require("../models/Tournament");
const Sponsorship = require("../models/Sponsorship");
const User = require("../models/User");
const { sendPitchEmail } = require("../services/emailService");

const tierAmounts = {
  platinum: 50000,
  gold: 25000,
  silver: 15000,
  bronze: 7000,
};

const tierPerks = {
  platinum: ["Logo on all match banners", "Hero placement on public page", "Logo in every match result share", "Social media mention commitment", "Post-tournament Impact Report PDF", "Sponsor Certificate with logo proof", "Exclusive naming rights to one match"],
  gold:     ["Logo on all match banners", "Hero placement on public page", "Logo in every match result share", "Social media mention commitment", "Post-tournament Impact Report PDF", "Sponsor Certificate with logo proof"],
  silver:   ["Logo on public tournament page", "Mentioned in closing ceremony", "Logo in select match shares", "Post-tournament Impact Report PDF", "Sponsor Certificate with logo proof"],
  bronze:   ["Name mention in final ceremony", "Listed on public tournament page", "Post-tournament Impact Report PDF", "Sponsor Certificate"],
};

// @GET /api/outreach/contacts
const getContacts = async (req, res) => {
  try {
    const contacts = await OutreachContact.find({ organiserId: req.user.id })
      .populate("pitches.tournamentId", "name sport tournamentCode")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, contacts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @POST /api/outreach/contacts
const addContact = async (req, res) => {
  try {
    const { businessName, contactEmail, contactName, businessType, city } = req.body;
    if (!businessName?.trim() || !contactEmail?.trim()) {
      return res.status(400).json({ message: "Business name and email are required" });
    }

    const contact = await OutreachContact.create({
      organiserId: req.user.id,
      businessName,
      contactEmail,
      contactName,
      businessType,
      city,
    });

    res.status(201).json({ success: true, contact });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @POST /api/outreach/contacts/:id/pitch
const sendPitch = async (req, res) => {
  try {
    const { tournamentId, tier } = req.body;

    const contact = await OutreachContact.findOne({
      _id: req.params.id,
      organiserId: req.user.id,
    });
    if (!contact) return res.status(404).json({ message: "Contact not found" });

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return res.status(404).json({ message: "Tournament not found" });

    const organiser = await User.findById(req.user.id).select("name");
    const publicUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/t/${tournament.tournamentCode}`;

    // send pitch email
    await sendPitchEmail({
      to: contact.contactEmail,
      businessName: contact.businessName,
      organiserName: organiser.name,
      tournament,
      tier,
      tierAmount: tierAmounts[tier],
      tierPerks: tierPerks[tier],
      publicUrl,
    });

    // update or add pitch record
    const existingPitch = contact.pitches.find(
      (p) => p.tournamentId?.toString() === tournamentId
    );

    if (existingPitch) {
      existingPitch.tier = tier;
      existingPitch.status = "contacted";
      existingPitch.sentAt = new Date();
    } else {
      contact.pitches.push({
        tournamentId,
        tier,
        status: "contacted",
        sentAt: new Date(),
      });
    }

    await contact.save();

    res.status(200).json({
      success: true,
      message: `Pitch email sent to ${contact.contactEmail}`,
      contact,
    });
  } catch (error) {
    console.error("Send pitch error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @PUT /api/outreach/contacts/:id/pitch-status
const updatePitchStatus = async (req, res) => {
  try {
    const { tournamentId, status, notes } = req.body;

    const contact = await OutreachContact.findOne({
      _id: req.params.id,
      organiserId: req.user.id,
    });
    if (!contact) return res.status(404).json({ message: "Contact not found" });

    const pitch = contact.pitches.find(
      (p) => p.tournamentId?.toString() === tournamentId
    );
    if (!pitch) return res.status(404).json({ message: "Pitch not found" });

    pitch.status = status;
    if (notes) pitch.notes = notes;
    await contact.save();

    res.status(200).json({ success: true, contact });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @DELETE /api/outreach/contacts/:id
const deleteContact = async (req, res) => {
  try {
    await OutreachContact.findOneAndDelete({
      _id: req.params.id,
      organiserId: req.user.id,
    });
    res.status(200).json({ success: true, message: "Contact deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/outreach/platform-sponsors
// existing Sportfolio sponsors who haven't sponsored organiser's tournaments
const getPlatformSponsors = async (req, res) => {
  try {
    // get all organiser's tournaments
    const tournaments = await Tournament.find({ organiserId: req.user.id });
    const tournamentIds = tournaments.map((t) => t._id);

    // get all sponsor userIds who already paid for these tournaments
    const existingSponsorships = await Sponsorship.find({
      tournamentId: { $in: tournamentIds },
      paymentStatus: "paid",
    }).distinct("sponsorId");

    // get all platform sponsors who haven't sponsored these tournaments
    const platformSponsors = await User.find({
      role: "sponsor",
      isVerified: true,
      _id: { $nin: existingSponsorships },
    }).select("name email phone");

    res.status(200).json({ success: true, sponsors: platformSponsors });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @POST /api/outreach/invite-platform-sponsor
// send pitch to existing Sportfolio sponsor
const invitePlatformSponsor = async (req, res) => {
  try {
    const { sponsorId, tournamentId, tier } = req.body;

    const sponsor = await User.findById(sponsorId).select("name email");
    if (!sponsor) return res.status(404).json({ message: "Sponsor not found" });

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return res.status(404).json({ message: "Tournament not found" });

    const organiser = await User.findById(req.user.id).select("name");
    const publicUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/t/${tournament.tournamentCode}`;

    await sendPitchEmail({
      to: sponsor.email,
      businessName: sponsor.name,
      organiserName: organiser.name,
      tournament,
      tier,
      tierAmount: tierAmounts[tier],
      tierPerks: tierPerks[tier],
      publicUrl,
    });

    res.status(200).json({
      success: true,
      message: `Invitation sent to ${sponsor.email}`,
    });
  } catch (error) {
    console.error("Invite platform sponsor error:", error);
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/outreach/my-sponsorships-summary
// all sponsorships across all organiser tournaments
const getMySponsorshipsSummary = async (req, res) => {
  try {
    const tournaments = await Tournament.find({ organiserId: req.user.id });
    const tournamentIds = tournaments.map((t) => t._id);

    const sponsorships = await Sponsorship.find({
      tournamentId: { $in: tournamentIds },
      paymentStatus: "paid",
    })
      .populate("sponsorId", "name email phone")
      .populate("tournamentId", "name sport venue status tournamentCode")
      .sort({ createdAt: -1 });

    const totalRevenue = sponsorships.reduce((sum, s) => sum + s.amount, 0);

    res.status(200).json({ success: true, sponsorships, totalRevenue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getContacts,
  addContact,
  sendPitch,
  updatePitchStatus,
  deleteContact,
  getPlatformSponsors,
  invitePlatformSponsor,
  getMySponsorshipsSummary,
};