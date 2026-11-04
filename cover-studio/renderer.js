/**
 * Canvas 2D 确定性渲染器（v1.4）
 * 模板 JSON → 像素画布，导出与预览共用同一路径
 *
 * v1.4 新增：
 *  - 比例自适应：layer.at = { portrait|tall|square|wide: {覆盖字段} }
 *  - 背景纹理：background.pattern / pattern 图层（dots 网点 / halftone 渐变网点 / stripes 斜纹 / rays 放射线 / noise 噪点 / grid 方格）
 *  - 矢量装饰 shape：rect ellipse star burst sparkle arrow wave bubble tape blob brush(笔触) ring(手绘圈) heart
 *    均支持 stroke / hardShadow（偏移硬阴影）/ rotate / opacity
 *  - 文字：fit:'width' 自动撑满宽度、hardShadow 偏移硬阴影、贴纸外描边、*关键词* 局部着色/高亮色块、autoHighlight:'digits'
 *  - 人物贴纸：image.sticker = { width, color, shadow }，对 alpha 外扩白边 + 深色硬阴影
 *  - 字体：渲染前 document.fonts.load（带超时），失败回退系统黑体
 * 全部确定性：随机量均由图层 id 派生的种子 PRNG 生成。
 *
 * v1.6 设计层（data.design，可逐项关闭）：
 *  - 标题自动断行（1/2 行择优字号）、孤字回挤、标点避头尾（行首+行尾）
 *  - 主副字号比 ≥ 2.2、小字下限 2.6% 短边、统一安全边距 4%
 *  - 文字区自动对比度保障（采样底图亮度，不足时加柔边遮罩）
 *  - 次级元素（徽章/装饰）数量上限 3
 *  - 照片统一调色（对比/饱和/轻锐化/暗角）、贴纸柔和接触投影、可选颗粒
 *  - 一键换配色（PALETTES）、字体风格切换（FONT_STYLES）
 */

