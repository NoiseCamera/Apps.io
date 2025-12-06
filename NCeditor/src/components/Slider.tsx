
import React, { useRef, useState, useEffect } from 'react';

interface SliderProps {
  label?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (val: number) => void;
  onReset?: () => void;
  unit?: string;
  disabled?: boolean;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  onReset,
  unit = '',
  disabled = false,
  className = ''
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Calculate percentage for track fill
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateValue(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging && !disabled) {
      updateValue(e.clientX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const updateValue = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const rawValue = min + x * (max - min);
    
    // Snap to step
    const steppedValue = Math.round(rawValue / step) * step;
    const clampedValue = Math.max(min, Math.min(max, steppedValue));
    
    // Prevent unnecessary updates
    if (clampedValue !== value) {
        onChange(clampedValue);
    }
  };

  // Double tap/click to reset
  const handleDoubleClick = () => {
      if (onReset && !disabled) onReset();
  };

  return (
    <div className={`space-y-2 touch-none select-none ${disabled ? 'opacity-50' : ''} ${className}`}>
      {label && (
        <div className="flex justify-between items-center text-[11px] font-bold tracking-wide text-white/70">
          <span>{label}</span>
          <span className="font-mono text-cos-accent">
            {value > 0 && min < 0 ? '+' : ''}{Math.round(value * 100) / 100}{unit}
          </span>
        </div>
      )}
      
      <div 
        className="relative h-8 flex items-center cursor-pointer group"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
      >
        {/* Track Background */}
        <div 
            ref={trackRef}
            className="absolute left-0 right-0 h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/5"
        >
            {/* Fill Bar */}
            <div 
                className="h-full bg-gradient-to-r from-cos-accent/80 to-cos-accent transition-all duration-75 ease-out"
                style={{ width: `${percentage}%` }}
            />
        </div>

        {/* Thumb (Visual Only, follows percentage) */}
        <div 
            className={`absolute h-5 w-5 bg-white rounded-full shadow-lg border-2 border-cos-accent transform -translate-x-1/2 transition-transform duration-100 ease-out ${isDragging ? 'scale-125' : 'scale-100 group-hover:scale-110'}`}
            style={{ left: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
