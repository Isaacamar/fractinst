/**
 * Module Menu - Modal for browsing and managing modules
 */

import React, { useEffect, useState } from 'react';
import { ModuleManager, SynthModule } from '../../systems/ModuleManager';
import './ModuleMenu.css';

interface ModuleMenuProps {
  moduleManager: ModuleManager;
  isOpen: boolean;
  onClose: () => void;
  onModuleAdd: (type: string) => void;
  onModuleRemove: (moduleId: string) => void;
  onModuleToggle: (moduleId: string, enabled: boolean) => void;
}

export const ModuleMenu: React.FC<ModuleMenuProps> = ({
  moduleManager,
  isOpen,
  onClose,
  onModuleAdd,
  onModuleRemove,
  onModuleToggle
}) => {
  const [activeModules, setActiveModules] = useState<SynthModule[]>([]);

  useEffect(() => {
    if (isOpen) {
      setActiveModules(moduleManager.getAllModules());
    }
  }, [isOpen, moduleManager]);

  useEffect(() => {
    const updateActiveModules = () => {
      setActiveModules(moduleManager.getAllModules());
    };

    moduleManager.on('moduleAdded', updateActiveModules);
    moduleManager.on('moduleRemoved', updateActiveModules);
    moduleManager.on('moduleToggled', updateActiveModules);

    return () => {
      // Cleanup listeners if needed
    };
  }, [moduleManager]);

  if (!isOpen) return null;

  const availableModules = moduleManager.getAvailableModules();
  
  // Group by category
  const categories: Record<string, typeof availableModules> = {};
  availableModules.forEach(module => {
    if (!categories[module.category]) {
      categories[module.category] = [];
    }
    categories[module.category].push(module);
  });

  const getModuleIcon = (type: string): string => {
    const icons: Record<string, string> = {
      'oscillator-base': '~',
      'voice-base': '♪',
      'adsr-base': '▲',
      'filter-env-base': '◆',
      'filter-base': '⚡',
      'distortion-base': '⚠',
      'lfo-base': '⟿'
    };
    return icons[type] || '◆';
  };

  return (
    <div className="module-menu-modal" onClick={(e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }}>
      <div className="module-menu-content" onClick={(e) => e.stopPropagation()}>
        <div className="module-menu-header">
          <h2>MODULE BROWSER</h2>
          <button className="module-menu-close" onClick={onClose}>✕</button>
        </div>

        <div className="module-menu-body">
          <div className="module-categories">
            <h3>AVAILABLE MODULES</h3>
            <div className="module-list">
              {Object.entries(categories).map(([category, modules]) => (
                <div key={category} className="module-category">
                  <h4>{category.toUpperCase()}</h4>
                  {modules.map(module => (
                    <div key={module.type} className="module-item">
                      <span className="module-icon">{module.icon}</span>
                      <div className="module-info">
                        <div className="module-name">{module.name}</div>
                        <div className="module-desc">{module.description}</div>
                      </div>
                      <button
                        className="module-add-btn"
                        onClick={() => onModuleAdd(module.type)}
                        title={`Add ${module.name}`}
                      >
                        +
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="active-modules">
            <h3>ACTIVE MODULES</h3>
            <div className="active-module-list">
              {activeModules.length === 0 ? (
                <p className="no-modules">No active modules</p>
              ) : (
                activeModules.map(module => (
                  <div key={module.id} className="active-module-item">
                    <span className="module-icon">{getModuleIcon(module.type)}</span>
                    <div className="module-info">
                      <div className="module-name">{module.name}</div>
                      <div className="module-id">ID: {module.id.substr(0, 8)}...</div>
                    </div>
                    <div className="module-controls">
                      <button
                        className={`module-toggle-btn ${module.enabled ? 'active' : ''}`}
                        onClick={() => onModuleToggle(module.id, !module.enabled)}
                        title={module.enabled ? 'Disable' : 'Enable'}
                      >
                        {module.enabled ? '●' : '○'}
                      </button>
                      <button
                        className="module-remove-btn"
                        onClick={() => onModuleRemove(module.id)}
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

