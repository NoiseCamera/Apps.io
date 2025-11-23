
import React, { useRef, useEffect, useState } from 'react';
import { Button } from './Button';
import { Spinner } from './Spinner';
import { MEISHI_PRESETS } from '../data/meishiPresets';

// Constants
const CARD_WIDTH = 1075; // ~91mm @ 300dpi
const CARD_HEIGHT = 650; // ~55mm @ 300dpi

// Extended Font List (20 Fonts)
const AVAILABLE_FONTS = [
    { name: 'Noto Sans JP', family: "'Noto Sans JP', sans-serif" },
    { name: 'Noto Serif JP', family: "'Noto Serif JP', serif" },
    { name: 'M PLUS Rounded 1c', family: "'M PLUS Rounded 1c', sans-serif" },
    { name: 'Kaisei Opti', family: "'Kaisei Opti', serif" },
    { name: 'DotGothic16', family: "'DotGothic16', sans-serif" },
    { name: 'Yuji Syuku', family: "'Yuji Syuku', serif" },
    { name: 'Hachi Maru Pop', family: "'Hachi Maru Pop', cursive" },
    { name: 'Zen Kaku Gothic', family: "'Zen Kaku Gothic New', sans-serif" },
    { name: 'Zen Maru Gothic', family: "'Zen Maru Gothic', sans-serif" },
    { name: 'Sawarabi Mincho', family: "'Sawarabi Mincho', serif" },
    { name: 'Sawarabi Gothic', family: "'Sawarabi Gothic', sans-serif" },
    { name: 'Dela Gothic One', family: "'Dela Gothic One', sans-serif" },
    { name: 'RocknRoll One', family: "'RocknRoll One', sans-serif" },
    { name: 'Reggae One', family: "'Reggae One', sans-serif" },
    { name: 'Potta One', family: "'Potta One', cursive" },
    { name: 'Shippori Mincho', family: "'Shippori Mincho', serif" },
    { name: 'Klee One', family: "'Klee One', cursive" },
    { name: 'Train One', family: "'Train One', cursive" },
    { name: 'Rampart One', family: "'Rampart One', sans-serif" },
    { name: 'Kaisei Decol', family: "'Kaisei Decol', serif" },
];

// Icons
const IconAlignLeft = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></svg>;
const IconAlignCenter = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>;
const IconAlignRight = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>;

