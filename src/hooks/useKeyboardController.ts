/**
 * React hook for keyboard controller
 */

import { useEffect, useRef, useCallback } from 'react';
import { AudioEngine } from '../engines/AudioEngine';
import type { DAWCore } from '../engines/DAWCore';
import { useKeyboardStore } from '../stores/keyboardStore';

import { DrumMachine, DrumSound } from '../engines/DrumMachine';

interface KeyMapping {
  offset: number;
  note: string;
}

export const useKeyboardController = (
  synthEngine: AudioEngine | null,
  dawCore: DAWCore | null,
  octaveOffset: number,
  onOctaveChange?: (octave: number) => void,
  drumMachine: DrumMachine | null = null,
  isPercussionMode: boolean = false
) => {
  const pressedKeysRef = useRef<Set<string>>(new Set());
  const activeChordsRef = useRef<Set<string>>(new Set());
  const { chordMap } = useKeyboardStore();

  const getQWERTYLayout = useCallback((): Record<string, KeyMapping> => {
    return {
      'KeyA': { offset: 0, note: 'C' },
      'KeyS': { offset: 2, note: 'D' },
      'KeyD': { offset: 4, note: 'E' },
      'KeyF': { offset: 5, note: 'F' },
      'KeyG': { offset: 7, note: 'G' },
      'KeyH': { offset: 9, note: 'A' },
      'KeyJ': { offset: 11, note: 'B' },
      'KeyK': { offset: 12, note: 'C' },
      'KeyW': { offset: 1, note: 'C#' },
      'KeyE': { offset: 3, note: 'D#' },
      'KeyT': { offset: 6, note: 'F#' },
      'KeyY': { offset: 8, note: 'G#' },
      'KeyU': { offset: 10, note: 'A#' }
    };
  }, []);

  const getDrumMapping = useCallback((): Record<string, DrumSound> => {
    return {
      'KeyA': 'kick',
      'KeyS': 'snare',
      'KeyD': 'hihat-closed',
      'KeyF': 'hihat-open',
      'KeyG': 'clap',
      'KeyH': 'tom-low',
      'KeyJ': 'tom-high',
      'KeyK': 'ride',
      'KeyL': 'crash',
      'KeyZ': 'kick', // Alternative kick
      'KeyX': 'rim'
    };
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!synthEngine) return;

    const keyCode = event.code;

    // Transport controls - dispatch custom events that App.tsx can listen to
    if (keyCode === 'KeyR') {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent('transport-record'));
      return;
    }
    if (keyCode === 'Space') {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent('transport-pause-stop'));
      return;
    }

    // Octave controls
    if (keyCode === 'Equal') {
      event.preventDefault();
      if (onOctaveChange) {
        onOctaveChange(Math.min(8, octaveOffset + 1));
      }
      return;
    }
    if (keyCode === 'Minus') {
      event.preventDefault();
      if (onOctaveChange) {
        onOctaveChange(Math.max(0, octaveOffset - 1));
      }
      return;
    }

    // PERCUSSION MODE
    if (isPercussionMode) {
      console.log('Percussion mode active, key:', keyCode);
      if (drumMachine) {
        const drumMap = getDrumMapping();
        if (drumMap[keyCode]) {
          event.preventDefault();
          console.log('Triggering drum:', drumMap[keyCode]);
          drumMachine.trigger(drumMap[keyCode]);
          return;
        }
      } else {
        console.warn('DrumMachine instance is null');
      }
    }

    // Chord keys
    if (chordMap[keyCode]) {
      if (activeChordsRef.current.has(keyCode)) return;
      event.preventDefault();

      const chord = chordMap[keyCode];
      const rootMidi = octaveOffset * 12;

      chord.intervals.forEach((interval, index) => {
        const midiNote = rootMidi + interval;
        const frequency = AudioEngine.midiToFrequency(midiNote);
        const noteKey = `${keyCode}_${index}`;

        synthEngine.playNote(frequency, noteKey);

        if (dawCore) {
          dawCore.recordMidiNote({
            frequency,
            noteKey,
            midiNote,
            velocity: 100
          });
        }
      });

      activeChordsRef.current.add(keyCode);
      return;
    }

    // Regular keys
    const keyMap = getQWERTYLayout();
    if (pressedKeysRef.current.has(keyCode) || !keyMap[keyCode]) {
      return;
    }

    event.preventDefault();
    pressedKeysRef.current.add(keyCode);

    const mapping = keyMap[keyCode];
    const midiNote = (octaveOffset * 12) + mapping.offset;
    const frequency = AudioEngine.midiToFrequency(midiNote);

    synthEngine.playNote(frequency, keyCode);

    if (dawCore) {
      dawCore.recordMidiNote({
        frequency,
        noteKey: keyCode,
        midiNote,
        velocity: 100
      });
    }
  }, [synthEngine, dawCore, octaveOffset, onOctaveChange, getQWERTYLayout, chordMap, isPercussionMode, drumMachine, getDrumMapping]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (!synthEngine) return;

    const keyCode = event.code;

    // Chord keys
    if (chordMap[keyCode]) {
      if (!activeChordsRef.current.has(keyCode)) return;
      event.preventDefault();

      const chord = chordMap[keyCode];
      chord.intervals.forEach((_interval, index) => {
        const noteKey = `${keyCode}_${index}`;
        synthEngine.releaseNote(noteKey);

        if (dawCore) {
          dawCore.recordMidiNoteRelease(noteKey);
        }
      });

      activeChordsRef.current.delete(keyCode);
      return;
    }

    if (!pressedKeysRef.current.has(keyCode)) {
      return;
    }

    event.preventDefault();
    pressedKeysRef.current.delete(keyCode);

    synthEngine.releaseNote(keyCode);

    if (dawCore) {
      dawCore.recordMidiNoteRelease(keyCode);
    }
  }, [synthEngine, dawCore, chordMap]);

  useEffect(() => {
    if (!synthEngine) return;

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);

      // Release all notes on unmount
      pressedKeysRef.current.forEach(keyCode => {
        synthEngine.releaseNote(keyCode);
      });
      activeChordsRef.current.forEach(keyCode => {
        const chord = chordMap[keyCode];
        if (chord) {
          chord.intervals.forEach((_interval, index) => {
            synthEngine.releaseNote(`${keyCode}_${index}`);
          });
        }
      });
      pressedKeysRef.current.clear();
      activeChordsRef.current.clear();
    };
  }, [handleKeyDown, handleKeyUp, synthEngine]);
};

