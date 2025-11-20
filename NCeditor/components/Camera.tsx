
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { FACTORY_PRESETS } from '../data/presets';
import { Point } from '../types';

interface CameraProps {
  onCapture: (imageSrc: string) => void;
  onClose: () => void;
}

type AspectRatio = '3:4' | '9:16' | '1:1';

// --- Icons ---
const IconClose = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const IconSwitch = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>;
const IconFlashOff = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M11.412 15.655L9.75 21.75l2.25-8.25 4.5 4.5m-4.5-4.5l6 6 2.25 2.25m-13.5-13.5L3 3m0 0l2.25 2.25M3 3l2.25-2.25m13.5 13.5l-2.25-2.25M21 21l-2.25-2.25m0 0l-2.25-2.25m0 0l-2.25-2.25M3 21l18-18" /></svg>;
const IconFlashOn = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-yellow-400"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>;
const IconTimer = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconGrid = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>;
const IconLevel = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m9-9H3" /></svg>;
const IconFilter = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M18.75 12.75h1.5a.75.75 0 000-1.5h-1.5a.75.75 0 000 1.5zM12 6a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 0112 6zM12 18a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 0112 18zM3.75 6.75h1.5a.75.75 0 100-1.5h-1.5a.75.75 0 000 1.5zM5.25 18.75h-1.5a.75.75 0 010-1.5h1.5a.75.75 0 010 1.5zM3 12a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 013 12zM9 3.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zM12.75 12a2.25 2.25 0 114.5 0 2.25 2.25 0 01-4.5 0zM9 15.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" /></svg>;
const IconChevronDown = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>;

