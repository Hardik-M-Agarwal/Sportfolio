const express = require("express");
const {
  startMatch,
  addEvent,
  getScorecard,
  getEvents,
  assignScorer,
  getScorersByTournament,
  getMyAssignedMatches,
} = require("../controllers/scoringController");
const { protect, authorise } = require("../middleware/auth");

const router = express.Router();

// public routes
router.get("/:matchId/scorecard", getScorecard);
router.get("/:matchId/events", getEvents);

// protected routes
router.use(protect);
router.post("/:matchId/start", authorise("scorer", "organiser"), startMatch);
router.post("/:matchId/event", authorise("scorer", "organiser"), addEvent);
router.put("/:matchId/assign-scorer", authorise("organiser"), assignScorer);
router.get("/scorers/:tournamentId", authorise("organiser"), getScorersByTournament);
router.get("/my-matches", authorise("scorer"), getMyAssignedMatches);

module.exports = router;