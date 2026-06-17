import api from './api';

const tournamentService = {
  async create(data) {
    const response = await api.post('/tournaments', data);
    return response.data;
  },

  async getMyTournaments() {
    const response = await api.get('/tournaments/my');
    return response.data;
  },

  async getTournament(id) {
    const response = await api.get(`/tournaments/${id}`);
    return response.data;
  },

  async getTournamentByCode(code) {
    const response = await api.get(`/tournaments/code/${code}`);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/tournaments/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/tournaments/${id}`);
    return response.data;
  },

  async getPublicTournaments(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  const response = await api.get(`/tournaments/public?${params}`);
  return response.data;
},
};

export default tournamentService;