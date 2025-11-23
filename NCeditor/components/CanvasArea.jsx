
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { processSelectiveAdjustments } from '../utils/imageProcessing';

// Calculates spline interpolated values for SVG feFunc tableValues (0..1 range)
function getSplineTableValues(points, steps = 64) {
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
        dx[i] = x[i + 1] - x[i];
        dy[i] = y[i + 1] - y[i];
        slope[i] = dy[i] / dx[i];
    }

    m[0] = slope[0];
    m[n - 1] = slope[n - 2];

    for (let i = 0; i < n - 1; i++) {
        if (slope[i] === 0) {
            m[i] = 0;
            m[i + 1] = 0;
        }
    }

    for (let i = 1; i < n - 1; i++) {
        if (slope[i - 1] * slope[i] <= 0) {
            m[i] = 0;
        } else {
            const w1 = dx[i - 1] + dx[i];
            m[i] = (3 * w1) / ((w1 + dx[i]) / slope[i - 1] + (w1 + dx[i - 1]) / slope[i]);
        }
    }

    const values = [];
    for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1);
        let seg = 0;
        while (seg < n - 2 && t > x[seg + 1]) {
            seg++;
        }

        const h = dx[seg];
        let val = y[seg];

        if (h > 0) {
            const diff = Math.max(0, Math.min(h, t - x[seg]));
            const tRel = diff / h;
            const tRel2 = tRel * tRel;
            const tRel3 = tRel2 * tRel;

            const h00 = 2 * tRel3 - 3 * tRel2 + 1;
            const h10 = tRel3 - 2 * tRel2 + tRel;
            const h01 = -2 * tRel3 + 3 * tRel2;
            const h11 = tRel3 - tRel2;

            val = h00 * y[seg] + h10 * h * m[seg] + h01 * y[seg + 1] + h11 * h * m[seg + 1];
        }

        values.push(Math.max(0, Math.min(1, val)).toFixed(4));
    }
    return values.join(' ');
}

