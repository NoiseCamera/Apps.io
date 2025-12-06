import React, { useState, useRef, useMemo } from 'react';
import { Point } from '../types';

interface CurveEditorProps {
  points: Point[];
  onChange: (points: Point[]) => void;
  color?: string;
}

export const CurveEditor: React.FC<CurveEditorProps> = ({ points, onChange, color = '#ec4899' }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  // Sort points by x to ensure valid curve function
  const sortedPoints = useMemo(() => [...points].sort((a, b) => a.x - b.x), [points]);

  const getSvgCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    let x = (clientX - rect.left) / rect.width;
    let y = 1 - ((clientY - rect.top) / rect.height);

    return {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y))
    };
  };

  const handleStart = (index: number, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent scroll on touch
    setDraggingIndex(index);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (draggingIndex === null) return;
    
    const pos = getSvgCoordinates(e);
    const newPoints = [...sortedPoints];
    
    // Constraints for endpoints
    if (draggingIndex === 0) {
      newPoints[0] = { x: 0, y: pos.y };
    } else if (draggingIndex === newPoints.length - 1) {
      newPoints[newPoints.length - 1] = { x: 1, y: pos.y };
    } else {
      // Keep points strictly ordered in X
      const prevX = newPoints[draggingIndex - 1].x;
      const nextX = newPoints[draggingIndex + 1].x;
      const constrainedX = Math.max(prevX + 0.01, Math.min(nextX - 0.01, pos.x));
      newPoints[draggingIndex] = { x: constrainedX, y: pos.y };
    }
    
    onChange(newPoints);
  };

  const handleEnd = () => {
    setDraggingIndex(null);
  };

  const handleSvgClick = (e: React.MouseEvent) => {
    if (draggingIndex !== null) return;
    const pos = getSvgCoordinates(e);
    
    // Don't add if too close to existing
    const tooClose = sortedPoints.some(p => Math.abs(p.x - pos.x) < 0.05);
    if (tooClose) return;

    const newPoints = [...sortedPoints, pos].sort((a, b) => a.x - b.x);
    onChange(newPoints);
  };

  const handlePointDoubleClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    // Cannot remove endpoints
    if (index === 0 || index === sortedPoints.length - 1) return;
    
    const newPoints = sortedPoints.filter((_, i) => i !== index);
    onChange(newPoints);
  };

  // Generate Spline Path for Visualization
  const pathD = useMemo(() => {
    if (sortedPoints.length < 2) return "";
    
    const x = sortedPoints.map(p => p.x);
    const y = sortedPoints.map(p => p.y);
    const n = sortedPoints.length;

    // Monotone Cubic Spline Calculation
    const m = new Float32Array(n);
    const dx = new Float32Array(n - 1);
    const dy = new Float32Array(n - 1);
    const slope = new Float32Array(n - 1);

    for (let i = 0; i < n - 1; i++) {
      dx[i] = x[i+1] - x[i];
      dy[i] = y[i+1] - y[i];
      slope[i] = dy[i] / dx[i];
    }

    m[0] = slope[0];
    m[n-1] = slope[n-2];

    for (let i = 0; i < n - 1; i++) {
      if (slope[i] === 0) {
        m[i] = 0;
        m[i+1] = 0;
      }
    }

    for (let i = 1; i < n - 1; i++) {
      if (slope[i-1] * slope[i] <= 0) {
        m[i] = 0;
      } else {
        const w1 = dx[i-1] + dx[i];
        m[i] = (3 * w1) / ((w1 + dx[i]) / slope[i-1] + (w1 + dx[i-1]) / slope[i]);
      }
    }

    // Generate path commands
    let d = `M ${x[0] * 100} ${(1 - y[0]) * 100}`;
    const steps = 100;

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      
      // Find segment
      let seg = 0;
      while (seg < n - 2 && t > x[seg + 1]) {
        seg++;
      }

      const h = dx[seg];
      if (h <= 0) continue;

      const diff = t - x[seg];
      const tRel = diff / h;
      const tRel2 = tRel * tRel;
      const tRel3 = tRel2 * tRel;

      const h00 = 2 * tRel3 - 3 * tRel2 + 1;
      const h10 = tRel3 - 2 * tRel2 + tRel;
      const h01 = -2 * tRel3 + 3 * tRel2;
      const h11 = tRel3 - tRel2;

      const val = h00 * y[seg] + h10 * h * m[seg] + h01 * y[seg + 1] + h11 * h * m[seg + 1];
      
      d += ` L ${t * 100} ${(1 - val) * 100}`;
    }
    return d;
  }, [sortedPoints]);

  return (
    <div 
      className="relative w-full aspect-square bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden touch-none select-none"
      onMouseMove={(e) => draggingIndex !== null && handleMove(e)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchMove={(e) => draggingIndex !== null && handleMove(e)}
      onTouchEnd={handleEnd}
    >
      {/* Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="w-full h-1/4 border-b border-slate-500"></div>
        <div className="w-full h-1/4 border-b border-slate-500"></div>
        <div className="w-full h-1/4 border-b border-slate-500"></div>
        <div className="absolute top-0 left-1/4 w-1/4 h-full border-r border-slate-500"></div>
        <div className="absolute top-0 left-1/2 w-1/4 h-full border-r border-slate-500"></div>
        <div className="absolute top-0 left-3/4 w-1/4 h-full border-r border-slate-500"></div>
        <div className="absolute inset-0 border-b border-l border-slate-500 transform origin-bottom-left scale-[1.414] -rotate-45 opacity-10"></div>
      </div>

      <svg 
        ref={svgRef}
        className="w-full h-full cursor-crosshair"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        onClick={handleSvgClick}
      >
        <path 
          d={pathD} 
          fill="none" 
          stroke={color} 
          strokeWidth="2.5" 
          vectorEffect="non-scaling-stroke"
          className="opacity-90 shadow-md drop-shadow-sm"
        />

        {sortedPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x * 100}
            cy={(1 - p.y) * 100}
            r="4"
            fill="white"
            stroke={color}
            strokeWidth="2"
            className={`cursor-pointer hover:r-6 transition-all ${draggingIndex === i ? 'r-6 shadow' : ''}`}
            onMouseDown={(e) => handleStart(i, e)}
            onTouchStart={(e) => handleStart(i, e)}
            onDoubleClick={(e) => handlePointDoubleClick(i, e)}
          />
        ))}
      </svg>
    </div>
  );
};