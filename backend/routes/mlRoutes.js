const express = require('express');
const { predictEntryFee, predictRegistration, predictSponsorROI } = require('../controllers/mlController');
const { protect, authorise } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/entry-fee',    authorise('organiser'), predictEntryFee);
router.post('/registration', authorise('organiser'), predictRegistration);
router.post('/sponsor-roi',  authorise('organiser', 'sponsor'), predictSponsorROI);  // ← both roles

module.exports = router;