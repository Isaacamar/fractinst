import { create } from 'zustand';
import { Track } from '../types/track';
import { MidiClip } from '../engines/MidiRecorder';
import { PercussionClip } from '../types/percussion';

interface TrackStore {
  tracks: Track[];
  activeTrackId: string | null;

  // Actions
  addTrack: (track: Track) => void;
  removeTrack: (id: string) => void;
  setActiveTrack: (id: string | null) => void;
  updateTrack: (id: string, updates: Partial<Track>) => void;
  addClipToTrack: (trackId: string, clip: MidiClip) => void;
  addPercussionClipToTrack: (trackId: string, clip: PercussionClip) => void;
  removeClipFromTrack: (trackId: string, clipId: string) => void;
  updateClipInTrack: (trackId: string, clipId: string, updates: Partial<MidiClip | PercussionClip>) => void;
  setTrackVolume: (id: string, volume: number) => void;
  setTrackMute: (id: string, muted: boolean) => void;
  setTrackSolo: (id: string, soloed: boolean) => void;
  setTracks: (tracks: Track[]) => void;
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
    tracks: state.tracks.map(t => {
      if (t.id !== id) return t;
      // Use type assertion since we're updating properties, not changing track type
      return { ...t, ...updates } as Track;
    })
  })),

  addClipToTrack: (trackId, clip) => set((state) => ({
    tracks: state.tracks.map(t => {
      if (t.id !== trackId || t.type !== 'midi') return t;
      // Deep clone the clip to ensure it's not shared between tracks
      const clonedClip = {
        ...clip,
        events: clip.events.map(ev => ({ ...ev }))
      };
      return { ...t, clips: [...t.clips, clonedClip] };
    })
  })),

  addPercussionClipToTrack: (trackId, clip) => set((state) => ({
    tracks: state.tracks.map(t => {
      if (t.id !== trackId || t.type !== 'percussion') return t;
      // Deep clone the clip
      const clonedClip = {
        ...clip,
        patterns: { ...clip.patterns },
        selectedSounds: clip.selectedSounds ? [...clip.selectedSounds] : undefined
      };
      return { ...t, clips: [...t.clips, clonedClip] };
    })
  })),

  removeClipFromTrack: (trackId, clipId) => set((state) => ({
    tracks: state.tracks.map(t => {
      if (t.id !== trackId) return t;
      if (t.type === 'midi') {
        return { ...t, clips: t.clips.filter(c => c.id !== clipId) };
      } else {
        return { ...t, clips: t.clips.filter(c => c.id !== clipId) };
      }
    })
  })),

  updateClipInTrack: (trackId, clipId, updates) => set((state) => ({
    tracks: state.tracks.map(t => {
      if (t.id !== trackId) return t;
      if (t.type === 'midi') {
        return {
          ...t,
          clips: t.clips.map(c => c.id === clipId ? { ...c, ...updates as Partial<MidiClip> } : c)
        };
      } else {
        return {
          ...t,
          clips: t.clips.map(c => c.id === clipId ? { ...c, ...updates as Partial<PercussionClip> } : c)
        };
      }
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

  setTracks: (tracks) => set({ tracks, activeTrackId: tracks.length > 0 ? tracks[0].id : null }),
}));

