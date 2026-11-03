/**
 * 从中文短描述生成结构化模板（规则 / 启发式）
 *
 * TODO(vision/LLM): 后续可接入视觉模型解析参考图，或 LLM 解析描述 → 更丰富的版式。
 * 当前 v1：关键词 → 布局预设 + 色板，保证输出稳定可复现。
 */

window.CoverGenerator = (function () {
  const PALETTES = {
    fitness: {
      bg: '#F0F7F4',
      accent: '#2DD4A8',
      title: '#1A3A2F',
      sub: '#4A6B5E',
      muted: '#7A9A8C',
      badgeBg: '#2DD4A8',
      badgeFg: '#FFFFFF',
      imagePh: '#D1E7DD',
    },
    fresh: {
      bg: '#F8FAFC',
      accent: '#38BDF8',
      title: '#0F172A',
      sub: '#475569',
      muted: '#94A3B8',
      badgeBg: '#0EA5E9',
      badgeFg: '#FFFFFF',
      imagePh: '#E0F2FE',
    },
    warm: {
      bg: '#FFF7ED',
      accent: '#F97316',
      title: '#7C2D12',
      sub: '#C2410C',
      muted: '#FB923C',
      badgeBg: '#F97316',
      badgeFg: '#FFFFFF',
      imagePh: '#FFEDD5',
    },
    magazine: {
      bg: '#1A1A1A',
      accent: '#FFFFFF',
      title: '#FFFFFF',
      sub: '#B0B0B0',
      muted: '#888888',
      badgeBg: '#FFFFFF',
      badgeFg: '#1A1A1A',
      imagePh: '#3A3A3A',
    },
    contrast: {
      bg: '#FF3B30',
      accent: '#FFFFFF',
      title: '#FFFFFF',
      sub: 'rgba(255,255,255,0.9)',
      muted: 'rgba(255,255,255,0.7)',
      badgeBg: '#FFFFFF',
      badgeFg: '#FF3B30',
      imagePh: '#CC2F26',
    },
    tech: {
      bg: '#0B1220',
      accent: '#22D3EE',
      title: '#F8FAFC',
      sub: '#94A3B8',
      muted: '#64748B',
      badgeBg: 'transparent',
      badgeFg: '#22D3EE',
      imagePh: '#1E293B',
      gradient: {
        type: 'linear',
        angle: 160,
        stops: [
          { offset: 0, color: '#0B1220' },
          { offset: 1, color: '#111827' },
        ],
      },
    },
    vitality: {
      bg: null,
      accent: '#FF6B6B',
      title: '#FFFFFF',
      sub: 'rgba(255,255,255,0.9)',
      muted: 'rgba(255,255,255,0.75)',
      badgeBg: 'rgba(255,255,255,0.95)',
      badgeFg: '#FF6B6B',
      imagePh: 'rgba(255,255,255,0.3)',
      gradient: {
        type: 'linear',
        angle: 135,
        stops: [
          { offset: 0, color: '#FF6B6B' },
          { offset: 0.5, color: '#FF8E53' },
          { offset: 1, color: '#FFC857' },
        ],
      },
    },
    knowledge: {
      bg: '#EEF2FF',
      accent: '#4F46E5',
      title: '#1E1B4B',
      sub: '#6366F1',
      muted: '#A5B4FC',
      badgeBg: '#4F46E5',
      badgeFg: '#FFFFFF',
      imagePh: '#E0E7FF',
    },
  };

  /** 关键词 → 风格 / 色板 / 布局 */
  const RULES = [
    { keys: ['健身', '运动', '训练', '减肥', '瑜伽', '跑步'], style: '清爽健身', palette: 'fitness', layout: 'left-text-right-image' },
    { keys: ['科技', '数码', 'AI', '人工智能', '编程', '开发', '互联网'], style: '暗色科技', palette: 'tech', layout: 'left-text-right-image' },
    { keys: ['杂志', '时尚', '穿搭', '美妆', '摄影'], style: '简约杂志', palette: 'magazine', layout: 'magazine-bottom' },
    { keys: ['冲击', '爆款', '干货', '别再', '警告', '高对比'], style: '高对比标题', palette: 'contrast', layout: 'big-title' },
    { keys: ['课程', '知识', '学习', '教程', '入门', '指南', '产品'], style: '卡片叠层', palette: 'knowledge', layout: 'card-stack' },
    { keys: ['活力', '旅行', '周末', '青春', '快乐', '渐变'], style: '渐变活力', palette: 'vitality', layout: 'center-vitality' },
    { keys: ['清爽', '简约', '干净', '浅色', '小清新'], style: '清爽通用', palette: 'fresh', layout: 'left-text-right-image' },
    { keys: ['温暖', '美食', '家居', '生活'], style: '温暖生活', palette: 'warm', layout: 'left-text-right-image' },
  ];

  function matchRule(desc) {
    const text = String(desc || '');
    for (const rule of RULES) {
      if (rule.keys.some((k) => text.includes(k))) return rule;
    }
    // 默认：清爽左侧文案
    return { style: '清爽通用', palette: 'fresh', layout: 'left-text-right-image' };
  }

  function uid(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  }

  function buildLayout(layout, palette, styleName, desc) {
    const p = PALETTES[palette] || PALETTES.fresh;
    const bgFill = p.gradient
      ? p.gradient
      : { type: 'solid', color: p.bg || '#FFFFFF' };

    const commonMeta = {
      id: uid('gen'),
      name: `生成 · ${styleName}`,
      style: styleName,
      description: `由描述「${desc}」规则生成`,
      generatedFrom: desc,
      generatedAt: new Date().toISOString(),
      custom: true,
    };

    if (layout === 'magazine-bottom') {
      return {
        ...commonMeta,
        layers: [
          { id: 'bg', type: 'background', visible: true, fill: bgFill },
          { id: 'image-main', type: 'image', visible: true, binding: 'image', x: 0, y: 0, w: 100, h: 72, fit: 'cover', radius: 0, placeholder: p.imagePh },
          { id: 'overlay', type: 'shape', visible: true, shape: 'rect', x: 0, y: 58, w: 100, h: 42, fill: 'rgba(18,18,18,0.88)' },
          { id: 'badge', type: 'badge', visible: true, binding: 'badge', x: 6, y: 64, w: 22, h: 4.5, bg: p.badgeBg, color: p.badgeFg, fontSize: 2.4, fontWeight: '600', align: 'center', radius: 0.5 },
          { id: 'title', type: 'text', visible: true, binding: 'title', x: 6, y: 72, w: 88, h: 14, fontFamily: 'Noto Sans SC', fontSize: 6.5, fontWeight: '700', color: p.title, align: 'left', valign: 'top', lineHeight: 1.2, sample: '标题文案' },
          { id: 'subtitle', type: 'text', visible: true, binding: 'subtitle', x: 6, y: 88, w: 88, h: 6, fontFamily: 'Noto Sans SC', fontSize: 2.8, fontWeight: '300', color: p.sub, align: 'left', sample: '副标题' },
        ],
      };
    }

    if (layout === 'big-title') {
      return {
        ...commonMeta,
        layers: [
          { id: 'bg', type: 'background', visible: true, fill: bgFill },
          { id: 'image-main', type: 'image', visible: false, binding: 'image', x: 60, y: 55, w: 35, h: 38, fit: 'cover', radius: 2, placeholder: p.imagePh },
          { id: 'badge', type: 'badge', visible: true, binding: 'badge', x: 8, y: 10, w: 24, h: 5, bg: p.badgeBg, color: p.badgeFg, fontSize: 2.6, fontWeight: '700', align: 'center', radius: 1 },
          { id: 'title', type: 'text', visible: true, binding: 'title', x: 6, y: 28, w: 88, h: 36, fontFamily: 'Noto Sans SC', fontSize: 10, fontWeight: '900', color: p.title, align: 'left', valign: 'top', lineHeight: 1.15, sample: '超大标题' },
          { id: 'subtitle', type: 'text', visible: true, binding: 'subtitle', x: 6, y: 72, w: 70, h: 12, fontFamily: 'Noto Sans SC', fontSize: 3.5, fontWeight: '400', color: p.sub, align: 'left', sample: '副标题说明' },
          { id: 'corner', type: 'shape', visible: true, shape: 'rect', x: 0, y: 94, w: 100, h: 6, fill: '#1A1A1A' },
        ],
      };
    }

    if (layout === 'card-stack') {
      return {
        ...commonMeta,
        layers: [
          { id: 'bg', type: 'background', visible: true, fill: bgFill },
          { id: 'card-back', type: 'shape', visible: true, shape: 'rect', x: 14, y: 14, w: 72, h: 72, fill: p.muted, radius: 4 },
          { id: 'card-mid', type: 'shape', visible: true, shape: 'rect', x: 10, y: 12, w: 72, h: 72, fill: p.sub, radius: 4 },
          { id: 'card-front', type: 'shape', visible: true, shape: 'rect', x: 6, y: 10, w: 72, h: 74, fill: '#FFFFFF', radius: 4 },
          { id: 'image-main', type: 'image', visible: true, binding: 'image', x: 10, y: 14, w: 64, h: 32, fit: 'cover', radius: 2.5, placeholder: p.imagePh },
          { id: 'badge', type: 'badge', visible: true, binding: 'badge', x: 10, y: 50, w: 20, h: 4.5, bg: p.badgeBg, color: p.badgeFg, fontSize: 2.2, fontWeight: '600', align: 'center', radius: 1.5 },
          { id: 'title', type: 'text', visible: true, binding: 'title', x: 10, y: 58, w: 64, h: 14, fontFamily: 'Noto Sans SC', fontSize: 5.5, fontWeight: '700', color: p.title, align: 'left', valign: 'top', lineHeight: 1.25, sample: '课程标题' },
          { id: 'subtitle', type: 'text', visible: true, binding: 'subtitle', x: 10, y: 74, w: 64, h: 6, fontFamily: 'Noto Sans SC', fontSize: 2.6, fontWeight: '400', color: p.accent, align: 'left', sample: '副标题' },
        ],
      };
    }

    if (layout === 'center-vitality') {
      return {
        ...commonMeta,
        layers: [
          { id: 'bg', type: 'background', visible: true, fill: bgFill },
          { id: 'deco-circle', type: 'shape', visible: true, shape: 'ellipse', x: 65, y: -10, w: 50, h: 40, fill: 'rgba(255,255,255,0.15)' },
          { id: 'deco-circle2', type: 'shape', visible: true, shape: 'ellipse', x: -15, y: 70, w: 45, h: 40, fill: 'rgba(255,255,255,0.12)' },
          { id: 'image-main', type: 'image', visible: true, binding: 'image', x: 30, y: 12, w: 40, h: 28, fit: 'cover', radius: 50, placeholder: p.imagePh },
          { id: 'badge', type: 'badge', visible: true, binding: 'badge', x: 35, y: 44, w: 30, h: 5, bg: p.badgeBg, color: p.badgeFg, fontSize: 2.4, fontWeight: '700', align: 'center', radius: 2.5 },
          { id: 'title', type: 'text', visible: true, binding: 'title', x: 8, y: 54, w: 84, h: 22, fontFamily: 'Noto Sans SC', fontSize: 7, fontWeight: '800', color: p.title, align: 'center', valign: 'middle', lineHeight: 1.2, sample: '活力标题' },
          { id: 'subtitle', type: 'text', visible: true, binding: 'subtitle', x: 15, y: 80, w: 70, h: 8, fontFamily: 'Noto Sans SC', fontSize: 3, fontWeight: '400', color: p.sub, align: 'center', sample: '副标题' },
        ],
      };
    }

    // default: left-text-right-image
    const isTech = palette === 'tech';
    return {
      ...commonMeta,
      layers: [
        { id: 'bg', type: 'background', visible: true, fill: bgFill },
        ...(isTech
          ? [{ id: 'grid-accent', type: 'shape', visible: true, shape: 'rect', x: 0, y: 0, w: 1.5, h: 100, fill: p.accent }]
          : [{ id: 'accent-bar', type: 'shape', visible: true, shape: 'rect', x: 0, y: 0, w: 100, h: 1.2, fill: p.accent }]),
        { id: 'image-main', type: 'image', visible: true, binding: 'image', x: 52, y: 12, w: 42, h: 76, fit: 'cover', radius: 3, placeholder: p.imagePh },
        {
          id: 'badge',
          type: 'badge',
          visible: true,
          binding: 'badge',
          x: 6, y: 10, w: 28, h: 5.5,
          bg: p.badgeBg,
          color: p.badgeFg,
          fontSize: 2.8,
          fontWeight: '600',
          align: isTech ? 'left' : 'center',
          radius: isTech ? 0 : 2,
          ...(isTech ? { border: { color: p.accent, width: 0.15 } } : {}),
        },
        { id: 'title', type: 'text', visible: true, binding: 'title', x: 6, y: 22, w: 42, h: 28, fontFamily: 'Noto Sans SC', fontSize: 7.2, fontWeight: '700', color: p.title, align: 'left', valign: 'top', lineHeight: 1.25, sample: '封面主标题' },
        { id: 'subtitle', type: 'text', visible: true, binding: 'subtitle', x: 6, y: 54, w: 42, h: 14, fontFamily: 'Noto Sans SC', fontSize: 3.2, fontWeight: '400', color: p.sub, align: 'left', valign: 'top', lineHeight: 1.4, sample: '副标题或卖点' },
        { id: 'footer-line', type: 'shape', visible: true, shape: 'rect', x: 6, y: 78, w: 12, h: 0.6, fill: p.accent },
        { id: 'tagline', type: 'text', visible: true, binding: 'tagline', x: 6, y: 82, w: 42, h: 6, fontFamily: 'Noto Sans SC', fontSize: 2.4, fontWeight: '400', color: p.muted, align: 'left', sample: '补充说明' },
      ],
    };
  }

  /**
   * @param {string} description 中文短描述，如「清爽的健身类封面」
   * @returns {object} 结构化模板
   */
  function generateFromDescription(description) {
    const desc = String(description || '').trim();
    if (!desc) throw new Error('请输入描述');
    const rule = matchRule(desc);
    return buildLayout(rule.layout, rule.palette, rule.style, desc);
  }

  /**
   * 解析说明（给 UI 展示匹配到了什么）
   */
  function explain(description) {
    const rule = matchRule(description);
    return {
      matchedStyle: rule.style,
      palette: rule.palette,
      layout: rule.layout,
      // TODO(vision/LLM): 替换为模型解析结果
      engine: 'rule-based-v1',
    };
  }

  return {
    generateFromDescription,
    explain,
    PALETTES,
    RULES,
  };
})();
