const express = require('express');
const { generateFinancialSummary, generateTeamPerformance, generateSponsorImpact } = require('../controllers/reportController');
const { protect, authorise } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// organiser only
router.get('/tournament/:tournamentId/financial',
  authorise('organiser'),
  generateFinancialSummary
);

// organiser + captain
router.get('/tournament/:tournamentId/teams',
  authorise('organiser', 'captain'),
  generateTeamPerformance
);

// organiser + sponsor
router.get('/tournament/:tournamentId/sponsor/:sponsorshipId',
  authorise('organiser', 'sponsor'),
  generateSponsorImpact
);

module.exports = router;