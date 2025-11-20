import { FilterState, HSLShift, Point, MeishiState } from './types';

export const DEFAULT_CURVE: Point[] = [{x: 0, y: 0}, {x: 1, y: 1}];
export const DEFAULT_HSL: HSLShift = { hue: 0, saturation: 0, lightness: 0 };

export const DEFAULT_FILTERS: FilterState = {
  exposure: 0, brightness: 0, contrast: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0,
  saturation: 0, vibrance: 0, temperature: 0, tint: 0, hue: 0, sepia: 0, grayscale: 0, invert: 0,
  selective: {
      reds: { ...DEFAULT_HSL }, yellows: { ...DEFAULT_HSL }, greens: { ...DEFAULT_HSL },
      cyans: { ...DEFAULT_HSL }, blues: { ...DEFAULT_HSL }, magentas: { ...DEFAULT_HSL },
  },
  curves: {
    master: [...DEFAULT_CURVE], red: [...DEFAULT_CURVE], green: [...DEFAULT_CURVE], blue: [...DEFAULT_CURVE],
  },
  sharpen: 0, blur: 0, grain: 0, vignette: 0, fade: 0
};

export const DEFAULT_MEISHI_STATE: MeishiState = {
    name: '',
    twitterId: '',
    instagramId: '',
    freeText: '',
    isVertical: false,
    fontFamily: 'Noto Sans JP',
    fontWeight: 700,
    themeColor: '#ec4899',
    subColor: '#fbcfe8',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    nameColor: '#000000',
    detailsColor: '#000000',
    detailsLineHeight: 1.5,
    textShadow: false,
    textStroke: false,
    frameStyle: 'none',
    qrStyle: 'normal',
    qrColor: '#000000',
    qrBgColor: 'transparent',
    photoPos: { x: 0.5, y: 0.5, scale: 1.0, visible: true, fit: 'stretch', rotate: 0 },
    namePos: { x: 0.5, y: 0.4, scale: 1.0, visible: true, rotate: 0, align: 'center' },
    detailsPos: { x: 0.5, y: 0.8, scale: 1.0, visible: true, rotate: 0, align: 'center' },
    qrPos: { x: 0.9, y: 0.9, scale: 1.0, visible: true, rotate: 0 }
};