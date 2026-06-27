const axios = require('axios');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:5050';

const handleMLError = (error, res) => {
  if (error.code === 'ECONNREFUSED') {
    return res.status(503).json({
      message: 'ML service is not running. Start it with: python ml/run.py'
    });
  }
  if (error.response) {
    return res.status(error.response.status).json(error.response.data);
  }
  return res.status(500).json({ message: error.message });
};

// @POST /api/ml/entry-fee
const predictEntryFee = async (req, res) => {
  try {
    const {
      sport, city_tier, venue_cost, max_teams,
      team_size, format, has_sponsor,
      prize_percentage, tournament_days,
    } = req.body;

    if (!sport || !city_tier || !venue_cost || !max_teams) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const response = await axios.post(
      `${ML_URL}/predict/entry-fee`,
      {
        sport,
        city_tier:        Number(city_tier),
        venue_cost:       Number(venue_cost),
        max_teams:        Number(max_teams),
        team_size:        Number(team_size) || 11,
        format:           format || 'knockout',
        has_sponsor:      has_sponsor ? 1 : 0,
        prize_percentage: Number(prize_percentage) || 60,
        tournament_days:  Number(tournament_days) || 1,
      },
      { timeout: 30000 }
    );

    return res.status(200).json(response.data);
  } catch (error) {
    console.error('ML entry fee error:', error.message);
    return handleMLError(error, res);
  }
};

// @POST /api/ml/registration
const predictRegistration = async (req, res) => {
  try {
    const {
      sport, city_tier, current_registrations,
      days_since_open, total_days_available,
      max_teams, entry_fee, prize_pool,
      has_sponsor, format,
    } = req.body;

    if (!sport || !city_tier || current_registrations === undefined || !max_teams) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const response = await axios.post(
      `${ML_URL}/predict/registration`,
      {
        sport,
        city_tier:             Number(city_tier),
        current_registrations: Number(current_registrations),
        days_since_open:       Number(days_since_open),
        total_days_available:  Number(total_days_available),
        max_teams:             Number(max_teams),
        entry_fee:             Number(entry_fee),
        prize_pool:            Number(prize_pool) || 0,
        has_sponsor:           has_sponsor ? 1 : 0,
        format:                format || 'knockout',
      },
      { timeout: 30000 }
    );

    return res.status(200).json(response.data);
  } catch (error) {
    console.error('ML registration error:', error.message);
    return handleMLError(error, res);
  }
};

// @POST /api/ml/sponsor-roi
const predictSponsorROI = async (req, res) => {
  try {
    const {
      sport, city_tier, num_teams, num_matches,
      venue_capacity, team_size, tournament_days,
      has_existing_sponsor, format, sponsorship_tier,
    } = req.body;

    if (!sport || !city_tier || !num_teams || !sponsorship_tier) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const response = await axios.post(
      `${ML_URL}/predict/sponsor-roi`,
      {
        sport,
        city_tier:            Number(city_tier),
        num_teams:            Number(num_teams),
        num_matches:          Number(num_matches) || 0,
        venue_capacity:       Number(venue_capacity) || 300,
        team_size:            Number(team_size) || 11,
        tournament_days:      Number(tournament_days) || 1,
        has_existing_sponsor: has_existing_sponsor ? 1 : 0,
        format:               format || 'knockout',
        sponsorship_tier,
      },
      { timeout: 30000 }
    );

    return res.status(200).json(response.data);
  } catch (error) {
    console.error('ML sponsor ROI error:', error.message);
    return handleMLError(error, res);
  }
};

module.exports = { predictEntryFee, predictRegistration, predictSponsorROI };