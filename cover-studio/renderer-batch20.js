/**
 * v2.0 「v3 · 20套」模板渲染器（移植自 /workspace/polish3 的 Python 渲染器 render_batch.py + v2 安全边距 + v3 缩放下限）。
 * 模板 = template.b20（背景/人物槽/色带/文字/标签/竖排英文 图层 JSON）；所有文字、标签、描边、阴影都在 Canvas 2D 里实时绘制。
 * 逻辑画布固定 1080×1440（3:4），其它尺寸按“覆盖+居中裁切”缩放。
 */
window.CoverBatch20 = (function () {
  const FONTS = {
    black: ['Noto Sans SC', '900'], bold: ['Noto Sans SC', '700'], regular: ['Noto Sans SC', '400'],
    smiley: ['Smiley Sans', '400'], kuaile: ['ZCOOL KuaiLe', '400'],
    serif: ['Noto Serif SC B20 Bold', '700'], serif_reg: ['Noto Serif SC B20 Regular', '400'], latin: ['Noto Sans B20 Latin', '800'],
  };
  const FALLBACK = ', "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif';
  const fontStr = (name, px) => { const f = FONTS[name] || FONTS.bold; return `${f[1]} ${px}px "${f[0]}"${FALLBACK}`; };
  const rgb = (c, a) => (Array.isArray(c) ? `rgba(${c[0]},${c[1]},${c[2]},${a != null ? a : c.length > 3 ? c[3] / 255 : 1})` : c);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  let mctx = null;
  function mc() { if (!mctx) mctx = document.createElement('canvas').getContext('2d'); return mctx; }
  const _gc = new Map();
  // glyph metrics, same convention as python glyph(): ref '国' ink height == cap_h; char box = tight ink x-range, y from max ascent to max descent
  function glyph(font, ch, cap, xs) {
    const key = font + '|' + ch + '|' + cap + '|' + xs;
    if (_gc.has(key)) return _gc.get(key);
    const c = mc(); const B = 360; c.font = fontStr(font, B);
    const r = c.measureText('国'); const k = cap / (r.actualBoundingBoxAscent + r.actualBoundingBoxDescent);
    const m = c.measureText(ch);
    let L = m.actualBoundingBoxLeft, Rr = m.actualBoundingBoxRight; if (!(L + Rr > 0)) { L = 0; Rr = B / 3; }
    const asc = Math.max(r.actualBoundingBoxAscent, m.actualBoundingBoxAscent), desc = Math.max(r.actualBoundingBoxDescent, m.actualBoundingBoxDescent);
    const g = { w: Math.max(1, Math.round((L + Rr) * k * xs)), h: Math.max(1, Math.round((asc + desc) * k)), size: B * k, ox: L * k, base: asc * k, xs };
    _gc.set(key, g); return g;
  }
  function fillFor(ctx, fill, x, y, h) {
    if (fill && !Array.isArray(fill) && fill.top) { const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, rgb(fill.top)); g.addColorStop(1, rgb(fill.bottom)); return g; }
    return rgb(fill);
  }
  function drawGlyph(ctx, font, ch, g, x, y, e, fill) {
    const st = e.stroke || []; const sh = e.shadow;
    const pass = (style, lw, dx, dy, strokeOnly) => {
      ctx.save(); ctx.translate(x + dx, y + dy); ctx.scale(g.xs, 1); ctx.font = fontStr(font, g.size); ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round'; ctx.miterLimit = 2;
      const px = g.ox / g.xs * g.xs / g.xs; // ink left at 0
      if (lw > 0) { ctx.strokeStyle = style; ctx.lineWidth = lw; ctx.strokeText(ch, g.ox, g.base); }
      if (!strokeOnly) { ctx.fillStyle = style; ctx.fillText(ch, g.ox, g.base); }
      ctx.restore();
    };
    let R = 0; const rs = st.map((s) => (R += s.w));
    if (sh) pass(rgb(sh.color), 2 * R, sh.dx, sh.dy, false);
    for (let i = st.length - 1; i >= 0; i--) pass(rgb(st[i].color), 2 * rs[i], 0, 0, false);
    pass(fillFor(ctx, fill, 0, y, g.h), 0, 0, 0, false);
  }
  function title(ctx, e, L) {
    const [x0, y0, x1] = e.box; const chars = [...e.text].filter((c) => c !== ' ');
    let h = e.cap_h, xs = e.xscale || 1; const gap0 = e.gap || 0; const vert = e.mode === 'vertical'; const font = e.font || 'black';
    const R = (e.stroke || []).reduce((a, s) => a + s.w, 0);
    const build = () => { const gl = chars.map((c) => glyph(font, c, h, xs)); return [gl, gl.reduce((a, g) => a + g.w, 0)]; };
    let [gl, tw] = build(); let gap = gap0;
    if (!vert) {
      const minx = e.min_xscale != null ? e.min_xscale : xs;
      while (tw + gap * (gl.length - 1) + 2 * R > x1 - x0 && xs > minx) { xs = Math.round(Math.max(minx, xs - 0.01) * 1000) / 1000; [gl, tw] = build(); }
      while (tw + gap * (gl.length - 1) + 2 * R > x1 - x0) { h = Math.floor(h * 0.97); gap = gap0 * h / e.cap_h; [gl, tw] = build(); }
    }
    const boxes = []; const cols = e.colors;
    if (vert) {
      let y = y0;
      chars.forEach((c, i) => { const g = gl[i]; const xx = x0 + ((x1 - x0) - g.w) / 2; if (ctx) drawGlyph(ctx, font, c, g, xx, y, e, cols ? cols[i] : e.fill);
        boxes.push([c, [Math.floor(xx) - R, Math.floor(y) - R, Math.floor(xx + g.w) + R, Math.floor(y + g.h) + R]]); y += h + gap; });
    } else {
      const n = gl.length; const mode = e.mode || 'left'; let span = tw + gap * (n - 1);
      if (mode === 'spread' && n > 1) { gap = ((x1 - x0) - 2 * R - tw) / (n - 1); span = x1 - x0 - 2 * R; }
      let x = { left: x0 + R, center: x0 + ((x1 - x0) - span) / 2, right: x1 - R - span, spread: x0 + R }[mode]; if (x == null) x = x0 + R;
      const yb = y0 + R;
      chars.forEach((c, i) => { const g = gl[i]; if (ctx) drawGlyph(ctx, font, c, g, x, yb, e, cols ? cols[i] : e.fill);
        boxes.push([c, [Math.floor(x) - R, Math.floor(yb) - R, Math.floor(x + g.w) + R, Math.floor(yb + g.h) + R]]); x += g.w + gap; });
    }
    const bb = [Math.min(...boxes.map((b) => b[1][0])), Math.min(...boxes.map((b) => b[1][1])), Math.max(...boxes.map((b) => b[1][2])), Math.max(...boxes.map((b) => b[1][3]))];
    L[e.id] = { type: 'title', text: chars.join(''), xscale_used: xs, cap_h_used: h, stroke_total: R, chars: boxes, bbox: bb };
  }
  function text(ctx, e, L) {
    const c = ctx || mc(); c.save(); c.font = fontStr(e.font || 'bold', e.size); c.textBaseline = 'alphabetic';
    const tr = e.tracking || 0; const chs = [...e.text]; const ws = chs.map((ch) => c.measureText(ch).width); const tw = ws.reduce((a, b) => a + b, 0) + tr * (chs.length - 1);
    let [x, y] = e.pos; const an = e.align || 'left'; x = an === 'center' ? x - tw / 2 : an === 'right' ? x - tw : x;
    const fm = c.measureText(e.text); const asc = fm.fontBoundingBoxAscent; const base = y + asc; const sw = e.stroke_w || 0;
    if (ctx) { let cx = x; chs.forEach((ch, i) => { if (sw) { c.lineJoin = 'round'; c.strokeStyle = rgb(e.stroke_color || [0, 0, 0]); c.lineWidth = 2 * sw; c.strokeText(ch, cx, base); } c.fillStyle = rgb(e.color); c.fillText(ch, cx, base); cx += ws[i] + tr; }); }
    L[e.id] = { type: 'text', text: e.text, bbox: [Math.floor(x) - sw, Math.floor(base - fm.actualBoundingBoxAscent) - sw, Math.floor(x + tw) + sw, Math.ceil(base + fm.actualBoundingBoxDescent) + sw] };
    c.restore();
  }
  function rr(c, x, y, w, h, r) { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); else c.rect(x, y, w, h); }
  function tag(ctx, e, L) {
    const c = ctx || mc(); c.save(); c.font = fontStr(e.font || 'bold', e.size); c.textBaseline = 'alphabetic';
    const m = c.measureText(e.text); const iw = m.actualBoundingBoxLeft + m.actualBoundingBoxRight, ih = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    const [px, py] = e.pad || [16, 10]; const w = iw + 2 * px, h = ih + 2 * py; let [x, y] = e.pos;
    if (e.align === 'right') x -= w; if (e.align === 'center') x -= w / 2;
    if (ctx) {
      if (e.shadow) { c.fillStyle = rgb(e.shadow.color); rr(c, x + e.shadow.dx, y + e.shadow.dy, w, h, e.radius || 0); c.fill(); }
      c.fillStyle = rgb(e.bg); rr(c, x, y, w, h, e.radius || 0); c.fill();
      if (e.border) { c.strokeStyle = rgb(e.border); c.lineWidth = e.border_w || 0; rr(c, x, y, w, h, e.radius || 0); c.stroke(); }
      c.fillStyle = rgb(e.color); c.fillText(e.text, x + px + m.actualBoundingBoxLeft, y + py + m.actualBoundingBoxAscent);
    }
    L[e.id] = { type: 'tag', text: e.text, bbox: [Math.floor(x), Math.floor(y), Math.floor(x + w), Math.floor(y + h)] };
    c.restore();
  }
  function vlatin(ctx, e, L) {
    const c = ctx || mc(); c.save(); c.font = fontStr(e.font || 'latin', e.size); const m = c.measureText(e.text);
    const iw = m.actualBoundingBoxLeft + m.actualBoundingBoxRight, ih = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent; const [px, py] = e.pos;
    if (ctx) { c.translate(px + ih, py); c.rotate(Math.PI / 2); c.fillStyle = rgb(e.color); c.fillText(e.text, m.actualBoundingBoxLeft, m.actualBoundingBoxAscent); }
    c.restore(); L[e.id] = { type: 'vlatin', text: e.text, bbox: [px, py, px + Math.round(ih), py + Math.round(iw)] };
  }
  function grade(img, w, h, g) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const c = cv.getContext('2d'); c.drawImage(img, 0, 0, w, h);
    if (!g) return cv; const d = c.getImageData(0, 0, w, h), a = d.data; const s = g.saturation != null ? g.saturation : 1, ct = g.contrast != null ? g.contrast : 1, br = g.brightness || 0, t = g.tint || [0, 0, 0];
    for (let i = 0; i < a.length; i += 4) {
      const r = a[i] / 255, gg = a[i + 1] / 255, b = a[i + 2] / 255, Y = 0.299 * r + 0.587 * gg + 0.114 * b;
      const f = (v, k) => Math.max(0, Math.min(255, (((Y + (v - Y) * s) - 0.5) * ct + 0.5 + br + t[k] / 255) * 255));
      a[i] = f(r, 0); a[i + 1] = f(gg, 1); a[i + 2] = f(b, 2);
    }
    c.putImageData(d, 0, 0); return cv;
  }
  function person(ctx, e, img, heads, PL) {
    const [x0, y0, x1, y1] = e.box, bw = x1 - x0, bh = y1 - y0; const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    const s = Math.max(bw / iw, bh / ih) * (e.zoom || 1); const sw = Math.round(iw * s), sh = Math.round(ih * s);
    const [ax, ay] = e.anchor || [0.5, 0]; const ox = Math.round((sw - bw) * ax), oy = Math.round((sh - bh) * ay);
    if (ctx) {
      const r = e.radius || 0, fr = e.frame;
      if (fr && fr.w) { ctx.fillStyle = rgb(fr.color); rr(ctx, x0 - fr.w, y0 - fr.w, bw + 2 * fr.w, bh + 2 * fr.w, r + fr.w); ctx.fill(); }
      const g = grade(img, sw, sh, e.grade);
      ctx.save(); rr(ctx, x0, y0, bw, bh, r); ctx.clip(); ctx.drawImage(g, x0 - ox, y0 - oy); ctx.restore();
    }
    if (!heads) { // uploaded person: estimate head from segmentation box (CoverSegment.box, normalized) like renderer.estimateFace, else default upper-center box
      const b = e._pbox;
      if (b && b.w > 0 && b.h > 0) { const pw = b.w * iw, ph = b.h * ih, hd = Math.min(ph * 0.3, pw * 0.62), hw = Math.min(pw * 0.7, hd * 1.0), hx = b.x * iw + (pw - hw) / 2;
        heads = [[hx / iw, b.y, (hx + hw) / iw, (b.y * ih + hd * 1.1) / ih]]; }
      else heads = DEFAULT_UPLOAD_HEAD;
      e._heads = heads;
    }
    (heads || []).forEach((hb) => { const c = [Math.max(x0, x0 + hb[0] * sw - ox), Math.max(y0, y0 + hb[1] * sh - oy), Math.min(x1, x0 + hb[2] * sw - ox), Math.min(y1, y0 + hb[3] * sh - oy)];
      if (c[2] > c[0] && c[3] > c[1]) PL.push(c.map(Math.round)); });
  }
  function rect(ctx, e, W, H) {
    const [x0, y0, x1, y1] = e.box; const a = e.alpha != null ? e.alpha : 1; if (a <= 0) return;
    let paint; if (e.grad) { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, rgb(e.grad.top)); g.addColorStop(1, rgb(e.grad.bottom)); paint = g; } else paint = rgb(e.color);
    if (e.feather) {
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
      c.filter = `blur(${e.feather / 3}px)`; c.fillStyle = '#000'; c.fillRect(x0, y0, x1 - x0, y1 - y0); c.filter = 'none';
      c.globalCompositeOperation = 'source-in'; c.fillStyle = paint; c.fillRect(0, 0, W, H);
      ctx.save(); ctx.globalAlpha = a; ctx.drawImage(cv, 0, 0); ctx.restore();
    } else { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = paint; rr(ctx, x0, y0, x1 - x0, y1 - y0, e.radius || 0); ctx.fill(); ctx.restore(); }
  }
  async function loadImg(src) {
    if (!src) return null; if (window.CoverRenderer && CoverRenderer.loadImage) { try { const im = await CoverRenderer.loadImage(src); if (im) return im; } catch (e) {} }
    return new Promise((res) => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
  }
  function drawAll(ctx, T, imgs, people, W, H) {
    const L = {}, PL = [];
    if (ctx) { ctx.fillStyle = rgb(T.bg || [255, 255, 255]); ctx.fillRect(0, 0, W, H); }
    for (const e of T.layers) {
      if (e.type === 'person') { const im = imgs[e._src]; if (im) person(ctx, e, im, e._heads, PL); }
      else if (e.type === 'rect') { if (ctx) rect(ctx, e, W, H); }
      else if (e.type === 'title') title(ctx, e, L);
      else if (e.type === 'text') text(ctx, e, L);
      else if (e.type === 'tag') tag(ctx, e, L);
      else if (e.type === 'vlatin') vlatin(ctx, e, L);
    }
    return { elements: L, head_boxes: PL };
  }
  // ---- v2 safe-margin constraint (port of render_batch_v2.py) ----
  const ov = (b, hb) => hb.reduce((a, h) => a + Math.max(0, Math.min(b[2], h[2]) - Math.max(b[0], h[0])) * Math.max(0, Math.min(b[3], h[3]) - Math.max(b[1], h[1])), 0);
  const elov = (v, hb) => (v.chars ? v.chars.reduce((a, c) => a + ov(c[1], hb), 0) : ov(v.bbox, hb));
  function move(el, d) { if (el.type === 'title') { el.box = [el.box[0], el.box[1] + d, el.box[2], el.box[3] + d]; } else if (el.pos) el.pos = [el.pos[0], el.pos[1] + d]; }
  function applySafe(T, first, W, H) {
    const S = T.safe; const log = { rule: S ? { top: S.top, bottom: S.bottom } : null, actions: [] }; if (!S) return [T, log];
    const E = first.elements, hb = first.head_boxes; const T2 = clone(T); const byid = {}; T2.layers.forEach((e) => { if (e.id && e.type !== 'person') byid[e.id] = e; });
    for (const edge of ['top', 'bottom']) {
      const grp = Object.keys(E).filter((k) => ((E[k].bbox[1] + E[k].bbox[3]) / 2 < H / 2) === (edge === 'top')); if (!grp.length) continue;
      const m = edge === 'top' ? Math.min(...grp.map((k) => E[k].bbox[1])) : H - Math.max(...grp.map((k) => E[k].bbox[3]));
      const d = S[edge] - m; if (d <= 0) continue; const sd = edge === 'top' ? d : -d;
      grp.forEach((k) => move(byid[k], sd)); log.actions.push({ edge, shift: sd, group: grp });
      T2.layers.forEach((e) => { if (e.type === 'rect' && grp.includes(e.follow)) { const b = e.box;
        if (edge === 'bottom' && b[3] >= H) e.box = [b[0], b[1] + sd, b[2], b[3]]; else if (edge === 'top' && b[1] <= 0) e.box = [b[0], b[1], b[2], b[3] + sd]; else e.box = [b[0], b[1] + sd, b[2], b[3] + sd]; } });
      for (const k of grp) {
        const v = E[k], el = byid[k];
        const moved = v.chars ? { chars: v.chars.map(([c, b]) => [c, [b[0], b[1] + sd, b[2], b[3] + sd]]) } : { bbox: [v.bbox[0], v.bbox[1] + sd, v.bbox[2], v.bbox[3] + sd] };
        if (elov(moved, hb) > elov(v, hb)) {
          if (el.type === 'title' && el.mode !== 'vertical') {
            const h = v.bbox[3] - v.bbox[1]; const s = Math.max(S.min_title_scale, (h - d) / h); el.cap_h = Math.floor(el.cap_h * s); const nh = Math.floor(h * s);
            if (edge === 'top') { el.box[1] = v.bbox[3] - nh; el.box[3] = v.bbox[3]; } else { el.box[1] = v.bbox[1]; el.box[3] = v.bbox[1] + nh; }
            log.actions.push({ edge, scale: Math.round(s * 1000) / 1000, el: k, clamped: s === S.min_title_scale });
          } else { move(el, -sd); log.actions.push({ edge, el: k, note: 'kept (would hit face)' }); }
        }
      }
    }
    return [T2, log];
  }
  const DEFAULT_UPLOAD_HEAD = [[0.28, 0.04, 0.72, 0.42]];
  // bind app fields (title/subtitle/badge/tagline; "/" splits across the elements listed in template.fields) + person upload
  function bind(template, data) {
    const T = clone(template.b20); delete T.variants; const F = template.fields || {}; data = data || {};
    const byid = {}; T.layers.forEach((e) => { if (e.id && e.type !== 'person') byid[e.id] = e; });
    for (const key of Object.keys(F)) {
      const v = data[key]; if (v == null || String(v).trim() === '') continue;
      const parts = String(v).split(/[\/／]/); F[key].forEach((id, i) => { if (parts[i] != null && parts[i] !== '' && byid[id]) byid[id].text = parts[i]; });
    }
    const up = data.personPhoto || data.person || '';
    T.layers.forEach((e) => { if (e.type === 'person') { const P = (window.CoverBatch20People || {})[e.id] || {};
      if (up) { e._src = up; e._heads = data.personHeads || null; e._pbox = data.personBox || null; e._uploaded = true; } else { e._src = P.src; e._heads = P.heads; } } });
    return T;
  }
  async function render(canvas, template, size, data) {
    const W = 1080, H = 1440; const T = bind(template, data);
    // fonts
    try { const fams = new Set(); T.layers.forEach((e) => { if (e.text != null) fams.add(fontStr(e.font || (e.type === 'title' ? 'black' : e.type === 'vlatin' ? 'latin' : 'bold'), 40) + '|' + e.text); });
      await Promise.all([...fams].map((s) => { const [f, t] = s.split('|'); return document.fonts.load(f, t); })); } catch (e) {}
    const imgs = {}; for (const e of T.layers) if (e.type === 'person' && e._src && !imgs[e._src]) imgs[e._src] = await loadImg(e._src);
    _gc.clear();
    const first = drawAll(null, T, imgs, null, W, H);
    const [T2, log] = applySafe(T, first, W, H);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d');
    const lay = drawAll(ctx, T2, imgs, null, W, H); lay._safe = log; lay.uploadedPerson = T.layers.some((e) => e._uploaded);
    const tw = (size && size.width) || W, th = (size && size.height) || H; canvas.width = tw; canvas.height = th; const out = canvas.getContext('2d');
    const s = Math.max(tw / W, th / H); out.drawImage(cv, (tw - W * s) / 2, (th - H * s) / 2, W * s, H * s);
    canvas._b20 = lay; canvas._design = { scrims: 0, decoHidden: [] }; return lay;
  }
  return { render, bind, VERSION: '2.0' };
})();
