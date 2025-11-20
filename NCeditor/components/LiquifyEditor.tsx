
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Button } from './Button';
import { Spinner } from './Spinner';

interface LiquifyEditorProps {
  imageSrc: string;
  onApply: (newImageSrc: string) => void;
  onCancel: () => void;
}

type LiquifyTool = 'warp' | 'bloat' | 'pucker' | 'reconstruct';

export const LiquifyEditor: React.FC<LiquifyEditorProps> = ({ imageSrc, onApply, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Tools
  const [activeTool, setActiveTool] = useState<LiquifyTool>('warp');
  const [brushSize, setBrushSize] = useState(100); 
  const [brushStrength, setBrushStrength] = useState(50);
  
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Undo/Redo State
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const originalDataRef = useRef<ImageData | null>(null);
  
  // Interaction state
  const isDragging = useRef(false);
  const lastPos = useRef<{x: number, y: number} | null>(null);
  const animationFrameRef = useRef<number>(0);

  // Optimization: Falloff LUT
  const falloffLUT = useMemo(() => {
      const lut = new Float32Array(Math.ceil(brushSize * brushSize) + 1);
      const radius = brushSize;
      for (let i = 0; i < lut.length; i++) {
          const dist = Math.sqrt(i);
          if (dist > radius) {
              lut[i] = 0;
          } else {
              const ratio = dist / radius;
              const val = Math.pow(Math.cos(ratio * Math.PI / 2), 2);
              lut[i] = val;
          }
      }
      return lut;
  }, [brushSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Ensure high quality context
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
        // Use FULL resolution from original image
        const w = img.width;
        const h = img.height;
        
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        const initialData = ctx.getImageData(0, 0, w, h);
        
        originalDataRef.current = initialData;
        setHistory([initialData]);
        setHistoryIndex(0);
    };
    
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [imageSrc]);

  const applyLiquify = (currentX: number, currentY: number, isDrag: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const radius = brushSize;
    const padding = radius;
    
    const minX = Math.max(0, Math.floor(currentX - padding));
    const maxX = Math.min(canvas.width, Math.ceil(currentX + padding));
    const minY = Math.max(0, Math.floor(currentY - padding));
    const maxY = Math.min(canvas.height, Math.ceil(currentY + padding));
    
    if (maxX <= minX || maxY <= minY) return;

    const width = maxX - minX;
    const height = maxY - minY;

    const imageData = ctx.getImageData(minX, minY, width, height);
    const data = imageData.data;
    const sourceData = new Uint8ClampedArray(data);
    
    const strength = brushStrength / 100;
    const radSq = radius * radius;

    let modified = false;
    let dx = 0, dy = 0;

    if (activeTool === 'warp') {
        if (!lastPos.current) return;
        dx = currentX - lastPos.current.x;
        dy = currentY - lastPos.current.y;
        if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) return; 
    }

    const bloatPuckerFactor = 0.15 * strength;
    const reconstructBlend = 0.2 * strength;

    for (let y = 0; y < height; y++) {
        const globalY = minY + y;
        const distY = globalY - currentY;
        const distYSq = distY * distY;
        if (distYSq >= radSq) continue;

        for (let x = 0; x < width; x++) {
            const globalX = minX + x;
            const distX = globalX - currentX;
            const distSq = distX*distX + distYSq;

            if (distSq < radSq) {
                const falloff = falloffLUT[Math.floor(distSq)] || 0;
                if (falloff <= 0) continue;

                let srcX = x;
                let srcY = y;
                
                if (activeTool === 'warp') {
                    const factor = falloff * strength;
                    srcX = x - dx * factor;
                    srcY = y - dy * factor;
                } else if (activeTool === 'bloat') {
                    const amount = bloatPuckerFactor * falloff;
                    srcX = x - (distX * amount);
                    srcY = y - (distY * amount);
                } else if (activeTool === 'pucker') {
                    const amount = bloatPuckerFactor * falloff;
                    srcX = x + (distX * amount);
                    srcY = y + (distY * amount);
                } else if (activeTool === 'reconstruct') {
                     if (!originalDataRef.current) continue;
                     const targetIdx = (y * width + x) * 4;
                     const origIdx = (Math.floor(globalY) * originalDataRef.current.width + Math.floor(globalX)) * 4;
                     const blend = reconstructBlend * falloff; 
                     for (let c=0; c<3; c++) {
                         data[targetIdx+c] = data[targetIdx+c] * (1-blend) + originalDataRef.current.data[origIdx+c] * blend;
                     }
                     modified = true;
                     continue; 
                }

                // Bilinear Interpolation
                if (srcX < 0) srcX = 0; if (srcX > width-1.001) srcX = width-1.001;
                if (srcY < 0) srcY = 0; if (srcY > height-1.001) srcY = height-1.001;

                const x0 = Math.floor(srcX);
                const x1 = x0 + 1;
                const y0 = Math.floor(srcY);
                const y1 = y0 + 1;
                
                const wx = srcX - x0;
                const wy = srcY - y0;
                const invWx = 1 - wx;
                const invWy = 1 - wy;
                
                const row0 = y0 * width * 4;
                const row1 = y1 * width * 4;
                
                const idx00 = row0 + x0 * 4;
                const idx10 = row0 + x1 * 4;
                const idx01 = row1 + x0 * 4;
                const idx11 = row1 + x1 * 4;
                
                const targetIdx = (y * width + x) * 4;

                let val0 = sourceData[idx00] * invWx + sourceData[idx10] * wx;
                let val1 = sourceData[idx01] * invWx + sourceData[idx11] * wx;
                data[targetIdx] = val0 * invWy + val1 * wy;
                
                val0 = sourceData[idx00+1] * invWx + sourceData[idx10+1] * wx;
                val1 = sourceData[idx01+1] * invWx + sourceData[idx11+1] * wx;
                data[targetIdx+1] = val0 * invWy + val1 * wy;
                
                val0 = sourceData[idx00+2] * invWx + sourceData[idx10+2] * wx;
                val1 = sourceData[idx01+2] * invWx + sourceData[idx11+2] * wx;
                data[targetIdx+2] = val0 * invWy + val1 * wy;

                val0 = sourceData[idx00+3] * invWx + sourceData[idx10+3] * wx;
                val1 = sourceData[idx01+3] * invWx + sourceData[idx11+3] * wx;
                data[targetIdx+3] = val0 * invWy + val1 * wy;

                modified = true;
            }
        }
    }

    if (modified) {
        ctx.putImageData(imageData, minX, minY);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = canvasRef.current!.width / rect.width;
    const scaleY = canvasRef.current!.height / rect.height;
    
    lastPos.current = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    
    if (activeTool !== 'warp') {
        const loop = () => {
            if (isDragging.current && lastPos.current) {
                applyLiquify(lastPos.current.x, lastPos.current.y, false);
                animationFrameRef.current = requestAnimationFrame(loop);
            }
        };
        loop();
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;

    const currentX = (e.clientX - rect.left) * scaleX;
    const currentY = (e.clientY - rect.top) * scaleY;

    if (activeTool === 'warp') {
        applyLiquify(currentX, currentY, true);
        lastPos.current = { x: currentX, y: currentY };
    } else {
        lastPos.current = { x: currentX, y: currentY };
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    lastPos.current = null;
    cancelAnimationFrame(animationFrameRef.current);
    
    if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
            const current = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
            const newHistory = history.slice(0, historyIndex + 1);
            newHistory.push(current);
            if (newHistory.length > 8) newHistory.shift();
            
            setHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        }
    }
  };

  const handleUndo = () => {
      if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          const ctx = canvasRef.current?.getContext('2d');
          if (ctx) ctx.putImageData(history[newIndex], 0, 0);
      }
  };

  const handleRedo = () => {
      if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          const ctx = canvasRef.current?.getContext('2d');
          if (ctx) ctx.putImageData(history[newIndex], 0, 0);
      }
  };

  const handleSave = async () => {
      if (!canvasRef.current) return;
      setIsProcessing(true);
      setTimeout(() => {
          // Use maximum quality for output
          const dataUrl = canvasRef.current!.toDataURL('image/png', 1.0);
          onApply(dataUrl);
      }, 50);
  };

  return (
    <div className="flex flex-col h-full bg-cos-dark/80 backdrop-blur-xl z-50 absolute inset-0">
        <div className="h-14 px-4 flex items-center justify-between border-b border-white/10 bg-black/50 z-10 shrink-0">
            <h2 className="font-bold text-white">ゆがみツール (高画質)</h2>
            <div className="flex gap-2">
                <div className="flex mr-2 bg-white/10 rounded-lg">
                    <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-2 text-white/50 hover:text-white disabled:opacity-30">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>
                    </button>
                    <div className="w-px bg-white/10 my-2"></div>
                    <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-2 text-white/50 hover:text-white disabled:opacity-30">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" /></svg>
                    </button>
                </div>
                <Button variant="primary" onClick={handleSave} className="!py-1">{isProcessing ? <Spinner/> : '完了'}</Button>
            </div>
        </div>
        
        <div className="flex-1 relative overflow-hidden touch-none flex items-center justify-center bg-black">
            {/* Canvas renders at full resolution but is scaled down by CSS to fit */}
            <canvas 
                ref={canvasRef}
                className="max-w-full max-h-full object-contain cursor-crosshair shadow-2xl"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            />
        </div>

        <div className="bg-black/80 backdrop-blur p-4 border-t border-white/10 safe-area-bottom shrink-0">
            <div className="max-w-lg mx-auto space-y-4">
                {/* Tools Selector */}
                <div className="flex justify-around bg-white/10 p-1 rounded-xl">
                    <ToolButton 
                        active={activeTool === 'warp'} 
                        onClick={() => setActiveTool('warp')} 
                        label="押す" 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 12h8m-8 4h8m-8-8h8" strokeLinecap="round"/></svg>}
                    />
                    <ToolButton 
                        active={activeTool === 'bloat'} 
                        onClick={() => setActiveTool('bloat')} 
                        label="膨張" 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14m7-7H5" strokeLinecap="round"/><circle cx="12" cy="12" r="9"/></svg>}
                    />
                    <ToolButton 
                        active={activeTool === 'pucker'} 
                        onClick={() => setActiveTool('pucker')} 
                        label="収縮" 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 12h8" strokeLinecap="round"/><circle cx="12" cy="12" r="9"/></svg>}
                    />
                    <ToolButton 
                        active={activeTool === 'reconstruct'} 
                        onClick={() => setActiveTool('reconstruct')} 
                        label="復元" 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>}
                    />
                </div>

                <div className="flex gap-4">
                    <div className="flex-1 space-y-2 select-none touch-manipulation" onDoubleClick={() => setBrushSize(100)}>
                        <div className="flex justify-between text-xs text-white/60 pointer-events-none">
                            <span>サイズ</span>
                            <span>{brushSize}px</span>
                        </div>
                        <input 
                            type="range" min="10" max="1000" value={brushSize} 
                            onChange={(e) => setBrushSize(Number(e.target.value))}
                            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cos-accent"
                        />
                    </div>
                    <div className="flex-1 space-y-2 select-none touch-manipulation" onDoubleClick={() => setBrushStrength(50)}>
                        <div className="flex justify-between text-xs text-white/60 pointer-events-none">
                            <span>強さ</span>
                            <span>{brushStrength}%</span>
                        </div>
                        <input 
                            type="range" min="1" max="100" value={brushStrength} 
                            onChange={(e) => setBrushStrength(Number(e.target.value))}
                            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cos-accent"
                        />
                    </div>
                </div>
                
                <div className="flex justify-center">
                    <button onClick={onCancel} className="text-xs text-white/60 py-2">キャンセル</button>
                </div>
            </div>
        </div>
    </div>
  );
};

const ToolButton: React.FC<{ active: boolean, onClick: () => void, label: string, icon: React.ReactNode }> = ({ active, onClick, label, icon }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all flex-1 ${active ? 'bg-cos-accent text-white shadow-lg' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
    >
        {icon}
        <span className="text-[10px] font-bold">{label}</span>
    </button>
);
