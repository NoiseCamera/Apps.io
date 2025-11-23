
import React, { useRef, useEffect, useState } from 'react';
import { Button } from './Button';
import { Spinner } from './Spinner';
import { generateAIMask, generateAIMaskFromPoint, MaskTarget } from '../services/geminiService';

interface MaskEditorProps {
  imageSrc: string;
  initialMask: string | null;
  onSave: (maskSrc: string | null) => void;
  onCancel: () => void;
}

export const MaskEditor: React.FC<MaskEditorProps> = ({ imageSrc, initialMask, onSave, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [brushSize, setBrushSize] = useState(50);
  const [brushHardness, setBrushHardness] = useState(80); // Default firmer hardness
  const [brushOpacity, setBrushOpacity] = useState(100);
  const [activeTool, setActiveTool] = useState<'brush' | 'eraser' | 'magic'>('brush');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [currentAiTarget, setCurrentAiTarget] = useState<string>('');
  
  // Zoom/Pan State
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const pointersRef = useRef<Map<number, { x: number, y: number }>>(new Map());
  const lastPinchDist = useRef<number>(0);
  const isInteracting = useRef(false);
  const lastPos = useRef<{x: number, y: number} | null>(null);
  const startPos = useRef<{x: number, y: number} | null>(null); // To detect taps vs drags
  const isDrawing = useRef(false);

  // Setup Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
        // Fit canvas to screen logic
        const maxDim = 1600; // Increased resolution for better zoom detail
        let w = img.width;
        let h = img.height;
        
        if (w > maxDim || h > maxDim) {
            const ratio = w / h;
            if (w > h) { w = maxDim; h = maxDim / ratio; } 
            else { h = maxDim; w = maxDim * ratio; }
        }
        
        canvas.width = w;
        canvas.height = h;
        
        // If there is an existing mask, draw it
        if (initialMask) {
            const maskImg = new Image();
            maskImg.src = initialMask;
            maskImg.onload = () => {
                // Draw the existing mask.
                ctx.drawImage(maskImg, 0, 0, w, h);
                
                // Convert White to RED for the editor visualization
                ctx.globalCompositeOperation = 'source-in';
                ctx.fillStyle = 'rgba(255, 0, 0, 1.0)'; // Full strength red
                ctx.fillRect(0, 0, w, h);
                
                // Reset
                ctx.globalCompositeOperation = 'source-over';
            };
        }
    };
  }, [imageSrc, initialMask]);

  // --- Coordinate Mapping (Screen <-> Canvas) ---
  const getPointerPos = (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      
      const rect = canvas.getBoundingClientRect();
      // rect includes the CSS transform (scale).
      // canvas.width is the internal pixel width.
      
      // We need to map the client coordinates relative to the rect, back to internal pixels.
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      return {
          x: (clientX - rect.left) * scaleX,
          y: (clientY - rect.top) * scaleY
      };
  };

  // --- Drawing Logic ---
  const draw = (x: number, y: number) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx || !lastPos.current) return;

      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(x, y);
      
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = brushSize; // Brush size is in canvas pixels
      
      // Hardness simulation
      const blurAmount = (100 - brushHardness) * (brushSize / 100); 
      ctx.shadowBlur = blurAmount;
      
      if (activeTool === 'eraser') {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.shadowColor = 'rgba(0,0,0,1)';
          ctx.strokeStyle = `rgba(0, 0, 0, ${brushOpacity/100})`;
      } else {
          ctx.globalCompositeOperation = 'source-over';
          ctx.shadowColor = 'rgba(255, 0, 0, 1)';
          // Paint with Red. Opacity is handled here for "pressure", 
          // but typically for a mask we want solid. 
          ctx.strokeStyle = `rgba(255, 0, 0, ${brushOpacity/100})`; 
      }

      ctx.stroke();
      ctx.shadowBlur = 0; // Reset
      lastPos.current = { x, y };
  };

  // --- Gesture Handling (Zoom/Pan/Draw) ---

  const handlePointerDown = (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      isInteracting.current = true;

      // If single pointer
      if (pointersRef.current.size === 1) {
          if (activeTool === 'magic') {
              // For Magic Wand, we detect click on Up, but track start pos here
              startPos.current = { x: e.clientX, y: e.clientY };
              lastPos.current = getPointerPos(e.clientX, e.clientY); // Store just in case needed for drag threshold check
          } else {
              // Brush/Eraser: Start drawing immediately
              const { x, y } = getPointerPos(e.clientX, e.clientY);
              lastPos.current = { x, y };
              isDrawing.current = true;
              draw(lastPos.current.x, lastPos.current.y);
          }
      } else {
          // Multi-touch: Cancel drawing state
          lastPos.current = null;
          isDrawing.current = false;
      }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      if (!pointersRef.current.has(e.pointerId)) return;
      
      const prevPtr = pointersRef.current.get(e.pointerId)!;
      // Update pointer position
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      
      const pts = Array.from(pointersRef.current.values()) as { x: number, y: number }[];

      // Case: Pinch/Zoom (2+ fingers)
      if (pts.length >= 2) {
          isDrawing.current = false;
          const p1 = pts[0];
          const p2 = pts[1];
          const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);

          if (lastPinchDist.current > 0) {
              const zoomFactor = dist / lastPinchDist.current;
              setTransform(prev => {
                  let newScale = prev.scale * zoomFactor;
                  newScale = Math.min(Math.max(1, newScale), 10); // Limit zoom
                  
                  const dx = e.clientX - prevPtr.x;
                  const dy = e.clientY - prevPtr.y;
                  
                  return {
                      ...prev,
                      scale: newScale,
                      x: prev.x + dx,
                      y: prev.y + dy
                  };
              });
          }
          lastPinchDist.current = dist;
          lastPos.current = null; 
      } 
      // Case: Single Finger
      else if (pts.length === 1) {
          if (activeTool !== 'magic' && isDrawing.current && lastPos.current) {
              const { x, y } = getPointerPos(e.clientX, e.clientY);
              draw(x, y);
          }
      }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
      pointersRef.current.delete(e.pointerId);
      if (pointersRef.current.size < 2) {
          lastPinchDist.current = 0;
      }
      
      // Handle Magic Wand Click Detection
      if (activeTool === 'magic' && startPos.current && pointersRef.current.size === 0 && !isDrawing.current && !lastPinchDist.current) {
          const dist = Math.hypot(e.clientX - startPos.current.x, e.clientY - startPos.current.y);
          if (dist < 10) { // Threshold for tap vs drag
              // It was a tap!
              const { x, y } = getPointerPos(e.clientX, e.clientY);
              handlePointMask(x, y);
          }
      }

      if (pointersRef.current.size === 0) {
          isInteracting.current = false;
          lastPos.current = null;
          startPos.current = null;
          isDrawing.current = false;
      }
  };

  // --- Actions ---

  const handleInvert = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx?.drawImage(canvas, 0, 0);
      
      ctx.clearRect(0,0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(255, 0, 0, 1.0)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.drawImage(tempCanvas, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
  };

  const handleClear = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      ctx?.clearRect(0, 0, canvas!.width, canvas!.height);
  };
  
  const applyAiMask = async (maskDataUrl: string) => {
      const maskImg = new Image();
      maskImg.src = maskDataUrl;
      await new Promise(resolve => maskImg.onload = resolve);
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      const tempC = document.createElement('canvas');
      tempC.width = canvas.width;
      tempC.height = canvas.height;
      const tempCtx = tempC.getContext('2d');
      if (!tempCtx) return;
      
      tempCtx.drawImage(maskImg, 0, 0, canvas.width, canvas.height);
      const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      const newImageData = ctx.createImageData(canvas.width, canvas.height);
      const newData = newImageData.data;

      // SMART ALPHA MAPPING with Anti-Aliasing preservation
      const LOW_THRESHOLD = 15;
      const HIGH_THRESHOLD = 240;
      const RANGE = HIGH_THRESHOLD - LOW_THRESHOLD;
      
      for(let i=0; i<data.length; i+=4) {
          const brightness = (data[i] + data[i+1] + data[i+2]) / 3;
          let alpha = 0;

          if (brightness >= HIGH_THRESHOLD) {
              alpha = 255;
          } else if (brightness <= LOW_THRESHOLD) {
              alpha = 0;
          } else {
              // Smooth ramp
              alpha = ((brightness - LOW_THRESHOLD) / RANGE) * 255;
          }

          // In MaskEditor, we visualize with RED (255,0,0) + Alpha
          if (alpha > 0) {
              newData[i] = 255;   // R
              newData[i+1] = 0;   // G
              newData[i+2] = 0;   // B
              newData[i+3] = alpha; // Alpha
          }
      }
      
      // Replace current mask with new AI mask
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.putImageData(newImageData, 0, 0);
  };

  const handleAutoMask = async (target: MaskTarget) => {
      if (!imageSrc || isAiLoading) return;
      setIsAiLoading(true);
      setShowAiMenu(false);

      const labelMap: Record<string, string> = {
          'person': '被写体',
          'background': '背景',
          'hair': '髪',
          'face_only': '顔（肌）',
          'skin': '肌（全身）',
          'clothes': '衣装'
      };
      setCurrentAiTarget(labelMap[target] || target);
      
      try {
          const maskDataUrl = await generateAIMask(imageSrc, target);
          await applyAiMask(maskDataUrl);
      } catch (error) {
          alert('AIマスク生成に失敗しました。');
      } finally {
          setIsAiLoading(false);
          setCurrentAiTarget('');
      }
  };

  const handlePointMask = async (x: number, y: number) => {
      if (!imageSrc || isAiLoading) return;
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      // Normalize coordinates to 0..1
      const normX = Math.max(0, Math.min(1, x / canvas.width));
      const normY = Math.max(0, Math.min(1, y / canvas.height));

      setIsAiLoading(true);
      setCurrentAiTarget('選択エリア'); 
      
      try {
          const maskDataUrl = await generateAIMaskFromPoint(imageSrc, normX, normY);
          await applyAiMask(maskDataUrl);
      } catch (error) {
          alert('自動選択に失敗しました。');
      } finally {
          setIsAiLoading(false);
          setCurrentAiTarget('');
      }
  };

  const handleSaveInternal = () => {
      setIsProcessing(true);
      setTimeout(() => {
          const canvas = canvasRef.current;
          if (!canvas) return;

          const exportCanvas = document.createElement('canvas');
          exportCanvas.width = canvas.width;
          exportCanvas.height = canvas.height;
          const ctx = exportCanvas.getContext('2d');
          
          if (ctx) {
              ctx.drawImage(canvas, 0, 0);
              // Convert Red to White for the final mask usage
              ctx.globalCompositeOperation = 'source-in';
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          
          onSave(exportCanvas.toDataURL('image/png'));
      }, 50);
  };

  const maskOptions: { id: MaskTarget, label: string }[] = [
      { id: 'person', label: '人物 (全体)' },
      { id: 'background', label: '背景' },
      { id: 'hair', label: '髪・ウィッグ' },
      { id: 'face_only', label: '顔 (肌のみ)' },
      { id: 'skin', label: '肌 (全身)' },
      { id: 'clothes', label: '衣装・コスチューム' },
  ];

  const resetZoom = () => setTransform({ x: 0, y: 0, scale: 1 });

  return (
    <div className="flex flex-col h-full bg-cos-dark/80 backdrop-blur-xl z-50 absolute inset-0">
        <div className="h-14 px-4 flex items-center justify-between border-b border-white/10 bg-black/50 z-10 shrink-0">
            <h2 className="font-bold text-white flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cos-accent" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
                </svg>
                部分補正マスク
            </h2>
            <div className="flex gap-2">
                <Button variant="primary" onClick={handleSaveInternal} className="!py-1 !px-4">{isProcessing ? <Spinner/> : '決定'}</Button>
            </div>
        </div>

        {/* Canvas Viewport */}
        <div className="flex-1 relative overflow-hidden touch-none flex items-center justify-center">
             {/* Wrapper for Transform */}
            <div 
                className="relative transition-transform duration-100 ease-out"
                style={{ 
                    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                {/* Background Image */}
                <img 
                    src={imageSrc} 
                    className="absolute max-w-none max-h-none object-contain pointer-events-none" 
                    style={{
                        maxWidth: '100%',
                        maxHeight: '100%'
                    }}
                    alt="reference" 
                />
                
                {/* Mask Canvas */}
                <canvas 
                    ref={canvasRef}
                    className="max-w-none max-h-none object-contain cursor-crosshair relative z-10 opacity-60" 
                    style={{
                        maxWidth: '100%',
                        maxHeight: '100%'
                    }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                />
            </div>
            
            {/* Reset Zoom Button */}
            {transform.scale > 1 && (
                <button 
                    onClick={resetZoom}
                    className="absolute bottom-24 left-4 bg-slate-800/80 text-white text-xs px-3 py-1.5 rounded-full border border-slate-600 backdrop-blur shadow-lg z-20"
                >
                    リセット ({Math.round(transform.scale * 100)}%)
                </button>
            )}

            {/* AI Loading Overlay */}
            {isAiLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm">
                    <div className="bg-cos-panel p-6 rounded-2xl border border-slate-700 flex flex-col items-center shadow-2xl">
                        <Spinner />
                        <p className="mt-4 text-sm text-white font-bold tracking-wide">AI解析中...</p>
                        <p className="text-xs text-cos-muted mt-1">{currentAiTarget}を抽出しています</p>
                    </div>
                </div>
            )}

            {/* AI Menu Overlay */}
            {showAiMenu && (
                <div className="absolute inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-end justify-center pb-32" onClick={() => setShowAiMenu(false)}>
                    <div className="bg-cos-panel border border-slate-700 rounded-xl shadow-2xl w-64 overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="px-4 py-3 border-b border-slate-700 bg-slate-800">
                            <h3 className="text-xs font-bold text-white uppercase tracking-wider">AI 自動マスク選択</h3>
                        </div>
                        <div className="divide-y divide-slate-700 max-h-64 overflow-y-auto no-scrollbar">
                            {maskOptions.map(opt => (
                                <button 
                                    key={opt.id}
                                    onClick={() => handleAutoMask(opt.id)}
                                    className="w-full text-left px-4 py-3 text-sm text-slate-200 hover:bg-cos-accent hover:text-white transition-colors flex items-center justify-between"
                                >
                                    {opt.label}
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>

        <div className="bg-black/80 backdrop-blur p-4 border-t border-white/10 safe-area-bottom shrink-0">
            <div className="max-w-lg mx-auto space-y-4">
                {/* Tools */}
                <div className="flex justify-center gap-2 mb-2 overflow-x-auto pb-2 no-scrollbar">
                    <button onClick={() => setShowAiMenu(!showAiMenu)} className={`flex flex-col items-center gap-1 p-2 rounded-lg w-16 transition-all shrink-0 ${showAiMenu ? 'bg-white text-cos-accent scale-105' : 'bg-gradient-to-br from-purple-600 to-blue-600 text-white'}`}>
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                        <span className="text-[10px] font-bold">リスト</span>
                    </button>
                    <div className="w-px bg-white/10 mx-1"></div>

                    <button onClick={() => setActiveTool('magic')} className={`flex flex-col items-center gap-1 p-2 rounded-lg w-16 ${activeTool === 'magic' ? 'bg-cos-accent text-white' : 'bg-white/10 text-white/60'} shrink-0`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" /></svg>
                        <span className="text-[10px] font-bold">自動選択</span>
                    </button>
                    
                    <button onClick={() => setActiveTool('brush')} className={`flex flex-col items-center gap-1 p-2 rounded-lg w-16 ${activeTool === 'brush' ? 'bg-cos-accent text-white' : 'bg-white/10 text-white/60'} shrink-0`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                        <span className="text-[10px]">描画</span>
                    </button>
                    <button onClick={() => setActiveTool('eraser')} className={`flex flex-col items-center gap-1 p-2 rounded-lg w-16 ${activeTool === 'eraser' ? 'bg-cos-accent text-white' : 'bg-white/10 text-white/60'} shrink-0`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        <span className="text-[10px]">消しゴム</span>
                    </button>
                    <div className="w-px bg-white/10 mx-1"></div>
                    <button onClick={handleInvert} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/10 text-white/60 hover:text-white shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                        <span className="text-[10px]">反転</span>
                    </button>
                    <button onClick={handleClear} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-white/10 text-white/60 hover:text-white shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        <span className="text-[10px]">全消去</span>
                    </button>
                </div>

                {/* Sliders */}
                {activeTool !== 'magic' && (
                    <div className="grid grid-cols-3 gap-4 animate-fade-in">
                        <div className="space-y-1">
                            <label className="text-[10px] text-white/60">サイズ {brushSize}</label>
                            <input type="range" min="5" max="150" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} className="w-full h-1 bg-white/20 rounded-lg appearance-none accent-cos-accent" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-white/60">ぼかし {100 - brushHardness}</label>
                            <input type="range" min="0" max="100" value={brushHardness} onChange={e => setBrushHardness(Number(e.target.value))} className="w-full h-1 bg-white/20 rounded-lg appearance-none accent-cos-accent" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-white/60">濃度 {brushOpacity}</label>
                            <input type="range" min="10" max="100" value={brushOpacity} onChange={e => setBrushOpacity(Number(e.target.value))} className="w-full h-1 bg-white/20 rounded-lg appearance-none accent-cos-accent" />
                        </div>
                    </div>
                )}
                
                {activeTool === 'magic' && (
                     <div className="text-center text-xs text-white/60 py-2 animate-fade-in">
                         画面上の選択したい物体をタップしてください
                     </div>
                )}

                <div className="flex justify-center">
                    <button onClick={onCancel} className="text-xs text-white/60 py-2">キャンセル</button>
                </div>
            </div>
        </div>
    </div>
  );
};
