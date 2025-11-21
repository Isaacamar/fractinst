/**
 * MidiEditor Component
 * Visual sequencer for MIDI editing
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import type { Transport } from '../../engines/Transport';
import type { AudioEngine } from '../../engines/AudioEngine';
import type { MidiClip, RecordedMidiEvent } from '../../engines/MidiRecorder';
import type { DAWCore } from '../../engines/DAWCore';
import { AudioEngine as AudioEngineClass } from '../../engines/AudioEngine';
import { useTrackStore } from '../../stores/trackStore';
import './MidiEditor.css';

interface MidiEditorProps {
  transport: Transport | null;
  synthEngine: AudioEngine | null;
  dawCore: DAWCore | null;
  clips: MidiClip[];
  trackId: string;
  trackName: string;
  color: string;
  onClose: () => void;
}

interface EditorNote {
  id: string; // composite key
  clipId: string;
  noteKey: string | number;
  midiNote: number;
  startTime: number; // relative to clip start
  absoluteStartTime: number; // absolute track time
  duration: number;
  velocity: number;
}

interface DragState {
  type: 'move' | 'resize';
  noteIds: string[];
  startX: number;
  startY: number;
  initialNotes: Map<string, { startTime: number; midiNote: number; duration: number }>;
}

import { useTransportStore } from '../../stores/transportStore'; // Import transport store

export const MidiEditor: React.FC<MidiEditorProps> = ({
  transport,
  synthEngine,
  dawCore,
  clips,
  trackId,
  trackName,
  color,
  onClose
}) => {
  const [currentTime, setCurrentTime] = useState(0);
  const { updateTrack } = useTrackStore();
  const { loopLengthBars } = useTransportStore(); // Get loop length
  const gridRef = useRef<HTMLDivElement>(null);
  const keysRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());
  const [dragState, setDragState] = useState<DragState | null>(null);

  // Configuration
  const lowestNote = 24; // C1
  const highestNote = 96; // C7
  const numBars = loopLengthBars; // Use dynamic loop length
  const beatsPerBar = 4;
  const keyHeight = 20;
  const pixelsPerBeat = 100; // Zoom level
  
  const midiToNoteName = (midiNote: number): string => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midiNote / 12) - 1;
    const note = notes[midiNote % 12];
    return `${note}${octave}`;
  };

  // Update playback line
  useEffect(() => {
    if (!transport) return;

    const updateTime = (time: number) => {
      setCurrentTime(time);
    };

    transport.onUpdate(updateTime);

    return () => {
      transport.offUpdate(updateTime);
    };
  }, [transport]);

  // Generate piano keys
  const pianoKeys = useMemo(() => {
    const keys = [];
    for (let midiNote = highestNote; midiNote >= lowestNote; midiNote--) {
      keys.push({
        midiNote,
        noteName: midiToNoteName(midiNote),
        isC: midiToNoteName(midiNote).startsWith('C'),
        isBlack: midiToNoteName(midiNote).includes('#')
      });
    }
    return keys;
  }, []);

  // Parse clips into EditorNotes
  const editorNotes = useMemo(() => {
    const notes: EditorNote[] = [];
    
    clips.forEach(clip => {
      const notePairs = new Map<string, { noteOn: any; noteOff: any | null }>();
      
      clip.events.forEach(event => {
        const key = event.noteKey.toString();
        if (event.type === 'noteOn') {
          notePairs.set(key, { noteOn: event, noteOff: null });
        } else if (event.type === 'noteOff') {
          const pair = notePairs.get(key);
          if (pair) {
            pair.noteOff = event;
          }
        }
      });
      
      notePairs.forEach((pair) => {
        if (!pair.noteOn) return;
        const duration = pair.noteOff ? pair.noteOff.time - pair.noteOn.time : 0.5;
        
        notes.push({
          id: `${clip.id}:${pair.noteOn.noteKey}`,
          clipId: clip.id,
          noteKey: pair.noteOn.noteKey,
          midiNote: pair.noteOn.note,
          startTime: pair.noteOn.time,
          absoluteStartTime: clip.startTime + pair.noteOn.time,
          duration,
          velocity: pair.noteOn.velocity
        });
      });
    });
    
    return notes;
  }, [clips]);

  // Playback line updater
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || !transport) return;

    const playbackLine = grid.querySelector('.playback-line') as HTMLElement;
    if (!playbackLine) return;

    const updatePlaybackLine = () => {
      const secondsPerBeat = 60 / transport.getBpm();
      const pixelsPerSecond = pixelsPerBeat / secondsPerBeat;
      const left = currentTime * pixelsPerSecond;
      playbackLine.style.left = `${left}px`;
    };

    const interval = requestAnimationFrame(function loop() {
      updatePlaybackLine();
      requestAnimationFrame(loop);
    });

    return () => cancelAnimationFrame(interval);
  }, [transport, currentTime, pixelsPerBeat]);

  // Interactions
  const handleNoteMouseDown = (e: React.MouseEvent, note: EditorNote) => {
    e.stopPropagation();
    e.preventDefault();
    
    const isShift = e.shiftKey;
    const isSelected = selectedNoteIds.has(note.id);
    
    let newSelected = new Set(selectedNoteIds);
    
    if (!isShift && !isSelected) {
      newSelected.clear();
      newSelected.add(note.id);
    } else if (isShift) {
      if (isSelected) newSelected.delete(note.id);
      else newSelected.add(note.id);
    } else if (!isSelected) {
      newSelected.add(note.id);
    }
    
    setSelectedNoteIds(newSelected);
    
    // Start Drag
    // If clicking edge (resize) vs body (move)
    // For now simple body drag
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const isResize = e.clientX > rect.right - 10; // 10px resize handle
    
    const initialNotes = new Map();
    editorNotes.forEach(n => {
      if (newSelected.has(n.id)) {
        initialNotes.set(n.id, { 
          startTime: n.startTime, 
          midiNote: n.midiNote,
          duration: n.duration 
        });
      }
    });

    setDragState({
      type: isResize ? 'resize' : 'move',
      noteIds: Array.from(newSelected),
      startX: e.clientX,
      startY: e.clientY,
      initialNotes
    });
  };

  const handleGridMouseDown = (e: React.MouseEvent) => {
    if (e.target === gridRef.current) {
      // Deselect if clicking background
      setSelectedNoteIds(new Set());
      
      // Also handle seeking if clicking background
      if (transport && dawCore) {
        const rect = gridRef.current!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const secondsPerBeat = 60 / transport.getBpm();
        const pixelsPerSecond = pixelsPerBeat / secondsPerBeat;
        const timeSeconds = Math.max(0, x / pixelsPerSecond);
        dawCore.seek(timeSeconds);
      }
    }
  };

  // Seek on ruler click/drag
  const handleRulerMouseDown = (e: React.MouseEvent) => {
    if (!transport || !dawCore) return;
    e.stopPropagation();
    e.preventDefault();

    const handleSeek = (clientX: number) => {
        const rect = rulerRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const x = clientX - rect.left;
        const secondsPerBeat = 60 / transport.getBpm();
        const pixelsPerSecond = pixelsPerBeat / secondsPerBeat;
        const timeSeconds = Math.max(0, x / pixelsPerSecond);
        dawCore.seek(timeSeconds);
    };

    handleSeek(e.clientX);

    const handleMouseMove = (moveEvent: MouseEvent) => {
        handleSeek(moveEvent.clientX);
    };

    const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Global mouse move/up for dragging
  useEffect(() => {
    if (!dragState || !transport) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragState.startX;
      const deltaY = e.clientY - dragState.startY;

    const secondsPerBeat = 60 / transport.getBpm();
    const pixelsPerSecond = pixelsPerBeat / secondsPerBeat;
      
      const timeDelta = deltaX / pixelsPerSecond;
      const pitchDelta = Math.round(-deltaY / keyHeight); // Invert Y because pitch goes up
      
      const newClips = [...clips];
      
      dragState.noteIds.forEach(noteId => {
        const initial = dragState.initialNotes.get(noteId);
        if (!initial) return;
        
        const [clipId, noteKeyStr] = noteId.split(':');
        const clipIndex = newClips.findIndex(c => c.id === clipId);
        if (clipIndex === -1) return;
        
        const clip = { ...newClips[clipIndex] };
        // Deep clone events to modify
        clip.events = clip.events.map(ev => ({ ...ev }));
        
        const noteKey = isNaN(Number(noteKeyStr)) ? noteKeyStr : Number(noteKeyStr);
        
        const noteOnIndex = clip.events.findIndex(ev => ev.noteKey.toString() === noteKeyStr && ev.type === 'noteOn');
        const noteOffIndex = clip.events.findIndex(ev => ev.noteKey.toString() === noteKeyStr && ev.type === 'noteOff');
        
        if (noteOnIndex !== -1 && noteOffIndex !== -1) {
          if (dragState.type === 'move') {
            // Update time and pitch
            let newTime = Math.max(0, initial.startTime + timeDelta);
            // Snap to 1/16 grid
            const gridStep = secondsPerBeat / 4;
            newTime = Math.round(newTime / gridStep) * gridStep;
            
            const newPitch = Math.max(lowestNote, Math.min(highestNote, initial.midiNote + pitchDelta));
            
            clip.events[noteOnIndex].time = newTime;
            clip.events[noteOnIndex].note = newPitch;
            
            clip.events[noteOffIndex].time = newTime + initial.duration;
            clip.events[noteOffIndex].note = newPitch;
          } else {
            // Resize
            let newDuration = Math.max(0.1, initial.duration + timeDelta);
             // Snap to 1/16 grid
             const gridStep = secondsPerBeat / 4;
             newDuration = Math.round(newDuration / gridStep) * gridStep;
             if (newDuration < gridStep) newDuration = gridStep;

            clip.events[noteOffIndex].time = clip.events[noteOnIndex].time + newDuration;
          }
        }
        
        newClips[clipIndex] = clip;
      });
      
      updateTrack(trackId, { clips: newClips });
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, clips, trackId, updateTrack, transport]);

  // Key handlers (Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only delete if we have selection
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNoteIds.size > 0) {
        // Prevent browser back navigation
        // e.preventDefault(); // Be careful with this, only if we are sure we are in context
        
        const newClips = [...clips];
        let hasChanges = false;
        
        selectedNoteIds.forEach(noteId => {
           const [clipId, noteKeyStr] = noteId.split(':');
           const clipIndex = newClips.findIndex(c => c.id === clipId);
           if (clipIndex === -1) return;
           
           const clip = { ...newClips[clipIndex] };
           // Create new events array if not already cloned for this clip
           if (clip === newClips[clipIndex]) {
               clip.events = [...clip.events];
           }
           
           const initialLength = clip.events.length;
           clip.events = clip.events.filter(ev => ev.noteKey.toString() !== noteKeyStr);
           
           if (clip.events.length !== initialLength) {
               newClips[clipIndex] = clip;
               hasChanges = true;
           }
        });
        
        if (hasChanges) {
            updateTrack(trackId, { clips: newClips });
            setSelectedNoteIds(new Set());
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNoteIds, clips, trackId, updateTrack]);

  // Double click to create note
  const handleGridDoubleClick = (e: React.MouseEvent) => {
     if (!transport) return;
     
     const rect = gridRef.current!.getBoundingClientRect();
     const x = e.clientX - rect.left;
     const y = e.clientY - rect.top;
     
     const secondsPerBeat = 60 / transport.getBpm();
     const pixelsPerSecond = pixelsPerBeat / secondsPerBeat;
     
     const clickedTime = x / pixelsPerSecond;
     const clickedPitch = highestNote - Math.floor(y / keyHeight);
     
     // Snap
     const gridStep = secondsPerBeat / 4;
     const snappedTime = Math.round(clickedTime / gridStep) * gridStep;
     
     // Find target clip (based on time)
     let targetClipIndex = clips.findIndex(c => 
       snappedTime >= c.startTime && snappedTime < c.startTime + c.length
     );

     const noteKey = `note_${Date.now()}`;
     
     if (targetClipIndex !== -1) {
         const clip = { ...clips[targetClipIndex] };
         const relativeTime = Math.max(0, snappedTime - clip.startTime);
         
         const newNoteOn: RecordedMidiEvent = {
           type: 'noteOn',
           channel: 0,
           time: relativeTime,
           note: clickedPitch,
           velocity: 100,
           noteKey
         };
         
         const newNoteOff: RecordedMidiEvent = {
           type: 'noteOff',
           channel: 0,
           time: relativeTime + gridStep,
           note: clickedPitch,
           velocity: 0,
           noteKey
         };
         
         clip.events = [...clip.events, newNoteOn, newNoteOff];
         
         const newClips = [...clips];
         newClips[targetClipIndex] = clip;
         updateTrack(trackId, { clips: newClips });
     } else {
         // Create new clip
         const clipStart = Math.floor(snappedTime / (secondsPerBeat * 4)) * (secondsPerBeat * 4);
         const relativeTime = snappedTime - clipStart;
         
         const newNoteOn: RecordedMidiEvent = {
           type: 'noteOn',
           channel: 0,
           time: relativeTime,
           note: clickedPitch,
           velocity: 100,
           noteKey
         };
         
         const newNoteOff: RecordedMidiEvent = {
           type: 'noteOff',
           channel: 0,
           time: relativeTime + gridStep,
           note: clickedPitch,
           velocity: 0,
           noteKey
         };
         
         const newClip: MidiClip = {
             id: `clip_${Date.now()}`,
             startTime: clipStart,
             length: secondsPerBeat * 4, // 1 bar default
             events: [newNoteOn, newNoteOff]
         };
         
         updateTrack(trackId, { clips: [...clips, newClip] });
     }
  };


  // RENDER HELPERS
  const getNoteStyle = (note: EditorNote) => {
    if (!transport) return {};
    
    const secondsPerBeat = 60 / transport.getBpm();
    const pixelsPerSecond = pixelsPerBeat / secondsPerBeat;
    
    const left = note.absoluteStartTime * pixelsPerSecond;
    const width = note.duration * pixelsPerSecond;
    const top = (highestNote - note.midiNote) * keyHeight; // Inverted index
        
        return {
      left: `${left}px`,
      top: `${top}px`,
      width: `${Math.max(4, width)}px`,
      height: `${keyHeight}px`,
      backgroundColor: selectedNoteIds.has(note.id) ? '#fff' : color,
      borderColor: selectedNoteIds.has(note.id) ? color : 'rgba(255,255,255,0.5)'
    };
  };

  const handleGridScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (headerRef.current) {
      headerRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  return (
    <div className="midi-editor-view">
      <div className="midi-editor-toolbar">
        <div className="editor-track-info" style={{ color }}>
          {trackName}
        </div>
        <div className="editor-tools">
          <div className="tool-info">
             {selectedNoteIds.size > 0 ? `${selectedNoteIds.size} Selected` : 'Select Notes'}
          </div>
        </div>
        <button className="editor-close-btn" onClick={onClose}>✕</button>
      </div>
      
      <div className="piano-roll-container">
        {/* Sidebar Keys */}
        <div className="piano-keys-sidebar">
          <div className="piano-keys-header">NOTES</div>
          <div className="piano-keys-list" ref={keysRef}>
            {pianoKeys.map(({ midiNote, noteName, isC, isBlack }) => (
              <div
                key={midiNote}
                className={`piano-key ${isBlack ? 'black-key' : 'white-key'}`}
                onMouseDown={() => synthEngine?.playNote(AudioEngineClass.midiToFrequency(midiNote), `preview-${midiNote}`)}
                onMouseUp={() => synthEngine?.releaseNote(`preview-${midiNote}`)}
                onMouseLeave={() => synthEngine?.releaseNote(`preview-${midiNote}`)}
              >
                {noteName}
              </div>
            ))}
          </div>
        </div>

        {/* Grid Area */}
        <div className="piano-roll-area">
          <div className="piano-roll-header" ref={headerRef}>
             {/* Simple Ruler */}
             <div 
                className="time-ruler" 
                ref={rulerRef} 
                style={{ width: `${numBars * 4 * pixelsPerBeat}px`, cursor: 'ew-resize' }}
                onMouseDown={handleRulerMouseDown}
             >
                {Array.from({length: numBars}).map((_, i) => (
                  <div key={i} className="ruler-bar" style={{width: 4 * pixelsPerBeat}}>{i + 1}</div>
                ))}
             </div>
          </div>
          
          <div 
            className="piano-roll-grid-container" 
            onMouseDown={handleGridMouseDown}
            onDoubleClick={handleGridDoubleClick}
            onScroll={handleGridScroll}
          >
            <div className="piano-roll-grid" ref={gridRef} style={{ 
              height: (highestNote - lowestNote + 1) * keyHeight,
              width: `${numBars * 4 * pixelsPerBeat}px`
            }}>
              {/* Background Rows */}
              {pianoKeys.map(({ midiNote, isBlack }) => (
                <div 
                  key={midiNote} 
                  className={`piano-roll-row ${isBlack ? 'black-row' : ''}`}
                  style={{ height: keyHeight }}
                ></div>
              ))}
              
              {/* Playback Line */}
              <div className="playback-line"></div>

              {/* Notes */}
              {editorNotes.map(note => (
                <div
                  key={note.id}
                  className={`midi-note ${selectedNoteIds.has(note.id) ? 'selected' : ''}`}
                  style={getNoteStyle(note)}
                  onMouseDown={(e) => handleNoteMouseDown(e, note)}
                >
                  <div className="resize-handle"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