// --- Composition Guides Data (50 Types) ---
const COMPOSITION_GUIDES = [
    { id: 0, name: 'なし', path: '' },
    // Grid Variations
    { id: 1, name: '3分割 (Rule of Thirds)', path: 'M33.3 0V100 M66.6 0V100 M0 33.3H100 M0 66.6H100' },
    { id: 2, name: '4分割 (Quarter)', path: 'M50 0V100 M0 50H100' },
    { id: 3, name: 'Grid 3x3', path: 'M33.3 0V100 M66.6 0V100 M0 33.3H100 M0 66.6H100' },
    { id: 4, name: 'Grid 4x4', path: 'M25 0V100 M50 0V100 M75 0V100 M0 25H100 M0 50H100 M0 75H100' },
    { id: 5, name: 'Grid 5x5', path: 'M20 0V100 M40 0V100 M60 0V100 M80 0V100 M0 20H100 M0 40H100 M0 60H100 M0 80H100' },
    { id: 6, name: 'Grid 6x6', path: 'M16.6 0V100 M33.3 0V100 M50 0V100 M66.6 0V100 M83.3 0V100 M0 16.6H100 M0 33.3H100 M0 50H100 M0 66.6H100 M0 83.3H100' },
    { id: 7, name: 'Grid 8x8', path: 'M12.5 0V100 M25 0V100 M37.5 0V100 M50 0V100 M62.5 0V100 M75 0V100 M87.5 0V100 M0 12.5H100 M0 25H100 M0 37.5H100 M0 50H100 M0 62.5H100 M0 75H100 M0 87.5H100' },
    
    // Golden Ratio
    { id: 8, name: '黄金比 (Phi Grid) H', path: 'M38.2 0V100 M61.8 0V100 M0 38.2H100 M0 61.8H100' },
    { id: 9, name: '黄金螺旋 TL', path: 'M0 0 C61.8 0 100 38.2 100 100 M61.8 0 V100 M0 61.8 H100' },
    { id: 10, name: '黄金螺旋 TR', path: 'M100 0 C38.2 0 0 38.2 0 100 M38.2 0 V100 M0 61.8 H100' },
    { id: 11, name: '黄金螺旋 BL', path: 'M0 100 C61.8 100 100 61.8 100 0 M61.8 0 V100 M0 38.2 H100' },
    { id: 12, name: '黄金螺旋 BR', path: 'M100 100 C38.2 100 0 61.8 0 0 M38.2 0 V100 M0 38.2 H100' },

    // Diagonals
    { id: 13, name: '対角線 A', path: 'M0 0L100 100 M0 100L100 0' },
    { id: 14, name: '対角線 B (Single)', path: 'M0 0L100 100' },
    { id: 15, name: '対角線 C (Single)', path: 'M100 0L0 100' },
    
    // Triangles (Golden Triangles)
    { id: 16, name: '三角構図 Top-Left', path: 'M0 0 L100 100 M0 100 L38.2 38.2' },
    { id: 17, name: '三角構図 Top-Right', path: 'M100 0 L0 100 M100 100 L61.8 38.2' },
    { id: 18, name: '三角構図 Bot-Left', path: 'M0 100 L100 0 M0 0 L38.2 61.8' },
    { id: 19, name: '三角構図 Bot-Right', path: 'M100 100 L0 0 M100 0 L61.8 61.8' },

    // Geometric / Dynamic Symmetry
    { id: 20, name: '日の丸 (Center)', path: 'M50 0V100 M0 50H100 M50 50 m-25 0 a 25 25 0 1 0 50 0 a 25 25 0 1 0 -50 0' },
    { id: 21, name: '放射線 (Radial)', path: 'M0 0L100 100 M100 0L0 100 M50 0V100 M0 50H100' },
    { id: 22, name: '消失点 (Perspective)', path: 'M0 70L50 30L100 70 M0 100L50 30L100 100' },
    { id: 23, name: '菱形 (Diamond)', path: 'M50 0L100 50L50 100L0 50Z' },
    { id: 24, name: '六角形 (Hex)', path: 'M25 0L75 0L100 50L75 100L25 100L0 50Z' },
    { id: 25, name: 'Root 2 Rectangle', path: 'M0 0 L100 70.7 M0 70.7 L100 0 M0 70.7 H100' }, 
    { id: 26, name: 'Root 3 Rectangle', path: 'M0 0 L100 57.7 M0 57.7 L100 0 M0 57.7 H100' },
    { id: 27, name: 'Baroque', path: 'M0 0 L100 100 M0 100 L100 0 M50 0 V100 M0 50 H100' },
    { id: 28, name: 'Harmonic Armature', path: 'M0 0 L100 100 M0 100 L100 0 M0 33.3 L100 33.3 M0 66.6 L100 66.6 M33.3 0 V100 M66.6 0 V100' },

    // Composition Shapes
    { id: 29, name: 'C字構図 Left', path: 'M80 10 C20 10 20 90 80 90' },
    { id: 30, name: 'C字構図 Right', path: 'M20 10 C80 10 80 90 20 90' },
    { id: 31, name: 'S字構図', path: 'M80 10 C20 10 20 50 50 50 S80 90 20 90' },
    { id: 32, name: '額縁 (Frame)', path: 'M10 10H90V90H10Z' },
    { id: 33, name: '2分割 縦', path: 'M50 0V100' },
    { id: 34, name: '2分割 横', path: 'M0 50H100' },
    { id: 35, name: 'X字', path: 'M10 10 L90 90 M90 10 L10 90' },
    { id: 36, name: 'V字', path: 'M0 0 L50 100 L100 0' },
    { id: 37, name: 'A字', path: 'M0 100 L50 0 L100 100' },
    { id: 38, name: 'L字 Left-Bot', path: 'M20 0 V80 H100' },
    { id: 39, name: 'L字 Right-Bot', path: 'M80 0 V80 H0' },

    // Perspective / Depth
    { id: 40, name: '1点透視 (One Point)', path: 'M0 0 L50 50 L100 0 M0 100 L50 50 L100 100' },
    { id: 41, name: '2点透視 (Two Point)', path: 'M0 50 L50 20 L100 50 M0 50 L50 80 L100 50 M50 20 V80' },
    
    // Aspect Ratio Guides (Lines inside view)
    { id: 42, name: 'Square 1:1', path: 'M0 12.5 H100 M0 87.5 H100' },
    { id: 43, name: 'Wide 16:9', path: 'M0 25 H100 M0 75 H100' },
    { id: 44, name: 'Cinema 2.35:1', path: 'M0 35 H100 M0 65 H100' },

    // Advanced/Misc
    { id: 45, name: 'Circle Grid', path: 'M50 50 m-20 0 a 20 20 0 1 0 40 0 a 20 20 0 1 0 -40 0 M50 50 m-40 0 a 40 40 0 1 0 80 0 a 40 40 0 1 0 -80 0' },
    { id: 46, name: 'Isometric', path: 'M0 100 L100 42 M0 58 L100 0 M50 0 V100' },
    { id: 47, name: 'Triangle Grid', path: 'M0 100 L50 0 L100 100 M25 50 H75 M50 0 V100' },
    { id: 48, name: 'Crosshair Small', path: 'M45 50 H55 M50 45 V55' },
    { id: 49, name: 'Fibonacci Grid', path: 'M0 0 H100 V100 H0 V0 M38.2 0 V100 M61.8 0 V100 M0 38.2 H100 M0 61.8 H100' }, 
    { id: 50, name: 'Full Cross', path: 'M50 0 V100 M0 50 H100 M0 0 L100 100 M0 100 L100 0' }
];

