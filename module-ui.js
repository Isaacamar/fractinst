/**
 * Module UI - User interface for the module system
 * Displays module menu and manages module panels
 */

class ModuleUI {
    constructor(moduleManager, layoutManager) {
        this.moduleManager = moduleManager;
        this.layoutManager = layoutManager;
        this.menuOpen = false;
        this.activeModulePanels = new Map();

        this.createModuleMenu();
        this.attachEvents();
    }

    /**
     * Create the module menu UI
     */
    createModuleMenu() {
        // Create module menu button
        const menuButton = document.createElement('button');
        menuButton.id = 'module-menu-btn';
        menuButton.className = 'module-menu-btn';
        menuButton.innerHTML = '+ MODULES';
        menuButton.title = 'Add/Remove Modules';

        // Add to transport bar
        const octaveControls = document.querySelector('.octave-controls');
        if (octaveControls) {
            octaveControls.appendChild(menuButton);
        }

        // Create module menu modal
        const menuModal = document.createElement('div');
        menuModal.id = 'module-menu-modal';
        menuModal.className = 'module-menu-modal';
        menuModal.style.display = 'none';

        menuModal.innerHTML = `
            <div class="module-menu-content">
                <div class="module-menu-header">
                    <h2>MODULE BROWSER</h2>
                    <button id="module-menu-close" class="module-menu-close">✕</button>
                </div>

                <div class="module-menu-body">
                    <div class="module-categories">
                        <h3>AVAILABLE MODULES</h3>
                        <div id="module-list" class="module-list"></div>
                    </div>

                    <div class="active-modules">
                        <h3>ACTIVE MODULES</h3>
                        <div id="active-module-list" class="active-module-list"></div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(menuModal);

        this.menuButton = menuButton;
        this.menuModal = menuModal;

        // Populate module list
        this.updateModuleList();
        this.updateActiveModuleList();
    }

    /**
     * Update available modules list
     */
    updateModuleList() {
        const moduleList = document.getElementById('module-list');
        if (!moduleList) return;

        const availableModules = this.moduleManager.getAvailableModules();

        // Group by category
        const categories = {};
        availableModules.forEach(module => {
            if (!categories[module.category]) {
                categories[module.category] = [];
            }
            categories[module.category].push(module);
        });

        moduleList.innerHTML = '';

        Object.entries(categories).forEach(([category, modules]) => {
            const categorySection = document.createElement('div');
            categorySection.className = 'module-category';

            const categoryTitle = document.createElement('h4');
            categoryTitle.textContent = category.toUpperCase();
            categorySection.appendChild(categoryTitle);

            modules.forEach(module => {
                const moduleItem = document.createElement('div');
                moduleItem.className = 'module-item';
                moduleItem.innerHTML = `
                    <span class="module-icon">${module.icon}</span>
                    <div class="module-info">
                        <div class="module-name">${module.name}</div>
                        <div class="module-desc">${module.description}</div>
                    </div>
                    <button class="module-add-btn" data-module-type="${module.type}">+</button>
                `;

                categorySection.appendChild(moduleItem);
            });

            moduleList.appendChild(categorySection);
        });

        // Attach add button events
        moduleList.querySelectorAll('.module-add-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const moduleType = e.target.dataset.moduleType;
                this.addModule(moduleType);
            });
        });
    }

    /**
     * Update active modules list
     */
    updateActiveModuleList() {
        const activeList = document.getElementById('active-module-list');
        if (!activeList) return;

        const activeModules = this.moduleManager.getAllModules();

        if (activeModules.length === 0) {
            activeList.innerHTML = '<p class="no-modules">No active modules</p>';
            return;
        }

        activeList.innerHTML = '';

        activeModules.forEach(module => {
            const moduleItem = document.createElement('div');
            moduleItem.className = 'active-module-item';
            moduleItem.innerHTML = `
                <span class="module-icon">${this.getModuleIcon(module.type)}</span>
                <div class="module-info">
                    <div class="module-name">${module.name}</div>
                    <div class="module-id">ID: ${module.id.substr(0, 8)}...</div>
                </div>
                <div class="module-controls">
                    <button class="module-toggle-btn ${module.enabled ? 'active' : ''}"
                            data-module-id="${module.id}"
                            title="${module.enabled ? 'Disable' : 'Enable'}">
                        ${module.enabled ? '●' : '○'}
                    </button>
                    <button class="module-remove-btn"
                            data-module-id="${module.id}"
                            title="Remove">
                        ✕
                    </button>
                </div>
            `;

            activeList.appendChild(moduleItem);
        });

        // Attach control button events
        activeList.querySelectorAll('.module-toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const moduleId = e.target.dataset.moduleId;
                const module = this.moduleManager.getModule(moduleId);
                this.moduleManager.toggleModule(moduleId, !module.enabled);
                this.updateActiveModuleList();
                this.updateModulePanels();
            });
        });

        activeList.querySelectorAll('.module-remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const moduleId = e.target.dataset.moduleId;
                this.removeModule(moduleId);
            });
        });
    }

    /**
     * Get module icon by type
     */
    getModuleIcon(type) {
        const icons = {
            vco: '~',
            filter: '⚡',
            lfo: '⟿',
            distortion: '⚠'
        };
        return icons[type] || '◆';
    }

    /**
     * Add a module
     */
    addModule(type) {
        const module = this.moduleManager.addModule(type);
        if (module) {
            this.updateActiveModuleList();
            this.createModulePanel(module);
        }
    }

    /**
     * Remove a module
     */
    removeModule(moduleId) {
        this.removeModulePanel(moduleId);
        this.moduleManager.removeModule(moduleId);
        this.updateActiveModuleList();
    }

    /**
     * Create a panel for a module in the UI
     */
    createModulePanel(module) {
        const panel = document.createElement('div');
        panel.className = `module-panel ${module.enabled ? '' : 'disabled'}`;
        panel.id = `module-panel-${module.id}`;
        panel.dataset.moduleId = module.id;

        // Get module content from createUI if available
        const moduleContent = module.createUI ? module.createUI() : '<p class="module-placeholder">Module parameters and controls</p>';

        panel.innerHTML = `
            <div class="module">
                <div class="module-header" data-module-id="${module.id}">
                    <span class="module-title">${module.name}</span>
                    <div class="module-header-controls">
                        <button class="module-panel-toggle" data-module-id="${module.id}" title="${module.enabled ? 'Disable' : 'Enable'}">
                            ${module.enabled ? '●' : '○'}
                        </button>
                        <button class="module-panel-close" data-module-id="${module.id}" title="Remove">✕</button>
                    </div>
                </div>
                <div class="module-content" id="module-content-${module.id}">
                    ${moduleContent}
                </div>
            </div>
        `;

        // Add to layout manager (it will place in appropriate column)
        this.layoutManager.addModule(module.id, panel);
        this.activeModulePanels.set(module.id, panel);

        // Attach panel control events
        panel.querySelector('.module-panel-toggle').addEventListener('click', (e) => {
            e.stopPropagation(); // Don't trigger drag
            const moduleId = e.target.dataset.moduleId;
            const mod = this.moduleManager.getModule(moduleId);
            this.moduleManager.toggleModule(moduleId, !mod.enabled);
            this.updateModulePanels();
            this.updateActiveModuleList();
        });

        panel.querySelector('.module-panel-close').addEventListener('click', (e) => {
            e.stopPropagation(); // Don't trigger drag
            const moduleId = e.target.dataset.moduleId;
            this.removeModule(moduleId);
        });

        // Initialize knobs if they exist in this module
        if (window.initializeKnobs) {
            window.initializeKnobs();
        }
    }

    /**
     * Remove a module panel
     */
    removeModulePanel(moduleId) {
        const panel = this.activeModulePanels.get(moduleId);
        if (panel && panel.parentNode) {
            panel.parentNode.removeChild(panel);
        }
        this.activeModulePanels.delete(moduleId);
        this.layoutManager.removeModule(moduleId);
    }

    /**
     * Update all module panels (enabled/disabled state)
     */
    updateModulePanels() {
        this.activeModulePanels.forEach((panel, moduleId) => {
            const module = this.moduleManager.getModule(moduleId);
            if (module) {
                if (module.enabled) {
                    panel.classList.remove('disabled');
                } else {
                    panel.classList.add('disabled');
                }

                const toggleBtn = panel.querySelector('.module-panel-toggle');
                if (toggleBtn) {
                    toggleBtn.textContent = module.enabled ? '●' : '○';
                }
            }
        });
    }

    /**
     * Attach event listeners
     */
    attachEvents() {
        // Menu button click
        this.menuButton.addEventListener('click', () => {
            this.toggleMenu();
        });

        // Close button click
        document.addEventListener('click', (e) => {
            if (e.target.id === 'module-menu-close') {
                this.closeMenu();
            }
            // Close when clicking outside
            if (e.target.id === 'module-menu-modal') {
                this.closeMenu();
            }
        });

        // ESC to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.menuOpen) {
                this.closeMenu();
            }
        });

        // Listen to module manager events
        this.moduleManager.on('moduleAdded', () => {
            this.updateActiveModuleList();
        });

        this.moduleManager.on('moduleRemoved', () => {
            this.updateActiveModuleList();
        });

        this.moduleManager.on('moduleToggled', () => {
            this.updateActiveModuleList();
        });
    }

    /**
     * Toggle menu visibility
     */
    toggleMenu() {
        if (this.menuOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    /**
     * Open the menu
     */
    openMenu() {
        this.menuModal.style.display = 'flex';
        this.menuOpen = true;
        this.updateModuleList();
        this.updateActiveModuleList();
    }

    /**
     * Close the menu
     */
    closeMenu() {
        this.menuModal.style.display = 'none';
        this.menuOpen = false;
    }
}