window.CoverRenderer = (function () {
  const imageCache = new Map();
  const FALLBACK_STACK = '"Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Source Han Sans SC", "WenQuanYi Micro Hei", sans-serif';

  function pct(v, total) { return (Number(v) / 100) * total; }

  /* ———— v1.6 设计层 ———— */
  const DESIGN_DEFAULT = { autoBreak: true, ratio: 2.2, minFont: 2.6, autoContrast: true, decoLimit: 3, safe: 4, strokeClamp: true,
    grade: true, sharpen: 0.22, vignette: 0.16, softSticker: true, grain: 0, palette: 'none', fontStyle: 'auto', textFx: 'auto', personFx: 'auto' };
  let DESIGN = { ...DESIGN_DEFAULT };
  /** 6 套配色：accent 主强调 / accent2 辅色 / dark 深色 / paper 浅底 */
  const PALETTES = {
    none: { name: '模板原色' },
    neon: { name: '荧光黄黑', accent: '#E6FF3D', accent2: '#FFD400', dark: '#111111', paper: '#F4F4EC' },
    cream: { name: '奶油棕', accent: '#A0642D', accent2: '#E9B872', dark: '#3B2A1E', paper: '#FFF4E4' },
    violet: { name: '紫白', accent: '#7C4DFF', accent2: '#C6B3FF', dark: '#24184A', paper: '#F3EEFF' },
    blueorange: { name: '蓝橙', accent: '#FF7A1A', accent2: '#1E4FFF', dark: '#0B1F55', paper: '#EEF3FF' },
    redyellow: { name: '红黄', accent: '#FFE14D', accent2: '#E5202E', dark: '#1F0A0A', paper: '#FFF3E0' },
    blackgold: { name: '黑金', accent: '#D9B45A', accent2: '#F1E0B0', dark: '#0D0D0D', paper: '#F6EFDF' },
  };
  const FONT_STYLES = {
    auto: { name: '模板默认' },
    heavy: { name: '粗黑', fontFamily: 'Noto Sans SC', fontWeight: '900' },
    serif: { name: '宋体', fontFamily: 'Noto Serif SC', fontWeight: '900' },
    round: { name: '圆润', fontFamily: 'ZCOOL KuaiLe', fontWeight: '400' },
    smiley: { name: '得意黑', fontFamily: 'Smiley Sans', fontWeight: '400' },
    hand: { name: '手写', fontFamily: 'Long Cang', fontWeight: '400' },
  };
  function toRgb(c) {
    if (typeof c !== 'string') return null;
    let m = c.trim().match(/^#([0-9a-f]{3,8})$/i);
    if (m) {
      let h = m[1]; if (h.length <= 4) h = [...h].map((x) => x + x).join('');
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1];
    }
    m = c.match(/^rgba?\(([^)]+)\)/i);
    if (m) { const p = m[1].split(',').map((v) => parseFloat(v)); return [p[0], p[1], p[2], p[3] != null ? p[3] : 1]; }
    return null;
  }
  function hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); const l = (mx + mn) / 2; let h = 0, s = 0;
    if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
    return [h, s, l];
  }
  function mix(a, b, t) { const A = toRgb(a), B = toRgb(b); return [0, 1, 2].map((i) => Math.round(A[i] * (1 - t) + B[i] * t)); }
  const rgbStr = (rgb, a) => (a != null && a < 1 ? `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${+a.toFixed(3)})` : '#' + rgb.slice(0, 3).map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase());
  const COLOR_KEYS = new Set(['color', 'fill', 'bg', 'stroke', 'border', 'hardShadow', 'banner', 'highlight', 'block', 'stops', 'shadow', 'underline', 'pattern', 'strokeOuter', 'frame']);
  function walkColors(obj, fn, key) {
    if (obj == null) return obj;
    if (typeof obj === 'string') return key && COLOR_KEYS.has(key) ? fn(obj) : obj;
    if (Array.isArray(obj)) return obj.map((v) => walkColors(v, fn, key));
    if (typeof obj === 'object') {
      const o = {}; for (const k of Object.keys(obj)) {
        if (k === 'shade' || k === 'sample' || k === 'tint') { o[k] = obj[k]; continue; }
        o[k] = walkColors(obj[k], fn, (k === 'color' || k === 'fill' || k === 'bg') ? k : (COLOR_KEYS.has(k) ? k : (key && COLOR_KEYS.has(key) && typeof obj[k] === 'object' ? key : k)));
      } return o;
    }
    return obj;
  }
  /** 按色相分组排名：最常用的彩色 → accent，第二 → accent2；深色 → dark；带色浅底 → paper；保持明暗关系 */
  function applyPalette(layers, pal) {
    if (!pal || !pal.accent) return layers;
    const groups = [];
    const classify = (c) => { const rgb = toRgb(c); if (!rgb) return null; const [h, s, l] = hsl(rgb[0], rgb[1], rgb[2]); return { rgb, h, s, l, a: rgb[3] }; };
    walkColors(layers, (c) => { const k = classify(c); if (k && k.s > 0.28 && k.l > 0.12 && k.l < 0.85) {
      let g = groups.find((x) => Math.min(Math.abs(x.h - k.h), 360 - Math.abs(x.h - k.h)) < 28); if (!g) { g = { h: k.h, n: 0 }; groups.push(g); } g.n++; } return c; });
    groups.sort((a, b) => b.n - a.n);
    return walkColors(layers, (c) => {
      const k = classify(c); if (!k) return c;
      if (k.l > 0.85) return k.l < 0.985 && k.s > 0.08 ? rgbStr(toRgb(pal.paper), k.a) : c;
      if (k.s <= 0.28 || k.l <= 0.12) return k.l < 0.2 ? rgbStr(toRgb(pal.dark), k.a) : c;
      const gi = groups.findIndex((x) => Math.min(Math.abs(x.h - k.h), 360 - Math.abs(x.h - k.h)) < 28);
      const target = gi <= 0 ? pal.accent : gi === 1 ? pal.accent2 : (pal.accent3 || pal.accent2);
      const tl = hsl(...toRgb(target).slice(0, 3))[2];
      let rgb = toRgb(target).slice(0, 3);
      // 保留原明暗结构（保证换色后对比度不塌）：原色深而目标浅 → 压暗；原色浅而目标深 → 提亮
      if (k.l > 0.72 && tl < 0.62) rgb = mix(target, '#FFFFFF', 0.6);
      else if (k.l < 0.5 && tl > 0.6) rgb = mix(target, pal.dark, 0.55);
      else if (k.l > 0.58 && tl < 0.42) rgb = mix(target, '#FFFFFF', 0.45);
      return rgbStr(rgb, k.a);
    });
  }
  const DECO_SHAPES = new Set(['sparkle', 'star', 'burst', 'heart', 'arrow', 'cross', 'ring', 'tape', 'brush']);
  /** 次级元素上限：徽章优先保留，其余装饰按出现顺序保留 */
  function limitDeco(layers, max) {
    if (!max) return layers;
    const isBadge = (l) => l.type === 'badge' && l.visible !== false && !l.essential;
    const isDeco = (l) => l.type === 'shape' && DECO_SHAPES.has(l.shape) && l.visible !== false && !l.essential;
    let budget = max - layers.filter(isBadge).length;
    return layers.map((l) => { if (!isDeco(l)) return l; if (budget > 0) { budget--; return l; } return { ...l, visible: false, _decoHidden: true }; });
  }
  /** 统一安全边距：文字框夹进 safe%（短边）以内；bleed 图层例外 */
  function clampSafe(l, W, H) {
    if (!DESIGN.safe || l.bleed || (l.type !== 'text') || l.rotate) return l;
    const mx = (DESIGN.safe * Math.min(W, H)) / W, my = (DESIGN.safe * 0.75 * Math.min(W, H)) / H;
    const o = { ...l };
    if (o.x < mx) { o.w -= mx - o.x; o.x = mx; }
    if (o.x + o.w > 100 - mx) o.w = 100 - mx - o.x;
    if (o.y < my) { o.h -= my - o.y; o.y = my; }
    if (o.y + o.h > 100 - my) o.h = Math.max(2, 100 - my - o.y);
    return o;
  }
  function applyFontStyle(l, fsName) {
    const f = FONT_STYLES[fsName]; if (!f || !f.fontFamily) return l;
    const isTitle = l.type === 'text' && (l.binding === 'title' || /^title/.test(l.id || ''));
    if (!isTitle) return l;
    return { ...l, fontFamily: f.fontFamily, fontWeight: f.fontWeight, italic: false, fontStyle: undefined };
  }
  function parseColor(c) { return c || '#000000'; }

  /* —— 种子随机，保证确定性 —— */
  function hashStr(s) {
    let h = 2166136261;
    for (const ch of String(s || 'x')) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* —— 比例分类与图层覆盖 —— */
  function aspectClass(W, H) {
    const r = W / H;
    if (r >= 1.3) return 'wide';
    if (r >= 0.9) return 'square';
    if (r < 0.66) return 'tall';
    return 'portrait';
  }
  function resolveLayer(layer, cls) {
    if (!layer.at) return layer;
    const o = layer.at[cls] || (cls === 'tall' ? layer.at.portrait : null);
    return o ? { ...layer, ...o } : layer;
  }

  function createLinearGradient(ctx, fill, x, y, w, h) {
    const angle = ((fill.angle || 0) * Math.PI) / 180;
    const cx = x + w / 2, cy = y + h / 2;
    const len = (Math.abs(w * Math.cos(angle)) + Math.abs(h * Math.sin(angle))) / 2;
    const g = ctx.createLinearGradient(cx - Math.cos(angle) * len, cy - Math.sin(angle) * len, cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
    (fill.stops || []).forEach((s) => g.addColorStop(s.offset, s.color));
    return g;
  }
  function createRadialGradient(ctx, fill, x, y, w, h) {
    const cx = x + pct(fill.cx != null ? fill.cx : 50, w);
    const cy = y + pct(fill.cy != null ? fill.cy : 50, h);
    const r = Math.sqrt(w * w + h * h) * (fill.r != null ? fill.r / 100 : 0.6);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    (fill.stops || []).forEach((s) => g.addColorStop(s.offset, s.color));
    return g;
  }
  function resolveFill(ctx, fill, x, y, w, h) {
    if (!fill) return '#000000';
    if (typeof fill === 'string') return fill;
    if (fill.type === 'linear' && fill.stops) return createLinearGradient(ctx, fill, x, y, w, h);
    if (fill.type === 'radial' && fill.stops) return createRadialGradient(ctx, fill, x, y, w, h);
    return parseColor(fill.color || fill);
  }

  function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(Math.max(0, r), Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  /* —— 字体 —— */
  function buildFont(layer, fontSize) {
    const style = layer.fontStyle === 'italic' || layer.italic === true ? 'italic ' : '';
    const weight = layer.fontWeight || '400';
    const fam = layer.fontFamily && layer.fontFamily !== 'Noto Sans SC' ? `"${layer.fontFamily}", ` : '';
    return `${style}${weight} ${Math.max(1, fontSize).toFixed(2)}px ${fam}${FALLBACK_STACK}`;
  }
  const fontReady = new Map();
  function ensureFont(layer, text) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    const key = `${layer.fontStyle || ''}|${layer.fontWeight || '400'}|${layer.fontFamily || 'Noto Sans SC'}`;
    if (fontReady.has(key)) return fontReady.get(key);
    const spec = `${layer.fontStyle === 'italic' ? 'italic ' : ''}${layer.fontWeight || '400'} 40px "${layer.fontFamily || 'Noto Sans SC'}"`;
    const p = Promise.race([
      document.fonts.load(spec, text || '中文Aa1').catch(() => null),
      new Promise((r) => setTimeout(r, 4000)),
    ]).then(() => undefined);
    fontReady.set(key, p);
    return p;
  }

  function applyShadow(ctx, shadow, minSide) {
    if (!shadow) { clearShadow(ctx); return; }
    ctx.shadowColor = shadow.color || 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = shadow.blur != null ? pct(shadow.blur, minSide) : 8;
    ctx.shadowOffsetX = shadow.offsetX != null ? pct(shadow.offsetX, minSide) : 0;
    ctx.shadowOffsetY = shadow.offsetY != null ? pct(shadow.offsetY, minSide) : pct(0.3, minSide);
  }
  function clearShadow(ctx) {
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
  }
  function strokeWidthPx(stroke, minSide, fontSize) {
    if (!stroke) return 0;
    if (stroke.widthPx != null) return Number(stroke.widthPx);
    if (stroke.width != null) return pct(stroke.width, minSide);
    let r = stroke.ratio != null ? stroke.ratio : 0.12;
    if (DESIGN.strokeClamp) r = Math.max(0.03, Math.min(0.34, r));
    return fontSize * r;
  }

  function loadImage(url) {
    if (!url) return Promise.resolve(null);
    if (imageCache.has(url)) return imageCache.get(url);
    const p = new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
    imageCache.set(url, p);
    return p;
  }
  function resolveImageUrl(layer, data) {
    const key = layer.binding || 'image';
    if (data[key]) return data[key];
    if (key === 'bgImage' && data.image) return data.image;
    if (key === 'image' && data.bgImage) return data.bgImage;
    if (key === 'stickerImage' && data.sticker) return data.sticker;
    if (key === 'person2' && data.person) return data.person;
    if (layer.src) return layer.src;
    return null;
  }


  /** 「上下/左右夹击」：按 / ｜ | 换行 拆分；没有分隔符时按字数平分 */
  function splitPart(text, idx, n) {
    const s = String(text || '');
    let parts = s.split(/\s*[\/｜|\n、，,]\s*/).filter(Boolean);
    if (parts.length < 2) {
      const chars = [...s.replace(/\*/g, '')];
      const k = Math.ceil(chars.length / n);
      parts = [];
      for (let i = 0; i < chars.length; i += k) parts.push(chars.slice(i, i + k).join(''));
    }
    if (idx >= n - 1) return parts.slice(n - 1).join('');
    return parts[idx] || '';
  }

  /* —— v1.6 照片统一调色 —— */
  function gradeFilter(f) {
    const base = f && f !== 'none' ? f : '';
    if (!DESIGN.grade) return base || 'none';
    return (base + ' contrast(1.06) saturate(1.1) brightness(1.01)').trim();
  }
  /** 轻锐化（3x3 unsharp），只作用于照片盒 */
  function sharpen(ctx, b, amt) {
    if (!amt) return;
    const W = ctx.canvas.width, H = ctx.canvas.height;
    const x0 = Math.max(0, Math.floor(b.x)), y0 = Math.max(0, Math.floor(b.y));
    const w = Math.min(W, Math.ceil(b.x + b.w)) - x0, h = Math.min(H, Math.ceil(b.y + b.h)) - y0;
    if (w < 3 || h < 3 || w * h > 4.5e6) return;
    let id; try { id = ctx.getImageData(x0, y0, w, h); } catch (e) { return; }
    const s = id.data, o = new Uint8ClampedArray(s), k = amt;
    const row = w * 4;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * row + x * 4;
        for (let c = 0; c < 3; c++) {
          const v = s[i + c] * (1 + 4 * k) - k * (s[i - 4 + c] + s[i + 4 + c] + s[i - row + c] + s[i + row + c]);
          o[i + c] = v;
        }
      }
    }
    id.data.set(o); ctx.putImageData(id, x0, y0);
  }
  function drawGrain(ctx, W, H, amt) {
    const t = document.createElement('canvas'); t.width = 256; t.height = 256;
    const tc = t.getContext('2d'); const im = tc.createImageData(256, 256); const r = rng(7);
    for (let i = 0; i < im.data.length; i += 4) { const v = (r() * 255) | 0; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
    tc.putImageData(im, 0, 0);
    ctx.save(); ctx.globalAlpha = amt; ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = ctx.createPattern(t, 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore();
  }

  /* —— 整图背景（人物原照片）—— */
  function photoRect(ph, W, H, img, tf) {
    const x = pct(ph.x != null ? ph.x : 0, W), y = pct(ph.y != null ? ph.y : 0, H);
    const w = pct(ph.w != null ? ph.w : 100, W), h = pct(ph.h != null ? ph.h : 100, H);
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    const t = tf || { dx: 0, dy: 0, scale: 1 };
    let scale;
    if (ph.fit === 'height') scale = (h / ih) * (ph.zoom || 1);
    else scale = Math.max(w / iw, h / ih) * (ph.zoom || 1);
    scale *= t.scale || 1;
    const dw = iw * scale, dh = ih * scale;
    const fx = (ph.focusX != null ? ph.focusX : 50) / 100, fy = (ph.focusY != null ? ph.focusY : 30) / 100;
    let dx = x + (w - dw) * fx, dy = y + (h - dh) * fy;
    if (ph.fit === 'height') dx = x + w * fx - dw / 2;
    dx += pct(t.dx || 0, W); dy += pct((t.dy || 0) + (ph.offsetY || 0), H);
    return { box: { x, y, w, h }, dx, dy, dw, dh };
  }
  function clipPhotoBox(ctx, ph, box, minSide) {
    const r = pct(ph.radius || 0, minSide);
    if (ph.torn) { tornPath(ctx, box.x, box.y, box.w, box.h, 11, pct(ph.torn.jag || 1, minSide), ph.torn.edges); ctx.clip(); return; }
    ctx.beginPath();
    if (r > 0) roundRectPathNoBegin(ctx, box.x, box.y, box.w, box.h, r); else ctx.rect(box.x, box.y, box.w, box.h);
    ctx.clip();
  }
  function drawPhoto(ctx, ph, W, H, img, tf) {
    const minSide = Math.min(W, H);
    const rc = photoRect(ph, W, H, img, tf);
    const b = rc.box;
    // 相框（白边 + 硬阴影）
    if (ph.frame) {
      const fw = pct(ph.frame.width != null ? ph.frame.width : 1.2, minSide);
      const fr = pct(ph.radius || 0, minSide) + fw;
      if (ph.frame.shadow) {
        ctx.fillStyle = ph.frame.shadow.color || 'rgba(0,0,0,0.8)';
        roundRect(ctx, b.x - fw + pct(ph.frame.shadow.dx || 0.8, minSide), b.y - fw + pct(ph.frame.shadow.dy || 0.8, minSide), b.w + fw * 2, b.h + fw * 2, fr);
        ctx.fill();
      }
      ctx.fillStyle = ph.frame.color || '#FFFFFF';
      if (ph.torn) {
        ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = fw; ctx.shadowOffsetY = fw * 0.4;
        tornPath(ctx, b.x - fw, b.y - fw, b.w + fw * 2, b.h + fw * 2, 23, pct(ph.torn.jag || 1, minSide) * 1.3, ph.torn.edges); ctx.fill(); ctx.restore();
      } else {
        roundRect(ctx, b.x - fw, b.y - fw, b.w + fw * 2, b.h + fw * 2, fr);
        ctx.fill();
      }
    }
    ctx.save();
    clipPhotoBox(ctx, ph, b, minSide);
    // 照片放不满盒子（横版用竖照 / 下移留白）时：用照片四边的边缘条拉伸 + 重模糊补底，避免出现第二个模糊人像
    const cov = { l: rc.dx <= b.x + 1, r: rc.dx + rc.dw >= b.x + b.w - 1, t: rc.dy <= b.y + 1, btm: rc.dy + rc.dh >= b.y + b.h - 1 };
    if (!(cov.l && cov.r && cov.t && cov.btm)) {
      const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
      const sx = rc.dw / iw, sy = rc.dh / ih;
      ctx.save();
      ctx.filter = `blur(${Math.round(minSide / 28)}px) brightness(0.85)`;
      const strip = 0.1;
      if (!cov.l) ctx.drawImage(img, 0, 0, iw * strip, ih, b.x - minSide * 0.05, rc.dy, rc.dx - b.x + iw * strip * sx + minSide * 0.05, rc.dh);
      if (!cov.r) { const x0 = rc.dx + rc.dw - iw * strip * sx; ctx.drawImage(img, iw * (1 - strip), 0, iw * strip, ih, x0, rc.dy, b.x + b.w - x0 + minSide * 0.05, rc.dh); }
      if (!cov.t) ctx.drawImage(img, 0, 0, iw, ih * strip, b.x - minSide * 0.05, b.y - minSide * 0.05, b.w + minSide * 0.1, rc.dy - b.y + ih * strip * sy + minSide * 0.05);
      if (!cov.btm) { const y0 = rc.dy + rc.dh - ih * strip * sy; ctx.drawImage(img, 0, ih * (1 - strip), iw, ih * strip, b.x - minSide * 0.05, y0, b.w + minSide * 0.1, b.y + b.h - y0 + minSide * 0.05); }
      ctx.restore();
      // 清晰照片：在未贴边的一侧羽化
      const off = document.createElement('canvas'); off.width = Math.ceil(rc.dw); off.height = Math.ceil(rc.dh);
      const oc = off.getContext('2d');
      oc.filter = gradeFilter(ph.filter);
      oc.drawImage(img, 0, 0, off.width, off.height);
      oc.filter = 'none';
      oc.globalCompositeOperation = 'destination-in';
      const fe = 0.1;
      const gx = oc.createLinearGradient(0, 0, off.width, 0);
      gx.addColorStop(0, cov.l ? '#000' : 'rgba(0,0,0,0)'); gx.addColorStop(fe, '#000'); gx.addColorStop(1 - fe, '#000'); gx.addColorStop(1, cov.r ? '#000' : 'rgba(0,0,0,0)');
      oc.fillStyle = gx; oc.fillRect(0, 0, off.width, off.height);
      const gy = oc.createLinearGradient(0, 0, 0, off.height);
      gy.addColorStop(0, cov.t ? '#000' : 'rgba(0,0,0,0)'); gy.addColorStop(0.08, '#000'); gy.addColorStop(1, '#000');
      oc.fillStyle = gy; oc.fillRect(0, 0, off.width, off.height);
      ctx.drawImage(off, rc.dx, rc.dy);
    } else {
      ctx.filter = gradeFilter(ph.filter);
      ctx.drawImage(img, rc.dx, rc.dy, rc.dw, rc.dh);
      ctx.filter = 'none';
    }
    if (DESIGN.grade && ph.grade !== false) { sharpen(ctx, b, DESIGN.sharpen); }
    // 压暗渐变（保证白/黄字可读）
    (ph.shade || []).forEach((sd) => {
      const y0 = b.y + (b.h * (sd.from || 0)) / 100, y1 = b.y + (b.h * (sd.to || 100)) / 100;
      const g = ctx.createLinearGradient(0, y0, 0, y1);
      g.addColorStop(0, sd.c0 || 'rgba(0,0,0,0)'); g.addColorStop(1, sd.c1 || 'rgba(0,0,0,0.5)');
      ctx.fillStyle = g; ctx.fillRect(b.x, Math.min(y0, y1), b.w, Math.abs(y1 - y0));
    });
    if (ph.tint) { ctx.fillStyle = ph.tint; ctx.fillRect(b.x, b.y, b.w, b.h); }
    if (DESIGN.grade && DESIGN.vignette && ph.vignette !== false) {
      const g = ctx.createRadialGradient(b.x + b.w / 2, b.y + b.h * 0.45, Math.min(b.w, b.h) * 0.35, b.x + b.w / 2, b.y + b.h * 0.45, Math.max(b.w, b.h) * 0.75);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${DESIGN.vignette})`);
      ctx.fillStyle = g; ctx.fillRect(b.x, b.y, b.w, b.h);
    }
    ctx.restore();
    return rc;
  }
  /** 头部遮挡：把抠图（与原照片对齐）只在 clipY 以上重画一遍，盖住标题 */
  function drawOccluder(ctx, ph, layer, W, H, cut, box, rc) {
    if (!cut || !rc) return;
    const minSide = Math.min(W, H);
    const bx = box || { x: 0, y: 0, w: 1, h: 1 };
    const x = rc.dx + bx.x * rc.dw, y = rc.dy + bx.y * rc.dh, w = bx.w * rc.dw, h = bx.h * rc.dh;
    ctx.save();
    clipPhotoBox(ctx, ph, rc.box, minSide);
    ctx.beginPath(); ctx.rect(0, 0, W, pct(layer.clipY != null ? layer.clipY : 50, H)); ctx.clip();
    if (layer.glow) { ctx.shadowColor = layer.glow; ctx.shadowBlur = pct(1.2, minSide); }
    ctx.filter = gradeFilter(ph.filter);
    ctx.drawImage(cut, x, y, w, h);
    ctx.restore();
  }
  /** 脸部估计：抠图 alpha 包围盒顶部 → 画布坐标 */
  function estimateFace(cut, box, rc, W, H, sticker) {
    let x, y, w, h;
    if (rc && cut) {
      const bx = box || { x: 0, y: 0, w: 1, h: 1 };
      x = rc.dx + bx.x * rc.dw; y = rc.dy + bx.y * rc.dh; w = bx.w * rc.dw; h = bx.h * rc.dh;
    } else if (sticker) { x = sticker.dx; y = sticker.dy; w = sticker.dw; h = sticker.dh; }
    else return null;
    // 头部约占人物上方 0~30%，宽度约为人物宽度的 46%，居中
    // 头部高度 ≈ min(人物高 30%, 人物宽 62%)；脸（眉到下巴）约在头部 25%~100% 区间
    const head = Math.min(h * 0.3, w * 0.62);
    const fh = head * 0.8, fw = Math.min(w * 0.42, head * 0.72);
    return { x: x + (w - fw) / 2, y: y + head * 0.28, w: fw, h: fh };
  }

  /* —— 纹理 —— */
  function drawPattern(ctx, p, x, y, w, h, W, H, seedKey) {
    if (!p) return;
    const minSide = Math.min(W, H);
    const size = pct(p.size != null ? p.size : 1, minSide);
    const gap = pct(p.gap != null ? p.gap : 3, minSide);
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.globalAlpha *= p.opacity != null ? p.opacity : 1;
    ctx.fillStyle = p.color || 'rgba(0,0,0,0.12)';
    ctx.strokeStyle = p.color || 'rgba(0,0,0,0.12)';
    const t = p.type;
    if (t === 'dots' || t === 'halftone') {
      let row = 0;
      for (let yy = y; yy < y + h + gap; yy += gap, row++) {
        const off = row % 2 ? gap / 2 : 0;
        for (let xx = x - gap + off; xx < x + w + gap; xx += gap) {
          let r = size / 2;
          if (t === 'halftone') {
            const dir = p.dir || 'down';
            let f = dir === 'down' ? (yy - y) / h : dir === 'up' ? 1 - (yy - y) / h : dir === 'right' ? (xx - x) / w : 1 - (xx - x) / w;
            if (dir === 'radial') {
              const cx = x + w * (p.cx != null ? p.cx / 100 : 0.5), cy = y + h * (p.cy != null ? p.cy / 100 : 0.5);
              f = 1 - Math.min(1, Math.hypot(xx - cx, yy - cy) / (Math.hypot(w, h) / 2));
            }
            r *= Math.max(0, Math.min(1, f));
            if (r < 0.4) continue;
          }
          ctx.beginPath(); ctx.arc(xx, yy, r, 0, Math.PI * 2); ctx.fill();
        }
      }
    } else if (t === 'stripes') {
      const ang = ((p.angle != null ? p.angle : 45) * Math.PI) / 180;
      ctx.translate(x + w / 2, y + h / 2); ctx.rotate(ang);
      const L = Math.hypot(w, h);
      for (let xx = -L; xx < L; xx += gap) ctx.fillRect(xx, -L, size, L * 2);
    } else if (t === 'grid') {
      ctx.lineWidth = Math.max(1, size / 4);
      for (let xx = x; xx <= x + w; xx += gap) { ctx.beginPath(); ctx.moveTo(xx, y); ctx.lineTo(xx, y + h); ctx.stroke(); }
      for (let yy = y; yy <= y + h; yy += gap) { ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke(); }
    } else if (t === 'rays') {
      const cx = x + pct(p.cx != null ? p.cx : 50, w), cy = y + pct(p.cy != null ? p.cy : 50, h);
      const n = p.count || 24;
      const R = Math.hypot(w, h) * 1.2;
      const ofs = ((p.angle || 0) * Math.PI) / 180;
      for (let i = 0; i < n; i++) {
        const a0 = ofs + (i / n) * Math.PI * 2, a1 = a0 + (Math.PI / n) * (p.duty != null ? p.duty * 2 : 1);
        ctx.beginPath(); ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a0) * R, cy + Math.sin(a0) * R);
        ctx.lineTo(cx + Math.cos(a1) * R, cy + Math.sin(a1) * R);
        ctx.closePath(); ctx.fill();
      }
    } else if (t === 'noise') {
      const rand = rng(hashStr(seedKey || 'noise'));
      const n = Math.round((w * h) / Math.max(4, gap * gap) );
      const s = Math.max(1, size);
      for (let i = 0; i < n; i++) ctx.fillRect(x + rand() * w, y + rand() * h, s, s);
    }
    ctx.restore();
  }

  function sceneTintColor(template, layer) {
    if (template && template.sceneTint) return template.sceneTint;
    const f = layer && layer.fill;
    if (!f) return '#000000';
    if (typeof f === 'string') return f;
    if (f.stops && f.stops.length) return f.stops[Math.floor((f.stops.length - 1) / 2)].color;
    return f.color || '#000000';
  }

  /** 场景背景图：cover 填充 + 焦点 + 虚化 + 明暗 + 主色蒙层（确定性） */
  function drawScene(ctx, img, sc, tint, W, H) {
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;
    const k = Math.min(W, H) / 1080;
    const blur = Math.max(0, Math.min(40, Number(sc.blur) || 0)) * k;
    const pad = blur * 2.5;
    const scale = Math.max((W + pad * 2) / iw, (H + pad * 2) / ih);
    const dw = iw * scale, dh = ih * scale;
    const fx = sc.fx != null ? sc.fx / 100 : 0.5, fy = sc.fy != null ? sc.fy / 100 : 0.5;
    const dx = -pad + (W + pad * 2 - dw) * fx, dy = -pad + (H + pad * 2 - dh) * fy;
    ctx.save();
    if (blur > 0.2) ctx.filter = `blur(${blur.toFixed(1)}px)`;
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.filter = 'none';
    const b = Number(sc.bright) || 0; // -60..60
    if (b < 0) { ctx.fillStyle = `rgba(0,0,0,${(-b / 100).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
    if (b > 0) { ctx.fillStyle = `rgba(255,255,255,${(b / 100).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }
    const t = Math.max(0, Math.min(100, Number(sc.tint) || 0)) / 100;
    if (t > 0) { ctx.globalAlpha = t; ctx.fillStyle = tint; ctx.fillRect(0, 0, W, H); }
    ctx.restore();
  }

  function drawBackground(ctx, layer, W, H, scene) {
    const fill = layer.fill || { type: 'solid', color: '#FFFFFF' };
    ctx.fillStyle = resolveFill(ctx, fill, 0, 0, W, H);
    ctx.fillRect(0, 0, W, H);
    if (scene && scene.img) drawScene(ctx, scene.img, scene.opts, scene.tint, W, H);
    const pats = Array.isArray(layer.pattern) ? layer.pattern : layer.pattern ? [layer.pattern] : [];
    ctx.save();
    // 有背景图时，纹理以较低透明度叠在图上
    if (scene && scene.img) ctx.globalAlpha = scene.opts.patternAlpha != null ? scene.opts.patternAlpha : 0.5;
    pats.forEach((p, i) => drawPattern(ctx, p, 0, 0, W, H, W, H, (layer.id || 'bg') + i));
    ctx.restore();
  }

  /* —— 矢量形状路径 —— */
  function starPath(ctx, cx, cy, ro, ri, n, rot) {
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const r = i % 2 ? ri : ro;
      const a = rot + (i * Math.PI) / n - Math.PI / 2;
      const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r;
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.closePath();
  }
  function ellipseStarPath(ctx, x, y, w, h, n, inner, rot) {
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const k = i % 2 ? inner : 1;
      const a = rot + (i * Math.PI) / n - Math.PI / 2;
      const px = x + w / 2 + Math.cos(a) * (w / 2) * k, py = y + h / 2 + Math.sin(a) * (h / 2) * k;
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.closePath();
  }
  function sparklePath(ctx, cx, cy, rx, ry) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - ry);
    ctx.quadraticCurveTo(cx, cy, cx + rx, cy);
    ctx.quadraticCurveTo(cx, cy, cx, cy + ry);
    ctx.quadraticCurveTo(cx, cy, cx - rx, cy);
    ctx.quadraticCurveTo(cx, cy, cx, cy - ry);
    ctx.closePath();
  }
  function heartPath(ctx, x, y, w, h) {
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + h);
    ctx.bezierCurveTo(x - w * 0.1, y + h * 0.55, x + w * 0.05, y - h * 0.15, x + w / 2, y + h * 0.25);
    ctx.bezierCurveTo(x + w * 0.95, y - h * 0.15, x + w * 1.1, y + h * 0.55, x + w / 2, y + h);
    ctx.closePath();
  }
  function blobPath(ctx, x, y, w, h, seed, n) {
    const rand = rng(seed);
    n = n || 7;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const k = 0.78 + rand() * 0.22;
      pts.push([x + w / 2 + Math.cos(a) * (w / 2) * k, y + h / 2 + Math.sin(a) * (h / 2) * k]);
    }
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      if (i === 0) ctx.moveTo(p1[0], p1[1]);
      ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
    }
    ctx.closePath();
  }
  function wavePath(ctx, x, y, w, h, waves, amp) {
    const a = amp != null ? amp : h * 0.25;
    ctx.beginPath();
    ctx.moveTo(x, y + a);
    const seg = w / (waves || 4);
    for (let i = 0; i < (waves || 4); i++) {
      const sx = x + i * seg;
      ctx.bezierCurveTo(sx + seg * 0.35, y - a * 0.2, sx + seg * 0.65, y + a * 2.2, sx + seg, y + a);
    }
    ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath();
  }
  function bubblePath(ctx, x, y, w, h, r, tail) {
    // tail: { side:'bottom'|'left'|'right'|'top', pos:0..1, size: px }
    const t = tail || { side: 'bottom', pos: 0.25 };
    const ts = t.sizePx || Math.min(w, h) * 0.32;
    roundRect(ctx, x, y, w, h, r);
    const p = t.pos != null ? t.pos : 0.25;
    ctx.moveTo(0, 0);
    ctx.beginPath();
    roundRectPathNoBegin(ctx, x, y, w, h, r);
    if (t.side === 'bottom') {
      const bx = x + w * p;
      ctx.moveTo(bx - ts * 0.45, y + h - 1); ctx.lineTo(bx - ts * 0.3, y + h + ts * 0.9); ctx.lineTo(bx + ts * 0.45, y + h - 1);
    } else if (t.side === 'left') {
      const by = y + h * p;
      ctx.moveTo(x + 1, by - ts * 0.4); ctx.lineTo(x - ts * 0.9, by + ts * 0.3); ctx.lineTo(x + 1, by + ts * 0.4);
    } else if (t.side === 'right') {
      const by = y + h * p;
      ctx.moveTo(x + w - 1, by - ts * 0.4); ctx.lineTo(x + w + ts * 0.9, by + ts * 0.3); ctx.lineTo(x + w - 1, by + ts * 0.4);
    } else {
      const bx = x + w * p;
      ctx.moveTo(bx - ts * 0.45, y + 1); ctx.lineTo(bx - ts * 0.2, y - ts * 0.9); ctx.lineTo(bx + ts * 0.45, y + 1);
    }
    ctx.closePath();
  }
  function roundRectPathNoBegin(ctx, x, y, w, h, r) {
    const radius = Math.min(Math.max(0, r), w / 2, h / 2);
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }
  function tapePath(ctx, x, y, w, h, seed) {
    const rand = rng(seed);
    const teeth = 6, d = Math.min(w, h) * 0.12;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    for (let i = 1; i <= teeth; i++) ctx.lineTo(x + w - (i % 2 ? d * (0.5 + rand() * 0.5) : 0), y + (h * i) / teeth);
    ctx.lineTo(x, y + h);
    for (let i = teeth - 1; i >= 0; i--) ctx.lineTo(x + (i % 2 ? d * (0.5 + rand() * 0.5) : 0), y + (h * i) / teeth);
    ctx.closePath();
  }

  /** 曲线箭头：从 (x0,y0) 到 (x1,y1)，bend 为弯曲度（相对长度），描线 + 箭头三角 */
  function drawArrow(ctx, layer, x, y, w, h, minSide, color) {
    const flip = layer.flip;
    const x0 = flip ? x + w : x, y0 = y, x1 = flip ? x : x + w, y1 = y + h;
    const dir = layer.dir === 'up' ? -1 : 1;
    const sx = layer.reverse ? x1 : x0, sy = layer.reverse ? y1 : y0;
    const ex = layer.reverse ? x0 : x1, ey = layer.reverse ? y0 : y1;
    const len = Math.hypot(ex - sx, ey - sy);
    const bend = (layer.bend != null ? layer.bend : 0.35) * len * dir;
    const mx = (sx + ex) / 2, my = (sy + ey) / 2;
    const nx = -(ey - sy) / len, ny = (ex - sx) / len;
    const cx = mx + nx * bend, cy = my + ny * bend;
    const lw = pct(layer.lineWidth != null ? layer.lineWidth : 1.2, minSide);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = color; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(cx, cy, ex, ey); ctx.stroke();
    const ang = Math.atan2(ey - cy, ex - cx);
    const hs = lw * 3.2;
    ctx.beginPath();
    ctx.moveTo(ex + Math.cos(ang) * hs * 0.3, ey + Math.sin(ang) * hs * 0.3);
    ctx.lineTo(ex - Math.cos(ang - 0.5) * hs, ey - Math.sin(ang - 0.5) * hs);
    ctx.lineTo(ex - Math.cos(ang + 0.5) * hs, ey - Math.sin(ang + 0.5) * hs);
    ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.stroke();
  }
  /** 手绘笔触：横向略起伏的粗线（用于下划线 / 划重点） */
  function drawBrush(ctx, layer, x, y, w, h, color, seed) {
    const rand = rng(seed);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = color;
    const passes = layer.passes || 1;
    for (let p = 0; p < passes; p++) {
      ctx.lineWidth = h * (p ? 0.7 : 1);
      const yy = y + h / 2 + (p ? h * 0.55 : 0);
      ctx.beginPath(); ctx.moveTo(x + h / 2, yy + (rand() - 0.5) * h * 0.3);
      const n = 4;
      for (let i = 1; i <= n; i++) ctx.lineTo(x + h / 2 + ((w - h) * i) / n, yy + (rand() - 0.5) * h * 0.35 - (layer.tilt || 0) * h * i / n);
      ctx.stroke();
    }
  }
  /** 手绘圈：两圈略错开的椭圆 */
  function drawRing(ctx, layer, x, y, w, h, minSide, color, seed) {
    const rand = rng(seed);
    ctx.strokeStyle = color; ctx.lineCap = 'round';
    ctx.lineWidth = pct(layer.lineWidth != null ? layer.lineWidth : 0.8, minSide);
    ctx.beginPath();
    const turns = 1.85, steps = 90;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * turns * Math.PI * 2 - 2.2;
      const k = 1 + (i / steps - 0.5) * 0.08 + (rand() - 0.5) * 0.01;
      const px = x + w / 2 + Math.cos(t) * (w / 2) * k, py = y + h / 2 + Math.sin(t) * (h / 2) * k;
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.stroke();
  }

  /** v1.7 撕纸边：沿矩形四边走小锯齿 + 低频起伏（seed 固定，结果确定）；edges 例 'tb' 只撕上下 */
  function tornPath(ctx, x, y, w, h, seed, jag, edges) {
    const rand = rng(seed || 7); const e = edges || 'tblr';
    const j = jag || Math.min(w, h) * 0.025;
    const pts = [];
    const side = (x0, y0, x1, y1, nx, ny, on) => {
      const len = Math.hypot(x1 - x0, y1 - y0), n = Math.max(2, Math.round(len / (j * 1.1)));
      let wob = 0;
      for (let i = 0; i < n; i++) {
        const t = i / n; wob = wob * 0.6 + (rand() - 0.5) * 0.8;
        const d = on ? (rand() * 0.9 + wob * 0.6) * j : 0;
        pts.push([x0 + (x1 - x0) * t + nx * d, y0 + (y1 - y0) * t + ny * d]);
      }
    };
    side(x, y, x + w, y, 0, 1, e.includes('t'));
    side(x + w, y, x + w, y + h, -1, 0, e.includes('r'));
    side(x + w, y + h, x, y + h, 0, -1, e.includes('b'));
    side(x, y + h, x, y, 1, 0, e.includes('l'));
    ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath();
  }
  function shapePath(ctx, layer, x, y, w, h, minSide) {
    const r = pct(layer.radius || 0, minSide);
    const seed = hashStr(layer.id);
    switch (layer.shape) {
      case 'ellipse': ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2, Math.abs(w / 2), Math.abs(h / 2), 0, 0, Math.PI * 2); return true;
      case 'star': ellipseStarPath(ctx, x, y, w, h, layer.points || 5, layer.inner != null ? layer.inner : 0.45, 0); return true;
      case 'burst': ellipseStarPath(ctx, x, y, w, h, layer.points || 16, layer.inner != null ? layer.inner : 0.8, 0); return true;
      case 'sparkle': sparklePath(ctx, x + w / 2, y + h / 2, w / 2, h / 2); return true;
      case 'heart': heartPath(ctx, x, y, w, h); return true;
      case 'blob': blobPath(ctx, x, y, w, h, seed, layer.points); return true;
      case 'wave': wavePath(ctx, x, y, w, h, layer.waves, layer.amp != null ? pct(layer.amp, minSide) : null); return true;
      case 'bubble': bubblePath(ctx, x, y, w, h, r, layer.tail ? { ...layer.tail, sizePx: layer.tail.size != null ? pct(layer.tail.size, minSide) : null } : null); return true;
      case 'tape': tapePath(ctx, x, y, w, h, seed); return true;
      case 'torn': tornPath(ctx, x, y, w, h, seed, layer.jag != null ? pct(layer.jag, minSide) : null, layer.edges); return true;
      case 'cross': {
        // 粗红叉：两条圆头粗线组成的多边形
        const t = Math.min(w, h) * (layer.thick || 0.2) / 2;
        ctx.beginPath();
        [[x, y, x + w, y + h], [x + w, y, x, y + h]].forEach(([x1, y1, x2, y2]) => {
          const a = Math.atan2(y2 - y1, x2 - x1), nx = -Math.sin(a) * t, ny = Math.cos(a) * t;
          ctx.moveTo(x1 + nx, y1 + ny); ctx.lineTo(x2 + nx, y2 + ny); ctx.lineTo(x2 - nx, y2 - ny); ctx.lineTo(x1 - nx, y1 - ny); ctx.closePath();
        });
        return true;
      }
      case 'triangle': {
        const rr = Math.min(w, h) * 0.12;
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y); ctx.arcTo(x + w, y + h, x, y + h, rr); ctx.arcTo(x, y + h, x + w / 2, y, rr); ctx.arcTo(x + w / 2, y, x + w, y + h, rr); ctx.closePath();
        return true;
      }
      default:
        if (r > 0) roundRect(ctx, x, y, w, h, r); else { ctx.beginPath(); ctx.rect(x, y, w, h); }
        return true;
    }
  }

  function withTransform(ctx, layer, x, y, w, h, fn) {
    ctx.save();
    if (layer.opacity != null) ctx.globalAlpha *= layer.opacity;
    if (layer.rotate) {
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate((layer.rotate * Math.PI) / 180);
      ctx.translate(-(x + w / 2), -(y + h / 2));
    }
    fn();
    ctx.restore();
  }

  function drawShape(ctx, layer, W, H) {
    const x = pct(layer.x, W), y = pct(layer.y, H), w = pct(layer.w, W), h = pct(layer.h, H);
    const minSide = Math.min(W, H);
    const seed = hashStr(layer.id);
    if (layer.square) {
      // 保持正方形（以 w 为准，居中于盒子）——星星/圆在任何比例都不变形
      const s = Math.min(w, h);
      return drawShape(ctx, { ...layer, square: false, x: ((x + (w - s) / 2) / W) * 100, y: ((y + (h - s) / 2) / H) * 100, w: (s / W) * 100, h: (s / H) * 100 }, W, H);
    }
    withTransform(ctx, layer, x, y, w, h, () => {
      const color = typeof layer.fill === 'string' ? layer.fill : (layer.fill && layer.fill.color) || '#000';
      if (layer.shape === 'arrow' || layer.shape === 'brush' || layer.shape === 'ring') {
        const draw = (c, ox, oy) => {
          ctx.save(); ctx.translate(ox, oy);
          if (layer.shape === 'arrow') drawArrow(ctx, layer, x, y, w, h, minSide, c);
          else if (layer.shape === 'brush') drawBrush(ctx, layer, x, y, w, h, c, seed);
          else drawRing(ctx, layer, x, y, w, h, minSide, c, seed);
          ctx.restore();
        };
        if (layer.hardShadow) draw(layer.hardShadow.color || '#000', pct(layer.hardShadow.dx || 0.6, minSide), pct(layer.hardShadow.dy || 0.6, minSide));
        draw(color, 0, 0);
        return;
      }
      if (layer.hardShadow) {
        ctx.save();
        ctx.translate(pct(layer.hardShadow.dx != null ? layer.hardShadow.dx : 0.8, minSide), pct(layer.hardShadow.dy != null ? layer.hardShadow.dy : 0.8, minSide));
        shapePath(ctx, layer, x, y, w, h, minSide);
        ctx.fillStyle = layer.hardShadow.color || '#111';
        ctx.fill();
        if (layer.border) { ctx.lineWidth = pct(layer.border.width || 0.2, minSide); ctx.strokeStyle = layer.hardShadow.color || '#111'; ctx.lineJoin = 'round'; ctx.stroke(); }
        ctx.restore();
      }
      shapePath(ctx, layer, x, y, w, h, minSide);
      ctx.fillStyle = resolveFill(ctx, layer.fill, x, y, w, h);
      if (layer.fill !== 'none') ctx.fill();
      if (layer.pattern) {
        ctx.save(); ctx.clip();
        drawPattern(ctx, layer.pattern, x, y, w, h, W, H, layer.id);
        ctx.restore();
      }
      if (layer.border) {
        shapePath(ctx, layer, x, y, w, h, minSide);
        ctx.strokeStyle = layer.border.color || '#000';
        ctx.lineWidth = pct(layer.border.width || 0.2, minSide);
        ctx.lineJoin = 'round';
        if (layer.border.dash) ctx.setLineDash(layer.border.dash.map((d) => pct(d, minSide)));
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });
  }

  /** v1.6 照片槽：把人物原照片按 focus/zoom 裁进任意框（照片条、缩略图扇形、网格、相框） */
  /* —— v1.7 内置矢量图标（复刻用）：圆角方块底 + 线性图标 —— */
  function drawIcon(ctx, layer, W, H) {
    let x = pct(layer.x, W), y = pct(layer.y, H), w = pct(layer.w, W), h = pct(layer.h, H);
    const minSide = Math.min(W, H);
    const s = Math.min(w, h); x += (w - s) / 2; y += (h - s) / 2;
    withTransform(ctx, layer, x, y, s, s, () => {
      const r = s * 0.18, lw = Math.max(1.5, s * 0.055);
      if (layer.tile !== false) {
        if (layer.hardShadow !== false) { ctx.fillStyle = 'rgba(0,0,0,0.35)'; roundRect(ctx, x + s * 0.04, y + s * 0.05, s, s, r); ctx.fill(); }
        ctx.fillStyle = layer.bg || '#FFFFFF'; roundRect(ctx, x, y, s, s, r); ctx.fill();
        if (layer.border) { ctx.strokeStyle = layer.border; ctx.lineWidth = lw * 0.6; roundRect(ctx, x, y, s, s, r); ctx.stroke(); }
      }
      const c = layer.color || '#1F2937', a = layer.accent || '#2563EB';
      const cx = x + s / 2, cy = y + s / 2, u = s / 10;
      ctx.lineWidth = lw; ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const rr = (X, Y, Wd, Hd, R) => { roundRect(ctx, X, Y, Wd, Hd, R); };
      const lib = String(layer.icon || '').startsWith('tb:') && window.TABLER_ICONS && window.TABLER_ICONS[layer.icon.slice(3)];
      if (lib) {
        // Tabler 线性图标（MIT）：24 栅格路径；tile:false 时可加 outline 白色贴纸描边
        const k = (s * (layer.tile === false ? 0.92 : 0.66)) / 24, ox = x + (s - 24 * k) / 2, oy = y + (s - 24 * k) / 2;
        ctx.save(); ctx.translate(ox, oy); ctx.scale(k, k); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        const ps = lib.map((d) => new Path2D(d)), wt = 2 * (layer.weight || 1);
        if (layer.outline) { ctx.strokeStyle = layer.outline; ctx.lineWidth = wt + 3.2; ps.forEach((q) => ctx.stroke(q)); }
        if (layer.fillIcon) { ctx.fillStyle = layer.fillIcon; ps.forEach((q) => ctx.fill(q)); }
        ctx.strokeStyle = c; ctx.lineWidth = wt; ps.forEach((q) => ctx.stroke(q));
        ctx.restore();
        return;
      }
      switch (layer.icon) {
        case 'robot':
          rr(cx - 3 * u, cy - 1.5 * u, 6 * u, 4.5 * u, u); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx, cy - 1.5 * u); ctx.lineTo(cx, cy - 3 * u); ctx.stroke();
          ctx.beginPath(); ctx.arc(cx, cy - 3.3 * u, 0.5 * u, 0, 7); ctx.fill();
          ctx.fillStyle = a; ctx.beginPath(); ctx.arc(cx - 1.3 * u, cy + 0.5 * u, 0.6 * u, 0, 7); ctx.arc(cx + 1.3 * u, cy + 0.5 * u, 0.6 * u, 0, 7); ctx.fill();
          ctx.beginPath(); ctx.moveTo(cx - 3 * u, cy + 0.8 * u); ctx.lineTo(cx - 4 * u, cy + 0.8 * u); ctx.moveTo(cx + 3 * u, cy + 0.8 * u); ctx.lineTo(cx + 4 * u, cy + 0.8 * u); ctx.stroke();
          break;
        case 'flow':
          ctx.fillStyle = a; rr(cx - 1.2 * u, cy - 3.5 * u, 2.4 * u, 1.8 * u, 0.3 * u); ctx.fill();
          [-2.8, 0, 2.8].forEach((d) => { rr(cx + d * u - 1 * u, cy + 1.6 * u, 2 * u, 1.6 * u, 0.3 * u); ctx.fill(); });
          ctx.beginPath(); ctx.moveTo(cx, cy - 1.7 * u); ctx.lineTo(cx, cy + 1.6 * u); ctx.moveTo(cx - 2.8 * u, cy + 1.6 * u); ctx.lineTo(cx - 2.8 * u, cy); ctx.lineTo(cx + 2.8 * u, cy); ctx.lineTo(cx + 2.8 * u, cy + 1.6 * u); ctx.stroke();
          break;
        case 'chart':
          ctx.beginPath(); ctx.moveTo(cx - 3.5 * u, cy - 3 * u); ctx.lineTo(cx - 3.5 * u, cy + 3 * u); ctx.lineTo(cx + 3.5 * u, cy + 3 * u); ctx.stroke();
          ctx.fillStyle = a; [[-2.4, 1.6], [-0.6, 3], [1.2, 4.2], [3, 5.4]].forEach(([d, hh]) => { ctx.fillRect(cx + d * u - 0.6 * u, cy + 2.6 * u - hh * u * 0.9, 1.2 * u, hh * u * 0.9); });
          ctx.strokeStyle = '#E11D2E'; ctx.beginPath(); ctx.moveTo(cx - 3 * u, cy); ctx.lineTo(cx - 0.6 * u, cy - 1.4 * u); ctx.lineTo(cx + 1 * u, cy - 0.6 * u); ctx.lineTo(cx + 3.4 * u, cy - 3.2 * u); ctx.stroke();
          break;
        case 'gear': {
          ctx.fillStyle = layer.accent || '#F59E0B';
          ctx.beginPath();
          for (let i = 0; i < 16; i++) { const ang = (i / 16) * Math.PI * 2, R = i % 2 ? 2.6 * u : 3.4 * u; ctx.lineTo(cx + Math.cos(ang) * R, cy + Math.sin(ang) * R); }
          ctx.closePath(); ctx.fill();
          ctx.fillStyle = layer.bg || '#FFFFFF'; ctx.beginPath(); ctx.arc(cx, cy, 1.1 * u, 0, 7); ctx.fill();
          break;
        }
        case 'bolt':
          ctx.fillStyle = layer.accent || '#F59E0B';
          ctx.beginPath(); ctx.moveTo(cx + 0.8 * u, cy - 4 * u); ctx.lineTo(cx - 2.4 * u, cy + 0.6 * u); ctx.lineTo(cx - 0.2 * u, cy + 0.6 * u); ctx.lineTo(cx - 1 * u, cy + 4 * u); ctx.lineTo(cx + 2.4 * u, cy - 0.8 * u); ctx.lineTo(cx + 0.2 * u, cy - 0.8 * u); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = c; ctx.lineWidth = lw * 0.5; ctx.stroke();
          break;
        case 'list':
          rr(cx - 3 * u, cy - 3.6 * u, 6 * u, 7.2 * u, 0.6 * u); ctx.stroke();
          [-1.8, 0, 1.8].forEach((d) => {
            ctx.strokeStyle = '#16A34A'; ctx.beginPath(); ctx.moveTo(cx - 2 * u, cy + d * u); ctx.lineTo(cx - 1.5 * u, cy + d * u + 0.5 * u); ctx.lineTo(cx - 0.7 * u, cy + d * u - 0.5 * u); ctx.stroke();
            ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(cx + 0.1 * u, cy + d * u); ctx.lineTo(cx + 2.1 * u, cy + d * u); ctx.stroke();
          });
          break;
        case 'target':
          [3.4, 2.2, 1].forEach((R, i) => { ctx.fillStyle = i % 2 ? '#FFFFFF' : '#E11D2E'; ctx.beginPath(); ctx.arc(cx, cy, R * u, 0, 7); ctx.fill(); });
          ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 3.6 * u, cy - 3.6 * u); ctx.stroke();
          break;
        case 'bulb':
          ctx.beginPath(); ctx.arc(cx, cy - 1 * u, 2.6 * u, Math.PI * 0.8, Math.PI * 2.2); ctx.lineTo(cx + 1 * u, cy + 2.4 * u); ctx.lineTo(cx - 1 * u, cy + 2.4 * u); ctx.closePath(); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(cx - 1 * u, cy + 3.3 * u); ctx.lineTo(cx + 1 * u, cy + 3.3 * u); ctx.stroke();
          ctx.fillStyle = layer.accent || '#FACC15'; ctx.beginPath(); ctx.arc(cx, cy - 1 * u, 1.4 * u, 0, 7); ctx.fill();
          break;
        case 'check':
          ctx.fillStyle = layer.accent || '#16A34A'; ctx.beginPath(); ctx.arc(cx, cy, 3.6 * u, 0, 7); ctx.fill();
          ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = lw * 1.3; ctx.beginPath(); ctx.moveTo(cx - 1.8 * u, cy); ctx.lineTo(cx - 0.4 * u, cy + 1.5 * u); ctx.lineTo(cx + 2 * u, cy - 1.6 * u); ctx.stroke();
          break;
        case 'flag':
          ctx.beginPath(); ctx.moveTo(cx - 2.5 * u, cy + 4 * u); ctx.lineTo(cx - 2.5 * u, cy - 4 * u); ctx.stroke();
          ctx.fillStyle = layer.accent || '#16A34A'; ctx.beginPath(); ctx.moveTo(cx - 2.5 * u, cy - 4 * u); ctx.lineTo(cx + 3.5 * u, cy - 2.5 * u); ctx.lineTo(cx - 2.5 * u, cy - 0.5 * u); ctx.closePath(); ctx.fill();
          break;
        default:
          ctx.beginPath(); ctx.arc(cx, cy, 3 * u, 0, 7); ctx.stroke();
      }
      if (layer.label) {
        const fs = s * 0.2;
        ctx.font = `700 ${fs}px "Noto Sans SC", ${FALLBACK_STACK}`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillStyle = layer.labelBg || 'rgba(255,255,255,0.92)';
        const tw = ctx.measureText(layer.label).width + fs * 0.6;
        roundRect(ctx, cx - tw / 2, y + s + fs * 0.25, tw, fs * 1.4, fs * 0.3); ctx.fill();
        ctx.fillStyle = layer.labelColor || '#111';
        ctx.fillText(layer.label, cx, y + s + fs * 0.45);
      }
    });
  }

  function drawPhotoSlot(ctx, layer, W, H, img) {
    const x = pct(layer.x, W), y = pct(layer.y, H), w = pct(layer.w, W), h = pct(layer.h, H);
    const minSide = Math.min(W, H), r = pct(layer.radius || 0, minSide);
    withTransform(ctx, layer, x, y, w, h, () => {
      if (layer.frame) {
        const fw = pct(layer.frame.width != null ? layer.frame.width : 1, minSide);
        if (layer.frame.shadow) { ctx.save(); ctx.filter = `blur(${pct(1.2, minSide).toFixed(1)}px)`; ctx.fillStyle = layer.frame.shadow; roundRect(ctx, x - fw + pct(0.4, minSide), y - fw + pct(1, minSide), w + fw * 2, h + fw * 2, r + fw); ctx.fill(); ctx.restore(); }
        ctx.fillStyle = layer.frame.color || '#FFFFFF'; roundRect(ctx, x - fw, y - fw, w + fw * 2, h + fw * 2, r + fw); ctx.fill();
      }
      ctx.save();
      ctx.beginPath(); if (r > 0) roundRectPathNoBegin(ctx, x, y, w, h, r); else ctx.rect(x, y, w, h); ctx.clip();
      if (img) {
        const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
        const sc = Math.max(w / iw, h / ih) * (layer.zoom || 1);
        const dw = iw * sc, dh = ih * sc;
        const fx = (layer.focusX != null ? layer.focusX : 50) / 100, fy = (layer.focusY != null ? layer.focusY : 30) / 100;
        ctx.filter = gradeFilter(layer.filter);
        ctx.drawImage(img, x + (w - dw) * fx, y + (h - dh) * fy, dw, dh);
        ctx.filter = 'none';
      } else {
        ctx.fillStyle = layer.placeholder || 'rgba(0,0,0,0.18)'; ctx.fillRect(x, y, w, h);
      }
      if (layer.tint) { ctx.fillStyle = layer.tint; ctx.fillRect(x, y, w, h); }
      ctx.restore();
      if (layer.border) { ctx.strokeStyle = layer.border.color || '#000'; ctx.lineWidth = pct(layer.border.width || 0.3, minSide); roundRect(ctx, x, y, w, h, r); ctx.stroke(); }
    });
  }
  function drawPatternLayer(ctx, layer, W, H) {
    const x = pct(layer.x != null ? layer.x : 0, W), y = pct(layer.y != null ? layer.y : 0, H);
    const w = pct(layer.w != null ? layer.w : 100, W), h = pct(layer.h != null ? layer.h : 100, H);
    drawPattern(ctx, layer.pattern || layer, x, y, w, h, W, H, layer.id);
  }

  /* —— 图片 / 人物贴纸 —— */
  function imageRect(layer, W, H, img) {
    const x = pct(layer.x, W), y = pct(layer.y, H), w = pct(layer.w, W), h = pct(layer.h, H);
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    const fit = layer.fit || 'cover';
    if (fit === 'cover') {
      const scale = Math.max(w / iw, h / ih);
      const dw = iw * scale, dh = ih * scale;
      const fy = layer.focusY != null ? layer.focusY / 100 : 0.5;
      return { dx: x + (w - dw) / 2, dy: y + (h - dh) * fy, dw, dh };
    }
    if (fit === 'contain') {
      const t = layer._transform || { dx: 0, dy: 0, scale: 1 };
      const scale = Math.min(w / iw, h / ih) * (t.scale || 1) * (layer.scale || 1);
      const dw = iw * scale, dh = ih * scale;
      let dx = x + (w - dw) / 2;
      if (layer.halign === 'left') dx = x; else if (layer.halign === 'right') dx = x + w - dw;
      dx += pct(t.dx || 0, W);
      const dy = (layer.align === 'bottom' ? y + h - dh : layer.align === 'top' ? y : y + (h - dh) / 2) + pct(t.dy || 0, H);
      return { dx, dy, dw, dh };
    }
    return { dx: x, dy: y, dw: w, dh: h };
  }

  /* —— v1.7 人物特效：去色边 + 平滑膨胀描边 + 协调发光 + 接触/长投影 —— */
  const PERSON_FX = {
    auto: { name: '模板默认（已统一规范）' },
    none: { name: '无特效', sticker: { width: 0, shadow: null, soft: false, glow: null, long: false } },
    white: { name: '白色贴纸描边', sticker: { width: 0.9, color: '#FFFFFF', shadow: null, soft: true, long: false } },
    'color-hard': { name: '彩色描边 + 硬阴影', sticker: { width: 0.9, color: 'accent', hard: { color: '#111111' }, soft: false, long: false } },
    glow: { name: '柔光外发光', sticker: { width: 0, glow: { color: 'accent' }, soft: false, long: false } },
    natural: { name: '自然接触阴影', sticker: { width: 0, shadow: null, soft: true, long: true } },
  };
  const fxCache = new WeakMap();
  /** 去色边：半透明边缘像素取内侧更实像素的颜色；alpha 用平滑曲线收紧 */
  function cleanCutout(img, dw, dh) {
    const key = Math.round(dw) + 'x' + Math.round(dh);
    let m = fxCache.get(img); if (!m) { m = {}; fxCache.set(img, m); }
    if (m[key]) return m[key];
    const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(dw)); c.height = Math.max(1, Math.round(dh));
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, c.width, c.height);
    try {
      const id = g.getImageData(0, 0, c.width, c.height), d = id.data, Wc = c.width, Hc = c.height;
      const a0 = new Uint8ClampedArray(Wc * Hc); for (let i = 0; i < Wc * Hc; i++) a0[i] = d[i * 4 + 3];
      const R = 2;
      for (let y = 0; y < Hc; y++) for (let x = 0; x < Wc; x++) {
        const i = y * Wc + x, a = a0[i];
        if (a === 0 || a === 255) continue;
        let best = -1, ba = a;
        for (let oy = -R; oy <= R; oy += R) for (let ox = -R; ox <= R; ox += R) {
          const xx = x + ox, yy = y + oy; if (xx < 0 || yy < 0 || xx >= Wc || yy >= Hc) continue;
          const j = yy * Wc + xx; if (a0[j] > ba) { ba = a0[j]; best = j; }
        }
        if (best >= 0 && ba > 200) { d[i * 4] = d[best * 4]; d[i * 4 + 1] = d[best * 4 + 1]; d[i * 4 + 2] = d[best * 4 + 2]; }
        const t = Math.min(1, Math.max(0, (a / 255 - 0.12) / 0.76));
        d[i * 4 + 3] = Math.round(255 * t * t * (3 - 2 * t));
      }
      g.putImageData(id, 0, 0);
    } catch (e) { /* 跨域图无法读像素：保持原样 */ }
    m[key] = c; return c;
  }
  /** 平滑膨胀轮廓：模糊 alpha 后按低阈值平滑截断（圆角、无锯齿、不断裂） */
  function dilateMask(src, r, pad) {
    const Wc = src.width + pad * 2, Hc = src.height + pad * 2;
    const c = document.createElement('canvas'); c.width = Wc; c.height = Hc;
    const g = c.getContext('2d', { willReadFrequently: true });
    if (r > 0.5) g.filter = `blur(${(r * 0.55).toFixed(1)}px)`;
    g.drawImage(src, pad, pad); g.filter = 'none';
    if (r > 0.5) {
      try {
        const id = g.getImageData(0, 0, Wc, Hc), d = id.data;
        for (let i = 3; i < d.length; i += 4) { const a = d[i] / 255; const t = Math.min(1, Math.max(0, (a - 0.04) / 0.14)); d[i] = Math.round(255 * t); d[i - 3] = d[i - 2] = d[i - 1] = 255; }
        g.putImageData(id, 0, 0);
      } catch (e) { /* ignore */ }
    }
    return c;
  }
  function tintCanvas(c, color) {
    const o = document.createElement('canvas'); o.width = c.width; o.height = c.height;
    const g = o.getContext('2d'); g.drawImage(c, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, o.width, o.height); return o;
  }
  function drawStickerImage(ctx, layer, W, H, img, rect) {
    const minSide = Math.min(W, H);
    const st = layer.sticker || {};
    const accent = (PALETTES[DESIGN.palette] && PALETTES[DESIGN.palette].accent) || '#FFE14D';
    const col = (c, d) => (c === 'accent' ? accent : c || d);
    const isPerson = layer.binding === 'person' || layer.binding === 'person2';
    const clean = isPerson ? cleanCutout(img, rect.dw, rect.dh) : (() => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(rect.dw)); c.height = Math.max(1, Math.round(rect.dh)); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); return c; })();
    let bw = st.width ? pct(st.width, minSide) : 0;
    if (bw && isPerson) bw = Math.max(rect.dh * 0.006, Math.min(rect.dh * 0.012, bw));
    const pad = Math.ceil(bw * 2 + minSide * 0.08);
    const ox = Math.round(rect.dx) - pad, oy = Math.round(rect.dy) - pad;
    const comp = document.createElement('canvas'); comp.width = clean.width + pad * 2; comp.height = clean.height + pad * 2;
    const cg = comp.getContext('2d');
    // 本体（含描边）的轮廓
    const graded = (() => { if (!layer.filter) return clean; const c = document.createElement('canvas'); c.width = clean.width; c.height = clean.height; const g = c.getContext('2d'); g.filter = gradeFilter(layer.filter); g.drawImage(clean, 0, 0); return c; })();
    const sil = bw ? dilateMask(clean, bw, pad) : (() => { const c = document.createElement('canvas'); c.width = comp.width; c.height = comp.height; c.getContext('2d').drawImage(clean, pad, pad); return c; })();
    const d45 = (k) => k * 0.7071;
    // 柔和长投影（右下 45°，与文字阴影同向）+ 接触阴影
    const legacyShadow = st.shadow && !st.hard;
    if (st.long || (DESIGN.softSticker && st.soft !== false && st.long !== false && (st.soft || legacyShadow))) {
      const sh = tintCanvas(sil, '#000');
      cg.save(); cg.globalAlpha = 0.22; cg.filter = `blur(${(minSide * 0.022).toFixed(1)}px)`; cg.drawImage(sh, d45(minSide * 0.022), d45(minSide * 0.022)); cg.restore();
      cg.save(); cg.globalAlpha = 0.3; cg.filter = `blur(${(minSide * 0.006).toFixed(1)}px)`; cg.drawImage(sh, minSide * 0.002, minSide * 0.005); cg.restore();
    }
    if (st.hard || (st.shadow && !st.soft && st.soft !== true && false)) {
      const hc = (st.hard && st.hard.color) || '#111';
      cg.drawImage(tintCanvas(sil, hc), rect.dh * 0.015, rect.dh * 0.015);
    }
    if (st.glow) {
      const gc = tintCanvas(sil, col(st.glow.color, '#FFFFFF'));
      cg.save();
      [[0.05, 0.35], [0.025, 0.4], [0.01, 0.45]].forEach(([r, a]) => { cg.globalAlpha = a; cg.filter = `blur(${(minSide * r).toFixed(1)}px)`; cg.drawImage(gc, 0, 0); });
      cg.restore();
    }
    if (bw) cg.drawImage(tintCanvas(sil, col(st.color, '#FFFFFF')), 0, 0);
    cg.drawImage(graded, pad, pad);
    // 上移时底部羽化
    const gq = isPerson ? alphaGrid(img) : null;
    if (gq && gq.bb && gq.bb.y1 > 0.96 && rect.dy + rect.dh < H - 3) {
      const bottom = pad + clean.height, fh = (gq.bb.y1 - gq.bb.y0) * rect.dh * 0.16;
      const g = cg.createLinearGradient(0, bottom - fh, 0, bottom);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
      cg.globalCompositeOperation = 'destination-out'; cg.fillStyle = g; cg.fillRect(0, bottom - fh, comp.width, comp.height);
      cg.globalCompositeOperation = 'source-over';
    }
    ctx.save();
    if (layer.opacity != null) ctx.globalAlpha *= layer.opacity;
    if (layer.clip) { ctx.beginPath(); ctx.rect(pct(layer.x, W), pct(layer.y, H), pct(layer.w, W), pct(layer.h, H) + 4); ctx.clip(); }
    ctx.drawImage(comp, ox, oy);
    ctx.restore();
  }

  function drawImage(ctx, layer, W, H, img) {
    const x = pct(layer.x, W), y = pct(layer.y, H), w = pct(layer.w, W), h = pct(layer.h, H);
    const minSide = Math.min(W, H);
    const r = pct(layer.radius || 0, minSide);
    if (!img && (layer.binding === 'person' || layer._hidePlaceholder)) return;
    if (img && (layer.sticker || ((layer.binding === 'person' || layer.binding === 'person2') && (layer.fit || 'contain') === 'contain')) && !(layer.radius > 0)) {
      drawStickerImage(ctx, layer, W, H, img, imageRect(layer, W, H, img));
      return;
    }
    withTransform(ctx, layer, x, y, w, h, () => {
      // 相框：白边 + 硬阴影
      if (layer.frame) {
        const fw = pct(layer.frame.width != null ? layer.frame.width : 1.2, minSide);
        const fr = r + fw;
        if (layer.frame.shadow) {
          ctx.fillStyle = layer.frame.shadow.color || 'rgba(0,0,0,0.85)';
          roundRect(ctx, x - fw + pct(layer.frame.shadow.dx || 0.8, minSide), y - fw + pct(layer.frame.shadow.dy || 0.8, minSide), w + fw * 2, h + fw * 2, fr);
          ctx.fill();
        }
        ctx.fillStyle = layer.frame.color || '#FFFFFF';
        roundRect(ctx, x - fw, y - fw, w + fw * 2, h + fw * 2, fr);
        ctx.fill();
      }
      ctx.save();
      if (layer.radius >= 49) { ctx.beginPath(); ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.clip(); }
      else if (r > 0 || layer.clip) { roundRect(ctx, x, y, w, h, r); ctx.clip(); }
      if (img) {
        const rc = imageRect(layer, W, H, img);
        if (layer.bgFill) { ctx.fillStyle = resolveFill(ctx, layer.bgFill, x, y, w, h); ctx.fillRect(x, y, w, h); }
        if (layer.filter) ctx.filter = layer.filter;
        ctx.drawImage(img, rc.dx, rc.dy, rc.dw, rc.dh);
        ctx.filter = 'none';
      } else {
        ctx.fillStyle = layer.placeholder || '#E5E7EB';
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.font = `${Math.max(12, h * 0.08)}px ${FALLBACK_STACK}`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(layer.placeholderLabel || '图片', x + w / 2, y + h / 2);
      }
      ctx.restore();
    });
  }

  /* —— 文字 —— */
  /** 解析 *关键词* 标记 → [{t, hl}]；autoHighlight:'digits' 自动高亮数字及其后量词 */
  function parseRich(text, layer) {
    const out = [];
    const s = String(text || '');
    let hl = false, buf = '';
    for (const ch of s) {
      if (ch === '*' && layer.richText !== false) { if (buf) out.push({ t: buf, hl }); buf = ''; hl = !hl; continue; }
      buf += ch;
    }
    if (buf) out.push({ t: buf, hl });
    if (layer.autoHighlight === 'digits' && !out.some((p) => p.hl)) {
      const res = [];
      out.forEach((p) => {
        p.t.split(/([0-9０-９]+[%倍个天件招步种款条年月万元块分钟秒次点]?)/).forEach((part, i) => { if (part) res.push({ t: part, hl: i % 2 === 1 }); });
      });
      return res;
    }
    return out;
  }
  /** 按宽度换行（保留分段高亮）；返回 lines: [[{t,hl}]] */
  function wrapRich(ctx, segs, maxWidth, noWrap) {
    const lines = [[]];
    let cur = '', curW = 0;
    const flush = (hl) => { if (cur) lines[lines.length - 1].push({ t: cur, hl }); cur = ''; };
    segs.forEach((sg) => {
      for (const ch of sg.t) {
        if (ch === '\n') { flush(sg.hl); lines.push([]); curW = 0; continue; }
        const cw = ctx.measureText(ch).width;
        if (!noWrap && curW + cw > maxWidth && (curW > 0)) {
          // 避免标点出现在行首
          if (NO_HEAD.test(ch)) { cur += ch; curW += cw; continue; }
          // 行尾禁则：前括号/前引号不留在行尾，带到下一行
          let carry = '';
          if (cur && NO_TAIL.test(cur[cur.length - 1])) { carry = cur[cur.length - 1]; cur = cur.slice(0, -1); }
          flush(sg.hl); lines.push([]); curW = 0;
          if (carry) { cur = carry; curW = ctx.measureText(carry).width; }
        }
        cur += ch; curW += cw;
      }
      flush(sg.hl);
    });
    return lines.filter((l, i) => l.length || i < lines.length - 1 || lines.length === 1);
  }
  const NO_HEAD = /[，。！？、；：”’）》】」』…—!?,.:;%)]/;
  const NO_TAIL = /[（《【「『“‘(¥$]/;
  const lineLen = (l) => l.reduce((m, s) => m + [...s.t.replace(/[，。！？、；：”’）》】…—!?,.\s]/g, '')].length, 0);
  /** 孤字回挤：末行只剩 1 个字时，缩窄行宽重新均衡断行 */
  function wrapBalanced(ctx, segs, maxWidth) {
    let lines = wrapRich(ctx, segs, maxWidth);
    if (lines.length < 2 || lineLen(lines[lines.length - 1]) > 1) return lines;
    const n = lines.length;
    const total = lines.reduce((m, l) => m + lineWidth(ctx, l), 0);
    for (let f = total / n; f < maxWidth; f *= 1.03) {
      const t = wrapRich(ctx, segs, f);
      if (t.length === n && lineLen(t[t.length - 1]) > 1) return t;
    }
    return lines;
  }
  /** 单行文本择优断成 2 行（在标点/空格/“的”后断，数字不拆），返回带 \n 的段 */
  function autoBreak(segs) {
    const plain = segs.map((s) => s.t).join('');
    const chars = [...plain];
    if (chars.length < 6 || /\n/.test(plain)) return null;
    const mid = chars.length / 2;
    let best = -1, bestScore = 1e9;
    for (let i = 2; i <= chars.length - 2; i++) {
      const a = chars[i - 1], b = chars[i];
      if (NO_HEAD.test(b) || NO_TAIL.test(a)) continue;
      if (/[0-9０-９A-Za-z%]/.test(a) && /[0-9０-９A-Za-z%倍个天件招步种款条年月万元块分钟秒次点]/.test(b)) continue;
      let score = Math.abs(i - mid);
      if (/[，、：！？\s|｜]/.test(a)) score -= 2.5;
      if (/[的了和与跟]/.test(a)) score -= 0.8;
      if (score < bestScore) { bestScore = score; best = i; }
    }
    if (best < 0) return null;
    // 在 segs 中第 best 个字符处插入换行
    let k = 0; const out = [];
    segs.forEach((s) => {
      let t = '';
      for (const ch of s.t) { if (k === best) t += '\n'; t += ch; k++; }
      out.push({ ...s, t });
    });
    return out.map((s) => ({ ...s, t: s.t.replace(/^[，、\s]+|[，、\s]+(?=\n)/g, '') }));
  }
  // v1.7：多行折行（layer.breakLines=N）：在 1/N 处附近找可断点，递归切成 N 行
  function autoBreakN(segs, n) {
    let cur = segs;
    for (let k = n; k >= 2; k--) {
      const plain = cur.map((s) => s.t).join('');
      const parts = plain.split('\n'); const last = parts[parts.length - 1];
      const chars = [...last]; if (chars.length < 2 * 2) break;
      const off = [...plain].length - chars.length;
      const mid = chars.length / k; let best = -1, bs = 1e9;
      for (let i = 1; i <= chars.length - 1; i++) {
        const a = chars[i - 1], b = chars[i];
        if (NO_HEAD.test(b) || NO_TAIL.test(a)) continue;
        if (/[0-9A-Za-z%]/.test(a) && /[0-9A-Za-z%]/.test(b)) continue;
        let sc = Math.abs(i - mid); if (/[，、：！？\s|｜]/.test(a)) sc -= 1.5;
        if (sc < bs) { bs = sc; best = i; }
      }
      if (best < 0) break;
      const at = off + best; let q = 0;
      cur = cur.map((s) => { let t = ''; for (const ch of s.t) { if (q === at) t += '\n'; t += ch; q++; } return { ...s, t }; });
    }
    return cur.map((s) => ({ ...s, t: s.t.replace(/[，、\s]+(?=\n)/g, '') }));
  }
  /** v1.7 弧形字：整行沿圆弧排列（arc.bend 度数，正=拱形∩，负=笑脸∪），描边/外描边/硬阴影按字绘制 */
  function drawArcText(ctx, layer, segs, fs, cx, baseY, minSide) {
    const chars = [];
    segs.forEach((sg) => { for (const ch of sg.t) if (ch !== '\n') chars.push({ ch, color: sg.color || (sg.hl && layer.highlight && layer.highlight.color) || layer.color || '#000' }); });
    const ws = chars.map((c) => ctx.measureText(c.ch).width);
    const tw = ws.reduce((a, b) => a + b, 0);
    const bend = ((layer.arc.bend || 30) * Math.PI) / 180, sign = bend >= 0 ? 1 : -1;
    const R = tw / Math.abs(bend), cyc = baseY + sign * R;
    const pass = (fn) => { let a = -tw / 2; chars.forEach((c, i) => { const mid = a + ws[i] / 2; a += ws[i]; const ph = mid / R;
      ctx.save(); ctx.translate(cx + R * Math.sin(ph), cyc - sign * R * Math.cos(ph)); ctx.rotate(sign * ph); fn(c, -ws[i] / 2); ctx.restore(); }); };
    ctx.lineJoin = 'round'; ctx.miterLimit = 2;
    if (layer.hardShadow) { const dx = pct(layer.hardShadow.dx != null ? layer.hardShadow.dx : 0.5, minSide), dy = pct(layer.hardShadow.dy != null ? layer.hardShadow.dy : 0.6, minSide);
      pass((c, ox) => { ctx.fillStyle = layer.hardShadow.color || '#111'; ctx.strokeStyle = ctx.fillStyle;
        const so = layer.strokeOuter ? strokeWidthPx(layer.strokeOuter, minSide, fs) : layer.stroke ? strokeWidthPx(layer.stroke, minSide, fs) : 0;
        if (so) { ctx.lineWidth = so * 2; ctx.strokeText(c.ch, ox + dx, dy); } ctx.fillText(c.ch, ox + dx, dy); }); }
    if (layer.strokeOuter) pass((c, ox) => { ctx.lineWidth = strokeWidthPx(layer.strokeOuter, minSide, fs) * 2; ctx.strokeStyle = layer.strokeOuter.color || '#fff'; ctx.strokeText(c.ch, ox, 0); });
    if (layer.stroke) pass((c, ox) => { ctx.lineWidth = strokeWidthPx(layer.stroke, minSide, fs) * (layer.strokeOuter ? 1 : 2); ctx.strokeStyle = layer.stroke.color || '#000'; ctx.strokeText(c.ch, ox, 0); });
    pass((c, ox) => { ctx.fillStyle = c.color; ctx.fillText(c.ch, ox, 0); });
  }
  function lineWidth(ctx, line) { return line.reduce((m, s) => m + ctx.measureText(s.t).width, 0); }

  function si0(layer, minSide, fs) { return layer.stroke ? strokeWidthPx(layer.stroke, minSide, fs) / fs : 0; }
  function lum(r, g, b) { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); }
  function colorLum(c) { const rgb = toRgb(c); return rgb ? lum(rgb[0], rgb[1], rgb[2]) : 1; }
  /** 自动对比度：采样文字区底图平均亮度，对比度 < 3:1 时在文字下加柔边遮罩（不改模板） */
  function autoScrim(ctx, layer, color, bx, by, bw, bh, fs, minSide, strokeRatio) {
    if (strokeRatio >= 0.07 || typeof color !== 'string') return;
    const W = ctx.canvas.width, H = ctx.canvas.height;
    const x0 = Math.max(0, Math.floor(bx)), y0 = Math.max(0, Math.floor(by)), x1 = Math.min(W, Math.ceil(bx + bw)), y1 = Math.min(H, Math.ceil(by + bh));
    if (x1 - x0 < 4 || y1 - y0 < 4) return;
    let d; try { d = ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data; } catch (e) { return; }
    let sum = 0, n = 0; const step = 4 * Math.max(1, Math.floor((d.length / 4) / 4000));
    for (let i = 0; i < d.length; i += step) { sum += lum(d[i], d[i + 1], d[i + 2]); n++; }
    const Lb = sum / Math.max(1, n), Lt = colorLum(color);
    const ratio = (Math.max(Lb, Lt) + 0.05) / (Math.min(Lb, Lt) + 0.05);
    const need = layer.hardShadow ? 2.2 : 3;
    if (ratio >= need) return;
    const dark = Lt > 0.4;
    const pad = fs * 0.45, blur = fs * 0.5;
    const a = Math.min(0.85, 0.45 + (need - ratio) * 0.15);
    // v1.7：不再画矩形底衬，改为贴字形的柔和光晕（由 drawText 的离屏本体派生）
    ctx._scrims = (ctx._scrims || 0) + 1;
    return { color: dark ? '#000' : '#FFF', alpha: a };
  }
  /* —— v1.7 文字特效预设与归一化 —— */
  const TEXT_FX = {
    auto: { name: '模板默认（已统一规范）' },
    'white-black': { name: '粗白字·黑描边·黑硬阴影', color: '#FFFFFF', stroke: { color: '#111111', ratio: 0.11 }, strokeOuter: null, hardShadow: { color: '#111111' }, shadow: null, glow: null, extrude: null },
    'yellow-frame': { name: '黄字·黑描边·白外框', color: '#FFE14D', stroke: { color: '#111111', ratio: 0.12 }, strokeOuter: { color: '#FFFFFF', ratio: 0.26 }, hardShadow: { color: '#111111' }, shadow: null, glow: null, extrude: null },
    neon: { name: '荧光字·深色描边·发光', color: '#E6FF3D', stroke: { color: '#0B0B0B', ratio: 0.08 }, strokeOuter: null, hardShadow: null, shadow: null, glow: { color: '#B6FF00' }, extrude: null },
    'serif-soft': { name: '杂志宋体·细描边·轻投影', fontFamily: 'Noto Serif SC', fontWeight: '900', color: '#FFFFFF', stroke: { color: 'rgba(0,0,0,0.55)', ratio: 0.03 }, strokeOuter: null, hardShadow: null, shadow: { color: 'rgba(0,0,0,0.5)' }, glow: null, extrude: null },
    extrude: { name: '立体挤出字', color: '#FFE14D', stroke: { color: '#111111', ratio: 0.09 }, strokeOuter: null, hardShadow: null, shadow: null, glow: null, extrude: { color: '#E8590C', edge: '#111111', depth: 0.09 } },
    hand: { name: '手写体·白描边·彩色投影', fontFamily: 'Smiley Sans', fontWeight: '400', color: '#FF4D8D', stroke: null, strokeOuter: { color: '#FFFFFF', ratio: 0.24 }, hardShadow: { color: '#7C3AED' }, shadow: null, glow: null, extrude: null },
  };
  function applyTextFx(l, key) {
    const p = TEXT_FX[key];
    if (!p || key === 'auto' || l.type !== 'text' || !(l.binding === 'title' || /^title/.test(l.id || ''))) return l;
    const o = { ...l };
    for (const k of ['color', 'stroke', 'strokeOuter', 'hardShadow', 'shadow', 'glow', 'extrude', 'fontFamily', 'fontWeight']) if (k in p) o[k] = p[k];
    return o;
  }
  /** 统一规范：圆角描边、宽度按字号比例夹紧；硬阴影统一右下 45°、偏移≈字号 5%；柔影/发光限幅 */
  function normFx(layer, fs, minSide) {
    let si = layer.stroke ? strokeWidthPx(layer.stroke, minSide, fs) : 0;
    let so = layer.strokeOuter ? strokeWidthPx(layer.strokeOuter, minSide, fs) : 0;
    if (!(layer.stroke && (layer.stroke.width != null || layer.stroke.widthPx != null))) si = Math.min(si, fs * 0.13);
    if (so) so = Math.max(so, si + fs * 0.06);
    so = Math.min(so, si + fs * 0.2);
    const fx = { si, so, innerColor: (layer.stroke && layer.stroke.color) || '#000', outerColor: (layer.strokeOuter && layer.strokeOuter.color) || '#FFFFFF' };
    if (layer.extrude) fx.extrude = { color: layer.extrude.color || '#111', edge: layer.extrude.edge || null, depthPx: fs * (layer.extrude.depth || 0.08), depth: layer.extrude.depth || 0.08 };
    else if (layer.hardShadow) fx.hard = { color: layer.hardShadow.color || '#111', d: Math.max(2, fs * 0.036) };
    if (layer.shadow && !layer.hardShadow && !layer.extrude) {
      const sh = layer.shadow;
      fx.soft = { color: sh.color && !/rgba/.test(sh.color) ? sh.color : 'rgb(0,0,0)', alpha: Math.min(0.45, (/rgba\([^)]*,\s*([\d.]+)\)/.exec(sh.color || '') || [0, 0.4])[1] * 1), blur: Math.min(fs * 0.08, Math.max(fs * 0.03, sh.blur != null ? pct(sh.blur, minSide) : fs * 0.05)), dx: fs * 0.015, dy: fs * 0.03 };
    }
    if (layer.glow) fx.glow = { color: layer.glow.color || layer.color || '#FFFFFF', blur: fs * (layer.glow.blur || 0.22), alpha: layer.glow.alpha || 0.7 };
    return fx;
  }
  function drawText(ctx, layer, W, H, text) {
    const x = pct(layer.x, W), y = pct(layer.y, H), w = pct(layer.w, W), h = pct(layer.h, H);
    const minSide = Math.min(W, H);
    const lineHeight = layer.lineHeight || 1.3;
    const align = layer.align || 'left';
    const valign = layer.valign || 'top';
    let content = text != null && text !== '' ? text : layer.sample || '';
    if (layer.part != null) content = splitPart(content, layer.part, layer.parts || 2);
    if (layer.vertical) { let o = '', n = 0; for (const ch of String(content).replace(/[\s\/／]+/g, '')) { if (ch === '*') { o += ch; continue; } o += (n++ ? '\n' : '') + ch; } content = o; }
    if (layer.splitOn) content = String(content).split(new RegExp(layer.splitOn)).map((t) => t.trim()).filter(Boolean).map((t, i) => (layer.listPrefix ? layer.listPrefix[i] || '' : '') + t).join('\n');
    if (!String(content).trim()) return;
    const fillColor = layer.color || '#000';
    const segs = parseRich(content, layer);
    const ls = layer.letterSpacing || 0;
    const setFont = (fs) => {
      ctx.font = buildFont(layer, fs);
      if ('letterSpacing' in ctx) ctx.letterSpacing = ls ? `${(ls * fs).toFixed(2)}px` : '0px';
    };

    let fontSize = pct(layer.fontSize || 4, minSide);
    // 描边会向外扩，测量时预留
    const outerPad = (fs) => {
      const so = layer.strokeOuter ? strokeWidthPx(layer.strokeOuter, minSide, fs) : 0;
      const si = layer.stroke ? strokeWidthPx(layer.stroke, minSide, fs) : 0;
      return Math.max(so, si);
    };
    let lines;
    if (layer.fit === 'width') {
      // 不自动换行，字号撑满宽度（受 maxFontSize 与盒高限制）
      setFont(100);
      const fitFs = (ls_) => {
        const wd = Math.max(1, ...ls_.map((l) => lineWidth(ctx, l)));
        let f = (100 * (w * (layer.fill != null ? layer.fill : 1))) / wd;
        const mx = layer.maxFontSize != null ? pct(layer.maxFontSize, minSide) : f;
        return { f: Math.min(f, mx, h / (ls_.length * lineHeight)), wd };
      };
      lines = wrapRich(ctx, segs, w, true);
      let pick = fitFs(lines);
      if (DESIGN.autoBreak && layer.autoBreak !== false && lines.length === 1 && layer.part == null) {
        const br = autoBreak(segs);
        if (br) {
          const l2 = wrapRich(ctx, br, w, true), p2 = fitFs(l2);
          if (p2.f > pick.f * 1.18) { lines = l2; pick = p2; }
        }
      }
      if (layer.breakLines > 1 && layer.part == null && !/\n/.test(segs.map((s) => s.t).join(''))) {
        for (let n = 2; n <= layer.breakLines; n++) {
          const l2 = wrapRich(ctx, autoBreakN(segs, n), w, true), p2 = fitFs(l2);
          if (p2.f > pick.f * 1.08) { lines = l2; pick = p2; }
        }
      }
      const widest = pick.wd;
      let fs = pick.f;
      // 减去描边占位
      for (let k = 0; k < 3; k++) {
        const pad = outerPad(fs);
        const sc = (w - pad) / w;
        fs = Math.min(fs, (100 * w * sc) / widest);
      }
      fontSize = fs;
      setFont(fontSize);
    } else {
      setFont(fontSize);
      lines = wrapBalanced(ctx, segs, w - outerPad(fontSize));
      // 超高自动缩小
      let guard = 0;
      while (lines.length * fontSize * lineHeight > h * 1.02 && guard++ < 30) {
        fontSize *= 0.93;
        setFont(fontSize);
        lines = wrapBalanced(ctx, segs, w - outerPad(fontSize));
      }
    }
    // v1.6：主副字号比 ≥ 2.2；小字下限
    if (DESIGN.ratio && ctx._titleFs && (layer.binding === 'subtitle' || layer.binding === 'tagline') && !layer.noRatio) {
      const cap = ctx._titleFs / DESIGN.ratio;
      if (fontSize > cap) { fontSize = cap; setFont(fontSize); if (layer.fit !== 'width') lines = wrapBalanced(ctx, segs, w - outerPad(fontSize)); }
    }
    if (DESIGN.minFont && !layer.tiny) {
      const mn = pct(DESIGN.minFont, minSide);
      if (fontSize < mn) { fontSize = mn; setFont(fontSize); if (layer.fit !== 'width') lines = wrapBalanced(ctx, segs, w - outerPad(fontSize)); }
    }
    if (layer.binding === 'title' || /^title/.test(layer.id || '')) ctx._titleFs = Math.max(ctx._titleFs || 0, fontSize);
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    const lineH = fontSize * lineHeight;
    const totalH = lines.length * lineH;
    let startY = y;
    if (valign === 'middle') startY = y + (h - totalH) / 2;
    else if (valign === 'bottom') startY = y + h - totalH;
    // 基线：CJK 字形在 em 框内大致居中，取 0.5*lineH + 0.36*fs
    const baseOf = (i) => startY + i * lineH + lineH / 2 + fontSize * 0.36;
    const lineX = (lw) => (align === 'center' ? x + (w - lw) / 2 : align === 'right' ? x + w - lw : x);
    const widths = lines.map((l) => lineWidth(ctx, l));
    const maxLineW = Math.max(0, ...widths);
    if (ctx._textBoxes && (ctx._measure || !layer.ignoreFace)) ctx._textBoxes.push({ id: layer.id, x: lineX(maxLineW), y: startY, w: maxLineW, h: totalH });
    if (ctx._measure) return;
    if (layer.arc) { drawArcText(ctx, layer, segs, fontSize, x + w / 2, baseOf(0), minSide); return; }

    let halo = null;
    if (DESIGN.autoContrast && ctx._photoMode && !layer.banner && !layer.noScrim && maxLineW > 0) halo = autoScrim(ctx, layer, fillColor, lineX(maxLineW), startY, maxLineW, totalH, fontSize, minSide, si0(layer, minSide, fontSize));
    withTransform(ctx, layer, x, y, w, h, () => {
      // banner：圆角底（逐行 or 整块）
      if (layer.banner && lines.length) {
        const b = layer.banner;
        const padX = pct(b.paddingX != null ? b.paddingX : 2.2, minSide);
        const padY = pct(b.paddingY != null ? b.paddingY : 1.2, minSide);
        const br = pct(b.radius != null ? b.radius : 2.5, minSide);
        const boxes = b.perLine
          ? lines.map((l, i) => [lineX(widths[i]) - padX, startY + i * lineH - padY * 0.5 + lineH * 0.06, widths[i] + padX * 2, lineH + padY - lineH * 0.12])
          : [[lineX(maxLineW) - padX, startY - padY, maxLineW + padX * 2, totalH + padY * 2]];
        boxes.forEach(([bx, by, bw, bh]) => {
          if (b.shadow) {
            ctx.fillStyle = b.shadow.color || '#111';
            roundRect(ctx, bx + pct(b.shadow.dx != null ? b.shadow.dx : 0.6, minSide), by + pct(b.shadow.dy != null ? b.shadow.dy : 0.6, minSide), bw, bh, br);
            ctx.fill();
          }
          ctx.fillStyle = resolveFill(ctx, b.fill || '#FFFFFF', bx, by, bw, bh);
          roundRect(ctx, bx, by, bw, bh, br); ctx.fill();
          if (b.border) {
            ctx.strokeStyle = b.border.color || '#000';
            ctx.lineWidth = pct(b.border.width || 0.15, minSide);
            roundRect(ctx, bx, by, bw, bh, br); ctx.stroke();
          }
        });
      }

      // 关键词高亮色块（在描边下）
      const hl = layer.highlight || {};
      if (hl.block) {
        lines.forEach((line, i) => {
          let cx = lineX(widths[i]);
          line.forEach((s) => {
            const sw = ctx.measureText(s.t).width;
            if (s.hl) {
              const py = pct(hl.block.padY != null ? hl.block.padY : 0.2, minSide), px = pct(hl.block.padX != null ? hl.block.padX : 0.6, minSide);
              const top = startY + i * lineH + lineH * (hl.block.top != null ? hl.block.top : 0.08) - py;
              const bh = lineH * (hl.block.height != null ? hl.block.height : 0.84) + py * 2;
              ctx.fillStyle = hl.block.fill || '#FFE14D';
              if (hl.block.shadow) { ctx.save(); ctx.fillStyle = hl.block.shadow; roundRect(ctx, cx - px + pct(0.6, minSide), top + pct(0.6, minSide), sw + px * 2, bh, pct(hl.block.radius || 0.6, minSide)); ctx.fill(); ctx.restore(); ctx.fillStyle = hl.block.fill || '#FFE14D'; }
              roundRect(ctx, cx - px, top, sw + px * 2, bh, pct(hl.block.radius || 0.6, minSide));
              ctx.fill();
            }
            cx += sw;
          });
        });
      }

      const eachSeg = (fn) => {
        lines.forEach((line, i) => {
          let cx = lineX(widths[i]);
          const by = baseOf(i);
          line.forEach((s) => { fn(s, cx, by); cx += ctx.measureText(s.t).width; });
        });
      };
      // v1.7 文字特效：离屏合成（外描边→内描边→填充 = 字体本体），再由本体轮廓派生阴影/挤出/发光，避免叠 strokeText 的重影、半透明叠色和方向不一
      const fx = normFx(layer, fontSize, minSide);
      const so = fx.so, si = fx.si;
      const pad = Math.ceil(so + si + fontSize * (0.25 + (halo ? 0.4 : 0) + (fx.glow ? 0.5 : 0) + (fx.soft ? 0.3 : 0) + (fx.extrude ? fx.extrude.depth : 0)) + 4);
      const xs = lines.map((l, i) => lineX(widths[i]));
      const bx0 = Math.floor(Math.min(...xs) - pad), by0 = Math.floor(startY - pad);
      const bw = Math.ceil(maxLineW + pad * 2), bh = Math.ceil(totalH + pad * 2);
      const mk = () => {
        const c = document.createElement('canvas'); c.width = Math.max(1, bw); c.height = Math.max(1, bh);
        const g = c.getContext('2d'); g.translate(-bx0, -by0); g.font = ctx.font;
        if ('letterSpacing' in g) g.letterSpacing = ctx.letterSpacing || '0px';
        g.textBaseline = 'alphabetic'; g.textAlign = 'left'; g.lineJoin = 'round'; g.lineCap = 'round'; g.miterLimit = 1;
        return [c, g];
      };
      const eachG = (g, fn) => lines.forEach((line, i) => { let cx = xs[i]; const by = baseOf(i); line.forEach((sg) => { fn(sg, cx, by); cx += g.measureText(sg.t).width; }); });
      const [body, bg2] = mk();
      if (so) { bg2.lineWidth = so; bg2.strokeStyle = fx.outerColor; eachG(bg2, (sg, cx, by) => bg2.strokeText(sg.t, cx, by)); }
      if (si) { bg2.lineWidth = si; eachG(bg2, (sg, cx, by) => { bg2.strokeStyle = sg.hl && hl.stroke ? hl.stroke : fx.innerColor; bg2.strokeText(sg.t, cx, by); }); }
      eachG(bg2, (sg, cx, by) => { bg2.fillStyle = sg.hl && hl.color ? hl.color : resolveFill(bg2, fillColor, x, startY, w, totalH); bg2.fillText(sg.t, cx, by); });
      const tint = (color) => { const [c, g] = mk(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(body, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, bw, bh); return c; };
      if (fx.soft) {
        ctx.save(); ctx.globalAlpha *= fx.soft.alpha; ctx.filter = `blur(${fx.soft.blur.toFixed(1)}px)`;
        ctx.drawImage(tint(fx.soft.color), bx0 + fx.soft.dx, by0 + fx.soft.dy); ctx.restore();
      }
      if (halo) {
        const hc = tint(halo.color);
        ctx.save();
        [[0.16, 1], [0.06, 0.8]].forEach(([r, k]) => { ctx.globalAlpha = halo.alpha * k; ctx.filter = `blur(${(fontSize * r).toFixed(1)}px)`; ctx.drawImage(hc, bx0, by0); });
        ctx.restore();
      }
      if (fx.glow) {
        const gc = tint(fx.glow.color);
        ctx.save();
        [1, 0.55, 0.28].forEach((k, i) => { ctx.globalAlpha = fx.glow.alpha * (i ? 0.8 : 1); ctx.filter = `blur(${(fx.glow.blur * k).toFixed(1)}px)`; ctx.drawImage(gc, bx0, by0); });
        ctx.restore();
      }
      if (fx.extrude) {
        const n = Math.max(2, Math.round(fx.extrude.depthPx)), c0 = tint(fx.extrude.color), c1 = fx.extrude.edge ? tint(fx.extrude.edge) : null;
        for (let k = n; k >= 1; k--) ctx.drawImage(k === n && c1 ? c1 : c0, bx0 + k * 0.7071, by0 + k * 0.7071);
      } else if (fx.hard) {
        ctx.drawImage(tint(fx.hard.color), bx0 + fx.hard.d, by0 + fx.hard.d);
      }
      ctx.drawImage(body, bx0, by0);

      // 下划线强调条
      if (layer.underline && lines.length) {
        const u = layer.underline;
        const uH = pct(u.height != null ? u.height : 0.7, minSide);
        const gap = pct(u.offsetY != null ? u.offsetY : 0.4, minSide);
        const uw = maxLineW * (u.widthRatio != null ? u.widthRatio : 0.92);
        const lastW = widths[widths.length - 1];
        const ux = align === 'center' ? x + (w - uw) / 2 : align === 'right' ? x + w - uw : x;
        const uy = startY + totalH + gap;
        if (u.brush) {
          ctx.save();
          drawBrush(ctx, { tilt: u.tilt || 0 }, ux, uy - uH, Math.max(uw, lastW * 0.5), uH, u.color || '#F5C518', hashStr(layer.id));
          ctx.restore();
        } else {
          ctx.fillStyle = parseColor(u.color || '#F5C518');
          const ur = pct(u.radius != null ? u.radius : 0.3, minSide);
          if (ur > 0) { roundRect(ctx, ux, uy, uw, uH, ur); ctx.fill(); } else ctx.fillRect(ux, uy, uw, uH);
        }
      }
    });
  }

  function drawBadge(ctx, layer, W, H, text) {
    let content = text != null && text !== '' ? text : layer.sample || '标签';
    if (!content) return;
    if (layer.vertical) content = [...String(content).replace(/\s+/g, '')].join('\n');
    let x = pct(layer.x, W), y = pct(layer.y, H), w = pct(layer.w, W), h = pct(layer.h, H);
    const minSide = Math.min(W, H);
    if (layer.square) { const s = Math.min(w, h); x += (w - s) / 2; y += (h - s) / 2; w = s; h = s; }
    const r = pct(layer.radius != null ? layer.radius : 1, minSide);
    let fontSize = pct(layer.fontSize || 2.5, minSide);
    if (ctx._textBoxes && ctx._measure) ctx._textBoxes.push({ id: layer.id, kind: 'badge', x, y, w, h });

    withTransform(ctx, layer, x, y, w, h, () => {
      const shapeLayer = { id: layer.id, shape: layer.shape || 'rect', radius: layer.radius != null ? layer.radius : 1, points: layer.points, inner: layer.inner, tail: layer.tail };
      if (layer.bg && layer.bg !== 'transparent') {
        if (layer.hardShadow) {
          ctx.save();
          ctx.translate(pct(layer.hardShadow.dx != null ? layer.hardShadow.dx : 0.6, minSide), pct(layer.hardShadow.dy != null ? layer.hardShadow.dy : 0.6, minSide));
          shapePath(ctx, shapeLayer, x, y, w, h, minSide);
          ctx.fillStyle = layer.hardShadow.color || '#111'; ctx.fill();
          ctx.restore();
        }
        shapePath(ctx, shapeLayer, x, y, w, h, minSide);
        ctx.fillStyle = resolveFill(ctx, layer.bg, x, y, w, h);
        ctx.fill();
      }
      if (layer.border) {
        shapePath(ctx, shapeLayer, x, y, w, h, minSide);
        ctx.strokeStyle = layer.border.color || '#000';
        ctx.lineWidth = pct(layer.border.width || 0.15, minSide);
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
      ctx.font = buildFont(layer, fontSize);
      // 文字超宽时缩小
      const inner = layer.shape === 'burst' || layer.shape === 'star' || layer.shape === 'ellipse' ? 0.68 : 0.86;
      const lines = String(content).split('\n');
      const mw = Math.max(...lines.map((l) => ctx.measureText(l).width));
      if (mw > w * inner) { fontSize *= (w * inner) / mw; ctx.font = buildFont(layer, fontSize); }
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      const lh = fontSize * 1.1;
      lines.forEach((ln, i) => {
        const by = y + h / 2 - (lines.length * lh) / 2 + i * lh + lh / 2 + fontSize * 0.36;
        if (layer.stroke) {
          ctx.lineJoin = 'round';
          ctx.strokeStyle = layer.stroke.color || '#000';
          ctx.lineWidth = strokeWidthPx(layer.stroke, minSide, fontSize);
          ctx.strokeText(ln, x + w / 2, by);
        }
        ctx.fillStyle = parseColor(layer.color || '#FFF');
        ctx.fillText(ln, x + w / 2, by);
      });
      if (layer.underline) {
        const u = layer.underline;
        const uH = pct(u.height != null ? u.height : 0.55, minSide);
        const uw = w * (u.widthRatio != null ? u.widthRatio : 0.55);
        ctx.fillStyle = parseColor(u.color || '#F5C518');
        roundRect(ctx, x + (w - uw) / 2, y + h * 0.72, uw, uH, pct(u.radius != null ? u.radius : 0.25, minSide));
        ctx.fill();
      }
    });
  }

  /** 人物层：模板含 binding=person 的图层则使用；否则在首个文字层之前注入默认人物槽 */
  const DEFAULT_PERSON = {
    id: 'person-auto', type: 'image', binding: 'person', visible: true,
    x: 38, y: 18, w: 62, h: 82, fit: 'contain', align: 'bottom', radius: 0,
    sticker: { width: 0.9, color: '#FFFFFF', shadow: { color: 'rgba(0,0,0,0.35)', dx: 0.6, dy: 0.6 } },
  };
  function withPersonLayer(layers, data) {
    const tf = data.personTransform || null;
    let found = false;
    layers = layers.filter((l) => !(l.needPerson2 && !data.person2)).map((l) => (l.withP2 && data.person2 ? { ...l, ...l.withP2 } : l));
    const out = layers.map((l) => {
      if (l.binding === 'person2') return { ...l, fit: l.fit || 'contain', align: l.align || 'bottom', _transform: data.person2 ? null : tf };
      if (l.binding !== 'person') return l;
      found = true;
      return { ...l, fit: l.fit || 'contain', align: l.align || 'bottom', _transform: tf };
    });
    if (!data.person) {
      // 无人物：去掉人物层；若模板声明了 noPerson 替代层则显示
      return out.filter((l) => l.binding !== 'person' && l.binding !== 'person2').map((l) => (l.onlyNoPerson ? { ...l, visible: l.visible } : l));
    }
    const out2 = out.filter((l) => !l.onlyNoPerson);
    out2.forEach((l, i) => {
      if (l.type === 'image' && l.binding !== 'person' && l.binding !== 'person2' && !resolveImageUrl(l, data)) out2[i] = { ...l, _hidePlaceholder: true };
    });
    if (found) return out2;
    const idx = out2.findIndex((l) => l.type === 'text' || l.type === 'badge');
    const pl = { ...DEFAULT_PERSON, _transform: tf };
    if (idx < 0) out2.push(pl); else out2.splice(idx, 0, pl);
    return out2;
  }

  /* —— v1.7 文字避让人物 ——
   * 人物 alpha（抠图）→ 低分辨率网格；文字/徽章/装饰 → 渲染框；
   * 计算每个框被人物覆盖的比例（>3% 视为冲突）与是否碰到脸（0 容忍），
   * 搜索人物位移/缩放、标题缩字、文字挪到人物另一侧留白，取代价最小的方案。 */
  const AVOID_TH = 0.03;
  const gridCache = new WeakMap();
  function alphaGrid(img) {
    if (!img) return null;
    if (gridCache.has(img)) return gridCache.get(img);
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    if (!iw || !ih) return null;
    const gw = 96, gh = Math.max(8, Math.round((96 * ih) / iw));
    const c = document.createElement('canvas'); c.width = gw; c.height = gh;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(img, 0, 0, gw, gh);
    let d; try { d = x.getImageData(0, 0, gw, gh).data; } catch (e) { return null; }
    const a = new Uint8Array(gw * gh);
    let minX = gw, minY = gh, maxX = -1, maxY = -1, opaque = 0;
    for (let i = 0; i < gw * gh; i++) {
      if (d[i * 4 + 3] > 110) { a[i] = 1; opaque++; const px = i % gw, py = (i / gw) | 0; if (px < minX) minX = px; if (px > maxX) maxX = px; if (py < minY) minY = py; if (py > maxY) maxY = py; }
    }
    // 整张不透明（未抠图的原照片）→ 用估计的人物包围区（中间 64% 宽、上 8% 起）椭圆近似
    if (opaque > gw * gh * 0.97) {
      a.fill(0); minX = gw; maxX = -1; minY = gh; maxY = -1;
      for (let py = 0; py < gh; py++) for (let px = 0; px < gw; px++) {
        const nx = px / gw, ny = py / gh;
        const headC = ny < 0.42 && ((nx - 0.5) / 0.17) ** 2 + ((ny - 0.26) / 0.18) ** 2 <= 1;
        const body = ny >= 0.4 && Math.abs(nx - 0.5) <= 0.18 + (ny - 0.4) * 0.5;
        if (headC || body) { a[py * gw + px] = 1; if (px < minX) minX = px; if (px > maxX) maxX = px; if (py < minY) minY = py; if (py > maxY) maxY = py; }
      }
      opaque = -1;
    }
    const g = { gw, gh, a, bb: maxX < 0 ? null : { x0: minX / gw, y0: minY / gh, x1: (maxX + 1) / gw, y1: (maxY + 1) / gh }, estimated: opaque < 0 };
    // 脸部：头顶向下 head 高度带内 alpha 的列中心
    if (g.bb) {
      const bw = g.bb.x1 - g.bb.x0, bh = (g.bb.y1 - g.bb.y0) * (ih / iw);
      const headN = Math.min(bh * 0.3, bw * 0.62) / (ih / iw); // 归一化到图高
      const r0 = Math.floor(g.bb.y0 * gh), r1 = Math.min(gh, Math.ceil((g.bb.y0 + headN) * gh));
      let sx = 0, n = 0, lo = gw, hi = 0;
      for (let py = r0; py < r1; py++) for (let px = 0; px < gw; px++) if (a[py * gw + px]) { sx += px; n++; }
      const cx = n ? sx / n / gw : (g.bb.x0 + g.bb.x1) / 2;
      // 头宽：头带中部行的 alpha 宽度
      const mid = Math.min(gh - 1, Math.floor(g.bb.y0 * gh + (r1 - r0) * 0.55));
      for (let px = 0; px < gw; px++) if (a[mid * gw + px] && Math.abs(px / gw - cx) < bw * 0.4) { lo = Math.min(lo, px); hi = Math.max(hi, px); }
      const headW = hi > lo ? (hi - lo + 1) / gw : bw * 0.42;
      const fw = Math.min(bw * 0.5, headW * 0.95);
      g.face = { x: cx - fw / 2, y: g.bb.y0 + headN * 0.18, w: fw, h: headN * 0.9 };
    }
    gridCache.set(img, g);
    return g;
  }
  /** 人物蒙版（画布坐标）：[{x,y,w,h,g,clip}] */
  function personMasks(ctxInfo, tf) {
    const { W, H, photoMode, ph, photoImg, cutImg, data, layers, imgs } = ctxInfo;
    const out = [];
    if (photoMode) {
      if (!photoImg) return out;
      const rc = photoRect(ph, W, H, photoImg, tf);
      const bx = cutImg && data.personBox ? data.personBox : { x: 0, y: 0, w: 1, h: 1 };
      const g = alphaGrid(cutImg || photoImg);
      if (g) out.push({ x: rc.dx + bx.x * rc.dw, y: rc.dy + bx.y * rc.dh, w: bx.w * rc.dw, h: bx.h * rc.dh, g, clip: rc.box, main: true });
      return out.concat(slotMasks(ctxInfo));
    }
    for (const l of layers) {
      if (l.type !== 'image' || l.visible === false || (l.binding !== 'person' && l.binding !== 'person2')) continue;
      const img = imgs[l.id]; if (!img) continue;
      const own = l.binding === 'person2' && data.person2;
      const r = imageRect({ ...l, _transform: own ? null : tf }, W, H, img);
      const g = alphaGrid(img); if (!g) continue;
      const cbx = l.clipBox;
      const clip = cbx ? { x: pct(cbx.x, W), y: pct(cbx.y, H), w: pct(cbx.w, W), h: pct(cbx.h, H) } : l.clip || l.radius > 0 ? { x: pct(l.x, W), y: pct(l.y, H), w: pct(l.w, W), h: pct(l.h, H) } : null;
      out.push({ x: r.dx, y: r.dy, w: r.dw, h: r.dh, g, clip, main: l.binding === 'person' });
    }
    return out.concat(slotMasks(ctxInfo));
  }
  /** 照片格（photoSlot）里的人物：按 cover 放置 + 抠图包围盒映射（静态，不参与移动） */
  function slotMasks(info) {
    const { W, H, layers, slotImg, slotCut, data } = info;
    const out = [];
    if (!slotImg || !slotCut) return out;
    const g = alphaGrid(slotCut); if (!g) return out;
    const iw = slotImg.naturalWidth || slotImg.width, ih = slotImg.naturalHeight || slotImg.height;
    const bx = slotImg !== slotCut && data.personBox ? data.personBox : { x: 0, y: 0, w: 1, h: 1 };
    for (const l of layers) {
      if (l.type !== 'photoSlot' || l.visible === false || l.rotate) continue;
      const x = pct(l.x, W), y = pct(l.y, H), w = pct(l.w, W), h = pct(l.h, H);
      const sc = Math.max(w / iw, h / ih) * (l.zoom || 1), dw = iw * sc, dh = ih * sc;
      const dx = x + (w - dw) * ((l.focusX != null ? l.focusX : 50) / 100), dy = y + (h - dh) * ((l.focusY != null ? l.focusY : 30) / 100);
      out.push({ x: dx + bx.x * dw, y: dy + bx.y * dh, w: bx.w * dw, h: bx.h * dh, g, clip: { x, y, w, h }, main: false, slot: true });
    }
    return out;
  }
  function maskAt(m, px, py) {
    if (m.clip && (px < m.clip.x || px > m.clip.x + m.clip.w || py < m.clip.y || py > m.clip.y + m.clip.h)) return 0;
    const gx = Math.floor(((px - m.x) / m.w) * m.g.gw), gy = Math.floor(((py - m.y) / m.h) * m.g.gh);
    if (gx < 0 || gy < 0 || gx >= m.g.gw || gy >= m.g.gh) return 0;
    return m.g.a[gy * m.g.gw + gx];
  }
  function faceRect(m) {
    if (!m.g.face) return null;
    const f = m.g.face;
    let r = { x: m.x + f.x * m.w, y: m.y + f.y * m.h, w: f.w * m.w, h: f.h * m.h };
    if (m.clip) {
      const x0 = Math.max(r.x, m.clip.x), y0 = Math.max(r.y, m.clip.y), x1 = Math.min(r.x + r.w, m.clip.x + m.clip.w), y1 = Math.min(r.y + r.h, m.clip.y + m.clip.h);
      if (x1 <= x0 || y1 <= y0) return null;
      r = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    }
    return r;
  }
  function isect(a, b) {
    const ix = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
    const iy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    return ix * iy;
  }
  /** 每个框：人物覆盖率 + 是否碰脸 */
  function overlapOf(boxes, masks, W, H) {
    const minSide = Math.min(W, H);
    const res = [];
    const faces = masks.map(faceRect).filter(Boolean);
    for (const b of boxes) {
      const step = Math.max(2, Math.min(minSide / 110, Math.sqrt((b.w * b.h) / 140)));
      let n = 0, hit = 0;
      for (let py = b.y + step / 2; py < b.y + b.h; py += step) for (let px = b.x + step / 2; px < b.x + b.w; px += step) {
        n++;
        for (const m of masks) if (maskAt(m, px, py)) { hit++; break; }
      }
      const ratio = n ? hit / n : 0;
      let face = 0;
      for (const f of faces) face = Math.max(face, isect(b, f) / Math.max(1, f.w * f.h));
      res.push({ id: b.id, kind: b.kind, ratio, face, box: b });
    }
    return res;
  }
  let scratchCanvas = null;
  /** 只画文字/徽章到草稿画布，取渲染框；装饰形状直接用图层框 */
  function measureBoxes(layers, W, H, data) {
    if (!scratchCanvas) scratchCanvas = document.createElement('canvas');
    scratchCanvas.width = W; scratchCanvas.height = H;
    const c = scratchCanvas.getContext('2d');
    c._textBoxes = []; c._titleFs = 0; c._photoMode = false; c._scrims = 0; c._measure = true;
    const pad = Math.min(W, H) * 0.008;
    const extra = [];
    for (const layer of layers) {
      if (layer.visible === false || layer.avoidExempt) continue;
      try {
        if (layer.type === 'text') {
          const key = layer.binding || 'title';
          const val = layer.binding === 'static' ? layer.sample : data[key] !== undefined ? data[key] : layer.sample;
          drawText(c, layer, W, H, val);
        } else if (layer.type === 'badge') {
          const key = layer.binding || 'badge';
          const val = layer.binding === 'static' ? layer.sample : data[key] !== undefined && data[key] !== '' ? data[key] : layer.sample || '标签';
          drawBadge(c, layer, W, H, val);
        } else if (layer.type === 'icon') {
          const s0 = Math.min(pct(layer.w, W), pct(layer.h, H));
          extra.push({ id: layer.id, kind: 'deco', x: pct(layer.x, W) + (pct(layer.w, W) - s0) / 2, y: pct(layer.y, H) + (pct(layer.h, H) - s0) / 2, w: s0, h: s0 * (layer.label ? 1.4 : 1) });
        } else if (layer.type === 'shape' && DECO_SHAPES.has(layer.shape) && layer.shape !== 'brush' && layer.shape !== 'ring') {
          extra.push({ id: layer.id, kind: 'deco', x: pct(layer.x, W), y: pct(layer.y, H), w: pct(layer.w, W), h: pct(layer.h, H) });
        }
      } catch (e) { /* ignore */ }
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; clearShadow(c);
    }
    const tb = c._textBoxes.map((b) => ({ ...b, kind: b.kind || 'text', x: b.x - pad, y: b.y - pad, w: b.w + pad * 2, h: b.h + pad * 2 }));
    c._textBoxes = null; c._measure = false;
    return tb.concat(extra);
  }
  function scaleText(layers, s) {
    if (s === 1) return layers;
    return layers.map((l) => (l.type === 'text' && !l.avoidExempt ? { ...l, fontSize: (l.fontSize || 4) * s, maxFontSize: l.maxFontSize ? l.maxFontSize * s : l.maxFontSize } : l));
  }
  function conflictScore(ov) {
    let s = 0, face = 0, bad = 0;
    for (const o of ov) {
      const w = o.kind === 'deco' ? 0.5 : 1;
      if (o.ratio > AVOID_TH) { s += (o.ratio - AVOID_TH) * w; bad++; }
      if (o.face > 0.002) { face += o.face * w + 0.2; }
    }
    return { s, face, bad, cost: s * 400 + face * 2000 };
  }
  /** 把冲突文字挪到人物另一侧（或头顶上方）留白 */
  function relocate(layers, ov, masks, W, H, data) {
    const minSide = Math.min(W, H);
    const gap = minSide * 0.025, mX = (DESIGN.safe || 4) * minSide / 100;
    let changed = false;
    const out = layers.slice();
    for (const o of ov) {
      if (o.kind === 'deco' || (o.ratio <= AVOID_TH && o.face <= 0.002)) continue;
      const i = out.findIndex((l) => l.id === o.id); if (i < 0) continue;
      const l = out[i], b = o.box;
      if (l.rotate || l.vertical) continue;
      // 文字所在高度带内人物的水平范围
      let lo = W, hi = 0, top = H;
      for (const m of masks) {
        for (let py = b.y; py <= b.y + b.h; py += Math.max(2, b.h / 12)) for (let px = 0; px < W; px += Math.max(2, W / 160)) if (maskAt(m, px, py)) { lo = Math.min(lo, px); hi = Math.max(hi, px); }
        for (let py = 0; py < H && top === H; py += Math.max(2, H / 200)) for (let px = 0; px < W; px += Math.max(2, W / 160)) if (maskAt(m, px, py)) { top = Math.min(top, py); break; }
      }
      if (hi <= lo) continue;
      const leftW = lo - gap - mX, rightW = W - mX - (hi + gap);
      const need = Math.max(b.w * 0.8, W * 0.2);
      let nl = null;
      if (Math.max(leftW, rightW) >= need) {
        const left = leftW >= rightW;
        const x0 = left ? mX : hi + gap, wd = left ? leftW : rightW;
        nl = { ...l, x: (x0 / W) * 100, w: (wd / W) * 100, align: l.align === 'center' ? 'center' : left ? 'left' : 'left', h: Math.max(l.h || 0, ((b.h * 1.6) / H) * 100), _relocated: 'side' };
        if (l.type === 'badge') nl = { ...l, x: left ? (mX / W) * 100 : Math.min(100 - l.w - (mX / W) * 100, ((hi + gap) / W) * 100), _relocated: 'side' };
      } else if (top - gap - mX > b.h && b.y > top) {
        // 头顶上方留白够高且不撞其它文字：整体上移
        const ny = Math.max(mX, top - gap - b.h);
        const nb = { x: b.x, y: ny, w: b.w, h: b.h };
        if (!ov.some((q) => q.id !== o.id && isect(nb, q.box) > 0)) nl = { ...l, y: (ny / H) * 100, valign: 'top', _relocated: 'up' };
      }
      if (nl) { out[i] = nl; changed = true; }
    }
    return changed ? out : null;
  }
  function planAvoid(info) {
    const { W, H, layers, data, photoMode } = info;
    const tf0 = data.personTransform || { dx: 0, dy: 0, scale: 1 };
    const masks0 = personMasks(info, tf0);
    if (!masks0.length) return null;
    let boxes1 = measureBoxes(layers, W, H, data);
    if (!boxes1.length) return null;
    const base = conflictScore(overlapOf(boxes1, masks0, W, H));
    if (base.bad === 0 && base.face === 0) return { tf: tf0, layers, moved: false, score: base };
    const minSide = Math.min(W, H);
    const plMain = layers.find((l) => l.binding === 'person');
    const minSc = (plMain && plMain.minScale) || 0; // v1.7：模板可限制避让时人物最小缩放（宁可缩字也不缩人）
    const scales = [1, 0.92, 0.84, 0.76, 0.68, 0.6, 0.52].filter((v) => v >= minSc - 1e-6);
    const dxs = [0, -8, 8, -14, 14, -20, 20, -26, 26, -32, 32];
    const dys = [0, 4, 8, 12, 16, 22, -4, -8, -12, -16, -22, -28, -34, -40];
    const bbOf = (m) => (m.g.bb ? { x: m.x + m.g.bb.x0 * m.w, y: m.y + m.g.bb.y0 * m.h, w: (m.g.bb.x1 - m.g.bb.x0) * m.w, h: (m.g.bb.y1 - m.g.bb.y0) * m.h } : null);
    const visFrac = (m) => { const b = bbOf(m); if (!b) return 1; return Math.max(0, Math.min(W, b.x + b.w) - Math.max(0, b.x)) / Math.max(1, b.w); };
    const main0 = masks0.find((q) => q.main) || masks0[0];
    const vis0 = visFrac(main0);
    const valid = (masks) => {
      const m = masks.find((q) => q.main) || masks[0];
      if (visFrac(m) < Math.min(0.9, vis0 - 0.03)) return false;
      const f = faceRect(m); if (!f) return true;
      const mg = minSide * 0.015;
      return f.x > mg && f.x + f.w < W - mg && f.y > mg && f.y + f.h < H * 0.9;
    };
    const evalSet = (lay, boxes, textPenalty) => {
      const cand = [];
      for (const sc of scales) for (const dx of dxs) for (const dy of dys) {
        const tf = { dx: (tf0.dx || 0) + dx, dy: (tf0.dy || 0) + dy, scale: (tf0.scale || 1) * sc };
        const masks = personMasks(info, tf);
        if (!valid(masks)) continue;
        const cs = conflictScore(overlapOf(boxes, masks, W, H));
        const move = Math.abs(dx) * 0.9 + (dy >= 0 ? dy * 1.1 : -dy * 1.5 + 4) + (1 - sc) * (photoMode ? 190 : 130) + textPenalty;
        cand.push({ tf, cs, cost: cs.cost + move, move, layers: lay, masks });
      }
      cand.sort((a, b) => a.cost - b.cost);
      return cand;
    };
    let all = evalSet(layers, boxes1, 0);
    let best = all[0];
    const okC = (c) => c && c.cs.bad === 0 && c.cs.face === 0;
    // 文字挪到另一侧：对代价最低的若干候选尝试
    if (!okC(best)) {
      for (const c of all.slice(0, 10)) {
        const ov = overlapOf(measureBoxes(c.layers, W, H, data), c.masks, W, H);
        const nl = relocate(c.layers, ov, c.masks, W, H, data);
        if (!nl) continue;
        const cs = conflictScore(overlapOf(measureBoxes(nl, W, H, data), c.masks, W, H));
        const cc = { ...c, layers: nl, cs, cost: cs.cost + c.move + 12 };
        if (cc.cost < best.cost) best = cc;
        if (okC(best)) break;
      }
    }
    // 缩小标题字号
    for (const ts of [0.9, 0.8]) {
      if (okC(best)) break;
      const lay = scaleText(layers, ts);
      const c = evalSet(lay, measureBoxes(lay, W, H, data), (1 - ts) * 180)[0];
      if (c && c.cost < best.cost) best = c;
    }
    // 微调：仍冲突的文字/徽章在小范围内上下左右挪动（不撞其它文字、不出画布）；装饰仍冲突则隐藏
    if (!okC(best) && best.masks) {
      let lay = best.layers;
      const ovAll = overlapOf(measureBoxes(lay, W, H, data), best.masks, W, H);
      const mg = minSide * 0.02;
      for (const o of ovAll) {
        if (o.ratio <= AVOID_TH && o.face <= 0.002) continue;
        const i = lay.findIndex((l) => l.id === o.id); if (i < 0) continue;
        const l = lay[i];
        if (o.kind === 'deco') { lay = lay.slice(); lay[i] = { ...l, visible: false, _avoidHidden: true }; continue; }
        if (l.x == null || l.y == null) continue;
        let done = false;
        for (const ddy of [-2, 2, -4, 4, -6, 6, -9, 9, -12, 12]) {
          for (const ddx of [0, -4, 4, -8, 8]) {
            const nb = { x: o.box.x + pct(ddx, W), y: o.box.y + pct(ddy, H), w: o.box.w, h: o.box.h };
            if (nb.x < mg * 0.5 || nb.y < mg * 0.5 || nb.x + nb.w > W - mg * 0.5 || nb.y + nb.h > H - mg * 0.5) continue;
            if (ovAll.some((q) => q.id !== o.id && isect(nb, q.box) > 0)) continue;
            const r1 = overlapOf([{ ...nb, id: o.id, kind: o.kind }], best.masks, W, H)[0];
            if (r1.ratio <= AVOID_TH && r1.face <= 0.002) { lay = lay.slice(); lay[i] = { ...l, x: l.x + ddx, y: l.y + ddy, _nudged: [ddx, ddy] }; o.box = nb; done = true; break; }
          }
          if (done) break;
        }
      }
      const cs = conflictScore(overlapOf(measureBoxes(lay, W, H, data), best.masks, W, H));
      best = { ...best, layers: lay, cs };
    }
    // 人物背后的色块/圆形底等跟随人物移动缩放（避免原位置留下空底板）
    let outLayers = best.layers;
    if (!photoMode) {
      const b0 = bbOf(main0), m1 = best.masks ? best.masks.find((q) => q.main) || best.masks[0] : null, b1 = m1 && bbOf(m1);
      const pi = outLayers.findIndex((l) => l.binding === 'person');
      if (b0 && b1 && pi > 0) {
        const k = b1.w / b0.w;
        const cx0 = b0.x + b0.w / 2, cx1 = b1.x + b1.w / 2, by0 = b0.y + b0.h, by1 = b1.y + b1.h;
        outLayers = outLayers.map((l, i) => {
          if (i >= pi || l.type !== 'shape' || DECO_SHAPES.has(l.shape) || l.w >= 90 || l.h >= 90 || l.x == null) return l;
          const x = pct(l.x, W), y = pct(l.y, H), w = pct(l.w, W), h = pct(l.h, H);
          const cx = x + w / 2, cy = y + h / 2;
          if (!(cx > b0.x && cx < b0.x + b0.w && cy > b0.y - h * 0.3 && cy < by0)) return l;
          const ncx = cx1 + (cx - cx0) * k, ncy = by1 + (cy - by0) * k;
          return { ...l, x: ((ncx - (w * k) / 2) / W) * 100, y: ((ncy - (h * k) / 2) / H) * 100, w: (w * k / W) * 100, h: (h * k / H) * 100, _followed: true };
        });
      }
    }
    return { tf: best.tf, layers: outLayers, moved: true, score: best.cs };
  }

  /**
   * 渲染模板到 canvas
   */
  async function render(canvas, template, size, data = {}) {
    // v2.0：「v3 · 20套」模板走独立的移植渲染器（renderer-batch20.js）
    if (template && template.engine === 'batch20' && window.CoverBatch20) { canvas._avoid = null; return window.CoverBatch20.render(canvas, template, size, data); }
    const W = size.width, H = size.height;
    const cls = aspectClass(W, H);
    // 人物显示方式：photo = 原照片整图当背景；sticker = 抠图贴纸（可叠背景图库）
    const photoMode = !!(template.photo && data.personPhoto && (data.personMode || template.defaultPersonMode || 'photo') === 'photo');
    let srcLayers = (template.layers || []).filter((l) => (photoMode ? !l.onlySticker : !l.onlyPhoto));
    if (photoMode) srcLayers = srcLayers.filter((l) => l.binding !== 'person');
    const layers = (photoMode ? srcLayers.map((l) => ({ ...l })) : withPersonLayer(srcLayers, data)).map((l) => resolveLayer(l, cls));
    if (cls === 'wide' && template.autoWide) {
      for (let i = 0; i < layers.length; i++) {
        const l = layers[i], src = srcLayers.find((q) => q.id === l.id);
        if (!src || (src.at && src.at.wide) || l.type === 'background' || l.type === 'occluder' || l.binding === 'person' || l.x == null) continue;
        const side = template.autoWide === 'right' ? 47 : 3;
        layers[i] = { ...l, x: side + l.x * 0.5, w: l.w * 0.5 };
      }
    }
    let ph = photoMode ? resolveLayer(template.photo, cls) : null;
    if (ph && cls === 'wide' && template.autoWide && !(template.photo.at && template.photo.at.wide)) ph = { ...ph, fit: 'height', focusX: template.autoWide === 'right' ? 28 : 72 };
    DESIGN = { ...DESIGN_DEFAULT, ...(data.design || {}) };
    {
      let L = layers;
      if (DESIGN.palette && PALETTES[DESIGN.palette] && PALETTES[DESIGN.palette].accent) {
        L = applyPalette(L, PALETTES[DESIGN.palette]);
      }
      L = L.map((l) => clampSafe(applyTextFx(applyFontStyle(l, DESIGN.fontStyle), DESIGN.textFx), W, H));
      if (DESIGN.personFx && DESIGN.personFx !== 'auto' && PERSON_FX[DESIGN.personFx]) L = L.map((l) => (l.type === 'image' && (l.binding === 'person' || l.binding === 'person2') ? { ...l, sticker: PERSON_FX[DESIGN.personFx].sticker } : l));
      L = limitDeco(L, DESIGN.decoLimit);
      layers.length = 0; L.forEach((l) => layers.push(l));
    }

    // 预加载字体（失败/超时自动回退系统黑体）
    const fontJobs = [];
    for (const l of layers) {
      if ((l.type === 'text' || l.type === 'badge') && l.visible !== false) {
        const key = l.binding || (l.type === 'badge' ? 'badge' : 'title');
        fontJobs.push(ensureFont(l, String(data[key] || l.sample || '')));
      }
    }
    try { await Promise.all(fontJobs); } catch (e) { /* 忽略，回退 */ }

    const imageUrls = {};
    for (const layer of layers) {
      if (layer.type === 'image' && layer.visible !== false) imageUrls[layer.id] = await loadImage(resolveImageUrl(layer, data));
    }

    let slotImg = null;
    if (layers.some((l) => l.type === 'photoSlot' && l.visible !== false)) slotImg = await loadImage(data.personPhoto || data.person || '');
    let photoImg = null, cutImg = null;
    if (photoMode) {
      photoImg = await loadImage(data.personPhoto);
      if (data.person && data.person !== data.personPhoto) cutImg = await loadImage(data.person);
    }
    // 场景背景图（失败返回 null → 回退模板原背景）；整图背景模式下不用
    const slotCut = slotImg ? (data.personPhoto && data.person && data.person !== data.personPhoto ? await loadImage(data.person) : slotImg) : null;
    let scene = null;
    if (!photoMode && data.scene && data.scene.url && template.allowScene !== false) {
      const img = await loadImage(data.scene.url);
      if (img && (img.naturalWidth || img.width)) {
        const bgLayer = layers.find((l) => l.type === 'background');
        scene = { img, opts: data.scene, tint: data.scene.tintColor || sceneTintColor(template, bgLayer) };
      }
    }

    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    ctx._textBoxes = []; ctx._titleFs = 0; ctx._photoMode = photoMode || !!data.person || !!scene; ctx._scrims = 0;
    let rc = null, stickerRect = null;
    // v1.7：头部遮挡标题默认关闭；开启「文字避让人物」时强制不遮挡
    const avoidOn = data.avoidPerson !== false;
    const occlude = !avoidOn && (data.occlude !== undefined ? !!data.occlude : false);
    let avoid = null, avoidInfo = null;
    if (avoidOn && (photoMode ? photoImg : data.person)) {
      try {
        avoidInfo = { W, H, photoMode, ph, photoImg, cutImg, data, layers, imgs: imageUrls, slotImg, slotCut };
        avoid = planAvoid(avoidInfo);
        if (avoid && avoid.moved) {
          const nl = avoid.layers.map((l) => (l.binding === 'person' || (l.binding === 'person2' && !data.person2) ? { ...l, _transform: avoid.tf } : l));
          layers.length = 0; nl.forEach((l) => layers.push(l));
          data = { ...data, personTransform: avoid.tf };
          avoidInfo = { ...avoidInfo, data, layers };
        }
      } catch (e) { console.warn('文字避让失败', e); avoid = null; }
    }
    for (const layer of layers) {
      if (layer.visible === false) continue;
      try {
        let clipped = false;
        if (layer.clipBox) {
          // v1.7：图层裁切框（百分比；torn=撕纸边、radius=圆角），用于「照片框里的人物/背景」
          const cb = layer.clipBox, bx = pct(cb.x, W), by = pct(cb.y, H), bw = pct(cb.w, W), bh = pct(cb.h, H), ms = Math.min(W, H);
          ctx.save(); clipped = true;
          if (cb.torn) tornPath(ctx, bx, by, bw, bh, cb.seed || 11, pct(cb.jag || 1, ms), cb.edges);
          else if (cb.radius) roundRect(ctx, bx, by, bw, bh, pct(cb.radius, ms));
          else { ctx.beginPath(); ctx.rect(bx, by, bw, bh); }
          ctx.clip();
        }
        switch (layer.type) {
          case 'background':
            drawBackground(ctx, layer, W, H, scene);
            if (photoMode && photoImg) rc = drawPhoto(ctx, ph, W, H, photoImg, data.personTransform);
            break;
          case 'occluder': if (photoMode && occlude) drawOccluder(ctx, ph, layer, W, H, cutImg, data.personBox, rc); break;
          case 'pattern': drawPatternLayer(ctx, layer, W, H); break;
          case 'icon': drawIcon(ctx, layer, W, H); break;
          case 'photoSlot': drawPhotoSlot(ctx, layer, W, H, slotImg); break;
          case 'shape': drawShape(ctx, layer, W, H); break;
          case 'image':
            drawImage(ctx, layer, W, H, imageUrls[layer.id]);
            if (layer.binding === 'person' && imageUrls[layer.id]) stickerRect = imageRect(layer, W, H, imageUrls[layer.id]);
            break;
          case 'text': {
            const key = layer.binding || 'title';
            const val = layer.binding === 'static' ? layer.sample : data[key] !== undefined ? data[key] : layer.sample;
            drawText(ctx, layer, W, H, val);
            break;
          }
          case 'badge': {
            const key = layer.binding || 'badge';
            const val = layer.binding === 'static' ? layer.sample : data[key] !== undefined && data[key] !== '' ? data[key] : layer.sample || '标签';
            drawBadge(ctx, layer, W, H, val);
            break;
          }
          default: break;
        }
        if (clipped) ctx.restore();
      } catch (err) {
        console.warn('图层渲染失败', layer.id, err);
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; clearShadow(ctx);
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    }
    if (DESIGN.grain) { try { drawGrain(ctx, W, H, DESIGN.grain); } catch (e) { /* ignore */ } }
    canvas._design = { scrims: ctx._scrims, decoHidden: layers.filter((l) => l._decoHidden).map((l) => l.id) };
    // 脸部安全区：估计脸部框，统计文字覆盖比例（仅提示）
    try {
      const face = estimateFace(photoMode ? cutImg : null, data.personBox, rc, W, H, stickerRect);
      let hit = [];
      if (face && face.w > 0 && face.h > 0) {
        for (const b of ctx._textBoxes) {
          const ix = Math.max(0, Math.min(face.x + face.w, b.x + b.w) - Math.max(face.x, b.x));
          const iy = Math.max(0, Math.min(face.y + face.h, b.y + b.h) - Math.max(face.y, b.y));
          const r = (ix * iy) / (face.w * face.h);
          if (r > 0.12) hit.push({ id: b.id, ratio: r });
        }
      }
      canvas._faceInfo = { face, hits: hit, occluded: photoMode && occlude && !!cutImg, photoMode };
    } catch (e) { canvas._faceInfo = null; }
    ctx._textBoxes = null;
    // v1.7 自检：最终文字/徽章/装饰框 × 人物 alpha 重叠率
    canvas._avoid = null;
    try {
      const info = avoidInfo || { W, H, photoMode, ph, photoImg, cutImg, data, layers, imgs: imageUrls, slotImg, slotCut };
      const masks = personMasks(info, data.personTransform || { dx: 0, dy: 0, scale: 1 });
      if (masks.length) {
        const items = overlapOf(measureBoxes(layers, W, H, data), masks, W, H).map((o) => ({ id: o.id, kind: o.kind, ratio: +o.ratio.toFixed(4), face: +o.face.toFixed(4) }));
        const maxRatio = items.reduce((m, o) => Math.max(m, o.ratio), 0);
        const faceHit = items.some((o) => o.face > 0.002);
        canvas._avoid = { on: avoidOn, moved: !!(avoid && avoid.moved), tf: data.personTransform || null, items, maxRatio, faceHit, ok: maxRatio <= AVOID_TH && !faceHit, estimated: masks.some((m) => m.g.estimated), occluded: occlude };
      }
    } catch (e) { canvas._avoid = null; }
    return canvas;
  }

  let lastAvoid = null;
  async function toPngBlob(template, size, data) {
    const canvas = document.createElement('canvas');
    await render(canvas, template, size, data);
    lastAvoid = canvas._avoid || null;
    return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));
  }
  function clearImageCache() { imageCache.clear(); }

    /** 预览专用：平台安全区参考线（不进入导出） */
  function drawFaceGuide(canvas) {
    const fi = canvas._faceInfo;
    if (!fi || !fi.face) return;
    const ctx = canvas.getContext('2d'), f = fi.face;
    ctx.save();
    ctx.setLineDash([10, 8]); ctx.lineWidth = Math.max(2, canvas.width / 400);
    ctx.strokeStyle = fi.hits.length && !fi.occluded ? 'rgba(255,60,60,0.95)' : 'rgba(80,220,255,0.9)';
    ctx.beginPath(); ctx.ellipse(f.x + f.w / 2, f.y + f.h / 2, f.w / 2, f.h / 2, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]); ctx.fillStyle = ctx.strokeStyle; ctx.font = `${Math.round(canvas.width / 45)}px sans-serif`;
    ctx.fillText('脸部安全区', f.x, Math.max(20, f.y - 8));
    ctx.restore();
  }
  function drawSafeGuides(canvas, sizeId) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const lw = Math.max(2, Math.min(W, H) / 300);
    ctx.save();
    const shade = (x, y, w, h) => { ctx.fillStyle = 'rgba(255,40,80,0.22)'; ctx.fillRect(x, y, w, h); };
    const box = (x, y, w, h, color, label) => {
      ctx.setLineDash([lw * 5, lw * 3]); ctx.lineWidth = lw; ctx.strokeStyle = color; ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
      if (label) {
        ctx.font = `700 ${Math.round(Math.min(W, H) / 40)}px ${FALLBACK_STACK}`;
        const tw = ctx.measureText(label).width + lw * 6;
        ctx.fillStyle = color; ctx.fillRect(x, y, tw, Math.min(W, H) / 40 + lw * 4);
        ctx.fillStyle = '#fff'; ctx.textBaseline = 'top'; ctx.fillText(label, x + lw * 3, y + lw * 2);
      }
    };
    const id = String(sizeId || '');
    const r = W / H;
    if (id.startsWith('xhs') || (Math.abs(r - 0.75) < 0.02 && !id.startsWith('douyin'))) {
      const m = W * 0.08;
      shade(0, 0, W, H * 0.125); shade(0, H * 0.875, W, H * 0.125);
      box(0, H * 0.125, W, W, '#ff2d55', '主页/分享 1:1 裁切');
      box(m, m, W - 2 * m, H - 2 * m - H * 0.06, '#0a84ff', '边距 8% + 底部 6%');
    } else if (id.startsWith('douyin') || r < 0.6) {
      shade(0, 0, W, H * 0.09); shade(0, H * 0.8, W, H * 0.2);
      shade(W * 0.86, H * 0.09, W * 0.14, H * 0.71); shade(0, H * 0.09, W * 0.08, H * 0.71);
      box(0, H * 0.125, W, H * 0.75, '#ff2d55', '主页 3:4 显示区');
      box(W * 0.08, H * 0.09, W * 0.78, H * 0.71, '#0a84ff', '播放态安全区（顶9% 底20% 右14%）');
    } else if (id.startsWith('bilibili') || Math.abs(r - 16 / 9) < 0.05) {
      const w43 = H * 4 / 3;
      shade(0, 0, (W - w43) / 2, H); shade(W - (W - w43) / 2, 0, (W - w43) / 2, H);
      shade(W * 0.8, H * 0.85, W * 0.2, H * 0.15);
      box((W - w43) / 2, 0, w43, H, '#ff2d55', 'App 首页 4:3 裁切');
      box(W * 0.8, H * 0.85, W * 0.2 - lw, H * 0.15 - lw, '#ff9f0a', '时长角标区');
    } else if (id.startsWith('wechat-cover') || r > 2) {
      const s = H;
      shade(0, 0, (W - s) / 2, H); shade((W + s) / 2, 0, (W - s) / 2, H);
      box((W - s) / 2, 0, s, H, '#ff2d55', '分享 1:1 区');
    } else {
      const m = Math.min(W, H) * 0.08;
      box(m, m, W - 2 * m, H - 2 * m, '#0a84ff', '边距 8%');
    }
    ctx.restore();
  }

  return { render, toPngBlob, loadImage, clearImageCache, resolveImageUrl, aspectClass, drawSafeGuides, drawFaceGuide, PALETTES, FONT_STYLES, DESIGN_DEFAULT, applyPalette, TEXT_FX, PERSON_FX, VERSION: "2.1", planAvoid, getLastAvoid: () => lastAvoid };
})();
