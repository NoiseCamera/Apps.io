import React, { useRef, useMemo } from 'react';
import { FilterState, Point } from '../types';

interface CanvasAreaProps {
  imageSrc: string | null;
  filters: FilterState;
}

// Helper to interpolate points for SVG tableValues (Linear for preview speed, Spline is better but heavier)
// We'll use a simple linear interpolation for the preview string to match the CurveEditor visual
function getTableValues(points: Point[], steps: number = 20): string {
    const sorted = [...points].sort((a, b) => a.x - b.x);
    const values: number[] = [];
    
    for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1);
        // Find segment
        let p0 = sorted[0];
        let p1 = sorted[sorted.length - 1];
        
        for (let j = 0; j < sorted.length - 1; j++) {
            if (t >= sorted[j].x && t <= sorted[j+1].x) {
                p0 = sorted[j];
                p1 = sorted[j+1];
                break;
            }
        }

        // Linear Interpolate Y based on X
        const range = p1.x - p0.x;
        const ratio = range === 0 ? 0 : (t - p0.x) / range;
        const y = p0.y + (p1.y - p0.y) * ratio;
        values.push(Math.max(0, Math.min(1, y)));
    }
    return values.join(' ');
}

export const CanvasArea: React.FC<CanvasAreaProps> = ({ 
  imageSrc, 
  filters
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate Curve Table Values
  const masterTable = useMemo(() => getTableValues(filters.curves.master), [filters.curves.master]);
  const redTable = useMemo(() => getTableValues(filters.curves.red), [filters.curves.red]);
  const greenTable = useMemo(() => getTableValues(filters.curves.green), [filters.curves.green]);
  const blueTable = useMemo(() => getTableValues(filters.curves.blue), [filters.curves.blue]);

  if (!imageSrc) {
    return (
      <div ref={containerRef} className="flex-1 flex flex-col items-center justify-center text-cos-muted p-8 border-2 border-dashed border-slate-700 rounded-2xl m-4 bg-cos-panel/50">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-4 opacity-50">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
        <p className="text-lg font-medium">写真をアップロード</p>
        <p className="text-sm mt-2 text-center">タップしてギャラリーから選択</p>
      </div>
    );
  }

  // 1. Calculate CSS Filter Strings
  const brightnessVal = 100 + filters.brightness;
  const contrastVal = 100 + filters.contrast;
  // Add vibrance to saturation for preview (approximate)
  const saturateVal = 100 + filters.saturation + (filters.vibrance * 0.75);
  const grayscaleVal = filters.grayscale;
  const sepiaVal = filters.sepia;
  const hueVal = filters.hue;
  const invertVal = filters.invert;
  const blurVal = filters.blur / 5;

  const totalBrightness = brightnessVal + (filters.exposure * 0.8);

  const cssFilterString = `
    brightness(${Math.max(0, totalBrightness)}%) 
    contrast(${Math.max(0, contrastVal)}%) 
    saturate(${Math.max(0, saturateVal)}%) 
    grayscale(${grayscaleVal}%)
    sepia(${sepiaVal}%)
    hue-rotate(${hueVal}deg) 
    blur(${blurVal}px)
    invert(${invertVal}%)
    url(#svg-filters) 
  `;

  // 2. Overlays
  const vignetteStyle: React.CSSProperties = {
    background: `radial-gradient(circle, transparent 50%, rgba(0,0,0,${filters.vignette/100}) 140%)`,
    mixBlendMode: 'multiply',
  };

  let tempColor = 'transparent';
  if (filters.temperature > 0) tempColor = `rgba(255, 160, 0, ${filters.temperature / 200})`;
  else if (filters.temperature < 0) tempColor = `rgba(0, 100, 255, ${Math.abs(filters.temperature) / 200})`;

  let tintColor = 'transparent';
  if (filters.tint > 0) tintColor = `rgba(255, 0, 255, ${filters.tint / 200})`;
  else if (filters.tint < 0) tintColor = `rgba(0, 255, 0, ${Math.abs(filters.tint) / 200})`;

  const fadeStyle: React.CSSProperties = {
    backgroundColor: `rgba(20, 20, 30, ${filters.fade / 100})`,
    mixBlendMode: 'lighten',
  };

  // 3. SVG Filter Calcs
  const sAmount = filters.sharpen / 20;
  const kernelCenter = 1 + (4 * sAmount);
  const kernelSide = -sAmount;
  const kernelMatrix = `
    0 ${kernelSide} 0
    ${kernelSide} ${kernelCenter} ${kernelSide}
    0 ${kernelSide} 0
  `;

  const grainOpacity = filters.grain / 200;

  // Check if curves are active
  const hasMasterCurve = filters.curves.master.length > 2 || filters.curves.master[0].y !== 0 || filters.curves.master[1].y !== 1;
  const hasRgbCurve = 
    (filters.curves.red.length > 2 || filters.curves.red[0].y !== 0 || filters.curves.red[1].y !== 1) ||
    (filters.curves.green.length > 2 || filters.curves.green[0].y !== 0 || filters.curves.green[1].y !== 1) ||
    (filters.curves.blue.length > 2 || filters.curves.blue[0].y !== 0 || filters.curves.blue[1].y !== 1);
  const useCurves = hasMasterCurve || hasRgbCurve;

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden flex items-center justify-center bg-[#050505] m-0 md:m-4 md:rounded-2xl shadow-2xl">
      
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="svg-filters" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
            {/* 1. Sharpen */}
            {filters.sharpen > 0 && (
                 <feConvolveMatrix order="3" kernelMatrix={kernelMatrix} preserveAlpha="true" result="sharpened"/>
            )}
            
            {/* 2. Tone Curves (Using ComponentTransfer) */}
            <feComponentTransfer in={filters.sharpen > 0 ? "sharpened" : "SourceGraphic"} result="curved">
                {/* RGB Channels */}
                <feFuncR type="table" tableValues={redTable} />
                <feFuncG type="table" tableValues={greenTable} />
                <feFuncB type="table" tableValues={blueTable} />
            </feComponentTransfer>
            
            {/* Master Curve (Applied on top of RGB) */}
            {/* Note: We can chain ComponentTransfers. Applying Master after RGB is mathematically cleaner for a "Master" feel */}
            <feComponentTransfer in="curved" result="masterCurved">
                 <feFuncR type="table" tableValues={masterTable} />
                 <feFuncG type="table" tableValues={masterTable} />
                 <feFuncB type="table" tableValues={masterTable} />
            </feComponentTransfer>

            {/* 3. Highlights / Shadows Simulation (Gamma) */}
            <feComponentTransfer in="masterCurved" result="corrected">
                <feFuncR type="gamma" amplitude="1" exponent={1 - (filters.shadows/400) + (filters.highlights/400)} offset="0" />
                <feFuncG type="gamma" amplitude="1" exponent={1 - (filters.shadows/400) + (filters.highlights/400)} offset="0" />
                <feFuncB type="gamma" amplitude="1" exponent={1 - (filters.shadows/400) + (filters.highlights/400)} offset="0" />
            </feComponentTransfer>

            {/* 4. Noise Overlay */}
             {filters.grain > 0 && (
                <>
                    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" result="noise"/>
                    <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 -1 1" in="noise" result="coloredNoise" />
                    <feComponentTransfer in="coloredNoise" result="transparentNoise">
                        <feFuncA type="linear" slope={grainOpacity} />
                    </feComponentTransfer>
                    <feComposite operator="over" in="transparentNoise" in2="corrected" />
                </>
            )}
          </filter>
        </defs>
      </svg>

      <div 
        className="absolute inset-0 opacity-20 blur-3xl scale-110 pointer-events-none transition-all duration-300"
        style={{
            backgroundImage: `url(${imageSrc})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
        }}
      />
      
      <div className="relative max-w-full max-h-full flex shadow-2xl">
          <img 
            src={imageSrc} 
            alt="Editing Work" 
            className="max-w-full max-h-full object-contain relative z-10"
            style={{ filter: cssFilterString }}
          />
          
          <div className="absolute inset-0 z-20 pointer-events-none mix-blend-mode-soft-light" style={{ backgroundColor: tempColor }}></div>
          <div className="absolute inset-0 z-20 pointer-events-none mix-blend-mode-soft-light" style={{ backgroundColor: tintColor }}></div>
          <div className="absolute inset-0 z-20 pointer-events-none" style={fadeStyle}></div>
          <div className="absolute inset-0 z-30 pointer-events-none" style={vignetteStyle}></div>
      </div>
    </div>
  );
};