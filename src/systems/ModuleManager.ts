/**
 * Module Manager - Manages all active modules
 * TypeScript version of module-system.js
 */

export interface SynthModule {
  id: string;
  type: string;
  name: string;
  enabled: boolean;
  parameters: Record<string, any>;
  inputs: AudioNode[];
  outputs: AudioNode[];
  uiElement: HTMLElement | null;
  initialize?: (audioContext: AudioContext) => void;
  onParameterChange?: (name: string, value: any) => void;
  onEnabledChange?: (enabled: boolean) => void;
  createUI?: () => string;
  dispose?: () => void;
}

export interface ModuleDefinition {
  name: string;
  description: string;
  category: string;
  icon: string;
  isBaseModule?: boolean;
  createInstance: (options?: any) => SynthModule;
}

type ModuleEvent = 'moduleAdded' | 'moduleRemoved' | 'moduleToggled';

export class ModuleManager {
  private modules = new Map<string, SynthModule>();
  private moduleDefinitions = new Map<string, ModuleDefinition>();
  private audioContext: AudioContext | null = null;
  private listeners: Record<ModuleEvent, Array<(data: any) => void>> = {
    moduleAdded: [],
    moduleRemoved: [],
    moduleToggled: []
  };

  setAudioContext(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  registerModuleType(type: string, definition: ModuleDefinition) {
    this.moduleDefinitions.set(type, definition);
  }

  getAvailableModules() {
    return Array.from(this.moduleDefinitions.entries()).map(([type, def]) => ({
      type,
      name: def.name,
      description: def.description,
      category: def.category,
      icon: def.icon
    }));
  }

  addModule(type: string, options: any = {}): SynthModule | null {
    const definition = this.moduleDefinitions.get(type);
    if (!definition) {
      console.error(`Module type "${type}" not registered`);
      return null;
    }

    const module = definition.createInstance(options);

    if (this.audioContext && module.initialize) {
      module.initialize(this.audioContext);
    }

    this.modules.set(module.id, module);
    this.emit('moduleAdded', module);

    console.log(`Module added: ${module.name} (${module.id})`);
    return module;
  }

  removeModule(moduleId: string): boolean {
    const module = this.modules.get(moduleId);
    if (!module) {
      console.error(`Module "${moduleId}" not found`);
      return false;
    }

    if (module.dispose) {
      module.dispose();
    }

    this.modules.delete(moduleId);
    this.emit('moduleRemoved', module);

    console.log(`Module removed: ${module.name} (${module.id})`);
    return true;
  }

  toggleModule(moduleId: string, enabled: boolean): boolean {
    const module = this.modules.get(moduleId);
    if (!module) {
      console.error(`Module "${moduleId}" not found`);
      return false;
    }

    module.enabled = enabled;
    if (module.onEnabledChange) {
      module.onEnabledChange(enabled);
    }

    this.emit('moduleToggled', { module, enabled });
    console.log(`Module ${enabled ? 'enabled' : 'disabled'}: ${module.name}`);
    return true;
  }

  getModule(moduleId: string): SynthModule | undefined {
    return this.modules.get(moduleId);
  }

  getModulesByType(type: string): SynthModule[] {
    return Array.from(this.modules.values()).filter(m => m.type === type);
  }

  getAllModules(): SynthModule[] {
    return Array.from(this.modules.values());
  }

  on(event: ModuleEvent, callback: (data: any) => void) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  private emit(event: ModuleEvent, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  clearAll() {
    this.modules.forEach(module => {
      if (module.dispose) {
        module.dispose();
      }
    });
    this.modules.clear();
  }
}

