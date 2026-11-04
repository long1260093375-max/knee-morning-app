/**
 * 人像自动抠图（浏览器本地，不上传）
 * 依赖：@mediapipe/tasks-vision 0.10.14（Apache-2.0）ImageSegmenter，优先加载 vendor/ 自托管文件，失败回退 CDN
 * 主模型 selfie_multiclass_256x256（约 16MB，质量较好），失败回退 selfie_segmenter（约 0.25MB）
 */
window.CoverSegment = (function () {
  'use strict';
  const VER = '0.10.14';
  const abs = (rel) => new URL(rel, document.baseURI).href; // 相对路径，兼容 GitHub Pages 子路径
  const GCS = 'https://storage.googleapis.com/mediapipe-models/image_segmenter';
  // 优先随站自托管的 vendor/，失败才回退 CDN
  const SOURCES = [
    { name: 'local',
      bundle: abs('vendor/mediapipe/vision_bundle.mjs'),
      wasm: abs('vendor/mediapipe/wasm'),
      models: [abs('vendor/mediapipe/models/selfie_multiclass_256x256.tflite'), abs('vendor/mediapipe/models/selfie_segmenter.tflite')] },
    { name: 'cdn',
      bundle: `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VER}/vision_bundle.mjs`,
      wasm: `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VER}/wasm`,
      models: [`${GCS}/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite`, `${GCS}/selfie_segmenter/float16/latest/selfie_segmenter.tflite`] },
  ];
  const MODEL_META = [
    { name: 'selfie_multiclass_256x256', multiclass: true },
    { name: 'selfie_segmenter', multiclass: false },
  ];
  const MAX_SIDE = 1600;
  let segPromise = null;
  let modelInfo = null;
  const maskCache = new Map(); // key -> Promise<{src canvas, mask canvas}>
  const outCache = new Map(); // key|feather -> Promise<url>

  async function create(vision, fileset, m, delegate) {
    return vision.ImageSegmenter.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: m.url, delegate },
      runningMode: 'IMAGE',
      outputConfidenceMasks: true,
      outputCategoryMask: false,
    });
  }

  function getSegmenter() {
    if (segPromise) return segPromise;
    segPromise = (async () => {
      let lastErr;
      for (const src of SOURCES) {
        let vision, fileset;
        try {
          vision = await import(src.bundle);
          fileset = await vision.FilesetResolver.forVisionTasks(src.wasm);
        } catch (e) { lastErr = e; console.warn('[segment] 运行库加载失败', src.name, e); continue; }
        for (let i = 0; i < MODEL_META.length; i++) {
          const m = { ...MODEL_META[i], url: src.models[i] };
          for (const d of ['GPU', 'CPU']) {
            try {
              const seg = await create(vision, fileset, m, d);
              modelInfo = { ...m, delegate: d, source: src.name };
              return seg;
            } catch (e) { lastErr = e; console.warn('[segment]', src.name, m.name, d, e); }
          }
        }
      }
      throw lastErr || new Error('模型加载失败');
    })();
    segPromise.catch(() => { segPromise = null; }); // 允许重试
    return segPromise;
  }

  function loadImg(url) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => res(img);
      img.onerror = () => rej(new Error('图片加载失败'));
      img.src = url;
    });
  }

  async function computeMask(url) {
    const img = await loadImg(url);
    let w = img.naturalWidth, h = img.naturalHeight;
    const s = Math.min(1, MAX_SIDE / Math.max(w, h));
    w = Math.round(w * s); h = Math.round(h * s);
    const src = document.createElement('canvas');
    src.width = w; src.height = h;
    src.getContext('2d').drawImage(img, 0, 0, w, h);

    const seg = await getSegmenter();
    const result = seg.segment(src);
    try {
      const masks = result.confidenceMasks || [];
      if (!masks.length) throw new Error('无分割结果');
      const mw = masks[0].width, mh = masks[0].height;
      const alpha = new Float32Array(mw * mh);
      if (modelInfo.multiclass) {
        const bg = masks[0].getAsFloat32Array(); // 类别 0 = 背景
        for (let i = 0; i < alpha.length; i++) alpha[i] = 1 - bg[i];
      } else {
        alpha.set(masks[0].getAsFloat32Array());
      }
      const mask = document.createElement('canvas');
      mask.width = mw; mask.height = mh;
      const mctx = mask.getContext('2d');
      const id = mctx.createImageData(mw, mh);
      let fg = 0;
      for (let i = 0; i < alpha.length; i++) {
        // 收紧置信度，去掉低置信度的半透明背景残影
        const t = Math.max(0, Math.min(1, (alpha[i] - 0.35) / 0.3));
        const a = t * t * (3 - 2 * t);
        if (a > 0.5) fg++;
        id.data[i * 4 + 3] = Math.round(a * 255);
      }
      mctx.putImageData(id, 0, 0);
      if (fg < alpha.length * 0.01) throw new Error('未检测到人物');
      return { src, mask };
    } finally {
      if (result.close) result.close();
    }
  }

  async function compose(entry, feather) {
    const { src, mask } = entry;
    const w = src.width, h = src.height;
    const out = document.createElement('canvas');
    out.width = w; out.height = h;
    const ctx = out.getContext('2d');
    // 1) 画遮罩（放大到原图尺寸，可羽化）
    const f = Math.max(0, Number(feather) || 0);
    ctx.save();
    if (f > 0) ctx.filter = `blur(${(f * Math.max(w, h)) / 1000}px)`;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(mask, 0, 0, w, h);
    ctx.restore();
    // 2) 原图仅保留遮罩区域
    ctx.globalCompositeOperation = 'source-in';
    ctx.drawImage(src, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    // 3) 裁掉透明空白，便于槽内底部对齐
    const box = alphaBBox(ctx, w, h);
    let final = out;
    if (box) {
      final = document.createElement('canvas');
      final.width = box.w; final.height = box.h;
      final.getContext('2d').drawImage(out, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
    }
    const blob = await new Promise((r) => final.toBlob(r, 'image/png'));
    const u = URL.createObjectURL(blob);
    // 记录裁剪框（相对原图比例），供「整图背景 + 头部遮挡」模式与原照片对齐
    boxes.set(u, box ? { x: box.x / w, y: box.y / h, w: box.w / w, h: box.h / h } : { x: 0, y: 0, w: 1, h: 1 });
    return u;
  }

  const boxes = new Map();
  function alphaBBox(ctx, w, h) {
    const d = ctx.getImageData(0, 0, w, h).data;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] > 12) {
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
    if (x1 < 0) return null;
    return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  }

  /** key: 稳定标识（如 文件名+大小+修改时间）；返回透明 PNG 的 blob URL */
  function cutout(url, key, feather) {
    const k = key || url;
    const ok = `${k}|${feather || 0}`;
    if (outCache.has(ok)) return outCache.get(ok);
    if (!maskCache.has(k)) {
      const p = computeMask(url);
      maskCache.set(k, p);
      p.catch(() => maskCache.delete(k));
    }
    const p = maskCache.get(k).then((e) => compose(e, feather));
    outCache.set(ok, p);
    p.catch(() => outCache.delete(ok));
    return p;
  }

  return { cutout, preload: getSegmenter, info: () => modelInfo, box: (u) => boxes.get(u) || null };
})();
