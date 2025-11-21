/**
 * Rotary Knob Component
 */

import React, { useRef, useEffect, useState } from 'react';
import './Knob.css';

interface KnobProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  formatValue?: (value: number) => string;
  onChange: (value: number) => void;
  sensitivity?: number; // Higher = more sensitive (default: 0.5)
}

export const Knob: React.FC<KnobProps> = ({
  label,
  min,
  max,
  step,
  value: propValue,
  formatValue = (v) => Math.round(v).toString(),
  onChange,
  sensitivity = 0.5
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const knobRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const valueDisplayRef = useRef<HTMLDivElement>(null);
  const lastYRef = useRef(0);
  const lastValueRef = useRef(propValue);

  // Use prop value directly, but track last value for smooth dragging
  const value = isDragging ? lastValueRef.current : propValue;

  useEffect(() => {
    if (!isDragging) {
      lastValueRef.current = propValue;
    }
    updateVisuals(value);
  }, [propValue, value, isDragging]);

  const updateVisuals = (val: number) => {
    if (!indicatorRef.current || !valueDisplayRef.current) return;

    const range = max - min;
    const normalized = Math.max(0, Math.min(1, (val - min) / range));
    const angle = normalized * 270 - 135; // -135 to 135 degrees

    indicatorRef.current.style.transform = `translateX(-50%) rotate(${angle}deg)`;
    valueDisplayRef.current.textContent = formatValue(val);
  };

  const adjustValue = (delta: number) => {
    const change = delta * sensitivity * step;
    const currentValue = isDragging ? lastValueRef.current : propValue;
    const newValue = Math.max(min, Math.min(max, currentValue + change));
    lastValueRef.current = newValue;
    onChange(newValue);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    lastYRef.current = e.clientY;
    if (knobRef.current) {
      knobRef.current.style.cursor = 'grabbing';
    }
  };


  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -step : step;
    adjustValue(delta * 5);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent) => {
      const deltaY = lastYRef.current - e.clientY;
      const change = deltaY * sensitivity * step;
      const currentValue = lastValueRef.current;
      const newValue = Math.max(min, Math.min(max, currentValue + change));
      lastValueRef.current = newValue;
      onChange(newValue);
      updateVisuals(newValue);
      lastYRef.current = e.clientY;
    };

    const handleUp = () => {
      setIsDragging(false);
      if (knobRef.current) {
        knobRef.current.style.cursor = 'grab';
      }
      // Sync back to prop value when done dragging
      lastValueRef.current = propValue;
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging, min, max, step, onChange, propValue, sensitivity]);

  return (
    <div className="knob-container">
      <div
        ref={knobRef}
        className="knob"
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
      >
        <div className="knob-indicator" ref={indicatorRef}></div>
        <div className="knob-value" ref={valueDisplayRef}>
          {formatValue(value)}
        </div>
      </div>
      <div className="knob-label">{label}</div>
    </div>
  );
};

