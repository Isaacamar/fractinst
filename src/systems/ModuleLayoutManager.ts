/**
 * Module Layout Manager - Handles draggable module grid system
 * 5-column layout with smart auto-snap positioning
 * TypeScript version of module-layout.js
 */

export interface ModulePosition {
  column: number;
  row: number;
}

export class ModuleLayoutManager {
  private columns = 5;
  private modulePositions = new Map<string, ModulePosition>();
  private columnHeights: number[] = [0, 0, 0, 0, 0];
  private draggedModule: HTMLElement | null = null;
  private dragOffset = { x: 0, y: 0 };
  private placeholder: HTMLElement | null = null;
  private gridContainer: HTMLElement | null = null;

  constructor() {
    this.setupGrid();
  }

  setGridContainer(container: HTMLElement) {
    this.gridContainer = container;
    this.setupGrid();
  }

  private setupGrid() {
    if (!this.gridContainer) return;

    this.gridContainer.className = 'controls-area module-grid';

    // Clear existing columns
    this.gridContainer.innerHTML = '';

    // Create column containers
    for (let i = 0; i < this.columns; i++) {
      const column = document.createElement('div');
      column.className = 'module-column';
      column.setAttribute('data-column', i.toString());
      this.gridContainer.appendChild(column);
    }
  }

  addModule(moduleId: string, moduleElement: HTMLElement) {
    const targetColumn = this.getShortestColumn();
    const columnElement = this.gridContainer?.querySelector(`[data-column="${targetColumn}"]`) as HTMLElement;
    
    if (columnElement) {
      columnElement.appendChild(moduleElement);

      this.modulePositions.set(moduleId, {
        column: targetColumn,
        row: columnElement.children.length - 1
      });

      this.updateColumnHeight(targetColumn);
    }

    this.makeDraggable(moduleElement, moduleId);
  }

  removeModule(moduleId: string) {
    const position = this.modulePositions.get(moduleId);
    if (position) {
      this.modulePositions.delete(moduleId);
      this.updateColumnHeight(position.column);
    }
  }

  private getShortestColumn(): number {
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

  private updateColumnHeight(columnIndex: number) {
    const columnElement = this.gridContainer?.querySelector(`[data-column="${columnIndex}"]`) as HTMLElement;
    if (columnElement) {
      this.columnHeights[columnIndex] = columnElement.scrollHeight;
    }
  }

  private makeDraggable(moduleElement: HTMLElement, moduleId: string) {
    const header = moduleElement.querySelector('.module-header') as HTMLElement;
    if (!header) return;

    header.style.cursor = 'grab';
    header.setAttribute('data-module-id', moduleId);

    header.addEventListener('mousedown', this.onDragStart.bind(this));
  }

  private onDragStart(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.classList.contains('module-panel-toggle') ||
        target.classList.contains('module-panel-close')) {
      return;
    }

    const header = e.currentTarget as HTMLElement;
    const moduleId = header.getAttribute('data-module-id');
    if (!moduleId) return;

    this.draggedModule = this.gridContainer?.querySelector(`[data-module-id="${moduleId}"]`) as HTMLElement;
    if (!this.draggedModule) return;

    const rect = this.draggedModule.getBoundingClientRect();
    this.dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    this.draggedModule.classList.add('dragging');
    header.style.cursor = 'grabbing';

    this.createPlaceholder();

    document.addEventListener('mousemove', this.onDragMove);
    document.addEventListener('mouseup', this.onDragEnd);

    e.preventDefault();
  }

  private onDragMove = (e: MouseEvent) => {
    if (!this.draggedModule) return;

    const x = e.clientX - this.dragOffset.x;
    const y = e.clientY - this.dragOffset.y;

    const moduleWidth = this.gridContainer 
      ? (this.gridContainer.offsetWidth - 40) / 5 
      : 200;

    this.draggedModule.style.position = 'fixed';
    this.draggedModule.style.left = x + 'px';
    this.draggedModule.style.top = y + 'px';
    this.draggedModule.style.zIndex = '10000';
    this.draggedModule.style.width = moduleWidth + 'px';

    const targetColumn = this.getColumnAtPosition(e.clientX, e.clientY);
    if (targetColumn !== null) {
      this.updatePlaceholderPosition(targetColumn);
    }

    e.preventDefault();
  };

  private onDragEnd = (e: MouseEvent) => {
    if (!this.draggedModule) return;

    const moduleId = this.draggedModule.getAttribute('data-module-id');
    if (!moduleId) return;

    const targetColumn = this.getColumnAtPosition(e.clientX, e.clientY);

    this.draggedModule.style.position = '';
    this.draggedModule.style.left = '';
    this.draggedModule.style.top = '';
    this.draggedModule.style.zIndex = '';
    this.draggedModule.style.width = '';
    this.draggedModule.classList.remove('dragging');

    const header = this.draggedModule.querySelector('.module-header') as HTMLElement;
    if (header) {
      header.style.cursor = 'grab';
    }

    if (targetColumn !== null) {
      this.moveModuleToColumn(moduleId, targetColumn);
    }

    this.removePlaceholder();

    this.draggedModule = null;
    document.removeEventListener('mousemove', this.onDragMove);
    document.removeEventListener('mouseup', this.onDragEnd);

    e.preventDefault();
  };

  private getColumnAtPosition(clientX: number, clientY: number): number | null {
    const columns = this.gridContainer?.querySelectorAll('.module-column');
    if (!columns) return null;

    for (let i = 0; i < columns.length; i++) {
      const rect = columns[i].getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right &&
          clientY >= rect.top && clientY <= rect.bottom + 100) {
        return i;
      }
    }

    return null;
  }

  private createPlaceholder() {
    if (!this.draggedModule) return;

    this.placeholder = document.createElement('div');
    this.placeholder.className = 'module-placeholder';
    this.placeholder.style.height = this.draggedModule.offsetHeight + 'px';
  }

  private updatePlaceholderPosition(columnIndex: number) {
    if (!this.placeholder) return;

    const column = this.gridContainer?.querySelector(`[data-column="${columnIndex}"]`) as HTMLElement;
    if (column && !column.contains(this.placeholder)) {
      if (this.placeholder.parentNode) {
        this.placeholder.parentNode.removeChild(this.placeholder);
      }
      column.appendChild(this.placeholder);
    }
  }

  private removePlaceholder() {
    if (this.placeholder && this.placeholder.parentNode) {
      this.placeholder.parentNode.removeChild(this.placeholder);
    }
    this.placeholder = null;
  }

  private moveModuleToColumn(moduleId: string, targetColumn: number) {
    const moduleElement = this.gridContainer?.querySelector(`[data-module-id="${moduleId}"]`) as HTMLElement;
    const columnElement = this.gridContainer?.querySelector(`[data-column="${targetColumn}"]`) as HTMLElement;

    if (moduleElement && columnElement) {
      const oldPosition = this.modulePositions.get(moduleId);

      if (moduleElement.parentNode) {
        moduleElement.parentNode.removeChild(moduleElement);
        if (oldPosition) {
          this.updateColumnHeight(oldPosition.column);
        }
      }

      columnElement.appendChild(moduleElement);

      this.modulePositions.set(moduleId, {
        column: targetColumn,
        row: columnElement.children.length - 1
      });

      this.updateColumnHeight(targetColumn);

      console.log(`Module ${moduleId} moved to column ${targetColumn}`);
    }
  }
}

