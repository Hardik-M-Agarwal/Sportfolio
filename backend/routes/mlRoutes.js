const express = require('express');
const { predictEntryFee } = require('../controllers/mlController');
const { protect, authorise } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// entry fee prediction — only organiser needs this (during tournament creation)
router.post('/entry-fee', authorise('organiser'), predictEntryFee);

module.exports = router;