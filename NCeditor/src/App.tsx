
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CanvasArea } from './components/CanvasArea';
import { Button } from './components/Button';
import { Spinner } from './components/Spinner';
import { CurveEditor } from './components/CurveEditor';
import { LiquifyEditor } from './components/LiquifyEditor';
import { MaskEditor } from './components/MaskEditor';
import { MakeupEditor } from './components/MakeupEditor';
import { MeishiEditor } from './components/MeishiEditor';
import { Camera } from './components/Camera';
import { CropEditor } from './components/CropEditor';
import { Histogram } from './components/Histogram';
import { Slider } from './components/Slider';
import { 
    IconMove, IconAlignLeft, IconAlignCenter, IconAlignRight, 
    IconPlusSquare, IconCrop, IconSettings, IconImage, IconX, 
    IconEye, IconTrash, IconDownload, IconImport, IconStar, IconCheck,
    IconSun, IconContrast, IconBrightness, IconHighlights, IconShadows,
    IconSaturation, IconVibrance, IconTemp, IconTint, IconHue,
    IconCurves, IconSelective, IconSharpen, IconGrain, IconBlur,
    IconVignette, IconFade, IconSepia, IconBnW, IconInvert, IconPreset,
    IconAdjust, IconMask, IconMagic, IconLiquify, IconLayers, IconBeauty,
    IconFace, IconSkin, IconCard, IconCamera, IconText, IconSparkles
} from './components/Icon';
import { editImageWithAI, generateCosplayCaption, generateAIMask, MaskTarget } from './services/geminiService';
import { ToolMode, AICaptionResult, FilterState, ImageState, Preset, SavedPrompt, Layer, MeishiState, LayerTransform, TextConfig } from './types';
import { createSplineLUT, processSelectiveAdjustments } from './utils/imageProcessing';
import { generateEffectLayer, generateTextLayerImage } from './utils/assetGenerator';
import { DEFAULT_FILTERS, DEFAULT_MEISHI_STATE } from './constants';
import { FACTORY_PRESETS } from './data/presets';
import { MEISHI_PRESETS } from './data/meishiPresets';
import { PROMPT_CATEGORIES } from './data/prompts';
import { APP_VERSION, APP_BUILD } from './version';

type AdjustToolId = keyof Omit<FilterState, 'selective' | 'curves'> | 'curves' | 'selective' | 'presets';

interface ToolDef {
    id: AdjustToolId;
    label: string;
    icon: React.ReactNode;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
}

const TOOLS: ToolDef[] = [
    { id: 'presets', label: 'プリセット', icon: <IconPreset/> },
    { id: 'exposure', label: '露光量', min: -100, max: 100, icon: <IconSun/> },
    { id: 'contrast', label: '対比', min: -100, max: 100, icon: <IconContrast/> },
    { id: 'brightness', label: '明るさ', min: -100, max: 100, icon: <IconBrightness/> },
    { id: 'highlights', label: 'ハイライト', min: -100, max: 100, icon: <IconHighlights/> },
    { id: 'shadows', label: 'シャドウ', min: -100, max: 100, icon: <IconShadows/> },
    { id: 'saturation', label: '彩度', min: -100, max: 100, icon: <IconSaturation/> },
    { id: 'vibrance', label: '自然な彩度', min: -100, max: 100, icon: <IconVibrance/> },
    { id: 'temperature', label: '色温度', min: -100, max: 100, icon: <IconTemp/> },
    { id: 'tint', label: '色合い', min: -100, max: 100, icon: <IconTint/> },
    { id: 'hue', label: '色相', min: -180, max: 180, unit: '°', icon: <IconHue/> },
    { id: 'curves', label: 'カーブ', icon: <IconCurves/> },
    { id: 'selective', label: '特定色域', icon: <IconSelective/> },
    { id: 'sharpen', label: 'シャープ', min: 0, max: 100, icon: <IconSharpen/> },
    { id: 'grain', label: '粒子', min: 0, max: 100, icon: <IconGrain/> },
    { id: 'blur', label: 'ぼかし', min: 0, max: 20, step: 1, icon: <IconBlur/> },
    { id: 'vignette', label: '周辺減光', min: 0, max: 100, icon: <IconVignette/> },
    { id: 'fade', label: 'フェード', min: 0, max: 100, icon: <IconFade/> },
    { id: 'sepia', label: 'セピア', min: 0, max: 100, icon: <IconSepia/> },
    { id: 'grayscale', label: 'モノクロ', min: 0, max: 100, icon: <IconBnW/> },
    { id: 'invert', label: '反転', min: 0, max: 100, icon: <IconInvert/> },
];

const EFFECTS_DATA = [
    { 
        id: 'light', 
        label: 'Light', 
        items: ['sparkle', 'bokeh_white', 'bokeh_color', 'lensflare', 'lightleak_warm', 'lightleak_cool', 'sunbeams', 'spotlight', 'neon_ring', 'laser', 'rainbow', 'shimmer', 'glow_orb'] 
    },
    { 
        id: 'weather', 
        label: 'Weather', 
        items: ['rain', 'snow', 'fog', 'lightning', 'aurora', 'fire_embers', 'smoke', 'bubbles', 'galaxy', 'blizzard', 'dust', 'heatwave'] 
    },
    { 
        id: 'nature', 
        label: 'Nature', 
        items: ['cherry_petals', 'rose_petals', 'autumn_leaves', 'feathers_white', 'feathers_black', 'dandelion', 'hearts', 'stars', 'notes', 'butterflies', 'spiderweb', 'ivy'] 
    },
    { 
        id: 'texture', 
        label: 'Texture', 
        items: ['vignette', 'film_grain', 'noise', 'glitch', 'scanlines', 'vhs', 'paper', 'cracked_glass', 'blood', 'cobweb', 'grunge', 'fabric'] 
    },
    { 
        id: 'special', 
        label: 'Manga/FX', 
        items: ['speed_lines', 'concentration', 'cyber_grid', 'matrix', 'magic_circle', 'confetti', 'gold_dust', 'fireworks', 'halo', 'dark_aura', 'shockwave', 'pop_dots'] 
    }
];

const TEXT_TOOL_FONTS = [
    'Noto Sans JP', 'Kaisei Opti', 'M PLUS Rounded 1c', 'DotGothic16', 
    'Yuji Syuku', 'Hachi Maru Pop', 'RocknRoll One', 'Reggae One', 
    'Dela Gothic One', 'Potta One', 'Zen Maru Gothic'
];

