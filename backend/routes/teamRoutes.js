const express = require("express");
const {
  registerTeam,
  getMyTeams,
  getTeamsByTournament,
  getTeam,
  approveTeam,
  markTeamPaid,
  withdrawTeam,
} = require("../controllers/teamController");
const { protect, authorise } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.post("/register", authorise("captain"), registerTeam);
router.get("/my", authorise("captain"), getMyTeams);
router.get("/tournament/:tournamentId", getTeamsByTournament);
router.get("/:id", getTeam);
router.put("/:id/approve", authorise("organiser"), approveTeam);
router.put("/:id/mark-paid", authorise("organiser"), markTeamPaid);
router.delete("/:id", authorise("captain"), withdrawTeam);

module.exports = router;