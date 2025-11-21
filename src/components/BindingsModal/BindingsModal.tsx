import React, { useEffect, useState, useCallback } from 'react';
import { useKeyboardStore } from '../../stores/keyboardStore';
import { COMMON_CHORDS, type KeyDefinition } from '../../types/keyboard';
import './BindingsModal.css';

interface BindingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentOctave: number;
}

// Define keys (static layout)
const keyDefinitions: Record<string, KeyDefinition> = {
  // White keys
  'KeyA': { label: 'A', type: 'white', note: 'C', position: 0 },
  'KeyS': { label: 'S', type: 'white', note: 'D', position: 1 },
  'KeyD': { label: 'D', type: 'white', note: 'E', position: 2 },
  'KeyF': { label: 'F', type: 'white', note: 'F', position: 3 },
  'KeyG': { label: 'G', type: 'white', note: 'G', position: 4 },
  'KeyH': { label: 'H', type: 'white', note: 'A', position: 5 },
  'KeyJ': { label: 'J', type: 'white', note: 'B', position: 6 },
  'KeyK': { label: 'K', type: 'white', note: 'C', position: 7 },

  // Black keys
  'KeyW': { label: 'W', type: 'black', note: 'C#', betweenKeys: [0, 1] },
  'KeyE': { label: 'E', type: 'black', note: 'D#', betweenKeys: [1, 2] },
  'KeyT': { label: 'T', type: 'black', note: 'F#', betweenKeys: [3, 4] },
  'KeyY': { label: 'Y', type: 'black', note: 'G#', betweenKeys: [4, 5] },
  'KeyU': { label: 'U', type: 'black', note: 'A#', betweenKeys: [5, 6] },

  // Chord keys
  'Digit1': { label: '1', type: 'chord' },
  'Digit2': { label: '2', type: 'chord' },
  'Digit3': { label: '3', type: 'chord' },
  'Digit4': { label: '4', type: 'chord' },
  'Digit5': { label: '5', type: 'chord' },
  'Digit6': { label: '6', type: 'chord' },
  'Digit7': { label: '7', type: 'chord' },
  'Digit8': { label: '8', type: 'chord' },
  'Digit9': { label: '9', type: 'chord' },
  'Digit0': { label: '0', type: 'chord' },

  // Function keys
  'Minus': { label: '-', type: 'function', desc: 'Octave Down' },
  'Equal': { label: '+', type: 'function', desc: 'Octave Up' },
  'KeyR': { label: 'R', type: 'function', desc: 'Record' },
  'Space': { label: '␣', type: 'function', desc: 'Pause/Stop' },
};

export const BindingsModal: React.FC<BindingsModalProps> = ({ isOpen, onClose, currentOctave }) => {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const { chordMap, setChord, resetChords } = useKeyboardStore();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const code = event.code;
    if (keyDefinitions[code]) {
      setPressedKeys(prev => {
        const next = new Set(prev);
        next.add(code);
        return next;
      });
    }
    
    if (code === 'Escape' && isOpen) {
      if (editingKey) {
        setEditingKey(null);
      } else {
        onClose();
      }
    }
  }, [isOpen, onClose, editingKey, keyDefinitions]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    const code = event.code;
    if (keyDefinitions[code]) {
      setPressedKeys(prev => {
        const next = new Set(prev);
        next.delete(code);
        return next;
      });
    }
  }, [keyDefinitions]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
    } else {
      setPressedKeys(new Set());
      setEditingKey(null);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isOpen, handleKeyDown, handleKeyUp]);

  // Group keys for rendering
  const chordKeys = Object.keys(keyDefinitions).filter(k => keyDefinitions[k].type === 'chord');
  const whiteKeys = Object.keys(keyDefinitions).filter(k => keyDefinitions[k].type === 'white');
  const blackKeys = Object.keys(keyDefinitions).filter(k => keyDefinitions[k].type === 'black');
  const functionKeys = Object.keys(keyDefinitions).filter(k => keyDefinitions[k].type === 'function');

  // Sort white keys by position
  whiteKeys.sort((a, b) => (keyDefinitions[a].position || 0) - (keyDefinitions[b].position || 0));

  if (!isOpen) return null;

  return (
    <div className="bindings-modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="bindings-modal-content">
        <div className="bindings-modal-header">
          <h2>KEY BINDINGS</h2>
          <div className="header-actions">
            <button className="reset-btn" onClick={resetChords}>Reset to Default</button>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
        </div>
        
        <div className="bindings-modal-body">
          <div className="info-text">
            <p><strong>Chords:</strong> Click a number key below to customize its chord</p>
            <p><strong>Piano Keys:</strong> A S D F G H J K = White keys</p>
            <p><strong>Sharps/Flats:</strong> W E T Y U = Black keys</p>
            <p><strong>Octave:</strong> + / - keys to move up/down octaves</p>
          </div>

          <div className="piano-keyboard-container">
            {/* Chord Keys */}
            <div className="chord-keys-row">
              {chordKeys.map(code => {
                const def = keyDefinitions[code];
                const chord = chordMap[code];
                const isEditing = editingKey === code;
                
                return (
                  <div 
                    key={code} 
                    className={`chord-key ${pressedKeys.has(code) ? 'key-pressed' : ''} ${isEditing ? 'key-editing' : ''}`}
                    onClick={() => setEditingKey(isEditing ? null : code)}
                  >
                    <span className="chord-key-label">{def.label}</span>
                    <span className="chord-key-name">{chord?.name || 'Unknown'}</span>
                    
                    {isEditing && (
                      <div className="chord-selector-popover" onClick={e => e.stopPropagation()}>
                        <div className="chord-selector-header">Select Chord</div>
                        <div className="chord-options">
                          {COMMON_CHORDS.map(c => (
                            <button 
                              key={c.name}
                              className={`chord-option ${chord?.name === c.name ? 'active' : ''}`}
                              onClick={() => {
                                setChord(code, c);
                                setEditingKey(null);
                              }}
                            >
                              {c.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Piano Keys */}
            <div className="piano-keyboard">
              <div className="white-keys-row">
                {whiteKeys.map(code => {
                  const def = keyDefinitions[code];
                  return (
                    <div 
                      key={code} 
                      className={`piano-key white-key ${pressedKeys.has(code) ? 'key-pressed' : ''}`}
                    >
                      <span className="piano-key-label">{def.label}</span>
                      <span className="piano-key-note">{def.note}</span>
                    </div>
                  );
                })}
              </div>

              <div className="black-keys-row">
                {blackKeys.map(code => {
                  const def = keyDefinitions[code];
                  const [left] = def.betweenKeys || [0, 1];
                  const leftPercent = (left + 1) * (100 / 8);
                  
                  return (
                    <div 
                      key={code} 
                      className={`piano-key black-key ${pressedKeys.has(code) ? 'key-pressed' : ''}`}
                      style={{ left: `${leftPercent}%` }}
                    >
                      <span className="piano-key-label">{def.label}</span>
                      <span className="piano-key-note">{def.note}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Function Keys */}
            <div className="function-keys-section">
              {functionKeys.map(code => {
                const def = keyDefinitions[code];
                return (
                  <div 
                    key={code} 
                    className={`function-key ${pressedKeys.has(code) ? 'key-pressed' : ''}`}
                  >
                    <span className="key-label">{def.label}</span>
                    <span className="key-desc">{def.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bindings-modal-footer">
            <p>Press keys to see them light up in real-time!</p>
            <p>Current Octave: <span className="octave-value">C{currentOctave}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