// Helper to bake filters
const bakeLayerFilters = async (layer: Layer): Promise<string> => {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = layer.image;
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) { resolve(layer.image); return; }

            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            const filters = layer.filterState;
            const masterLut = createSplineLUT(filters.curves.master);
            const redLut = createSplineLUT(filters.curves.red);
            const greenLut = createSplineLUT(filters.curves.green);
            const blueLut = createSplineLUT(filters.curves.blue);
            
            const d = imageData.data;
            processSelectiveAdjustments(d, filters.selective);

            const exposureFactor = Math.pow(2, filters.exposure / 50);
            for (let i = 0; i < d.length; i += 4) {
                let r = d[i], g = d[i+1], b = d[i+2];
                if (filters.exposure !== 0) { r *= exposureFactor; g *= exposureFactor; b *= exposureFactor; }
                const luma = 0.299 * r + 0.587 * g + 0.114 * b;
                if (filters.highlights !== 0 && luma > 180) {
                    const factor = (luma - 180) / 75;
                    const adj = filters.highlights * factor * 0.5;
                    r += adj; g += adj; b += adj;
                }
                if (filters.shadows !== 0 && luma < 75) {
                     const factor = (75 - luma) / 75;
                     const adj = filters.shadows * factor * 0.5;
                     r += adj; g += adj; b += adj;
                }
                r = redLut[Math.min(255, Math.max(0, Math.round(r)))];
                g = greenLut[Math.min(255, Math.max(0, Math.round(g)))];
                b = blueLut[Math.min(255, Math.max(0, Math.round(b)))];
                r = masterLut[r]; g = masterLut[g]; b = masterLut[b];

                if (filters.vibrance !== 0) {
                    const max = Math.max(r, g, b);
                    const min = Math.min(r, g, b);
                    const sat = (max - min) / (max || 1);
                    const vib = filters.vibrance / 100; 
                    const maskVib = vib >= 0 ? (1 - sat) : sat;
                    const lumaV = 0.299 * r + 0.587 * g + 0.114 * b;
                    const amt = maskVib * vib;
                    r = r + (r - lumaV) * amt; g = g + (g - lumaV) * amt; b = b + (b - lumaV) * amt;
                }
                
                if (filters.fade > 0) {
                    r = r + (filters.fade * 0.5) * (1 - r/255);
                    g = g + (filters.fade * 0.5) * (1 - g/255);
                    b = b + (filters.fade * 0.5) * (1 - b/255);
                }
                
                 if (filters.grain > 0) {
                    const noise = (Math.random() - 0.5) * filters.grain;
                    r += noise; g += noise; b += noise;
                }
                d[i] = r; d[i+1] = g; d[i+2] = b;
            }
            
            ctx.putImageData(imageData, 0, 0);

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tCtx = tempCanvas.getContext('2d');
            if (tCtx) {
                 tCtx.filter = `brightness(${100 + filters.brightness}%) contrast(${100 + filters.contrast}%) saturate(${100 + filters.saturation}%) grayscale(${filters.grayscale}%) sepia(${filters.sepia}%) hue-rotate(${filters.hue}deg) blur(${filters.blur/5}px) invert(${filters.invert}%)`;
                tCtx.drawImage(canvas, 0, 0);

                if (filters.temperature !== 0) {
                    tCtx.globalCompositeOperation = 'soft-light';
                    tCtx.fillStyle = filters.temperature > 0 ? `rgba(255, 160, 0, ${filters.temperature / 200})` : `rgba(0, 100, 255, ${Math.abs(filters.temperature) / 200})`;
                    tCtx.fillRect(0, 0, canvas.width, canvas.height);
                }
                if (filters.tint !== 0) {
                    tCtx.globalCompositeOperation = 'soft-light';
                    tCtx.fillStyle = filters.tint > 0 ? `rgba(255, 0, 255, ${filters.tint / 200})` : `rgba(0, 255, 0, ${Math.abs(filters.tint) / 200})`;
                    tCtx.fillRect(0, 0, canvas.width, canvas.height);
                }
                if (filters.vignette > 0) {
                    tCtx.globalCompositeOperation = 'multiply';
                    const gradient = tCtx.createRadialGradient(canvas.width/2, canvas.height/2, canvas.width/3, canvas.width/2, canvas.height/2, Math.max(canvas.width,canvas.height)/1.2);
                    gradient.addColorStop(0, 'rgba(0,0,0,0)');
                    gradient.addColorStop(1, `rgba(0,0,0,${filters.vignette/100})`);
                    tCtx.fillStyle = gradient;
                    tCtx.fillRect(0, 0, canvas.width, canvas.height);
                }
                resolve(tempCanvas.toDataURL());
            } else {
                resolve(layer.image);
            }
        };
    });
};

