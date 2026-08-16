import { create } from 'zustand';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/v1/auth';

const getInitialUser = () => {
  try {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  } catch (e) {
    localStorage.removeItem('user');
    return null;
  }
};

export const useAuthStore = create((set, get) => ({
  user: getInitialUser(),
  accessToken: localStorage.getItem('accessToken') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/login`, { email, password });
      const { user, accessToken, refreshToken } = response.data.data;

      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      set({ user, accessToken, refreshToken, loading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      set({ error: msg, loading: false });
      return { success: false, error: msg };
    }
  },

  register: async (name, email, password, role, companyId) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post(`${API_URL}/register`, {
        name,
        email,
        password,
        role,
        companyId
      });
      const { user, accessToken, refreshToken } = response.data.data;

      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      set({ user, accessToken, refreshToken, loading: false });
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      set({ error: msg, loading: false });
      return { success: false, error: msg };
    }
  },

  logout: async () => {
    const { refreshToken } = get();
    try {
      await axios.post(`${API_URL}/logout`, { token: refreshToken });
    } catch (err) {
      console.error('Logout request failed', err);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ user: null, accessToken: null, refreshToken: null, error: null });
    }
  },

  checkAuth: async () => {
    const { refreshToken, accessToken } = get();
    if (!refreshToken) return;

    try {
      // Refresh accessToken
      const response = await axios.post(`${API_URL}/refresh`, { token: refreshToken });
      const newAccessToken = response.data.data.accessToken;
      localStorage.setItem('accessToken', newAccessToken);
      set({ accessToken: newAccessToken });
    } catch (err) {
      // Session expired, clear state
      get().logout();
    }
  }
}));
