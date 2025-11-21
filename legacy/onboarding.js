/**
 * Onboarding Sequence - First-time user tutorial
 * Simple, intuitive guide to the interface
 */

class Onboarding {
    constructor() {
        this.currentStep = 0;
        this.steps = [];
        this.overlay = null;
        this.tooltip = null;
        this.hasSeenOnboarding = localStorage.getItem('fractinst-onboarding-seen') === 'true';
    }

    /**
     * Initialize onboarding steps
     */
    init() {
        this.steps = [
            {
                title: 'Welcome to FractInst!',
                content: 'A browser-based synthesizer and mini-DAW. Let\'s take a quick tour of the features.',
                target: null,
                position: 'center'
            },
            {
                title: 'QWERTY Keyboard',
                content: 'Play notes using your computer keyboard! Q = C, W = C#, E = D, etc. Try pressing some keys. Click the keyboard button (⌨) in the top right to see all available keys and their mappings.',
                target: '#keyboard-help-btn',
                position: 'bottom'
            },
            {
                title: 'Transport Controls',
                content: 'Play, Stop, and Record buttons control the DAW. Note: Transport controls and recording are still being worked on and may not be fully functional yet.',
                target: '.transport-controls',
                position: 'bottom'
            },
            {
                title: 'Sound Design Modules',
                content: 'The modules system lets you organize and customize your synth layout. You can drag modules around and add/remove them. Use the knobs in each module to tweak your sound.',
                target: '.controls-area',
                position: 'left'
            },
            {
                title: 'Sound Design',
                content: 'Use the knobs to tweak your sound - oscillator type, filter, envelope, LFO, and effects. Each module controls different aspects of the synth.',
                target: '.controls-area',
                position: 'left'
            },
            {
                title: 'Piano Roll',
                content: 'Click "ROLL" to switch to the sequencer view. The piano roll UI is there, but recording and playback are still being worked on.',
                target: '#view-piano-roll-btn',
                position: 'bottom'
            },
            {
                title: 'Oscilloscope',
                content: 'Watch your waveform in real-time. The bars show the shape of your sound.',
                target: '.oscilloscope-module',
                position: 'right'
            },
            {
                title: 'You\'re All Set!',
                content: 'Start playing around! Remember: Click anywhere first to enable audio, then start making music. The synth works great, but some DAW features are still in progress.',
                target: null,
                position: 'center'
            }
        ];
    }

    /**
     * Start the onboarding sequence
     */
    start() {
        if (this.hasSeenOnboarding) {
            return; // Don't show if already seen
        }

        this.createOverlay();
        this.showStep(0);
    }

    /**
     * Create overlay and tooltip elements
     */
    createOverlay() {
        // Create dark overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'onboarding-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 10000;
            pointer-events: none;
        `;
        document.body.appendChild(this.overlay);

        // Create tooltip
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'onboarding-tooltip';
        this.tooltip.style.cssText = `
            position: fixed;
            background: #1a1a1a;
            border: 2px solid #00ff88;
            border-radius: 8px;
            padding: 20px;
            max-width: 400px;
            z-index: 10001;
            pointer-events: auto;
            box-shadow: 0 4px 20px rgba(0, 255, 136, 0.3);
            color: #fff;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        `;
        document.body.appendChild(this.tooltip);

        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: transparent;
            border: none;
            color: #00ff88;
            font-size: 24px;
            cursor: pointer;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 4px;
        `;
        closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(0, 255, 136, 0.2)';
        closeBtn.onmouseout = () => closeBtn.style.background = 'transparent';
        closeBtn.onclick = () => this.skip();
        this.tooltip.appendChild(closeBtn);
    }

    /**
     * Show a specific step
     */
    showStep(stepIndex) {
        if (stepIndex >= this.steps.length) {
            this.complete();
            return;
        }

        this.currentStep = stepIndex;
        const step = this.steps[stepIndex];

        // Update tooltip content
        const titleEl = document.createElement('h3');
        titleEl.textContent = step.title;
        titleEl.style.cssText = `
            margin: 0 0 10px 0;
            color: #00ff88;
            font-size: 18px;
        `;

        const contentEl = document.createElement('p');
        contentEl.textContent = step.content;
        contentEl.style.cssText = `
            margin: 0 0 20px 0;
            line-height: 1.5;
            color: #ccc;
        `;

        // Clear previous content
        this.tooltip.innerHTML = '';
        this.tooltip.appendChild(titleEl);
        this.tooltip.appendChild(contentEl);

        // Add navigation buttons
        const navContainer = document.createElement('div');
        navContainer.style.cssText = `
            display: flex;
            justify-content: space-between;
            gap: 10px;
            margin-top: 20px;
        `;

        // Skip button
        const skipBtn = document.createElement('button');
        skipBtn.textContent = 'Skip Tour';
        skipBtn.style.cssText = `
            background: transparent;
            border: 1px solid #666;
            color: #999;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        `;
        skipBtn.onmouseover = () => {
            skipBtn.style.borderColor = '#999';
            skipBtn.style.color = '#fff';
        };
        skipBtn.onmouseout = () => {
            skipBtn.style.borderColor = '#666';
            skipBtn.style.color = '#999';
        };
        skipBtn.onclick = () => this.skip();

        // Navigation buttons
        const navButtons = document.createElement('div');
        navButtons.style.cssText = 'display: flex; gap: 10px;';

        if (stepIndex > 0) {
            const prevBtn = document.createElement('button');
            prevBtn.textContent = '← Previous';
            prevBtn.style.cssText = `
                background: #333;
                border: 1px solid #00ff88;
                color: #00ff88;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            `;
            prevBtn.onmouseover = () => prevBtn.style.background = '#00ff8820';
            prevBtn.onmouseout = () => prevBtn.style.background = '#333';
            prevBtn.onclick = () => this.showStep(stepIndex - 1);
            navButtons.appendChild(prevBtn);
        }

        const nextBtn = document.createElement('button');
        nextBtn.textContent = stepIndex === this.steps.length - 1 ? 'Got it!' : 'Next →';
        nextBtn.style.cssText = `
            background: #00ff88;
            border: 1px solid #00ff88;
            color: #000;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
        `;
        nextBtn.onmouseover = () => nextBtn.style.background = '#00cc6a';
        nextBtn.onmouseout = () => nextBtn.style.background = '#00ff88';
        nextBtn.onclick = () => this.showStep(stepIndex + 1);
        navButtons.appendChild(nextBtn);

        navContainer.appendChild(skipBtn);
        navContainer.appendChild(navButtons);
        this.tooltip.appendChild(navContainer);

        // Position tooltip
        this.positionTooltip(step);

        // Highlight target element
        this.highlightTarget(step.target);
    }