// --- Helper for SVG Table Values ---
function getSplineTableValues(points: Point[], steps: number = 64): string {
    const sorted = [...points].sort((a, b) => a.x - b.x);
    const n = sorted.length;
    if (n < 2) return "0 1"; 

    const x = sorted.map(p => p.x);
    const y = sorted.map(p => p.y);
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
        if (slope[i] === 0) { m[i] = 0; m[i+1] = 0; }
    }

    for (let i = 1; i < n - 1; i++) {
        if (slope[i-1] * slope[i] <= 0) { m[i] = 0; } 
        else {
            const w1 = dx[i-1] + dx[i];
            m[i] = (3 * w1) / ((w1 + dx[i]) / slope[i-1] + (w1 + dx[i-1]) / slope[i]);
        }
    }

    const values: string[] = [];
    for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1);
        let seg = 0;
        while (seg < n - 2 && t > x[seg + 1]) { seg++; }
        const h = dx[seg];
        let val = y[seg]; 
        if (h > 0) {
             const diff = Math.max(0, Math.min(h, t - x[seg]));
             const tRel = diff / h;
             const h00 = 2 * Math.pow(tRel,3) - 3 * Math.pow(tRel,2) + 1;
             const h10 = Math.pow(tRel,3) - 2 * Math.pow(tRel,2) + tRel;
             const h01 = -2 * Math.pow(tRel,3) + 3 * Math.pow(tRel,2);
             const h11 = Math.pow(tRel,3) - Math.pow(tRel,2);
             val = h00 * y[seg] + h10 * h * m[seg] + h01 * y[seg + 1] + h11 * h * m[seg + 1];
        }
        values.push(Math.max(0, Math.min(1, val)).toFixed(4));
    }
    return values.join(' ');
}

// --- Filter Menu Component (Stable) ---
interface FilterMenuProps {
    activePresetId: string;
    onSelect: (id: string) => void;
    onClose: () => void;
}

