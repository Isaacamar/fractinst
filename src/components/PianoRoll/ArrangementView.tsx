import React, { useEffect, useRef, useState } from 'react';
import { useTrackStore } from '../../stores/trackStore';
import { useTransportStore } from '../../stores/transportStore';
import type { Transport } from '../../engines/Transport';
import type { DAWCore } from '../../engines/DAWCore';
import type { SequenceBlockData, PercussionClip } from '../../types/percussion';
import type { DrumSound } from '../../engines/DrumMachine';
import './ArrangementView.css';

interface ArrangementViewProps {
  transport: Transport | null;
  dawCore: DAWCore | null;
  onOpenEditor: (trackId: string) => void;
  onSwitchToInstrument: () => void;
  draggedBlock: {
    blockData: SequenceBlockData;
    selectedSounds: DrumSound[];
  } | null;
  onDragEnd: () => void;
}

interface ClipDragState {
  type: 'move' | 'resize' | 'copy';
  clipId: string;
  trackId: string;
  startX: number;
  initialStartTime: number;
  initialDuration: number;
  originalClip?: any; // To restore if needed, or to keep track of source
}

export const ArrangementView: React.FC<ArrangementViewProps> = ({
  transport,
  dawCore,
  onOpenEditor,
  onSwitchToInstrument,
  draggedBlock,
  onDragEnd
}) => {
  const { tracks, activeTrackId, setActiveTrack, setTrackMute, setTrackSolo, setTrackVolume, updateTrack, addPercussionClipToTrack } = useTrackStore();
  const { loopLengthBars, setLoopLengthBars } = useTransportStore();
  const [currentTime, setCurrentTime] = useState(0);
  const rulerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [selectedClipIds, setSelectedClipIds] = useState<Set<string>>(new Set());
  const [dragState, setDragState] = useState<ClipDragState | null>(null);
  const [dropTargetTrack, setDropTargetTrack] = useState<string | null>(null);

  // Constants
  const pixelsPerBeat = 50;
  const numBars = loopLengthBars; // Use dynamic loop length
  const beatsPerBar = 4;
  const totalBeats = numBars * beatsPerBar;
  const timelineWidth = totalBeats * pixelsPerBeat;

  // Update playback line
  useEffect(() => {
    if (!transport) return;
    const updateTime = (time: number) => {
      setCurrentTime(time);
    };
    transport.onUpdate(updateTime);
    return () => transport.offUpdate(updateTime);
  }, [transport]);

  // Seek on click
  const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only seek if not dragging and clicking header/background
    if (dragState) return;
    if ((e.target as HTMLElement).closest('.timeline-clip')) return;

    if (!transport || !dawCore) return;

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

  // Clip Interactions
  const handleClipMouseDown = (e: React.MouseEvent, clipId: string, trackId: string, startTime: number, duration: number) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent double click selection usually

    const isShift = e.shiftKey;
    const isSelected = selectedClipIds.has(clipId);

    // Selection Logic
    let newSelected = new Set(selectedClipIds);
    if (!isShift && !isSelected) {
      newSelected.clear();
      newSelected.add(clipId);
    } else if (isShift) {
      if (isSelected) newSelected.delete(clipId);
      else newSelected.add(clipId);
    } else if (!isSelected) {
      newSelected.add(clipId);
    }
    setSelectedClipIds(newSelected);

    // Drag Logic
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const isResize = e.clientX > rect.right - 10;

    // If copying (Alt key), we clone immediately and drag the Copy
    let targetClipId = clipId;

    if (e.altKey && !isResize) {
      const track = tracks.find(t => t.id === trackId);
      if (track) {
        const originalClip = track.clips.find(c => c.id === clipId);
        if (originalClip) {
          const newClipId = `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const newClip = JSON.parse(JSON.stringify(originalClip)); // Deep clone
          newClip.id = newClipId;

          // Insert new clip
          const newClips = [...track.clips, newClip];
          updateTrack(trackId, { clips: newClips as any });

          // Target the new clip for dragging
          targetClipId = newClipId;
          // Select the new clip
          setSelectedClipIds(new Set([newClipId]));
        }
      }
    }

    setDragState({
      type: isResize ? 'resize' : 'move',
      clipId: targetClipId,
      trackId,
      startX: e.clientX,
      initialStartTime: startTime,
      initialDuration: duration
    });
  };

  // Global mouse move/up for dragging clips
  useEffect(() => {
    if (!dragState || !transport) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragState.startX;
      const secondsPerBeat = 60 / transport.getBpm();
      const pixelsPerSecond = pixelsPerBeat / secondsPerBeat;
      const timeDelta = deltaX / pixelsPerSecond;

      // Find track and clip
      const track = tracks.find(t => t.id === dragState.trackId);
      if (!track) return;

      const clipIndex = track.clips.findIndex(c => c.id === dragState.clipId);
      if (clipIndex === -1) return;

      const clip = { ...track.clips[clipIndex] };
      const newClips = [...track.clips] as typeof track.clips;

      if (dragState.type === 'move') {
        let newTime = Math.max(0, dragState.initialStartTime + timeDelta);
        // Snap to beat
        const gridStep = secondsPerBeat;
        newTime = Math.round(newTime / gridStep) * gridStep;

        // If copying, we create a new clip ID if it doesn't match the dragged one (which is the source)
        // Wait, simplified: The dragging visual updates the *current* clip.
        // For copy, we want to CLONE on drop or create a ghost? 
        // Better: On Mouse Up, if 'copy', we revert the original and add a NEW clip at the new position.
        // OR: We clone immediately on DragStart?
        // Let's Clone on Drop for cleaner state management, BUT we need visual feedback.
        // Simplest: If 'copy', we are moving this clip visually, but on drop we accept it as a NEW clip and restore original?
        // No, that's complex. 
        // Let's actually CLONE immediately if 'copy' mode was detected on MouseDown? No, that spams store.

        // Approach: We move the clip being dragged. If 'copy', we insert a DUPLICATE at the original position immediately? 
        // This is risky if user cancels.

        // Revised Approach for this tool call: Just handle the movement logic here. 
        // ACTUAL logic: We treat 'copy' same as 'move' during drag for the visual clip. 
        // But on MouseUp, we need to handle the finalized position.

        // Wait! The logic below MODIFIES the store on every mouse move:
        // updateTrack(track.id, { clips: newClips as any });

        // If we are modifying the store live, then for COPY we should have duplicated the clip FIRST.
        // Let's do that in handleClipMouseDown? React state shouldn't have side effects there.
        // But we can do it here: If we differentiate 'copy' state, we can handle it.

        // NOTE: Implementing copy logic inside MouseMove is hard because we'd keep creating copies.
        // BETTER: In MouseDown, if Alt is pressed, we create a copy in the store IMMEDIATELY and drag THAT.

        clip.startTime = newTime;
      } else {
        // Resize
        let newDuration = Math.max(0.5, dragState.initialDuration + timeDelta); // Min 0.5s
        // Snap to beat
        const gridStep = secondsPerBeat;
        newDuration = Math.round(newDuration / gridStep) * gridStep;
        if (newDuration < gridStep) newDuration = gridStep;
        clip.length = newDuration;
      }

      newClips[clipIndex] = clip as any;
      updateTrack(track.id, { clips: newClips as any });
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
  }, [dragState, tracks, transport, updateTrack]);

  // Key handlers (Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedClipIds.size > 0) {
        tracks.forEach(track => {
          const hasSelected = track.clips.some(c => selectedClipIds.has(c.id));
          if (hasSelected) {
            const newClips = track.clips.filter(c => !selectedClipIds.has(c.id)) as typeof track.clips;
            updateTrack(track.id, { clips: newClips as any });
          }
        });
        setSelectedClipIds(new Set());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClipIds, tracks, updateTrack]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (headerRef.current) {
      headerRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  // Drop zone handlers for percussion blocks
  const handleTrackDragOver = (e: React.DragEvent, trackId: string, trackType: 'midi' | 'percussion') => {
    if (!draggedBlock || trackType !== 'percussion') return;
    e.preventDefault();
    e.stopPropagation();
    setDropTargetTrack(trackId);
  };

  const handleTrackDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDropTargetTrack(null);
  };

  const handleTrackDrop = (e: React.DragEvent, trackId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedBlock || !transport) {
      setDropTargetTrack(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;

    // Convert pixel position to beats
    const secondsPerBeat = 60 / transport.getBpm();
    const pixelsPerSecond = pixelsPerBeat / secondsPerBeat;
    const timeSeconds = Math.max(0, x / pixelsPerSecond);
    const beatPosition = timeSeconds / secondsPerBeat;

    // Snap to beat
    const snappedBeat = Math.round(beatPosition);
    const snappedTime = snappedBeat * secondsPerBeat;

    // Calculate clip length based on pattern
    const beatsPerStep = 1 / draggedBlock.blockData.stepResolution;
    const patternLengthBeats = draggedBlock.blockData.stepCount * beatsPerStep;
    const clipLengthSeconds = patternLengthBeats * secondsPerBeat;

    // Create filtered pattern (only selected sounds)
    const filteredPatterns: Record<string, boolean[]> = {};
    draggedBlock.selectedSounds.forEach(sound => {
      if (draggedBlock.blockData.patterns[sound]) {
        filteredPatterns[sound] = [...draggedBlock.blockData.patterns[sound]];
      }
    });

    // Create percussion clip
    const newClip: PercussionClip = {
      id: `perc-clip-${Date.now()}-${Math.random()}`,
      startTime: snappedTime,
      length: clipLengthSeconds,
      patterns: filteredPatterns as Record<DrumSound, boolean[]>,
      stepCount: draggedBlock.blockData.stepCount,
      stepResolution: draggedBlock.blockData.stepResolution,
      name: draggedBlock.blockData.name,
      selectedSounds: draggedBlock.selectedSounds
    };

    addPercussionClipToTrack(trackId, newClip);
    setDropTargetTrack(null);
    onDragEnd();
  };

  return (
    <div className="arrangement-view" onClick={() => setSelectedClipIds(new Set())}>
      {/* Track Headers Panel */}
      <div className="track-headers-panel">
        <div className="track-headers-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '10px' }}>
          <span>TRACKS</span>
          <div className="loop-controls" style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
            <button
              onClick={(e) => { e.stopPropagation(); setLoopLengthBars(Math.max(1, loopLengthBars - 1)); }}
              style={{
                background: '#333',
                border: '1px solid #555',
                color: '#fff',
                width: '24px',
                height: '24px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px'
              }}
              title="Decrease Loop Length"
            >
              -
            </button>
            <span style={{ fontSize: '11px', minWidth: '40px', textAlign: 'center', color: '#aaa' }}>{loopLengthBars} BAR</span>
            <button
              onClick={(e) => { e.stopPropagation(); setLoopLengthBars(loopLengthBars + 1); }}
              style={{
                background: '#333',
                border: '1px solid #555',
                color: '#fff',
                width: '24px',
                height: '24px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px'
              }}
              title="Increase Loop Length"
            >
              +
            </button>
          </div>
        </div>
        {tracks.map(track => (
          <div
            key={track.id}
            className={`track-header ${activeTrackId === track.id ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setActiveTrack(track.id);
              onSwitchToInstrument();
            }}
          >
            <div className="track-color-strip" style={{ background: track.color }}></div>
            <div className="track-info">
              <div className="track-name">{track.name}</div>
              <div className="track-controls">
                <div className="track-volume-slider">
                  <input
                    type="range"
                    min="0" max="1" step="0.01"
                    value={track.volume}
                    onChange={(e) => {
                      e.stopPropagation();
                      setTrackVolume(track.id, parseFloat(e.target.value));
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="track-volume-value">{Math.round(track.volume * 100)}%</span>
                </div>
                <div className="track-buttons">
                  <button
                    className={`track-btn mute ${track.muted ? 'active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setTrackMute(track.id, !track.muted); }}
                  >M</button>
                  <button
                    className={`track-btn solo ${track.soloed ? 'active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setTrackSolo(track.id, !track.soloed); }}
                  >S</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Timeline Panel */}
      <div className="timeline-panel">
        <div
          className="timeline-header"
          ref={headerRef}
          onMouseDown={handleTimelineMouseDown}
          style={{ cursor: 'ew-resize' }}
        >
          <div className="timeline-ruler" ref={rulerRef} style={{ width: timelineWidth }}>
            {/* Simple Ruler rendering */}
            {Array.from({ length: numBars }).map((_, i) => (
              <div key={i} className="ruler-bar" style={{ width: beatsPerBar * pixelsPerBeat }}>
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        <div
          className="timeline-tracks-container"
          onMouseDown={handleTimelineMouseDown}
          onScroll={handleScroll}
        >
          <div className="timeline-grid" style={{ width: timelineWidth }}>
            {tracks.map(track => (
              <div
                key={track.id}
                className={`timeline-track-row ${dropTargetTrack === track.id ? 'drop-target' : ''}`}
                onDoubleClick={() => onOpenEditor(track.id)}
                onDragOver={(e) => handleTrackDragOver(e, track.id, track.type)}
                onDragLeave={handleTrackDragLeave}
                onDrop={(e) => handleTrackDrop(e, track.id)}
              >
                {/* Render Clips */}
                {track.clips.map((clip) => {
                  const startPixels = (clip.startTime / (60 / (transport?.getBpm() || 120))) * pixelsPerBeat;
                  const widthPixels = (clip.length / (60 / (transport?.getBpm() || 120))) * pixelsPerBeat;

                  // Check if it's a MIDI or percussion clip
                  const isMidiClip = 'events' in clip;
                  const isPercussionClip = 'patterns' in clip;

                  return (
                    <div
                      key={clip.id}
                      className={`timeline-clip ${selectedClipIds.has(clip.id) ? 'selected' : ''} ${isPercussionClip ? 'percussion-clip' : ''}`}
                      style={{
                        left: `${startPixels}px`,
                        width: `${Math.max(10, widthPixels)}px`,
                        background: track.color + '40', // More transparent
                        borderColor: track.color,
                        zIndex: selectedClipIds.has(clip.id) ? 10 : 1
                      }}
                      onMouseDown={(e) => handleClipMouseDown(e, clip.id, track.id, clip.startTime, clip.length)}
                    >
                      {isMidiClip && (
                        <>
                          <div className="clip-name">MIDI</div>
                          {/* Mini Notes Visualization */}
                          {clip.events.filter(ev => ev.type === 'noteOn').map((note, nIdx) => {
                            const noteStartPct = (note.time / clip.length) * 100;
                            const noteOff = clip.events.find(ev => ev.type === 'noteOff' && ev.noteKey === note.noteKey);
                            const duration = noteOff ? noteOff.time - note.time : 0.5;
                            const widthPct = (duration / clip.length) * 100;
                            const topPct = (1 - (note.note / 127)) * 100;

                            return (
                              <div
                                key={nIdx}
                                style={{
                                  position: 'absolute',
                                  left: `${noteStartPct}%`,
                                  top: `${topPct}%`,
                                  width: `${Math.max(1, widthPct)}%`,
                                  height: '20%',
                                  background: track.color,
                                  opacity: 0.8,
                                  borderRadius: '1px'
                                }}
                              />
                            );
                          })}
                        </>
                      )}

                      {isPercussionClip && (
                        <>
                          <div className="clip-name">{clip.name || 'Pattern'}</div>
                          {/* Mini Pattern Grid Visualization */}
                          <div className="percussion-preview">
                            {Object.entries(clip.patterns).map(([sound, steps]) => {
                              if (!steps.some(s => s)) return null;
                              return (
                                <div key={sound} className="perc-preview-row">
                                  {steps.map((active, idx) => (
                                    <div
                                      key={idx}
                                      className={`perc-preview-step ${active ? 'active' : ''}`}
                                      style={{
                                        width: `${100 / steps.length}%`,
                                        background: active ? track.color : 'transparent'
                                      }}
                                    />
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}

                      <div className="clip-resize-handle"></div>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Playback Head */}
            <div
              className="timeline-playhead"
              style={{
                left: currentTime * (pixelsPerBeat / (60 / (transport?.getBpm() || 120)))
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};
