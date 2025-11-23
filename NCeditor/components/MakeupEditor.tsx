
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from './Button';
import { Spinner } from './Spinner';

interface MakeupEditorProps {
  imageSrc: string;
  onApply: (newImageSrc: string) => void;
  onCancel: () => void;
}

type BrushType = 'lip' | 'blush' | 'eye' | 'wig' | 'contact' | 'liner' | 'eraser' | 'blur';

export const MakeupEditor: React.FC<MakeupEditorProps> = ({ imageSrc, onApply, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeBrush, setActiveBrush] = useState<BrushType>('lip');
  
  // Brush State
  const [brushColor, setBrushColor] = useState('#ec4899');
  const [brushSize, setBrushSize] = useState(30);
  const [brushOpacity, setBrushOpacity] = useState(50);
  
  // Zoom/Pan State
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const pointersRef = useRef<Map<number, { x: number, y: number }>>(new Map());
  const lastPinchDist = useRef<number>(0);
  const isInteracting = useRef(false);
  const lastPos = useRef<{x: number, y: number} | null>(null);
  const isDrawing = useRef(false);

  // Undo/Redo
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const originalDataRef = useRef<ImageData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Optimization: Cached Brush Tip & Scratch Canvas for Blur
  const brushTipRef = useRef<HTMLCanvasElement | null>(null);
  const scratchCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize
  useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const img = new Image();
      img.src = imageSrc;
      img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
          originalDataRef.current = data;
          setHistory([data]);
          setHistoryIndex(0);
          
          setToolDefaults('lip');
      };
  }, [imageSrc]);

  // Initialize Scratch Canvas
  useEffect(() => {
      if (!scratchCanvasRef.current) {
          scratchCanvasRef.current = document.createElement('canvas');
      }
  }, []);

  // Generate Brush Tip (Offscreen Canvas) for High Performance
  const updateBrushTip = useCallback(() => {
      const size = brushSize;
      const hardness = activeBrush === 'liner' ? 0.8 : 0.0; // Liner is harder, others soft airbrush
      
      const tip = document.createElement('canvas');
      tip.width = size;
      tip.height = size;
      const ctx = tip.getContext('2d');
      if (!ctx) return;

      const radius = size / 2;
      const center = size / 2;

      // Radial Gradient for Airbrush look
      const grad = ctx.createRadialGradient(center, center, radius * hardness, center, center, radius);
      
      if (activeBrush === 'eraser' || activeBrush === 'blur') {
          // For eraser/blur, we need a solid alpha map (white to transparent)
          // to use as a destination-in mask
          grad.addColorStop(0, 'rgba(255,255,255,1)');
          grad.addColorStop(1, 'rgba(255,255,255,0)');
      } else {
          grad.addColorStop(0, brushColor);
          grad.addColorStop(1, 'rgba(0,0,0,0)'); // Fully transparent edge
      }

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      
      brushTipRef.current = tip;
  }, [brushSize, brushColor, activeBrush]);

  // Update brush tip when settings change
  useEffect(() => {
      updateBrushTip();
  }, [updateBrushTip]);

  const setToolDefaults = (type: BrushType) => {
      setActiveBrush(type);
      switch(type) {
          case 'lip':
              setBrushColor('#d946ef');
              setBrushSize(30);
              setBrushOpacity(50);
              break;
          case 'blush':
              setBrushColor('#fda4af');
              setBrushSize(80);
              setBrushOpacity(20); 
              break;
          case 'eye':
              setBrushColor('#a855f7');
              setBrushSize(40);
              setBrushOpacity(30);
              break;
          case 'wig':
              setBrushColor('#3b82f6');
              setBrushSize(100);
              setBrushOpacity(40);
              break;
          case 'contact':
              setBrushColor('#22d3ee');
              setBrushSize(20);
              setBrushOpacity(60);
              break;
          case 'liner':
              setBrushColor('#000000');
              setBrushSize(5);
              setBrushOpacity(80);
              break;
          case 'eraser':
              setBrushSize(40);
              setBrushOpacity(100);
              break;
          case 'blur':
              setBrushSize(50);
              setBrushOpacity(50);
              break;
      }
  };

  const getPointerPos = (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      return {
          x: (clientX - rect.left) * scaleX,
          y: (clientY - rect.top) * scaleY
      };
  };

  // --- High Performance Stamping Engine ---
  const drawStroke = (startX: number, startY: number, endX: number, endY: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const tip = brushTipRef.current;
      if (!canvas || !ctx || !tip) return;

      const dist = Math.hypot(endX - startX, endY - startY);
      
      // Spacing: draw a stamp every X pixels. 
      const spacing = Math.max(1, brushSize * 0.1); 
      
      const steps = Math.ceil(dist / spacing);
      
      // Blur Logic
      if (activeBrush === 'blur') {
        const scratch = scratchCanvasRef.current;
        if (!scratch) return;
        const sCtx = scratch.getContext('2d');
        if (!sCtx) return;
        
        scratch.width = brushSize;
        scratch.height = brushSize;
        const r = brushSize / 2;

        // Blur strength based on opacity slider
        const blurAmount = (brushOpacity / 100) * 10; 

        for (let i = 0; i <= steps; i++) {
            const t = steps === 0 ? 0 : i / steps;
            const cx = startX + (endX - startX) * t;
            const cy = startY + (endY - startY) * t;
            
            const x = cx - r;
            const y = cy - r;

            sCtx.clearRect(0, 0, brushSize, brushSize);
            sCtx.filter = `blur(${blurAmount}px)`;
            sCtx.drawImage(canvas, x, y, brushSize, brushSize, 0, 0, brushSize, brushSize);
            sCtx.filter = 'none';

            sCtx.globalCompositeOperation = 'destination-in';
            sCtx.drawImage(tip, 0, 0, brushSize, brushSize);
            
            sCtx.globalCompositeOperation = 'source-over';
            ctx.drawImage(scratch, x, y);
        }
        return;
      }

      // Standard Brush Logic
      ctx.globalAlpha = activeBrush === 'eraser' ? 1.0 : (brushOpacity / 100) * 0.15; 
      
      if (activeBrush === 'eraser') {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.globalAlpha = (brushOpacity / 100); 
      } else if (activeBrush === 'lip' || activeBrush === 'blush' || activeBrush === 'wig') {
          ctx.globalCompositeOperation = 'soft-light'; // Better for tinting
          if (activeBrush === 'wig') ctx.globalCompositeOperation = 'overlay'; // Stronger for hair
      } else if (activeBrush === 'eye') {
          ctx.globalCompositeOperation = 'multiply';
      } else if (activeBrush === 'contact') {
          ctx.globalCompositeOperation = 'color-dodge'; // Glowing eyes
      } else {
          ctx.globalCompositeOperation = 'source-over';
      }

      const offset = brushSize / 2;

      for (let i = 0; i < steps; i++) {
          const t = steps === 0 ? 0 : i / steps;
          const x = startX + (endX - startX) * t;
          const y = startY + (endY - startY) * t;
          ctx.drawImage(tip, x - offset, y - offset);
      }
      
      // Ensure end point is hit
      if (steps > 0) {
          ctx.drawImage(tip, endX - offset, endY - offset);
      }

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
  };
  
  // --- Pointer Events ---

  const handlePointerDown = (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      isInteracting.current = true;

      if (pointersRef.current.size === 1) {
          const { x, y } = getPointerPos(e.clientX, e.clientY);
          lastPos.current = { x, y };
          isDrawing.current = true;
          drawStroke(x, y, x, y);
      }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      if (!pointersRef.current.has(e.pointerId)) return;
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const pts = Array.from(pointersRef.current.values()) as { x: number, y: number }[];

      if (pts.length >= 2) {
           // Zoom/Pan
           isDrawing.current = false;
           const p1 = pts[0];
           const p2 = pts[1];
           const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);

           if (lastPinchDist.current > 0) {
              const zoomFactor = dist / lastPinchDist.current;
              setTransform(prev => {
                  const newScale = Math.min(Math.max(1, prev.scale * zoomFactor), 8);
                  const dx = e.movementX; 
                  const dy = e.movementY;
                  return { ...prev, scale: newScale, x: prev.x + dx, y: prev.y + dy };
              });
           }
           lastPinchDist.current = dist;
      } else if (pts.length === 1 && isDrawing.current && lastPos.current) {
          const { x, y } = getPointerPos(e.clientX, e.clientY);
          drawStroke(lastPos.current.x, lastPos.current.y, x, y);
          lastPos.current = { x, y };
      }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
      pointersRef.current.delete(e.pointerId);
      if (pointersRef.current.size < 2) lastPinchDist.current = 0;
      if (pointersRef.current.size === 0) {
          isInteracting.current = false;
          isDrawing.current = false;
          
          const canvas = canvasRef.current;
          if (canvas) {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                  const newData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                  const newHistory = history.slice(0, historyIndex + 1);
                  newHistory.push(newData);
                  if (newHistory.length > 10) newHistory.shift();
                  setHistory(newHistory);
                  setHistoryIndex(newHistory.length - 1);
              }
          }
      }
  };

  const handleUndo = () => {
      if (historyIndex > 0) {
          const newIdx = historyIndex - 1;
          setHistoryIndex(newIdx);
          canvasRef.current?.getContext('2d')?.putImageData(history[newIdx], 0, 0);
      }
  };
  
  const handleRedo = () => {
      if (historyIndex < history.length - 1) {
          const newIdx = historyIndex + 1;
          setHistoryIndex(newIdx);
          canvasRef.current?.getContext('2d')?.putImageData(history[newIdx], 0, 0);
      }
  };

  const handleSave = () => {
      if (!canvasRef.current) return;
      setIsProcessing(true);
      setTimeout(() => {
          onApply(canvasRef.current!.toDataURL('image/png'));
      }, 50);
  };

  // Colors for quick picking
  const colors = [
      '#ec4899', // Pink
      '#ef4444', // Red
      '#3b82f6', // Blue
      '#22c55e', // Green
      '#eab308', // Gold
      '#a855f7', // Purple
      '#06b6d4', // Cyan
      '#f97316', // Orange
      '#000000', // Black
      '#ffffff', // White
  ];

  return (
    <div className="flex flex-col h-full bg-cos-dark/90 backdrop-blur-xl z-50 absolute inset-0">
       {/* Header */}
       <div className="h-14 px-4 flex items-center justify-between border-b border-white/10 bg-black/50 z-10 shrink-0">
            <h2 className="font-bold text-white flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cos-accent" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                手動メイク
            </h2>
            <div className="flex gap-2">
                <div className="flex mr-2 bg-white/10 rounded-lg">
                    <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-2 text-white/50 hover:text-white disabled:opacity-30"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"/></svg></button>
                    <div className="w-px bg-white/10 my-2"></div>
                    <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-2 text-white/50 hover:text-white disabled:opacity-30"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3"/></svg></button>
                </div>
                <Button variant="primary" onClick={handleSave} className="!py-1 !px-4">{isProcessing ? <Spinner/> : '完了'}</Button>
            </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden touch-none flex items-center justify-center bg-black">
            <div 
                style={{ 
                    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                    width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
            >
                <canvas 
                    ref={canvasRef}
                    className="max-w-none max-h-none object-contain shadow-2xl"
                    style={{ maxWidth: '100%', maxHeight: '100%' }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                />
            </div>
             {/* Reset Zoom */}
             {transform.scale > 1 && (
                <button 
                    onClick={() => setTransform({x:0, y:0, scale:1})} 
                    className="absolute bottom-48 left-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full border border-white/10 backdrop-blur z-20"
                >
                    リセット ({Math.round(transform.scale * 100)}%)
                </button>
            )}
        </div>

        {/* Controls */}
        <div className="bg-black/80 backdrop-blur p-4 border-t border-white/10 safe-area-bottom shrink-0">
            <div className="max-w-lg mx-auto space-y-4">
                
                {/* Brush Type Selector */}
                <div className="flex justify-between bg-white/5 p-1 rounded-xl overflow-x-auto no-scrollbar">
                    {[
                        {id: 'lip', label: 'リップ', icon: '💋'},
                        {id: 'blush', label: 'チーク', icon: '😊'},
                        {id: 'eye', label: 'アイ', icon: '👁️'},
                        {id: 'wig', label: 'ウィッグ', icon: '💇‍♀️'},
                        {id: 'contact', label: 'カラコン', icon: '✨'},
                        {id: 'liner', label: 'ライン', icon: '✏️'},
                        {id: 'blur', label: 'ぼかし', icon: '💧'},
                        {id: 'eraser', label: '修正', icon: '🧹'},
                    ].map(t => (
                        <button 
                            key={t.id} 
                            onClick={() => setToolDefaults(t.id as BrushType)}
                            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg min-w-[60px] transition-all ${activeBrush === t.id ? 'bg-cos-accent text-white shadow-lg' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
                        >
                            <span className="text-lg">{t.icon}</span>
                            <span className="text-[10px] font-bold">{t.label}</span>
                        </button>
                    ))}
                </div>

                {/* Settings & Color */}
                {activeBrush !== 'eraser' && activeBrush !== 'blur' && (
                    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
                        <input type="color" value={brushColor} onChange={e => setBrushColor(e.target.value)} className="w-8 h-8 rounded-full overflow-hidden border-none p-0 bg-transparent shrink-0" />
                        {colors.map(c => (
                            <button key={c} onClick={() => setBrushColor(c)} className={`w-6 h-6 rounded-full border border-white/20 shrink-0 ${brushColor === c ? 'scale-125 ring-2 ring-white' : ''}`} style={{backgroundColor: c}} />
                        ))}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-white/60"><span>サイズ</span><span>{brushSize}</span></div>
                        <input type="range" min="2" max="150" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className="w-full h-1 bg-white/20 rounded-lg appearance-none accent-cos-accent" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-white/60">
                            <span>{activeBrush === 'blur' ? '強さ' : '濃さ'}</span>
                            <span>{brushOpacity}%</span>
                        </div>
                        <input type="range" min="1" max="100" value={brushOpacity} onChange={e => setBrushOpacity(Number(e.target.value))} className="w-full h-1 bg-white/20 rounded-lg appearance-none accent-cos-accent" />
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
