/**
 * Module Panel - Individual draggable module component
 */

import React, { useEffect, useRef, useState } from 'react';
import { SynthModule } from '../../systems/ModuleManager';
import { OscillatorModule } from './OscillatorModule';
import { ADSRModule } from './ADSRModule';
import { FilterModule } from './FilterModule';
import { LFOModule } from './LFOModule';
import { DistortionModule } from './DistortionModule';
import { VoiceModule } from './VoiceModule';
import { FilterEnvModule } from './FilterEnvModule';
import './ModulePanel.css';

interface ModulePanelProps {
  module: SynthModule;
  onToggle: (moduleId: string, enabled: boolean) => void;
  onRemove: (moduleId: string) => void;
  onDragStart?: (moduleId: string, e: React.MouseEvent) => void;
  onRef?: (el: HTMLDivElement | null) => void;
  isDragging?: boolean;
}

export const ModulePanel: React.FC<ModulePanelProps> = ({
  module,
  onToggle,
  onRemove,
  onDragStart,
  onRef,
  isDragging: isDraggingProp = false
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const [isDraggingLocal, setIsDraggingLocal] = useState(false);
  const isDragging = isDraggingProp || isDraggingLocal;

  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.setAttribute('data-module-id', module.id);
      if (onRef) {
        onRef(panelRef.current);
      }
    }
    return () => {
      if (onRef) {
        onRef(null);
      }
    };
  }, [module.id, onRef]);

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    // Don't drag if clicking on buttons
    const target = e.target as HTMLElement;
    if (target.classList.contains('module-panel-toggle') ||
        target.classList.contains('module-panel-close') ||
        target.closest('.module-panel-toggle') ||
        target.closest('.module-panel-close')) {
      return;
    }

    setIsDraggingLocal(true);
    
    if (onDragStart) {
      onDragStart(module.id, e);
    }

    const handleUp = () => {
      setIsDraggingLocal(false);
      document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mouseup', handleUp);
  };

  const renderModuleContent = () => {
    switch (module.type) {
      case 'oscillator-base':
        return <OscillatorModule />;
      case 'voice-base':
        return <VoiceModule />;
      case 'adsr-base':
        return <ADSRModule />;
      case 'filter-env-base':
        return <FilterEnvModule />;
      case 'filter-base':
        return <FilterModule />;
      case 'distortion-base':
        return <DistortionModule />;
      case 'lfo-base':
        return <LFOModule />;
      default:
        return <div className="module-placeholder">Module parameters and controls</div>;
    }
  };

  return (
    <div
      ref={panelRef}
      className={`module-panel ${module.enabled ? '' : 'disabled'} ${isDragging ? 'dragging' : ''}`}
      data-module-id={module.id}
    >
      <div className="module">
        <div 
          className="module-header" 
          data-module-id={module.id}
          onMouseDown={handleHeaderMouseDown}
        >
          <span className="module-title">{module.name}</span>
          <div className="module-header-controls">
            <button
              className="module-panel-toggle"
              onClick={(e) => {
                e.stopPropagation();
                onToggle(module.id, !module.enabled);
              }}
              title={module.enabled ? 'Disable' : 'Enable'}
            >
              {module.enabled ? '●' : '○'}
            </button>
            <button
              className="module-panel-close"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(module.id);
              }}
              title="Remove"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="module-content">
          {renderModuleContent()}
        </div>
      </div>
    </div>
  );
};