const FilterMenu: React.FC<FilterMenuProps> = ({ activePresetId, onSelect, onClose }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Scroll to active item on mount
        if (scrollRef.current) {
            const activeEl = scrollRef.current.querySelector<HTMLElement>(`button[data-active="true"]`);
            if (activeEl) {
                // Center the active element
                const container = scrollRef.current;
                const elLeft = activeEl.offsetLeft;
                const elWidth = activeEl.offsetWidth;
                const containerWidth = container.clientWidth;
                container.scrollLeft = elLeft - containerWidth / 2 + elWidth / 2;
            }
        }
    }, []);

    return (
      <div className="animate-slide-up w-full pb-safe bg-black/90 rounded-t-2xl absolute bottom-0 left-0 right-0 z-50">
           <div className="flex justify-between items-center px-6 py-4 border-b border-white/10">
                <span className="text-xs font-bold text-white tracking-wider">フィルター (50種)</span>
                <button onClick={onClose} className="w-6 text-white/50"><IconChevronDown/></button>
           </div>
           <div ref={scrollRef} className="w-full overflow-x-auto no-scrollbar flex gap-4 px-6 py-6 items-center">
                <button 
                    onClick={() => onSelect('fp-none')} 
                    data-active={activePresetId === 'fp-none'}
                    className="flex flex-col items-center gap-2 shrink-0"
                >
                    <div className={`w-16 h-16 rounded-full border-2 transition-all flex items-center justify-center bg-zinc-800 ${activePresetId === 'fp-none' ? 'border-cos-accent scale-110 shadow-lg shadow-cos-accent/20' : 'border-white/10'}`}>
                        <span className="text-[10px] text-white/50">Original</span>
                    </div>
                    <span className={`text-[10px] font-medium ${activePresetId === 'fp-none' ? 'text-cos-accent' : 'text-white/50'}`}>なし</span>
                </button>
                {FACTORY_PRESETS.map(p => (
                    <button 
                        key={p.id} 
                        onClick={() => onSelect(p.id)} 
                        data-active={activePresetId === p.id}
                        className="flex flex-col items-center gap-2 shrink-0 group"
                    >
                        <div className={`w-16 h-16 rounded-full border-2 transition-all overflow-hidden relative ${activePresetId === p.id ? 'border-cos-accent scale-110 shadow-lg shadow-cos-accent/20' : 'border-white/10'}`}>
                            <div className={`absolute inset-0 bg-gradient-to-br from-zinc-500 to-zinc-900`}></div>
                            <div className="absolute inset-0 opacity-50 mix-blend-overlay" style={{backgroundColor: p.id.includes('red') || p.id.includes('rosy') ? 'red' : p.id.includes('blue') || p.id.includes('cool') ? 'blue' : p.id.includes('gold') ? 'gold' : 'gray'}}></div>
                            <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-xl drop-shadow">{p.name.slice(0,2)}</div>
                        </div>
                        <span className={`text-[10px] font-medium max-w-[64px] truncate ${activePresetId === p.id ? 'text-cos-accent' : 'text-white/50'}`}>{p.name}</span>
                    </button>
                ))}
           </div>
      </div>
    );
};

