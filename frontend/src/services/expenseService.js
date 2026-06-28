import api from './api';

const expenseService = {
  async getByTournament(tournamentId) {
    const response = await api.get(`/expenses/tournament/${tournamentId}`);
    return response.data;
  },

  async getMyExpenses() {
    const response = await api.get('/expenses/my');
    return response.data;
  },

  async create(data) {
    const response = await api.post('/expenses', data);
    return response.data;
  },

  async update(id, data) {
    const response = await api.put(`/expenses/${id}`, data);
    return response.data;
  },

  async delete(id) {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  },
};

export default expenseService;