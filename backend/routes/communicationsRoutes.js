const express = require("express");
const { broadcast, getTeamsForBroadcast } = require("../controllers/communicationsController");
const { protect, authorise } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.post("/broadcast", authorise("organiser"), broadcast);
router.get("/teams/:tournamentId", authorise("organiser"), getTeamsForBroadcast);

module.exports = router;