export const CanvasArea = ({
    layers,
    activeLayerId,
    activeFilters
}) => {
    const containerRef = useRef(null);
    const [previewSrc, setPreviewSrc] = useState(null);

    const activeLayer = layers.find(l => l.id === activeLayerId);
    const baseImageRef = useRef(null);
    const offscreenCanvasRef = useRef(null);

    // Zoom & Pan State
    const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
    const wrapperRef = useRef(null);
    const pointersRef = useRef(new Map());
    const lastPinchDist = useRef(0);
    const isInteracting = useRef(false);

    // Initialize Base Image for Selective Color on Active Layer
    useEffect(() => {
        if (!activeLayer) {
            setPreviewSrc(null);
            baseImageRef.current = null;
            return;
        }

        // Reset zoom on new project (checking layers length or id)
        if (layers.length === 0) setTransform({ x: 0, y: 0, scale: 1 });

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = activeLayer.image; // Ensure we use the raw image for processing
        img.onload = () => {
            baseImageRef.current = img;

            // High res optimization
            const maxDim = 1600;
            let w = img.width;
            let h = img.height;
            if (w > maxDim || h > maxDim) {
                const ratio = w / h;
                if (w > h) { w = maxDim; h = maxDim / ratio; }
                else { h = maxDim; w = maxDim * ratio; }
            }

            const cvs = document.createElement('canvas');
            cvs.width = w;
            cvs.height = h;
            const ctx = cvs.getContext('2d', { willReadFrequently: true });
            if (ctx) {
                ctx.drawImage(img, 0, 0, w, h);
                offscreenCanvasRef.current = cvs;
                setPreviewSrc(cvs.toDataURL());
            }
        };
    }, [activeLayer?.id, activeLayer?.image, layers.length]);

    // Handle Selective Color Real-time Processing for Active Layer
    useEffect(() => {
        if (!offscreenCanvasRef.current || !activeFilters) return;

        const selective = activeFilters.selective;
        const hasAdjustments = Object.values(selective).some(v => v.hue !== 0 || v.saturation !== 0 || v.lightness !== 0);

        if (!hasAdjustments) {
            if (previewSrc !== offscreenCanvasRef.current.toDataURL()) {
                setPreviewSrc(offscreenCanvasRef.current.toDataURL());
            }
            return;
        }

        const timer = requestAnimationFrame(() => {
            if (!offscreenCanvasRef.current) return;

            const w = offscreenCanvasRef.current.width;
            const h = offscreenCanvasRef.current.height;

            const ctx = offscreenCanvasRef.current.getContext('2d');
            if (!ctx) return;

            if (baseImageRef.current) {
                ctx.drawImage(baseImageRef.current, 0, 0, w, h);
            }

            const imageData = ctx.getImageData(0, 0, w, h);
            processSelectiveAdjustments(imageData.data, selective);
            ctx.putImageData(imageData, 0, 0);
            setPreviewSrc(offscreenCanvasRef.current.toDataURL());
        });

        return () => cancelAnimationFrame(timer);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeFilters?.selective]);

    const masterTable = useMemo(() => activeFilters ? getSplineTableValues(activeFilters.curves.master) : "0 1", [activeFilters?.curves.master]);
    const redTable = useMemo(() => activeFilters ? getSplineTableValues(activeFilters.curves.red) : "0 1", [activeFilters?.curves.red]);
    const greenTable = useMemo(() => activeFilters ? getSplineTableValues(activeFilters.curves.green) : "0 1", [activeFilters?.curves.green]);
    const blueTable = useMemo(() => activeFilters ? getSplineTableValues(activeFilters.curves.blue) : "0 1", [activeFilters?.curves.blue]);

    // --- Gesture Handlers ---

    const handlePointerDown = (e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        lastPinchDist.current = 0;
        isInteracting.current = true;
    };

    const handlePointerMove = (e) => {
        if (!pointersRef.current.has(e.pointerId)) return;

        const prevPtr = pointersRef.current.get(e.pointerId);
        const prevX = prevPtr.x;
        const prevY = prevPtr.y;

        pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

        const pts = Array.from(pointersRef.current.values());

        if (pts.length === 2) {
            const p1 = pts[0];
            const p2 = pts[1];
            const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);

            if (lastPinchDist.current > 0 && wrapperRef.current) {
                const zoomFactor = dist / lastPinchDist.current;
                setTransform(prev => {
                    let newScale = prev.scale * zoomFactor;
                    newScale = Math.min(Math.max(0.5, newScale), 8);
                    return {
                        ...prev,
                        scale: newScale
                    };
                });
            }
            lastPinchDist.current = dist;

        } else if (pts.length === 1) {
            const dx = e.clientX - prevX;
            const dy = e.clientY - prevY;
            setTransform(prev => ({
                ...prev,
                x: prev.x + dx,
                y: prev.y + dy
            }));
        }
    };

    const handlePointerUp = (e) => {
        pointersRef.current.delete(e.pointerId);
        if (pointersRef.current.size < 2) {
            lastPinchDist.current = 0;
        }
        if (pointersRef.current.size === 0) {
            isInteracting.current = false;
        }
    };

    const handleDoubleTap = () => {
        setTransform({ x: 0, y: 0, scale: 1 });
    };

    if (layers.length === 0) {
        return (
            <div ref={containerRef} className="absolute inset-0 flex flex-col items-center justify-center text-cos-muted/50 pointer-events-none">
                <div className="p-8 border-2 border-dashed border-white/10 rounded-3xl bg-white/5 backdrop-blur-sm flex flex-col items-center animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 mb-4 opacity-50">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                    <p className="text-lg font-medium text-white">写真をアップロード</p>
                </div>
            </div>
        );
    }

    // --- Calculate Active Layer Filters for SVG/CSS ---
    // Only calculate these if there is an active layer selected
    const f = activeFilters;
    const cssFilterString = f ? `
    brightness(${Math.max(0, 100 + f.brightness + (f.exposure * 0.8))}%) 
    contrast(${Math.max(0, 100 + f.contrast)}%) 
    saturate(${Math.max(0, 100 + f.saturation + (f.vibrance * 0.6))}%) 
    grayscale(${f.grayscale}%)
    sepia(${f.sepia}%)
    hue-rotate(${f.hue}deg) 
    blur(${f.blur / 5}px)
    invert(${f.invert}%)
    url(#svg-filters) 
  ` : 'none';

    const vignetteStyle = f ? {
        background: `radial-gradient(circle, transparent 50%, rgba(0,0,0,${f.vignette / 100}) 140%)`,
        mixBlendMode: 'multiply',
    } : {};

    let tempColor = 'transparent';
    if (f && f.temperature > 0) tempColor = `rgba(255, 160, 0, ${f.temperature / 200})`;
    else if (f && f.temperature < 0) tempColor = `rgba(0, 100, 255, ${Math.abs(f.temperature) / 200})`;

    let tintColor = 'transparent';
    if (f && f.tint > 0) tintColor = `rgba(255, 0, 255, ${f.tint / 200})`;
    else if (f && f.tint < 0) tintColor = `rgba(0, 255, 0, ${Math.abs(f.tint) / 200})`;

    const fadeStyle = f ? {
        backgroundColor: `rgba(20, 20, 30, ${f.fade / 100})`,
        mixBlendMode: 'lighten',
    } : {};

    const sAmount = f ? f.sharpen / 20 : 0;
    const kernelCenter = 1 + (4 * sAmount);
    const kernelSide = -sAmount;
    const kernelMatrix = `0 ${kernelSide} 0 ${kernelSide} ${kernelCenter} ${kernelSide} 0 ${kernelSide} 0`;
    const grainOpacity = f ? f.grain / 200 : 0;

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 flex items-center justify-center bg-[#000] overflow-hidden touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onDoubleClick={handleDoubleTap}
        >
            {/* SVG Definition for Active Layer Filters */}
            {activeLayer && f && (
                <svg style={{ position: 'absolute', width: 0, height: 0 }}>
                    <defs>
                        <filter id="svg-filters" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
                            {f.sharpen > 0 && <feConvolveMatrix order="3" kernelMatrix={kernelMatrix} preserveAlpha="true" result="sharpened" />}

                            <feComponentTransfer in={f.sharpen > 0 ? "sharpened" : "SourceGraphic"} result="curved">
                                <feFuncR type="table" tableValues={redTable} />
                                <feFuncG type="table" tableValues={greenTable} />
                                <feFuncB type="table" tableValues={blueTable} />
                            </feComponentTransfer>

                            <feComponentTransfer in="curved" result="masterCurved">
                                <feFuncR type="table" tableValues={masterTable} />
                                <feFuncG type="table" tableValues={masterTable} />
                                <feFuncB type="table" tableValues={masterTable} />
                            </feComponentTransfer>

                            <feComponentTransfer in="masterCurved" result="corrected">
                                <feFuncR type="gamma" amplitude="1" exponent={1 - (f.shadows / 400) + (f.highlights / 400)} offset="0" />
                                <feFuncG type="gamma" amplitude="1" exponent={1 - (f.shadows / 400) + (f.highlights / 400)} offset="0" />
                                <feFuncB type="gamma" amplitude="1" exponent={1 - (f.shadows / 400) + (f.highlights / 400)} offset="0" />
                            </feComponentTransfer>

                            {f.grain > 0 && (
                                <>
                                    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" result="noise" />
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
            )}

            {/* Background Blurring Effect (Based on active layer or base) */}
            <div
                className="absolute inset-0 opacity-20 blur-3xl scale-125 pointer-events-none transition-opacity duration-500"
                style={{
                    backgroundImage: `url(${activeLayer ? activeLayer.preview : layers[0]?.preview})`,
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                }}
            />

            <div
                ref={wrapperRef}
                className="relative max-w-none max-h-none flex origin-center will-change-transform"
                style={{
                    transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
                    transition: pointersRef.current.size === 0 ? 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none'
                }}
            >
                {/* Render Layer Stack */}
                {layers.map((layer, index) => {
                    if (!layer.isVisible) return null;
                    const isActive = layer.id === activeLayerId;

                    // If active, we use the raw base 'image' + CSS filters (live preview)
                    // If inactive, we use the 'preview' (baked filters)
                    // Mask is applied to both via masking div or mask-image style

                    const displayImage = isActive && previewSrc ? previewSrc : (isActive ? layer.image : layer.preview);

                    return (
                        <div
                            key={layer.id}
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                zIndex: index + 10,
                                // NOTE: Positioning logic assumes all layers are same size/aligned
                                // In a real app, layer might have x/y offsets.
                                // Here we assume pixel-perfect alignment (masking workflow).
                                position: index === 0 ? 'relative' : 'absolute', // First layer sets bounds
                                width: 'auto',
                                height: 'auto',
                                opacity: layer.opacity,
                                mixBlendMode: (layer.blendMode === 'source-over' ? 'normal' : layer.blendMode)
                            }}
                        >
                            {/* Container for Masking */}
                            <div style={{
                                position: 'relative',
                                width: '100%',
                                height: '100%',
                                maskImage: layer.mask ? `url(${layer.mask})` : 'none',
                                WebkitMaskImage: layer.mask ? `url(${layer.mask})` : 'none',
                                maskMode: 'alpha',
                                maskRepeat: 'no-repeat',
                                WebkitMaskRepeat: 'no-repeat',
                                maskSize: '100% 100%',
                                WebkitMaskSize: '100% 100%',
                                ...({ WebkitMaskMode: 'alpha' })
                            }}>
                                <img
                                    src={displayImage}
                                    alt={layer.name}
                                    className="max-w-none max-h-none object-contain w-auto h-auto block"
                                    style={{
                                        maxWidth: '100vw',
                                        maxHeight: '100vh',
                                        filter: isActive ? cssFilterString : 'none'
                                    }}
                                />
                                {isActive && (
                                    <>
                                        <div className="absolute inset-0 z-20 pointer-events-none mix-blend-mode-soft-light" style={{ backgroundColor: tempColor }}></div>
                                        <div className="absolute inset-0 z-20 pointer-events-none mix-blend-mode-soft-light" style={{ backgroundColor: tintColor }}></div>
                                        <div className="absolute inset-0 z-20 pointer-events-none" style={fadeStyle}></div>
                                        <div className="absolute inset-0 z-30 pointer-events-none" style={vignetteStyle}></div>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
