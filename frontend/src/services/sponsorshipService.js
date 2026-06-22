import api from './api';

const sponsorshipService = {
  async createOrder(data) {
    const response = await api.post('/sponsorships/create-order', data);
    return response.data;
  },

  async verifyPayment(data) {
    const response = await api.post('/sponsorships/verify-payment', data);
    return response.data;
  },

  async getMySponsorships() {
    const response = await api.get('/sponsorships/my');
    return response.data;
  },

  async getSponsorshipsByTournament(tournamentId) {
    const response = await api.get(`/sponsorships/tournament/${tournamentId}`);
    return response.data;
  },

  async setPrizeContribution(id, prizeContribution) {
    const response = await api.put(`/sponsorships/${id}/prize-contribution`, { prizeContribution });
    return response.data;
  },

  async updateImpactReport(id, data) {
    const response = await api.put(`/sponsorships/${id}/impact-report`, data);
    return response.data;
  },
};

export default sponsorshipService;