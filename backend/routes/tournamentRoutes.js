const express = require("express");
const {
  createTournament,
  getMyTournaments,
  getTournament,
  getTournamentByCode,
  getPublicTournaments,
  updateTournament,
  deleteTournament,
} = require("../controllers/tournamentController");
const { protect, authorise } = require("../middleware/auth");

const router = express.Router();

// public routes — no auth
router.get("/public", getPublicTournaments);
router.get("/code/:code", getTournamentByCode);

// protected routes
router.use(protect);

router.post("/", authorise("organiser"), createTournament);
router.get("/my", authorise("organiser"), getMyTournaments);
router.get("/:id", getTournament);
router.put("/:id", authorise("organiser"), updateTournament);
router.delete("/:id", authorise("organiser"), deleteTournament);

module.exports = router;