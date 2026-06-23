import axios from 'axios';

const publicRoutes = [
  '/auth/me',
  '/tournaments/public',
  '/tournaments/code/',
  '/teams/tournament/',
  '/matches/tournament/',
  '/matches/team/',
  '/matches/',
  '/sponsorships/tournament/',
  '/scoring/',
];

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config.url || '';
    const isPublicRoute = publicRoutes.some((route) => url.includes(route));

    if (error.response?.status === 401 && !isPublicRoute) {
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;