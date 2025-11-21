/**
 * Oscilloscope Component
 * Recreated from ElegantOscilloscope with frame averaging and phase alignment
 */

import React, { useRef, useEffect } from 'react';
import type { AudioEngine } from '../../engines/AudioEngine';
import './Oscilloscope.css';

interface OscilloscopeProps {
  audioEngine: AudioEngine | null;
}

export const Oscilloscope: React.FC<OscilloscopeProps> = ({ audioEngine }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const frameBufferRef = useRef<Float32Array[]>([]);
  const expectedFrequencyRef = useRef<number | null>(null);
  const sampleRateRef = useRef<number>(48000);
  const maxFrames = 16;

  useEffect(() => {
    if (!audioEngine || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      if (!canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    // Get audio context sample rate
    const context = audioEngine.getContext();
    if (context) {
      sampleRateRef.current = context.sampleRate;
    }

    const smoothData = (data: Uint8Array, windowSize: number): Uint8Array => {
      const smoothed = new Uint8Array(data.length);
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
    };

    const phaseAlign = (normalizedData: Float32Array): Float32Array => {
      const bufferLength = normalizedData.length;
      const aligned = new Float32Array(bufferLength);

      // Find first zero crossing (rising edge preferred)
      let zeroCrossingIdx = -1;
      for (let i = 1; i < bufferLength; i++) {
        const prev = normalizedData[i - 1];
        const curr = normalizedData[i];

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

      // Rotate buffer to start at zero crossing
      if (zeroCrossingIdx > 0 && zeroCrossingIdx < bufferLength) {
        const remaining = bufferLength - zeroCrossingIdx;
        for (let i = 0; i < remaining; i++) {
          aligned[i] = normalizedData[zeroCrossingIdx + i];
        }
        for (let i = 0; i < zeroCrossingIdx; i++) {
          aligned[remaining + i] = normalizedData[i];
        }
      } else {
        aligned.set(normalizedData);
      }

      return aligned;
    };

    const averageFrames = (frames: Float32Array[]): Float32Array => {
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
    };

    const detectPeriod = (normalizedData: Float32Array): number => {
      const bufferLength = normalizedData.length;

      // If we have an expected frequency, calculate expected period
      if (expectedFrequencyRef.current && expectedFrequencyRef.current > 0) {
        const expectedPeriod = Math.round(sampleRateRef.current / expectedFrequencyRef.current);
        if (expectedPeriod > 10 && expectedPeriod < bufferLength / 2) {
          const zeroCrossings: number[] = [];
          for (let i = 1; i < bufferLength; i++) {
            const prev = normalizedData[i - 1];
            const curr = normalizedData[i];
            if (prev < 0 && curr >= 0) {
              zeroCrossings.push(i);
            }
          }

          if (zeroCrossings.length >= 2) {
            let sumPeriods = 0;
            let count = 0;
            const crossingsToUse = Math.min(3, zeroCrossings.length - 1);
            for (let i = 0; i < crossingsToUse; i++) {
              const period = zeroCrossings[i + 1] - zeroCrossings[i];
              if (Math.abs(period - expectedPeriod) < expectedPeriod * 0.2) {
                sumPeriods += period;
                count++;
              }
            }

            if (count > 0) {
              return Math.round(sumPeriods / count);
            }
          }

          return expectedPeriod;
        }
      }

      // Fallback: detect period from zero crossings
      const zeroCrossings: number[] = [];
      for (let i = 1; i < bufferLength; i++) {
        const prev = normalizedData[i - 1];
        const curr = normalizedData[i];
        if (prev < 0 && curr >= 0) {
          zeroCrossings.push(i);
        }
      }

      if (zeroCrossings.length < 3) {
        return 0;
      }

      let sumPeriods = 0;
      let count = 0;
      const crossingsToUse = Math.min(4, zeroCrossings.length - 1);
      for (let i = 0; i < crossingsToUse; i++) {
        const period = zeroCrossings[i + 1] - zeroCrossings[i];
        if (period > 10 && period < bufferLength / 4) {
          sumPeriods += period;
          count++;
        }
      }

      if (count === 0) {
        return 0;
      }

      return Math.round(sumPeriods / count);
    };

    const drawGrid = () => {
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);

      ctx.strokeStyle = '#151515';
      ctx.lineWidth = 0.5;

      // Vertical lines
      for (let i = 0; i <= 10; i++) {
        const x = (width / 10) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontal lines - ensure center line aligns with grid
      for (let i = 0; i <= 8; i++) {
        const y = (height / 8) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    };

    const drawWaveform = (data: Uint8Array) => {
      if (!data || data.length === 0) {
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
        drawGrid();
        return;
      }

      const bufferLength = data.length;
      const smoothed = smoothData(data, 2);

      // Normalize data to -1 to 1
      const normalized = new Float32Array(bufferLength);
      for (let i = 0; i < bufferLength; i++) {
        normalized[i] = (smoothed[i] / 128.0) - 1.0;
      }

      // Phase-align
      const aligned = phaseAlign(normalized);

      // Add to frame buffer
      frameBufferRef.current.push(aligned);
      if (frameBufferRef.current.length > maxFrames) {
        frameBufferRef.current.shift();
      }

      // Average frames
      const averaged = averageFrames(frameBufferRef.current);

      // Detect period
      const period = detectPeriod(averaged);

      // Display exactly 2 periods
      let displayLength = bufferLength;
      let displayStart = 0;

      if (period > 0 && period < bufferLength / 2) {
        displayLength = period * 2;
        displayStart = 0;
      } else {
        displayLength = Math.floor(bufferLength * 0.3);
      }

      displayLength = Math.min(displayLength, averaged.length - displayStart);

      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);

      // Clear canvas
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      // Draw grid
      drawGrid();

      // Draw center line - align with grid center (grid has 8 divisions, center is at 4)
      const centerY = (height / 8) * 4;
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw waveform
      const maxAmplitude = height * 0.35;
      const points: Array<{ x: number; y: number }> = [];
      const sampleStep = Math.max(1, Math.floor(displayLength / width));

      for (let i = 0; i < displayLength; i += sampleStep) {
        const srcIdx = displayStart + i;
        if (srcIdx >= averaged.length) break;

        const value = averaged[srcIdx];
        const y = centerY - (value * maxAmplitude);
        const x = (i / displayLength) * width;
        points.push({ x, y });
      }

      if (points.length > 1) {
        // Draw filled area
        ctx.beginPath();
        ctx.moveTo(points[0].x, centerY);

        for (let i = 0; i < points.length - 1; i++) {
          const p = points[i];
          const next = points[i + 1];
          const midX = (p.x + next.x) / 2;
          const midY = (p.y + next.y) / 2;

          if (i === 0) {
            ctx.lineTo(p.x, p.y);
          }
          ctx.quadraticCurveTo(p.x, p.y, midX, midY);
        }

        const last = points[points.length - 1];
        ctx.lineTo(last.x, last.y);
        ctx.lineTo(last.x, centerY);
        ctx.lineTo(points[0].x, centerY);
        ctx.closePath();

        // Fill with gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(0, 255, 136, 0.1)');
        gradient.addColorStop(0.5, 'rgba(0, 255, 136, 0.05)');
        gradient.addColorStop(1, 'rgba(0, 255, 136, 0.1)');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw main waveform line
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);

        for (let i = 0; i < points.length - 1; i++) {
          const p = points[i];
          const next = points[i + 1];
          const midX = (p.x + next.x) / 2;
          const midY = (p.y + next.y) / 2;
          ctx.quadraticCurveTo(p.x, p.y, midX, midY);
        }

        ctx.lineTo(last.x, last.y);

        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
    };

    const draw = () => {
      if (!ctx || !audioEngine) return;

      const waveformData = audioEngine.getWaveformData();
      if (waveformData) {
        drawWaveform(waveformData);
      } else {
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1));
        drawGrid();
      }

      // Update expected frequency from active notes
      const activeFreq = audioEngine.getPrimaryActiveFrequency();
      if (activeFreq) {
        expectedFrequencyRef.current = activeFreq;
      } else {
        expectedFrequencyRef.current = null;
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      frameBufferRef.current = [];
    };
  }, [audioEngine]);

  return (
    <div className="oscilloscope-module">
      <div className="module-header">
        <span className="module-title">WAVEFORM</span>
      </div>
      <div className="oscilloscope-container">
        <canvas ref={canvasRef} className="oscilloscope-canvas"></canvas>
      </div>
    </div>
  );
};
