import api from './api';

const mlService = {
  async predictEntryFee(data) {
    const response = await api.post('/ml/entry-fee', data);
    return response.data;
  },

  async predictRegistration(data) {
    const response = await api.post('/ml/registration', data);
    return response.data;
  },

  async predictSponsorROI(data) {
    const response = await api.post('/ml/sponsor-roi', data);
    return response.data;
  },
};

export default mlService;