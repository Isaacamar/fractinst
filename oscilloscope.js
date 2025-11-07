/**
 * Oscilloscope Visualizer - Real-time waveform visualization
 * Three dynamic visualization modes:
 * 1. BARS - Vertical standing wave (original)
 * 2. SPECTRUM - Radial frequency spectrum (rainbow spectrum analyzer)
 * 3. PARTICLE - Physics-based particle system (interactive audio-driven)
 */

class Oscilloscope {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Visualization mode
        this.mode = 'bars'; // 'bars', 'spectrum', 'particle'

        // Particle system for particle mode
        this.particles = [];
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.width = rect.width;
        this.height = rect.height;
    }

    setMode(newMode) {
        this.mode = newMode;
        this.particles = []; // Reset particles when switching modes
    }

    /**
     * Main draw dispatch - routes to correct visualization mode
     */
    drawWaveform(data) {
        if (!data || data.length === 0) {
            this.clear();
            return;
        }

        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw based on selected mode
        switch (this.mode) {
            case 'bars':
                this.drawBars(data);
                break;
            case 'spectrum':
                this.drawSpectrum(data);
                break;
            case 'particle':
                this.drawParticles(data);
                break;
            default:
                this.drawBars(data);
        }
    }

    /**
     * Mode 1: Vertical bars standing wave (original)
     */
    drawBars(data) {
        this.drawGrid();

        // Draw center line (vertical)
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.width / 2, 0);
        this.ctx.lineTo(this.width / 2, this.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Draw waveform as vertical bars
        const bufferLength = Math.min(data.length, 128);
        const barWidth = (this.width * 0.9) / bufferLength;
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const amplitude = this.height * 0.35;

        this.ctx.strokeStyle = '#0f0';
        this.ctx.lineWidth = Math.max(2, barWidth * 0.8);
        this.ctx.lineCap = 'round';

        for (let i = 0; i < bufferLength; i++) {
            const v = (data[i] / 128.0) - 1.0;
            const barHeight = v * amplitude;
            const x = centerX - (bufferLength * barWidth / 2) + (i * barWidth) + (barWidth / 2);

            this.ctx.beginPath();
            this.ctx.moveTo(x, centerY);
            this.ctx.lineTo(x, centerY - barHeight);
            this.ctx.stroke();
        }
    }

    /**
     * Mode 2: Radial spectrum analyzer (frequency visualization)
     * Audio frequencies mapped to circular rings with color spectrum
     */
    drawSpectrum(data) {
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const maxRadius = Math.min(this.width, this.height) / 2.5;
        const bufferLength = Math.min(data.length, 64);

        // Draw concentric circles as reference
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        for (let r = maxRadius * 0.2; r <= maxRadius; r += maxRadius * 0.2) {
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        // Draw spectrum as rotating bars around center
        const angleSlice = (Math.PI * 2) / bufferLength;

        this.ctx.lineWidth = Math.max(2, maxRadius * 0.05);
        this.ctx.lineCap = 'round';

        for (let i = 0; i < bufferLength; i++) {
            // Normalize audio data
            const amplitude = (data[i] / 256.0);
            const barLength = maxRadius * amplitude;

            // Calculate angle (rotate based on animation frame for visual interest)
            const angle = (angleSlice * i) + (Date.now() * 0.0001);
            const x1 = centerX + Math.cos(angle) * (maxRadius * 0.3);
            const y1 = centerY + Math.sin(angle) * (maxRadius * 0.3);
            const x2 = centerX + Math.cos(angle) * (maxRadius * 0.3 + barLength);
            const y2 = centerY + Math.sin(angle) * (maxRadius * 0.3 + barLength);

            // Color based on frequency (low=red, mid=green, high=blue)
            const hue = (i / bufferLength) * 360;
            this.ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;

            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
        }

        // Draw center circle
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /**
     * Mode 3: Particle physics system
     * Audio amplitude drives particle emission and physics
     */
    drawParticles(data) {
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        // Calculate average amplitude for particle emission
        let avgAmplitude = 0;
        for (let i = 0; i < data.length; i++) {
            avgAmplitude += Math.abs((data[i] / 128.0) - 1.0);
        }
        avgAmplitude /= data.length;

        // Emit new particles based on audio
        const particlesToEmit = Math.floor(avgAmplitude * 20);
        for (let i = 0; i < particlesToEmit; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;

            this.particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 255,
                hue: Math.random() * 360,
                size: 2 + Math.random() * 3
            });
        }

        // Update and draw particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            // Update physics
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1; // Gravity
            p.vx *= 0.98; // Air resistance
            p.life -= 4;

            // Remove dead particles
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            // Draw particle
            this.ctx.fillStyle = `hsla(${p.hue}, 100%, 50%, ${p.life / 255})`;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Draw center attractor point
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /**
     * Draw grid overlay
     */
    drawGrid() {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;

        // Vertical lines
        const verticalLines = 10;
        for (let i = 0; i <= verticalLines; i++) {
            const x = (this.width / verticalLines) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }

        // Horizontal lines
        const horizontalLines = 8;
        for (let i = 0; i <= horizontalLines; i++) {
            const y = (this.height / horizontalLines) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }

    /**
     * Clear canvas
     */
    clear() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.drawGrid();
    }

    /**
     * Start animation loop
     */
    start(updateCallback) {
        const animate = () => {
            updateCallback();
            requestAnimationFrame(animate);
        };
        animate();
    }
}
