
import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { Spinner } from './Spinner';
import { IconRotateLeft, IconFlipHorizontal, IconCheck, IconX } from './Icon';

interface CropEditorProps {
  imageSrc: string;
  onApply: (newImageSrc: string) => void;
  onCancel: () => void;
}

type AspectRatio = 'free' | '1:1' | '4:5' | '16:9' | '9:16' | '2:3' | '3:4';

export const CropEditor: React.FC<CropEditorProps> = ({ imageSrc, onApply, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Transform State
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('free');
  
  // Image handling
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const [maskRect, setMaskRect] = useState({ x: 0, y: 0, w: 0, h: 0 });

  // Interaction
  const isDragging = useRef(false);
  const lastPos = useRef<{x:number, y:number} | null>(null);
  const lastPinchDist = useRef(0);

  useEffect(() => {
      const i = new Image();
      i.crossOrigin = "anonymous";
      i.src = imageSrc;
      i.onload = () => {
          setImg(i);
          fitImageToScreen(i);
      };
  }, [imageSrc]);

  const fitImageToScreen = (image: HTMLImageElement) => {
      // Determine max canvas size based on viewport
      const maxW = window.innerWidth;
      const maxH = window.innerHeight * 0.6; // Reserve space for controls
      
      let w = image.width;
      let h = image.height;
      const ratio = w / h;

      if (w > maxW) { w = maxW; h = w / ratio; }
      if (h > maxH) { h = maxH; w = h * ratio; }

      setCanvasSize({ w, h });
      // Initial fit: Image fits within canvas
      const initialScale = Math.min(w / image.width, h / image.height);
      setScale(initialScale);
      
      // Set initial mask to full canvas (free)
      setMaskRect({ x: 0, y: 0, w: w, h: h });
  };

  // Update mask when aspect ratio changes
  useEffect(() => {
      if (!img || canvasSize.w === 0) return;
      
      const { w, h } = canvasSize;
      let mw = w;
      let mh = h;
      
      if (aspectRatio !== 'free') {
          const [rw, rh] = aspectRatio.split(':').map(Number);
          const targetRatio = rw / rh;
          const currentRatio = w / h;
          
          if (targetRatio > currentRatio) {
              // Target is wider, bound by width
              mw = w;
              mh = w / targetRatio;
          } else {
              // Target is taller, bound by height
              mh = h;
              mw = h * targetRatio;
          }
      }
      
      setMaskRect({
          x: (w - mw) / 2,
          y: (h - mh) / 2,
          w: mw,
          h: mh
      });
      
      // Reset adjustments slightly when changing ratio to ensure image covers area if possible
      // But usually users want to keep their zoom/pan.
      // Ensure image covers mask if possible? Logic omitted for simplicity, manual adjust is fine.

  }, [aspectRatio, canvasSize, img]);

  // Render Loop
  useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || !img) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      ctx.save();
      
      // 1. Draw Image transformed
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      
      ctx.translate(cx + offsetX, cy + offsetY);
      ctx.rotate(rotation * Math.PI / 180);
      ctx.scale(flipX ? -scale : scale, scale);
      ctx.drawImage(img, -img.width/2, -img.height/2);
      
      ctx.restore();

      // 2. Draw Mask Overlay (Darken outside)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.beginPath();
      ctx.rect(0, 0, canvas.width, canvas.height); // Full rect
      // Subtract mask rect
      ctx.rect(maskRect.x, maskRect.y, maskRect.w, maskRect.h);
      ctx.fill('evenodd'); // Creates the hole

      // 3. Draw Grid inside Mask
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Verticals
      ctx.moveTo(maskRect.x + maskRect.w/3, maskRect.y);
      ctx.lineTo(maskRect.x + maskRect.w/3, maskRect.y + maskRect.h);
      ctx.moveTo(maskRect.x + maskRect.w*2/3, maskRect.y);
      ctx.lineTo(maskRect.x + maskRect.w*2/3, maskRect.y + maskRect.h);
      // Horizontals
      ctx.moveTo(maskRect.x, maskRect.y + maskRect.h/3);
      ctx.lineTo(maskRect.x + maskRect.w, maskRect.y + maskRect.h/3);
      ctx.moveTo(maskRect.x, maskRect.y + maskRect.h*2/3);
      ctx.lineTo(maskRect.x + maskRect.w, maskRect.y + maskRect.h*2/3);
      ctx.stroke();

      // 4. Draw Border
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(maskRect.x, maskRect.y, maskRect.w, maskRect.h);

  }, [img, scale, offsetX, offsetY, rotation, flipX, maskRect, canvasSize]);

  // --- Touch/Pointer Handlers ---
  const handlePointerDown = (e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      isDragging.current = true;
      lastPos.current = { x: e.clientX, y: e.clientY };
      lastPinchDist.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      if (!isDragging.current || !lastPos.current) return;
      
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      
      setOffsetX(prev => prev + dx);
      setOffsetY(prev => prev + dy);
      
      lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
      isDragging.current = false;
      lastPos.current = null;
  };

  // --- Save ---
  const handleSave = () => {
      if (!img) return;
      setIsProcessing(true);
      
      setTimeout(() => {
          const output = document.createElement('canvas');
          // High res export: Use mask size logic relative to original image scale
          // We need to map the screen mask rect back to the image space.
          
          // Actually, simplest way: Render strictly what is seen inside the maskRect to a new canvas
          // The scale of the output should be high.
          
          // Desired output width (e.g. 2048px max or mask size scaled up)
          const exportScale = Math.min(img.width / maskRect.w, img.height / maskRect.h) * scale; // Approximation
          
          // Let's just use the maskRect size * 2 or 3 for quality, or map back to image resolution.
          // Better: Determine the visible area on screen relative to the image, and crop that from high-res source.
          
          // Simplified approach: Render at screen resolution * pixelRatio * 2
          const pixelRatio = window.devicePixelRatio || 1;
          const outW = maskRect.w * pixelRatio * 2;
          const outH = maskRect.h * pixelRatio * 2;
          
          output.width = outW;
          output.height = outH;
          
          const ctx = output.getContext('2d');
          if (!ctx) return;
          
          // Fill with black (or transparent)
          ctx.clearRect(0,0,outW,outH);
          
          // Transform: move center to center of output, rotate, scale
          // We need to emulate the view transformation relative to the mask center.
          
          const viewCx = canvasSize.w / 2 + offsetX;
          const viewCy = canvasSize.h / 2 + offsetY;
          const maskCx = maskRect.x + maskRect.w / 2;
          const maskCy = maskRect.y + maskRect.h / 2;
          
          // The shift from mask center to view center
          const shiftX = viewCx - maskCx;
          const shiftY = viewCy - maskCy;
          
          // Apply scale factor for high res
          const s = (outW / maskRect.w); 
          
          ctx.save();
          ctx.translate(outW/2 + shiftX * s, outH/2 + shiftY * s);
          ctx.rotate(rotation * Math.PI / 180);
          ctx.scale((flipX ? -scale : scale) * s, scale * s);
          ctx.drawImage(img, -img.width/2, -img.height/2);
          ctx.restore();
          
          onApply(output.toDataURL('image/png', 0.95));
          setIsProcessing(false);
      }, 50);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col">
        {/* Top Bar */}
        <div className="h-14 px-4 flex items-center justify-between bg-black/50 shrink-0 z-10">
            <button onClick={onCancel} className="text-white/70 hover:text-white"><IconX className="w-6 h-6"/></button>
            <span className="text-white font-bold text-sm">切り抜き・回転</span>
            <button onClick={handleSave} className="text-cos-accent hover:text-white font-bold">
                {isProcessing ? <Spinner/> : <IconCheck className="w-6 h-6"/>}
            </button>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative bg-zinc-900 flex items-center justify-center overflow-hidden touch-none">
            <canvas 
                ref={canvasRef}
                width={canvasSize.w}
                height={canvasSize.h}
                className="cursor-move"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            />
        </div>

        {/* Controls */}
        <div className="bg-zinc-900 pb-safe border-t border-white/10 p-4 space-y-6">
            {/* Rotation / Scale Sliders */}
            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <IconRotateLeft className="w-5 h-5 text-white/50" />
                    <input 
                        type="range" min="-45" max="45" value={rotation % 90 === 0 ? 0 : rotation} 
                        onChange={(e) => setRotation(Number(e.target.value))}
                        className="flex-1 h-1 bg-white/20 rounded-full accent-cos-accent"
                    />
                    <span className="text-xs text-white/50 w-8 text-right">{rotation}°</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-xs text-white/50">Zoom</span>
                    <input 
                        type="range" min="0.1" max="3.0" step="0.05" value={scale} 
                        onChange={(e) => setScale(Number(e.target.value))}
                        className="flex-1 h-1 bg-white/20 rounded-full accent-cos-accent"
                    />
                </div>
            </div>

            {/* Tools Row */}
            <div className="flex justify-around items-center">
                <button onClick={() => setRotation(r => r - 90)} className="flex flex-col items-center gap-1 text-white/70 hover:text-white">
                    <IconRotateLeft className="w-6 h-6" />
                    <span className="text-[10px]">90°回転</span>
                </button>
                <button onClick={() => setFlipX(!flipX)} className="flex flex-col items-center gap-1 text-white/70 hover:text-white">
                    <IconFlipHorizontal className="w-6 h-6" />
                    <span className="text-[10px]">反転</span>
                </button>
                <button onClick={() => {setRotation(0); setScale(canvasSize.w ? Math.min(canvasSize.w/img!.width, canvasSize.h/img!.height) : 1); setOffsetX(0); setOffsetY(0);}} className="flex flex-col items-center gap-1 text-white/70 hover:text-white">
                    <span className="text-xl font-bold">R</span>
                    <span className="text-[10px]">リセット</span>
                </button>
            </div>

            {/* Aspect Ratio */}
            <div className="flex overflow-x-auto gap-3 no-scrollbar pb-2">
                {(['free', '1:1', '4:5', '16:9', '9:16', '3:4'] as const).map(r => (
                    <button 
                        key={r} 
                        onClick={() => setAspectRatio(r)}
                        className={`px-3 py-1.5 rounded-full border text-xs font-bold whitespace-nowrap transition-all ${aspectRatio === r ? 'bg-cos-accent border-cos-accent text-white' : 'border-white/20 text-white/60'}`}
                    >
                        {r === 'free' ? 'フリー' : r}
                    </button>
                ))}
            </div>
        </div>
    </div>
  );
};
