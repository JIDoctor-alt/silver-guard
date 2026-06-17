import { create } from 'zustand';
import type { User } from '../api';

interface AuthState {
  token: string | null;
  user: User | null;
  isLogin: boolean;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: null,
  isLogin: !!localStorage.getItem('token'),
  setToken: (token) => {
    localStorage.setItem('token', token);
    set({ token, isLogin: true });
  },
  setUser: (user) => set({ user }),
  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null, isLogin: false });
  },
}));