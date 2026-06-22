import api from './api';

const scoringService = {
  async startMatch(matchId) {
    const response = await api.post(`/scoring/${matchId}/start`);
    return response.data;
  },

  async addEvent(matchId, data) {
    const response = await api.post(`/scoring/${matchId}/event`, data);
    return response.data;
  },

  async getScorecard(matchId) {
    const response = await api.get(`/scoring/${matchId}/scorecard`);
    return response.data;
  },

  async getEvents(matchId) {
    const response = await api.get(`/scoring/${matchId}/events`);
    return response.data;
  },

  async assignScorer(matchId, scorerId) {
    const response = await api.put(`/scoring/${matchId}/assign-scorer`, { scorerId });
    return response.data;
  },

  async getScorersByTournament(tournamentId) {
    const response = await api.get(`/scoring/scorers/${tournamentId}`);
    return response.data;
  },

  async getMyAssignedMatches() {
    const response = await api.get('/scoring/my-matches');
    return response.data;
  },
};

export default scoringService;