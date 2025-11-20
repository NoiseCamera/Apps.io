


import React, { useState, useRef, useEffect, useMemo } from 'react';
import { CanvasArea } from './components/CanvasArea';
import { Button } from './components/Button';
import { Spinner } from './components/Spinner';
import { CurveEditor } from './components/CurveEditor';
import { LiquifyEditor } from './components/LiquifyEditor';
import { MaskEditor } from './components/MaskEditor';
import { MakeupEditor } from './components/MakeupEditor';
import { MeishiEditor } from './components/MeishiEditor';
import { Camera } from './components/Camera'; // Import Camera
import { editImageWithAI, generateCosplayCaption, generateAIMask, MaskTarget } from './services/geminiService';
import { ToolMode, AICaptionResult, FilterState, ImageState, Preset, SavedPrompt, Layer, MeishiState } from './types';
import { createSplineLUT, processSelectiveAdjustments } from './utils/imageProcessing';
import { DEFAULT_FILTERS, DEFAULT_CURVE, DEFAULT_HSL } from './constants';
import { FACTORY_PRESETS } from './data/presets';
import { MEISHI_PRESETS } from './data/meishiPresets';
import { PROMPT_CATEGORIES } from './data/prompts';

// --- Adjust Tools Definition ---
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

// Icons
const IconSun = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>
const IconContrast = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>
const IconBrightness = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 2.625v-2.196a2.409 2.409 0 00-1.376-2.213c-.423-.176-.742-.557-.837-1.013l-.025-.126a2.996 2.996 0 00-5.968 0l-.026.126c-.094.456-.413.837-.837 1.013a2.409 2.409 0 00-1.376 2.213v2.196" /></svg>
const IconHighlights = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${props.className || ''}`}><circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 4"/></svg>
const IconShadows = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={`w-5 h-5 ${props.className || ''}`}><path fillRule="evenodd" d="M12 2.25a9.75 9.75 0 00-9.75 9.75c0 1.33.266 2.597.748 3.752A9.753 9.753 0 0012 21.75a9.753 9.753 0 009.002-5.998 9.718 9.718 0 01-3.748.748c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752z" clipRule="evenodd"/></svg>
const IconSaturation = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.435-.435 1.133-.435 1.567 0l3.712 3.712c.435.435.435 1.133 0 1.567l-2.88 2.88" /></svg>
const IconVibrance = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
const IconTemp = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1.001A3.75 3.75 0 0012 18z" /></svg>
const IconTint = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.077-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg>
const IconHue = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.435-.435 1.133-.435 1.567 0l3.712 3.712c.435.435.435 1.133 0 1.567l-2.88 2.88" /></svg>
const IconCurves = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" /></svg>
const IconSelective = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834-1.385l-1.25 1.95M13.684 16.6l-2.47 5.072" /></svg>
const IconSharpen = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" /></svg>
const IconGrain = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
const IconBlur = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
const IconVignette = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${props.className || ''}`}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" strokeDasharray="2 2" opacity="0.5"/></svg>
const IconFade = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z" /></svg>
const IconSepia = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
const IconBnW = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${props.className || ''}`}><circle cx="12" cy="12" r="10"/><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2V22Z" fill="currentColor" opacity="0.5"/></svg>
const IconInvert = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>

const IconAdjust = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>
const IconMask = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.077-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg>
const IconMagic = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={props.className}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" /></svg>
const IconLiquify = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834-1.385l-1.25 1.95M13.684 16.6l-2.47 5.072" /></svg>
const IconLayers = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" /></svg>
const IconPlus = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
const IconEye = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
const IconEyeOff = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
const IconReset = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-4 h-4 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>;

// Beauty & New Icons
const IconBeauty = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
const IconFace = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" /></svg>
const IconSkin = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.077-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg>
const IconMakeup = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.077-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg>
const IconBody = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
const IconBrush = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.077-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg>
const IconScissors = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M7.848 8.25l1.536.887M7.848 8.25a3 3 0 11-5.196-3 3 3 0 015.196 3zm1.536.887a2.165 2.165 0 011.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 11-5.196 3 3 3 0 015.196-3zm1.536-.887a2.165 2.165 0 001.083-1.838c.005-.264.03-.521.074-.773m-4.891-9.699c.85-.336 1.804-.286 2.617.156 1.431.776 1.817 1.96 1.817 1.96s.386-1.184 1.817-1.96a3.903 3.903 0 012.617-.156m-1.328 7.196a7.48 7.48 0 00-2.36-2.176l-1.536-.887m-1.328 7.196a7.48 7.48 0 01-2.36-2.176l-1.536-.887m-3.424-6.966h.008v.008H12v-.008zM2.25 2.25L21.75 21.75" /></svg>
const IconImage = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
const IconFolderOpen = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" /></svg>
const IconCard = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-11.036a9.104 9.104 0 011.994-.214 9.104 9.104 0 011.994.214" /></svg>
const IconCamera = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-6 h-6 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>


// Icons for presets/tools
const IconPreset = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0111.186 0z" /></svg>
const IconStar = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.545.044.76.742.34 1.125l-4.213 3.828a.562.562 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.213-3.828a.562.562 0 01.34-1.125l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
const IconDownload = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
const IconTrash = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
const IconImport = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" /></svg>
const IconCheck = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-5 h-5 ${props.className || ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>

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
                 tCtx.filter = `
                    brightness(${100 + filters.brightness}%) 
                    contrast(${100 + filters.contrast}%) 
                    saturate(${100 + filters.saturation}%) 
                    grayscale(${filters.grayscale}%)
                    sepia(${filters.sepia}%)
                    hue-rotate(${filters.hue}deg) 
                    blur(${filters.blur/5}px)
                    invert(${filters.invert}%)
                `;
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
  const [imageState, setImageState] = useState<ImageState>({
    id: 'init',
    original: null, 
    preview: null, 
    layers: [], 
    activeLayerId: '',
    history: [], 
    historyIndex: -1
  });

  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<ToolMode>(ToolMode.NONE);
  
  // Adjust Mode State
  const [activeToolId, setActiveToolId] = useState<AdjustToolId>('presets'); 
  const [activeCurveChannel, setActiveCurveChannel] = useState<'master'|'red'|'green'|'blue'>('master');
  const [activeSelectiveColor, setActiveSelectiveColor] = useState<'reds'|'yellows'|'greens'|'cyans'|'blues'|'magentas'>('reds');
  
  const [aiPrompt, setAiPrompt] = useState('');
  const [captionResult, setCaptionResult] = useState<AICaptionResult | null>(null);
  
  const [activePromptCategory, setActivePromptCategory] = useState<string>('saved');

  // Meishi State (Draft) - Using expanded default
  const [meishiState, setMeishiState] = useState<MeishiState>(MEISHI_PRESETS[0].state as MeishiState);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  // Computed: Active Layer
  const activeLayerId = imageState.activeLayerId;
  
  const activeLayer = useMemo(() => 
    imageState.layers.find(l => l.id === activeLayerId), 
  [imageState.layers, activeLayerId]);

  // --- LocalStorage ---
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

  // Load Meishi draft
  useEffect(() => {
      try {
          const saved = localStorage.getItem('cos_meishi_draft');
          if (saved) setMeishiState(JSON.parse(saved));
      } catch (e) {}
  }, []);

  useEffect(() => { 
      try { 
          const userPresets = presets.filter(p => !p.id.startsWith('fp-'));
          localStorage.setItem('cos_presets', JSON.stringify(userPresets)); 
      } catch (e) {} 
  }, [presets]);
  
  useEffect(() => { 
      try { 
          localStorage.setItem('cos_saved_prompts', JSON.stringify(savedPrompts)); 
      } catch (e) {} 
  }, [savedPrompts]);

  // Save Meishi draft
  useEffect(() => {
      try {
          localStorage.setItem('cos_meishi_draft', JSON.stringify(meishiState));
      } catch (e) {}
  }, [meishiState]);

  const displayPrompts = useMemo(() => {
      if (activePromptCategory === 'saved') {
          return savedPrompts;
      }
      const category = PROMPT_CATEGORIES.find(c => c.id === activePromptCategory);
      return category ? category.prompts : [];
  }, [activePromptCategory, savedPrompts]);

  const activeToolDef = TOOLS.find(t => t.id === activeToolId);

  // --- Initialization & History ---

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        initializeImage(result);
      };
      reader.readAsDataURL(file);
      event.target.value = '';
    }
  };
  
  const initializeImage = (imageData: string) => {
        const baseLayer: Layer = {
            id: 'layer-base',
            name: '背景 (オリジナル)',
            type: 'image',
            image: imageData,
            mask: null,
            preview: imageData, 
            isVisible: true,
            opacity: 1,
            blendMode: 'source-over',
            filterState: JSON.parse(JSON.stringify(DEFAULT_FILTERS))
        };

        setImageState({
          id: Date.now().toString(),
          original: imageData,
          preview: imageData,
          layers: [baseLayer],
          activeLayerId: 'layer-base',
          history: [[baseLayer]],
          historyIndex: 0
        });
        setActiveMode(ToolMode.NONE);
  };

  const updateActiveLayerFilters = (newFilters: FilterState | ((prev: FilterState) => FilterState)) => {
      if (!activeLayer) return;
      
      const updatedFilters = typeof newFilters === 'function' ? newFilters(activeLayer.filterState) : newFilters;
      
      setImageState(prev => {
          const updatedLayers = prev.layers.map(l => 
              l.id === prev.activeLayerId ? { ...l, filterState: updatedFilters } : l
          );
          return { ...prev, layers: updatedLayers };
      });
  };
  
  const handleResetAdjustments = () => {
    if (!activeLayer) return;
    updateActiveLayerFilters(JSON.parse(JSON.stringify(DEFAULT_FILTERS)));
  };

  const pushToHistory = (newLayers: Layer[]) => {
       setImageState(prev => {
           const newHistory = prev.history.slice(0, prev.historyIndex + 1);
           newHistory.push(newLayers);
           return {
               ...prev,
               layers: newLayers,
               history: newHistory,
               historyIndex: newHistory.length - 1
           };
       });
  };

  const handleUndo = () => {
    if (imageState.historyIndex > 0) {
      const newIdx = imageState.historyIndex - 1;
      setImageState(prev => ({ ...prev, historyIndex: newIdx, layers: prev.history[newIdx] }));
    }
  };

  const handleRedo = () => {
    if (imageState.historyIndex < imageState.history.length - 1) {
      const newIdx = imageState.historyIndex + 1;
      setImageState(prev => ({ ...prev, historyIndex: newIdx, layers: prev.history[newIdx] }));
    }
  };

  const handleAddAiLayer = async (target: MaskTarget) => {
      if (!imageState.original) return;
      setIsLoading(true);
      setShowAiLayerMenu(false);
      
      try {
          const maskRaw = await generateAIMask(imageState.original, target);

          const maskImg = new Image();
          maskImg.src = maskRaw;
          await new Promise((resolve, reject) => {
              maskImg.onload = resolve;
              maskImg.onerror = reject;
          });

          const cvs = document.createElement('canvas');
          cvs.width = maskImg.width;
          cvs.height = maskImg.height;
          const ctx = cvs.getContext('2d');
          if (!ctx) throw new Error("Canvas context error");

          ctx.drawImage(maskImg, 0, 0);
          const imageData = ctx.getImageData(0, 0, cvs.width, cvs.height);
          const data = imageData.data;

          const LOW_THRESHOLD = 15;
          const HIGH_THRESHOLD = 240;
          const RANGE = HIGH_THRESHOLD - LOW_THRESHOLD;

          for (let i = 0; i < data.length; i += 4) {
              const brightness = (data[i] + data[i+1] + data[i+2]) / 3;
              let alpha = 0;
              if (brightness >= HIGH_THRESHOLD) {
                  alpha = 255; 
              } else if (brightness <= LOW_THRESHOLD) {
                  alpha = 0;
              } else {
                  alpha = ((brightness - LOW_THRESHOLD) / RANGE) * 255;
              }
              
              data[i] = 255; data[i+1] = 255; data[i+2] = 255; data[i+3] = alpha;
          }

          ctx.putImageData(imageData, 0, 0);
          const processedMask = cvs.toDataURL('image/png');

          const newLayer: Layer = {
              id: `layer-${Date.now()}`,
              name: `${target === 'person' ? '人物 (背景削除)' : target === 'hair' ? '髪' : target === 'face_only' ? '顔' : target === 'skin' ? '肌' : target === 'clothes' ? '衣装' : target === 'background' ? '背景' : 'レイヤー'}`,
              type: 'image',
              image: imageState.original, 
              mask: processedMask, 
              preview: imageState.original, 
              isVisible: true,
              opacity: 1,
              blendMode: 'source-over',
              filterState: JSON.parse(JSON.stringify(DEFAULT_FILTERS))
          };
          
          const newLayers = [...imageState.layers, newLayer];
          pushToHistory(newLayers);
          setImageState(prev => ({ ...prev, layers: newLayers, activeLayerId: newLayer.id }));
          
      } catch (e) {
          console.error(e);
          showToast("AIレイヤー作成に失敗しました", "error");
      } finally {
          setIsLoading(false);
      }
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
      } else {
          setImageState(prev => ({ ...prev, activeLayerId: layerId }));
      }
  };

  const handleDeleteLayer = (layerId: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setConfirmDialog({
          message: "このレイヤーを削除しますか？",
          onConfirm: () => {
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
      setActiveMode(ToolMode.BEAUTY);
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
      } catch (error) {
          showToast("AI処理に失敗しました。", "error");
      } finally {
          setIsLoading(false);
      }
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
    } catch (error) {
      showToast("AI編集に失敗しました。", "error");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCameraCapture = (imageSrc: string) => {
      initializeImage(imageSrc);
      // Close camera happens implicitly by state update
  };

  // --- Presets/Prompts Handlers ---
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
      if (id.startsWith('fp-')) {
          showToast("公式プリセットは削除できません", "error");
          return;
      }
      setConfirmDialog({
          message: "プリセットを削除しますか？",
          onConfirm: () => {
              setPresets(presets.filter(p => p.id !== id));
              setConfirmDialog(null);
              showToast("削除しました");
          }
      });
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
  
  const handleDeletePrompt = (id: string, e?: React.MouseEvent) => {
      if(e) e.stopPropagation();
      setSavedPrompts(savedPrompts.filter(p=>p.id!==id));
  };
  
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
            const lImg = new Image(); lImg.src = layer.preview; 
            await new Promise(r => lImg.onload = r);
            
            if (layer.mask) {
                const tempC = document.createElement('canvas');
                tempC.width = canvas.width; tempC.height = canvas.height;
                const tCtx = tempC.getContext('2d');
                if (tCtx) {
                    tCtx.drawImage(lImg, 0, 0, canvas.width, canvas.height);
                    tCtx.globalCompositeOperation = 'destination-in';
                    const mImg = new Image(); mImg.src = layer.mask;
                    await new Promise(r => mImg.onload = r);
                    tCtx.drawImage(mImg, 0, 0, canvas.width, canvas.height);
                    ctx.globalAlpha = layer.opacity;
                    ctx.globalCompositeOperation = layer.blendMode;
                    ctx.drawImage(tempC, 0, 0);
                }
            } else {
                ctx.globalAlpha = layer.opacity;
                ctx.globalCompositeOperation = layer.blendMode;
                ctx.drawImage(lImg, 0, 0, canvas.width, canvas.height);
            }
        }
        const link = document.createElement('a');
        link.download = `cosplay-layer-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    setIsLoading(false);
  };
  
  const activeFilters = activeLayer ? activeLayer.filterState : DEFAULT_FILTERS;

  // Render Components
  if (activeMode === ToolMode.CAMERA) {
      return <Camera onCapture={handleCameraCapture} onClose={() => setActiveMode(ToolMode.NONE)} />;
  }
  if (activeMode === ToolMode.MEISHI && activeLayer) {
      return <MeishiEditor 
        imageSrc={activeLayer.preview} 
        initialState={meishiState}
        onChange={setMeishiState}
        onClose={() => setActiveMode(ToolMode.NONE)}
        onEditImage={() => setActiveMode(ToolMode.NONE)}
      />;
  }
  if (activeMode === ToolMode.LIQUIFY && activeLayer) {
      return <LiquifyEditor imageSrc={activeLayer.image} onApply={handleImageUpdate} onCancel={() => setActiveMode(ToolMode.BEAUTY)} />;
  }
  if (activeMode === ToolMode.MAKEUP && activeLayer) {
      return <MakeupEditor imageSrc={activeLayer.image} onApply={handleImageUpdate} onCancel={() => setActiveMode(ToolMode.BEAUTY)} />;
  }
  if (activeMode === ToolMode.MASK && activeLayer) {
      return <MaskEditor imageSrc={activeLayer.image} initialMask={activeLayer.mask} onSave={handleMaskSave} onCancel={() => setActiveMode(ToolMode.NONE)} />;
  }
  
  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden select-none font-sans">
      {/* Toast Notification */}
      {toast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-zinc-800 border border-white/10 px-4 py-2 rounded-full shadow-xl z-[100] flex items-center gap-2 animate-fade-in pointer-events-none">
              {toast.type === 'success' ? <IconCheck className="w-4 h-4 text-green-400"/> : <div className="w-4 h-4 rounded-full bg-red-400"/>}
              <span className="text-xs font-bold text-white">{toast.message}</span>
          </div>
      )}
      
      {/* Custom Confirm Dialog */}
      {confirmDialog && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setConfirmDialog(null)}>
              <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl shadow-2xl w-full max-w-sm animate-slide-up" onClick={e => e.stopPropagation()}>
                  <h3 className="text-white font-bold text-lg mb-2">確認</h3>
                  <p className="text-white/70 text-sm mb-6">{confirmDialog.message}</p>
                  <div className="flex gap-3 justify-end">
                      <Button variant="secondary" onClick={() => setConfirmDialog(null)}>キャンセル</Button>
                      <Button variant="primary" onClick={confirmDialog.onConfirm}>実行する</Button>
                  </div>
              </div>
          </div>
      )}

      {/* Canvas Layer */}
      <div className="absolute inset-0 z-0" onClick={() => !imageState.original && fileInputRef.current?.click()}>
             <CanvasArea 
                layers={imageState.layers} 
                activeLayerId={activeLayerId}
                activeFilters={activeFilters}
             />
      </div>
      
      <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileSelect}/>
      <input type="file" accept=".json" ref={presetImportInputRef} className="hidden" onChange={handleImportPreset}/>
      <input type="file" accept=".json" ref={promptImportInputRef} className="hidden" onChange={handleImportPrompts}/>

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 h-16 px-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent z-40 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3 drop-shadow-md">
           <div className="w-8 h-8 bg-gradient-to-tr from-cos-accent to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-cos-accent/20">
                <span className="text-white font-extrabold text-sm">CL</span>
           </div>
           <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/70 hover:text-white transition-colors" title="画像を開く">
                <IconFolderOpen className="w-5 h-5" />
           </button>
           <button onClick={() => setActiveMode(ToolMode.CAMERA)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white/70 hover:text-white transition-colors" title="カメラ">
                <IconCamera className="w-5 h-5" />
           </button>
        </div>
        <div className="pointer-events-auto flex gap-2 items-center drop-shadow-md">
            <div className="flex mr-2 bg-white/10 backdrop-blur-lg rounded-full border border-white/10 overflow-hidden">
                <button onClick={handleUndo} disabled={imageState.historyIndex <= 0} className="p-2.5 text-white/70 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>
                </button>
                <div className="w-px bg-white/10"></div>
                <button onClick={handleRedo} disabled={imageState.historyIndex >= imageState.history.length - 1} className="p-2.5 text-white/70 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" /></svg>
                </button>
            </div>
            <Button variant="primary" onClick={handleDownload} disabled={!imageState.original} className="!py-2 !px-5 text-xs !rounded-full shadow-lg shadow-cos-accent/30">保存</Button>
        </div>
      </header>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-50 flex flex-col justify-end pointer-events-none">
        
        {/* LAYER PANEL */}
        {activeMode === ToolMode.LAYERS && (
            <div className="pointer-events-auto bg-zinc-900/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl animate-slide-up flex flex-col max-h-[60vh] shadow-2xl">
                <div className="flex justify-between items-center p-4 border-b border-white/5">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                        <IconLayers className="w-5 h-5 text-cos-accent"/> レイヤー ({imageState.layers.length})
                    </h3>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setShowAiLayerMenu(!showAiLayerMenu)}
                            className="bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
                        >
                            <IconPlus className="w-4 h-4"/> AI レイヤー追加
                        </button>
                        <button onClick={() => setActiveMode(ToolMode.NONE)} className="p-1.5 bg-white/5 rounded-full text-white/50 hover:text-white">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>
                </div>

                {showAiLayerMenu && (
                    <div className="bg-slate-800 border-b border-white/10 p-2 grid grid-cols-2 gap-2 animate-fade-in">
                        {[
                            {id: 'person', label: '人物 (背景削除)'},
                            {id: 'hair', label: '髪・ウィッグ'},
                            {id: 'face_only', label: '顔 (肌のみ)'},
                            {id: 'skin', label: '肌 (全身)'},
                            {id: 'clothes', label: '衣装'},
                            {id: 'background', label: '背景'}
                        ].map((item) => (
                            <button 
                                key={item.id}
                                onClick={() => handleAddAiLayer(item.id as MaskTarget)}
                                className="text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-cos-accent text-xs text-white transition-colors"
                            >
                                + {item.label}
                            </button>
                        ))}
                    </div>
                )}

                <div className="overflow-y-auto p-4 space-y-2 min-h-[200px]">
                    {[...imageState.layers].reverse().map((layer) => {
                        const isActive = layer.id === activeLayerId;
                        return (
                        <div 
                            key={layer.id}
                            onClick={() => handleSelectLayer(layer.id)}
                            className={`flex flex-col rounded-xl border transition-all cursor-pointer overflow-hidden ${isActive ? 'bg-cos-accent/10 border-cos-accent/50 ring-1 ring-cos-accent/30' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                        >
                            <div className="flex items-center gap-3 p-2">
                                <button 
                                    onClick={(e) => handleToggleVisibility(layer.id, e)}
                                    className={`p-2 rounded-lg ${layer.isVisible ? 'text-white' : 'text-white/20'}`}
                                >
                                    {layer.isVisible ? <IconEye/> : <IconEyeOff/>}
                                </button>
                                
                                <div className="w-10 h-10 rounded bg-black/50 border border-white/10 overflow-hidden shrink-0 relative">
                                    <img src={layer.preview} className="w-full h-full object-cover opacity-50" alt="" />
                                    {layer.mask && <img src={layer.mask} className="absolute inset-0 w-full h-full object-cover mix-blend-lighten" alt="mask" />}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-white truncate">{layer.name}</div>
                                    <div className="text-[10px] text-white/50">{layer.blendMode} • {Math.round(layer.opacity * 100)}%</div>
                                </div>
                            </div>

                            {isActive && (
                                <div className="grid grid-cols-3 gap-1 px-2 pb-2 bg-black/20 border-t border-white/5 pt-2 animate-fade-in">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setActiveMode(ToolMode.ADJUST); }}
                                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-cos-accent text-white text-xs font-bold rounded-lg shadow-lg shadow-cos-accent/20 active:scale-95 transition-all"
                                    >
                                        <IconAdjust className="w-3 h-3" /> 調整
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setActiveMode(ToolMode.MASK); }}
                                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg active:scale-95 transition-all"
                                    >
                                        <IconMask className="w-3 h-3" /> マスク
                                    </button>
                                    <button 
                                        onClick={(e) => handleDeleteLayer(layer.id, e)}
                                        disabled={imageState.layers.length <= 1}
                                        className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-all ${imageState.layers.length <= 1 ? 'opacity-50 cursor-not-allowed text-white/30 bg-white/5' : 'text-red-400 hover:bg-red-500/10 bg-white/5'}`}
                                    >
                                        <IconTrash className="w-3 h-3" /> 削除
                                    </button>
                                </div>
                            )}
                        </div>
                    )})}
                </div>
            </div>
        )}

        {/* ADJUST PANEL */}
        {activeMode === ToolMode.ADJUST && activeLayer && (
            <div className="pointer-events-auto bg-black/90 backdrop-blur-xl border-t border-white/10 pt-2 pb-safe flex flex-col animate-slide-up shadow-2xl rounded-t-2xl">
                 <div className="flex justify-between items-center px-4 pb-2 border-b border-white/5">
                     <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white/80 tracking-wider uppercase">調整: {activeLayer.name}</span>
                     </div>
                     <div className="flex gap-2">
                        <button onClick={handleResetAdjustments} className="text-xs font-bold bg-white/10 text-white/70 hover:text-white px-3 py-1 rounded-full flex items-center gap-1">
                            <IconReset className="w-3 h-3" /> 全リセット
                        </button>
                        <button onClick={applyFiltersComplete} className="text-xs font-bold bg-cos-accent text-white px-3 py-1 rounded-full shadow-lg">完了</button>
                     </div>
                </div>

                <div className="min-h-[100px] flex flex-col justify-center px-6 py-4 relative">
                    {activeToolId === 'presets' && (
                         <div className="w-full animate-fade-in flex flex-col gap-3 h-[180px]">
                             <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                                 {!isNamingPreset ? (
                                    <>
                                        <button onClick={handleStartSavePreset} className="flex items-center gap-2 px-3 py-2 bg-cos-accent rounded-lg text-white text-xs font-bold whitespace-nowrap active:scale-95 transition-all"><IconStar className="w-4 h-4" /> <span>保存</span></button>
                                        <button onClick={() => presetImportInputRef.current?.click()} className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs whitespace-nowrap transition-colors"><IconImport className="w-4 h-4" /> <span>インポート</span></button>
                                    </>
                                 ) : (
                                     <div className="flex items-center gap-2 w-full animate-fade-in">
                                         <input type="text" value={newPresetName} onChange={e => setNewPresetName(e.target.value)} placeholder="名前..." className="flex-1 bg-white/10 text-white text-xs p-2 rounded-lg border border-white/20" autoFocus />
                                         <button onClick={handleConfirmSavePreset} className="p-2 bg-cos-accent rounded-lg text-white"><IconCheck className="w-4 h-4" /></button>
                                         <button onClick={() => setIsNamingPreset(false)} className="p-2 bg-white/10 rounded-lg text-white/60">X</button>
                                     </div>
                                 )}
                             </div>
                             <div className="flex-1 overflow-y-auto no-scrollbar pr-2 space-y-2">
                                 {presets.map(p => (
                                     <div key={p.id} className="flex items-center justify-between bg-white/5 p-2.5 rounded-lg border border-white/5 hover:border-white/20 transition-colors group">
                                         <button onClick={() => updateActiveLayerFilters(JSON.parse(JSON.stringify(p.filterState)))} className="flex-1 text-left text-sm font-medium text-white hover:text-cos-accent truncate">{p.name}</button>
                                         <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100">
                                             <button onClick={(e) => handleDownloadPreset(p, e)} className="p-1.5 hover:bg-white/10 rounded text-white"><IconDownload className="w-4 h-4" /></button>
                                             <button onClick={(e) => handleDeletePreset(p.id, e)} className="p-1.5 hover:bg-red-500/20 rounded text-red-400"><IconTrash className="w-4 h-4" /></button>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                         </div>
                    )}

                     {activeToolDef && activeToolId !== 'curves' && activeToolId !== 'selective' && activeToolId !== 'presets' && activeToolDef.min !== undefined && (
                        <div className="w-full max-w-md mx-auto space-y-4 animate-fade-in">
                             <div className="flex justify-between text-xs font-medium text-white/80">
                                 <span>{activeToolDef.label}</span>
                                 <div className="flex items-center gap-2">
                                     <span className="font-mono text-cos-accent">
                                         {(activeFilters as any)[activeToolId] > 0 ? '+' : ''}{(activeFilters as any)[activeToolId]}{activeToolDef.unit || ''}
                                     </span>
                                     <button 
                                        onClick={() => updateActiveLayerFilters(p => ({...p, [activeToolId]: 0}))}
                                        className="p-1 text-white/30 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                                        title="この項目をリセット"
                                     >
                                        <IconReset className="w-3 h-3" />
                                     </button>
                                 </div>
                             </div>
                             <input 
                                type="range" 
                                min={activeToolDef.min} 
                                max={activeToolDef.max} 
                                step={activeToolDef.step || 1} 
                                value={(activeFilters as any)[activeToolId]} 
                                onChange={(e) => updateActiveLayerFilters(p => ({...p, [activeToolId]: Number(e.target.value)}))} 
                                onDoubleClick={() => updateActiveLayerFilters(p => ({...p, [activeToolId]: 0}))}
                                className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-cos-accent"
                             />
                        </div>
                     )}

                    {activeToolId === 'curves' && (
                        <div className="h-[180px] w-full flex gap-4 animate-fade-in">
                             <div className="flex flex-col justify-between py-2">
                                 {(['master', 'red', 'green', 'blue'] as const).map(c => (
                                     <button key={c} onClick={() => setActiveCurveChannel(c)} className={`w-6 h-6 rounded-full border-2 ${activeCurveChannel === c ? 'border-white scale-110' : 'border-transparent opacity-50'}`} style={{ backgroundColor: c === 'master' ? '#fff' : c === 'red' ? '#ef4444' : c === 'green' ? '#22c55e' : '#3b82f6'}} />
                                 ))}
                             </div>
                             <div className="flex-1 h-full relative">
                                <CurveEditor points={activeFilters.curves[activeCurveChannel]} onChange={(pts) => updateActiveLayerFilters(p => ({...p, curves: {...p.curves, [activeCurveChannel]: pts}}))} color={activeCurveChannel === 'master' ? '#fff' : activeCurveChannel === 'red' ? '#ef4444' : activeCurveChannel === 'green' ? '#22c55e' : '#3b82f6'} />
                                <button 
                                    onClick={() => updateActiveLayerFilters(p => ({...p, curves: {...p.curves, [activeCurveChannel]: [...DEFAULT_CURVE]}}))}
                                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/80 rounded-lg text-white/50 hover:text-white transition-colors backdrop-blur-sm"
                                    title="カーブをリセット"
                                >
                                    <IconReset className="w-3 h-3" />
                                </button>
                             </div>
                        </div>
                    )}

                    {activeToolId === 'selective' && (
                        <div className="space-y-4 w-full animate-fade-in relative">
                            <button 
                                onClick={() => updateActiveLayerFilters(p => ({...p, selective: {...p.selective, [activeSelectiveColor]: { ...DEFAULT_HSL }}}))} 
                                className="absolute -top-1 right-0 p-1.5 text-white/30 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                                title="この色をリセット"
                            >
                                <IconReset className="w-3 h-3" />
                            </button>
                            <div className="flex justify-center gap-3">
                                {(['reds', 'yellows', 'greens', 'cyans', 'blues', 'magentas'] as const).map(c => (
                                    <button key={c} onClick={() => setActiveSelectiveColor(c)} className={`w-8 h-8 rounded-full border-2 transition-all ${activeSelectiveColor === c ? 'border-white ring-2 ring-white/20 scale-110' : 'border-transparent opacity-50'}`} style={{ backgroundColor: c === 'reds' ? '#ef4444' : c === 'yellows' ? '#eab308' : c === 'greens' ? '#22c55e' : c === 'cyans' ? '#06b6d4' : c === 'blues' ? '#3b82f6' : '#d946ef' }} />
                                ))}
                            </div>
                            <div className="space-y-3 px-2">
                                <TinySlider label="色相" value={activeFilters.selective[activeSelectiveColor].hue} min={-100} max={100} onChange={v => updateActiveLayerFilters(p => ({...p, selective: {...p.selective, [activeSelectiveColor]: {...p.selective[activeSelectiveColor], hue: v}}}))} />
                                <TinySlider label="彩度" value={activeFilters.selective[activeSelectiveColor].saturation} min={-100} max={100} onChange={v => updateActiveLayerFilters(p => ({...p, selective: {...p.selective, [activeSelectiveColor]: {...p.selective[activeSelectiveColor], saturation: v}}}))} />
                                <TinySlider label="輝度" value={activeFilters.selective[activeSelectiveColor].lightness} min={-100} max={100} onChange={v => updateActiveLayerFilters(p => ({...p, selective: {...p.selective, [activeSelectiveColor]: {...p.selective[activeSelectiveColor], lightness: v}}}))} />
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="flex overflow-x-auto gap-2 px-4 py-4 no-scrollbar items-center bg-black/40">
                    {TOOLS.map(tool => {
                         const isActive = activeToolId === tool.id;
                         return (
                            <button key={tool.id} onClick={() => setActiveToolId(tool.id)} className={`relative group flex flex-col items-center justify-center min-w-[64px] gap-1.5 transition-all duration-200`}>
                                <div className={`p-2.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-cos-accent text-white shadow-[0_0_15px_rgba(236,72,153,0.4)] scale-110' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/80'}`}>
                                    {React.cloneElement(tool.icon as React.ReactElement<{ className?: string }>, { className: "w-5 h-5" })}
                                </div>
                                <span className={`text-[10px] whitespace-nowrap ${isActive ? 'text-white font-bold' : 'text-white/40'}`}>{tool.label}</span>
                            </button>
                        )
                    })}
                </div>
            </div>
        )}

        {/* BEAUTY MODE PANEL */}
        {activeMode === ToolMode.BEAUTY && activeLayer && (
             <div className="pointer-events-auto bg-zinc-900/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl animate-slide-up flex flex-col shadow-2xl pb-safe">
                <div className="flex justify-between items-center p-5 border-b border-white/5">
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                        <IconBeauty className="w-5 h-5 text-cos-accent"/> ビューティーモード
                    </h3>
                    <button onClick={() => setActiveMode(ToolMode.NONE)} className="p-2 text-white/50 hover:text-white">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    <div>
                        <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4 ml-1">AI ワンタップ美化</h4>
                        <div className="grid grid-cols-4 gap-4">
                            <button onClick={() => handleBeautyAI('skin')} className="flex flex-col items-center gap-2 group">
                                <div className="w-14 h-14 rounded-2xl bg-white/5 group-hover:bg-cos-accent group-hover:shadow-lg group-hover:shadow-cos-accent/30 flex items-center justify-center transition-all border border-white/5 group-hover:border-transparent">
                                    <IconSkin className="w-7 h-7 text-white/70 group-hover:text-white" />
                                </div>
                                <span className="text-[10px] font-bold text-white/60 group-hover:text-white">美肌</span>
                            </button>
                            <button onClick={() => handleBeautyAI('contour')} className="flex flex-col items-center gap-2 group">
                                <div className="w-14 h-14 rounded-2xl bg-white/5 group-hover:bg-purple-600 group-hover:shadow-lg group-hover:shadow-purple-600/30 flex items-center justify-center transition-all border border-white/5 group-hover:border-transparent">
                                    <IconFace className="w-7 h-7 text-white/70 group-hover:text-white" />
                                </div>
                                <span className="text-[10px] font-bold text-white/60 group-hover:text-white">AI立体感</span>
                            </button>
                            <button onClick={() => handleBeautyAI('skin_high')} className="flex flex-col items-center gap-2 group">
                                <div className="w-14 h-14 rounded-2xl bg-white/5 group-hover:bg-pink-500 group-hover:shadow-lg group-hover:shadow-pink-500/30 flex items-center justify-center transition-all border border-white/5 group-hover:border-transparent">
                                    <IconBeauty className="w-7 h-7 text-white/70 group-hover:text-white" />
                                </div>
                                <span className="text-[10px] font-bold text-white/60 group-hover:text-white">AI高画質</span>
                            </button>
                            <button onClick={() => handleBeautyAI('body')} className="flex flex-col items-center gap-2 group">
                                <div className="w-14 h-14 rounded-2xl bg-white/5 group-hover:bg-blue-500 group-hover:shadow-lg group-hover:shadow-blue-500/30 flex items-center justify-center transition-all border border-white/5 group-hover:border-transparent">
                                    <IconBody className="w-7 h-7 text-white/70 group-hover:text-white" />
                                </div>
                                <span className="text-[10px] font-bold text-white/60 group-hover:text-white">スタイル</span>
                            </button>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4 ml-1">手動</h4>
                        <div className="grid grid-cols-4 gap-4">
                            <button onClick={() => setActiveMode(ToolMode.LIQUIFY)} className="flex flex-col items-center gap-2 group">
                                <div className="w-14 h-14 rounded-2xl bg-white/5 group-hover:bg-blue-600 group-hover:shadow-lg group-hover:shadow-blue-600/30 flex items-center justify-center transition-all border border-white/5 group-hover:border-transparent">
                                    <IconLiquify className="w-7 h-7 text-white/70 group-hover:text-white" />
                                </div>
                                <span className="text-[10px] font-bold text-white/60 group-hover:text-white">ゆがみ</span>
                            </button>
                            <button onClick={() => setActiveMode(ToolMode.MAKEUP)} className="flex flex-col items-center gap-2 group">
                                <div className="w-14 h-14 rounded-2xl bg-white/5 group-hover:bg-pink-600 group-hover:shadow-lg group-hover:shadow-pink-600/30 flex items-center justify-center transition-all border border-white/5 group-hover:border-transparent">
                                    <IconBrush className="w-7 h-7 text-white/70 group-hover:text-white" />
                                </div>
                                <span className="text-[10px] font-bold text-white/60 group-hover:text-white">メイク</span>
                            </button>
                        </div>
                    </div>
                </div>
             </div>
        )}

        {/* AI EDIT PANEL */}
        {activeMode === ToolMode.AI_EDIT && (
            <div className="pointer-events-auto bg-zinc-900/95 backdrop-blur-xl border-t border-white/10 p-5 pb-safe rounded-t-3xl animate-slide-up max-h-[80vh] overflow-y-auto no-scrollbar">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white text-sm">AI マジック編集 ({activeLayer?.name})</h3>
                    <button onClick={() => setActiveMode(ToolMode.NONE)} className="p-2 text-white/50"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>

                <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                        <input type="text" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="プロンプトを入力..." className="w-full bg-black/30 border border-white/10 rounded-2xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-cos-accent text-white placeholder-white/30" />
                        <button onClick={handleSavePrompt} disabled={!aiPrompt.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-white/30 hover:text-cos-accent disabled:opacity-30 transition-colors"><IconStar className={`w-5 h-5 ${savedPrompts.some(p => p.text === aiPrompt.trim()) ? 'fill-cos-accent text-cos-accent' : ''}`} /></button>
                    </div>
                    <Button onClick={handleAIEdit} disabled={isLoading || !aiPrompt} className="!rounded-2xl">{isLoading ? <Spinner /> : '生成'}</Button>
                </div>

                {/* Prompts Categories & Content */}
                <div className="mb-2">
                    <div className="flex overflow-x-auto gap-2 no-scrollbar pb-2 border-b border-white/5 mb-2">
                         <button 
                            onClick={() => setActivePromptCategory('saved')}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activePromptCategory === 'saved' ? 'bg-cos-accent text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                         >
                             履歴・保存
                         </button>
                         {PROMPT_CATEGORIES.map(cat => (
                             <button 
                                key={cat.id}
                                onClick={() => setActivePromptCategory(cat.id)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activePromptCategory === cat.id ? 'bg-cos-accent text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                             >
                                 {cat.label}
                             </button>
                         ))}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto no-scrollbar content-start min-h-[100px]">
                        {activePromptCategory === 'saved' && savedPrompts.length === 0 && (
                             <div className="w-full text-center py-4 text-white/30 text-xs">保存されたプロンプトはありません</div>
                        )}
                        
                        {displayPrompts.map((p: any) => (
                             <div key={p.id} className={`flex items-center rounded-full pl-3 pr-1 py-1 transition-colors max-w-full border ${activePromptCategory === 'saved' ? 'bg-cos-accent/20 border-cos-accent/30' : 'bg-white/5 border-white/10'}`}>
                                 <button onClick={() => setAiPrompt(p.text)} className={`text-xs mr-2 truncate max-w-[240px] text-left ${activePromptCategory === 'saved' ? 'text-white hover:text-cos-accent' : 'text-white/80 hover:text-white'}`}>{p.text}</button>
                                 {activePromptCategory === 'saved' && (
                                    <button onClick={(e) => handleDeletePrompt(p.id, e)} className="p-1 hover:text-red-400 text-white/40 rounded-full"><IconTrash className="w-3 h-3"/></button>
                                 )}
                             </div>
                        ))}
                    </div>
                     {activePromptCategory === 'saved' && (
                         <div className="flex gap-2 mt-4 justify-end border-t border-white/5 pt-2">
                             <button onClick={handleDownloadPrompts} className="text-[10px] flex items-center gap-1 text-white/50 hover:text-white"><IconDownload className="w-3 h-3"/> エクスポート</button>
                             <button onClick={() => promptImportInputRef.current?.click()} className="text-[10px] flex items-center gap-1 text-white/50 hover:text-white"><IconImport className="w-3 h-3"/> インポート</button>
                         </div>
                     )}
                </div>

                 {/* Quick Actions (Moved to bottom for better flow) */}
                 <h4 className="text-[10px] uppercase text-white/40 font-bold tracking-wider mb-2 mt-4">クイックツール</h4>
                 <div className="grid grid-cols-2 gap-3">
                     <button 
                        onClick={() => handleAddAiLayer('person')}
                        disabled={isLoading}
                        className="flex items-center gap-3 bg-white/5 hover:bg-cos-accent/20 border border-white/10 hover:border-cos-accent/50 p-3 rounded-xl text-white transition-all group"
                     >
                        <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center group-hover:bg-cos-accent text-white transition-colors">
                             <IconScissors className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <div className="text-sm font-bold">背景削除</div>
                            <div className="text-[10px] text-white/50 group-hover:text-white/80">人物を切り抜き</div>
                        </div>
                     </button>

                     <button 
                         onClick={() => handleAddAiLayer('background')}
                         disabled={isLoading}
                         className="flex items-center gap-3 bg-white/5 hover:bg-blue-500/20 border border-white/10 hover:border-blue-500/50 p-3 rounded-xl text-white transition-all group"
                     >
                        <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center group-hover:bg-blue-500 text-white transition-colors">
                             <IconImage className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <div className="text-sm font-bold">背景抽出</div>
                            <div className="text-[10px] text-white/50 group-hover:text-white/80">背景のみを選択</div>
                        </div>
                     </button>
                </div>
            </div>
        )}

        {/* CAPTION PANEL */}
        {activeMode === ToolMode.CAPTION && (
             <div className="pointer-events-auto bg-zinc-900/95 backdrop-blur-xl border-t border-white/10 p-5 pb-safe rounded-t-3xl animate-slide-up">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white text-sm">SNSキャプション生成</h3>
                    <button onClick={() => setActiveMode(ToolMode.NONE)} className="p-2 text-white/50"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>
                {!captionResult ? (
                        <Button onClick={async () => { if(imageState.original) { setIsLoading(true); try { const r = await generateCosplayCaption(imageState.original); setCaptionResult(r); } catch(e){showToast("エラー", "error");} finally {setIsLoading(false);} } }} fullWidth disabled={isLoading}>{isLoading ? <Spinner /> : 'キャプションを生成'}</Button>
                ) : (
                    <div className="space-y-4">
                        <div className="bg-black/30 p-4 rounded-2xl border border-white/10"><p className="text-sm mb-3 leading-relaxed">{captionResult.caption}</p><div className="flex flex-wrap gap-2">{captionResult.hashtags.map((tag, i) => <span key={i} className="text-xs text-cos-accent bg-cos-accent/10 px-2 py-1 rounded-md">#{tag}</span>)}</div></div>
                        <Button variant="secondary" fullWidth onClick={() => { navigator.clipboard.writeText(`${captionResult.caption}\n\n${captionResult.hashtags.map(t => `#${t}`).join(' ')}`); showToast("コピーしました！"); }}>コピー</Button>
                    </div>
                )}
            </div>
        )}

        {/* MAIN NAV BAR */}
        {imageState.original && activeMode === ToolMode.NONE && (
            <div className="pointer-events-auto bg-gradient-to-t from-black via-black/90 to-transparent pb-safe pt-10 px-6 animate-fade-in">
                <div className="flex justify-between items-end max-w-md mx-auto pb-4">
                    <NavButton icon={<IconAdjust/>} label="調整" onClick={() => setActiveMode(ToolMode.ADJUST)} />
                    <NavButton icon={<IconLayers/>} label="レイヤー" onClick={() => setActiveMode(ToolMode.LAYERS)} />
                    
                    <div className="relative -top-6 group">
                        <button onClick={() => setActiveMode(ToolMode.AI_EDIT)} className="bg-white text-black w-16 h-16 rounded-full flex flex-col items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.4)] border-4 border-black/50 active:scale-95 transition-all">
                             <IconMagic className="w-7 h-7"/>
                             <span className="text-[10px] font-bold mt-0.5">AI編集</span>
                        </button>
                    </div>

                    <NavButton icon={<IconCard/>} label="名刺作成" onClick={() => setActiveMode(ToolMode.MEISHI)} />
                    <NavButton icon={<IconBeauty/>} label="美化" onClick={() => setActiveMode(ToolMode.BEAUTY)} />
                </div>
            </div>
        )}
        
        {isLoading && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex flex-col items-center justify-center">
                <div className="bg-zinc-900 p-6 rounded-3xl flex flex-col items-center shadow-2xl border border-white/10">
                    <Spinner />
                    <p className="mt-4 text-white font-medium animate-pulse">処理中...</p>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

const NavButton: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void }> = ({ icon, label, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 p-2 text-white/50 hover:text-white transition-colors active:scale-95">
        {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-6 h-6" })}
        <span className="text-[10px] font-bold tracking-wide">{label}</span>
    </button>
);

const TinySlider: React.FC<{ label: string, value: number, min: number, max: number, onChange: (v: number) => void }> = ({ label, value, min, max, onChange }) => (
    <div className="flex items-center gap-3">
        <span className="text-[10px] text-white/60 w-8 text-right">{label}</span>
        <div className="flex-1 relative h-4 flex items-center">
             <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))} className="w-full h-1 bg-white/20 rounded-full appearance-none"/>
        </div>
        <span className="text-[10px] font-mono text-white/80 w-8">{value}</span>
    </div>
);

export default App;