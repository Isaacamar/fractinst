/**
 * Oscilloscope Visualizer - Real-time waveform visualization
 */

class Oscilloscope {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.width = rect.width;
        this.height = rect.height;
    }

    /**
     * Draw oscilloscope waveform (vertical standing wave display)
     */
    drawWaveform(data) {
        if (!data || data.length === 0) {
            this.clear();
            return;
        }

        // Clear canvas with black background
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw grid
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

        // Draw waveform as vertical bars (standing wave)
        const bufferLength = Math.min(data.length, 128);  // Limit to 128 bars for clarity
        const barWidth = (this.width * 0.9) / bufferLength;  // Use 90% of width
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const amplitude = this.height * 0.35;  // Max height

        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = Math.max(2, barWidth * 0.8);
        this.ctx.lineCap = 'round';

        for (let i = 0; i < bufferLength; i++) {
            // Convert byte data (0-255) to normalized value (-1 to 1)
            const v = (data[i] / 128.0) - 1.0;
            const barHeight = v * amplitude;

            // Calculate x position (centered)
            const x = centerX - (bufferLength * barWidth / 2) + (i * barWidth) + (barWidth / 2);

            // Draw vertical bar
            this.ctx.beginPath();
            this.ctx.moveTo(x, centerY);
            this.ctx.lineTo(x, centerY - barHeight);
            this.ctx.stroke();
        }
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
