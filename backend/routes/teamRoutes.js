const express = require("express");
const {
  createOrder,
  verifyPayment,
  getMyTeams,
  getTeamsByTournament,
  getTeam,
  approveTeam,
  markTeamPaid,
  withdrawTeam,
} = require("../controllers/teamController");
const { protect, authorise } = require("../middleware/auth");

const router = express.Router();

// ── public ──────────────────────────────────────────────────────────
router.get("/tournament/:tournamentId", getTeamsByTournament);

// ── protected ────────────────────────────────────────────────────────
router.use(protect);

router.post("/create-order", authorise("captain"), createOrder);
router.post("/verify-payment", authorise("captain"), verifyPayment);
router.get("/my", authorise("captain"), getMyTeams);
router.put("/:id/approve", authorise("organiser"), approveTeam);
router.put("/:id/mark-paid", authorise("organiser"), markTeamPaid);
router.delete("/:id", authorise("captain"), withdrawTeam);

// ── must be last — catches any /:id ──────────────────────────────────
router.get("/:id", getTeam);

module.exports = router;