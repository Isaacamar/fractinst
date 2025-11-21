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
        
        // Visualization mode: 'waveform' or 'cymatic'
        this.visualizationMode = 'waveform';
        
        // Frame averaging for stability
        this.frameBuffer = [];
        this.maxFrames = 16; // Increased from 8 to 16 for more stability
        this.alignedBuffer = null;
        this.expectedFrequency = null; // Expected frequency for stabilization
        this.sampleRate = 48000; // Default, will be updated
        
        // Frequency data for cymatic visualization
        this.frequencyData = null;
        
        // WebGL for cymatic visualization
        this.gl = null;
        this.webglProgram = null;
        this.webglInitialized = false;
        
        // Track active frequencies for morphing
        this.activeFrequencies = new Map(); // frequency -> { n, m, amplitude, targetAmplitude }
        this.activeFrequenciesDirect = null; // Direct frequencies from synth engine
        this.cymaticPatternScale = 0.3;
    }
    
    /**
     * Initialize WebGL for cymatic visualization (not used - canvas already has 2D context)
     * Fallback to Canvas 2D rendering
     */
    initWebGL() {
        // Can't use WebGL - canvas already has 2D context
        // We'll use Canvas 2D instead
        this.webglInitialized = false;
    }
    
    /**
     * Set visualization mode
     */
    setMode(mode) {
        if (mode === 'waveform' || mode === 'cymatic') {
            this.visualizationMode = mode;
            this.clear(); // Clear when switching modes

            // Initialize WebGL when switching to cymatic mode
            if (mode === 'cymatic' && this.width && this.height) {
                this.initWebGL();
                this.activeFrequencies.clear();
                this.cymaticPatternScale = 0.3; // Start partially visible
            }
        }
    }
    
    /**
     * Get current visualization mode
     */
    getMode() {
        return this.visualizationMode;
    }
    
    /**
     * Set frequency data for cymatic visualization
     */
    setFrequencyData(data) {
        this.frequencyData = data;
    }
    
    /**
     * Set active frequencies directly (alternative to FFT data)
     */
    setActiveFrequencies(frequencies) {
        this.activeFrequenciesDirect = frequencies || [];
    }
    
    /**
     * Draw cymatic visualization - Canvas 2D Chladni patterns with morphing
     */
    drawCymatic() {
        // Clear canvas
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Update active frequencies from audio data
        this.updateActiveFrequencies();
        
        // Render with Canvas 2D
        this.renderCymatic2D();
    }
    
    /**
     * Update active frequencies from frequency data or direct frequencies
     */
    updateActiveFrequencies() {
        let frequencies = [];
        let maxAmp = 0;
        
        // Try direct frequencies first (from active voices)
        if (this.activeFrequenciesDirect && this.activeFrequenciesDirect.length > 0) {
            frequencies = this.activeFrequenciesDirect;
            maxAmp = Math.max(...frequencies.map(f => f.amplitude));
            // Reduced logging
            if (Math.random() < 0.01) {
                console.log(`Using direct frequencies: ${frequencies.length} frequencies, maxAmp=${maxAmp}`);
            }
        } 
        // Fallback to FFT data if available
        else if (this.frequencyData && this.frequencyData.length > 0) {
            const dataLength = this.frequencyData.length;
            const nyquist = this.sampleRate / 2;
            const binSize = nyquist / dataLength;
            
            for (let i = 1; i < Math.min(dataLength, 500); i++) {
                const amplitude = this.frequencyData[i];
                if (amplitude > maxAmp) maxAmp = amplitude;
                if (amplitude > 0.5) {
                    frequencies.push({ frequency: i * binSize, amplitude });
                }
            }
            
            // Always use strongest if we have any sound
            if (frequencies.length === 0 && maxAmp > 0) {
                let bestIdx = 1;
                for (let i = 1; i < Math.min(dataLength, 500); i++) {
                    if (this.frequencyData[i] === maxAmp) {
                        bestIdx = i;
                        break;
                    }
                }
                frequencies.push({ frequency: bestIdx * binSize, amplitude: maxAmp });
            }
        }
        
        // If no frequencies, fade out all
        if (frequencies.length === 0) {
            for (const [freqKey, freqData] of this.activeFrequencies.entries()) {
                freqData.targetAmplitude = 0;
                freqData.amplitude += (freqData.targetAmplitude - freqData.amplitude) * 0.2;
                if (freqData.amplitude < 0.01) {
                    this.activeFrequencies.delete(freqKey);
                }
            }
            this.cymaticPatternScale += (0.0 - this.cymaticPatternScale) * 0.15;
            return;
        }
        
        // Update active frequencies
        const currentFreqKeys = new Set();
        
        for (const freq of frequencies.slice(0, 6)) {
            const freqKey = freq.frequency.toFixed(1);
            currentFreqKeys.add(freqKey);
            
            const modes = this.frequencyToModes(freq.frequency);
            const normalizedAmp = Math.max(0.5, Math.min(1.0, freq.amplitude / 255));
            
            if (!this.activeFrequencies.has(freqKey)) {
                // Only log when new frequency is added
                console.log(`New frequency: ${freq.frequency.toFixed(1)}Hz, n=${modes.n}, m=${modes.m}, amp=${normalizedAmp.toFixed(2)}`);
                this.activeFrequencies.set(freqKey, {
                    n: modes.n,
                    m: modes.m,
                    amplitude: normalizedAmp,
                    targetAmplitude: normalizedAmp,
                    frequency: freq.frequency
                });
            } else {
                const freqData = this.activeFrequencies.get(freqKey);
                freqData.targetAmplitude = normalizedAmp;
            }
        }
        
        // Fade out inactive frequencies
        for (const [freqKey, freqData] of this.activeFrequencies.entries()) {
            if (!currentFreqKeys.has(freqKey)) {
                freqData.targetAmplitude = 0;
            }
            freqData.amplitude += (freqData.targetAmplitude - freqData.amplitude) * 0.25;
            if (freqData.amplitude < 0.01) {
                this.activeFrequencies.delete(freqKey);
            }
        }
        
        // Update scale - faster response
        const hasSound = frequencies.length > 0 && maxAmp > 0.5;
        const targetScale = hasSound ? 1.0 : 0.0;
        this.cymaticPatternScale += (targetScale - this.cymaticPatternScale) * 0.3; // Faster
        this.cymaticPatternScale = Math.max(0, Math.min(1, this.cymaticPatternScale));
    }
    
    /**
     * Render cymatic patterns using Canvas 2D
     */
    renderCymatic2D() {
        // Reduced logging frequency
        if (Math.random() < 0.01) { // Only log 1% of the time
            console.log(`renderCymatic2D: activeFrequencies=${this.activeFrequencies.size}, scale=${this.cymaticPatternScale.toFixed(3)}`);
        }
        
        if (this.activeFrequencies.size === 0) {
            return;
        }
        
        if (this.cymaticPatternScale < 0.01) {
            return;
        }
        
        const width = this.width;
        const height = this.height;
        const scale = this.cymaticPatternScale;
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Create image data for pixel-perfect rendering
        const imageData = this.ctx.createImageData(width, height);
        const data = imageData.data;
        
        // Compute blended pattern from all active frequencies
        const field = new Float32Array(width * height);
        field.fill(0);
        
        // Calculate total weight (sum of all frequency amplitudes)
        let totalWeight = 0;
        for (const [freqKey, freqData] of this.activeFrequencies.entries()) {
            if (freqData.amplitude >= 0.01) {
                totalWeight += freqData.amplitude;
            }
        }
        
        // Compute patterns for each frequency
        for (const [freqKey, freqData] of this.activeFrequencies.entries()) {
            if (freqData.amplitude < 0.01) continue;
            
            const n = freqData.n;
            const m = freqData.m;
            const weight = freqData.amplitude;
            
            // Compute Chladni pattern: sin(nπx) * sin(mπy)
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    // Scale from center - when scale < 1, pattern shrinks
                    const dx = (x - centerX) * scale;
                    const dy = (y - centerY) * scale;
                    const scaledX = centerX + dx;
                    const scaledY = centerY + dy;
                    
                    // Normalize to [0, 1]
                    const xNorm = scaledX / width;
                    const yNorm = scaledY / height;
                    
                    // Clamp to valid range
                    if (xNorm < 0 || xNorm > 1 || yNorm < 0 || yNorm > 1) continue;
                    
                    const X_n = Math.sin(n * Math.PI * xNorm);
                    const Y_m = Math.sin(m * Math.PI * yNorm);
                    const pattern = X_n * Y_m;
                    const density = pattern * pattern; // |pattern|^2
                    
                    const idx = y * width + x;
                    field[idx] += density * weight;
                }
            }
        }
        
        // Normalize and render
        if (totalWeight > 0.001) {
            // Get max amplitude from active frequencies
            let maxAmp = 0;
            for (const [key, fd] of this.activeFrequencies.entries()) {
                if (fd.amplitude > maxAmp) maxAmp = fd.amplitude;
            }
            
            // Find max value in field BEFORE normalization
            let maxFieldValue = 0;
            for (let i = 0; i < field.length; i++) {
                if (field[i] > maxFieldValue) maxFieldValue = field[i];
            }
            
            // Normalize field values
            if (maxFieldValue > 0) {
                for (let i = 0; i < field.length; i++) {
                    field[i] = field[i] / totalWeight;
                }
            }
            
            // Use adaptive threshold based on max normalized value
            const maxNormalized = maxFieldValue / totalWeight;
            // Lower threshold for more visible patterns - use 15% instead of 25%
            const threshold = maxNormalized * 0.15;
            
            // Only log occasionally
            if (Math.random() < 0.05) {
                console.log(`Rendering: totalWeight=${totalWeight.toFixed(2)}, maxAmp=${maxAmp.toFixed(2)}, maxFieldValue=${maxFieldValue.toFixed(4)}, threshold=${threshold.toFixed(4)}, scale=${scale.toFixed(2)}`);
            }
            
            let pixelsDrawn = 0;
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = y * width + x;
                    const value = field[idx]; // Already normalized
                    
                    // Hard threshold for sharp white lines - use adaptive threshold
                    // Make brightness brighter and more visible
                    const brightness = value > threshold ? 
                        Math.floor(255 * Math.min(1.0, maxAmp * scale * 1.2)) : 0;
                    
                    if (brightness > 0) pixelsDrawn++;
                    
                    const pixelIdx = (y * width + x) * 4;
                    data[pixelIdx] = brightness;     // R
                    data[pixelIdx + 1] = brightness; // G
                    data[pixelIdx + 2] = brightness; // B
                    data[pixelIdx + 3] = 255;       // A
                }
            }
            
            if (pixelsDrawn === 0 || Math.random() < 0.05) {
                console.log(`Drew ${pixelsDrawn} pixels`);
            }
        } else {
            console.log(`totalWeight too small: ${totalWeight}`);
        }
        
        // Draw image data directly - canvas should already be at correct size
        this.ctx.putImageData(imageData, 0, 0);
    }
    
    /**
     * Map frequency to unique Chladni mode numbers (n, m)
     * Each note gets a unique pattern
     */
    frequencyToModes(frequency) {
        // Map frequency to unique Chladni modes
        // Use MIDI note number for more consistent mapping
        
        // Convert frequency to MIDI note (more precise)
        const midiNote = 69 + 12 * Math.log2(frequency / 440);
        const normalizedMidi = (midiNote - 21) / (108 - 21); // Map MIDI 21-108 to [0,1]
        
        // Use different hash functions for n and m to create variety
        // Multiply by different primes to spread out the patterns
        const n = Math.floor(1 + (normalizedMidi * 7.99)); // 1-8
        const m = Math.floor(1 + ((normalizedMidi * 2.718281828) % 1) * 7.99); // 1-8 (e for variety)
        
        // Add some variation based on frequency itself
        const freqHash = (frequency * 0.1) % 1;
        const nVariation = Math.floor(freqHash * 3); // 0-2
        const mVariation = Math.floor((freqHash * 1.618) % 1 * 3); // 0-2
        
        const result = { 
            n: Math.max(1, Math.min(8, n + nVariation)), 
            m: Math.max(1, Math.min(8, m + mVariation)) 
        };
        
        // Debug: log the mapping occasionally
        if (Math.random() < 0.05) {
            console.log(`frequencyToModes: ${frequency.toFixed(1)}Hz (MIDI ${midiNote.toFixed(1)}) -> n=${result.n}, m=${result.m}`);
        }
        
        return result;
    }
    
    /**
     * Update cymatic field - detect frequencies and morph patterns (simplified, more responsive)
     */
    updateCymaticField() {
        if (!this.cymaticField || this.cymaticFieldWidth === 0 || this.cymaticFieldHeight === 0) {
            console.log('Field not initialized:', {
                field: !!this.cymaticField,
                width: this.cymaticFieldWidth,
                height: this.cymaticFieldHeight
            });
            return;
        }
        if (!this.frequencyData || this.frequencyData.length === 0) {
            console.log('No frequency data in updateCymaticField');
            return;
        }
        
        const width = this.cymaticFieldWidth;
        const height = this.cymaticFieldHeight;
        const dataLength = this.frequencyData.length;
        const nyquist = this.sampleRate / 2;
        const binSize = nyquist / dataLength;
        
        // Debug: Check frequency data
        const maxFreqValue = Math.max(...Array.from(this.frequencyData));
        console.log(`Frequency data: length=${dataLength}, max=${maxFreqValue}, sampleRate=${this.sampleRate}`);
        
        // Find all significant frequencies - very low threshold for detection
        const frequencies = [];
        let maxAmp = 0;
        
        for (let i = 1; i < Math.min(dataLength, 500); i++) {
            const amplitude = this.frequencyData[i];
            if (amplitude > maxAmp) maxAmp = amplitude;
            if (amplitude > 0.5) { // Very low threshold - catch everything
                const frequency = i * binSize;
                frequencies.push({ frequency, amplitude });
            }
        }
        
        // Always use the strongest frequency if we have any sound
        if (frequencies.length === 0 && maxAmp > 0) {
            let bestIdx = 1;
            let bestAmp = 0;
            for (let i = 1; i < Math.min(dataLength, 500); i++) {
                if (this.frequencyData[i] > bestAmp) {
                    bestAmp = this.frequencyData[i];
                    bestIdx = i;
                }
            }
            if (bestAmp > 0) {
                frequencies.push({ frequency: bestIdx * binSize, amplitude: bestAmp });
            }
        }
        
        // Sort by amplitude
        frequencies.sort((a, b) => b.amplitude - a.amplitude);
        
        // Update active patterns map
        const currentFreqKeys = new Set();
        const amplitudeSmoothing = 0.3; // Faster response
        
        // Update or create patterns for current frequencies (top 6 for performance)
        for (const freq of frequencies.slice(0, 6)) {
            const freqKey = freq.frequency.toFixed(1);
            currentFreqKeys.add(freqKey);
            
            const normalizedAmp = Math.max(0.2, Math.min(1.0, freq.amplitude / 255));
            
            if (!this.activePatterns.has(freqKey)) {
                // New pattern - create it with immediate visibility
                const pattern = new Float32Array(width * height);
                pattern.fill(0);
                this.activePatterns.set(freqKey, {
                    pattern: pattern,
                    amplitude: Math.max(0.8, normalizedAmp), // Start highly visible
                    targetAmplitude: normalizedAmp,
                    frequency: freq.frequency
                });
            } else {
                // Existing pattern - update target amplitude
                const patternData = this.activePatterns.get(freqKey);
                patternData.targetAmplitude = normalizedAmp;
            }
        }
        
        // Fade out patterns that are no longer active
        for (const [freqKey, patternData] of this.activePatterns.entries()) {
            if (!currentFreqKeys.has(freqKey)) {
                patternData.targetAmplitude = 0;
            }
            
            // Smoothly interpolate amplitude
            patternData.amplitude += (patternData.targetAmplitude - patternData.amplitude) * amplitudeSmoothing;
            
            // Remove patterns that have faded out
            if (patternData.amplitude < 0.01 && patternData.targetAmplitude === 0) {
                this.activePatterns.delete(freqKey);
            }
        }
        
        // Animate scale: grow when sound present, shrink when silent
        const scaleSpeed = 0.25; // Faster scale animation
        const hasActiveSound = frequencies.length > 0 && maxAmp > 0.5; // Lower threshold
        const targetScale = hasActiveSound ? 1.0 : 0.0;
        this.cymaticPatternScale += (targetScale - this.cymaticPatternScale) * scaleSpeed;
        this.cymaticPatternScale = Math.max(0, Math.min(1, this.cymaticPatternScale));
        
        // Compute blended pattern from all active patterns
        const targetField = new Float32Array(width * height);
        targetField.fill(0);
        
        let totalWeight = 0;
        const patternMorphSpeed = 0.3; // Faster morphing
        
        // Compute and blend patterns
        for (const [freqKey, patternData] of this.activePatterns.entries()) {
            if (patternData.amplitude < 0.01) continue;
            
            const modes = this.frequencyToModes(patternData.frequency);
            const n = modes.n;
            const m = modes.m;
            
            // Compute Chladni pattern: u(x,y) = sin(nπx/Lx) * sin(mπy/Ly)
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const idx = y * width + x;
                    const xNorm = x / width;
                    const yNorm = y / height;
                    
                    const X_n = Math.sin(n * Math.PI * xNorm);
                    const Y_m = Math.sin(m * Math.PI * yNorm);
                    const u = X_n * Y_m;
                    const density = u * u; // |u|^2
                    
                    // Morph pattern toward target (faster)
                    patternData.pattern[idx] += (density - patternData.pattern[idx]) * patternMorphSpeed;
                    
                    // Blend into target field with amplitude weighting
                    const weight = patternData.amplitude;
                    targetField[idx] += patternData.pattern[idx] * weight;
                    totalWeight += weight;
                }
            }
        }
        
        // Normalize blended field
        if (totalWeight > 0.001) {
            for (let i = 0; i < targetField.length; i++) {
                targetField[i] /= totalWeight;
            }
            console.log(`Using tracked patterns, totalWeight=${totalWeight.toFixed(2)}`);
        } else if (frequencies.length > 0) {
            // Fallback: compute directly if no patterns yet - ALWAYS use this for immediate display
            console.log(`Using fallback computation for ${frequencies.length} frequencies`);
            for (const freq of frequencies.slice(0, 3)) {
                const normalizedAmp = Math.max(0.7, Math.min(1.0, freq.amplitude / 255));
                const modes = this.frequencyToModes(freq.frequency);
                const n = modes.n;
                const m = modes.m;
                
                console.log(`Computing pattern: freq=${freq.frequency.toFixed(1)}Hz, n=${n}, m=${m}, amp=${normalizedAmp.toFixed(2)}`);
                
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const idx = y * width + x;
                        const xNorm = x / width;
                        const yNorm = y / height;
                        
                        const X_n = Math.sin(n * Math.PI * xNorm);
                        const Y_m = Math.sin(m * Math.PI * yNorm);
                        const u = X_n * Y_m;
                        const density = u * u;
                        
                        targetField[idx] += density * normalizedAmp;
                    }
                }
            }
            
            // Normalize fallback
            let maxVal = 0;
            for (let i = 0; i < targetField.length; i++) {
                if (targetField[i] > maxVal) maxVal = targetField[i];
            }
            if (maxVal > 0) {
                for (let i = 0; i < targetField.length; i++) {
                    targetField[i] /= maxVal;
                }
            }
            console.log(`Fallback pattern computed, maxVal=${maxVal.toFixed(3)}`);
        } else {
            console.log('No frequencies found and no patterns to blend');
        }
        
        // Smooth interpolation from current to target
        const fieldMorphSpeed = 0.2;
        for (let i = 0; i < this.cymaticField.length; i++) {
            this.cymaticField[i] += (targetField[i] - this.cymaticField[i]) * fieldMorphSpeed;
        }
        
        // Clear when scale is very small
        if (this.cymaticPatternScale < 0.01 && frequencies.length === 0) {
            this.cymaticField.fill(0);
        }
    }
    
    /**
     * Render cymatic field - sharp white lines on black background
     */
    renderCymaticField() {
        if (!this.cymaticField || this.cymaticFieldWidth === 0 || this.cymaticFieldHeight === 0) {
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(0, 0, this.width, this.height);
            return;
        }
        
        // Save context state
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.imageSmoothingEnabled = false;
        
        const pixelWidth = this.canvas.width;
        const pixelHeight = this.canvas.height;
        const fieldWidth = this.cymaticFieldWidth;
        const fieldHeight = this.cymaticFieldHeight;
        
        // Create ImageData for pixel-perfect rendering
        const imageData = this.ctx.createImageData(pixelWidth, pixelHeight);
        const data = imageData.data;
        
        // Clear to black
        for (let i = 0; i < data.length; i += 4) {
            data[i] = 0;     // R
            data[i + 1] = 0; // G
            data[i + 2] = 0; // B
            data[i + 3] = 255; // A
        }
        
        // Scale transformation: pattern grows from center
        const scale = this.cymaticPatternScale;
        const pixelCenterX = pixelWidth / 2;
        const pixelCenterY = pixelHeight / 2;
        const fieldCenterX = fieldWidth / 2;
        const fieldCenterY = fieldHeight / 2;
        
        // Threshold for white lines - much lower for more visibility
        const threshold = 0.05;
        
        // Check if there's any content
        let maxFieldValue = 0;
        for (let i = 0; i < this.cymaticField.length; i++) {
            if (this.cymaticField[i] > maxFieldValue) maxFieldValue = this.cymaticField[i];
        }
        
        console.log(`Render check: maxFieldValue=${maxFieldValue.toFixed(4)}, scale=${scale.toFixed(2)}, fieldSize=${this.cymaticField.length}`);
        
        // Render if there's any content at all
        if (maxFieldValue > 0.001) {
            console.log('Rendering pattern...');
            for (let py = 0; py < pixelHeight; py++) {
                for (let px = 0; px < pixelWidth; px++) {
                    // Scale from center
                    const dx = px - pixelCenterX;
                    const dy = py - pixelCenterY;
                    const scaledDx = dx * scale;
                    const scaledDy = dy * scale;
                    
                    const fx = Math.floor(fieldCenterX + scaledDx);
                    const fy = Math.floor(fieldCenterY + scaledDy);
                    
                    if (fx < 0 || fx >= fieldWidth || fy < 0 || fy >= fieldHeight) {
                        continue;
                    }
                    
                    const idx = fy * fieldWidth + fx;
                    const value = Math.max(0, Math.min(1, this.cymaticField[idx]));
                    
                    // Hard threshold: pure white or black, with scale fade
                    // Use scale for brightness but don't require scale > 0.01
                    const brightness = value > threshold ? Math.floor(255 * Math.max(0.3, scale)) : 0;
                    
                    const pixelIdx = (py * pixelWidth + px) * 4;
                    data[pixelIdx] = brightness;     // R
                    data[pixelIdx + 1] = brightness; // G
                    data[pixelIdx + 2] = brightness; // B
                    data[pixelIdx + 3] = 255;       // A
                }
            }
        }
        
        this.ctx.putImageData(imageData, 0, 0);
        this.ctx.restore();
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
        
        // Reinitialize WebGL if needed
        if (this.visualizationMode === 'cymatic' && this.webglInitialized) {
            this.webglInitialized = false;
            this.initWebGL();
        }
    }
    
    /**
     * Draw waveform as bar graph (Riemann sum style)
     * Phase-aligned and averaged for stable standing wave appearance
     */
    drawWaveform(data) {
        // Route to appropriate visualization based on mode
        if (this.visualizationMode === 'cymatic') {
            this.drawCymatic();
            return;
        }
        
        // Waveform mode - check data
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
