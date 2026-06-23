const express = require("express");
const {
  createSponsorshipOrder,
  verifySponsorshipPayment,
  getSponsorshipsByTournament,
  getMySponsorships,
  setPrizeContribution,
  updateImpactReport,
} = require("../controllers/sponsorshipController");
const { protect, authorise } = require("../middleware/auth");

const router = express.Router();

// ── public ──────────────────────────────────────────────────────────
router.get("/tournament/:tournamentId", getSponsorshipsByTournament);

// ── protected ────────────────────────────────────────────────────────
router.use(protect);

router.post("/create-order", authorise("sponsor"), createSponsorshipOrder);
router.post("/verify-payment", authorise("sponsor"), verifySponsorshipPayment);
router.get("/my", authorise("sponsor"), getMySponsorships);
router.put("/:id/prize-contribution", authorise("organiser"), setPrizeContribution);
router.put("/:id/impact-report", authorise("organiser"), updateImpactReport);

module.exports = router;