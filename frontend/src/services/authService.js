import api from './api';

const authService = {
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  async verifyOTP(userId, otp) {
    const response = await api.post('/auth/verify-otp', { userId, otp });
    return response.data;
  },

  async resendOTP(userId) {
    const response = await api.post('/auth/resend-otp', { userId });
    return response.data;
  },

  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  async logout() {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export default authService;