const App: React.FC = () => {
  const [imageState, setImageState] = useState<ImageState>({ id: 'init', original: null, preview: null, layers: [], activeLayerId: '', history: [], historyIndex: -1 });
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<ToolMode>(ToolMode.NONE);
  const [isComparing, setIsComparing] = useState(false);
  
  const [activeToolId, setActiveToolId] = useState<AdjustToolId>('presets'); 
  const [activeCurveChannel, setActiveCurveChannel] = useState<'master'|'red'|'green'|'blue'>('master');
  const [activeSelectiveColor, setActiveSelectiveColor] = useState<'reds'|'yellows'|'greens'|'cyans'|'blues'|'magentas'>('reds');
  const [activeEffectCategory, setActiveEffectCategory] = useState<string>('light');
  const [aiPrompt, setAiPrompt] = useState('');
  const [activePromptCategory, setActivePromptCategory] = useState<string>('saved');

  // Text Tool State
  const [textInput, setTextInput] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textFont, setTextFont] = useState('Noto Sans JP');
  const [textVertical, setTextVertical] = useState(false);
  const [textShadow, setTextShadow] = useState(true);
  const [textStroke, setTextStroke] = useState(false);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [customFonts, setCustomFonts] = useState<{name: string, family: string}[]>([]);

  const [meishiState, setMeishiState] = useState<MeishiState>({ ...DEFAULT_MEISHI_STATE, ...MEISHI_PRESETS[0].state });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const layerImageInputRef = useRef<HTMLInputElement>(null);
  const presetImportInputRef = useRef<HTMLInputElement>(null);
  const promptImportInputRef = useRef<HTMLInputElement>(null);
  
  const [isNamingPreset, setIsNamingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [showAiLayerMenu, setShowAiLayerMenu] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3000);
  };

  const activeLayerId = imageState.activeLayerId;
  const activeLayer = useMemo(() => imageState.layers.find(l => l.id === activeLayerId), [imageState.layers, activeLayerId]);

  useEffect(() => {
      if (activeMode === ToolMode.TEXT && activeLayer && activeLayer.textConfig) {
          const config = activeLayer.textConfig;
          setTextInput(config.text);
          setTextColor(config.color);
          setTextFont(config.fontFamily);
          setTextVertical(config.isVertical);
          setTextShadow(config.shadow);
          setTextStroke(config.stroke);
          setTextAlign(config.align);
      } else if (activeMode === ToolMode.TEXT && (!activeLayer || !activeLayer.textConfig)) {
          setTextInput('');
      }
  }, [activeMode, activeLayer]);

  const [presets, setPresets] = useState<Preset[]>(() => {
      try {
          const saved = localStorage.getItem('cos_presets');
          const savedPresets = saved ? JSON.parse(saved) : [];
          return [...FACTORY_PRESETS, ...savedPresets];
      } catch (e) { return FACTORY_PRESETS; }
  });

  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>(() => {
      try {
          const saved = localStorage.getItem('cos_saved_prompts');
          return saved ? JSON.parse(saved) : [];
      } catch (e) { return []; }
  });

  useEffect(() => {
      try { const saved = localStorage.getItem('cos_meishi_draft'); if (saved) setMeishiState(JSON.parse(saved)); } catch (e) {}
  }, []);

  useEffect(() => { try { const userPresets = presets.filter(p => !p.id.startsWith('fp-')); localStorage.setItem('cos_presets', JSON.stringify(userPresets)); } catch (e) {} }, [presets]);
  useEffect(() => { try { localStorage.setItem('cos_saved_prompts', JSON.stringify(savedPrompts)); } catch (e) {} }, [savedPrompts]);
  useEffect(() => { try { localStorage.setItem('cos_meishi_draft', JSON.stringify(meishiState)); } catch (e) {} }, [meishiState]);

  const displayPrompts = useMemo(() => {
      if (activePromptCategory === 'saved') return savedPrompts;
      const category = PROMPT_CATEGORIES.find(c => c.id === activePromptCategory);
      return category ? category.prompts : [];
  }, [activePromptCategory, savedPrompts]);

  const activeToolDef = TOOLS.find(t => t.id === activeToolId);

  // --- Initialization ---
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => { const result = e.target?.result as string; initializeImage(result); };
      reader.readAsDataURL(file);
      event.target.value = '';
    }
  };
  
  const initializeImage = (imageData: string) => {
        const baseLayer: Layer = { id: 'layer-base', name: '背景 (オリジナル)', type: 'image', image: imageData, mask: null, preview: imageData, isVisible: true, opacity: 1, blendMode: 'source-over', filterState: JSON.parse(JSON.stringify(DEFAULT_FILTERS)) };
        setImageState({ id: Date.now().toString(), original: imageData, preview: imageData, layers: [baseLayer], activeLayerId: 'layer-base', history: [[baseLayer]], historyIndex: 0 });
        setActiveMode(ToolMode.NONE);
  };

  const updateActiveLayerFilters = (newFilters: FilterState | ((prev: FilterState) => FilterState)) => {
      if (!activeLayer) return;
      const updatedFilters = typeof newFilters === 'function' ? newFilters(activeLayer.filterState) : newFilters;
      setImageState(prev => {
          const updatedLayers = prev.layers.map(l => l.id === prev.activeLayerId ? { ...l, filterState: updatedFilters } : l);
          return { ...prev, layers: updatedLayers };
      });
  };
  
  const handleResetAdjustments = () => { if (!activeLayer) return; updateActiveLayerFilters(JSON.parse(JSON.stringify(DEFAULT_FILTERS))); };

  const pushToHistory = (newLayers: Layer[]) => {
       setImageState(prev => {
           const newHistory = prev.history.slice(0, prev.historyIndex + 1);
           newHistory.push(newLayers);
           return { ...prev, layers: newLayers, history: newHistory, historyIndex: newHistory.length - 1 };
       });
  };

  const handleUndo = () => { if (imageState.historyIndex > 0) { const newIdx = imageState.historyIndex - 1; setImageState(prev => ({ ...prev, historyIndex: newIdx, layers: prev.history[newIdx] })); } };
  const handleRedo = () => { if (imageState.historyIndex < imageState.history.length - 1) { const newIdx = imageState.historyIndex + 1; setImageState(prev => ({ ...prev, historyIndex: newIdx, layers: prev.history[newIdx] })); } };

  const handleLayerTransform = (transform: LayerTransform) => {
      if (!activeLayer) return;
      setImageState(prev => {
          const updatedLayers = prev.layers.map(l => l.id === prev.activeLayerId ? { ...l, transform: transform } : l);
          return { ...prev, layers: updatedLayers };
      });
  };

  const handleCanvasDoubleTap = (layerId?: string) => {
      if (layerId) {
          const layer = imageState.layers.find(l => l.id === layerId);
          if (layer && layer.textConfig) {
               if (activeLayerId !== layerId) setImageState(prev => ({ ...prev, activeLayerId: layerId }));
               setActiveMode(ToolMode.TEXT);
               return true; 
          }
      }
      return false;
  };

  // --- Handlers ---
  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]; if(!file) return;
      try {
          const buffer = await file.arrayBuffer();
          const fontName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9\-_]/g, '');
          const font = new FontFace(fontName, buffer);
          await font.load();
          (document.fonts as any).add(font);
          setCustomFonts(prev => [...prev, { name: fontName, family: fontName }]);
          setTextFont(fontName);
          showToast(`フォント "${fontName}" を追加しました`);
      } catch (err) { showToast("フォントの読み込みに失敗しました", "error"); }
  };

  const handleAddText = () => {
      if (!textInput.trim() || !imageState.original) return;
      const textImage = generateTextLayerImage(textInput, textFont, textColor, textVertical, textShadow, textStroke, textAlign);
      const config: TextConfig = { text: textInput, fontFamily: textFont, color: textColor, isVertical: textVertical, shadow: textShadow, stroke: textStroke, align: textAlign };
      let newLayers: Layer[];
      let newId = activeLayerId;
      if (activeLayer && activeLayer.textConfig) {
          newLayers = imageState.layers.map(l => l.id === activeLayer.id ? { ...l, image: textImage, preview: textImage, textConfig: config, name: `T: ${textInput.substring(0, 8)}...` } : l);
      } else {
          const newLayer: Layer = { id: `layer-txt-${Date.now()}`, name: `T: ${textInput.substring(0, 8)}...`, type: 'image', image: textImage, mask: null, preview: textImage, isVisible: true, opacity: 1, blendMode: 'source-over', filterState: JSON.parse(JSON.stringify(DEFAULT_FILTERS)), textConfig: config, transform: { x: 0, y: 0, scale: 1, rotate: 0 } };
          newLayers = [...imageState.layers, newLayer];
          newId = newLayer.id;
          showToast("テキストを追加しました");
      }
      pushToHistory(newLayers);
      setImageState(prev => ({...prev, layers: newLayers, activeLayerId: newId}));
      setTextInput('');
      setActiveMode(ToolMode.MOVE);
  };

  const handleAddDecoration = (type: string) => {
      if (!imageState.original) return;
      const base = imageState.layers[0];
      const img = new Image();
      img.src = base.image;
      img.onload = () => {
          const effectImage = generateEffectLayer(type, img.width, img.height);
          let blend: GlobalCompositeOperation = 'screen';
          if (['vignette', 'dark_aura'].includes(type)) blend = 'multiply';
          else if (['glitch', 'scanlines', 'paper'].includes(type)) blend = 'overlay';
          else if (['black_feathers', 'cobweb', 'blood'].includes(type)) blend = 'multiply';
          const newLayer: Layer = { id: `layer-fx-${Date.now()}`, name: `FX: ${type}`, type: 'image', image: effectImage, mask: null, preview: effectImage, isVisible: true, opacity: 1, blendMode: blend, filterState: JSON.parse(JSON.stringify(DEFAULT_FILTERS)), transform: { x: 0, y: 0, scale: 1, rotate: 0 } };
          const newLayers = [...imageState.layers, newLayer];
          pushToHistory(newLayers);
          setImageState(prev => ({...prev, layers: newLayers, activeLayerId: newLayer.id}));
          showToast("エフェクトを追加しました");
          setActiveMode(ToolMode.MOVE);
      };
  };

  const handleAddEmptyLayer = () => {
      if (!imageState.original) return;
      const img = new Image(); img.src = imageState.original;
      img.onload = () => {
          const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
          const emptyImage = canvas.toDataURL('image/png');
          const newLayer: Layer = { id: `layer-empty-${Date.now()}`, name: '空レイヤー', type: 'image', image: emptyImage, mask: null, preview: emptyImage, isVisible: true, opacity: 1, blendMode: 'source-over', filterState: JSON.parse(JSON.stringify(DEFAULT_FILTERS)), transform: { x: 0, y: 0, scale: 1, rotate: 0 } };
          const newLayers = [...imageState.layers, newLayer];
          pushToHistory(newLayers);
          setImageState(prev => ({...prev, layers: newLayers, activeLayerId: newLayer.id}));
          showToast("空レイヤーを追加しました");
          setActiveMode(ToolMode.NONE);
      };
  };

  const handleImportImageLayer = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]; if (!file || !imageState.original) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
          const newImgSrc = evt.target?.result as string; if (!newImgSrc) return;
          const newLayer: Layer = { id: `layer-img-${Date.now()}`, name: '追加画像', type: 'image', image: newImgSrc, mask: null, preview: newImgSrc, isVisible: true, opacity: 1, blendMode: 'source-over', filterState: JSON.parse(JSON.stringify(DEFAULT_FILTERS)), transform: { x: 0, y: 0, scale: 0.5, rotate: 0 } };
          const newLayers = [...imageState.layers, newLayer];
          pushToHistory(newLayers);
          setImageState(prev => ({...prev, layers: newLayers, activeLayerId: newLayer.id}));
          showToast("画像を追加しました");
          setActiveMode(ToolMode.MOVE);
          e.target.value = '';
      };
      reader.readAsDataURL(file);
  };

  const handleAddAiLayer = async (target: MaskTarget) => {
      if (!imageState.original) return;
      setIsLoading(true);
      setShowAiLayerMenu(false);
      try {
          const maskRaw = await generateAIMask(imageState.original, target);
          const maskImg = new Image(); maskImg.src = maskRaw; await new Promise((resolve) => { maskImg.onload = resolve; });
          const cvs = document.createElement('canvas'); cvs.width = maskImg.width; cvs.height = maskImg.height;
          const ctx = cvs.getContext('2d'); if (!ctx) throw new Error("Context error");
          ctx.drawImage(maskImg, 0, 0);
          const imageData = ctx.getImageData(0, 0, cvs.width, cvs.height);
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
              const brightness = (data[i] + data[i+1] + data[i+2]) / 3;
              const alpha = brightness > 128 ? 255 : 0;
              data[i] = 255; data[i+1] = 255; data[i+2] = 255; data[i+3] = alpha;
          }
          ctx.putImageData(imageData, 0, 0);
          const processedMask = cvs.toDataURL('image/png');
          const newLayer: Layer = { id: `layer-${Date.now()}`, name: `${target === 'person' ? '人物 (背景削除)' : target === 'hair' ? '髪' : target === 'face_only' ? '顔' : target === 'skin' ? '肌' : target === 'clothes' ? '衣装' : target === 'background' ? '背景' : 'レイヤー'}`, type: 'image', image: imageState.original, mask: processedMask, preview: imageState.original, isVisible: true, opacity: 1, blendMode: 'source-over', filterState: JSON.parse(JSON.stringify(DEFAULT_FILTERS)), transform: { x: 0, y: 0, scale: 1, rotate: 0 } };
          const newLayers = [...imageState.layers, newLayer];
          pushToHistory(newLayers);
          setImageState(prev => ({ ...prev, layers: newLayers, activeLayerId: newLayer.id }));
      } catch (e) { showToast("AIレイヤー作成に失敗しました", "error"); } finally { setIsLoading(false); }
  };

  const handleToggleVisibility = (layerId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const newLayers = imageState.layers.map(l => l.id === layerId ? { ...l, isVisible: !l.isVisible } : l);
      setImageState(prev => ({ ...prev, layers: newLayers }));
  };

  const handleSelectLayer = async (layerId: string) => {
      if (layerId === imageState.activeLayerId) return;
      if (activeLayer) {
          const baked = await bakeLayerFilters(activeLayer);
          const layersWithBake = imageState.layers.map(l => l.id === activeLayer.id ? { ...l, preview: baked } : l);
          setImageState(prev => ({ ...prev, layers: layersWithBake, activeLayerId: layerId }));
      } else { setImageState(prev => ({ ...prev, activeLayerId: layerId })); }
  };

  const handleDeleteLayer = (layerId: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setConfirmDialog({ message: "このレイヤーを削除しますか？", onConfirm: () => {
              setImageState(prev => {
                  if (prev.layers.length <= 1) return prev;
                  const newLayers = prev.layers.filter(l => l.id !== layerId);
                  if (newLayers.length === 0) return prev;
                  let newActiveId = prev.activeLayerId;
                  if (prev.activeLayerId === layerId) newActiveId = newLayers[newLayers.length - 1].id;
                  const newHistory = prev.history.slice(0, prev.historyIndex + 1);
                  newHistory.push(newLayers);
                  return { ...prev, layers: newLayers, activeLayerId: newActiveId, history: newHistory, historyIndex: newHistory.length - 1 };
              });
              setConfirmDialog(null);
              showToast("レイヤーを削除しました");
          }
      });
  };

  const applyFiltersComplete = async () => {
      if (activeLayer) {
          const baked = await bakeLayerFilters(activeLayer);
          const newLayers = imageState.layers.map(l => l.id === activeLayer.id ? { ...l, preview: baked } : l);
          pushToHistory(newLayers);
          setActiveMode(ToolMode.NONE);
      }
  };

  const handleMaskSave = (newMask: string | null) => {
      if (!activeLayer) return;
      const newLayers = imageState.layers.map(l => l.id === activeLayer.id ? { ...l, mask: newMask } : l);
      pushToHistory(newLayers);
      setActiveMode(ToolMode.NONE);
  };

  const handleImageUpdate = (newImage: string) => {
      if (!activeLayer) return;
      const newLayers = imageState.layers.map(l => l.id === activeLayer.id ? { ...l, image: newImage, preview: newImage } : l);
      pushToHistory(newLayers);
      setActiveMode(ToolMode.NONE);
  };
  
  const handleBeautyAI = async (type: 'skin' | 'face' | 'makeup' | 'body' | 'contour' | 'skin_high') => {
      if (!activeLayer) return;
      setIsLoading(true);
      const prompts = {
          skin: "Professional beauty retouching. Smooth skin texture, reduce blemishes, even out skin tone, but keep natural pores. Maintain facial features and identity exactly.",
          face: "Face beauty enhancement. Slightly refine jawline and brighten eyes. Make it look like a professional portrait. Subtle and natural. Do not change the person's identity.",
          makeup: "Apply natural cosplay makeup. Eyeliner, subtle blush, lipstick, enhance eyelashes. Make the character look more vibrant but keep the original face structure.",
          body: "Full body beauty retouch. Improve body proportions slightly, lengthen legs, slim waist. Maintain the original character identity.",
          contour: "Apply professional dodge and burn techniques. Enhance facial structure, add depth to lighting, highlight cheekbones and nose bridge, deepen shadows under jaw. Keep texture natural.",
          skin_high: "Apply high-end frequency separation retouching. Smooth skin tone while retaining skin texture and pores. Remove blemishes. Keep hair and eyes sharp."
      };
      try {
          const newImage = await editImageWithAI(activeLayer.image, prompts[type]);
          const newLayers = imageState.layers.map(l => l.id === activeLayer.id ? { ...l, image: newImage, preview: newImage } : l);
          pushToHistory(newLayers);
          showToast("AI美化が完了しました");
      } catch (error) { showToast("AI処理に失敗しました。", "error"); } finally { setIsLoading(false); }
  };

  const handleAIEdit = async () => {
    if (!activeLayer || !aiPrompt.trim()) return;
    setIsLoading(true);
    try {
      const newImage = await editImageWithAI(activeLayer.image, aiPrompt);
      const newLayers = imageState.layers.map(l => l.id === activeLayer.id ? { ...l, image: newImage, preview: newImage } : l);
      pushToHistory(newLayers);
      setActiveMode(ToolMode.NONE);
      showToast("AI編集が完了しました");
    } catch (error) { showToast("AI編集に失敗しました。", "error"); } finally { setIsLoading(false); }
  };
  
  const handleCameraCapture = (imageSrc: string) => { initializeImage(imageSrc); setActiveMode(ToolMode.NONE); };

  const handleStartSavePreset = () => { setIsNamingPreset(true); setNewPresetName(''); };
  const handleConfirmSavePreset = () => {
      if (!newPresetName.trim() || !activeLayer) { setIsNamingPreset(false); return; }
      const newPreset: Preset = { id: Date.now().toString(), name: newPresetName.trim(), filterState: JSON.parse(JSON.stringify(activeLayer.filterState)) };
      setPresets([...presets, newPreset]);
      setIsNamingPreset(false);
      showToast("プリセットを保存しました");
  };
  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (id.startsWith('fp-')) { showToast("公式プリセットは削除できません", "error"); return; }
      setConfirmDialog({ message: "プリセットを削除しますか？", onConfirm: () => { setPresets(presets.filter(p => p.id !== id)); setConfirmDialog(null); showToast("削除しました"); } });
  };
  const handleDownloadPreset = (preset: Preset, e: React.MouseEvent) => {
      e.stopPropagation();
      const blob = new Blob([JSON.stringify(preset)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `${preset.name}.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };
  const handleImportPreset = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => { try { const p = JSON.parse(evt.target?.result as string); if (p.filterState) { setPresets([...presets, { ...p, id: Date.now().toString() }]); showToast("読み込み完了"); } } catch(e) { showToast("エラー", "error"); } };
      reader.readAsText(file); e.target.value = '';
  };
  const handleSavePrompt = () => { if(!aiPrompt.trim()) return; if(savedPrompts.some(p=>p.text===aiPrompt.trim())) {showToast("保存済み", "error"); return;} setSavedPrompts([{id:Date.now().toString(), text: aiPrompt.trim(), timestamp: Date.now()}, ...savedPrompts]); showToast("プロンプトを保存しました"); };
  const handleDeletePrompt = (id: string, e?: React.MouseEvent) => { if(e) e.stopPropagation(); setSavedPrompts(savedPrompts.filter(p=>p.id!==id)); };
  const handleDownloadPrompts = () => { if(savedPrompts.length===0)return; const blob = new Blob([JSON.stringify(savedPrompts, null, 2)], {type:"application/json"}); const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`prompts.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); };
  const handleImportPrompts = (e: React.ChangeEvent<HTMLInputElement>) => { const file=e.target.files?.[0]; if(!file)return; const r=new FileReader(); r.onload=(ev)=>{ try{ const d=JSON.parse(ev.target?.result as string); if(Array.isArray(d)){ setSavedPrompts(d); showToast("完了"); } }catch(e){showToast("エラー", "error");} }; r.readAsText(file); e.target.value=''; };

  const handleDownload = async () => {
    if (!imageState.original) return;
    setIsLoading(true);
    const canvas = document.createElement('canvas');
    const img = new Image(); img.src = imageState.original;
    await new Promise(r => img.onload = r);
    canvas.width = img.width; canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        for (const layer of imageState.layers) {
            if (!layer.isVisible) continue;
            const lImg = new Image(); 
            lImg.src = layer.preview || layer.image;
            lImg.crossOrigin = 'anonymous';
            await new Promise(r => lImg.onload = r);
            
            ctx.save();
            const lt = layer.transform || { x: 0, y: 0, scale: 1, rotate: 0 };
            const isBg = layer.id === imageState.layers[0].id;
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;

            if (!isBg) {
                ctx.translate(cx + lt.x, cy + lt.y);
                ctx.rotate((lt.rotate * Math.PI) / 180);
                ctx.scale(lt.scale, lt.scale);
                ctx.drawImage(lImg, -lImg.width / 2, -lImg.height / 2);
            } else {
                ctx.translate(cx + lt.x, cy + lt.y);
                ctx.rotate((lt.rotate * Math.PI) / 180);
                ctx.scale(lt.scale, lt.scale);
                ctx.drawImage(lImg, -lImg.width/2, -lImg.height/2);
            }
            ctx.restore();
        }
        const link = document.createElement('a');
        link.download = `cosplay-edit-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png', 0.9);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    setIsLoading(false);
  };

  if (activeMode === ToolMode.CAMERA) return <Camera onCapture={handleCameraCapture} onClose={() => setActiveMode(ToolMode.NONE)} />;
  if (activeMode === ToolMode.LIQUIFY && activeLayer) return <LiquifyEditor imageSrc={activeLayer.image} onApply={handleImageUpdate} onCancel={() => setActiveMode(ToolMode.BEAUTY)} />;
  if (activeMode === ToolMode.MAKEUP && activeLayer) return <MakeupEditor imageSrc={activeLayer.image} onApply={handleImageUpdate} onCancel={() => setActiveMode(ToolMode.BEAUTY)} />;
  if (activeMode === ToolMode.MASK && activeLayer) return <MaskEditor imageSrc={activeLayer.image} initialMask={activeLayer.mask} onSave={handleMaskSave} onCancel={() => setActiveMode(ToolMode.NONE)} />;
  if (activeMode === ToolMode.MEISHI && imageState.original) return <MeishiEditor imageSrc={imageState.original} initialState={meishiState} onChange={setMeishiState} onClose={() => setActiveMode(ToolMode.NONE)} onEditImage={() => setActiveMode(ToolMode.ADJUST)} />;
  if (activeMode === ToolMode.CROP && imageState.original) return <CropEditor imageSrc={imageState.original} onApply={(src) => { initializeImage(src); }} onCancel={() => setActiveMode(ToolMode.NONE)} />;

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden select-none font-sans">
        <div className="absolute inset-0 z-0" onClick={() => !imageState.original && fileInputRef.current?.click()}>
            <CanvasArea 
                layers={imageState.layers} 
                activeLayerId={activeLayerId} 
                activeFilters={activeLayer ? activeLayer.filterState : DEFAULT_FILTERS}
                isComparing={isComparing}
                activeMode={activeMode}
                onLayerTransform={handleLayerTransform}
                onDoubleTap={handleCanvasDoubleTap}
            />
        </div>

        <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
        <input type="file" accept="image/*" ref={layerImageInputRef} className="hidden" onChange={handleImportImageLayer} />
        <input type="file" accept=".json" ref={presetImportInputRef} className="hidden" onChange={handleImportPreset} />
        <input type="file" accept=".json" ref={promptImportInputRef} className="hidden" onChange={handleImportPrompts} />

        {toast && (
            <div className={`fixed top-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full shadow-lg z-[100] text-sm font-bold text-white animate-fade-in ${toast.type === 'error' ? 'bg-red-500' : 'bg-cos-accent'}`}>
                {toast.message}
            </div>
        )}
        {confirmDialog && (
            <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm w-full animate-slide-up">
                    <p className="text-white mb-6 text-center">{confirmDialog.message}</p>
                    <div className="flex gap-3 justify-center">
                        <Button variant="secondary" onClick={() => setConfirmDialog(null)}>キャンセル</Button>
                        <Button variant="primary" onClick={confirmDialog.onConfirm}>OK</Button>
                    </div>
                </div>
            </div>
        )}

        <header className="absolute top-0 left-0 right-0 h-16 px-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent z-40 pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-3">
                <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition-colors">
                    <IconImage className="w-5 h-5" />
                </button>
                {activeMode === ToolMode.SETTINGS && (
                    <div className="absolute top-16 left-4 bg-zinc-900 p-4 rounded-xl border border-white/10 shadow-xl w-64 animate-slide-up pointer-events-auto">
                        <h3 className="text-xs font-bold text-white/50 uppercase mb-4">App Info</h3>
                        <p className="text-white text-sm mb-1">Version: {APP_VERSION}</p>
                        <p className="text-white/50 text-xs mb-4">Build: {APP_BUILD}</p>
                        <Button variant="secondary" fullWidth onClick={() => setActiveMode(ToolMode.NONE)}>閉じる</Button>
                    </div>
                )}
            </div>

            <div className="pointer-events-auto flex gap-2">
                <div className="flex mr-2 bg-white/10 backdrop-blur rounded-full">
                    <button onClick={handleUndo} disabled={imageState.historyIndex <= 0} className="p-2.5 text-white/70 hover:text-white disabled:opacity-30">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"/></svg>
                    </button>
                    <div className="w-px bg-white/10 my-2"></div>
                    <button onClick={handleRedo} disabled={imageState.historyIndex >= imageState.history.length - 1} className="p-2.5 text-white/70 hover:text-white disabled:opacity-30">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3"/></svg>
                    </button>
                </div>
                <button 
                    className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors active:scale-95"
                    onPointerDown={() => setIsComparing(true)}
                    onPointerUp={() => setIsComparing(false)}
                    onPointerLeave={() => setIsComparing(false)}
                >
                    <IconEye className="w-5 h-5" />
                </button>
                <Button variant="primary" onClick={handleDownload} disabled={!imageState.original} className="!py-2 !px-5 !rounded-full text-xs">
                    保存
                </Button>
            </div>
        </header>

        <div className="absolute bottom-0 left-0 right-0 z-50 flex flex-col justify-end pointer-events-none">
            {activeMode === ToolMode.ADJUST && activeLayer && (
                <div className="pointer-events-auto bg-zinc-900/95 backdrop-blur-xl border-t border-white/10 pt-2 pb-safe rounded-t-3xl animate-slide-up shadow-2xl">
                    <div className="flex justify-between items-center px-4 pb-2 border-b border-white/5">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white/80 uppercase tracking-wider">調整: {activeLayer.name}</span>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleResetAdjustments} className="text-xs font-bold bg-white/10 text-white/70 px-3 py-1 rounded-full">リセット</button>
                            <button onClick={applyFiltersComplete} className="text-xs font-bold bg-cos-accent text-white px-3 py-1 rounded-full">完了</button>
                        </div>
                    </div>
                    
                    <div className="w-full flex justify-center py-2 bg-black/20">
                        <Histogram imageSrc={activeLayer.preview} width={200} height={40} />
                    </div>

                    <div className="min-h-[100px] flex flex-col justify-center px-6 py-4 relative">
                        {activeToolId === 'presets' && (
                            <div className="w-full flex flex-col gap-3 h-[180px]">
                                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                    {!isNamingPreset ? (
                                        <>
                                            <button onClick={handleStartSavePreset} className="flex items-center gap-2 px-3 py-2 bg-cos-accent rounded-lg text-white text-xs font-bold whitespace-nowrap">
                                                <IconStar className="w-4 h-4" /> 保存
                                            </button>
                                            <button onClick={() => presetImportInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-lg text-white text-xs whitespace-nowrap">
                                                <IconImport className="w-4 h-4" /> 読込
                                            </button>
                                        </>
                                    ) : (
                                        <div className="flex items-center gap-2 w-full animate-fade-in">
                                            <input type="text" value={newPresetName} onChange={e => setNewPresetName(e.target.value)} placeholder="名前..." className="flex-1 bg-white/10 text-white text-xs p-2 rounded-lg border border-white/20" autoFocus />
                                            <button onClick={handleConfirmSavePreset} className="p-2 bg-cos-accent rounded-lg text-white"><IconCheck className="w-4 h-4"/></button>
                                            <button onClick={() => setIsNamingPreset(false)} className="p-2 bg-white/10 rounded-lg text-white/60">X</button>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pr-2">
                                    {presets.map(p => (
                                        <div key={p.id} className="flex items-center justify-between bg-white/5 p-2.5 rounded-lg border border-white/5 hover:border-white/20 group">
                                            <button onClick={() => updateActiveLayerFilters(p.filterState)} className="flex-1 text-left text-sm font-medium text-white hover:text-cos-accent truncate">
                                                {p.name}
                                            </button>
                                            <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100">
                                                <button onClick={(e) => handleDownloadPreset(p, e)} className="p-1.5 hover:bg-white/10 rounded text-white"><IconDownload className="w-4 h-4"/></button>
                                                <button onClick={(e) => handleDeletePreset(p.id, e)} className="p-1.5 hover:bg-red-500/20 rounded text-red-400"><IconTrash className="w-4 h-4"/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeToolId === 'curves' && (
                            <div className="h-[180px] w-full flex gap-4">
                                <div className="flex flex-col justify-between py-2">
                                    {['master', 'red', 'green', 'blue'].map((c: any) => (
                                        <button key={c} onClick={() => setActiveCurveChannel(c)} 
                                            className={`w-6 h-6 rounded-full border-2 ${activeCurveChannel === c ? 'border-white scale-110' : 'border-transparent opacity-50'}`}
                                            style={{ backgroundColor: c === 'master' ? '#fff' : c === 'red' ? '#ef4444' : c === 'green' ? '#22c55e' : '#3b82f6' }}
                                        />
                                    ))}
                                </div>
                                <div className="flex-1 h-full">
                                    <CurveEditor 
                                        points={activeLayer.filterState.curves[activeCurveChannel]} 
                                        onChange={(pts) => updateActiveLayerFilters(prev => ({ ...prev, curves: { ...prev.curves, [activeCurveChannel]: pts } }))}
                                        color={activeCurveChannel === 'master' ? '#fff' : activeCurveChannel === 'red' ? '#ef4444' : activeCurveChannel === 'green' ? '#22c55e' : '#3b82f6'}
                                    />
                                </div>
                            </div>
                        )}

                        {activeToolId === 'selective' && (
                            <div className="space-y-4 w-full">
                                <div className="flex justify-center gap-3">
                                    {['reds', 'yellows', 'greens', 'cyans', 'blues', 'magentas'].map((c: any) => (
                                        <button key={c} onClick={() => setActiveSelectiveColor(c)}
                                            className={`w-8 h-8 rounded-full border-2 transition-all ${activeSelectiveColor === c ? 'border-white ring-2 ring-white/20 scale-110' : 'border-transparent opacity-50'}`}
                                            style={{ backgroundColor: c === 'reds' ? '#ef4444' : c === 'yellows' ? '#eab308' : c === 'greens' ? '#22c55e' : c === 'cyans' ? '#06b6d4' : c === 'blues' ? '#3b82f6' : '#d946ef' }}
                                        />
                                    ))}
                                </div>
                                <div className="space-y-3 px-2">
                                    <Slider label="色相" value={activeLayer.filterState.selective[activeSelectiveColor].hue} min={-100} max={100} 
                                        onChange={v => updateActiveLayerFilters(p => ({ ...p, selective: { ...p.selective, [activeSelectiveColor]: { ...p.selective[activeSelectiveColor], hue: v } } }))} />
                                    <Slider label="彩度" value={activeLayer.filterState.selective[activeSelectiveColor].saturation} min={-100} max={100} 
                                        onChange={v => updateActiveLayerFilters(p => ({ ...p, selective: { ...p.selective, [activeSelectiveColor]: { ...p.selective[activeSelectiveColor], saturation: v } } }))} />
                                    <Slider label="輝度" value={activeLayer.filterState.selective[activeSelectiveColor].lightness} min={-100} max={100} 
                                        onChange={v => updateActiveLayerFilters(p => ({ ...p, selective: { ...p.selective, [activeSelectiveColor]: { ...p.selective[activeSelectiveColor], lightness: v } } }))} />
                                </div>
                            </div>
                        )}

                        {activeToolDef && activeToolDef.min !== undefined && (
                            <div className="w-full max-w-md mx-auto space-y-4 animate-fade-in">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-xs text-white/50 flex gap-2 items-center">
                                        {activeToolDef.icon}
                                        <span className="uppercase font-bold">{activeToolDef.label}</span>
                                    </div>
                                    <button onClick={() => updateActiveLayerFilters(prev => ({ ...prev, [activeToolId]: 0 }))} className="text-[10px] bg-white/10 px-2 py-1 rounded text-white/50 hover:text-white">
                                        Reset
                                    </button>
                                </div>
                                <Slider 
                                    value={activeLayer.filterState[activeToolId] as number} 
                                    min={activeToolDef.min} 
                                    max={activeToolDef.max} 
                                    step={activeToolDef.step}
                                    unit={activeToolDef.unit}
                                    onChange={v => updateActiveLayerFilters(prev => ({ ...prev, [activeToolId]: v }))}
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex overflow-x-auto gap-2 px-4 py-4 no-scrollbar bg-black/40">
                        {TOOLS.map(tool => {
                            const isActive = activeToolId === tool.id;
                            return (
                                <button key={tool.id} onClick={() => setActiveToolId(tool.id)} className={`relative group flex flex-col items-center justify-center min-w-[64px] gap-1.5 transition-all ${isActive ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}>
                                    <div className={`p-2.5 rounded-xl transition-all ${isActive ? 'bg-cos-accent text-white shadow-lg scale-110' : 'bg-white/5 text-white'}`}>
                                        {React.cloneElement(tool.icon as React.ReactElement<{ className?: string }>, { className: "w-5 h-5" })}
                                    </div>
                                    <span className={`text-[10px] whitespace-nowrap ${isActive ? 'text-white font-bold' : 'text-white/50'}`}>{tool.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {activeMode === ToolMode.TEXT && (
                <div className="pointer-events-auto bg-zinc-900/95 backdrop-blur-xl border-t border-white/10 p-4 pb-safe rounded-t-3xl animate-slide-up">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-white font-bold text-sm flex items-center gap-2"><IconText className="w-5 h-5 text-cos-accent"/> テキスト入力</h3>
                        <div className="flex gap-2">
                            <button onClick={() => setActiveMode(ToolMode.NONE)} className="px-3 py-1 text-xs text-white/50">キャンセル</button>
                            <Button variant="primary" onClick={handleAddText} className="!py-1 !px-4">決定</Button>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <textarea 
                            value={textInput} 
                            onChange={e => setTextInput(e.target.value)} 
                            placeholder="ここに文字を入力..." 
                            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-cos-accent focus:outline-none min-h-[80px]"
                        />
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                            <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-10 h-10 rounded-lg bg-transparent border border-white/20 p-0 shrink-0"/>
                            <select value={textFont} onChange={e => setTextFont(e.target.value)} className="bg-white/10 text-white text-xs rounded-lg px-2 py-1 border-none focus:ring-0">
                                {TEXT_TOOL_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                                {customFonts.map(f => <option key={f.name} value={f.family}>{f.name} (Custom)</option>)}
                            </select>
                            <label className="px-3 py-2 bg-white/10 rounded-lg text-white text-xs flex items-center gap-2 cursor-pointer shrink-0">
                                <input type="checkbox" checked={textVertical} onChange={e => setTextVertical(e.target.checked)} className="accent-cos-accent"/> 縦書き
                            </label>
                            <label className="px-3 py-2 bg-white/10 rounded-lg text-white text-xs flex items-center gap-2 cursor-pointer shrink-0">
                                <input type="checkbox" checked={textShadow} onChange={e => setTextShadow(e.target.checked)} className="accent-cos-accent"/> 影
                            </label>
                            <label className="px-3 py-2 bg-white/10 rounded-lg text-white text-xs flex items-center gap-2 cursor-pointer shrink-0">
                                <input type="checkbox" checked={textStroke} onChange={e => setTextStroke(e.target.checked)} className="accent-cos-accent"/> 縁取り
                            </label>
                            <div className="flex bg-white/10 rounded-lg p-1 shrink-0">
                                <button onClick={() => setTextAlign('left')} className={`p-1.5 rounded ${textAlign === 'left' ? 'bg-white/20 text-white' : 'text-white/30'}`}><IconAlignLeft className="w-4 h-4"/></button>
                                <button onClick={() => setTextAlign('center')} className={`p-1.5 rounded ${textAlign === 'center' ? 'bg-white/20 text-white' : 'text-white/30'}`}><IconAlignCenter className="w-4 h-4"/></button>
                                <button onClick={() => setTextAlign('right')} className={`p-1.5 rounded ${textAlign === 'right' ? 'bg-white/20 text-white' : 'text-white/30'}`}><IconAlignRight className="w-4 h-4"/></button>
                            </div>
                            <label className="px-3 py-2 bg-cos-accent/20 hover:bg-cos-accent/40 text-cos-accent rounded-lg text-xs flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 transition-colors">
                                <span>+</span> フォント
                                <input type="file" accept=".ttf,.otf,.woff,.woff2" className="hidden" onChange={handleFontUpload} />
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {activeMode === ToolMode.DECORATION && (
                <div className="pointer-events-auto bg-zinc-900/95 backdrop-blur-xl border-t border-white/10 p-4 pb-safe rounded-t-3xl animate-slide-up h-[300px] flex flex-col">
                    <div className="flex justify-between items-center mb-4 shrink-0">
                        <h3 className="text-white font-bold text-sm flex items-center gap-2"><IconSparkles className="w-5 h-5 text-cos-accent"/> エフェクト (50種)</h3>
                        <button onClick={() => setActiveMode(ToolMode.NONE)} className="px-3 py-1 text-xs text-white/50">閉じる</button>
                    </div>
                    <div className="flex gap-4 mb-4 overflow-x-auto no-scrollbar shrink-0 border-b border-white/10 pb-1">
                        {EFFECTS_DATA.map(cat => (
                            <button key={cat.id} onClick={() => setActiveEffectCategory(cat.id)} className={`pb-2 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${activeEffectCategory === cat.id ? 'text-cos-accent border-cos-accent' : 'text-white/50 border-transparent'}`}>
                                {cat.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-2">
                        {EFFECTS_DATA.find(c => c.id === activeEffectCategory)?.items.map(item => (
                            <button key={item} onClick={() => handleAddDecoration(item)} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 hover:border-cos-accent transition-all text-left group">
                                <div className="text-[10px] font-bold text-white group-hover:text-cos-accent truncate capitalize">{item.replace('_', ' ')}</div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {activeMode === ToolMode.MOVE && activeLayer && (
                <div className="pointer-events-auto bg-zinc-900/95 backdrop-blur-xl border-t border-white/10 p-4 pb-safe rounded-t-3xl animate-slide-up">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex flex-col">
                            <h3 className="text-white font-bold text-sm flex items-center gap-2"><IconMove className="w-5 h-5 text-cos-accent"/> 移動・変形</h3>
                            <span className="text-[10px] text-white/50">ドラッグで移動、ピンチで拡大・回転</span>
                        </div>
                        <button onClick={() => setActiveMode(ToolMode.NONE)} className="px-3 py-1 bg-cos-accent text-white text-xs font-bold rounded-full">完了</button>
                    </div>
                    
                    {activeLayer.textConfig && (
                        <Button variant="secondary" fullWidth onClick={() => setActiveMode(ToolMode.TEXT)} className="mb-4 text-xs !py-2">
                            テキストを編集 (文字・色)
                        </Button>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <Slider 
                            label="拡大縮小" 
                            value={activeLayer.transform?.scale || 1} 
                            min={0.1} max={5} step={0.1} 
                            onChange={v => handleLayerTransform({...activeLayer.transform || {x:0,y:0,scale:1,rotate:0}, scale: v})}
                        />
                        <Slider 
                            label="回転" 
                            value={activeLayer.transform?.rotate || 0} 
                            min={-180} max={180} 
                            onChange={v => handleLayerTransform({...activeLayer.transform || {x:0,y:0,scale:1,rotate:0}, rotate: v})}
                            unit="°"
                        />
                    </div>
                </div>
            )}

            {activeMode === ToolMode.LAYERS && (
                <div className="pointer-events-auto bg-zinc-900/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl animate-slide-up flex flex-col max-h-[60vh] shadow-2xl">
                    <div className="flex justify-between items-center p-4 border-b border-white/5">
                        <h3 className="font-bold text-white text-sm flex items-center gap-2"><IconLayers className="w-5 h-5 text-cos-accent"/> レイヤー ({imageState.layers.length})</h3>
                        <div className="flex gap-2">
                            <button onClick={() => setShowAiLayerMenu(!showAiLayerMenu)} className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1">
                                <IconPlusSquare className="w-4 h-4"/> AI追加
                            </button>
                            <button onClick={handleAddEmptyLayer} className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-full">空レイヤー</button>
                            <button onClick={() => layerImageInputRef.current?.click()} className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-full">画像追加</button>
                            <button onClick={() => setActiveMode(ToolMode.NONE)} className="p-1.5 text-white/50"><IconX className="w-5 h-5"/></button>
                        </div>
                    </div>
                    
                    {showAiLayerMenu && (
                        <div className="bg-slate-800 border-b border-white/10 p-2 grid grid-cols-2 gap-2 animate-fade-in">
                            {[
                                {id:'person', l:'人物 (背景削除)'}, {id:'hair', l:'髪'}, {id:'face_only', l:'顔'}, 
                                {id:'skin', l:'肌'}, {id:'clothes', l:'衣装'}, {id:'background', l:'背景'}
                            ].map(i => (
                                <button key={i.id} onClick={() => handleAddAiLayer(i.id as MaskTarget)} className="text-left px-3 py-2 rounded bg-white/5 text-xs text-white hover:bg-cos-accent">
                                    + {i.l}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="overflow-y-auto p-4 space-y-2 min-h-[200px]">
                        {[...imageState.layers].reverse().map((layer) => {
                            const isActive = layer.id === activeLayerId;
                            return (
                                <div key={layer.id} onClick={() => handleSelectLayer(layer.id)} className={`flex flex-col rounded-xl border transition-all cursor-pointer overflow-hidden ${isActive ? 'bg-cos-accent/10 border-cos-accent/50 ring-1 ring-cos-accent/30' : 'bg-white/5 border-transparent hover:bg-white/10'}`}>
                                    <div className="flex items-center gap-3 p-2">
                                        <button onClick={(e) => handleToggleVisibility(layer.id, e)} className={`p-2 rounded-lg ${layer.isVisible ? 'text-white' : 'text-white/20'}`}>
                                            <IconEye className="w-4 h-4"/>
                                        </button>
                                        <div className="w-10 h-10 rounded bg-black/50 border border-white/10 overflow-hidden shrink-0 relative">
                                            <img src={layer.preview} className="w-full h-full object-cover opacity-70" alt=""/>
                                            {layer.mask && <img src={layer.mask} className="absolute inset-0 w-full h-full object-cover mix-blend-lighten opacity-50" alt="mask"/>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-white truncate">{layer.name}</div>
                                            <div className="text-[10px] text-white/50">{layer.blendMode} • {Math.round(layer.opacity*100)}%</div>
                                        </div>
                                    </div>
                                    {isActive && (
                                        <div className="grid grid-cols-4 gap-1 px-2 pb-2 border-t border-white/5 pt-2 bg-black/20">
                                            <button onClick={(e)=>{e.stopPropagation(); setActiveMode(ToolMode.ADJUST)}} className="py-1.5 bg-cos-accent text-white text-[10px] font-bold rounded flex items-center justify-center gap-1"><IconAdjust className="w-3 h-3"/> 調整</button>
                                            <button onClick={(e)=>{e.stopPropagation(); setActiveMode(ToolMode.MASK)}} className="py-1.5 bg-white/10 text-white text-[10px] rounded flex items-center justify-center gap-1"><IconMask className="w-3 h-3"/> マスク</button>
                                            <button onClick={(e)=>{e.stopPropagation(); setActiveMode(ToolMode.MOVE)}} className="py-1.5 bg-white/10 text-white text-[10px] rounded flex items-center justify-center gap-1"><IconMove className="w-3 h-3"/> 変形</button>
                                            <button onClick={(e)=>handleDeleteLayer(layer.id, e)} className="py-1.5 bg-white/5 text-red-400 text-[10px] rounded flex items-center justify-center gap-1" disabled={imageState.layers.length<=1}><IconTrash className="w-3 h-3"/> 削除</button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {activeMode === ToolMode.BEAUTY && activeLayer && (
                <div className="pointer-events-auto bg-zinc-900/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl animate-slide-up shadow-2xl pb-safe">
                    <div className="flex justify-between items-center p-5 border-b border-white/5">
                        <h3 className="font-bold text-white text-sm flex items-center gap-2"><IconBeauty className="w-5 h-5 text-cos-accent"/> ビューティー加工</h3>
                        <button onClick={() => setActiveMode(ToolMode.NONE)} className="p-2 text-white/50"><IconX className="w-5 h-5"/></button>
                    </div>
                    <div className="p-6 space-y-8">
                        <div>
                            <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4 ml-1">AI ワンタップ美化</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <button onClick={() => handleBeautyAI('skin')} className="flex flex-col items-center gap-2 group"><div className="w-14 h-14 rounded-2xl bg-white/5 group-hover:bg-cos-accent flex items-center justify-center transition-all border border-white/5"><IconSkin className="w-6 h-6 text-white/70 group-hover:text-white"/></div><span className="text-[10px] font-bold text-white/60">美肌</span></button>
                                <button onClick={() => handleBeautyAI('face')} className="flex flex-col items-center gap-2 group"><div className="w-14 h-14 rounded-2xl bg-white/5 group-hover:bg-cos-accent flex items-center justify-center transition-all border border-white/5"><IconFace className="w-6 h-6 text-white/70 group-hover:text-white"/></div><span className="text-[10px] font-bold text-white/60">小顔</span></button>
                                <button onClick={() => handleBeautyAI('makeup')} className="flex flex-col items-center gap-2 group"><div className="w-14 h-14 rounded-2xl bg-white/5 group-hover:bg-cos-accent flex items-center justify-center transition-all border border-white/5"><IconBeauty className="w-6 h-6 text-white/70 group-hover:text-white"/></div><span className="text-[10px] font-bold text-white/60">メイク</span></button>
                                <button onClick={() => handleBeautyAI('body')} className="flex flex-col items-center gap-2 group"><div className="w-14 h-14 rounded-2xl bg-white/5 group-hover:bg-cos-accent flex items-center justify-center transition-all border border-white/5"><IconBeauty className="w-6 h-6 text-white/70 group-hover:text-white"/></div><span className="text-[10px] font-bold text-white/60">スタイル</span></button>
                                <button onClick={() => handleBeautyAI('contour')} className="flex flex-col items-center gap-2 group"><div className="w-14 h-14 rounded-2xl bg-white/5 group-hover:bg-cos-accent flex items-center justify-center transition-all border border-white/5"><IconBeauty className="w-6 h-6 text-white/70 group-hover:text-white"/></div><span className="text-[10px] font-bold text-white/60">立体感</span></button>
                                <button onClick={() => handleBeautyAI('skin_high')} className="flex flex-col items-center gap-2 group"><div className="w-14 h-14 rounded-2xl bg-white/5 group-hover:bg-cos-accent flex items-center justify-center transition-all border border-white/5"><IconSkin className="w-6 h-6 text-white/70 group-hover:text-white"/></div><span className="text-[10px] font-bold text-white/60">高画質美肌</span></button>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4 ml-1">手動レタッチ</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <button onClick={() => setActiveMode(ToolMode.LIQUIFY)} className="flex flex-col items-center gap-2 group"><div className="w-14 h-14 rounded-2xl bg-white/5 group-hover:bg-blue-600 flex items-center justify-center transition-all border border-white/5"><IconMove className="w-6 h-6 text-white/70 group-hover:text-white"/></div><span className="text-[10px] font-bold text-white/60">ゆがみ</span></button>
                                <button onClick={() => setActiveMode(ToolMode.MAKEUP)} className="flex flex-col items-center gap-2 group"><div className="w-14 h-14 rounded-2xl bg-white/5 group-hover:bg-pink-600 flex items-center justify-center transition-all border border-white/5"><IconBeauty className="w-6 h-6 text-white/70 group-hover:text-white"/></div><span className="text-[10px] font-bold text-white/60">手動メイク</span></button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeMode === ToolMode.AI_EDIT && (
                <div className="pointer-events-auto bg-zinc-900/95 backdrop-blur-xl border-t border-white/10 p-5 pb-safe rounded-t-3xl animate-slide-up">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-white text-sm flex items-center gap-2"><IconMagic className="w-5 h-5 text-cos-accent"/> AI 編集 (生成・変換)</h3>
                        <button onClick={() => setActiveMode(ToolMode.NONE)} className="p-2 text-white/50"><IconX className="w-5 h-5"/></button>
                    </div>
                    <div className="flex gap-2 mb-4">
                        <div className="relative flex-1">
                            <input 
                                type="text" 
                                value={aiPrompt} 
                                onChange={e => setAiPrompt(e.target.value)} 
                                placeholder="例: 髪を銀色にして、背景をサイバーパンクに" 
                                className="w-full bg-black/30 border border-white/10 rounded-2xl pl-4 pr-10 py-3 text-sm focus:border-cos-accent text-white placeholder-white/30"
                            />
                            <button onClick={handleSavePrompt} disabled={!aiPrompt.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-white/30 hover:text-cos-accent disabled:opacity-30">
                                <IconStar className="w-5 h-5"/>
                            </button>
                        </div>
                        <Button variant="primary" onClick={handleAIEdit} disabled={isLoading || !aiPrompt} className="!rounded-2xl">
                            {isLoading ? <Spinner/> : '生成'}
                        </Button>
                    </div>
                    
                    <div className="flex gap-4 mb-3 overflow-x-auto no-scrollbar border-b border-white/10 pb-1">
                        <button onClick={() => setActivePromptCategory('saved')} className={`pb-2 text-xs font-bold border-b-2 whitespace-nowrap ${activePromptCategory === 'saved' ? 'text-cos-accent border-cos-accent' : 'text-white/50 border-transparent'}`}>保存済み</button>
                        {PROMPT_CATEGORIES.map(c => (
                            <button key={c.id} onClick={() => setActivePromptCategory(c.id)} className={`pb-2 text-xs font-bold border-b-2 whitespace-nowrap ${activePromptCategory === c.id ? 'text-cos-accent border-cos-accent' : 'text-white/50 border-transparent'}`}>{c.label}</button>
                        ))}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto no-scrollbar">
                        {displayPrompts.map(p => (
                            <div key={p.id} className="flex items-center bg-white/5 hover:bg-white/10 border border-white/5 rounded-full pl-3 pr-1 py-1 transition-colors max-w-full">
                                <button onClick={() => setAiPrompt(p.text)} className="text-xs text-white truncate max-w-[200px] mr-2">{p.text}</button>
                                {activePromptCategory === 'saved' && (
                                    <button onClick={() => handleDeletePrompt(p.id)} className="p-1 text-white/30 hover:text-red-400"><IconTrash className="w-3 h-3"/></button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {imageState.original && activeMode === ToolMode.NONE && (
                <div className="pointer-events-auto bg-gradient-to-t from-black via-black/90 to-transparent pb-safe pt-10 px-6 animate-fade-in">
                    <div className="flex justify-between items-end max-w-lg mx-auto pb-4">
                        <NavButton icon={<IconAdjust/>} label="調整" onClick={() => setActiveMode(ToolMode.ADJUST)} />
                        <NavButton icon={<IconBeauty/>} label="美化" onClick={() => setActiveMode(ToolMode.BEAUTY)} />
                        <NavButton icon={<IconText/>} label="文字" onClick={() => setActiveMode(ToolMode.TEXT)} />
                        <NavButton icon={<IconSparkles/>} label="デコ" onClick={() => setActiveMode(ToolMode.DECORATION)} />
                        <NavButton icon={<IconMove/>} label="移動" onClick={() => setActiveMode(ToolMode.MOVE)} />
                        <NavButton icon={<IconLayers/>} label="レイヤー" onClick={() => setActiveMode(ToolMode.LAYERS)} />
                        
                        <div className="relative group">
                            <button className="flex flex-col items-center justify-center w-16 h-16 rounded-full bg-white text-black border-4 border-black/50 shadow-lg active:scale-95 transition-all mb-6">
                                <span className="text-2xl font-bold">+</span>
                            </button>
                            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-zinc-800 rounded-xl p-2 shadow-2xl border border-white/10 hidden group-hover:flex flex-col gap-2 animate-slide-up w-32">
                                <button onClick={() => setActiveMode(ToolMode.AI_EDIT)} className="flex items-center gap-2 p-2 hover:bg-white/10 rounded text-xs text-white font-bold"><IconMagic className="w-4 h-4"/> AI 編集</button>
                                <button onClick={() => setActiveMode(ToolMode.MEISHI)} className="flex items-center gap-2 p-2 hover:bg-white/10 rounded text-xs text-white font-bold"><IconCard className="w-4 h-4"/> 名刺作成</button>
                                <button onClick={() => setActiveMode(ToolMode.CROP)} className="flex items-center gap-2 p-2 hover:bg-white/10 rounded text-xs text-white font-bold"><IconCrop className="w-4 h-4"/> 切り抜き</button>
                                <button onClick={() => setActiveMode(ToolMode.CAMERA)} className="flex items-center gap-2 p-2 hover:bg-white/10 rounded text-xs text-white font-bold"><IconCamera className="w-4 h-4"/> カメラ</button>
                                <button onClick={() => setActiveMode(ToolMode.SETTINGS)} className="flex items-center gap-2 p-2 hover:bg-white/10 rounded text-xs text-white font-bold"><IconSettings className="w-4 h-4"/> 設定</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {isLoading && (
            <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                <div className="bg-zinc-900 p-8 rounded-3xl shadow-2xl border border-white/10 flex flex-col items-center">
                    <Spinner />
                    <p className="mt-4 text-white font-bold tracking-widest animate-pulse">PROCESSING...</p>
                </div>
            </div>
        )}
    </div>
  );
};

const NavButton = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) => (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 group">
        <div className="p-3 rounded-2xl bg-white/5 text-white/60 group-hover:bg-white/10 group-hover:text-white group-active:bg-cos-accent group-active:text-white transition-all">
            {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-6 h-6" })}
        </div>
        <span className="text-[10px] font-bold text-white/50 group-hover:text-white transition-colors">{label}</span>
    </button>
);

export default App;
