import React, { useEffect, useRef, useState } from 'react';
import { useTrackStore } from '../../stores/trackStore';
import { useTransportStore } from '../../stores/transportStore';
import type { Transport } from '../../engines/Transport';
import type { DAWCore } from '../../engines/DAWCore';
import './ArrangementView.css';

interface ArrangementViewProps {
  transport: Transport | null;
  dawCore: DAWCore | null;
  onOpenEditor: (trackId: string) => void;
  onSwitchToInstrument: () => void;
}

interface ClipDragState {
  type: 'move' | 'resize';
  clipId: string;
  trackId: string;
  startX: number;
  initialStartTime: number;
  initialDuration: number;
}

export const ArrangementView: React.FC<ArrangementViewProps> = ({
  transport,
  dawCore,
  onOpenEditor,
  onSwitchToInstrument
}) => {
  const { tracks, activeTrackId, setActiveTrack, setTrackMute, setTrackSolo, setTrackVolume, updateTrack } = useTrackStore();
  const { loopLengthBars, setLoopLengthBars } = useTransportStore();
  const [currentTime, setCurrentTime] = useState(0);
  const rulerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [selectedClipIds, setSelectedClipIds] = useState<Set<string>>(new Set());
  const [dragState, setDragState] = useState<ClipDragState | null>(null);

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
    
    setDragState({
      type: isResize ? 'resize' : 'move',
      clipId,
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
      const newClips = [...track.clips];

      if (dragState.type === 'move') {
        let newTime = Math.max(0, dragState.initialStartTime + timeDelta);
        // Snap to beat
        const gridStep = secondsPerBeat; 
        newTime = Math.round(newTime / gridStep) * gridStep;
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

      newClips[clipIndex] = clip;
      updateTrack(track.id, { clips: newClips });
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
            const newClips = track.clips.filter(c => !selectedClipIds.has(c.id));
            updateTrack(track.id, { clips: newClips });
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
              <div key={track.id} className="timeline-track-row" onDoubleClick={() => onOpenEditor(track.id)}>
                {/* Render Clips */}
                {track.clips.map((clip) => {
                  const startPixels = (clip.startTime / (60 / (transport?.getBpm() || 120))) * pixelsPerBeat;
                  const widthPixels = (clip.length / (60 / (transport?.getBpm() || 120))) * pixelsPerBeat;
                  
                  return (
                    <div 
                      key={clip.id}
                      className={`timeline-clip ${selectedClipIds.has(clip.id) ? 'selected' : ''}`}
                      style={{ 
                        left: `${startPixels}px`, 
                        width: `${Math.max(10, widthPixels)}px`,
                        background: track.color + '40', // More transparent
                        borderColor: track.color,
                        zIndex: selectedClipIds.has(clip.id) ? 10 : 1
                      }}
                      onMouseDown={(e) => handleClipMouseDown(e, clip.id, track.id, clip.startTime, clip.length)}
                    >
                      <div className="clip-name">MIDI</div>
                      {/* Mini Notes Visualization */}
                      {clip.events.filter(ev => ev.type === 'noteOn').map((note, nIdx) => {
                          const noteStartPct = (note.time / clip.length) * 100;
                          // Find matching note off for duration
                          // This is expensive O(N^2) inside render, but clips are small
                          // Ideally pre-process this
                          const noteOff = clip.events.find(ev => ev.type === 'noteOff' && ev.noteKey === note.noteKey);
                          const duration = noteOff ? noteOff.time - note.time : 0.5;
                          const widthPct = (duration / clip.length) * 100;
                          const topPct = (1 - (note.note / 127)) * 100; // Rough pitch height
                          
                          return (
                              <div 
                                key={nIdx}
                                style={{
                                    position: 'absolute',
                                    left: `${noteStartPct}%`,
                                    top: `${topPct}%`,
                                    width: `${Math.max(1, widthPct)}%`,
                                    height: '20%', // Fixed height bars
                                    background: track.color,
                                    opacity: 0.8,
                                    borderRadius: '1px'
                                }}
                              />
                          );
                      })}
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
