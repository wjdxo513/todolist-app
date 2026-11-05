// 세션 만료 안내 플래그(WA-21, LP-09)
import { create } from 'zustand';

interface SessionState {
  isExpired: boolean;
  setExpired: (isExpired: boolean) => void;
}

export const useSessionStore = create<SessionState>()((set) => ({
  isExpired: false,
  setExpired: (isExpired) => set({ isExpired }),
}));
