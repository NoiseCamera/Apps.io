
// --- Color Conversion Helpers ---

export function rgbToHsl(r, g, b, out) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    out[0] = h * 360;
    out[1] = s;
    out[2] = l;
}

export function hslToRgb(h, s, l, out, offset = 0) {
    let r, g, b;
    // Normalize hue to 0-1
    h = h % 360;
    if (h < 0) h += 360;
    h /= 360;

    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    // Write directly to output array if provided, or return array
    if (out) {
        out[offset] = Math.min(255, Math.max(0, Math.round(r * 255)));
        out[offset + 1] = Math.min(255, Math.max(0, Math.round(g * 255)));
        out[offset + 2] = Math.min(255, Math.max(0, Math.round(b * 255)));
    }
    return [r * 255, g * 255, b * 255];
}

// --- Selective Color Processing ---

export function processSelectiveAdjustments(data, selective) {
    // Check if any adjustments are actually needed
    const hasAdjustments = Object.values(selective).some(v => v.hue !== 0 || v.saturation !== 0 || v.lightness !== 0);
    if (!hasAdjustments) return;

    const targets = [
        { hue: 0, range: 45, ...selective.reds },    // Red
        { hue: 60, range: 45, ...selective.yellows }, // Yellow
        { hue: 120, range: 45, ...selective.greens }, // Green
        { hue: 180, range: 45, ...selective.cyans },  // Cyan
        { hue: 240, range: 45, ...selective.blues },  // Blue
        { hue: 300, range: 45, ...selective.magentas }, // Magenta
    ];

    const hsl = new Float32Array(3); // Reuse memory
    const len = data.length;

    for (let i = 0; i < len; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        rgbToHsl(r, g, b, hsl);
        const h = hsl[0];
        const s = hsl[1];
        const l = hsl[2];

        let newH = h;
        let newS = s;
        let newL = l;
        let modified = false;

        // Check ranges
        // Optimization: Unroll or keep simple. The loop over 6 targets is fast enough.
        for (let j = 0; j < 6; j++) {
            const t = targets[j];
            // Skip if no adjustment for this color
            if (t.hue === 0 && t.saturation === 0 && t.lightness === 0) continue;

            let diff = Math.abs(h - t.hue);
            if (diff > 180) diff = 360 - diff;

            if (diff < t.range) {
                const weight = 1 - (diff / t.range); // Linear falloff
                if (t.hue !== 0) newH += t.hue * weight;
                if (t.saturation !== 0) newS += (t.saturation / 100) * weight;
                if (t.lightness !== 0) newL += (t.lightness / 100) * weight;
                modified = true;
            }
        }

        if (modified) {
            newS = Math.max(0, Math.min(1, newS));
            newL = Math.max(0, Math.min(1, newL));
            hslToRgb(newH, newS, newL, data, i);
        }
    }
}

// --- LUT Helper ---
export function createSplineLUT(points) {
    const lut = new Uint8Array(256);
    const sorted = [...points].sort((a, b) => a.x - b.x);
    const n = sorted.length;

    const m = new Float32Array(n);
    const dx = new Float32Array(n - 1);
    const dy = new Float32Array(n - 1);
    const slope = new Float32Array(n - 1);

    for (let i = 0; i < n - 1; i++) {
        dx[i] = sorted[i + 1].x - sorted[i].x;
        dy[i] = sorted[i + 1].y - sorted[i].y;
        slope[i] = dy[i] / dx[i];
    }

    m[0] = slope[0];
    m[n - 1] = slope[n - 2];

    for (let i = 0; i < n - 1; i++) {
        if (slope[i] === 0) { m[i] = 0; m[i + 1] = 0; }
    }

    for (let i = 1; i < n - 1; i++) {
        if (slope[i - 1] * slope[i] <= 0) { m[i] = 0; }
        else {
            const w1 = dx[i - 1] + dx[i];
            m[i] = (3 * w1) / ((w1 + dx[i]) / slope[i - 1] + (w1 + dx[i - 1]) / slope[i]);
        }
    }

    let currentSegment = 0;
    for (let i = 0; i < 256; i++) {
        const t = i / 255;
        while (currentSegment < n - 2 && t > sorted[currentSegment + 1].x) { currentSegment++; }
        const p0 = sorted[currentSegment];
        const h = dx[currentSegment];
        if (h === 0) { lut[i] = Math.max(0, Math.min(255, p0.y * 255)); continue; }
        const diff = t - p0.x;
        const t2 = diff / h;
        const t3 = t2 * t2 * t2;
        const t2_sq = t2 * t2;
        const h00 = 2 * t3 - 3 * t2_sq + 1;
        const h10 = t3 - 2 * t2_sq + t2;
        const h01 = -2 * t3 + 3 * t2_sq;
        const h11 = t3 - t2_sq;
        const y = h00 * p0.y + h10 * h * m[currentSegment] + h01 * sorted[currentSegment + 1].y + h11 * h * m[currentSegment + 1];
        lut[i] = Math.max(0, Math.min(255, Math.round(y * 255)));
    }
    return lut;
}
