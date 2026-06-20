import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
const API = import.meta.env.VITE_API_URL || 'https://watchparty-vul6.onrender.com';

// Axios instance with auth header auto-injection
export const api = axios.create({ baseURL: `${API}/api` });
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Auth Store ──────────────────────────────────────────────────────────────
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      error: null,

      register: async (username, email, password) => {
        set({ loading: true, error: null });
        try {
          const { data } = await api.post('/auth/register', { username, email, password });
          set({ user: data.user, token: data.token, loading: false });
          return { success: true };
        } catch (err) {
          const msg = err.response?.data?.message || 'Registration failed';
          set({ error: msg, loading: false });
          return { success: false, error: msg };
        }
      },

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          set({ user: data.user, token: data.token, loading: false });
          return { success: true };
        } catch (err) {
          const msg = err.response?.data?.message || 'Login failed';
          set({ error: msg, loading: false });
          return { success: false, error: msg };
        }
      },

      loginAsGuest: async (username) => {
        set({ loading: true, error: null });
        try {
          const { data } = await api.post('/auth/guest', { username });
          set({ user: data.user, token: data.token, loading: false });
          return { success: true };
        } catch (err) {
          const msg = err.response?.data?.message || 'Guest login failed';
          set({ error: msg, loading: false });
          return { success: false, error: msg };
        }
      },

      logout: () => set({ user: null, token: null }),
      clearError: () => set({ error: null }),
    }),
    { name: 'watchparty-auth', partialize: (s) => ({ user: s.user, token: s.token }) }
  )
);

// ── Room Store ───────────────────────────────────────────────────────────────
export const useRoomStore = create((set) => ({
  rooms: [],
  currentRoom: null,
  loading: false,
  error: null,

  fetchRooms: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/rooms');
      set({ rooms: data.rooms, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchRoom: async (id) => {
    set({ loading: true });
    try {
      const { data } = await api.get(`/rooms/${id}`);
      set({ currentRoom: data.room, loading: false });
      return data.room;
    } catch {
      set({ loading: false });
      return null;
    }
  },

  createRoom: async (title, isPublic, videoUrl) => {
    try {
      const { data } = await api.post('/rooms', { title, isPublic, videoUrl });
      return { success: true, room: data.room };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to create room' };
    }
  },

  findByInviteCode: async (code) => {
    try {
      const { data } = await api.get(`/rooms/invite/${code}`);
      return { success: true, room: data.room };
    } catch {
      return { success: false, error: 'Room not found' };
    }
  },

  setCurrentRoom: (room) => set({ currentRoom: room }),
  clearRoom: () => set({ currentRoom: null }),
}));
