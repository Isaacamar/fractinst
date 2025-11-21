/**
 * Module Layout Manager - Handles draggable module grid system
 * 5-column layout with smart auto-snap positioning
 */

class ModuleLayoutManager {
    constructor() {
        this.columns = 5;
        this.modulePositions = new Map(); // moduleId -> {column, row}
        this.columnHeights = [0, 0, 0, 0, 0]; // Track height of each column
        this.draggedModule = null;
        this.dragOffset = { x: 0, y: 0 };
        this.placeholder = null;

        this.setupGrid();
    }

    /**
     * Setup the grid container
     */
    setupGrid() {
        const controlsArea = document.querySelector('.controls-area');
        if (controlsArea) {
            controlsArea.className = 'controls-area module-grid';

            // Create column containers
            for (let i = 0; i < this.columns; i++) {
                const column = document.createElement('div');
                column.className = 'module-column';
                column.dataset.column = i;
                controlsArea.appendChild(column);
            }
        }
    }

    /**
     * Add a module to the grid
     */
    addModule(moduleId, moduleElement) {
        // Find column with least height
        const targetColumn = this.getShortestColumn();

        // Add to that column
        const columnElement = document.querySelector(`[data-column="${targetColumn}"]`);
        if (columnElement) {
            columnElement.appendChild(moduleElement);

            // Store position
            this.modulePositions.set(moduleId, {
                column: targetColumn,
                row: columnElement.children.length - 1
            });

            // Update column height
            this.updateColumnHeight(targetColumn);
        }

        // Make module draggable
        this.makeDraggable(moduleElement, moduleId);
    }

    /**
     * Remove a module from the grid
     */
    removeModule(moduleId) {
        const position = this.modulePositions.get(moduleId);
        if (position) {
            this.modulePositions.delete(moduleId);
            this.updateColumnHeight(position.column);
        }
    }

    /**
     * Get the column with the least height
     */
    getShortestColumn() {
        let minHeight = Infinity;
        let shortestColumn = 0;

        for (let i = 0; i < this.columns; i++) {
            if (this.columnHeights[i] < minHeight) {
                minHeight = this.columnHeights[i];
                shortestColumn = i;
            }
        }

        return shortestColumn;
    }

    /**
     * Update the height of a column
     */
    updateColumnHeight(columnIndex) {
        const columnElement = document.querySelector(`[data-column="${columnIndex}"]`);
        if (columnElement) {
            this.columnHeights[columnIndex] = columnElement.scrollHeight;
        }
    }

    /**
     * Make a module draggable
     */
    makeDraggable(moduleElement, moduleId) {
        const header = moduleElement.querySelector('.module-header');
        if (!header) return;

        header.style.cursor = 'grab';
        header.dataset.moduleId = moduleId;

        header.addEventListener('mousedown', this.onDragStart.bind(this));
    }

    /**
     * Start dragging a module
     */
    onDragStart(e) {
        // Ignore if clicking on buttons
        if (e.target.classList.contains('module-panel-toggle') ||
            e.target.classList.contains('module-panel-close')) {
            return;
        }

        const header = e.currentTarget;
        const moduleId = header.dataset.moduleId;
        this.draggedModule = document.querySelector(`[data-module-id="${moduleId}"]`);

        if (!this.draggedModule) return;

        // Calculate offset
        const rect = this.draggedModule.getBoundingClientRect();
        this.dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };

        // Add dragging class
        this.draggedModule.classList.add('dragging');
        header.style.cursor = 'grabbing';

        // Create placeholder
        this.createPlaceholder();

        // Attach move and end listeners
        document.addEventListener('mousemove', this.onDragMove.bind(this));
        document.addEventListener('mouseup', this.onDragEnd.bind(this));

