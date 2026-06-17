import api from './api';

const teamService = {
  async registerTeam(data) {
    const response = await api.post('/teams/register', data);
    return response.data;
  },

  async getMyTeams() {
    const response = await api.get('/teams/my');
    return response.data;
  },

  async getTeamsByTournament(tournamentId) {
    const response = await api.get(`/teams/tournament/${tournamentId}`);
    return response.data;
  },

  async getTeam(id) {
    const response = await api.get(`/teams/${id}`);
    return response.data;
  },

  async approveTeam(id) {
    const response = await api.put(`/teams/${id}/approve`);
    return response.data;
  },

  async markTeamPaid(id) {
    const response = await api.put(`/teams/${id}/mark-paid`);
    return response.data;
  },

  async withdrawTeam(id) {
    const response = await api.delete(`/teams/${id}`);
    return response.data;
  },
};

export default teamService;