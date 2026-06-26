const express = require("express");
const {
  getContacts,
  addContact,
  sendPitch,
  updatePitchStatus,
  deleteContact,
  getPlatformSponsors,
  invitePlatformSponsor,
  getMySponsorshipsSummary,
} = require("../controllers/outreachController");
const { protect, authorise } = require("../middleware/auth");

const router = express.Router();

router.use(protect);
router.use(authorise("organiser"));

router.get("/contacts", getContacts);
router.post("/contacts", addContact);
router.post("/contacts/:id/pitch", sendPitch);
router.put("/contacts/:id/pitch-status", updatePitchStatus);
router.delete("/contacts/:id", deleteContact);
router.get("/platform-sponsors", getPlatformSponsors);
router.post("/invite-platform-sponsor", invitePlatformSponsor);
router.get("/my-sponsorships-summary", getMySponsorshipsSummary);

module.exports = router;