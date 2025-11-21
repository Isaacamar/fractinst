/**
 * Instrument Library Component
 * Allows users to save and load instrument configurations
 */

import React, { useState } from 'react';
import type { InstrumentConfiguration } from '../../types/instrument';
import { loadLibraryState, saveInstrument, deleteInstrument } from '../../utils/instrumentStorage';
import './InstrumentLibrary.css';

interface InstrumentLibraryProps {
  onLoadInstrument: (config: InstrumentConfiguration) => void;
  onExportInstrument: (name: string) => InstrumentConfiguration | null;
}

export const InstrumentLibrary: React.FC<InstrumentLibraryProps> = ({ onLoadInstrument, onExportInstrument }) => {
  const [libraryState, setLibraryState] = useState(loadLibraryState());
  const [isExpanded, setIsExpanded] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const refreshLibrary = () => {
    setLibraryState(loadLibraryState());
  };

  const handleSaveCurrent = () => {
    if (!saveName.trim()) return;
    
    const config = onExportInstrument(saveName.trim());
    if (config) {
      saveInstrument(config);
      refreshLibrary();
      setSaveDialogOpen(false);
      setSaveName('');
    }
  };

  const handleLoad = (config: InstrumentConfiguration) => {
    onLoadInstrument(config);
  };

  const handleDelete = (id: string) => {
    if (deleteConfirmId === id) {
      deleteInstrument(id);
      refreshLibrary();
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
    }
  };

  const allInstruments = [...libraryState.presets, ...libraryState.userInstruments];

  return (
    <div className="instrument-library-module">
      <div className="module-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span className="module-title">INSTRUMENT LIBRARY</span>
        <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
      </div>
      
      {isExpanded && (
        <div className="instrument-library-content">
          <div className="library-actions">
            <button
              className="save-btn"
              onClick={() => setSaveDialogOpen(true)}
              title="Save current instrument configuration"
            >
              SAVE
            </button>
          </div>

          {saveDialogOpen && (
            <div className="save-dialog">
              <input
                type="text"
                className="save-input"
                placeholder="Instrument name..."
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveCurrent();
                  } else if (e.key === 'Escape') {
                    setSaveDialogOpen(false);
                    setSaveName('');
                  }
                }}
                autoFocus
              />
              <div className="save-dialog-actions">
                <button onClick={handleSaveCurrent} disabled={!saveName.trim()}>
                  SAVE
                </button>
                <button onClick={() => {
                  setSaveDialogOpen(false);
                  setSaveName('');
                }}>
                  CANCEL
                </button>
              </div>
            </div>
          )}

          <div className="instrument-list">
            {allInstruments.length === 0 ? (
              <div className="empty-state">No instruments saved</div>
            ) : (
              allInstruments.map((instrument) => (
                <div key={instrument.id} className="instrument-item">
                  <div className="instrument-info">
                    <span className="instrument-name">{instrument.name}</span>
                    {instrument.isPreset && (
                      <span className="preset-badge">PRESET</span>
                    )}
                  </div>
                  <div className="instrument-actions">
                    <button
                      className="load-btn"
                      onClick={() => handleLoad(instrument)}
                      title="Load this instrument"
                    >
                      LOAD
                    </button>
                    {!instrument.isPreset && (
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(instrument.id)}
                        title={deleteConfirmId === instrument.id ? 'Confirm delete' : 'Delete instrument'}
                      >
                        {deleteConfirmId === instrument.id ? '✓' : '×'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

