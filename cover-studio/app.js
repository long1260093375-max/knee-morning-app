/**
 * 封面工坊 — 主应用逻辑
 */
(function () {
  'use strict';

  const state = {
    sizeId: 'xhs-3-4',
    templateId: 'fresh-fitness',
    template: null,
    data: {
      title: '',
      subtitle: '',
      badge: '',
      tagline: '',
      image: '',
      bgImage: '',
      stickerImage: '',
      person: '',
      personTransform: { dx: 0, dy: 0, scale: 1 },
    },
    person: { src: '', key: '', name: '', job: 0 },
    ref: {
      objectUrl: null,
      fileName: '',
      width: 0,
      height: 0,
      ratio: 0,
      suggestedId: null,
      pickedId: null,
      brightness: null,
    },
    batchRows: [],
    batchActive: -1,
    renderToken: 0,
  };

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  function setStatus(msg, type) {
    const el = $('#statusText');
    el.textContent = msg;
    el.className = type === 'ok' ? 'ok' : type === 'err' ? 'err' : '';
  }

  function currentSize() {
    return CoverSizes.getById(state.sizeId);
  }

  function currentTemplate() {
    return state.template || CoverTemplates.getById(state.templateId);
  }

  /* —— 尺寸选择 —— */
  function initSizeSelect() {
    const sel = $('#sizeSelect');
    sel.innerHTML = CoverSizes.PRESETS.map(
      (p) =>
        `<option value="${p.id}">${p.label} · ${p.width}×${p.height}</option>`
    ).join('');
    sel.value = state.sizeId;
    sel.addEventListener('change', () => {
      state.sizeId = sel.value;
      updateSizeMeta();
      scheduleRender();
    });
    updateSizeMeta();
  }

  function updateSizeMeta() {
    const s = currentSize();
    $('#sizeMeta').textContent = `${s.width} × ${s.height} px · 比例 ${s.ratio}${
      s.note ? ' · ' + s.note : ''
    }`;
  }

  /* —— 模板列表 —— */
  function refreshTemplateList() {
    const list = $('#templateList');
    const all = CoverTemplates.all();
    list.innerHTML = all
      .map((t) => {
        const active = t.id === state.templateId ? 'active' : '';
        const custom = t.custom
          ? '<span class="badge-custom">自定义</span>'
          : '';
        return `<button type="button" class="template-card ${active}" data-id="${t.id}">
          <span class="name">${escapeHtml(t.name)}</span>
          ${custom}
          <span class="desc">${escapeHtml(t.description || t.style || '')}</span>
        </button>`;
      })
      .join('');

    list.querySelectorAll('.template-card').forEach((btn) => {
      btn.addEventListener('click', () => selectTemplate(btn.dataset.id));
    });
  }

  function selectTemplate(id) {
    const t = CoverTemplates.getById(id);
    if (!t) return;
    state.templateId = id;
    state.template = CoverTemplates.clone(t);
    applySampleToFields();
    refreshTemplateList();
    rebuildLayerList();
    syncBgColorFields();
    scheduleRender();
    setStatus(`已选择模板：${t.name}`);
  }

  function applySampleToFields() {
    const t = currentTemplate();
    if (!t) return;
    const findSample = (binding) => {
      const layer = (t.layers || []).find(
        (l) => l.binding === binding && (l.type === 'text' || l.type === 'badge')
      );
      return layer && layer.sample != null ? layer.sample : '';
    };
    state.data.title = findSample('title');
    state.data.subtitle = findSample('subtitle');
    state.data.badge = findSample('badge') || '标签';
    state.data.tagline = findSample('tagline');
    // 保留 image 输入
    $('#fieldTitle').value = state.data.title;
    $('#fieldSubtitle').value = state.data.subtitle;
    $('#fieldBadge').value = state.data.badge;
    $('#fieldTagline').value = state.data.tagline;
  }

  function readFieldsToData() {
    state.data.title = $('#fieldTitle').value;
    state.data.subtitle = $('#fieldSubtitle').value;
    state.data.badge = $('#fieldBadge').value;
    state.data.tagline = $('#fieldTagline').value;
    const img = $('#fieldImage').value.trim();
    state.data.image = img;
    state.data.bgImage = img;
    state.data.stickerImage = ($('#fieldSticker') && $('#fieldSticker').value.trim()) || '';
  }

  /* —— 图层编辑 —— */
  function rebuildLayerList() {
    const t = currentTemplate();
    const box = $('#layerList');
    if (!t) {
      box.innerHTML = '';
      return;
    }
    box.innerHTML = (t.layers || [])
      .map((layer, i) => {
        const checked = layer.visible !== false ? 'checked' : '';
        return `<div class="layer-row">
          <input type="checkbox" data-idx="${i}" ${checked} aria-label="显示 ${escapeHtml(layer.id)}" />
          <span class="layer-type">${escapeHtml(layer.type)}</span>
          <span class="layer-id">${escapeHtml(layer.id)}${layer.binding ? ' · ' + escapeHtml(layer.binding) : ''}</span>
        </div>`;
      })
      .join('');

    box.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.addEventListener('change', () => {
        const idx = Number(cb.dataset.idx);
        if (!state.template) state.template = CoverTemplates.clone(currentTemplate());
        state.template.layers[idx].visible = cb.checked;
        scheduleRender();
      });
    });
  }

  function syncBgColorFields() {
    const t = currentTemplate();
    const bg = (t.layers || []).find((l) => l.type === 'background');
    let color = '#FFFFFF';
    if (bg && bg.fill) {
      if (typeof bg.fill === 'string') color = bg.fill;
      else if (bg.fill.type === 'solid' && bg.fill.color) color = bg.fill.color;
      else if (bg.fill.stops && bg.fill.stops[0]) color = bg.fill.stops[0].color;
    }
    // color input 只接受 #rrggbb
    const hex = normalizeHex(color) || '#ffffff';
    $('#fieldBgColor').value = hex;
    $('#fieldBgColorText').value =
      bg && bg.fill && bg.fill.type === 'linear' ? '(渐变)' : hex;
  }

  function normalizeHex(c) {
    if (!c || typeof c !== 'string') return null;
    if (/^#[0-9a-fA-F]{6}$/.test(c)) return c;
    if (/^#[0-9a-fA-F]{3}$/.test(c)) {
      return (
        '#' +
        c
          .slice(1)
          .split('')
          .map((ch) => ch + ch)
          .join('')
      );
    }
    return null;
  }

  function applyBgColor(hex) {
    if (!state.template) state.template = CoverTemplates.clone(currentTemplate());
    const bg = state.template.layers.find((l) => l.type === 'background');
    if (!bg) return;
    bg.fill = { type: 'solid', color: hex };
    $('#fieldBgColorText').value = hex;
    scheduleRender();
  }

  /* —— 渲染 —— */
  let renderTimer = null;
  function scheduleRender() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(doRender, 40);
  }

  async function doRender() {
    const token = ++state.renderToken;
    readFieldsToData();
    const canvas = $('#previewCanvas');
    const size = currentSize();
    const template = currentTemplate();
    try {
      await CoverRenderer.render(canvas, template, size, state.data);
      if (token !== state.renderToken) return;
      setStatus(`预览已更新 · ${size.width}×${size.height} · ${template.name}`, 'ok');
    } catch (err) {
      console.error(err);
      setStatus('渲染失败：' + err.message, 'err');
    }
  }

  /* —— 导出 —— */
  function safeFilename(name) {
    return String(name || 'cover')
      .replace(/[\\/:*?"<>|]+/g, '_')
      .replace(/\s+/g, '_')
      .slice(0, 60);
  }

  async function exportOnePng() {
    readFieldsToData();
    const size = currentSize();
    const template = currentTemplate();
    setStatus('正在导出 PNG…');
    try {
      const blob = await CoverRenderer.toPngBlob(template, size, state.data);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${safeFilename(state.data.title || template.name)}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      setStatus('PNG 已下载', 'ok');
    } catch (err) {
      setStatus('导出失败：' + err.message, 'err');
    }
  }

  async function exportZip(rows) {
    if (typeof JSZip === 'undefined') {
      setStatus('JSZip 未加载，请检查网络/CDN', 'err');
      return;
    }
    const list =
      rows && rows.length
        ? rows
        : state.batchRows.length
          ? state.batchRows
          : [
              {
                title: state.data.title,
                subtitle: state.data.subtitle,
                badge: state.data.badge,
                tagline: state.data.tagline,
                image: state.data.image,
              },
            ];

    const size = currentSize();
    const template = currentTemplate();
    const zip = new JSZip();
    setStatus(`正在打包 ${list.length} 张封面…`);

    for (let i = 0; i < list.length; i++) {
      const row = list[i];
      const data = {
        title: row.title || '',
        subtitle: row.subtitle || '',
        badge: row.badge || '',
        tagline: row.tagline || '',
        image: row.image || row.image_url || row.bgImage || '',
        bgImage: row.bgImage || row.image || row.image_url || '',
        stickerImage: row.stickerImage || row.sticker || '',
        person: state.data.person,
        personTransform: state.data.personTransform,
      };
      if (row.personSrc) {
        setStatus(`正在处理第 ${i + 1}/${list.length} 张人物图…`);
        data.person = await personUrlFor(row.personSrc, row.personKey, row.personName);
        data.personTransform = { dx: 0, dy: 0, scale: 1 };
      }
      const blob = await CoverRenderer.toPngBlob(template, size, data);
      const name = `${String(i + 1).padStart(2, '0')}_${safeFilename(data.title || 'cover')}.png`;
      zip.file(name, blob);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(zipBlob);
    a.download = `covers_${size.id}_${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(a.href);
    setStatus(`已导出 ZIP（${list.length} 张）`, 'ok');
  }

  /* —— 批量解析 —— */
  function parseBatchText(raw) {
    const text = String(raw || '').trim();
    if (!text) return [];

    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (!lines.length) return [];

    // 检测分隔符
    const first = lines[0];
    let sep = ',';
    if (first.includes('\t')) sep = '\t';
    else if ((first.match(/,/g) || []).length >= 1) sep = ',';
    else sep = null; // 每行一句标题

    let headers = null;
    let start = 0;
    if (sep) {
      const cols = splitLine(first, sep).map((c) => c.trim().toLowerCase());
      const known = ['title', 'subtitle', 'badge', 'tagline', 'image', 'image_url', '标题', '副标题', '标签', '图片'];
      if (cols.some((c) => known.includes(c))) {
        headers = cols.map(normalizeHeader);
        start = 1;
      }
    }

    const rows = [];
    for (let i = start; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      if (!sep) {
        rows.push({ title: line, subtitle: '', badge: '', image: '' });
        continue;
      }
      const parts = splitLine(line, sep);
      if (headers) {
        const row = { title: '', subtitle: '', badge: '', tagline: '', image: '' };
        headers.forEach((h, idx) => {
          if (!h) return;
          const val = (parts[idx] || '').trim();
          if (h === 'image_url') row.image = val;
          else if (row[h] !== undefined) row[h] = val;
        });
        rows.push(row);
      } else {
        rows.push({
          title: (parts[0] || '').trim(),
          subtitle: (parts[1] || '').trim(),
          badge: (parts[2] || '').trim(),
          image: (parts[3] || '').trim(),
          tagline: '',
        });
      }
    }
    return rows;
  }

  function splitLine(line, sep) {
    // 简单 CSV：支持双引号包裹
    if (sep === '\t') return line.split('\t');
    const out = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQ = !inQ;
        continue;
      }
      if (ch === sep && !inQ) {
        out.push(cur);
        cur = '';
        continue;
      }
      cur += ch;
    }
    out.push(cur);
    return out;
  }

  function normalizeHeader(h) {
    const map = {
      title: 'title',
      标题: 'title',
      subtitle: 'subtitle',
      副标题: 'subtitle',
      badge: 'badge',
      标签: 'badge',
      tag: 'badge',
      tagline: 'tagline',
      image: 'image',
      image_url: 'image_url',
      图片: 'image',
    };
    return map[h] || h;
  }

  function renderBatchList() {
    const box = $('#batchList');
    if (!state.batchRows.length) {
      box.innerHTML = '<p class="hint">暂无数据，请粘贴表格后点「解析预览」</p>';
      return;
    }
    box.innerHTML = state.batchRows
      .map((row, i) => {
        const active = i === state.batchActive ? 'active' : '';
        return `<div class="batch-item ${active}" data-idx="${i}">
          <span class="idx">${i + 1}</span>
          <div>
            <div class="title">${escapeHtml(row.title || '(无标题)')}</div>
            <div class="sub">${escapeHtml([row.subtitle, row.badge, row.personName ? '人物:' + row.personName : ''].filter(Boolean).join(' · '))}</div>
          </div>
        </div>`;
      })
      .join('');

    box.querySelectorAll('.batch-item').forEach((el) => {
      el.addEventListener('click', () => {
        const idx = Number(el.dataset.idx);
        applyBatchRow(idx);
      });
    });
  }

  function applyBatchRow(idx) {
    const row = state.batchRows[idx];
    if (!row) return;
    state.batchActive = idx;
    $('#fieldTitle').value = row.title || '';
    $('#fieldSubtitle').value = row.subtitle || '';
    $('#fieldBadge').value = row.badge || '';
    $('#fieldTagline').value = row.tagline || '';
    if (row.image || row.image_url) {
      $('#fieldImage').value = row.image || row.image_url || '';
    }
    renderBatchList();
    if (row.personSrc) {
      setPersonSource(row.personSrc, row.personKey, row.personName);
    } else scheduleRender();
    setStatus(`已应用第 ${idx + 1} 行到预览`);
  }

  /* —— 从描述生成 —— */
  function handleGenerate() {
    const desc = $('#descInput').value.trim();
    if (!desc) {
      setStatus('请输入中文描述', 'err');
      return;
    }
    try {
      const tpl = CoverGenerator.generateFromDescription(desc);
      const info = CoverGenerator.explain(desc);
      CoverTemplates.addCustom(tpl);
      selectTemplate(tpl.id);
      refreshTemplateList();

      const box = $('#genResult');
      box.classList.add('show');
      box.innerHTML = `已生成「${escapeHtml(tpl.name)}」<br/>
        匹配风格：${escapeHtml(info.matchedStyle)} · 布局：${escapeHtml(info.layout)} · 引擎：${escapeHtml(info.engine)}`;
      setStatus('模板已生成并加入库', 'ok');
    } catch (err) {
      setStatus(err.message, 'err');
    }
  }

  /* —— 参考图解析（v1.1 启发式，非 ML） —— */
  const REF_TEMPLATE_META = [
    {
      id: 'pov-sticker-qa',
      name: 'POV贴纸问答',
      ratios: [0.75],
      ratioLoose: [0.68, 0.82],
      sampleTitle: '准备去香港买港版苹果手机',
      sampleSubtitle: '该注意什么?',
      sizeHint: 'xhs-3-4',
      why: '约 3:4 竖图 + 上区标题/胶囊副标题 + 可选左下贴纸',
    },
    {
      id: 'portrait-dual-hook',
      name: '人像双行钩子',
      ratios: [0.5625],
      ratioLoose: [0.5, 0.65],
      sampleTitle: '别再吹港卡了',
      sampleSubtitle: '新加坡卡才是王炸',
      sizeHint: 'douyin-9-16',
      why: '约 9:16 人像竖图 + 下中双行描边钩子',
    },
  ];

  function revokeRefUrl() {
    if (state.ref.objectUrl) {
      try { URL.revokeObjectURL(state.ref.objectUrl); } catch (_) {}
      state.ref.objectUrl = null;
    }
  }

  function suggestTemplateFromMetrics(width, height, brightness) {
    const ratio = width / height;
    let best = null;
    let bestScore = -Infinity;
    const notes = [];

    REF_TEMPLATE_META.forEach((meta) => {
      let score = 0;
      const target = meta.ratios[0];
      const dist = Math.abs(ratio - target);
      score += Math.max(0, 40 - dist * 120);
      const [lo, hi] = meta.ratioLoose;
      if (ratio >= lo && ratio <= hi) score += 25;

      // 亮度启发式：上半更暗 → 偏 POV（顶区叠字）；下半更暗 → 偏人像钩子（底 vignette）
      if (brightness) {
        if (meta.id === 'pov-sticker-qa' && brightness.top < brightness.bottom - 8) score += 12;
        if (meta.id === 'portrait-dual-hook' && brightness.bottom < brightness.top - 8) score += 12;
        if (meta.id === 'portrait-dual-hook' && ratio < 0.65) score += 4;
      }
      notes.push({ id: meta.id, name: meta.name, score: Math.round(score), dist: dist.toFixed(3) });
      if (score > bestScore) {
        bestScore = score;
        best = meta;
      }
    });

    notes.sort((a, b) => b.score - a.score);
    return { suggested: best, scores: notes, ratio };
  }

  function sampleBrightnessBands(img) {
    try {
      const c = document.createElement('canvas');
      const tw = 64;
      const th = Math.max(32, Math.round((img.naturalHeight / img.naturalWidth) * tw));
      c.width = tw;
      c.height = th;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, tw, th);
      const data = ctx.getImageData(0, 0, tw, th).data;
      const band = (y0, y1) => {
        let sum = 0;
        let n = 0;
        for (let y = y0; y < y1; y++) {
          for (let x = 0; x < tw; x++) {
            const i = (y * tw + x) * 4;
            sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            n++;
          }
        }
        return n ? sum / n : 0;
      };
      const top = band(0, Math.floor(th * 0.35));
      const bottom = band(Math.floor(th * 0.65), th);
      return { top, bottom };
    } catch (err) {
      console.warn('brightness sample failed', err);
      return null;
    }
  }

  function renderRefPicks(suggestedId) {
    const box = $('#refTemplatePicks');
    box.innerHTML = REF_TEMPLATE_META.map((meta) => {
      const active = (state.ref.pickedId || suggestedId) === meta.id ? 'active' : '';
      const tag = suggestedId === meta.id ? '<span class="pick-tag">建议</span>' : '';
      return `<button type="button" class="ref-pick ${active}" data-id="${meta.id}">
        <span class="name">${escapeHtml(meta.name)} ${tag}</span>
        <span class="desc">${escapeHtml(meta.why)}</span>
      </button>`;
    }).join('');
    box.querySelectorAll('.ref-pick').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.ref.pickedId = btn.dataset.id;
        renderRefPicks(suggestedId);
      });
    });
  }

  function showRefParseResult() {
    const panel = $('#refParsePanel');
    const metaEl = $('#refParseMeta');
    const { width, height, ratio, suggestedId, brightness, fileName } = state.ref;
    const suggested = REF_TEMPLATE_META.find((m) => m.id === suggestedId);
    const brightLine = brightness
      ? `上半亮度 ${brightness.top.toFixed(0)} · 下半亮度 ${brightness.bottom.toFixed(0)}（仅抽样，非版式识别）`
      : '亮度抽样不可用';
    metaEl.innerHTML = `
      <div><strong>文件</strong> ${escapeHtml(fileName || '参考图')}</div>
      <div><strong>尺寸</strong> ${width} × ${height} · 比例 ${ratio.toFixed(3)}（${ratioDesc(ratio)}）</div>
      <div><strong>建议模板</strong> ${suggested ? escapeHtml(suggested.name) : '—'} <span class="hint">（按比例/亮度打分，可改选手动项）</span></div>
      <div class="hint">${brightLine}</div>
    `;
    renderRefPicks(suggestedId);
    panel.hidden = false;
  }

  function ratioDesc(r) {
    if (Math.abs(r - 0.75) < 0.04) return '≈3:4';
    if (Math.abs(r - 0.5625) < 0.04) return '≈9:16';
    if (Math.abs(r - 1) < 0.05) return '≈1:1';
    if (Math.abs(r - 16 / 9) < 0.06) return '≈16:9';
    return '其他';
  }

  function handleRefImage(img, fileName, objectUrl) {
    revokeRefUrl();
    state.ref.objectUrl = objectUrl;
    state.ref.fileName = fileName || 'reference.png';
    state.ref.width = img.naturalWidth || img.width;
    state.ref.height = img.naturalHeight || img.height;
    state.ref.ratio = state.ref.width / state.ref.height;
    state.ref.brightness = sampleBrightnessBands(img);
    const result = suggestTemplateFromMetrics(
      state.ref.width,
      state.ref.height,
      state.ref.brightness
    );
    state.ref.suggestedId = result.suggested ? result.suggested.id : null;
    state.ref.pickedId = state.ref.suggestedId;

    const preview = $('#refPreview');
    preview.src = objectUrl;
    preview.classList.add('show');
    showRefParseResult();

    const scores = result.scores
      .map((s) => `${s.name} ${s.score}分`)
      .join(' / ');
    $('#refStatus').innerHTML =
      `启发式完成（非 ML）。打分：${escapeHtml(scores)}。<br/>可点下方「套用」把建议模板 + 示例文案 + 本图背景应用到画布。`;
    setStatus(`参考图已分析 · 建议「${result.suggested ? result.suggested.name : '—'}」`);
  }

  function loadRefFromFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      $('#refStatus').textContent = '请上传图片文件';
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => handleRefImage(img, file.name, url);
    img.onerror = () => {
      URL.revokeObjectURL(url);
      $('#refStatus').textContent = '图片加载失败';
    };
    img.src = url;
  }

  function loadRefFromUrl(url, label) {
    const img = new Image();
    img.onload = () => {
      // 内置 refs 用原 URL，不 revoke
      state.ref.objectUrl = null;
      state.ref.fileName = label;
      state.ref.width = img.naturalWidth || img.width;
      state.ref.height = img.naturalHeight || img.height;
      state.ref.ratio = state.ref.width / state.ref.height;
      state.ref.brightness = sampleBrightnessBands(img);
      const result = suggestTemplateFromMetrics(
        state.ref.width,
        state.ref.height,
        state.ref.brightness
      );
      state.ref.suggestedId = result.suggested ? result.suggested.id : null;
      state.ref.pickedId = state.ref.suggestedId;
      const preview = $('#refPreview');
      preview.src = url;
      preview.classList.add('show');
      // 暂存可套用的背景 URL
      state.ref.applyImageUrl = url;
      showRefParseResult();
      $('#refStatus').innerHTML =
        `已加载内置参考「${escapeHtml(label)}」。解析为启发式打分，非视觉重建图层。`;
      setStatus(`已加载参考示例 · ${label}`);
    };
    img.onerror = () => {
      $('#refStatus').textContent = '内置参考图加载失败（请用本地 HTTP 打开，勿用 file://）';
    };
    img.src = url;
  }

  function applyRefParse() {
    const id = state.ref.pickedId || state.ref.suggestedId;
    const meta = REF_TEMPLATE_META.find((m) => m.id === id);
    if (!meta) {
      setStatus('请先上传参考图并选择模板', 'err');
      return;
    }
    // 尺寸提示
    if (meta.sizeHint && CoverSizes.getById(meta.sizeHint)) {
      state.sizeId = meta.sizeHint;
      $('#sizeSelect').value = state.sizeId;
      updateSizeMeta();
    }
    selectTemplate(meta.id);
    $('#fieldTitle').value = meta.sampleTitle;
    $('#fieldSubtitle').value = meta.sampleSubtitle;
    const bg =
      state.ref.applyImageUrl ||
      state.ref.objectUrl ||
      $('#refPreview').src ||
      '';
    if (bg) {
      $('#fieldImage').value = bg;
    }
    // 贴纸槽保持空，除非用户另传
    scheduleRender();
    setStatus(`已套用「${meta.name}」+ 示例文案 + 参考图作背景`, 'ok');
  }

  function initReferenceStub() {
    const input = $('#refFileInput');
    const zone = $('#refUploadZone');

    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.style.borderColor = 'var(--accent)';
    });
    zone.addEventListener('dragleave', () => {
      zone.style.borderColor = '';
    });
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.style.borderColor = '';
      const file = e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) {
        state.ref.applyImageUrl = null;
        loadRefFromFile(file);
      }
    });

    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (file) {
        state.ref.applyImageUrl = null;
        loadRefFromFile(file);
      }
    });

    const btnPov = $('#btnRefSamplePov');
    const btnPortrait = $('#btnRefSamplePortrait');
    if (btnPov) {
      btnPov.addEventListener('click', () =>
        loadRefFromUrl('refs/pov-sticker-qa.png', 'POV贴纸问答参考')
      );
    }
    if (btnPortrait) {
      btnPortrait.addEventListener('click', () =>
        loadRefFromUrl('refs/portrait-dual-hook.png', '人像双行钩子参考')
      );
    }
    const btnApply = $('#btnApplyRefParse');
    if (btnApply) btnApply.addEventListener('click', applyRefParse);
  }

  /* —— Tabs —— */
  function initTabs() {
    $$('.panel-tabs button[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        $$('.panel-tabs button[data-tab]').forEach((b) =>
          b.classList.toggle('active', b === btn)
        );
        ['library', 'generate', 'reference'].forEach((id) => {
          $(`#tab-${id}`).classList.toggle('active', id === tab);
        });
      });
    });
  }

  /* —— 字段监听 —— */
  function initFields() {
    ['fieldTitle', 'fieldSubtitle', 'fieldBadge', 'fieldTagline', 'fieldImage', 'fieldSticker'].forEach(
      (id) => {
        const el = $(`#${id}`);
        if (el) el.addEventListener('input', scheduleRender);
      }
    );

    $('#fieldBgColor').addEventListener('input', (e) => {
      applyBgColor(e.target.value);
    });
    $('#fieldBgColorText').addEventListener('change', (e) => {
      const hex = normalizeHex(e.target.value.trim());
      if (hex) {
        $('#fieldBgColor').value = hex;
        applyBgColor(hex);
      }
    });

    $('#btnResetSample').addEventListener('click', () => {
      applySampleToFields();
      scheduleRender();
    });

    $('#btnExportOne').addEventListener('click', exportOnePng);
    $('#btnExportZip').addEventListener('click', () => exportZip());
    $('#btnExportZip2').addEventListener('click', () => exportZip());

    $('#btnGenerate').addEventListener('click', handleGenerate);

    $('#btnParseBatch').addEventListener('click', () => {
      state.batchRows = parseBatchText($('#batchInput').value);
      attachBatchPersons();
      state.batchActive = -1;
      renderBatchList();
      setStatus(`已解析 ${state.batchRows.length} 行`, 'ok');
    });

    $('#btnLoadSampleBatch').addEventListener('click', () => {
      $('#batchInput').value = [
        'title,subtitle,badge,image',
        '30天居家训练计划,无需器械 · 每天20分钟,健身,',
        '秋日穿搭灵感手册,Minimal · Editorial,时尚,',
        'AI 工具效率翻倍,2026 必备清单,科技,',
      ].join('\n');
      state.batchRows = parseBatchText($('#batchInput').value);
      attachBatchPersons();
      state.batchActive = -1;
      renderBatchList();
      setStatus('已填入 3 行示例', 'ok');
    });
  }

  /* —— 人物照片 / 自动抠图 —— */
  function personHint(msg, cls) {
    const el = $('#personHint');
    if (!el) return;
    el.textContent = msg;
    el.className = 'hint' + (cls ? ' ' + cls : '');
  }
  function fileKey(f) {
    return `${f.name}|${f.size}|${f.lastModified}`;
  }
  /** 返回人物层应使用的 URL：开抠图则抠图结果，失败回退原图 */
  async function personUrlFor(src, key, name) {
    if (!$('#personCutout').checked || !window.CoverSegment) return src;
    try {
      return await CoverSegment.cutout(src, key, Number($('#personFeather').value));
    } catch (err) {
      console.warn('抠图失败', err);
      const msg = (err && err.message) || '';
      const why = /fetch|import|load|network|wasm/i.test(msg) ? '模型加载失败' : msg || '未知错误';
      personHint(`抠图失败（${why}），已使用原图`, 'err');
      return src;
    }
  }
  async function refreshPerson() {
    const p = state.person;
    if (!p.src) {
      state.data.person = '';
      scheduleRender();
      return;
    }
    const job = ++p.job;
    // 先显示原图，避免空白
    if (!state.data.person) state.data.person = p.src;
    if ($('#personCutout').checked) personHint('正在抠图…（首次需加载模型，请稍候）', 'busy');
    scheduleRender();
    const url = await personUrlFor(p.src, p.key, p.name);
    if (job !== p.job) return;
    state.data.person = url;
    if (url !== p.src) {
      const info = CoverSegment.info();
      personHint(`已抠图 · ${info ? info.name : ''}（拖动预览可调整位置，滚轮缩放）`);
    } else if (!$('#personCutout').checked) {
      personHint('已使用原图（抠图已关闭）');
    }
    scheduleRender();
  }
  function setPersonSource(src, key, name) {
    state.person.src = src;
    state.person.key = key || src;
    state.person.name = name || '';
    state.data.person = '';
    refreshPerson();
  }
  function setPersonScale(v) {
    const t = state.data.personTransform;
    t.scale = Math.max(0.3, Math.min(2.5, v));
    $('#personScale').value = t.scale;
    scheduleRender();
  }
  function attachBatchPersons() {
    const files = state.batchFiles || [];
    state.batchRows.forEach((row, i) => {
      const f = files[i];
      if (f) {
        row.personSrc = f.url;
        row.personKey = f.key;
        row.personName = f.name;
      }
    });
  }
  function initPerson() {
    if (!$('#personFile')) return;
    $('#personFile').addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      if (!f.type.startsWith('image/')) {
        personHint('请选择图片文件', 'err');
        return;
      }
      state.data.personTransform = { dx: 0, dy: 0, scale: 1 };
      $('#personScale').value = 1;
      setPersonSource(URL.createObjectURL(f), fileKey(f), f.name);
    });
    $('#personCutout').addEventListener('change', () => {
      state.data.person = '';
      refreshPerson();
    });
    $('#personFeather').addEventListener('change', refreshPerson);
    $('#personScale').addEventListener('input', (e) => setPersonScale(Number(e.target.value)));
    $('#personReset').addEventListener('click', () => {
      state.data.personTransform = { dx: 0, dy: 0, scale: 1 };
      $('#personScale').value = 1;
      scheduleRender();
    });
    $('#personClear').addEventListener('click', () => {
      state.person.src = '';
      state.person.job++;
      $('#personFile').value = '';
      personHint('上传人像后自动去背景（本地处理，不上传）。');
      refreshPerson();
    });
    $('#batchPersonFiles').addEventListener('change', (e) => {
      const files = Array.from(e.target.files || [])
        .filter((f) => f.type.startsWith('image/'))
        .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN', { numeric: true }));
      state.batchFiles = files.map((f) => ({ url: URL.createObjectURL(f), key: fileKey(f), name: f.name }));
      attachBatchPersons();
      renderBatchList();
      setStatus(`已载入 ${files.length} 张人物照片（按文件名顺序对应各行）`, 'ok');
    });

    // 预览拖动 / 滚轮缩放
    const cv = $('#previewCanvas');
    let drag = null;
    cv.addEventListener('pointerdown', (e) => {
      if (!state.data.person) return;
      const r = cv.getBoundingClientRect();
      const t = state.data.personTransform;
      drag = { x: e.clientX, y: e.clientY, w: r.width, h: r.height, dx: t.dx, dy: t.dy };
      cv.setPointerCapture(e.pointerId);
    });
    cv.addEventListener('pointermove', (e) => {
      cv.classList.toggle('person-drag', !!state.data.person);
      if (!drag) return;
      const t = state.data.personTransform;
      t.dx = drag.dx + ((e.clientX - drag.x) / drag.w) * 100;
      t.dy = drag.dy + ((e.clientY - drag.y) / drag.h) * 100;
      scheduleRender();
    });
    const end = () => { drag = null; };
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);
    cv.addEventListener('wheel', (e) => {
      if (!state.data.person) return;
      e.preventDefault();
      setPersonScale(state.data.personTransform.scale * (e.deltaY < 0 ? 1.05 : 0.95));
    }, { passive: false });
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* —— 启动 —— */
  function boot() {
    initSizeSelect();
    initTabs();
    initFields();
    initPerson();
    initReferenceStub();
    refreshTemplateList();
    selectTemplate(state.templateId);
    // 字体加载后再渲一次，避免首次空白字形
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => scheduleRender());
    }
    setStatus('就绪 · 打开本地或 python -m http.server 即可使用');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
