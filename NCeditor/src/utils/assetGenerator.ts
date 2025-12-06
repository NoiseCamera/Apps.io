
/**
 * Utility to generate high-quality assets (Text, Effects) on Canvas
 * and return them as Data URLs for use in layers.
 */

export const generateTextLayerImage = (
    text: string,
    fontFamily: string,
    color: string,
    isVertical: boolean = false,
    hasShadow: boolean = false,
    hasStroke: boolean = false,
    align: 'left' | 'center' | 'right' = 'center'
): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // High resolution for sharpness
    const fontSize = 100;
    const padding = 60; // Increased padding for shadows
    
    ctx.font = `bold ${fontSize}px "${fontFamily}", sans-serif`;
    
    // Calculate dimensions
    // For simplicity in vertical mode, we don't do complex multi-line auto-wrap yet
    const lines = text.split('\n');
    
    let maxWidth = 0;
    let totalHeight = 0;
    const lineHeight = fontSize * 1.2;

    if (isVertical) {
        // Vertical logic (simplified for single column usually, but let's handle height)
        // Vertical writing usually treats "lines" as columns from right to left, 
        // but for basic sticker implementation we'll do a single vertical column per line for now or just 1 line support mostly.
        // Let's stick to simple char stacking.
        const chars = text.split('');
        maxWidth = fontSize + padding * 2;
        totalHeight = (chars.length * lineHeight) + padding * 2;
        
        canvas.width = maxWidth;
        canvas.height = totalHeight;
    } else {
        // Horizontal Logic
        lines.forEach(line => {
            const w = ctx.measureText(line).width;
            if (w > maxWidth) maxWidth = w;
        });
        totalHeight = (lines.length * lineHeight) + padding * 2;
        maxWidth += padding * 2;
        
        canvas.width = maxWidth;
        canvas.height = totalHeight;
    }

    // Redefine context after resize
    ctx.font = `bold ${fontSize}px "${fontFamily}", sans-serif`;
    ctx.textBaseline = 'top';
    
    // Shadow
    if (hasShadow) {
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 4;
    }

    ctx.fillStyle = color;
    ctx.strokeStyle = color === '#ffffff' || color === '#fff' ? '#000000' : '#ffffff';
    ctx.lineWidth = 6;
    ctx.lineJoin = 'round';

    if (isVertical) {
        ctx.textAlign = 'center';
        let y = padding;
        const x = canvas.width / 2;
        // Simple vertical stack of chars
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            // Skip newlines in strictly vertical mode if just stacking
            if(char === '\n') continue; 
            
            if (hasStroke) ctx.strokeText(char, x, y);
            ctx.fillText(char, x, y);
            y += lineHeight;
        }
    } else {
        // Horizontal Alignment
        ctx.textAlign = align;
        let x = padding;
        if (align === 'center') x = canvas.width / 2;
        if (align === 'right') x = canvas.width - padding;
        if (align === 'left') x = padding;

        let y = padding;
        lines.forEach(line => {
            if (hasStroke) ctx.strokeText(line, x, y);
            ctx.fillText(line, x, y);
            y += lineHeight;
        });
    }

    return canvas.toDataURL('image/png');
};

// Helper functions
const rand = (min: number, max: number) => Math.random() * (max - min) + min;
const randomColor = (colors: string[]) => colors[Math.floor(Math.random() * colors.length)];

