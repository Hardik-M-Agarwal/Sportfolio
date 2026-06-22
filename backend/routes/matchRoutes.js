const express = require("express");
const {
  generateSchedule,
  getMatchesByTournament,
  getMatch,
  scheduleMatch,
  enterResult,
  getMatchesByTeam,
} = require("../controllers/matchController");
const { protect, authorise } = require("../middleware/auth");

const router = express.Router();

// public — anyone can view matches
router.get("/tournament/:tournamentId", getMatchesByTournament);
router.get("/team/:teamId", getMatchesByTeam);
router.get("/:id", getMatch);

// protected
router.use(protect);
router.post("/generate/:tournamentId", authorise("organiser"), generateSchedule);
router.put("/:id/schedule", authorise("organiser"), scheduleMatch);
router.put("/:id/result", authorise("organiser"), enterResult);

module.exports = router;