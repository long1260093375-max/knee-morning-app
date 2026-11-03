/**
 * Canvas 2D 确定性渲染器
 * 模板 JSON → 像素画布，导出与预览共用同一路径
 *
 * v1.1 能力：text stroke/outline（含外描边）、italic、soft shadow、
 * text underline 强调条、text banner 圆角底、shape 线性渐变、
 * 多图片绑定（bgImage / stickerImage / image）
 */

window.CoverRenderer = (function () {
  const imageCache = new Map();

  function pct(v, total) {
    return (Number(v) / 100) * total;
  }

  function parseColor(c) {
    return c || '#000000';
  }

  function createLinearGradient(ctx, fill, x, y, w, h) {
    const angle = ((fill.angle || 0) * Math.PI) / 180;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const len = Math.sqrt(w * w + h * h) / 2;
    const x0 = cx - Math.cos(angle) * len;
    const y0 = cy - Math.sin(angle) * len;
    const x1 = cx + Math.cos(angle) * len;
    const y1 = cy + Math.sin(angle) * len;
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    (fill.stops || []).forEach((s) => g.addColorStop(s.offset, s.color));
    return g;
  }

  function resolveFill(ctx, fill, x, y, w, h) {
    if (!fill) return '#000000';
    if (typeof fill === 'string') return fill;
    if (fill.type === 'linear' && fill.stops) {
      return createLinearGradient(ctx, fill, x, y, w, h);
    }
    return parseColor(fill.color || fill);
  }

  function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.min(Math.max(0, r), w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function wrapText(ctx, text, maxWidth) {
    const lines = [];
    const paragraphs = String(text || '').split(/\n/);
    paragraphs.forEach((para) => {
      if (!para) {
        lines.push('');
        return;
      }
      let line = '';
      for (const ch of para) {
        const test = line + ch;
        if (ctx.measureText(test).width > maxWidth && line) {
          lines.push(line);
          line = ch;
        } else {
          line = test;
        }
      }
      if (line) lines.push(line);
    });
    return lines;
  }

  function buildFont(layer, fontSize) {
    const style = layer.fontStyle === 'italic' || layer.italic === true ? 'italic ' : '';
    const weight = layer.fontWeight || '400';
    const family = layer.fontFamily || 'Noto Sans SC';
    return `${style}${weight} ${fontSize}px "${family}", "PingFang SC", "Microsoft YaHei", sans-serif`;
  }

  function applyShadow(ctx, shadow, minSide) {
    if (!shadow) {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      return;
    }
    ctx.shadowColor = shadow.color || 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = shadow.blur != null ? pct(shadow.blur, minSide) : 8;
    ctx.shadowOffsetX = shadow.offsetX != null ? pct(shadow.offsetX, minSide) : 0;
    ctx.shadowOffsetY = shadow.offsetY != null ? pct(shadow.offsetY, minSide) : pct(0.3, minSide);
  }

  function clearShadow(ctx) {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  function strokeWidthPx(stroke, minSide, fontSize) {
    if (!stroke) return 0;
    if (stroke.widthPx != null) return Number(stroke.widthPx);
    if (stroke.width != null) return pct(stroke.width, minSide);
    // 相对字号的粗描边默认（约字号 12%）
    return fontSize * (stroke.ratio != null ? stroke.ratio : 0.12);
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
    return null;
  }

  function drawBackground(ctx, layer, W, H) {
    const fill = layer.fill || { type: 'solid', color: '#FFFFFF' };
    ctx.fillStyle = resolveFill(ctx, fill, 0, 0, W, H);
    ctx.fillRect(0, 0, W, H);
  }

  function drawShape(ctx, layer, W, H) {
    const x = pct(layer.x, W);
    const y = pct(layer.y, H);
    const w = pct(layer.w, W);
    const h = pct(layer.h, H);
    const r = pct(layer.radius || 0, Math.min(W, H));
    ctx.fillStyle = resolveFill(ctx, layer.fill, x, y, w, h);

    if (layer.shape === 'ellipse') {
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      if (r > 0) {
        roundRect(ctx, x, y, w, h, r);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, w, h);
      }
    }

    if (layer.border) {
      ctx.strokeStyle = layer.border.color || '#000';
      ctx.lineWidth = pct(layer.border.width || 0.2, Math.min(W, H));
      if (layer.shape === 'ellipse') {
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (r > 0) {
        roundRect(ctx, x, y, w, h, r);
        ctx.stroke();
      } else {
        ctx.strokeRect(x, y, w, h);
      }
    }
  }

  function drawImage(ctx, layer, W, H, img) {
    const x = pct(layer.x, W);
    const y = pct(layer.y, H);
    const w = pct(layer.w, W);
    const h = pct(layer.h, H);
    const r = pct(layer.radius || 0, Math.min(W, H));

    ctx.save();
    if (r >= 49) {
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.clip();
    } else if (r > 0) {
      roundRect(ctx, x, y, w, h, r);
      ctx.clip();
    }

    if (img) {
      const iw = img.naturalWidth || img.width;
      const ih = img.naturalHeight || img.height;
      const fit = layer.fit || 'cover';
      if (fit === 'cover') {
        const scale = Math.max(w / iw, h / ih);
        const dw = iw * scale;
        const dh = ih * scale;
        const dx = x + (w - dw) / 2;
        const dy = y + (h - dh) / 2;
        ctx.drawImage(img, dx, dy, dw, dh);
      } else if (fit === 'contain') {
        const scale = Math.min(w / iw, h / ih);
        const dw = iw * scale;
        const dh = ih * scale;
        const dx = x + (w - dw) / 2;
        const dy = y + (h - dh) / 2;
        ctx.drawImage(img, dx, dy, dw, dh);
      } else {
        ctx.drawImage(img, x, y, w, h);
      }
    } else {
      ctx.fillStyle = layer.placeholder || '#E5E7EB';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.font = `${Math.max(12, h * 0.08)}px "Noto Sans SC", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = layer.placeholderLabel || '图片';
      ctx.fillText(label, x + w / 2, y + h / 2);
    }
    ctx.restore();
  }

  function drawTextLines(ctx, lines, tx, startY, lineH, strokeOuter, stroke, fillColor, minSide, fontSize) {
    lines.forEach((line, i) => {
      const ly = startY + i * lineH;
      if (strokeOuter) {
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.strokeStyle = strokeOuter.color || '#FFFFFF';
        ctx.lineWidth = strokeWidthPx(strokeOuter, minSide, fontSize);
        ctx.strokeText(line, tx, ly);
      }
      if (stroke) {
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.strokeStyle = stroke.color || '#000000';
        ctx.lineWidth = strokeWidthPx(stroke, minSide, fontSize);
        ctx.strokeText(line, tx, ly);
      }
      ctx.fillStyle = fillColor;
      ctx.fillText(line, tx, ly);
    });
  }

  function drawText(ctx, layer, W, H, text) {
    const x = pct(layer.x, W);
    const y = pct(layer.y, H);
    const w = pct(layer.w, W);
    const h = pct(layer.h, H);
    const minSide = Math.min(W, H);
    const fontSize = pct(layer.fontSize || 4, minSide);
    const lineHeight = layer.lineHeight || 1.3;
    const align = layer.align || 'left';
    const valign = layer.valign || 'top';
    const content = text != null && text !== '' ? text : layer.sample || '';
    const fillColor = parseColor(layer.color);

    ctx.font = buildFont(layer, fontSize);
    ctx.textAlign = align === 'center' ? 'center' : align === 'right' ? 'right' : 'left';
    ctx.textBaseline = 'top';

    const lines = wrapText(ctx, content, w);
    const lineH = fontSize * lineHeight;
    const totalH = lines.length * lineH;
    let startY = y;
    if (valign === 'middle') startY = y + (h - totalH) / 2;
    else if (valign === 'bottom') startY = y + h - totalH;

    let tx = x;
    if (align === 'center') tx = x + w / 2;
    else if (align === 'right') tx = x + w;

    // 可选 banner：按文字实测宽度画圆角底（确定性）
    if (layer.banner && lines.length) {
      const padX = pct(layer.banner.paddingX != null ? layer.banner.paddingX : 2.2, minSide);
      const padY = pct(layer.banner.paddingY != null ? layer.banner.paddingY : 1.2, minSide);
      const maxLineW = lines.reduce((m, line) => Math.max(m, ctx.measureText(line).width), 0);
      let bx;
      if (align === 'center') bx = tx - maxLineW / 2 - padX;
      else if (align === 'right') bx = tx - maxLineW - padX;
      else bx = tx - padX;
      const by = startY - padY;
      const bw = maxLineW + padX * 2;
      const bh = totalH + padY * 2;
      const br = pct(layer.banner.radius != null ? layer.banner.radius : 2.5, minSide);
      ctx.fillStyle = parseColor(layer.banner.fill || '#FFFFFF');
      roundRect(ctx, bx, by, bw, bh, br);
      ctx.fill();
      if (layer.banner.border) {
        ctx.strokeStyle = layer.banner.border.color || '#000';
        ctx.lineWidth = pct(layer.banner.border.width || 0.15, minSide);
        roundRect(ctx, bx, by, bw, bh, br);
        ctx.stroke();
      }
    }

    ctx.save();
    applyShadow(ctx, layer.shadow, minSide);
    // 描边时先关掉阴影再描，避免描边投影发糊；仅 fill 带阴影更稳
    if (layer.stroke || layer.strokeOuter) {
      clearShadow(ctx);
      drawTextLines(
        ctx,
        lines,
        tx,
        startY,
        lineH,
        layer.strokeOuter || null,
        layer.stroke || null,
        fillColor,
        minSide,
        fontSize
      );
      if (layer.shadow) {
        // 再叠一层带阴影的 fill，增强可读性
        applyShadow(ctx, layer.shadow, minSide);
        ctx.fillStyle = fillColor;
        lines.forEach((line, i) => {
          ctx.fillText(line, tx, startY + i * lineH);
        });
      }
    } else {
      ctx.fillStyle = fillColor;
      lines.forEach((line, i) => {
        ctx.fillText(line, tx, startY + i * lineH);
      });
    }
    clearShadow(ctx);
    ctx.restore();

    // 下划线强调条（相对文字块）
    if (layer.underline && lines.length) {
      const u = layer.underline;
      const uH = pct(u.height != null ? u.height : 0.7, minSide);
      const gap = pct(u.offsetY != null ? u.offsetY : 0.4, minSide);
      const maxLineW = lines.reduce((m, line) => Math.max(m, ctx.measureText(line).width), 0);
      const ratio = u.widthRatio != null ? u.widthRatio : 0.92;
      const uw = maxLineW * ratio;
      let ux;
      if (align === 'center') ux = tx - uw / 2;
      else if (align === 'right') ux = tx - uw;
      else ux = tx;
      const uy = startY + totalH + gap;
      ctx.fillStyle = parseColor(u.color || '#F5C518');
      const ur = pct(u.radius != null ? u.radius : 0.3, minSide);
      if (ur > 0) {
        roundRect(ctx, ux, uy, uw, uH, ur);
        ctx.fill();
      } else {
        ctx.fillRect(ux, uy, uw, uH);
      }
    }
  }

  function drawBadge(ctx, layer, W, H, text) {
    const content = text != null && text !== '' ? text : layer.sample || '标签';
    if (!content) return;

    const x = pct(layer.x, W);
    const y = pct(layer.y, H);
    const w = pct(layer.w, W);
    const h = pct(layer.h, H);
    const minSide = Math.min(W, H);
    const r = pct(layer.radius || 1, minSide);
    const fontSize = pct(layer.fontSize || 2.5, minSide);

    if (layer.bg && layer.bg !== 'transparent') {
      ctx.fillStyle = parseColor(layer.bg);
      if (r > 0) {
        roundRect(ctx, x, y, w, h, r);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, w, h);
      }
    }

    if (layer.border) {
      ctx.strokeStyle = layer.border.color || '#000';
      ctx.lineWidth = pct(layer.border.width || 0.15, minSide);
      const pad = ctx.lineWidth;
      if (r > 0) {
        roundRect(ctx, x + pad / 2, y + pad / 2, w - pad, h - pad, r);
        ctx.stroke();
      } else {
        ctx.strokeRect(x, y, w, h);
      }
    }

    ctx.fillStyle = parseColor(layer.color || '#FFF');
    ctx.font = buildFont(layer, fontSize);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (layer.stroke) {
      ctx.lineJoin = 'round';
      ctx.strokeStyle = layer.stroke.color || '#000';
      ctx.lineWidth = strokeWidthPx(layer.stroke, minSide, fontSize);
      ctx.strokeText(content, x + w / 2, y + h / 2);
    }
    ctx.fillText(content, x + w / 2, y + h / 2);

    if (layer.underline) {
      const u = layer.underline;
      const uH = pct(u.height != null ? u.height : 0.55, minSide);
      const ratio = u.widthRatio != null ? u.widthRatio : 0.55;
      const uw = w * ratio;
      const ux = x + (w - uw) / 2;
      const uy = y + h * 0.72;
      ctx.fillStyle = parseColor(u.color || '#F5C518');
      const ur = pct(u.radius != null ? u.radius : 0.25, minSide);
      if (ur > 0) {
        roundRect(ctx, ux, uy, uw, uH, ur);
        ctx.fill();
      } else {
        ctx.fillRect(ux, uy, uw, uH);
      }
    }
  }

  /**
   * 渲染模板到 canvas
   * @param {HTMLCanvasElement} canvas
   * @param {object} template
   * @param {{ width: number, height: number }} size
   * @param {object} data bindings: title, subtitle, badge, tagline, image, bgImage, stickerImage…
   */
  async function render(canvas, template, size, data = {}) {
    const W = size.width;
    const H = size.height;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    const layers = template.layers || [];
    const imageUrls = {};
    for (const layer of layers) {
      if (layer.type === 'image' && layer.visible !== false) {
        const url = resolveImageUrl(layer, data);
        imageUrls[layer.id] = await loadImage(url);
      }
    }

    for (const layer of layers) {
      if (layer.visible === false) continue;
      switch (layer.type) {
        case 'background':
          drawBackground(ctx, layer, W, H);
          break;
        case 'shape':
          drawShape(ctx, layer, W, H);
          break;
        case 'image':
          drawImage(ctx, layer, W, H, imageUrls[layer.id]);
          break;
        case 'text': {
          const key = layer.binding || 'title';
          const val = data[key] !== undefined ? data[key] : layer.sample;
          drawText(ctx, layer, W, H, val);
          break;
        }
        case 'badge': {
          const key = layer.binding || 'badge';
          const val =
            data[key] !== undefined
              ? data[key]
              : data.badge !== undefined
                ? data.badge
                : layer.sample || '标签';
          drawBadge(ctx, layer, W, H, val);
          break;
        }
        default:
          break;
      }
    }
    return canvas;
  }

  async function toPngBlob(template, size, data) {
    const canvas = document.createElement('canvas');
    await render(canvas, template, size, data);
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  }

  function clearImageCache() {
    imageCache.clear();
  }

  return { render, toPngBlob, loadImage, clearImageCache, resolveImageUrl };
})();
