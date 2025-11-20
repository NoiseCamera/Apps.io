

export enum ToolMode {
  NONE = 'NONE',
  AI_EDIT = 'AI_EDIT',
  CAPTION = 'CAPTION',
  ADJUST = 'ADJUST',
  LIQUIFY = 'LIQUIFY',
  MASK = 'MASK',
  LAYERS = 'LAYERS',
  BEAUTY = 'BEAUTY',
  MAKEUP = 'MAKEUP',
  MEISHI = 'MEISHI',
  CAMERA = 'CAMERA'
}

export interface ImageState {
  id: string;
  original: string | null; // The raw base image uploaded
  preview: string | null;  // The full composite for display/history
  layers: Layer[];         // The stack of layers
  activeLayerId: string;   // Currently selected layer
  history: Layer[][];      // History now tracks the state of all layers
  historyIndex: number;
}

export interface Layer {
  id: string;
  name: string;
  type: 'image' | 'adjustment';
  image: string;          // Usually the base image
  mask: string | null;    // The alpha mask (white = visible)
  preview: string;        // The "baked" visual of this layer (image + filters)
  isVisible: boolean;
  opacity: number;
  blendMode: GlobalCompositeOperation;
  filterState: FilterState;
}

export interface AICaptionResult {
  hashtags: string[];
  caption: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface Curves {
  master: Point[];
  red: Point[];
  green: Point[];
  blue: Point[];
}

export interface HSLShift {
  hue: number;        // -180 to 180
  saturation: number; // -100 to 100
  lightness: number;  // -100 to 100
}

export interface FilterState {
  // --- Light ---
  exposure: number;   // -100 to 100 (Simulated stops)
  brightness: number; // -100 to 100
  contrast: number;   // -100 to 100
  highlights: number; // -100 to 100
  shadows: number;    // -100 to 100
  whites: number;     // -100 to 100
  blacks: number;     // -100 to 100 (Simulates Fade/Black point)

  // --- Color ---
  saturation: number; // -100 to 100
  vibrance: number;   // -100 to 100 (Smart saturation)
  temperature: number;// -100 to 100 (Blue <-> Orange)
  tint: number;       // -100 to 100 (Green <-> Magenta)
  hue: number;        // -180 to 180
  sepia: number;      // 0 to 100
  grayscale: number;  // 0 to 100
  invert: number;     // 0 to 100

  // --- Selective Color (HSL) ---
  selective: {
    reds: HSLShift;
    yellows: HSLShift;
    greens: HSLShift;
    cyans: HSLShift;
    blues: HSLShift;
    magentas: HSLShift;
  };

  // --- Curves ---
  curves: Curves;

  // --- Detail & Effect ---
  sharpen: number;    // 0 to 100
  blur: number;       // 0 to 100
  grain: number;      // 0 to 100
  vignette: number;   // 0 to 100
  fade: number;       // 0 to 100 (Lifted blacks)
}

export interface Preset {
  id: string;
  name: string;
  filterState: FilterState;
}

export interface SavedPrompt {
  id: string;
  text: string;
  timestamp: number;
}

export interface PromptCategory {
  id: string;
  label: string;
  prompts: {
    id: string;
    text: string;
  }[];
}

// --- Meishi (Business Card) Types ---

export interface ElementPos {
  x: number;
  y: number;
  scale: number;
  rotate?: number; // degrees
  fit?: 'cover' | 'contain' | 'stretch';
  visible?: boolean;
  align?: 'left' | 'center' | 'right';
}

export type FrameStyle = 'none' | 'simple' | 'thick' | 'double' | 'corners' | 'bracket' | 'top-bottom' | 'cyber' | 'modern';

export type QRStyle = 'normal' | 'dots' | 'rounded';

export interface MeishiState {
  // Content
  name: string;
  twitterId: string;
  instagramId: string;
  freeText: string;
  
  // Layout
  isVertical: boolean;
  
  // Styling
  fontFamily: string; // Changed from enum to string for custom fonts
  fontWeight: number; // 100-900
  themeColor: string;
  subColor: string;
  backgroundColor: string;
  textColor: string; // Global fallback
  nameColor: string; // Specific
  detailsColor: string; // Specific
  detailsLineHeight: number; // New: Line height for details block
  
  // Effects
  textShadow: boolean;
  textStroke: boolean;
  
  // Frame
  frameStyle: FrameStyle;
  
  // QR
  qrStyle: QRStyle;
  qrColor: string;
  qrBgColor: string; // usually white or transparent

  // Positioning (Normalized 0-1)
  photoPos: ElementPos;
  namePos: ElementPos;
  detailsPos: ElementPos;
  qrPos: ElementPos;
}

// Add global definition for qrcode library
declare global {
  interface Window {
    qrcode: any;
  }
}