
import React, { useEffect, useRef } from 'react';

interface HistogramProps {
  imageSrc: string | null;
  width?: number;
  height?: number;
  className?: string;
}

export const Histogram: React.FC<HistogramProps> = ({ imageSrc, width = 200, height = 60, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!imageSrc || !canvasRef.current) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Small canvas for analysis to keep it fast
      const analyzeCanvas = document.createElement('canvas');
      const analyzeSize = 256; 
      analyzeCanvas.width = analyzeSize;
      analyzeCanvas.height = analyzeSize;
      const aCtx = analyzeCanvas.getContext('2d');
      if (!aCtx) return;

      aCtx.drawImage(img, 0, 0, analyzeSize, analyzeSize);
      const imageData = aCtx.getImageData(0, 0, analyzeSize, analyzeSize);
      const data = imageData.data;

      const rCounts = new Uint32Array(256);
      const gCounts = new Uint32Array(256);
      const bCounts = new Uint32Array(256);
      const lCounts = new Uint32Array(256);
      let maxCount = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];
        // Fast luminance
        const l = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

        rCounts[r]++;
        gCounts[g]++;
        bCounts[b]++;
        lCounts[l]++;
      }

      // Find max for normalization
      for (let i = 0; i < 256; i++) {
        if (rCounts[i] > maxCount) maxCount = rCounts[i];
        if (gCounts[i] > maxCount) maxCount = gCounts[i];
        if (bCounts[i] > maxCount) maxCount = bCounts[i];
      }
      
      // Scale down maxCount slightly to fill graph better (clipping peaks slightly usually looks better)
      maxCount = maxCount * 0.8;

      // Draw
      ctx.clearRect(0, 0, width, height);
      
      // Helper to draw path
      const drawChannel = (counts: Uint32Array, color: string, blend: GlobalCompositeOperation) => {
        ctx.beginPath();
        ctx.moveTo(0, height);
        
        for (let i = 0; i < 256; i++) {
          const x = (i / 255) * width;
          const h = Math.min(1, counts[i] / maxCount) * height;
          const y = height - h;
          ctx.lineTo(x, y);
        }
        
        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.globalCompositeOperation = blend;
        ctx.fill();
      };

      drawChannel(rCounts, 'rgba(255, 50, 50, 0.5)', 'screen');
      drawChannel(gCounts, 'rgba(50, 255, 50, 0.5)', 'screen');
      drawChannel(bCounts, 'rgba(50, 50, 255, 0.5)', 'screen');
      
      // Luminance outline
      ctx.beginPath();
      for (let i = 0; i < 256; i++) {
          const x = (i / 255) * width;
          const h = Math.min(1, lCounts[i] / maxCount) * height;
          const y = height - h;
          if (i===0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = 1;
      ctx.stroke();
    };
  }, [imageSrc, width, height]);

  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height} 
      className={`pointer-events-none ${className}`}
    />
  );
};
