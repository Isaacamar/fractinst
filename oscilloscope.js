/**
 * Oscilloscope Visualizer - Cymatics-Inspired Geometric Visualization
 * Mathematical, resonance-based visual patterns
 *
 * Four modes:
 * 0. BARS - Original vertical standing wave (classic oscilloscope)
 * 1. WAVE - Ripple patterns from center (standing wave interference)
 * 2. GRID - Hexagonal/geometric deformation based on frequencies
 * 3. TRACE - Connected line oscillating with audio data
 */

class Oscilloscope {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Visualization mode
        this.mode = 'bars'; // 'bars', 'wave', 'grid', 'trace'

        // Time for animations
        this.time = 0;
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
        this.time = 0;
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

        // Increment time for animations
        this.time += 0.02;

        // Calculate average amplitude for global responsiveness
        let avgAmplitude = 0;
        for (let i = 0; i < data.length; i++) {
            avgAmplitude += Math.abs((data[i] / 128.0) - 1.0);
        }
        avgAmplitude /= data.length;

        // Draw based on selected mode
        switch (this.mode) {
            case 'bars':
                this.drawBars(data);
                break;
            case 'wave':
                this.drawCymaticWaves(data, avgAmplitude);
                break;
            case 'grid':
                this.drawGeometricGrid(data, avgAmplitude);
                break;
            case 'trace':
                this.drawOscillatingTrace(data, avgAmplitude);
                break;
            default:
                this.drawBars(data);
        }
    }

    /**
     * Mode 0: BARS - Original vertical standing wave (classic)
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
     * Mode 1: Cymatics Waves - Ripple interference patterns
     * Creates standing wave interference patterns from center
     */
    drawCymaticWaves(data, avgAmplitude) {
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const maxRadius = Math.min(this.width, this.height) / 2;

        // Get dominant frequency from data (approximate)
        const dominantFreq = data.indexOf(Math.max(...data)) / data.length;

        // Draw concentric circles with frequency-based deformation
        const numRings = 12;
        for (let ring = 1; ring <= numRings; ring++) {
            const baseRadius = (maxRadius / numRings) * ring;

            // Create circle with wave distortion based on audio
            this.ctx.beginPath();
            const points = 120;

            for (let i = 0; i <= points; i++) {
                const angle = (i / points) * Math.PI * 2;

                // Wave interference: standing wave pattern
                const wave1 = Math.sin(angle * 3 + this.time) * avgAmplitude;
                const wave2 = Math.sin(angle * 5 - this.time * 0.7) * avgAmplitude;
                const deformation = (wave1 + wave2) * (maxRadius * 0.08);

                const radius = baseRadius + deformation;
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius;

                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }

            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }

        // Draw radial lines at harmonic intervals
        const harmonics = 8;
        for (let h = 0; h < harmonics; h++) {
            const angle = (h / harmonics) * Math.PI * 2;

            // Oscillate radial line based on frequency
            const oscillation = Math.sin(this.time * 2 + h) * avgAmplitude * 20;

            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            const endRadius = maxRadius + oscillation;
            this.ctx.lineTo(
                centerX + Math.cos(angle) * endRadius,
                centerY + Math.sin(angle) * endRadius
            );

            this.ctx.strokeStyle = '#666';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        }

        // Center point
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /**
     * Mode 2: Geometric Grid - Hexagonal lattice deformation
     * Frequency content deforms a geometric grid pattern
     */
    drawGeometricGrid(data, avgAmplitude) {
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const cellSize = 25;
        const cols = Math.ceil(this.width / cellSize) + 2;
        const rows = Math.ceil(this.height / cellSize) + 2;

        // Map frequency data across the grid
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                // Offset for hexagonal pattern
                const offsetX = (row % 2) * (cellSize / 2);
                const x = col * cellSize + offsetX - cellSize;
                const y = row * cellSize - cellSize;

                // Get frequency influence for this grid cell
                const cellIndex = Math.floor((col + row * cols) % data.length);
                const freqInfluence = data[cellIndex] / 256.0;

                // Calculate deformation based on position and frequency
                const distFromCenter = Math.sqrt(
                    Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
                );
                const angle = Math.atan2(y - centerY, x - centerX);

                // Wave ripple effect
                const ripple = Math.sin(distFromCenter * 0.01 - this.time) * freqInfluence * 8;

                // Add frequency resonance
                const resonance = Math.sin(angle * 6 + this.time) * avgAmplitude * 10;

                const deformedX = x + ripple + resonance;
                const deformedY = y + ripple;

                // Draw hexagon cell
                this.drawHexagon(deformedX, deformedY, cellSize * 0.4, freqInfluence);
            }
        }
    }

    /**
     * Draw a single hexagon (helper for grid mode)
     */
    drawHexagon(centerX, centerY, size, brightness) {
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * size;
            const y = centerY + Math.sin(angle) * size;

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();

        // Opacity based on frequency
        const opacity = brightness * 0.8;
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
        this.ctx.lineWidth = 0.5;
        this.ctx.stroke();
    }

    /**
     * Mode 3: Oscillating Trace - Connected line responding to audio
     * Waveform drawn as flowing line with amplitude modulation
     */
    drawOscillatingTrace(data, avgAmplitude) {
        const bufferLength = Math.min(data.length, 256);
        const centerX = this.width / 2;
        const centerY = this.height / 2;

        // Draw multiple harmonic traces
        for (let harmonic = 1; harmonic <= 3; harmonic++) {
            this.ctx.beginPath();

            for (let i = 0; i < bufferLength; i++) {
                // Normalize audio sample
                const sample = (data[i] / 128.0) - 1.0;

                // Position in wave
                const x = (i / bufferLength) * this.width;

                // Multiple oscillations: data + sine waves + time
                const baseY = centerY + sample * this.height * 0.15;
                const oscillation = Math.sin(this.time * harmonic + i * 0.02) * harmonic * 15;
                const y = baseY + oscillation;

                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }

            // Stroke with decreasing opacity for each harmonic
            const opacity = 1.0 / harmonic;
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.6})`;
            this.ctx.lineWidth = 2 / harmonic;
            this.ctx.stroke();
        }

        // Draw center baseline
        this.ctx.beginPath();
        this.ctx.moveTo(0, centerY);
        this.ctx.lineTo(this.width, centerY);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
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
