import { create } from 'zustand';

interface AudioStore {
  activeTrackId: string | null;
  setActiveTrack: (id: string | null) => void;
}

export const useAudioStore = create<AudioStore>((set) => ({
  activeTrackId: null,
  setActiveTrack: (id) => set({ activeTrackId: id }),
}));
