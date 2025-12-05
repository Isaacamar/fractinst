/**
 * Module System - Dynamic module grid with 5 columns
 * Replaces the static module system with a dynamic, draggable one
 */

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { ModuleManager, SynthModule } from '../../systems/ModuleManager';
import { ModuleLayoutManager, ModulePosition } from '../../systems/ModuleLayoutManager';
import { baseModuleDefinitions } from '../../systems/baseModules';
import { ModulePanel } from './ModulePanel';
import { ModuleMenu } from './ModuleMenu';
import type { InstrumentConfiguration } from '../../types/instrument';
import './ModuleSystem.css';

interface ModuleSystemProps {
  audioContext: AudioContext | null;
  audioEngine: any; // AudioEngine instance
  onStateChange?: (modules: InstrumentConfiguration['modules']) => void;
}

export interface ModuleSystemRef {
  exportState: () => InstrumentConfiguration['modules'];
  loadInstrument: (config: InstrumentConfiguration) => void;
}

export const ModuleSystem = forwardRef<ModuleSystemRef, ModuleSystemProps>(({ audioContext, audioEngine, onStateChange }, ref) => {
  const [modules, setModules] = useState<Map<string, SynthModule>>(new Map());
  const [modulePositions, setModulePositions] = useState<Map<string, ModulePosition>>(new Map());
  const [menuOpen, setMenuOpen] = useState(false);
  const [draggedModule, setDraggedModule] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const moduleManagerRef = useRef<ModuleManager | null>(null);
  const layoutManagerRef = useRef<ModuleLayoutManager | null>(null);
  const initializedRef = useRef(false);
  const moduleRefsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const isLoadingInstrumentRef = useRef(false);

  // Initialize managers - only once
  useEffect(() => {
    if (initializedRef.current) return;
    if (!audioContext) return; // Wait for audio context

    initializedRef.current = true;

    const manager = new ModuleManager();
    const layout = new ModuleLayoutManager();

    // Register base modules
    Object.entries(baseModuleDefinitions).forEach(([type, definition]) => {
      manager.registerModuleType(type, definition);
    });

    manager.setAudioContext(audioContext);

    moduleManagerRef.current = manager;
    layoutManagerRef.current = layout;

    // Initialize base modules
    const baseModuleTypes = [
      'oscillator-base',
      'voice-base',
      'adsr-base',
      'filter-env-base',
      'filter-base',
      'distortion-base',
      'lfo-base'
    ];

    const initialModules = new Map<string, SynthModule>();
    const initialPositions = new Map<string, ModulePosition>();

    baseModuleTypes.forEach((type, index) => {
      const module = manager.addModule(type);
      if (module) {
        // Distribute across columns
        const column = index % 5;
        const row = Math.floor(index / 5);
        initialModules.set(module.id, module);
        initialPositions.set(module.id, { column, row });
      }
    });

    setModules(initialModules);
    setModulePositions(initialPositions);

    // Listen to module events - only add once
    const handleModuleAdded = (module: SynthModule) => {
      if (isLoadingInstrumentRef.current) return; // Ignore during instrument loading

      setModules(prev => {
        if (prev.has(module.id)) return prev; // Already added
        const next = new Map(prev);
        next.set(module.id, module);
        return next;
      });

      setModulePositions(prev => {
        if (prev.has(module.id)) return prev; // Already positioned
        // Add to shortest column
        const positions = Array.from(prev.values());
        const columnHeights = [0, 0, 0, 0, 0];
        positions.forEach(pos => {
          columnHeights[pos.column]++;
        });
        const shortestColumn = columnHeights.indexOf(Math.min(...columnHeights));
        const next = new Map(prev);
        next.set(module.id, { column: shortestColumn, row: columnHeights[shortestColumn] });
        return next;
      });
    };

    const handleModuleRemoved = (module: SynthModule) => {
      if (isLoadingInstrumentRef.current) return; // Ignore during instrument loading

      setModules(prev => {
        const next = new Map(prev);
        next.delete(module.id);
        return next;
      });
      setModulePositions(prev => {
        const next = new Map(prev);
        next.delete(module.id);
        return next;
      });
    };

    manager.on('moduleAdded', handleModuleAdded);
    manager.on('moduleRemoved', handleModuleRemoved);

    return () => {
      // Don't clear on unmount - let React handle it
    };
  }, [audioContext]);

  const handleModuleAdd = (type: string) => {
    if (!moduleManagerRef.current) return;
    const module = moduleManagerRef.current.addModule(type);
    if (module) {
      // Will be handled by event listener
    }
  };

  const handleModuleRemove = (moduleId: string) => {
    if (!moduleManagerRef.current || !layoutManagerRef.current) return;
    layoutManagerRef.current.removeModule(moduleId);
    moduleManagerRef.current.removeModule(moduleId);
  };

  const handleModuleToggle = (moduleId: string, enabled: boolean) => {
    if (!moduleManagerRef.current) return;
    moduleManagerRef.current.toggleModule(moduleId, enabled);

    // Update module state
    setModules(prev => {
      const next = new Map(prev);
      const module = next.get(moduleId);
      if (module) {
        next.set(moduleId, { ...module, enabled });
      }
      return next;
    });

    // Apply to audio engine
    const module = moduleManagerRef.current.getModule(moduleId);
    if (module && audioEngine) {
      audioEngine.setModuleEnabled(module.type, enabled);
    }
  };

  const handleDragStart = (moduleId: string, e: React.MouseEvent) => {
    e.preventDefault();
    const moduleElement = moduleRefsRef.current.get(moduleId);
    if (!moduleElement) return;

    const rect = moduleElement.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    setDraggedModule({ id: moduleId, offsetX, offsetY });

    const startColumn = modulePositions.get(moduleId)?.column ?? 0;
    let currentColumn = startColumn;

    const handleMove = (moveEvent: MouseEvent) => {
      const gridContainer = gridContainerRef.current;
      if (!gridContainer || !moduleElement) return;

      // Update module position to follow cursor
      const x = moveEvent.clientX - offsetX;
      const y = moveEvent.clientY - offsetY;
      moduleElement.style.position = 'fixed';
      moduleElement.style.left = `${x}px`;
      moduleElement.style.top = `${y}px`;
      moduleElement.style.zIndex = '10000';
      moduleElement.style.width = `${rect.width}px`;

      const containerRect = gridContainer.getBoundingClientRect();
      const columnWidth = containerRect.width / 5;
      const relativeX = moveEvent.clientX - containerRect.left;
      const newColumn = Math.max(0, Math.min(4, Math.floor(relativeX / columnWidth)));

      if (newColumn !== currentColumn) {
        currentColumn = newColumn;
        setModulePositions(prev => {
          const next = new Map(prev);
          const currentPos = next.get(moduleId);
          if (currentPos && currentPos.column !== newColumn) {
            // Find row in new column
            const columnModules = Array.from(modules.values()).filter(m => {
              const pos = next.get(m.id);
              return pos && pos.column === newColumn && m.id !== moduleId;
            });
            const newRow = columnModules.length;
            next.set(moduleId, { column: newColumn, row: newRow });
          }
          return next;
        });
      }
    };

    const handleUp = () => {
      if (moduleElement) {
        moduleElement.style.position = '';
        moduleElement.style.left = '';
        moduleElement.style.top = '';
        moduleElement.style.zIndex = '';
        moduleElement.style.width = '';
      }
      setDraggedModule(null);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  };

  // Group modules by column and sort by row
  const modulesByColumn: SynthModule[][] = [[], [], [], [], []];
  modules.forEach((module) => {
    const position = modulePositions.get(module.id);
    if (position !== undefined && position.column >= 0 && position.column < 5) {
      modulesByColumn[position.column].push(module);
    }
  });

  // Sort modules within each column by row
  modulesByColumn.forEach(columnModules => {
    columnModules.sort((a, b) => {
      const posA = modulePositions.get(a.id);
      const posB = modulePositions.get(b.id);
      if (!posA || !posB) return 0;
      return posA.row - posB.row;
    });
  });

  // Debug: log module counts
  if (modules.size > 0 && modulesByColumn.every(col => col.length === 0)) {
    console.warn('Modules exist but not positioned:', Array.from(modules.keys()));
    console.warn('Positions:', Array.from(modulePositions.entries()));
  }

  // Sync state changes to parent
  useEffect(() => {
    if (isLoadingInstrumentRef.current || !onStateChange) return;

    const exportedModules = Array.from(modules.values()).map(module => ({
      id: module.id,
      type: module.type,
      name: module.name,
      enabled: module.enabled,
      parameters: { ...module.parameters },
      position: modulePositions.get(module.id) || { column: 0, row: 0 }
    }));

    // Debounce or just call? For now just call, optimization later if needed
    onStateChange(exportedModules);
  }, [modules, modulePositions, onStateChange]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    exportState: () => {
      return Array.from(modules.values()).map(module => ({
        id: module.id,
        type: module.type,
        name: module.name,
        enabled: module.enabled,
        parameters: { ...module.parameters },
        position: modulePositions.get(module.id) || { column: 0, row: 0 }
      }));
    },
    loadInstrument: (config: InstrumentConfiguration) => {
      if (!moduleManagerRef.current || !audioContext) return;

      isLoadingInstrumentRef.current = true;

      // Clear existing modules
      const allModules = Array.from(modules.keys());
      allModules.forEach(id => {
        if (moduleManagerRef.current) {
          moduleManagerRef.current.removeModule(id);
        }
      });

      // Small delay to ensure removals complete
      setTimeout(() => {
        // Load new modules from config
        const newModules = new Map<string, SynthModule>();
        const newPositions = new Map<string, ModulePosition>();

        config.modules.forEach(moduleConfig => {
          const module = moduleManagerRef.current?.addModule(moduleConfig.type, {
            name: moduleConfig.name,
            enabled: moduleConfig.enabled
          });
          if (module) {
            module.parameters = { ...moduleConfig.parameters };
            newModules.set(module.id, module);
            newPositions.set(module.id, moduleConfig.position);
          }
        });

        setModules(newModules);
        setModulePositions(newPositions);

        // Reset loading flag after state update
        setTimeout(() => {
          isLoadingInstrumentRef.current = false;
        }, 50);
      }, 10);
    }
  }), [modules, modulePositions, audioContext]);

  return (
    <>
      <div className="module-menu-button-container">
        <button
          className="module-menu-btn"
          onClick={() => setMenuOpen(true)}
          title="Add/Remove Modules"
        >
          + MODULES
        </button>
      </div>

      <div ref={gridContainerRef} className="controls-area module-grid">
        {[0, 1, 2, 3, 4].map(columnIndex => (
          <div key={columnIndex} className="module-column" data-column={columnIndex}>
            {modulesByColumn[columnIndex].length > 0 ? (
              modulesByColumn[columnIndex].map(module => (
                <ModulePanel
                  key={module.id}
                  module={module}
                  onToggle={handleModuleToggle}
                  onRemove={handleModuleRemove}
                  onDragStart={handleDragStart}
                  onRef={(el) => {
                    if (el) {
                      moduleRefsRef.current.set(module.id, el);
                    } else {
                      moduleRefsRef.current.delete(module.id);
                    }
                  }}
                  isDragging={draggedModule?.id === module.id}
                />
              ))
            ) : (
              <div style={{ minHeight: '20px' }}></div>
            )}
          </div>
        ))}
      </div>

      {moduleManagerRef.current && (
        <ModuleMenu
          moduleManager={moduleManagerRef.current}
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          onModuleAdd={handleModuleAdd}
          onModuleRemove={handleModuleRemove}
          onModuleToggle={handleModuleToggle}
        />
      )}
    </>
  );
});
