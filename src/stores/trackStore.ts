import { create } from 'zustand';
import { Track } from '../types/track';
import { MidiClip } from '../engines/MidiRecorder';

interface TrackStore {
  tracks: Track[];
  activeTrackId: string | null;
  
  // Actions
  addTrack: (track: Track) => void;
  removeTrack: (id: string) => void;
  setActiveTrack: (id: string | null) => void;
  updateTrack: (id: string, updates: Partial<Track>) => void;
  addClipToTrack: (trackId: string, clip: MidiClip) => void;
  setTrackVolume: (id: string, volume: number) => void;
  setTrackMute: (id: string, muted: boolean) => void;
  setTrackSolo: (id: string, soloed: boolean) => void;
}

export const useTrackStore = create<TrackStore>((set) => ({
  tracks: [],
  activeTrackId: null,

  addTrack: (track) => set((state) => ({ 
    tracks: [...state.tracks, track],
    activeTrackId: state.activeTrackId || track.id // Auto-select first track
  })),

  removeTrack: (id) => set((state) => ({
    tracks: state.tracks.filter(t => t.id !== id),
    activeTrackId: state.activeTrackId === id ? (state.tracks.find(t => t.id !== id)?.id || null) : state.activeTrackId
  })),

  setActiveTrack: (id) => set({ activeTrackId: id }),

  updateTrack: (id, updates) => set((state) => ({
    tracks: state.tracks.map(t => t.id === id ? { ...t, ...updates } : t)
  })),

  addClipToTrack: (trackId, clip) => set((state) => ({
    tracks: state.tracks.map(t => {
      if (t.id !== trackId) return t;
      return { ...t, clips: [...t.clips, clip] };
    })
  })),

  setTrackVolume: (id, volume) => set((state) => ({
    tracks: state.tracks.map(t => t.id === id ? { ...t, volume } : t)
  })),

  setTrackMute: (id, muted) => set((state) => ({
    tracks: state.tracks.map(t => t.id === id ? { ...t, muted } : t)
  })),

  setTrackSolo: (id, soloed) => set((state) => ({
    tracks: state.tracks.map(t => t.id === id ? { ...t, soloed } : t)
  })),
}));