    /**
     * Position tooltip relative to target or center
     */
    positionTooltip(step) {
        if (!step.target) {
            // Center position
            this.tooltip.style.top = '50%';
            this.tooltip.style.left = '50%';
            this.tooltip.style.transform = 'translate(-50%, -50%)';
            return;
        }

        const targetEl = document.querySelector(step.target);
        if (!targetEl) {
            // Fallback to center if target not found
            this.tooltip.style.top = '50%';
            this.tooltip.style.left = '50%';
            this.tooltip.style.transform = 'translate(-50%, -50%)';
            return;
        }

        const rect = targetEl.getBoundingClientRect();
        const tooltipRect = this.tooltip.getBoundingClientRect();
        const padding = 20;

        switch (step.position) {
            case 'right':
                this.tooltip.style.top = `${rect.top + rect.height / 2 - tooltipRect.height / 2}px`;
                this.tooltip.style.left = `${rect.right + padding}px`;
                this.tooltip.style.transform = 'none';
                break;
            case 'left':
                this.tooltip.style.top = `${rect.top + rect.height / 2 - tooltipRect.height / 2}px`;
                this.tooltip.style.left = `${rect.left - tooltipRect.width - padding}px`;
                this.tooltip.style.transform = 'none';
                break;
            case 'bottom':
                this.tooltip.style.top = `${rect.bottom + padding}px`;
                this.tooltip.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`;
                this.tooltip.style.transform = 'none';
                break;
            case 'top':
                this.tooltip.style.top = `${rect.top - tooltipRect.height - padding}px`;
                this.tooltip.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`;
                this.tooltip.style.transform = 'none';
                break;
            default:
                this.tooltip.style.top = `${rect.bottom + padding}px`;
                this.tooltip.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`;
                this.tooltip.style.transform = 'none';
        }

        // Ensure tooltip stays in viewport
        const tooltipRectFinal = this.tooltip.getBoundingClientRect();
        if (tooltipRectFinal.right > window.innerWidth) {
            this.tooltip.style.left = `${window.innerWidth - tooltipRectFinal.width - padding}px`;
        }
        if (tooltipRectFinal.left < 0) {
            this.tooltip.style.left = `${padding}px`;
        }
        if (tooltipRectFinal.bottom > window.innerHeight) {
            this.tooltip.style.top = `${window.innerHeight - tooltipRectFinal.height - padding}px`;
        }
        if (tooltipRectFinal.top < 0) {
            this.tooltip.style.top = `${padding}px`;
        }
    }

    /**
     * Highlight target element
     */
    highlightTarget(selector) {
        // Remove previous highlights
        const previousHighlights = document.querySelectorAll('.onboarding-highlight');
        previousHighlights.forEach(el => {
            el.style.outline = '';
            el.style.outlineOffset = '';
            el.classList.remove('onboarding-highlight');
        });

        if (!selector) return;

        const targetEl = document.querySelector(selector);
        if (targetEl) {
            targetEl.style.outline = '3px solid #00ff88';
            targetEl.style.outlineOffset = '4px';
            targetEl.style.transition = 'outline 0.2s ease';
            targetEl.classList.add('onboarding-highlight');
            
            // Scroll into view if needed
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    /**
     * Complete onboarding
     */
    complete() {
        localStorage.setItem('fractinst-onboarding-seen', 'true');
        this.cleanup();
    }

    /**
     * Skip onboarding
     */
    skip() {
        localStorage.setItem('fractinst-onboarding-seen', 'true');
        this.cleanup();
    }

    /**
     * Clean up overlay and tooltip
     */
    cleanup() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        if (this.tooltip) {
            this.tooltip.remove();
            this.tooltip = null;
        }

        // Remove highlights
        const highlights = document.querySelectorAll('.onboarding-highlight');
        highlights.forEach(el => {
            el.style.outline = '';
            el.style.outlineOffset = '';
            el.classList.remove('onboarding-highlight');
        });
    }

    /**
     * Reset onboarding (for testing)
     */
    reset() {
        localStorage.removeItem('fractinst-onboarding-seen');
        this.hasSeenOnboarding = false;
    }
}

// Global helper function for easy console access
window.resetOnboarding = function() {
    if (typeof onboarding !== 'undefined') {
        onboarding.reset();
        console.log('Onboarding reset! Refresh the page to see it again.');
    } else {
        localStorage.removeItem('fractinst-onboarding-seen');
        console.log('Onboarding reset! Refresh the page to see it again.');
    }
};

