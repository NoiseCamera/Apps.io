
import { DEFAULT_MEISHI_STATE } from '../constants';

export const MEISHI_PRESETS = [
    {
        id: 'simple-clean',
        label: 'シンプル (横)',
        state: {
            isVertical: false,
            fontFamily: 'Noto Sans JP',
            themeColor: '#333333',
            subColor: '#999999',
            backgroundColor: '#ffffff',
            textColor: '#000000',
            nameColor: '#000000',
            detailsColor: '#000000',
            frameStyle: 'none',
            textShadow: false,
            textStroke: false,
            qrStyle: 'normal',
            qrColor: '#000000',
            detailsLineHeight: 1.6,
            photoPos: { x: 0.5, y: 0.5, scale: 1.0, visible: true, fit: 'stretch' },
            namePos: { x: 0.5, y: 0.35, scale: 1.0, visible: true, align: 'center' },
            detailsPos: { x: 0.5, y: 0.6, scale: 0.9, visible: true, align: 'center' },
            qrPos: { x: 0.9, y: 0.85, scale: 0.8, visible: true }
        }
    },
    {
        id: 'modern-vertical',
        label: 'モダン (縦)',
        state: {
            isVertical: true,
            fontFamily: 'Kaisei Opti',
            themeColor: '#ec4899',
            subColor: '#fbcfe8',
            backgroundColor: '#ffffff',
            textColor: '#1f2937',
            nameColor: '#1f2937',
            detailsColor: '#1f2937',
            frameStyle: 'thick',
            textShadow: false,
            textStroke: false,
            qrStyle: 'rounded',
            qrColor: '#ec4899',
            detailsLineHeight: 1.8,
            photoPos: { x: 0.5, y: 0.35, scale: 1.0, visible: true, fit: 'stretch' },
            namePos: { x: 0.5, y: 0.65, scale: 1.2, visible: true, align: 'center' },
            detailsPos: { x: 0.5, y: 0.8, scale: 0.9, visible: true, align: 'center' },
            qrPos: { x: 0.85, y: 0.9, scale: 0.8, visible: true }
        }
    },
    {
        id: 'cute-pop',
        label: 'ポップ & キュート',
        state: {
            isVertical: false,
            fontFamily: 'M PLUS Rounded 1c',
            themeColor: '#f472b6',
            subColor: '#fdf2f8',
            backgroundColor: '#fff1f2',
            textColor: '#be185d',
            nameColor: '#be185d',
            detailsColor: '#be185d',
            frameStyle: 'corners',
            textShadow: false,
            textStroke: true,
            qrStyle: 'dots',
            qrColor: '#be185d',
            detailsLineHeight: 1.4,
            photoPos: { x: 0.75, y: 0.5, scale: 1.0, visible: true, fit: 'stretch' },
            namePos: { x: 0.25, y: 0.4, scale: 1.3, visible: true, align: 'center' },
            detailsPos: { x: 0.25, y: 0.65, scale: 1.0, visible: true, align: 'center' },
            qrPos: { x: 0.1, y: 0.85, scale: 0.8, visible: true }
        }
    },
    {
        id: 'cyber-dark',
        label: 'サイバー (黒)',
        state: {
            isVertical: false,
            fontFamily: 'DotGothic16',
            themeColor: '#00ff9d',
            subColor: '#003311',
            backgroundColor: '#000000',
            textColor: '#00ff9d',
            nameColor: '#00ff9d',
            detailsColor: '#00ff9d',
            frameStyle: 'cyber',
            textShadow: true,
            textStroke: false,
            qrStyle: 'normal',
            qrColor: '#00ff9d',
            detailsLineHeight: 1.5,
            photoPos: { x: 0.5, y: 0.5, scale: 1.0, visible: true, fit: 'stretch' },
            namePos: { x: 0.5, y: 0.8, scale: 1.2, visible: true, align: 'center' },
            detailsPos: { x: 0.5, y: 0.92, scale: 0.8, visible: true, align: 'center' },
            qrPos: { x: 0.9, y: 0.15, scale: 0.8, visible: true }
        }
    },
    {
        id: 'elegant-serif',
        label: 'エレガント',
        state: {
            isVertical: true,
            fontFamily: 'Noto Serif JP',
            themeColor: '#c084fc',
            subColor: '#e9d5ff',
            backgroundColor: '#faf5ff',
            textColor: '#581c87',
            nameColor: '#581c87',
            detailsColor: '#581c87',
            frameStyle: 'double',
            textShadow: false,
            textStroke: false,
            qrStyle: 'rounded',
            qrColor: '#7e22ce',
            detailsLineHeight: 2.0,
            photoPos: { x: 0.5, y: 0.4, scale: 0.9, visible: true, fit: 'stretch' },
            namePos: { x: 0.5, y: 0.7, scale: 1.1, visible: true, align: 'center' },
            detailsPos: { x: 0.5, y: 0.85, scale: 0.8, visible: true, align: 'center' },
            qrPos: { x: 0.5, y: 0.2, scale: 0.6, visible: true }
        }
    },
    {
        id: 'japanese-style',
        label: '和風',
        state: {
            isVertical: true,
            fontFamily: 'Yuji Syuku',
            themeColor: '#b91c1c',
            subColor: '#fecaca',
            backgroundColor: '#fffbf0', // Cream
            textColor: '#450a0a',
            nameColor: '#450a0a',
            detailsColor: '#450a0a',
            frameStyle: 'top-bottom',
            textShadow: false,
            textStroke: false,
            qrStyle: 'normal',
            qrColor: '#7f1d1d',
            detailsLineHeight: 1.8,
            photoPos: { x: 0.5, y: 0.3, scale: 1.0, visible: true, fit: 'stretch' },
            namePos: { x: 0.5, y: 0.6, scale: 1.4, visible: true, align: 'center' },
            detailsPos: { x: 0.5, y: 0.75, scale: 0.9, visible: true, align: 'center' },
            qrPos: { x: 0.85, y: 0.9, scale: 0.7, visible: true }
        }
    },
    {
        id: 'handwritten-pop',
        label: '手書き風',
        state: {
            isVertical: false,
            fontFamily: 'Hachi Maru Pop',
            themeColor: '#f59e0b',
            subColor: '#fef3c7',
            backgroundColor: '#ffffff',
            textColor: '#78350f',
            nameColor: '#78350f',
            detailsColor: '#78350f',
            frameStyle: 'bracket',
            textShadow: false,
            textStroke: false,
            qrStyle: 'dots',
            qrColor: '#d97706',
            detailsLineHeight: 1.6,
            photoPos: { x: 0.25, y: 0.5, scale: 1.0, visible: true, fit: 'stretch' },
            namePos: { x: 0.65, y: 0.4, scale: 1.3, visible: true, align: 'center' },
            detailsPos: { x: 0.65, y: 0.65, scale: 1.0, visible: true, align: 'center' },
            qrPos: { x: 0.9, y: 0.85, scale: 0.8, visible: true }
        }
    }
];