export const generateEffectLayer = (type: string, width: number, height: number): string => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const cx = width / 2;
    const cy = height / 2;
    const minDim = Math.min(width, height);
    const maxDim = Math.max(width, height);

    // --- LIGHT ---
    if (type === 'sparkle') {
        const count = 40;
        ctx.shadowBlur = 15; ctx.shadowColor = '#ffffff'; ctx.fillStyle = '#ffffff';
        for(let i=0; i<count; i++) {
            const x = rand(0, width); const y = rand(0, height); const size = rand(10, 40);
            ctx.globalAlpha = rand(0.5, 1);
            ctx.beginPath(); ctx.moveTo(x - size, y); ctx.lineTo(x + size, y); ctx.moveTo(x, y - size); ctx.lineTo(x, y + size);
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
            ctx.beginPath(); ctx.arc(x, y, size * 0.15, 0, Math.PI * 2); ctx.fill();
        }
    }
    else if (type === 'bokeh_white') {
        for(let i=0; i<50; i++) {
            const x = rand(0, width); const y = rand(0, height); const r = rand(20, 100);
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.globalAlpha = rand(0.05, 0.2); ctx.fill();
        }
    }
    else if (type === 'bokeh_color') {
        const colors = ['#ffcccc', '#ccffcc', '#ccccff', '#ffffcc'];
        for(let i=0; i<50; i++) {
            const x = rand(0, width); const y = rand(0, height); const r = rand(20, 100);
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = randomColor(colors); ctx.globalAlpha = rand(0.05, 0.15); ctx.fill();
        }
    }
    else if (type === 'lensflare') {
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, width);
        g.addColorStop(0, 'rgba(255, 255, 255, 0.9)'); g.addColorStop(0.1, 'rgba(255, 240, 200, 0.5)');
        g.addColorStop(0.4, 'rgba(200, 100, 255, 0.1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.translate(width * 0.2, height * 0.2); ctx.fillStyle = g; ctx.fillRect(-width, -height, width*2, height*2);
        ctx.resetTransform();
        const lineG = ctx.createLinearGradient(width*0.2, height*0.2, width*0.8, height*0.8);
        lineG.addColorStop(0, 'rgba(255,255,255,0)'); lineG.addColorStop(0.5, 'rgba(200,240,255,0.4)'); lineG.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = lineG; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(width*0.2, height*0.2); ctx.lineTo(width*0.8, height*0.8); ctx.stroke();
    }
    else if (type === 'lightleak_warm') {
        const g = ctx.createLinearGradient(0, 0, width * 0.4, height);
        g.addColorStop(0, 'rgba(255, 100, 50, 0.6)'); g.addColorStop(0.5, 'rgba(255, 200, 100, 0.2)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, width, height);
    }
    else if (type === 'lightleak_cool') {
        const g = ctx.createLinearGradient(width, 0, width * 0.6, height);
        g.addColorStop(0, 'rgba(50, 100, 255, 0.6)'); g.addColorStop(0.5, 'rgba(100, 200, 255, 0.2)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, width, height);
    }
    else if (type === 'sunbeams') {
        ctx.translate(width/2, -100); ctx.fillStyle = 'rgba(255,255,220,0.15)';
        for(let i=0; i<15; i++) {
            ctx.rotate(rand(-0.5, 0.5)); ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-50, height*1.5); ctx.lineTo(50, height*1.5); ctx.fill(); ctx.rotate(rand(-0.5, 0.5));
        }
    }
    else if (type === 'spotlight') {
        const g = ctx.createRadialGradient(cx, cy, minDim * 0.1, cx, cy, minDim * 0.8);
        g.addColorStop(0, 'rgba(255,255,255,0.3)'); g.addColorStop(1, 'rgba(0,0,0,0.8)');
        ctx.fillStyle = g; ctx.fillRect(0,0,width,height);
    }
    else if (type === 'neon_ring') {
        ctx.shadowBlur = 20; ctx.shadowColor = '#00ffcc'; ctx.strokeStyle = '#00ffcc'; ctx.lineWidth = 10;
        ctx.beginPath(); ctx.arc(cx, cy, minDim*0.3, 0, Math.PI*2); ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3; ctx.stroke();
    }
    else if (type === 'laser') {
        ctx.shadowBlur = 15; ctx.shadowColor = '#ff0055'; ctx.strokeStyle = '#ff0055'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(width, cy); ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
    }
    else if (type === 'rainbow') {
        const g = ctx.createLinearGradient(0,0,width,height);
        g.addColorStop(0,'rgba(255,0,0,0.3)'); g.addColorStop(0.2,'rgba(255,255,0,0.3)'); g.addColorStop(0.4,'rgba(0,255,0,0.3)');
        g.addColorStop(0.6,'rgba(0,255,255,0.3)'); g.addColorStop(0.8,'rgba(0,0,255,0.3)'); g.addColorStop(1,'rgba(255,0,255,0.3)');
        ctx.fillStyle = g; ctx.fillRect(0,0,width,height);
    }
    else if (type === 'shimmer') {
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        for(let i=0; i<100; i++) {
            const x = rand(0,width); const y = rand(0,height);
            const size = rand(2,6);
            ctx.beginPath(); ctx.moveTo(x,y-size); ctx.lineTo(x+size*0.5,y); ctx.lineTo(x,y+size); ctx.lineTo(x-size*0.5,y); ctx.fill();
        }
    }
    else if (type === 'glow_orb') {
        const g = ctx.createRadialGradient(cx,cy, 0, cx,cy, minDim*0.5);
        g.addColorStop(0, 'rgba(255,200,100,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(0,0,width,height);
    }

    // --- WEATHER ---
    else if (type === 'rain') {
        ctx.strokeStyle = 'rgba(200,230,255,0.6)'; ctx.lineWidth = 2;
        for(let i=0; i<300; i++) {
            const x = rand(0, width); const y = rand(0, height); const len = rand(20, 50);
            ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 5, y + len); ctx.stroke();
        }
    }
    else if (type === 'snow') {
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        for(let i=0; i<400; i++) {
            const x = rand(0, width); const y = rand(0, height); const r = rand(1, 4);
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
        }
    }
    else if (type === 'fog') {
        for (let i=0; i<30; i++) {
             const x = rand(0, width); const y = rand(0, height); const r = minDim * rand(0.3, 0.6);
             const g = ctx.createRadialGradient(x, y, 0, x, y, r);
             g.addColorStop(0, 'rgba(255,255,255,0.15)'); g.addColorStop(1, 'rgba(255,255,255,0)');
             ctx.fillStyle = g; ctx.fillRect(x-r, y-r, r*2, r*2);
        }
    }
    else if (type === 'lightning') {
        ctx.shadowBlur = 20; ctx.shadowColor = '#ccddff'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
        ctx.beginPath(); let x = rand(width*0.2, width*0.8); let y = 0; ctx.moveTo(x, y);
        while(y < height) { x += rand(-30, 30); y += rand(20, 60); ctx.lineTo(x, y); }
        ctx.stroke();
    }
    else if (type === 'aurora') {
        const g = ctx.createLinearGradient(0, 0, width, 0);
        g.addColorStop(0, 'rgba(0,255,100,0)'); g.addColorStop(0.5, 'rgba(0,255,200,0.4)'); g.addColorStop(1, 'rgba(0,100,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, height*0.2);
        ctx.bezierCurveTo(width*0.3, height*0.1, width*0.6, height*0.4, width, height*0.2);
        ctx.lineTo(width, height*0.5); ctx.bezierCurveTo(width*0.6, height*0.7, width*0.3, height*0.4, 0, height*0.5); ctx.fill();
    }
    else if (type === 'fire_embers') {
        ctx.shadowBlur = 5; ctx.shadowColor = '#ffaa00';
        const colors = ['#ff4400', '#ffaa00', '#ffff00'];
        for(let i=0; i<100; i++) {
            const x = rand(0, width); const y = rand(0, height); const r = rand(1, 3);
            ctx.fillStyle = randomColor(colors); ctx.globalAlpha = rand(0.5, 1);
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
        }
    }
    else if (type === 'smoke') {
        for (let i=0; i<20; i++) {
             const x = rand(0, width); const y = rand(height/2, height); const r = minDim * rand(0.2, 0.5);
             const g = ctx.createRadialGradient(x, y, 0, x, y, r);
             g.addColorStop(0, 'rgba(0,0,0,0.4)'); g.addColorStop(1, 'rgba(0,0,0,0)');
             ctx.fillStyle = g; ctx.fillRect(x-r, y-r, r*2, r*2);
        }
    }
    else if (type === 'bubbles') {
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2;
        for(let i=0; i<30; i++) {
            const x = rand(0, width); const y = rand(0, height); const r = rand(10, 40);
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fill();
            ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(x+r*0.3, y-r*0.3, r*0.2, 0, Math.PI*2); ctx.fill();
        }
    }
    else if (type === 'galaxy') {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, width);
        g.addColorStop(0, 'rgba(20,0,50,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(0,0,width,height);
        ctx.fillStyle = 'white'; for(let i=0; i<500; i++) { ctx.globalAlpha = rand(0, 1); ctx.beginPath(); ctx.arc(rand(0,width), rand(0,height), rand(0.5, 1.5), 0, Math.PI*2); ctx.fill(); }
    }
    else if (type === 'blizzard') {
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        for(let i=0; i<500; i++) {
            const x = rand(0,width); const y = rand(0,height);
            ctx.beginPath(); ctx.arc(x,y, rand(1,3), 0, Math.PI*2); ctx.fill();
        }
        ctx.fillStyle = 'rgba(200,230,255,0.3)'; ctx.fillRect(0,0,width,height);
    }
    else if (type === 'dust') {
        ctx.fillStyle = 'rgba(200,200,200,0.5)';
        for(let i=0; i<300; i++) { ctx.fillRect(rand(0,width), rand(0,height), 2, 2); }
    }
    else if (type === 'heatwave') {
        ctx.fillStyle = 'rgba(255,100,0,0.1)';
        for(let i=0; i<20; i++) {
            const y = rand(height/2, height);
            ctx.fillRect(0, y, width, rand(10,30));
        }
    }

    // --- NATURE ---
    else if (type === 'cherry_petals') {
        ctx.fillStyle = '#ffccdd';
        for(let i=0; i<60; i++) {
            const x = rand(0, width); const y = rand(0, height); const size = rand(10, 20);
            ctx.save(); ctx.translate(x, y); ctx.rotate(rand(0, Math.PI));
            ctx.beginPath(); ctx.ellipse(0, 0, size, size*0.6, 0, 0, Math.PI*2); ctx.fill(); ctx.restore();
        }
    }
    else if (type === 'rose_petals') {
        ctx.fillStyle = '#aa0022';
        for(let i=0; i<40; i++) {
            const x = rand(0, width); const y = rand(0, height); const size = rand(15, 30);
            ctx.save(); ctx.translate(x, y); ctx.rotate(rand(0, Math.PI));
            ctx.beginPath(); ctx.arc(0, 0, size, 0, Math.PI*1.5); ctx.fill(); ctx.restore();
        }
    }
    else if (type === 'autumn_leaves') {
        const colors = ['#e36b2c', '#d49e3b', '#a33115'];
        for(let i=0; i<40; i++) {
            ctx.fillStyle = randomColor(colors);
            const x = rand(0, width); const y = rand(0, height); const size = rand(20, 40);
            ctx.save(); ctx.translate(x, y); ctx.rotate(rand(0, Math.PI));
            ctx.beginPath(); ctx.moveTo(0, -size); ctx.quadraticCurveTo(size, 0, 0, size); ctx.quadraticCurveTo(-size, 0, 0, -size); ctx.fill(); ctx.restore();
        }
    }
    else if (type === 'feathers_white') {
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        for(let i=0; i<30; i++) {
            const x = rand(0, width); const y = rand(0, height); const l = rand(30, 60);
            ctx.save(); ctx.translate(x, y); ctx.rotate(rand(0, Math.PI));
            ctx.beginPath(); ctx.ellipse(0, 0, l, l*0.2, 0, 0, Math.PI*2); ctx.fill(); ctx.restore();
        }
    }
    else if (type === 'feathers_black') {
        ctx.fillStyle = 'rgba(0,0,0,0.9)';
        for(let i=0; i<30; i++) {
            const x = rand(0, width); const y = rand(0, height); const l = rand(30, 60);
            ctx.save(); ctx.translate(x, y); ctx.rotate(rand(0, Math.PI));
            ctx.beginPath(); ctx.ellipse(0, 0, l, l*0.2, 0, 0, Math.PI*2); ctx.fill(); ctx.restore();
        }
    }
    else if (type === 'dandelion') {
        ctx.strokeStyle = 'white'; ctx.lineWidth = 1;
        for(let i=0; i<40; i++) {
            const x = rand(0, width); const y = rand(0, height);
            ctx.save(); ctx.translate(x, y); for(let j=0; j<8; j++) { ctx.rotate(Math.PI/4); ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0, 15); ctx.stroke(); } ctx.restore();
        }
    }
    else if (type === 'hearts') {
        ctx.fillStyle = '#ff99aa';
        for(let i=0; i<30; i++) {
            const x = rand(0, width); const y = rand(0, height); const s = rand(0.5, 2);
            ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(rand(-0.5, 0.5));
            ctx.beginPath(); ctx.moveTo(0,0); ctx.bezierCurveTo(-5,-5, -10,0, 0,10); ctx.bezierCurveTo(10,0, 5,-5, 0,0); ctx.fill(); ctx.restore();
        }
    }
    else if (type === 'stars') {
        ctx.fillStyle = '#ffeeaa'; ctx.shadowBlur = 5; ctx.shadowColor = 'gold';
        for(let i=0; i<40; i++) {
            const x = rand(0, width); const y = rand(0, height); const s = rand(5, 15);
            ctx.beginPath(); for(let j=0; j<5; j++) { ctx.lineTo(Math.cos((18+j*72)/180*Math.PI)*s + x, -Math.sin((18+j*72)/180*Math.PI)*s + y); ctx.lineTo(Math.cos((54+j*72)/180*Math.PI)*(s/2) + x, -Math.sin((54+j*72)/180*Math.PI)*(s/2) + y); } ctx.closePath(); ctx.fill();
        }
    }
    else if (type === 'notes') {
        ctx.fillStyle = '#ffffff'; ctx.font = '40px serif';
        const notes = ['♪', '♫', '♬']; for(let i=0; i<20; i++) { ctx.fillText(randomColor(notes), rand(0,width), rand(0,height)); }
    }
    else if (type === 'butterflies') {
        const colors = ['#44aaff', '#ffaa44', '#aa44ff'];
        for(let i=0; i<15; i++) {
            ctx.fillStyle = randomColor(colors); const x = rand(0, width); const y = rand(0, height); const s = rand(10, 20);
            ctx.save(); ctx.translate(x, y); ctx.rotate(rand(0, Math.PI*2));
            ctx.beginPath(); ctx.ellipse(-s/2, 0, s, s/2, Math.PI/4, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.ellipse(s/2, 0, s, s/2, -Math.PI/4, 0, Math.PI*2); ctx.fill(); ctx.restore();
        }
    }
    else if (type === 'spiderweb') {
        ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1;
        ctx.beginPath();
        for(let i=0; i<10; i++) { ctx.moveTo(0,0); ctx.lineTo(rand(200, 400), rand(200, 400)); }
        for(let i=20; i<200; i+=20) { ctx.moveTo(i, 0); ctx.arc(0,0, i, 0, Math.PI/2); }
        ctx.stroke();
    }
    else if (type === 'ivy') {
        ctx.strokeStyle = 'green'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(0, height);
        ctx.bezierCurveTo(100, height-100, 0, height-300, 100, height-400);
        ctx.stroke();
    }

    // --- TEXTURE ---
    else if (type === 'vignette') {
        const g = ctx.createRadialGradient(cx, cy, minDim*0.4, cx, cy, minDim*0.8);
        g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.8)');
        ctx.fillStyle = g; ctx.fillRect(0,0,width,height);
    }
    else if (type === 'film_grain') {
        const imgData = ctx.createImageData(width, height);
        for(let i=0; i<imgData.data.length; i+=4) {
            const v = Math.random() * 255;
            imgData.data[i] = v; imgData.data[i+1] = v; imgData.data[i+2] = v; imgData.data[i+3] = 30;
        }
        ctx.putImageData(imgData, 0, 0);
    }
    else if (type === 'noise') {
        const imgData = ctx.createImageData(width, height);
        for(let i=0; i<imgData.data.length; i+=4) {
            imgData.data[i] = Math.random() * 255; imgData.data[i+1] = Math.random() * 255; imgData.data[i+2] = Math.random() * 255; imgData.data[i+3] = 40;
        }
        ctx.putImageData(imgData, 0, 0);
    }
    else if (type === 'glitch') {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'; ctx.fillRect(10, 0, width, height);
        ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = 'rgba(0, 255, 255, 0.3)'; ctx.fillRect(-10, 0, width, height);
        ctx.fillStyle = 'rgba(0,0,0,0.2)'; for(let i=0; i<height; i+=4) ctx.fillRect(0, i, width, 1);
    }
    else if (type === 'scanlines') {
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; for(let i=0; i<height; i+=6) ctx.fillRect(0, i, width, 3);
    }
    else if (type === 'vhs') {
        ctx.fillStyle = 'rgba(255, 0, 255, 0.1)'; ctx.fillRect(5, 0, width, height);
        ctx.fillStyle = 'rgba(0, 255, 0, 0.1)'; ctx.fillRect(-5, 0, width, height);
        for(let i=0; i<50; i++) { ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(0, rand(0,height), width, rand(1,3)); }
    }
    else if (type === 'paper') {
        ctx.fillStyle = '#fdfbf7'; ctx.fillRect(0,0,width,height);
        ctx.globalCompositeOperation = 'multiply';
        for(let i=0; i<1000; i++) { ctx.fillStyle = 'rgba(100,80,60,0.1)'; ctx.fillRect(rand(0,width), rand(0,height), 2, 2); }
    }
    else if (type === 'cracked_glass') {
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2;
        const cx = rand(width*0.2, width*0.8); const cy = rand(height*0.2, height*0.8);
        for(let i=0; i<10; i++) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + rand(-200, 200), cy + rand(-200, 200)); ctx.stroke(); }
    }
    else if (type === 'blood') {
        ctx.fillStyle = 'rgba(180, 0, 0, 0.7)';
        for(let i=0; i<10; i++) {
            const x = rand(0, width); const y = rand(0, height); const r = rand(10, 50);
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill(); ctx.fillRect(x-r/2, y, r, rand(50, 150));
        }
    }
    else if (type === 'cobweb') {
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1;
        const cornerX = 0, cornerY = 0;
        for(let i=0; i<10; i++) { ctx.beginPath(); ctx.moveTo(cornerX, cornerY); ctx.lineTo(rand(100, 300), rand(100, 300)); ctx.stroke(); }
        for(let i=0; i<5; i++) { ctx.beginPath(); ctx.arc(cornerX, cornerY, i*50, 0, Math.PI/2); ctx.stroke(); }
    }
    else if (type === 'grunge') {
        ctx.fillStyle = 'rgba(50,50,50,0.3)';
        for(let i=0; i<50; i++) {
            const x = rand(0,width); const y = rand(0,height); const w = rand(10,100); const h = rand(10,100);
            ctx.fillRect(x,y,w,h);
        }
    }
    else if (type === 'fabric') {
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        for(let i=0; i<width; i+=4) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,height); ctx.stroke(); }
        for(let i=0; i<height; i+=4) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(width,i); ctx.stroke(); }
    }

    // --- MANGA/SPECIAL ---
    else if (type === 'speed_lines') {
        ctx.fillStyle = 'black';
        for(let i=0; i<200; i++) {
            const angle = rand(0, Math.PI*2); const len = rand(minDim*0.2, minDim*0.5); const w = rand(1, 5);
            ctx.save(); ctx.translate(cx, cy); ctx.rotate(angle); ctx.fillRect(minDim*0.4, -w/2, len, w); ctx.restore();
        }
    }
    else if (type === 'concentration') {
        ctx.strokeStyle = 'black'; ctx.lineWidth = 2;
        for(let i=0; i<100; i++) {
            const angle = (i / 100) * Math.PI * 2;
            ctx.save(); ctx.translate(cx, cy); ctx.rotate(angle); ctx.beginPath(); ctx.moveTo(minDim*0.4, 0); ctx.lineTo(maxDim, 0); ctx.stroke(); ctx.restore();
        }
    }
    else if (type === 'cyber_grid') {
        ctx.strokeStyle = '#00ff00'; ctx.lineWidth = 2; ctx.shadowBlur = 5; ctx.shadowColor = '#00ff00';
        for(let i=0; i<width; i+=50) { ctx.beginPath(); ctx.moveTo(i, height); ctx.lineTo(cx, height*0.6); ctx.stroke(); }
        for(let i=height*0.6; i<height; i+=30) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke(); }
    }
    else if (type === 'matrix') {
        ctx.fillStyle = '#00ff00'; ctx.font = '20px monospace';
        for(let i=0; i<50; i++) {
            const x = rand(0, width); let y = rand(0, height); const len = rand(5, 20);
            for(let j=0; j<len; j++) { ctx.globalAlpha = 1 - (j/len); ctx.fillText(String.fromCharCode(0x30A0 + Math.random() * 96), x, y + j*20); }
        }
    }
    else if (type === 'magic_circle') {
        ctx.strokeStyle = '#ffcc00'; ctx.lineWidth = 3; ctx.shadowBlur = 10; ctx.shadowColor='gold';
        ctx.beginPath(); ctx.arc(cx, cy, minDim*0.3, 0, Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, minDim*0.25, 0, Math.PI*2); ctx.stroke();
        const r = minDim*0.3; ctx.beginPath(); for(let i=0; i<3; i++) { const a = (Math.PI*2 * i / 3) - Math.PI/2; ctx.lineTo(cx + Math.cos(a)*r, cy + Math.sin(a)*r); } ctx.closePath(); ctx.stroke();
    }
    else if (type === 'confetti') {
        const colors = ['#f00', '#0f0', '#00f', '#ff0', '#0ff', '#f0f'];
        for(let i=0; i<100; i++) {
            ctx.fillStyle = randomColor(colors); ctx.save(); ctx.translate(rand(0,width), rand(0,height)); ctx.rotate(rand(0,Math.PI)); ctx.fillRect(0,0, 10, 5); ctx.restore();
        }
    }
    else if (type === 'gold_dust') {
        ctx.fillStyle = '#ffd700'; ctx.shadowBlur = 5; ctx.shadowColor='gold';
        for(let i=0; i<200; i++) {
            const x = rand(0, width); const y = rand(0, height); const r = rand(1, 3); ctx.globalAlpha = rand(0.5, 1); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
        }
    }
    else if (type === 'fireworks') {
        for(let n=0; n<5; n++) {
            const fx = rand(width*0.2, width*0.8); const fy = rand(height*0.2, height*0.6); const color = randomColor(['#ff0000', '#00ff00', '#0000ff', '#ffff00']); ctx.fillStyle = color;
            for(let i=0; i<50; i++) { const a = Math.random() * Math.PI * 2; const d = rand(0, 100); ctx.beginPath(); ctx.arc(fx + Math.cos(a)*d, fy + Math.sin(a)*d, 2, 0, Math.PI*2); ctx.fill(); }
        }
    }
    else if (type === 'halo') {
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 5; ctx.shadowBlur = 20; ctx.shadowColor = 'white';
        ctx.beginPath(); ctx.ellipse(cx, height*0.2, minDim*0.2, minDim*0.05, 0, 0, Math.PI*2); ctx.stroke();
    }
    else if (type === 'dark_aura') {
        const g = ctx.createRadialGradient(cx, cy, minDim*0.2, cx, cy, minDim*0.6); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(50,0,50,0.8)'); ctx.fillStyle = g; ctx.fillRect(0,0,width,height);
        ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 5; ctx.filter = 'blur(5px)';
        for(let i=0; i<20; i++) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.quadraticCurveTo(rand(0,width), rand(0,height), rand(0,width), rand(0,height)); ctx.stroke(); }
    }
    else if (type === 'shockwave') {
        ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 10;
        ctx.beginPath(); ctx.arc(cx, cy, minDim*0.4, 0, Math.PI*2); ctx.stroke();
        ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cx, cy, minDim*0.5, 0, Math.PI*2); ctx.stroke();
    }
    else if (type === 'pop_dots') {
        ctx.fillStyle = 'rgba(255,0,100,0.2)';
        for(let x=0; x<width; x+=30) {
            for(let y=0; y<height; y+=30) { ctx.beginPath(); ctx.arc(x,y, 10, 0, Math.PI*2); ctx.fill(); }
        }
    }

    return canvas.toDataURL('image/png');
}
