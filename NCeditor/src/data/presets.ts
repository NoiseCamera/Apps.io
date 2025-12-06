
import { Preset } from '../types';
import { DEFAULT_FILTERS } from '../constants';

export const FACTORY_PRESETS: Preset[] = [
    // --- Basic & Natural ---
    {
        id: 'fp-none',
        name: 'Original',
        filterState: { ...DEFAULT_FILTERS }
    },
    {
        id: 'fp-bright',
        name: 'Bright',
        filterState: { ...DEFAULT_FILTERS, brightness: 10, contrast: 5 }
    },
    {
        id: 'fp-clear',
        name: 'Clear',
        filterState: { ...DEFAULT_FILTERS, brightness: 5, contrast: 10, saturation: 5, sharpen: 10 }
    },
    {
        id: 'fp-fresh',
        name: 'Fresh',
        filterState: { ...DEFAULT_FILTERS, brightness: 8, saturation: 10, temperature: -5 }
    },
    {
        id: 'fp-warm',
        name: 'Warm',
        filterState: { ...DEFAULT_FILTERS, temperature: 15, tint: 5 }
    },
    {
        id: 'fp-cool',
        name: 'Cool',
        filterState: { ...DEFAULT_FILTERS, temperature: -15, brightness: 5 }
    },
    
    // --- Portrait ---
    {
        id: 'fp-beauty',
        name: 'Beauty',
        filterState: { ...DEFAULT_FILTERS, brightness: 10, contrast: 5, saturation: 5, highlights: -10, sharpen: 5 }
    },
    {
        id: 'fp-rosy',
        name: 'Rosy',
        filterState: { ...DEFAULT_FILTERS, brightness: 5, tint: 15, saturation: 5, fade: 5 }
    },
    {
        id: 'fp-peach',
        name: 'Peach',
        filterState: { ...DEFAULT_FILTERS, brightness: 12, contrast: -5, saturation: 10, tint: 10, temperature: 5 }
    },
    {
        id: 'fp-pale',
        name: 'Pale',
        filterState: { ...DEFAULT_FILTERS, brightness: 10, saturation: -15, contrast: 5 }
    },
    
    // --- Film & Retro ---
    {
        id: 'fp-film',
        name: 'Film',
        filterState: { ...DEFAULT_FILTERS, contrast: 10, saturation: -10, grain: 25, fade: 15 }
    },
    {
        id: 'fp-vintage',
        name: 'Vintage',
        filterState: { ...DEFAULT_FILTERS, sepia: 20, contrast: 10, saturation: -10, vignette: 20 }
    },
    {
        id: 'fp-nostalgia',
        name: 'Nostalgia',
        filterState: { ...DEFAULT_FILTERS, brightness: 5, contrast: -10, fade: 20, tint: 10, temperature: 10 }
    },
    {
        id: 'fp-retro-warm',
        name: 'Retro W',
        filterState: { ...DEFAULT_FILTERS, temperature: 20, saturation: -10, contrast: 15, fade: 10 }
    },
    {
        id: 'fp-retro-cool',
        name: 'Retro C',
        filterState: { ...DEFAULT_FILTERS, temperature: -10, tint: -10, fade: 15, contrast: 10 }
    },
    {
        id: 'fp-instant',
        name: 'Instant',
        filterState: { ...DEFAULT_FILTERS, contrast: 15, saturation: 10, highlights: 20, shadows: 10, fade: 5 }
    },
    {
        id: 'fp-fade',
        name: 'Faded',
        filterState: { ...DEFAULT_FILTERS, fade: 40, contrast: -10, saturation: -10 }
    },
    
    // --- Monochrome ---
    {
        id: 'fp-bw',
        name: 'B&W',
        filterState: { ...DEFAULT_FILTERS, grayscale: 100 }
    },
    {
        id: 'fp-bw-contrast',
        name: 'B&W High',
        filterState: { ...DEFAULT_FILTERS, grayscale: 100, contrast: 30, brightness: 5 }
    },
    {
        id: 'fp-bw-soft',
        name: 'B&W Soft',
        filterState: { ...DEFAULT_FILTERS, grayscale: 100, contrast: -10, brightness: 10, fade: 10 }
    },
    {
        id: 'fp-noir',
        name: 'Noir',
        filterState: { ...DEFAULT_FILTERS, grayscale: 100, contrast: 50, brightness: -10, vignette: 40 }
    },
    {
        id: 'fp-sepia',
        name: 'Classic',
        filterState: { ...DEFAULT_FILTERS, sepia: 80, brightness: 5, contrast: 10 }
    },

    // --- Color Grades ---
    {
        id: 'fp-teal-orange',
        name: 'TealOrg',
        filterState: { ...DEFAULT_FILTERS, contrast: 20, saturation: 10, 
            selective: { ...DEFAULT_FILTERS.selective, blues: { hue: -20, saturation: 10, lightness: -10 }, reds: { hue: 10, saturation: 10, lightness: 0 } } }
    },
    {
        id: 'fp-emerald',
        name: 'Emerald',
        filterState: { ...DEFAULT_FILTERS, tint: -30, saturation: 10, brightness: -5, contrast: 10 }
    },
    {
        id: 'fp-violet',
        name: 'Violet',
        filterState: { ...DEFAULT_FILTERS, tint: 40, temperature: -10, fade: 10 }
    },
    {
        id: 'fp-cherry',
        name: 'Cherry',
        filterState: { ...DEFAULT_FILTERS, tint: 20, temperature: 10, saturation: 20, contrast: 10 }
    },
    {
        id: 'fp-gold',
        name: 'Gold',
        filterState: { ...DEFAULT_FILTERS, temperature: 30, saturation: -10, contrast: 10, brightness: 5 }
    },
    {
        id: 'fp-cyber',
        name: 'Cyber',
        filterState: { ...DEFAULT_FILTERS, temperature: -30, tint: 30, contrast: 20, saturation: 30, sharpen: 20 }
    },
    {
        id: 'fp-sunset',
        name: 'Sunset',
        filterState: { ...DEFAULT_FILTERS, temperature: 40, tint: 20, contrast: 15, vignette: 20 }
    },
    {
        id: 'fp-forest',
        name: 'Forest',
        filterState: { ...DEFAULT_FILTERS, temperature: -10, tint: -20, saturation: 15, brightness: -5 }
    },
    {
        id: 'fp-ocean',
        name: 'Ocean',
        filterState: { ...DEFAULT_FILTERS, temperature: -40, saturation: 10, contrast: 10 }
    },

    // --- Mood & Atmosphere ---
    {
        id: 'fp-moody',
        name: 'Moody',
        filterState: { ...DEFAULT_FILTERS, contrast: 10, brightness: -15, saturation: -20, fade: 10 }
    },
    {
        id: 'fp-drama',
        name: 'Drama',
        filterState: { ...DEFAULT_FILTERS, contrast: 40, saturation: -10, sharpen: 30, vignette: 30 }
    },
    {
        id: 'fp-matte',
        name: 'Matte',
        filterState: { ...DEFAULT_FILTERS, contrast: 10, blacks: 30, shadows: 20, fade: 10 }
    },
    {
        id: 'fp-dream',
        name: 'Dream',
        filterState: { ...DEFAULT_FILTERS, brightness: 15, contrast: -15, saturation: 10, blur: 2, fade: 10 }
    },
    {
        id: 'fp-soft',
        name: 'Soft',
        filterState: { ...DEFAULT_FILTERS, contrast: -20, brightness: 10, saturation: -5 }
    },
    {
        id: 'fp-vivid',
        name: 'Vivid',
        filterState: { ...DEFAULT_FILTERS, saturation: 40, vibrance: 20, contrast: 10 }
    },
    {
        id: 'fp-pop',
        name: 'Pop',
        filterState: { ...DEFAULT_FILTERS, saturation: 30, brightness: 10, contrast: 20 }
    },
    {
        id: 'fp-dark',
        name: 'Dark',
        filterState: { ...DEFAULT_FILTERS, brightness: -20, contrast: 20, saturation: -10 }
    },
    
    // --- Artistic ---
    {
        id: 'fp-duo-blue',
        name: 'Duo Blue',
        filterState: { ...DEFAULT_FILTERS, grayscale: 100, temperature: -100, tint: 0, fade: 20 } // Simulated
    },
    {
        id: 'fp-duo-red',
        name: 'Duo Red',
        filterState: { ...DEFAULT_FILTERS, grayscale: 100, temperature: 100, tint: 50, fade: 20 } // Simulated
    },
    {
        id: 'fp-lofi',
        name: 'Lo-Fi',
        filterState: { ...DEFAULT_FILTERS, contrast: 20, saturation: 10, grain: 40, vignette: 40, temperature: 10 }
    },
    {
        id: 'fp-grainy',
        name: 'Grainy',
        filterState: { ...DEFAULT_FILTERS, grain: 60, saturation: -20, contrast: 10 }
    },
    {
        id: 'fp-sharp',
        name: 'Sharp',
        filterState: { ...DEFAULT_FILTERS, sharpen: 60, contrast: 10 }
    },
    {
        id: 'fp-glow',
        name: 'Glow',
        filterState: { ...DEFAULT_FILTERS, brightness: 20, contrast: -10, blur: 3, saturation: 10 }
    },
    
    // --- Seasonal ---
    {
        id: 'fp-spring',
        name: 'Spring',
        filterState: { ...DEFAULT_FILTERS, brightness: 10, tint: 10, saturation: 15 }
    },
    {
        id: 'fp-summer',
        name: 'Summer',
        filterState: { ...DEFAULT_FILTERS, temperature: 10, brightness: 15, saturation: 20, contrast: 10 }
    },
    {
        id: 'fp-autumn',
        name: 'Autumn',
        filterState: { ...DEFAULT_FILTERS, temperature: 20, tint: 10, contrast: 10, saturation: 10, fade: 10 }
    },
    {
        id: 'fp-winter',
        name: 'Winter',
        filterState: { ...DEFAULT_FILTERS, temperature: -20, brightness: 10, contrast: 15, saturation: -5 }
    },
    {
        id: 'fp-snow',
        name: 'Snow',
        filterState: { ...DEFAULT_FILTERS, temperature: -10, brightness: 20, contrast: 5, saturation: -5 }
    }
];
