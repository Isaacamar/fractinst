/**
 * Rotary Knob Control
 */

class Knob {
    constructor(element, options = {}) {
        this.element = element;
        this.param = element.dataset.param;
        
        // Configuration
        this.min = options.min !== undefined ? options.min : 0;
        this.max = options.max !== undefined ? options.max : 100;
        this.step = options.step !== undefined ? options.step : 1;
        this.value = options.value !== undefined ? options.value : this.min;
        this.formatValue = options.formatValue || ((v) => Math.round(v));
        this.onChange = options.onChange || (() => {});
        
        this.indicator = element.querySelector('.knob-indicator');
        this.valueDisplay = element.querySelector('.knob-value');
        
        this.isDragging = false;
        this.lastY = 0;
        
        this.setValue(this.value);
        this.attachEvents();
    }
    
    attachEvents() {
        this.element.addEventListener('mousedown', this.onMouseDown.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));
        
        // Touch events
        this.element.addEventListener('touchstart', this.onTouchStart.bind(this));
        document.addEventListener('touchmove', this.onTouchMove.bind(this));
        document.addEventListener('touchend', this.onTouchEnd.bind(this));
        
        // Wheel events for fine control
        this.element.addEventListener('wheel', this.onWheel.bind(this));
    }
    
    onMouseDown(e) {
        e.preventDefault();
        this.isDragging = true;
        this.lastY = e.clientY;
        this.element.style.cursor = 'grabbing';
    }
    
    onMouseMove(e) {
        if (!this.isDragging) return;
        
        const deltaY = this.lastY - e.clientY;
        this.adjustValue(deltaY);
        this.lastY = e.clientY;
    }
    
    onMouseUp() {
        this.isDragging = false;
        this.element.style.cursor = 'grab';
    }
    
    onTouchStart(e) {
        e.preventDefault();
        this.isDragging = true;
        this.lastY = e.touches[0].clientY;
    }
    
    onTouchMove(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        
        const deltaY = this.lastY - e.touches[0].clientY;
        this.adjustValue(deltaY);
        this.lastY = e.touches[0].clientY;
    }
    
    onTouchEnd() {
        this.isDragging = false;
    }
    
    onWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -this.step : this.step;
        this.adjustValue(delta * 5);
    }
    
    adjustValue(delta) {
        const sensitivity = 0.5;
        const change = delta * sensitivity * this.step;
        const newValue = this.value + change;
        this.setValue(newValue);
    }
    
    setValue(newValue) {
        this.value = Math.max(this.min, Math.min(this.max, newValue));
        
        // Update visual indicator
        const range = this.max - this.min;
        const normalized = (this.value - this.min) / range;
        const angle = normalized * 270 - 135; // -135 to 135 degrees
        
        this.indicator.style.transform = `translateX(-50%) rotate(${angle}deg)`;
        
        // Update value display
        this.valueDisplay.textContent = this.formatValue(this.value);
        
        // Call onChange callback
        this.onChange(this.value);
    }
    
    getValue() {
        return this.value;
    }
}

