import api from './api';

const matchService = {
  async generateSchedule(tournamentId) {
    const response = await api.post(`/matches/generate/${tournamentId}`);
    return response.data;
  },

  async getMatchesByTournament(tournamentId) {
    const response = await api.get(`/matches/tournament/${tournamentId}`);
    return response.data;
  },

  async getMatch(id) {
    const response = await api.get(`/matches/${id}`);
    return response.data;
  },

  async scheduleMatch(id, data) {
    const response = await api.put(`/matches/${id}/schedule`, data);
    return response.data;
  },

  async enterResult(id, data) {
    const response = await api.put(`/matches/${id}/result`, data);
    return response.data;
  },

  async getMatchesByTeam(teamId) {
    const response = await api.get(`/matches/team/${teamId}`);
    return response.data;
  },
};

export default matchService;