export const MeishiEditor = ({ imageSrc, initialState, onChange, onClose, onEditImage }) => {
    const canvasRef = useRef(null);
    const [activeTab, setActiveTab] = useState('templates');
    const [isProcessing, setIsProcessing] = useState(false);

    // Drag State
    const [dragTarget, setDragTarget] = useState('none');
    const [dragAction, setDragAction] = useState('move');
    const pointerStart = useRef(null);
    const initialElPos = useRef(null);

    // To store calculated bounds for hit testing
    const elementBounds = useRef(new Map());

    const [loadedImg, setLoadedImg] = useState(null);
    const [customFonts, setCustomFonts] = useState([]);

    const width = initialState.isVertical ? CARD_HEIGHT : CARD_WIDTH;
    const height = initialState.isVertical ? CARD_WIDTH : CARD_HEIGHT;

    // Load Image Once
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = imageSrc;
        img.onload = () => {
            setLoadedImg(img);
        };
    }, [imageSrc]);

    // Render Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !loadedImg) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        draw(ctx, loadedImg);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadedImg, initialState, width, height, dragTarget, customFonts]);

    const generateQR = (data) => {
        if (typeof window.qrcode !== 'function') return null;
        for (let type = 1; type <= 40; type++) {
            try {
                const qr = window.qrcode(type, 'M');
                qr.addData(data);
                qr.make();
                const count = qr.getModuleCount();
                const modules = [];
                for (let r = 0; r < count; r++) {
                    const row = [];
                    for (let c = 0; c < count; c++) {
                        row.push(qr.isDark(r, c));
                    }
                    modules.push(row);
                }
                return modules;
            } catch (e) {
                continue;
            }
        }
        return null;
    };

    const draw = (ctx, img) => {
        ctx.clearRect(0, 0, width, height);
        elementBounds.current.clear();

        // 1. Background
        ctx.fillStyle = initialState.backgroundColor;
        ctx.fillRect(0, 0, width, height);

        // 2. Photo
        if (initialState.photoPos.visible) {
            const { photoPos } = initialState;

            ctx.save();
            const cx = photoPos.x * width;
            const cy = photoPos.y * height;

            ctx.translate(cx, cy);
            if (photoPos.rotate) ctx.rotate((photoPos.rotate * Math.PI) / 180);

            let drawW, drawH;

            if (photoPos.fit === 'cover') {
                const ratio = Math.max(width / img.width, height / img.height);
                const scale = ratio * photoPos.scale;
                drawW = img.width * scale;
                drawH = img.height * scale;
            } else if (photoPos.fit === 'stretch') {
                drawW = width * photoPos.scale;
                drawH = height * photoPos.scale;
            } else {
                const ratio = Math.min(width / img.width, height / img.height);
                const scale = ratio * photoPos.scale;
                drawW = img.width * scale;
                drawH = img.height * scale;
            }

            ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

            // Store bounds
            elementBounds.current.set('photo', { x: cx, y: cy, w: drawW, h: drawH, angle: photoPos.rotate || 0 });

            if (dragTarget === 'photo') {
                drawSelection(ctx, 0, 0, drawW, drawH);
                drawResizeHandle(ctx, drawW / 2, drawH / 2);
            }

            ctx.restore();
        }

        // 3. Frame
        drawFrame(ctx, width, height, initialState.frameStyle, initialState.themeColor, initialState.subColor);

        // 4. Text Common Config
        const baseSize = (initialState.isVertical ? CARD_WIDTH : CARD_HEIGHT) / 20;
        let fontCSS = AVAILABLE_FONTS.find(f => f.name === initialState.fontFamily)?.family
            || customFonts.find(f => f.name === initialState.fontFamily)?.family
            || "'Noto Sans JP', sans-serif";
        const weight = initialState.fontWeight || 700;

        // Draw Name
        if (initialState.namePos.visible) {
            const { namePos } = initialState;
            const size = baseSize * 2 * namePos.scale;
            ctx.font = `${weight} ${size}px ${fontCSS}`;
            ctx.textAlign = namePos.align || 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = initialState.nameColor || initialState.textColor;

            const tx = namePos.x * width;
            const ty = namePos.y * height;

            const text = initialState.name || 'Name';
            const metrics = ctx.measureText(text);
            const boundW = metrics.width;
            const boundH = size; // Approximate

            ctx.save();
            ctx.translate(tx, ty);
            if (namePos.rotate) ctx.rotate((namePos.rotate * Math.PI) / 180);

            ctx.beginPath();
            if (initialState.textStroke) {
                ctx.lineWidth = size * 0.08;
                ctx.strokeStyle = initialState.backgroundColor === '#000000' ? '#fff' : initialState.themeColor;
                ctx.lineJoin = 'round';
                ctx.strokeText(text, 0, 0);
            }
            if (initialState.textShadow) {
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 6;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;
            }
            ctx.fillText(text, 0, 0);

            // Adjust bounding box based on alignment
            let bx = 0;
            if (ctx.textAlign === 'left') bx = boundW / 2;
            if (ctx.textAlign === 'right') bx = -boundW / 2;

            // Draw UI if selected
            if (dragTarget === 'name') {
                drawSelection(ctx, bx, 0, boundW + 20, boundH + 20);
                drawResizeHandle(ctx, bx + (boundW + 20) / 2, (boundH + 20) / 2);
            }

            elementBounds.current.set('name', { x: tx, y: ty, w: boundW, h: boundH, angle: namePos.rotate || 0 });
            ctx.restore();
        }

        // Draw Details
        if (initialState.detailsPos.visible) {
            const { detailsPos } = initialState;
            const size = baseSize * 0.9 * detailsPos.scale;
            ctx.font = `${weight} ${size}px ${fontCSS}`;
            ctx.textAlign = detailsPos.align || 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = initialState.detailsColor || initialState.textColor;

            const tx = detailsPos.x * width;
            const ty = detailsPos.y * height;
            const lineHeight = size * (initialState.detailsLineHeight || 1.5);

            const lines = [];
            if (initialState.twitterId) lines.push(`X: @${initialState.twitterId}`);
            if (initialState.instagramId) lines.push(`IG: @${initialState.instagramId}`);
            if (initialState.freeText) lines.push(initialState.freeText);

            // Calc Bounds
            let maxW = 0;
            lines.forEach(l => {
                const m = ctx.measureText(l);
                if (m.width > maxW) maxW = m.width;
            });
            const totalH = lines.length * lineHeight;

            ctx.save();
            ctx.translate(tx, ty);
            if (detailsPos.rotate) ctx.rotate((detailsPos.rotate * Math.PI) / 180);

            let currentY = -(totalH / 2) + (lineHeight / 2);

            lines.forEach(line => {
                if (initialState.textStroke) {
                    ctx.lineWidth = size * 0.1;
                    ctx.strokeStyle = initialState.backgroundColor === '#000000' ? '#fff' : '#fff';
                    ctx.lineJoin = 'round';
                    ctx.strokeText(line, 0, currentY);
                }
                if (initialState.textShadow) {
                    ctx.shadowColor = 'rgba(0,0,0,0.5)';
                    ctx.shadowBlur = 4;
                    ctx.shadowOffsetX = 1;
                    ctx.shadowOffsetY = 1;
                }
                ctx.fillText(line, 0, currentY);
                currentY += lineHeight;
            });

            // Adjust bounding box for selection
            let bx = 0;
            if (ctx.textAlign === 'left') bx = maxW / 2;
            if (ctx.textAlign === 'right') bx = -maxW / 2;

            if (dragTarget === 'details') {
                drawSelection(ctx, bx, 0, maxW + 20, totalH + 10);
                drawResizeHandle(ctx, bx + (maxW + 20) / 2, (totalH + 10) / 2);
            }

            elementBounds.current.set('details', { x: tx, y: ty, w: maxW, h: totalH, angle: detailsPos.rotate || 0 });
            ctx.restore();
        }

        // 5. QR Code
        if (initialState.qrPos.visible && (initialState.twitterId || initialState.instagramId)) {
            const { qrPos } = initialState;
            const size = (initialState.isVertical ? CARD_WIDTH : CARD_HEIGHT) * 0.25 * qrPos.scale;
            const qx = qrPos.x * width;
            const qy = qrPos.y * height;

            const url = initialState.twitterId
                ? `https://twitter.com/${initialState.twitterId.replace('@', '')}`
                : `https://instagram.com/${initialState.instagramId}`;

            const modules = generateQR(url);

            ctx.save();
            ctx.translate(qx, qy);
            if (qrPos.rotate) ctx.rotate((qrPos.rotate * Math.PI) / 180);

            if (initialState.qrBgColor !== 'transparent') {
                ctx.fillStyle = initialState.qrBgColor;
                if (initialState.qrStyle === 'rounded' || initialState.qrStyle === 'dots') {
                    roundRect(ctx, -size / 2 - 10, -size / 2 - 10, size + 20, size + 20, 15);
                    ctx.fill();
                } else {
                    ctx.fillRect(-size / 2 - 10, -size / 2 - 10, size + 20, size + 20);
                }
            }

            if (modules) {
                const count = modules.length;
                const tileSize = size / count;
                ctx.fillStyle = initialState.qrColor;
                for (let r = 0; r < count; r++) {
                    for (let c = 0; c < count; c++) {
                        if (modules[r][c]) {
                            const x = -size / 2 + c * tileSize;
                            const y = -size / 2 + r * tileSize;
                            if (initialState.qrStyle === 'dots') {
                                ctx.beginPath();
                                ctx.arc(x + tileSize / 2, y + tileSize / 2, tileSize / 2 * 0.9, 0, Math.PI * 2);
                                ctx.fill();
                            } else if (initialState.qrStyle === 'rounded') {
                                roundRect(ctx, x, y, tileSize, tileSize, tileSize * 0.3);
                                ctx.fill();
                            } else {
                                ctx.fillRect(x, y, tileSize + 0.5, tileSize + 0.5);
                            }
                        }
                    }
                }
            }

            if (dragTarget === 'qr') {
                drawSelection(ctx, 0, 0, size + 20, size + 20);
                drawResizeHandle(ctx, size / 2 + 10, size / 2 + 10);
            }

            elementBounds.current.set('qr', { x: qx, y: qy, w: size, h: size, angle: qrPos.rotate || 0 });
            ctx.restore();
        }
    };

    // --- Drawing Helpers ---

    const drawFrame = (ctx, w, h, style, color, sub) => {
        if (style === 'none') return;

        const pad = 30;
        ctx.lineWidth = 15;
        ctx.strokeStyle = color;
        ctx.fillStyle = color;

        if (style === 'simple') {
            ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);
        } else if (style === 'thick') {
            ctx.lineWidth = 40;
            ctx.strokeRect(20, 20, w - 40, h - 40);
        } else if (style === 'double') {
            ctx.lineWidth = 8;
            ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);
            ctx.strokeStyle = sub;
            ctx.strokeRect(pad + 15, pad + 15, w - (pad + 15) * 2, h - (pad + 15) * 2);
        } else if (style === 'corners') {
            const len = 150;
            ctx.lineWidth = 20;
            ctx.beginPath(); ctx.moveTo(pad, pad + len); ctx.lineTo(pad, pad); ctx.lineTo(pad + len, pad); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(w - pad, pad + len); ctx.lineTo(w - pad, pad); ctx.lineTo(w - pad - len, pad); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(w - pad, h - pad - len); ctx.lineTo(w - pad, h - pad); ctx.lineTo(w - pad - len, h - pad); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(pad, h - pad - len); ctx.lineTo(pad, h - pad); ctx.lineTo(pad + len, h - pad); ctx.stroke();
        } else if (style === 'bracket') {
            const indent = w * 0.1;
            ctx.lineWidth = 30;
            ctx.beginPath(); ctx.moveTo(indent, pad); ctx.lineTo(pad, pad); ctx.lineTo(pad, h - pad); ctx.lineTo(indent, h - pad); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(w - indent, pad); ctx.lineTo(w - pad, pad); ctx.lineTo(w - pad, h - pad); ctx.lineTo(w - indent, h - pad); ctx.stroke();
        } else if (style === 'top-bottom') {
            const barH = h * 0.15;
            ctx.fillStyle = color;
            ctx.fillRect(0, 0, w, barH);
            ctx.fillStyle = sub;
            ctx.fillRect(0, h - barH, w, barH);
        } else if (style === 'cyber') {
            ctx.lineWidth = 4;
            ctx.strokeStyle = color;
            ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);
            const len = 100;
            ctx.lineWidth = 15;
            ctx.beginPath(); ctx.moveTo(pad, pad + len); ctx.lineTo(pad, pad); ctx.lineTo(pad + len, pad); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(w - pad, h - pad - len); ctx.lineTo(w - pad, h - pad); ctx.lineTo(w - pad - len, h - pad); ctx.stroke();
            ctx.fillStyle = sub;
            ctx.fillRect(w - pad - 40, pad, 40, 40);
            ctx.fillRect(pad, h - pad - 40, 40, 40);
        } else if (style === 'modern') {
            const barW = w * 0.25;
            ctx.fillStyle = color;
            if (initialState.isVertical) {
                ctx.fillRect(0, h - w * 0.25, w, w * 0.25);
            } else {
                ctx.fillRect(0, 0, barW, h);
            }
        }
    };

    const roundRect = (ctx, x, y, w, h, r) => {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    const drawSelection = (ctx, x, y, w, h) => {
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 10]);
        ctx.strokeRect(x - w / 2, y - h / 2, w, h);
        ctx.setLineDash([]);
    }

    const drawResizeHandle = (ctx, x, y) => {
        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    // --- Interactions ---

    const getPointerLocal = (e, canvas) => {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / rect.width * width,
            y: (e.clientY - rect.top) / rect.height * height
        };
    }

    const checkHandleHit = (px, py, target, align) => {
        const b = elementBounds.current.get(target);
        if (!b) return false;

        // Transform point into element local space to check handle
        // Translate back from center
        const dx = px - b.x;
        const dy = py - b.y;
        // Rotate back
        const rad = -b.angle * Math.PI / 180;
        const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
        const ly = dx * Math.sin(rad) + dy * Math.cos(rad);

        let hx = b.w / 2 + 10; // Default center align
        if (target === 'name' || target === 'details') {
            if (align === 'left') hx = b.w + 10;
            else if (align === 'right') hx = 10;
            else hx = b.w / 2 + 10;
        }
        const hy = b.h / 2 + 10;

        const dist = Math.hypot(lx - hx, ly - hy);
        return dist < 40; // Hit radius
    }

    const handlePointerDown = (e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const { x, y } = getPointerLocal(e, canvas);

        // Check handles of currently selected target first
        if (dragTarget !== 'none') {
            const stateAlign = dragTarget === 'name' ? initialState.namePos.align : dragTarget === 'details' ? initialState.detailsPos.align : 'center';
            if (checkHandleHit(x, y, dragTarget, stateAlign)) {
                setDragAction('scale');
                pointerStart.current = { x: e.clientX, y: e.clientY };
                const targetKey = dragTarget === 'qr' ? 'qrPos' : dragTarget === 'name' ? 'namePos' : dragTarget === 'details' ? 'detailsPos' : 'photoPos';
                initialElPos.current = { ...initialState[targetKey] };
                return;
            }
        }

        // Check Bodies (Hit Test)
        // Priority: QR > Details > Name > Photo
        const targets = ['qr', 'details', 'name', 'photo'];
        for (const t of targets) {
            const b = elementBounds.current.get(t);
            if (!b) continue;

            if (Math.hypot(x - b.x, y - b.y) < Math.max(b.w, b.h) / 2) {
                setDragTarget(t);
                setDragAction('move');
                pointerStart.current = { x: e.clientX, y: e.clientY };
                const targetKey = t === 'qr' ? 'qrPos' : t === 'name' ? 'namePos' : t === 'details' ? 'detailsPos' : 'photoPos';
                initialElPos.current = { ...initialState[targetKey] };
                return;
            }
        }

        // If nothing hit, deselect
        setDragTarget('none');
    };

    const handlePointerMove = (e) => {
        if (!pointerStart.current || !initialElPos.current || dragTarget === 'none') return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();

        if (dragAction === 'move') {
            const dx = (e.clientX - pointerStart.current.x) / rect.width;
            const dy = (e.clientY - pointerStart.current.y) / rect.height;

            const newState = { ...initialState };
            const targetKey = dragTarget === 'qr' ? 'qrPos' : dragTarget === 'name' ? 'namePos' : dragTarget === 'details' ? 'detailsPos' : 'photoPos';

            newState[targetKey] = {
                ...initialElPos.current,
                x: initialElPos.current.x + dx,
                y: initialElPos.current.y + dy
            };
            onChange(newState);

        } else if (dragAction === 'scale') {
            const dy = (e.clientY - pointerStart.current.y);
            // Sensitivity
            const scaleDelta = dy * 0.005;
            const newState = { ...initialState };
            const targetKey = dragTarget === 'qr' ? 'qrPos' : dragTarget === 'name' ? 'namePos' : dragTarget === 'details' ? 'detailsPos' : 'photoPos';

            const newScale = Math.max(0.1, initialElPos.current.scale + scaleDelta);
            newState[targetKey] = { ...initialElPos.current, scale: newScale };
            onChange(newState);
        }
    };

    const handlePointerUp = () => {
        setDragAction('move');
        pointerStart.current = null;
    };

    const applyPreset = (presetId) => {
        const preset = MEISHI_PRESETS.find(p => p.id === presetId);
        if (preset) {
            onChange({ ...initialState, ...preset.state });
        }
    };

    const handleSave = () => {
        setIsProcessing(true);
        setTimeout(() => {
            const link = document.createElement('a');
            link.download = `cos-meishi-${Date.now()}.png`;
            link.href = canvasRef.current.toDataURL('image/png', 1.0);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setIsProcessing(false);
            onClose();
        }, 100);
    };

    const handleFontUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const buffer = await file.arrayBuffer();
            const fontName = `Custom-${Date.now()}`;
            const font = new FontFace(fontName, buffer);
            await font.load();
            document.fonts.add(font);
            setCustomFonts(prev => [...prev, { name: file.name.split('.')[0], family: fontName }]);
            onChange({ ...initialState, fontFamily: file.name.split('.')[0] });
        } catch (err) {
            alert("フォントの読み込みに失敗しました");
        }
    };

    const updateAlign = (target, align) => {
        if (target === 'name') onChange({ ...initialState, namePos: { ...initialState.namePos, align } });
        if (target === 'details') onChange({ ...initialState, detailsPos: { ...initialState.detailsPos, align } });
    }

    return (
        <div className="fixed inset-0 z-[60] bg-zinc-900 flex flex-col animate-fade-in">
            {/* Header */}
            <div className="h-14 px-4 flex items-center justify-between border-b border-white/10 bg-black/50 shrink-0">
                <h2 className="font-bold text-white flex items-center gap-2">
                    <span className="text-xl">📇</span> 名刺メーカー
                </h2>
                <div className="flex gap-2">
                    <button onClick={onClose} className="px-4 py-1 text-white/60 text-xs hover:text-white">閉じる</button>
                    <Button variant="primary" onClick={handleSave} className="!py-1 !px-4">{isProcessing ? <Spinner /> : '保存'}</Button>
                </div>
            </div>

            {/* Canvas Container */}
            <div className="flex-1 bg-zinc-950 relative overflow-hidden flex items-center justify-center p-8 touch-none select-none">
                <div className="relative shadow-2xl transition-all duration-300" style={{ aspectRatio: `${width}/${height}`, maxHeight: '50vh', maxWidth: '90%', height: 'auto', width: 'auto' }}>
                    <canvas
                        ref={canvasRef}
                        width={width}
                        height={height}
                        className="w-full h-full object-contain bg-transparent cursor-move"
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                    />
                    <div className="absolute bottom-2 left-2 pointer-events-none bg-black/50 text-white text-[10px] px-2 py-1 rounded backdrop-blur opacity-50">
                        要素をタップ選択・ドラッグで移動・右下ハンドルで拡大縮小
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-zinc-900 border-t border-white/10 h-[45vh] max-h-[450px] flex flex-col shrink-0 pb-safe">
                <div className="flex border-b border-white/10 bg-black/20">
                    {[
                        { id: 'templates', label: 'プリセット' },
                        { id: 'content', label: '文字・情報' },
                        { id: 'style', label: 'デザイン' },
                        { id: 'arrange', label: '配置・写真' }
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            className={`flex-1 py-3 text-xs font-bold border-b-2 transition-colors ${activeTab === t.id ? 'text-cos-accent border-cos-accent bg-white/5' : 'text-white/50 border-transparent'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* --- TEMPLATES --- */}
                    {activeTab === 'templates' && (
                        <div className="grid grid-cols-2 gap-3">
                            {MEISHI_PRESETS.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => applyPreset(p.id)}
                                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cos-accent text-left transition-all group"
                                >
                                    <div className="text-sm font-bold text-white group-hover:text-cos-accent">{p.label}</div>
                                    <div className="text-[10px] text-white/40 mt-1">
                                        {p.state.isVertical ? '縦型' : '横型'} / {p.state.frameStyle !== 'none' ? '枠あり' : '枠なし'}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* --- CONTENT --- */}
                    {activeTab === 'content' && (
                        <div className="space-y-4 max-w-lg mx-auto">
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] text-white/50 uppercase">名前</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={initialState.nameColor || initialState.textColor} onChange={e => onChange({ ...initialState, nameColor: e.target.value })} className="w-6 h-6 rounded border-none bg-transparent" />
                                        <div className="flex bg-black/30 rounded-lg p-0.5">
                                            <button onClick={() => updateAlign('name', 'left')} className={`p-1.5 rounded ${initialState.namePos.align === 'left' ? 'bg-white/20 text-white' : 'text-white/30'}`}><IconAlignLeft /></button>
                                            <button onClick={() => updateAlign('name', 'center')} className={`p-1.5 rounded ${initialState.namePos.align === 'center' || !initialState.namePos.align ? 'bg-white/20 text-white' : 'text-white/30'}`}><IconAlignCenter /></button>
                                            <button onClick={() => updateAlign('name', 'right')} className={`p-1.5 rounded ${initialState.namePos.align === 'right' ? 'bg-white/20 text-white' : 'text-white/30'}`}><IconAlignRight /></button>
                                        </div>
                                    </div>
                                </div>
                                <input type="text" value={initialState.name} onChange={e => onChange({ ...initialState, name: e.target.value })} className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white mb-2" />
                                <input type="range" min="0.5" max="5.0" step="0.1" value={initialState.namePos.scale} onChange={e => onChange({ ...initialState, namePos: { ...initialState.namePos, scale: Number(e.target.value) } })} className="w-full h-1 bg-white/20 rounded-lg appearance-none accent-cos-accent" />
                            </div>

                            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] text-white/50 uppercase">詳細情報 (ID/フリー)</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={initialState.detailsColor || initialState.textColor} onChange={e => onChange({ ...initialState, detailsColor: e.target.value })} className="w-6 h-6 rounded border-none bg-transparent" />
                                        <div className="flex bg-black/30 rounded-lg p-0.5">
                                            <button onClick={() => updateAlign('details', 'left')} className={`p-1.5 rounded ${initialState.detailsPos.align === 'left' ? 'bg-white/20 text-white' : 'text-white/30'}`}><IconAlignLeft /></button>
                                            <button onClick={() => updateAlign('details', 'center')} className={`p-1.5 rounded ${initialState.detailsPos.align === 'center' || !initialState.detailsPos.align ? 'bg-white/20 text-white' : 'text-white/30'}`}><IconAlignCenter /></button>
                                            <button onClick={() => updateAlign('details', 'right')} className={`p-1.5 rounded ${initialState.detailsPos.align === 'right' ? 'bg-white/20 text-white' : 'text-white/30'}`}><IconAlignRight /></button>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <input type="text" value={initialState.twitterId} onChange={e => onChange({ ...initialState, twitterId: e.target.value })} className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-xs" placeholder="X ID (@なし)" />
                                    <input type="text" value={initialState.instagramId} onChange={e => onChange({ ...initialState, instagramId: e.target.value })} className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-xs" placeholder="IG ID" />
                                </div>
                                <textarea rows={2} value={initialState.freeText} onChange={e => onChange({ ...initialState, freeText: e.target.value })} className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-xs mb-3" placeholder="フリーテキスト" />

                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs w-16 text-white/50">サイズ</span>
                                        <input type="range" min="0.5" max="4.0" step="0.1" value={initialState.detailsPos.scale} onChange={e => onChange({ ...initialState, detailsPos: { ...initialState.detailsPos, scale: Number(e.target.value) } })} className="flex-1 h-1 bg-white/20 rounded-lg appearance-none accent-cos-accent" />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs w-16 text-white/50">行間</span>
                                        <input type="range" min="1.0" max="3.0" step="0.1" value={initialState.detailsLineHeight || 1.5} onChange={e => onChange({ ...initialState, detailsLineHeight: Number(e.target.value) })} className="flex-1 h-1 bg-white/20 rounded-lg appearance-none accent-cos-accent" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- STYLE --- */}
                    {activeTab === 'style' && (
                        <div className="space-y-5 max-w-lg mx-auto">
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <label className="text-[10px] text-white/50 uppercase">フォント</label>
                                    <label className="text-[10px] text-cos-accent cursor-pointer hover:text-white flex items-center gap-1">
                                        <span>+ カスタムフォント</span>
                                        <input type="file" accept=".ttf,.otf,.woff,.woff2" className="hidden" onChange={handleFontUpload} />
                                    </label>
                                </div>
                                <select
                                    value={initialState.fontFamily}
                                    onChange={e => onChange({ ...initialState, fontFamily: e.target.value })}
                                    className="w-full bg-black/30 border border-white/20 rounded-lg p-2 text-white text-sm"
                                >
                                    <optgroup label="標準フォント">
                                        {AVAILABLE_FONTS.map(f => (
                                            <option key={f.name} value={f.name}>{f.name}</option>
                                        ))}
                                    </optgroup>
                                    {customFonts.length > 0 && (
                                        <optgroup label="カスタム">
                                            {customFonts.map(f => (
                                                <option key={f.name} value={f.name}>{f.name}</option>
                                            ))}
                                        </optgroup>
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className="text-[10px] text-white/50 uppercase mb-2 block">文字の太さ ({initialState.fontWeight || 700})</label>
                                <input
                                    type="range" min="100" max="900" step="100"
                                    value={initialState.fontWeight || 700}
                                    onChange={e => onChange({ ...initialState, fontWeight: Number(e.target.value) })}
                                    className="w-full h-1 bg-white/20 rounded-lg appearance-none accent-cos-accent"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] text-white/50 uppercase mb-2 block">背景色</label>
                                <input type="color" value={initialState.backgroundColor} onChange={e => onChange({ ...initialState, backgroundColor: e.target.value })} className="w-full h-8 bg-transparent rounded border border-white/20" />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] text-white/50 uppercase">フレーム (枠線)</label>
                                    <div className="flex gap-2">
                                        <input type="color" value={initialState.themeColor} onChange={e => onChange({ ...initialState, themeColor: e.target.value })} className="w-6 h-6 rounded bg-transparent border border-white/20" title="メインカラー" />
                                        <input type="color" value={initialState.subColor} onChange={e => onChange({ ...initialState, subColor: e.target.value })} className="w-6 h-6 rounded bg-transparent border border-white/20" title="サブカラー" />
                                    </div>
                                </div>
                                <div className="flex overflow-x-auto gap-2 no-scrollbar pb-1">
                                    {['none', 'simple', 'thick', 'double', 'corners', 'bracket', 'cyber', 'modern', 'top-bottom'].map(s => (
                                        <button key={s} onClick={() => onChange({ ...initialState, frameStyle: s })} className={`px-3 py-1.5 text-xs whitespace-nowrap rounded-full border ${initialState.frameStyle === s ? 'border-cos-accent bg-cos-accent text-white' : 'border-white/20 text-white/50'}`}>{s}</button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] text-white/50 uppercase mb-2 block">QRコード</label>
                                <div className="flex gap-3 items-center">
                                    <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
                                        {['normal', 'dots', 'rounded'].map(s => (
                                            <button key={s} onClick={() => onChange({ ...initialState, qrStyle: s })} className={`px-3 py-1 text-xs rounded ${initialState.qrStyle === s ? 'bg-white/20 text-white' : 'text-white/50'}`}>{s}</button>
                                        ))}
                                    </div>
                                    <input type="color" value={initialState.qrColor} onChange={e => onChange({ ...initialState, qrColor: e.target.value })} className="w-8 h-8 rounded bg-transparent border border-white/20" title="QR Color" />
                                    <div className="flex items-center gap-2 ml-auto">
                                        <span className="text-[10px] text-white/50">背景</span>
                                        <input type="checkbox" checked={initialState.qrBgColor !== 'transparent'} onChange={e => onChange({ ...initialState, qrBgColor: e.target.checked ? '#ffffff' : 'transparent' })} className="accent-cos-accent" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-2 border-t border-white/5">
                                <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
                                    <input type="checkbox" checked={initialState.textShadow} onChange={e => onChange({ ...initialState, textShadow: e.target.checked })} className="accent-cos-accent" />
                                    文字の影
                                </label>
                                <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
                                    <input type="checkbox" checked={initialState.textStroke} onChange={e => onChange({ ...initialState, textStroke: e.target.checked })} className="accent-cos-accent" />
                                    文字の縁取り
                                </label>
                            </div>
                        </div>
                    )}

                    {/* --- ARRANGE --- */}
                    {activeTab === 'arrange' && (
                        <div className="space-y-6 max-w-lg mx-auto">
                            <Button variant="secondary" fullWidth onClick={onEditImage}>写真の編集に戻る (美肌・フィルター)</Button>

                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => onChange({ ...initialState, isVertical: !initialState.isVertical })} className="p-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm flex items-center justify-center gap-2">
                                    <span>🔄</span> {initialState.isVertical ? '横向きにする' : '縦向きにする'}
                                </button>
                                <div className="flex items-center justify-center text-xs text-white/40 text-center leading-tight">
                                    要素タップで選択<br />右下ハンドルで拡大
                                </div>
                            </div>

                            <div className="bg-white/5 p-3 rounded-xl space-y-3">
                                <label className="text-[10px] text-white/50 uppercase block">写真調整</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onChange({ ...initialState, photoPos: { ...initialState.photoPos, x: 0.5, y: 0.5, scale: 1.0, fit: 'contain', rotate: 0 } })}
                                        className={`flex-1 py-2 text-[10px] rounded border ${initialState.photoPos.fit === 'contain' ? 'bg-cos-accent border-cos-accent text-white' : 'bg-black/30 border-white/10 text-white/70'}`}
                                    >
                                        全体 (Contain)
                                    </button>
                                    <button
                                        onClick={() => onChange({ ...initialState, photoPos: { ...initialState.photoPos, x: 0.5, y: 0.5, scale: 1.0, fit: 'cover', rotate: 0 } })}
                                        className={`flex-1 py-2 text-[10px] rounded border ${initialState.photoPos.fit === 'cover' ? 'bg-cos-accent border-cos-accent text-white' : 'bg-black/30 border-white/10 text-white/70'}`}
                                    >
                                        埋込 (Cover)
                                    </button>
                                    <button
                                        onClick={() => onChange({ ...initialState, photoPos: { ...initialState.photoPos, x: 0.5, y: 0.5, scale: 1.0, fit: 'stretch', rotate: 0 } })}
                                        className={`flex-1 py-2 text-[10px] rounded border ${initialState.photoPos.fit === 'stretch' ? 'bg-cos-accent border-cos-accent text-white' : 'bg-black/30 border-white/10 text-white/70'}`}
                                    >
                                        変形 (Fill)
                                    </button>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className="text-xs w-8 text-white/60">回転</span>
                                    <input
                                        type="range" min="-180" max="180" step="1"
                                        value={initialState.photoPos.rotate || 0}
                                        onChange={e => onChange({ ...initialState, photoPos: { ...initialState.photoPos, rotate: Number(e.target.value) } })}
                                        className="flex-1 h-1 bg-white/20 rounded-lg appearance-none accent-cos-accent"
                                    />
                                    <button onClick={() => onChange({ ...initialState, photoPos: { ...initialState.photoPos, rotate: 0 } })} className="text-xs text-white/40">R</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-2 pt-2">
                                <label className="flex flex-col items-center gap-1 text-[10px] text-white/60 cursor-pointer">
                                    <input type="checkbox" checked={initialState.photoPos.visible} onChange={e => onChange({ ...initialState, photoPos: { ...initialState.photoPos, visible: e.target.checked } })} className="accent-cos-accent" />
                                    写真
                                </label>
                                <label className="flex flex-col items-center gap-1 text-[10px] text-white/60 cursor-pointer">
                                    <input type="checkbox" checked={initialState.namePos.visible} onChange={e => onChange({ ...initialState, namePos: { ...initialState.namePos, visible: e.target.checked } })} className="accent-cos-accent" />
                                    名前
                                </label>
                                <label className="flex flex-col items-center gap-1 text-[10px] text-white/60 cursor-pointer">
                                    <input type="checkbox" checked={initialState.detailsPos.visible} onChange={e => onChange({ ...initialState, detailsPos: { ...initialState.detailsPos, visible: e.target.checked } })} className="accent-cos-accent" />
                                    詳細
                                </label>
                                <label className="flex flex-col items-center gap-1 text-[10px] text-white/60 cursor-pointer">
                                    <input type="checkbox" checked={initialState.qrPos.visible} onChange={e => onChange({ ...initialState, qrPos: { ...initialState.qrPos, visible: e.target.checked } })} className="accent-cos-accent" />
                                    QR
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
