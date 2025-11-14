/**
 * Bar Graph Oscilloscope
 * Riemann sum style visualization with small bars
 */

class ElegantOscilloscope {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Frame averaging for stability
        this.frameBuffer = [];
        this.maxFrames = 16; // Increased from 8 to 16 for more stability
        this.alignedBuffer = null;
        this.expectedFrequency = null; // Expected frequency for stabilization
        this.sampleRate = 48000; // Default, will be updated
    }
    
    /**
     * Set expected frequency from active notes (for stabilization)
     */
    setExpectedFrequency(frequency, sampleRate) {
        this.expectedFrequency = frequency;
        if (sampleRate) {
            this.sampleRate = sampleRate;
        }
    }
    
    resize() {
        if (!this.canvas || !this.canvas.parentElement) return;
        
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        this.ctx.scale(dpr, dpr);
        this.width = rect.width;
        this.height = rect.height;
    }
    
    /**
     * Draw waveform as bar graph (Riemann sum style)
     * Phase-aligned and averaged for stable standing wave appearance
     */
    drawWaveform(data) {
        if (!data || data.length === 0) {
            this.clear();
            return;
        }
        
        // Normalize and smooth incoming data
        const bufferLength = data.length;
        const smoothed = this.smoothData(data, 2); // Increased smoothing
        
        // Normalize data to -1 to 1
        const normalized = new Float32Array(bufferLength);
        for (let i = 0; i < bufferLength; i++) {
            normalized[i] = (smoothed[i] / 128.0) - 1.0;
        }
        
        // Phase-align: rotate buffer to start at zero crossing
        const aligned = this.phaseAlign(normalized);
        
        // Add to frame buffer for averaging
        this.frameBuffer.push(aligned);
        if (this.frameBuffer.length > this.maxFrames) {
            this.frameBuffer.shift();
        }
        
        // Average frames for stability
        const averaged = this.averageFrames(this.frameBuffer);
        
        // Detect period (find 2 zero crossings to get period length)
        const period = this.detectPeriod(averaged);
        
        // Display exactly 2 periods
        let displayLength = bufferLength;
        let displayStart = 0;
        
        if (period > 0 && period < bufferLength / 2) {
            // Found a valid period - show exactly 2 periods
            displayLength = period * 2;
            displayStart = 0; // Start from phase-aligned beginning
        } else {
            // No clear period detected, show first portion
            displayLength = Math.floor(bufferLength * 0.3);
        }
        
        // Ensure we don't exceed buffer bounds
        displayLength = Math.min(displayLength, averaged.length - displayStart);
        
        // Clear canvas with dark background
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw subtle grid
        this.drawGrid();
        
        // Draw center line (subtle)
        const centerY = this.height / 2;
        this.ctx.strokeStyle = '#1a1a1a';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([2, 4]);
        this.ctx.beginPath();
        this.ctx.moveTo(0, centerY);
        this.ctx.lineTo(this.width, centerY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Draw minimalist waveform - smooth line with subtle fill
        const maxAmplitude = this.height * 0.35;
        
        // Build path for smooth waveform
        const points = [];
        const sampleStep = Math.max(1, Math.floor(displayLength / this.width));
        
        for (let i = 0; i < displayLength; i += sampleStep) {
            const srcIdx = displayStart + i;
            if (srcIdx >= averaged.length) break;
            
            const value = averaged[srcIdx];
            const y = centerY - (value * maxAmplitude);
            const x = (i / displayLength) * this.width;
            points.push({ x, y });
        }
        
        if (points.length > 1) {
            // Draw filled area (subtle gradient) - covers both positive and negative
            this.ctx.beginPath();
            this.ctx.moveTo(points[0].x, centerY);
            
            // Draw smooth curve along waveform (top path)
            for (let i = 0; i < points.length - 1; i++) {
                const p = points[i];
                const next = points[i + 1];
                const midX = (p.x + next.x) / 2;
                const midY = (p.y + next.y) / 2;
                
                if (i === 0) {
                    this.ctx.lineTo(p.x, p.y);
                }
                this.ctx.quadraticCurveTo(p.x, p.y, midX, midY);
            }
            
            // Draw to last point
            const last = points[points.length - 1];
            this.ctx.lineTo(last.x, last.y);
            
            // Close path back to center line (bottom path)
            this.ctx.lineTo(last.x, centerY);
            this.ctx.lineTo(points[0].x, centerY);
            this.ctx.closePath();
            
            // Fill with subtle green gradient
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
            gradient.addColorStop(0, 'rgba(0, 255, 136, 0.1)');
            gradient.addColorStop(0.5, 'rgba(0, 255, 136, 0.05)');
            gradient.addColorStop(1, 'rgba(0, 255, 136, 0.1)');
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            // Draw main waveform line (smooth, clean)
            this.ctx.beginPath();
            this.ctx.moveTo(points[0].x, points[0].y);
            
            for (let i = 0; i < points.length - 1; i++) {
                const p = points[i];
                const next = points[i + 1];
                const midX = (p.x + next.x) / 2;
                const midY = (p.y + next.y) / 2;
                this.ctx.quadraticCurveTo(p.x, p.y, midX, midY);
            }
            
            // Draw to last point
            this.ctx.lineTo(last.x, last.y);
            
            // Stroke with green color
            this.ctx.strokeStyle = '#00ff88';
            this.ctx.lineWidth = 2;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.stroke();
        }
    }
    
    /**
     * Phase-align waveform to start at zero crossing for stability
     * Simple approach: shift forward and wrap cleanly without artifacts
     */
    phaseAlign(normalizedData) {
        const bufferLength = normalizedData.length;
        const aligned = new Float32Array(bufferLength);
        
        // Find first zero crossing (rising edge preferred)
        let zeroCrossingIdx = -1;
        for (let i = 1; i < bufferLength; i++) {
            const prev = normalizedData[i - 1];
            const curr = normalizedData[i];
            
            // Detect rising zero crossing (negative to positive)
            if (prev < 0 && curr >= 0) {
                zeroCrossingIdx = i;
                break;
            }
        }
        
        // If no rising zero crossing found, try falling edge
        if (zeroCrossingIdx === -1) {
            for (let i = 1; i < bufferLength; i++) {
                const prev = normalizedData[i - 1];
                const curr = normalizedData[i];
                
                if (prev >= 0 && curr < 0) {
                    zeroCrossingIdx = i;
                    break;
                }
            }
        }
        
        // Rotate buffer to start at zero crossing, but wrap cleanly
        if (zeroCrossingIdx > 0 && zeroCrossingIdx < bufferLength) {
            // Copy from zero crossing to end
            const remaining = bufferLength - zeroCrossingIdx;
            for (let i = 0; i < remaining; i++) {
                aligned[i] = normalizedData[zeroCrossingIdx + i];
            }
            
            // Wrap around: copy from beginning to zero crossing
            for (let i = 0; i < zeroCrossingIdx; i++) {
                aligned[remaining + i] = normalizedData[i];
            }
        } else {
            // No zero crossing found, use original data
            aligned.set(normalizedData);
        }
        
        return aligned;
    }
    
    /**
     * Detect period length by finding zero crossings
     * Uses expected frequency if available for better stability
     */
    detectPeriod(normalizedData) {
        const bufferLength = normalizedData.length;
        
        // If we have an expected frequency, calculate expected period
        if (this.expectedFrequency && this.expectedFrequency > 0) {
            const expectedPeriod = Math.round(this.sampleRate / this.expectedFrequency);
            // Validate expected period is reasonable
            if (expectedPeriod > 10 && expectedPeriod < bufferLength / 2) {
                // Use expected period but verify with zero crossings
                const zeroCrossings = [];
                for (let i = 1; i < bufferLength; i++) {
                    const prev = normalizedData[i - 1];
                    const curr = normalizedData[i];
                    if (prev < 0 && curr >= 0) {
                        zeroCrossings.push(i);
                    }
                }
                
                // If we have zero crossings, use them to refine
                if (zeroCrossings.length >= 2) {
                    let sumPeriods = 0;
                    let count = 0;
                    const crossingsToUse = Math.min(3, zeroCrossings.length - 1);
                    for (let i = 0; i < crossingsToUse; i++) {
                        const period = zeroCrossings[i + 1] - zeroCrossings[i];
                        // Accept periods close to expected (within 20%)
                        if (Math.abs(period - expectedPeriod) < expectedPeriod * 0.2) {
                            sumPeriods += period;
                            count++;
                        }
                    }
                    
                    if (count > 0) {
                        return Math.round(sumPeriods / count);
                    }
                }
                
                // Fall back to expected period
                return expectedPeriod;
            }
        }
        
        // Fallback: detect period from zero crossings
        const zeroCrossings = [];
        for (let i = 1; i < bufferLength; i++) {
            const prev = normalizedData[i - 1];
            const curr = normalizedData[i];
            
            // Detect zero crossing (rising edge preferred)
            if (prev < 0 && curr >= 0) {
                zeroCrossings.push(i);
            }
        }
        
        // Need at least 3 zero crossings to detect 2 periods
        if (zeroCrossings.length < 3) {
            return 0; // No clear period
        }
        
        // Calculate average period from first few zero crossings
        let sumPeriods = 0;
        let count = 0;
        
        // Use first 3-4 crossings to get average period
        const crossingsToUse = Math.min(4, zeroCrossings.length - 1);
        for (let i = 0; i < crossingsToUse; i++) {
            const period = zeroCrossings[i + 1] - zeroCrossings[i];
            if (period > 10 && period < bufferLength / 4) { // Reasonable period range
                sumPeriods += period;
                count++;
            }
        }
        
        if (count === 0) {
            return 0; // No valid periods found
        }
        
        const avgPeriod = Math.round(sumPeriods / count);
        return avgPeriod;
    }
    
    /**
     * Average multiple frames to reduce jitter
     */
    averageFrames(frames) {
        if (frames.length === 0) return new Float32Array(0);
        if (frames.length === 1) return frames[0];
        
        const bufferLength = frames[0].length;
        const averaged = new Float32Array(bufferLength);
        
        for (let i = 0; i < bufferLength; i++) {
            let sum = 0;
            for (let j = 0; j < frames.length; j++) {
                sum += frames[j][i];
            }
            averaged[i] = sum / frames.length;
        }
        
        return averaged;
    }
    
    /**
     * Detect key points: zero crossings, peaks, and troughs
     */
    detectKeyPoints(normalizedData) {
        const keyPoints = [0]; // Always start at beginning
        const threshold = 0.05; // Threshold for zero crossing detection
        
        for (let i = 1; i < normalizedData.length - 1; i++) {
            const prev = normalizedData[i - 1];
            const curr = normalizedData[i];
            const next = normalizedData[i + 1];
            
            // Detect zero crossing (sign change)
            if ((prev >= 0 && curr < 0) || (prev < 0 && curr >= 0)) {
                // Find the exact zero crossing point
                if (Math.abs(curr) < threshold) {
                    keyPoints.push(i);
                } else if (Math.abs(prev) < Math.abs(curr)) {
                    keyPoints.push(i - 1);
                } else {
                    keyPoints.push(i);
                }
            }
            // Detect local peaks (maxima)
            else if (curr > prev && curr > next && curr > 0.1) {
                keyPoints.push(i);
            }
            // Detect local troughs (minima)
            else if (curr < prev && curr < next && curr < -0.1) {
                keyPoints.push(i);
            }
        }
        
        // Always end at the last point
        keyPoints.push(normalizedData.length - 1);
        
        // Remove duplicates and sort
        const unique = [...new Set(keyPoints)].sort((a, b) => a - b);
        
        return unique;
    }
    
    /**
     * Smooth data using moving average with stronger filtering
     */
    smoothData(data, windowSize) {
        const smoothed = new Uint8Array(data.length);
        
        // Apply multiple passes for stronger smoothing
        const passes = 2;
        let current = new Uint8Array(data);
        
        for (let pass = 0; pass < passes; pass++) {
            for (let i = 0; i < data.length; i++) {
                let sum = 0;
                let count = 0;
                
                for (let j = -windowSize; j <= windowSize; j++) {
                    const idx = i + j;
                    if (idx >= 0 && idx < data.length) {
                        sum += current[idx];
                        count++;
                    }
                }
                
                smoothed[i] = sum / count;
            }
            current.set(smoothed);
        }
        
        return smoothed;
    }
    
    /**
     * Draw grid
     */
    drawGrid() {
        this.ctx.strokeStyle = '#151515';
        this.ctx.lineWidth = 0.5;
        
        // Vertical lines
        for (let i = 0; i <= 10; i++) {
            const x = (this.width / 10) * i;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let i = 0; i <= 8; i++) {
            const y = (this.height / 8) * i;
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
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.drawGrid();
        // Reset frame buffer when clearing
        this.frameBuffer = [];
    }
    
    /**
     * Start animation loop
     */
    start(updateCallback) {
        const animate = () => {
            if (updateCallback) {
                updateCallback();
            }
            requestAnimationFrame(animate);
        };
        animate();
    }
}