        e.preventDefault();
    }

    /**
     * Handle dragging movement
     */
    onDragMove(e) {
        if (!this.draggedModule) return;

        // Move module with cursor
        const x = e.clientX - this.dragOffset.x;
        const y = e.clientY - this.dragOffset.y;

        // Get the controls-area width to calculate module width properly
        const controlsArea = document.querySelector('.controls-area');
        const moduleWidth = controlsArea ? (controlsArea.offsetWidth - 40) / 5 : 200; // 40px for 4 gaps of 10px

        this.draggedModule.style.position = 'fixed';
        this.draggedModule.style.left = x + 'px';
        this.draggedModule.style.top = y + 'px';
        this.draggedModule.style.zIndex = '10000';
        this.draggedModule.style.width = moduleWidth + 'px';

        // Determine target column based on cursor position
        const targetColumn = this.getColumnAtPosition(e.clientX, e.clientY);

        if (targetColumn !== null) {
            this.updatePlaceholderPosition(targetColumn);
        }

        e.preventDefault();
    }

    /**
     * End dragging
     */
    onDragEnd(e) {
        if (!this.draggedModule) return;

        const moduleId = this.draggedModule.dataset.moduleId;
        const targetColumn = this.getColumnAtPosition(e.clientX, e.clientY);

        // Remove dragging styles
        this.draggedModule.style.position = '';
        this.draggedModule.style.left = '';
        this.draggedModule.style.top = '';
        this.draggedModule.style.zIndex = '';
        this.draggedModule.style.width = '';
        this.draggedModule.classList.remove('dragging');

        const header = this.draggedModule.querySelector('.module-header');
        if (header) {
            header.style.cursor = 'grab';
        }

        // Move to target column
        if (targetColumn !== null) {
            this.moveModuleToColumn(moduleId, targetColumn);
        }

        // Remove placeholder
        this.removePlaceholder();

        // Clean up
        this.draggedModule = null;
        document.removeEventListener('mousemove', this.onDragMove.bind(this));
        document.removeEventListener('mouseup', this.onDragEnd.bind(this));

        e.preventDefault();
    }

    /**
     * Get column index at cursor position
     */
    getColumnAtPosition(clientX, clientY) {
        const columns = document.querySelectorAll('.module-column');

        for (let i = 0; i < columns.length; i++) {
            const rect = columns[i].getBoundingClientRect();
            if (clientX >= rect.left && clientX <= rect.right &&
                clientY >= rect.top && clientY <= rect.bottom + 100) {
                return i;
            }
        }

        return null;
    }

    /**
     * Create placeholder element
     */
    createPlaceholder() {
        this.placeholder = document.createElement('div');
        this.placeholder.className = 'module-placeholder';
        this.placeholder.style.height = this.draggedModule.offsetHeight + 'px';
    }

    /**
     * Update placeholder position
     */
    updatePlaceholderPosition(columnIndex) {
        if (!this.placeholder) return;

        const column = document.querySelector(`[data-column="${columnIndex}"]`);
        if (column && !column.contains(this.placeholder)) {
            // Remove from current position
            if (this.placeholder.parentNode) {
                this.placeholder.parentNode.removeChild(this.placeholder);
            }
            // Add to new column
            column.appendChild(this.placeholder);
        }
    }

    /**
     * Remove placeholder
     */
    removePlaceholder() {
        if (this.placeholder && this.placeholder.parentNode) {
            this.placeholder.parentNode.removeChild(this.placeholder);
        }
        this.placeholder = null;
    }

    /**
     * Move module to a specific column
     */
    moveModuleToColumn(moduleId, targetColumn) {
        const moduleElement = document.querySelector(`[data-module-id="${moduleId}"]`);
        const columnElement = document.querySelector(`[data-column="${targetColumn}"]`);

        if (moduleElement && columnElement) {
            // Get old position
            const oldPosition = this.modulePositions.get(moduleId);

            // Remove from old column
            if (moduleElement.parentNode) {
                moduleElement.parentNode.removeChild(moduleElement);
                if (oldPosition) {
                    this.updateColumnHeight(oldPosition.column);
                }
            }

            // Add to new column
            columnElement.appendChild(moduleElement);

            // Update position
            this.modulePositions.set(moduleId, {
                column: targetColumn,
                row: columnElement.children.length - 1
            });

            // Update column heights
            this.updateColumnHeight(targetColumn);

            console.log(`Module ${moduleId} moved to column ${targetColumn}`);
        }
    }

    /**
     * Rebalance all modules across columns (optional)
     */
    rebalanceColumns() {
        const allModules = Array.from(document.querySelectorAll('.module-panel'));

        // Clear all columns
        document.querySelectorAll('.module-column').forEach(col => {
            col.innerHTML = '';
        });

        // Reset column heights
        this.columnHeights = [0, 0, 0, 0, 0];
        this.modulePositions.clear();

        // Re-add all modules
        allModules.forEach(module => {
            const moduleId = module.dataset.moduleId;
            if (moduleId) {
                this.addModule(moduleId, module);
            }
        });
    }
}

// Global layout manager instance
const moduleLayoutManager = new ModuleLayoutManager();