export const Camera: React.FC<CameraProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // --- Camera State ---
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [flash, setFlash] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('3:4');
  const [timer, setTimer] = useState<0 | 3 | 7>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  // Grid & Leveler State
  const [activeGridId, setActiveGridId] = useState<number>(0);
  const [showGridMenu, setShowGridMenu] = useState(false);
  const [isLevelerActive, setIsLevelerActive] = useState(false);
  const [orientation, setOrientation] = useState({ beta: 0, gamma: 0 }); 

  // --- Effects State ---
  const [showFilters, setShowFilters] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string>('fp-none');
  
  // --- Initialization ---
  useEffect(() => {
      const startCamera = async () => {
          if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
          try {
              const stream = await navigator.mediaDevices.getUserMedia({
                  audio: false,
                  video: {
                      facingMode,
                      width: { ideal: 4096 }, // 4K Preference
                      height: { ideal: 2160 }
                  }
              });
              streamRef.current = stream;
              if (videoRef.current) {
                  videoRef.current.srcObject = stream;
                  videoRef.current.play();
              }
          } catch (e) {
              console.error(e);
          }
      };
      startCamera();
      return () => streamRef.current?.getTracks().forEach(t => t.stop());
  }, [facingMode]);

  // --- Leveler Logic ---
  useEffect(() => {
      const handleOrientation = (e: DeviceOrientationEvent) => {
          if (!isLevelerActive) return;
          setOrientation({
              beta: e.beta || 0,
              gamma: e.gamma || 0
          });
      };

      if (isLevelerActive) {
          window.addEventListener('deviceorientation', handleOrientation);
      } else {
          window.removeEventListener('deviceorientation', handleOrientation);
      }
      return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [isLevelerActive]);

  const toggleLeveler = async () => {
      if (!isLevelerActive) {
          if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
              try {
                  const response = await (DeviceOrientationEvent as any).requestPermission();
                  if (response === 'granted') {
                      setIsLevelerActive(true);
                  } else {
                      alert("ジャイロセンサーへのアクセスが許可されませんでした");
                  }
              } catch (e) {
                  console.error(e);
              }
          } else {
              setIsLevelerActive(true);
          }
      } else {
          setIsLevelerActive(false);
      }
  };

  // --- Computed Filters & Transforms ---
  const activePreset = useMemo(() => FACTORY_PRESETS.find(p => p.id === activePresetId) || FACTORY_PRESETS[0], [activePresetId]);

  const finalStyles = useMemo(() => {
      let cssFilter = '';
      let transform = '';
      let svgData = null;

      // 1. Base Filter (Preset)
      let baseF = activePreset ? activePreset.filterState : null;

      if (baseF) {
          const masterTable = getSplineTableValues(baseF.curves.master);
          const redTable = getSplineTableValues(baseF.curves.red);
          const greenTable = getSplineTableValues(baseF.curves.green);
          const blueTable = getSplineTableValues(baseF.curves.blue);
          svgData = { masterTable, redTable, greenTable, blueTable, f: baseF };
          cssFilter += `brightness(${100 + baseF.brightness + baseF.exposure}%) contrast(${100 + baseF.contrast}%) saturate(${100 + baseF.saturation}%) grayscale(${baseF.grayscale}%) sepia(${baseF.sepia}%) hue-rotate(${baseF.hue}deg) invert(${baseF.invert}%) url(#preset-svg-${activePresetId}) `;
          
          if (baseF.blur > 0) {
              cssFilter += `blur(${baseF.blur/5}px) `;
          }
      }
      
      if (!cssFilter) cssFilter = 'none';

      if (facingMode === 'user') transform += 'scaleX(-1) '; 
      transform += 'scale(1.02) '; 

      return { filter: cssFilter, transform, svgData };
  }, [activePreset, activePresetId, facingMode]);


  // --- Capture Logic ---
  const takePhoto = () => {
      const video = videoRef.current;
      if (!video) return;
      
      const canvas = document.createElement('canvas');
      let w = video.videoWidth;
      let h = video.videoHeight;
      let targetRatio = 3/4;
      if (aspectRatio === '1:1') targetRatio = 1;
      if (aspectRatio === '9:16') targetRatio = 9/16;
      
      let cropW = w;
      let cropH = h;
      if (w / h > targetRatio) { cropW = h * targetRatio; } else { cropH = w / targetRatio; }
      
      const startX = (w - cropW) / 2;
      const startY = (h - cropH) / 2;

      canvas.width = cropW;
      canvas.height = cropH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
      }

      ctx.filter = finalStyles.filter; 
      ctx.drawImage(video, startX, startY, cropW, cropH, 0, 0, cropW, cropH);
      onCapture(canvas.toDataURL('image/jpeg', 0.95));
  };

  const handleShutter = () => {
      if (timer > 0) {
          setCountdown(timer);
          let c = timer;
          const i = setInterval(() => {
              c--; setCountdown(c);
              if (c <= 0) { clearInterval(i); setCountdown(null); takePhoto(); }
          }, 1000);
      } else { takePhoto(); }
  };

  // --- Components ---

  const TopBar = () => (
      <div className="absolute top-0 left-0 right-0 z-40 p-4 pt-safe flex flex-col bg-gradient-to-b from-black/60 to-transparent pointer-events-auto">
         <div className="flex justify-between items-start w-full">
            <div className="flex gap-3 items-center">
                <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white shadow-sm"><IconClose /></button>
                <button onClick={() => setAspectRatio(prev => prev === '3:4' ? '9:16' : prev === '9:16' ? '1:1' : '3:4')} className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white text-xs font-bold border border-white/20 shadow-sm">{aspectRatio}</button>
            </div>

            <div className="flex gap-3 items-center">
                <button onClick={() => setTimer(t => t === 0 ? 3 : t === 3 ? 7 : 0)} className={`w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white transition-colors ${timer > 0 ? 'text-cos-accent' : ''}`}>
                    {timer > 0 ? <span className="font-bold text-sm">{timer}</span> : <IconTimer />}
                </button>
                <button onClick={toggleLeveler} className={`w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center transition-colors ${isLevelerActive ? 'text-green-400' : 'text-white'}`}>
                    <IconLevel />
                </button>
                <button onClick={() => setShowGridMenu(!showGridMenu)} className={`w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center transition-colors ${activeGridId !== 0 ? 'text-cos-accent' : 'text-white'}`}>
                    <IconGrid />
                </button>
                <button onClick={() => setFlash(!flash)} className={`w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center transition-colors ${flash ? 'text-yellow-400' : 'text-white'}`}>
                    {flash ? <IconFlashOn /> : <IconFlashOff />}
                </button>
                <button onClick={() => setFacingMode(p => p === 'user' ? 'environment' : 'user')} className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white"><IconSwitch /></button>
            </div>
         </div>
         
         {/* Grid Selection Drawer */}
         {showGridMenu && (
             <div className="w-full bg-black/80 backdrop-blur-xl rounded-xl mt-4 p-4 animate-slide-up border border-white/10 overflow-hidden max-h-[60vh]">
                 <div className="text-xs font-bold text-white mb-3">構図ガイド (50種)</div>
                 <div className="grid grid-cols-5 gap-2 overflow-y-auto no-scrollbar" style={{maxHeight: '50vh'}}>
                     {COMPOSITION_GUIDES.map(g => (
                         <button 
                            key={g.id} 
                            onClick={() => { setActiveGridId(g.id); setShowGridMenu(false); }}
                            className={`aspect-square rounded flex items-center justify-center border text-[9px] font-bold flex-col gap-1 overflow-hidden p-1 ${activeGridId === g.id ? 'border-cos-accent bg-cos-accent/20 text-white' : 'border-white/10 bg-white/5 text-white/50'}`}
                         >
                             <svg viewBox="0 0 100 100" className="w-full h-full opacity-80">
                                 <path d={g.path} stroke="currentColor" strokeWidth="4" fill="none" />
                             </svg>
                         </button>
                     ))}
                 </div>
             </div>
         )}
      </div>
  );

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col font-sans touch-none">
      {/* Hidden SVG for Filters */}
      {finalStyles.svgData && (
         <svg className="absolute w-0 h-0">
            <defs>
                <filter id={`preset-svg-${activePresetId}`} colorInterpolationFilters="sRGB">
                    <feComponentTransfer>
                        <feFuncR type="table" tableValues={finalStyles.svgData.redTable} />
                        <feFuncG type="table" tableValues={finalStyles.svgData.greenTable} />
                        <feFuncB type="table" tableValues={finalStyles.svgData.blueTable} />
                    </feComponentTransfer>
                    <feComponentTransfer>
                         <feFuncR type="table" tableValues={finalStyles.svgData.masterTable} />
                         <feFuncG type="table" tableValues={finalStyles.svgData.masterTable} />
                         <feFuncB type="table" tableValues={finalStyles.svgData.masterTable} />
                    </feComponentTransfer>
                    <feComponentTransfer>
                        <feFuncR type="gamma" amplitude="1" exponent={1 - (finalStyles.svgData.f.shadows/400) + (finalStyles.svgData.f.highlights/400)} offset="0" />
                        <feFuncG type="gamma" amplitude="1" exponent={1 - (finalStyles.svgData.f.shadows/400) + (finalStyles.svgData.f.highlights/400)} offset="0" />
                        <feFuncB type="gamma" amplitude="1" exponent={1 - (finalStyles.svgData.f.shadows/400) + (finalStyles.svgData.f.highlights/400)} offset="0" />
                    </feComponentTransfer>
                </filter>
            </defs>
         </svg>
      )}

      {/* FULL SCREEN VIDEO CONTAINER */}
      <div className="absolute inset-0 bg-black z-0">
         <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            <div 
                className="relative overflow-hidden shadow-2xl transition-all duration-300 ease-in-out"
                style={{
                    width: aspectRatio === '9:16' ? '100%' : 'auto',
                    height: aspectRatio === '9:16' ? '100%' : 'auto',
                    aspectRatio: aspectRatio.replace(':', '/'),
                    maxHeight: '100%',
                    maxWidth: '100%'
                }}
            >
                <video 
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{
                        transform: finalStyles.transform,
                        filter: finalStyles.filter
                    }}
                />
                
                {/* Grid Overlay */}
                {activeGridId !== 0 && (
                   <div className="absolute inset-0 pointer-events-none z-20 opacity-80">
                       <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                           <path 
                                d={COMPOSITION_GUIDES.find(g => g.id === activeGridId)?.path || ''} 
                                stroke="#FF0000" 
                                strokeWidth="0.6" 
                                fill="none" 
                                vectorEffect="non-scaling-stroke"
                           />
                       </svg>
                   </div>
               )}
               
               {/* Leveler Overlay */}
               {isLevelerActive && (
                   <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
                       <div className={`w-16 h-0.5 ${Math.abs(orientation.gamma) < 2 && Math.abs(orientation.beta) < 2 ? 'bg-green-400 shadow-[0_0_5px_#4ade80]' : 'bg-white/50'} absolute transition-colors duration-200`}></div>
                       <div className={`w-0.5 h-16 ${Math.abs(orientation.gamma) < 2 && Math.abs(orientation.beta) < 2 ? 'bg-green-400 shadow-[0_0_5px_#4ade80]' : 'bg-white/50'} absolute transition-colors duration-200`}></div>
                       <div 
                            className={`w-64 h-0.5 transition-transform duration-100 ease-linear ${Math.abs(orientation.gamma) < 1 ? 'bg-green-400' : 'bg-red-500/80'}`}
                            style={{ transform: `rotate(${-orientation.gamma}deg)` }}
                       ></div>
                       <div className="absolute mt-8 bg-black/50 px-2 py-1 rounded text-[10px] font-mono text-white">
                           {orientation.gamma.toFixed(1)}°
                       </div>
                   </div>
               )}

               {/* Countdown */}
               {countdown !== null && (
                   <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                       <span className="text-9xl font-black text-white animate-ping drop-shadow-lg">{countdown}</span>
                   </div>
               )}
            </div>
         </div>
      </div>

      {/* TOP UI */}
      <TopBar />

      {/* BOTTOM CONTROLS */}
      <div className="absolute bottom-0 left-0 right-0 z-40 pt-20 pb-safe bg-gradient-to-t from-black/90 via-black/40 to-transparent min-h-[160px] flex flex-col justify-end pointer-events-none">
           <div className="pointer-events-auto">
            {!showFilters ? (
               <div className="flex items-center justify-between px-12 pb-8">
                   {/* Filter Button */}
                   <button onClick={() => setShowFilters(true)} className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform">
                       <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10">
                           <IconFilter />
                       </div>
                       <span className="text-[10px] font-bold drop-shadow">フィルター</span>
                   </button>
                   
                   {/* Shutter Button */}
                   <button onClick={handleShutter} className="w-20 h-20 rounded-full border-[5px] border-white flex items-center justify-center relative group active:scale-95 transition-transform shadow-lg">
                       <div className="w-16 h-16 bg-white rounded-full group-hover:scale-95 transition-transform"></div>
                   </button>

                    {/* Placeholder for Balance */}
                   <div className="w-10"></div> 
               </div>
           ) : (
               <FilterMenu 
                   activePresetId={activePresetId} 
                   onSelect={setActivePresetId} 
                   onClose={() => setShowFilters(false)} 
               />
           )}
           </div>
      </div>
    </div>
  );
};
