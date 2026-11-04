/**
 * 内置结构化模板库（v1.4 爆款风重绘）
 * 坐标均为相对百分比 (0–100)；字号等为短边百分比
 * 图层类型: background | pattern | image | text | shape | badge
 * 比例适配：layer.at = { portrait(3:4 默认) | tall(9:16) | square(1:1) | wide(16:9) : {覆盖字段} }
 * 设计规范见 README「设计规范」。
 */

window.CoverTemplates = (function () {
  /* —— 小工具：生成普通 JSON 图层（可被 clone / localStorage 保存） —— */
  const F_BLACK = { fontFamily: 'Noto Sans SC', fontWeight: '900' };
  const F_SMILEY = { fontFamily: 'Smiley Sans', fontWeight: '400' };
  const F_KL = { fontFamily: 'ZCOOL KuaiLe', fontWeight: '400' };

  function person(o) {
    return Object.assign({
      id: 'person', type: 'image', binding: 'person', visible: true,
      x: 8, y: 34, w: 84, h: 68, fit: 'contain', align: 'bottom', radius: 0,
      sticker: { width: 1.1, color: '#FFFFFF', shadow: { color: 'rgba(0,0,0,0.9)', dx: 0.9, dy: 0.9 } },
    }, o);
  }
  function title(o) {
    return Object.assign({
      id: 'title', type: 'text', visible: true, binding: 'title',
      x: 5, y: 7, w: 90, h: 16, ...F_BLACK, fontSize: 14, fit: 'width', maxFontSize: 17,
      color: '#FFFFFF', align: 'center', valign: 'middle', lineHeight: 1.12,
      stroke: { color: '#111111', ratio: 0.16 },
      strokeOuter: { color: '#FFFFFF', ratio: 0.34 },
      hardShadow: { color: '#111111' },
      autoHighlight: 'digits',
    }, o);
  }
  function sub(o) {
    return Object.assign({
      id: 'subtitle', type: 'text', visible: true, binding: 'subtitle',
      x: 8, y: 24, w: 84, h: 7, ...F_BLACK, fontSize: 5, fit: 'width', maxFontSize: 5.6,
      color: '#111111', align: 'center', valign: 'middle', lineHeight: 1.15,
    }, o);
  }
  const W = (o) => ({ wide: o.wide, square: o.square, tall: o.tall });

  /** @typedef {{ id: string, name: string, style: string, layers: object[] }} Template */
  const BUILTIN = [
    /* 1 清爽健身：薄荷绿 + 深绿 + 柠檬黄 */
    {
      id: 'fresh-fitness', name: '清爽健身', style: '清爽健身',
      description: '薄荷渐变 + 网点 + 黄色大圆托人物，深绿贴纸大字，适合健身/自律/打卡',
      layers: [
        { id: 'bg', type: 'background', visible: true,
          fill: { type: 'linear', angle: 90, stops: [{ offset: 0, color: '#E7FFF3' }, { offset: 1, color: '#86EFAC' }] },
          pattern: { type: 'halftone', dir: 'up', color: 'rgba(6,95,70,0.16)', size: 1.6, gap: 2.6 } },
        { id: 'blob', type: 'shape', visible: true, shape: 'blob', x: 4, y: 36, w: 92, h: 62, fill: '#FDE047', points: 8,
          at: { wide: { x: 50, y: 10, w: 48, h: 86 }, square: { x: 44, y: 30, w: 56, h: 68 }, tall: { y: 34, h: 50 } } },
        { id: 'wave', type: 'shape', visible: true, shape: 'wave', x: 0, y: 86, w: 100, h: 16, fill: '#10B981', waves: 3, amp: 2 },
        person({ x: 6, y: 33, w: 88, h: 69, at: { wide: { x: 50, y: 6, w: 50, h: 96 }, square: { x: 42, y: 26, w: 60, h: 76 }, tall: { y: 34, h: 68 } } }),
        title({ y: 5, h: 17, color: '#065F46', stroke: { color: '#FFFFFF', ratio: 0.22 }, strokeOuter: { color: '#065F46', ratio: 0.36 }, hardShadow: { color: '#064E3B' }, highlight: { color: '#FACC15' },
          at: { wide: { x: 5, y: 16, w: 48, h: 30, maxFontSize: 20 }, square: { y: 4, h: 15 }, tall: { y: 13, h: 10 } }, sample: '早起锻炼' }),
        sub({ y: 23.5, h: 6.5, color: '#FFFFFF', banner: { fill: '#065F46', paddingX: 2.4, paddingY: 1.2, radius: 1.6, shadow: { color: '#FACC15', dx: 0.7, dy: 0.7 } },
          at: { wide: { x: 6, y: 52, w: 44, h: 9, align: 'left' }, square: { x: 6, y: 21, w: 50, h: 6.5, align: 'left' }, tall: { y: 24.5, h: 4.5 } }, sample: '记录我的晨间小习惯' }),
        { id: 'badge', type: 'badge', visible: true, binding: 'badge', shape: 'burst', points: 14, inner: 0.82, square: true,
          x: 74, y: 30, w: 22, h: 16, bg: '#EF4444', color: '#FFFFFF', ...F_BLACK, fontSize: 8.8, rotate: 12, hardShadow: { color: '#064E3B', dx: 0.5, dy: 0.5 },
          at: { wide: { x: 40, y: 64, w: 13, h: 22 }, square: { x: 6, y: 34, w: 18, h: 18 }, tall: { x: 74, y: 30, w: 22, h: 12 } }, sample: '打卡' },
        { id: 'spark1', type: 'shape', visible: true, shape: 'sparkle', square: true, x: 6, y: 34, w: 8, h: 8, fill: '#FFFFFF', hardShadow: { color: '#065F46', dx: 0.4, dy: 0.4 },
          at: { wide: { x: 5, y: 70, w: 6, h: 10 }, square: { x: 28, y: 46, w: 8, h: 8 } } },
        { id: 'spark2', type: 'shape', visible: true, shape: 'sparkle', square: true, x: 14, y: 44, w: 4.5, h: 4.5, fill: '#065F46',
          at: { wide: { x: 12, y: 80, w: 3.5, h: 6 }, square: { x: 34, y: 56, w: 4.5, h: 4.5 } } },
        { id: 'tagline', type: 'text', visible: true, binding: 'tagline', x: 5, y: 92, w: 90, h: 5, ...F_BLACK, fontSize: 4.4, color: '#FFFFFF', align: 'center', valign: 'middle',
          stroke: { color: '#065F46', ratio: 0.25 }, at: { wide: { x: 5, y: 90, w: 45, align: 'left' }, tall: { y: 74 } }, sample: '坚持就会看见变化' },
      ],
    },

    /* 2 简约杂志：奶油底 + 黑 + 正红，人物头部压在刊头大字上 */
    {
      id: 'magazine-simple', name: '简约杂志', style: '简约杂志',
      description: '杂志刊头大字被人物头部压住（人物在标题之前），红色副标题条，适合穿搭/vlog/生活方式',
      layers: [
        { id: 'bg', type: 'background', visible: true,
          fill: { type: 'radial', cx: 50, cy: 40, r: 70, stops: [{ offset: 0, color: '#FFF8EC' }, { offset: 1, color: '#EADFCB' }] },
          pattern: { type: 'noise', color: 'rgba(80,50,20,0.10)', size: 0.25, gap: 0.5 } },
        { id: 'circle', type: 'shape', visible: true, shape: 'ellipse', square: true, x: 12, y: 22, w: 76, h: 57, fill: '#E11D2E',
          at: { wide: { x: 52, y: 12, w: 44, h: 76 }, square: { x: 40, y: 24, w: 56, h: 66 }, tall: { y: 26, h: 44 } } },
        { id: 'issue', type: 'text', visible: true, binding: 'static', x: 5, y: 3, w: 90, h: 3, fontFamily: 'Noto Sans SC', fontWeight: '700', fontSize: 2.2, color: '#111', align: 'center', valign: 'middle',
          letterSpacing: 0.4, sample: 'ISSUE 2026 · VOL.07 · 本期封面',
          at: { wide: { x: 5, w: 50, align: 'left' }, tall: { y: 10 } } },
        title({ y: 6, h: 19, color: '#111111', stroke: null, strokeOuter: null, hardShadow: { color: '#E11D2E', dx: 0.9, dy: 0.9 }, highlight: { color: '#E11D2E' }, letterSpacing: -0.02,
          at: { wide: { x: 5, y: 10, w: 48, h: 30, align: 'left' }, square: { y: 6, h: 18 }, tall: { y: 13, h: 12 } }, sample: '一个人拍vlog' }),
        person({ x: 2, y: 15.5, w: 96, h: 87, sticker: { width: 0.9, color: '#FFFFFF', shadow: { color: 'rgba(17,17,17,0.95)', dx: 1, dy: 1 } },
          at: { wide: { x: 46, y: 4, w: 56, h: 98 }, square: { x: 34, y: 18, w: 70, h: 84 }, tall: { y: 20, h: 82 } } }),
        sub({ x: 5, y: 82, w: 58, h: 6.5, color: '#FFFFFF', align: 'left', fontWeight: '900', fit: 'width', maxFontSize: 4.6,
          banner: { fill: '#E11D2E', paddingX: 2, paddingY: 1.1, radius: 0, shadow: { color: '#111', dx: 0.6, dy: 0.6 } },
          at: { wide: { x: 6, y: 50, w: 40, h: 8 }, square: { x: 5, y: 80, w: 40, h: 7 }, tall: { y: 69, h: 4.5 } }, sample: '手机就够了，别再买设备' }),
        { id: 'badge', type: 'badge', visible: true, binding: 'badge', shape: 'rect', x: 5, y: 72, w: 20, h: 6, radius: 0, bg: '#111111', color: '#FFFFFF', ...F_BLACK, fontSize: 5.8,
          at: { wide: { x: 6, y: 40, w: 12, h: 7 }, square: { x: 5, y: 70, w: 18, h: 7 }, tall: { y: 63, h: 4 } }, sample: 'Vlog' },
        { id: 'tagline', type: 'text', visible: true, binding: 'tagline', x: 5, y: 90, w: 50, h: 5, ...F_BLACK, fontWeight: '700', fontSize: 4.4, color: '#111', align: 'left', valign: 'middle',
          at: { wide: { x: 6, y: 62, w: 40 }, tall: { y: 74 } }, sample: '新手也能拍出质感' },
        { id: 'star', type: 'shape', visible: true, shape: 'star', square: true, x: 80, y: 24, w: 12, h: 9, fill: '#FACC15', border: { color: '#111', width: 0.4 }, rotate: 12,
          at: { wide: { x: 88, y: 8, w: 7, h: 12 }, square: { x: 86, y: 22, w: 10, h: 10 }, tall: { y: 25, h: 6 } } },
      ],
    },

    /* 3 高对比标题：正红放射线 + 黄字黑描边 */
    {
      id: 'high-contrast', name: '高对比标题', style: '高对比标题',
      description: '红色放射线背景 + 超大黄字黑描边硬阴影压在人物身前，冲击力最强',
      layers: [
        { id: 'bg', type: 'background', visible: true,
          fill: { type: 'radial', cx: 50, cy: 45, r: 70, stops: [{ offset: 0, color: '#FF4D3D' }, { offset: 1, color: '#B5120A' }] },
          pattern: { type: 'rays', cx: 50, cy: 42, count: 28, color: 'rgba(255,220,120,0.16)' } },
        person({ x: 4, y: 12, w: 92, h: 90, at: { wide: { x: 48, y: 4, w: 54, h: 98 }, square: { x: 36, y: 14, w: 68, h: 88 }, tall: { y: 18, h: 84 } } }),
        { id: 'band', type: 'shape', visible: true, shape: 'rect', x: -5, y: 62, w: 110, h: 17, fill: '#111111', rotate: -4,
          at: { wide: { x: -5, y: 56, w: 62, h: 20 }, square: { y: 60, h: 18 }, tall: { y: 55, h: 12 } } },
        title({ y: 61, h: 19, color: '#FFE600', rotate: -4, highlight: { color: '#FFFFFF' },
          at: { wide: { x: 4, y: 20, w: 50, h: 28, rotate: -3 }, square: { y: 59, h: 20 }, tall: { y: 54, h: 13 } }, sample: '剪辑*快捷键*' }),
        sub({ y: 82, h: 7, color: '#111111', banner: { fill: '#FFE600', paddingX: 2.4, paddingY: 1.1, radius: 1.2, shadow: { color: '#111', dx: 0.7, dy: 0.7 } }, rotate: -2,
          at: { wide: { x: 6, y: 62, w: 44, h: 9 }, square: { y: 82, h: 7 }, tall: { y: 69, h: 4.5 } }, sample: '这5个快捷键必须会' }),
        { id: 'badge', type: 'badge', visible: true, binding: 'badge', shape: 'burst', points: 18, inner: 0.84, square: true, x: 70, y: 5, w: 26, h: 19,
          bg: '#FFE600', color: '#E11D2E', ...F_BLACK, fontSize: 9.4, rotate: 10, border: { color: '#111', width: 0.5 }, hardShadow: { color: '#111', dx: 0.6, dy: 0.6 },
          at: { wide: { x: 4, y: 4, w: 14, h: 22, rotate: -8 }, square: { x: 4, y: 5, w: 22, h: 22 }, tall: { y: 12, h: 13 } }, sample: '必看' },
        { id: 'arrow', type: 'shape', visible: true, shape: 'arrow', x: 10, y: 40, w: 14, h: 18, fill: '#FFE600', lineWidth: 1.4, bend: 0.4, hardShadow: { color: '#111', dx: 0.5, dy: 0.5 },
          at: { wide: { x: 34, y: 48, w: 12, h: 8, bend: -0.4 }, square: { x: 8, y: 32, w: 18, h: 22 }, tall: { y: 34, h: 16 } } },
        { id: 'tagline', type: 'text', visible: false, binding: 'tagline', x: 5, y: 92, w: 90, h: 4, ...F_BLACK, fontSize: 4.4, color: '#fff', align: 'center', sample: '' },
      ],
    },

    /* 4 卡片叠层：靛蓝方格 + 白卡片硬阴影 + 黄色高亮 */
    {
      id: 'card-stack', name: '卡片叠层', style: '卡片叠层',
      description: '靛蓝方格底，人物站在叠层白卡片后面，卡片上大标题+黄色高亮，适合教程/课程/知识',
      layers: [
        { id: 'bg', type: 'background', visible: true,
          fill: { type: 'linear', angle: 90, stops: [{ offset: 0, color: '#6366F1' }, { offset: 1, color: '#3730A3' }] },
          pattern: { type: 'grid', color: 'rgba(255,255,255,0.13)', size: 0.5, gap: 6 } },
        { id: 'ring', type: 'shape', visible: true, shape: 'ellipse', square: true, x: 18, y: 6, w: 64, h: 48, fill: '#FACC15',
          at: { wide: { x: 56, y: 6, w: 40, h: 72 }, square: { x: 46, y: 4, w: 50, h: 52 }, tall: { y: 12, h: 38 } } },
        person({ x: 8, y: 6, w: 84, h: 60, at: { wide: { x: 48, y: 4, w: 56, h: 82 }, square: { x: 40, y: 4, w: 62, h: 62 }, tall: { y: 12, h: 50 } } }),
        { id: 'card-back', type: 'shape', visible: true, shape: 'rect', x: 7, y: 60, w: 86, h: 32, radius: 3, fill: '#FACC15', rotate: 3, border: { color: '#111', width: 0.5 },
          at: { wide: { x: 4, y: 22, w: 52, h: 60 }, square: { x: 5, y: 56, w: 90, h: 38 }, tall: { y: 56, h: 24 } } },
        { id: 'card-front', type: 'shape', visible: true, shape: 'rect', x: 6, y: 59, w: 86, h: 32, radius: 3, fill: '#FFFFFF', rotate: -1.5, border: { color: '#111', width: 0.5 }, hardShadow: { color: '#111', dx: 1, dy: 1 },
          at: { wide: { x: 3, y: 20, w: 52, h: 60 }, square: { x: 4, y: 55, w: 90, h: 38 }, tall: { y: 55, h: 24 } } },
        { id: 'tape', type: 'shape', visible: true, shape: 'tape', x: 38, y: 56.5, w: 22, h: 4.5, fill: 'rgba(244,114,182,0.85)', rotate: -6,
          at: { wide: { x: 22, y: 16, w: 14, h: 8 }, square: { x: 40, y: 52, w: 20, h: 5.5 }, tall: { y: 53.5, h: 3.2 } } },
        { id: 'badge', type: 'badge', visible: true, binding: 'badge', shape: 'rect', x: 11, y: 63, w: 26, h: 5.5, radius: 3, bg: '#4F46E5', color: '#FFFFFF', ...F_BLACK, fontSize: 5.4,
          at: { wide: { x: 7, y: 26, w: 16, h: 8 }, square: { x: 9, y: 60, w: 24, h: 6.5 }, tall: { y: 58.5, h: 3.6 } }, sample: '新手教程' },
        title({ x: 10, y: 69, w: 80, h: 13, color: '#1E1B4B', stroke: null, strokeOuter: null, hardShadow: null, highlight: { color: '#1E1B4B', block: { fill: '#FDE047' } }, rotate: -1.5, fontSize: 12,
          at: { wide: { x: 7, y: 36, w: 44, h: 22, maxFontSize: 18 }, square: { x: 9, y: 67, w: 80, h: 14 }, tall: { y: 63, h: 9 } }, sample: '新手做*视频*' }),
        sub({ x: 10, y: 82, w: 80, h: 6, color: '#4F46E5', align: 'center', fontWeight: '700', maxFontSize: 4.4, rotate: -1.5,
          at: { wide: { x: 7, y: 60, w: 44, h: 8 }, square: { x: 9, y: 82, w: 80, h: 6.5 }, tall: { y: 72.5, h: 4 } }, sample: '从选题到发布全流程' }),
        { id: 'spark', type: 'shape', visible: true, shape: 'sparkle', square: true, x: 82, y: 8, w: 10, h: 8, fill: '#FFFFFF', at: { wide: { x: 92, y: 6, w: 5, h: 9 }, tall: { y: 13, h: 6 } } },
        { id: 'spark2', type: 'shape', visible: true, shape: 'sparkle', square: true, x: 8, y: 30, w: 6, h: 5, fill: '#FACC15', at: { wide: { x: 46, y: 80, w: 4, h: 7 }, tall: { y: 30, h: 4 } } },
      ],
    },

    /* 5 渐变活力：橙粉渐变 + 斜纹 + 对话气泡 */
    {
      id: 'gradient-vitality', name: '渐变活力', style: '渐变活力',
      description: '橙→粉渐变斜纹，可爱体大字，对话气泡副标题，爱心闪光点缀，适合旅行/种草/生活',
      layers: [
        { id: 'bg', type: 'background', visible: true,
          fill: { type: 'linear', angle: 120, stops: [{ offset: 0, color: '#FF8A3D' }, { offset: 1, color: '#FF4F8B' }] },
          pattern: { type: 'stripes', angle: -35, color: 'rgba(255,255,255,0.10)', size: 2.2, gap: 6 } },
        { id: 'c1', type: 'shape', visible: true, shape: 'ellipse', square: true, x: 8, y: 32, w: 84, h: 63, fill: 'rgba(255,255,255,0.22)',
          at: { wide: { x: 52, y: 6, w: 46, h: 90 }, square: { x: 40, y: 22, w: 60, h: 74 }, tall: { y: 34, h: 47 } } },
        { id: 'c2', type: 'shape', visible: true, shape: 'ellipse', square: true, x: 18, y: 40, w: 64, h: 48, fill: '#FFE14D',
          at: { wide: { x: 58, y: 18, w: 34, h: 66 }, square: { x: 48, y: 32, w: 46, h: 56 }, tall: { y: 40, h: 36 } } },
        person({ x: 6, y: 32, w: 88, h: 70, at: { wide: { x: 50, y: 6, w: 50, h: 96 }, square: { x: 40, y: 24, w: 62, h: 78 }, tall: { y: 34, h: 68 } } }),
        title({ y: 5, h: 17, ...F_KL, color: '#FFFFFF', stroke: { color: '#E11D74', ratio: 0.16 }, strokeOuter: { color: '#FFFFFF', ratio: 0.32 }, hardShadow: { color: '#7A1240' }, highlight: { color: '#FFE14D' },
          at: { wide: { x: 4, y: 14, w: 48, h: 30 }, square: { y: 4, h: 16 }, tall: { y: 13, h: 10 } }, sample: '跑步护膝怎么选' }),
        { id: 'bubble', type: 'shape', visible: true, shape: 'bubble', x: 10, y: 22.5, w: 80, h: 8.5, radius: 4, fill: '#FFFFFF', border: { color: '#7A1240', width: 0.5 }, hardShadow: { color: '#7A1240', dx: 0.6, dy: 0.6 }, tail: { side: 'bottom', pos: 0.7, size: 3 },
          at: { wide: { x: 5, y: 50, w: 44, h: 12, tail: { side: 'right', pos: 0.5, size: 3 } }, square: { x: 5, y: 21, w: 52, h: 9, tail: { side: 'right', pos: 0.6, size: 3 } }, tall: { y: 24, h: 6 } } },
        sub({ x: 13, y: 23.3, w: 74, h: 6.9, color: '#E11D74', maxFontSize: 5,
          at: { wide: { x: 7, y: 51, w: 40, h: 10 }, square: { x: 7, y: 21.8, w: 48, h: 7.4 }, tall: { y: 24.5, h: 5 } }, sample: '踩坑3年总结的干货' }),
        { id: 'badge', type: 'badge', visible: true, binding: 'badge', shape: 'ellipse', square: true, x: 76, y: 33, w: 20, h: 15, bg: '#FFFFFF', color: '#E11D74', ...F_BLACK, fontSize: 5.8, rotate: 10, border: { color: '#7A1240', width: 0.5 }, hardShadow: { color: '#7A1240', dx: 0.5, dy: 0.5 },
          at: { wide: { x: 38, y: 70, w: 12, h: 21 }, square: { x: 6, y: 36, w: 20, h: 20 }, tall: { y: 33, h: 11 } }, sample: '干货' },
        { id: 'tagline', type: 'text', visible: true, binding: 'tagline', x: 5, y: 91, w: 90, h: 5.5, ...F_BLACK, fontSize: 4.4, color: '#FFFFFF', align: 'center', valign: 'middle',
          stroke: { color: '#E11D74', ratio: 0.28 }, hardShadow: { color: '#7A1240', dx: 0.3, dy: 0.3 },
          at: { wide: { x: 5, y: 88, w: 44, align: 'left' }, square: { x: 5, y: 90, w: 40, align: 'left' }, tall: { y: 74 } }, sample: '附路线和交通攻略' },
        { id: 'heart', type: 'shape', visible: true, shape: 'heart', square: true, x: 6, y: 38, w: 10, h: 8, fill: '#FFFFFF', rotate: -12, hardShadow: { color: '#7A1240', dx: 0.4, dy: 0.4 },
          at: { wide: { x: 6, y: 74, w: 6, h: 10 }, square: { x: 28, y: 60, w: 9, h: 9 }, tall: { y: 40, h: 6 } } },
        { id: 'spark', type: 'shape', visible: true, shape: 'sparkle', square: true, x: 84, y: 54, w: 8, h: 6, fill: '#FFFFFF', at: { wide: { x: 92, y: 8, w: 5, h: 9 }, square: { x: 88, y: 26, w: 8, h: 8 }, tall: { y: 50, h: 4 } } },
      ],
    },

    /* 6 暗色科技：深蓝黑 + 青色霓虹 + 品红错位阴影 */
    {
      id: 'dark-tech', name: '暗色科技', style: '暗色科技',
      description: '深色网格 + 青色霓虹描边人物 + 品红错位硬阴影大字，适合 AI/数码/效率工具',
      layers: [
        { id: 'bg', type: 'background', visible: true,
          fill: { type: 'radial', cx: 50, cy: 60, r: 75, stops: [{ offset: 0, color: '#1E2A5A' }, { offset: 1, color: '#05070F' }] },
          pattern: { type: 'grid', color: 'rgba(34,211,238,0.12)', size: 0.4, gap: 5 } },
        { id: 'glow', type: 'shape', visible: true, shape: 'ellipse', square: true, x: 12, y: 36, w: 76, h: 57,
          fill: { type: 'radial', cx: 50, cy: 50, r: 50, stops: [{ offset: 0, color: 'rgba(34,211,238,0.55)' }, { offset: 1, color: 'rgba(34,211,238,0)' }] },
          at: { wide: { x: 52, y: 8, w: 46, h: 88 }, square: { x: 42, y: 26, w: 56, h: 70 }, tall: { y: 38, h: 42 } } },
        { id: 'ring', type: 'shape', visible: true, shape: 'ring', square: true, x: 14, y: 38, w: 72, h: 54, fill: '#22D3EE', lineWidth: 0.7,
          at: { wide: { x: 54, y: 10, w: 42, h: 80 }, square: { x: 44, y: 28, w: 52, h: 64 }, tall: { y: 40, h: 40 } } },
        person({ x: 6, y: 32, w: 88, h: 70, sticker: { width: 0.8, color: '#22D3EE', shadow: { color: 'rgba(240,46,170,0.9)', dx: 1.0, dy: 1.0 } },
          at: { wide: { x: 50, y: 6, w: 50, h: 96 }, square: { x: 40, y: 24, w: 62, h: 78 }, tall: { y: 34, h: 68 } } }),
        { id: 'badge', type: 'badge', visible: true, binding: 'badge', shape: 'rect', x: 32, y: 5, w: 36, h: 5, radius: 0.5, bg: 'rgba(34,211,238,0.12)', color: '#22D3EE', ...F_BLACK, fontWeight: '700', fontSize: 5.1, border: { color: '#22D3EE', width: 0.3 },
          at: { wide: { x: 5, y: 10, w: 18, h: 7 }, square: { x: 5, y: 5, w: 26, h: 6 }, tall: { y: 12, h: 3.2 } }, sample: 'AI工具' },
        title({ y: 11, h: 15, color: '#FFFFFF', stroke: { color: '#05070F', ratio: 0.14 }, strokeOuter: null, hardShadow: { color: '#F02EAA', dx: 0.9, dy: 0.9 }, highlight: { color: '#22D3EE' },
          at: { wide: { x: 5, y: 20, w: 48, h: 28, align: 'left' }, square: { y: 12, h: 13 }, tall: { y: 16, h: 9 } }, sample: 'AI剪辑*真香*' }),
        sub({ y: 26, h: 6, color: '#05070F', fontWeight: '900', banner: { fill: '#22D3EE', paddingX: 2, paddingY: 1, radius: 0.6, shadow: { color: '#F02EAA', dx: 0.6, dy: 0.6 } },
          at: { wide: { x: 6, y: 52, w: 40, h: 8, align: 'left' }, square: { x: 6, y: 26, w: 46, h: 6, align: 'left' }, tall: { y: 26, h: 4 } }, sample: '一键出片省下半天' }),
        { id: 'tagline', type: 'text', visible: true, binding: 'tagline', x: 5, y: 92, w: 90, h: 4, ...F_BLACK, fontWeight: '700', fontSize: 4.4, color: '#94A3B8', align: 'center', valign: 'middle', letterSpacing: 0.3,
          at: { wide: { x: 6, y: 86, w: 40, align: 'left' }, tall: { y: 74 } }, sample: 'TECH · FUTURE' },
        { id: 'spark', type: 'shape', visible: true, shape: 'sparkle', square: true, x: 84, y: 34, w: 8, h: 6, fill: '#22D3EE', at: { wide: { x: 46, y: 70, w: 5, h: 9 }, square: { x: 88, y: 24, w: 7, h: 7 }, tall: { y: 34, h: 4 } } },
      ],
    },

    /* 7 POV贴纸问答：参考 refs/pov-sticker-qa.png */
    {
      id: 'pov-sticker-qa', name: 'POV贴纸问答', style: 'POV贴纸问答',
      description: '实景底图（可选）+ 黄字黑描边白外描边标题 + 白底问句条黄笔触下划线 + 白边人物贴纸 · 适合 3:4',
      preferredRatio: '3:4',
      defaultScene: 'cafe', sceneDefaults: { blur: 3, bright: 0, tint: 8 }, sceneTint: '#2B3346',
      bindings: ['title', 'subtitle', 'bgImage', 'stickerImage', 'person'],
      layers: [
        { id: 'bg', type: 'background', visible: true,
          fill: { type: 'linear', angle: 90, stops: [{ offset: 0, color: '#5B6B8C' }, { offset: 1, color: '#2B3346' }] },
          pattern: { type: 'halftone', dir: 'down', color: 'rgba(255,255,255,0.10)', size: 1.4, gap: 2.4 } },
        { id: 'bg-image', type: 'image', visible: true, binding: 'bgImage', x: 0, y: 0, w: 100, h: 100, fit: 'cover', radius: 0, placeholder: '#4A5568', placeholderLabel: '背景图（可选）', filter: 'blur(3px) brightness(0.9)' },
        { id: 'blob', type: 'shape', visible: true, shape: 'blob', x: 0, y: 44, w: 70, h: 56, fill: 'rgba(255,229,102,0.9)', points: 7,
          at: { wide: { x: 52, y: 20, w: 44, h: 80 }, square: { x: 0, y: 40, w: 60, h: 60 }, tall: { y: 44, h: 40 } } },
        person({ x: 0, y: 40, w: 72, h: 62, halign: 'left', sticker: { width: 1.3, color: '#FFFFFF', shadow: { color: 'rgba(0,0,0,0.45)', dx: 0.5, dy: 0.8, blur: 0.6 } },
          at: { wide: { x: 52, y: 14, w: 48, h: 88, halign: 'center' }, square: { x: 0, y: 36, w: 64, h: 66 }, tall: { y: 44, h: 58 } } }),
        { id: 'sticker-image', type: 'image', visible: true, binding: 'stickerImage', x: 62, y: 62, w: 34, h: 30, fit: 'contain', radius: 0, _hidePlaceholder: true,
          sticker: { width: 1.2, color: '#FFFFFF' } },
        title({ y: 14, h: 13, color: '#FFE566', stroke: { color: '#111111', ratio: 0.16 }, strokeOuter: { color: '#FFFFFF', ratio: 0.36 }, hardShadow: { color: 'rgba(0,0,0,0.55)' }, highlight: { color: '#FFFFFF' },
          at: { wide: { x: 5, y: 18, w: 50, h: 24 }, square: { y: 10, h: 13 }, tall: { y: 16, h: 8 } }, sample: '准备去香港买iPhone' }),
        sub({ y: 30, h: 7.5, color: '#111111', maxFontSize: 6,
          banner: { fill: '#FFFFFF', paddingX: 3, paddingY: 1.4, radius: 2.4, shadow: { color: 'rgba(0,0,0,0.35)', dx: 0.4, dy: 0.6 } },
          underline: { color: '#F5C518', height: 1.4, offsetY: 0.4, widthRatio: 0.92, brush: true },
          at: { wide: { x: 6, y: 48, w: 44, h: 10 }, square: { y: 26, h: 8 }, tall: { y: 26, h: 5 } }, sample: '该注意什么？' }),
        { id: 'arrow', type: 'shape', visible: true, shape: 'arrow', x: 62, y: 42, w: 20, h: 18, fill: '#FFFFFF', lineWidth: 1.1, bend: -0.4, flip: true, hardShadow: { color: 'rgba(0,0,0,0.5)', dx: 0.3, dy: 0.3 },
          at: { wide: { x: 36, y: 64, w: 14, h: 14, flip: false, bend: 0.4 }, square: { x: 62, y: 40, w: 18, h: 20 }, tall: { y: 36, h: 10 } } },
      ],
    },

    /* 8 人像双行钩子：参考 refs/portrait-dual-hook.png */
    {
      id: 'portrait-dual-hook', name: '人像双行钩子', style: '人像双行钩子',
      description: '大人像 + 胸前双行钩子文案（白/黄，黑描边硬阴影），暖色景深底 · 适合 9:16，亦可 3:4',
      preferredRatio: '9:16',
      defaultScene: 'living', sceneDefaults: { blur: 8, bright: 0, tint: 22 }, sceneTint: '#B9824F',
      bindings: ['title', 'subtitle', 'bgImage', 'person'],
      layers: [
        { id: 'bg', type: 'background', visible: true,
          fill: { type: 'radial', cx: 50, cy: 30, r: 80, stops: [{ offset: 0, color: '#F7D9A8' }, { offset: 0.6, color: '#B9824F' }, { offset: 1, color: '#4A2E1C' }] },
          pattern: { type: 'halftone', dir: 'radial', cx: 50, cy: 30, color: 'rgba(255,240,210,0.22)', size: 2.4, gap: 3.6 } },
        { id: 'bg-image', type: 'image', visible: true, binding: 'bgImage', x: 0, y: 0, w: 100, h: 100, fit: 'cover', radius: 0, placeholder: '#374151', placeholderLabel: '人像背景', _hidePlaceholder: true },
        { id: 'glow1', type: 'shape', visible: true, shape: 'ellipse', x: -20, y: -12, w: 80, h: 40,
          fill: { type: 'radial', cx: 50, cy: 50, r: 50, stops: [{ offset: 0, color: 'rgba(255,244,214,0.75)' }, { offset: 1, color: 'rgba(255,244,214,0)' }] } },
        { id: 'glow2', type: 'shape', visible: true, shape: 'ellipse', x: 50, y: 2, w: 60, h: 30,
          fill: { type: 'radial', cx: 50, cy: 50, r: 50, stops: [{ offset: 0, color: 'rgba(255,214,150,0.55)' }, { offset: 1, color: 'rgba(255,214,150,0)' }] } },
        { id: 'spark-a', type: 'shape', visible: true, shape: 'sparkle', square: true, x: 78, y: 8, w: 9, h: 6, fill: '#FFF6D8', at: { tall: { y: 10, h: 4 }, wide: { x: 90, y: 8, w: 5, h: 9 } } },
        { id: 'spark-b', type: 'shape', visible: true, shape: 'sparkle', square: true, x: 86, y: 18, w: 5, h: 3.5, fill: '#FFFFFF', at: { tall: { y: 16, h: 2.5 }, wide: { x: 95, y: 22, w: 3, h: 5 } } },
        person({ x: -4, y: 6, w: 108, h: 98, scale: 1.12, sticker: { width: 0.7, color: '#FFFFFF', shadow: { color: 'rgba(40,20,10,0.55)', dx: 0, dy: 0, blur: 1.6 } },
          at: { wide: { x: 44, y: 4, w: 60, h: 100 }, square: { x: 30, y: 6, w: 74, h: 98 }, tall: { y: 14, h: 90, scale: 1.18 } } }),
        { id: 'vignette', type: 'shape', visible: true, shape: 'rect', x: 0, y: 55, w: 100, h: 45,
          fill: { type: 'linear', angle: 90, stops: [{ offset: 0, color: 'rgba(0,0,0,0)' }, { offset: 1, color: 'rgba(0,0,0,0.55)' }] } },
        title({ y: 63, h: 9.5, color: '#FFFFFF', stroke: { color: '#0A0A0A', ratio: 0.16 }, strokeOuter: null, hardShadow: { color: '#0A0A0A' }, ...F_SMILEY, maxFontSize: 13, fill: 0.9, autoHighlight: null,
          at: { wide: { x: 5, y: 34, w: 44, h: 14 }, square: { y: 62, h: 10 }, tall: { y: 58, h: 7.5 } }, sample: '办港卡之前' }),
        sub({ y: 73, h: 10.5, color: '#FFD21F', stroke: { color: '#0A0A0A', ratio: 0.16 }, hardShadow: { color: '#0A0A0A' }, ...F_SMILEY, maxFontSize: 14, fill: 1,
          at: { wide: { x: 5, y: 50, w: 46, h: 16 }, square: { y: 73, h: 11 }, tall: { y: 66, h: 8 } }, sample: '先看这5个细节' }),
        { id: 'badge', type: 'badge', visible: true, binding: 'badge', shape: 'rect', x: 5, y: 5, w: 20, h: 5, radius: 2.5, bg: '#FFD21F', color: '#111', ...F_BLACK, fontSize: 5.4, hardShadow: { color: '#111', dx: 0.4, dy: 0.4 },
          at: { wide: { x: 5, y: 22, w: 12, h: 8 }, tall: { y: 12, h: 3 } }, sample: '干货' },
      ],
    },

    /* 9 大字报：红黄黑，人物头部压标题 */
    {
      id: 'big-poster', name: '大字报·人物压标题', style: '大字报',
      description: '黄底黑斜纹，超大红黑标题在人物身后、头部压住标题下沿，红色副标题条，爆炸角标',
      layers: [
        { id: 'bg', type: 'background', visible: true, fill: { type: 'linear', angle: 90, stops: [{ offset: 0, color: '#FFE14D' }, { offset: 1, color: '#FFC300' }] },
          pattern: { type: 'halftone', dir: 'down', color: 'rgba(0,0,0,0.10)', size: 1.8, gap: 2.6 } },
        { id: 'stripe', type: 'shape', visible: true, shape: 'rect', x: -10, y: 50, w: 120, h: 14, fill: '#111111', rotate: -8,
          pattern: { type: 'stripes', angle: 45, color: 'rgba(255,225,77,0.85)', size: 2, gap: 5 },
          at: { wide: { x: -10, y: 60, w: 120, h: 18 }, tall: { y: 52, h: 9 } } },
        title({ y: 6, h: 22, color: '#E11D2E', stroke: { color: '#111', ratio: 0.12 }, strokeOuter: { color: '#FFFFFF', ratio: 0.3 }, hardShadow: { color: '#111' }, highlight: { color: '#111111' }, lineHeight: 1.0, maxFontSize: 24,
          at: { wide: { x: 4, y: 8, w: 54, h: 36, align: 'left' }, square: { y: 5, h: 22 }, tall: { y: 13, h: 14 } }, sample: '记账*第100天*' }),
        person({ x: 8, y: 26, w: 84, h: 76, at: { wide: { x: 50, y: 4, w: 52, h: 98 }, square: { x: 40, y: 24, w: 62, h: 78 }, tall: { y: 24, h: 78 } } }),
        sub({ y: 82, h: 7, color: '#FFFFFF', banner: { fill: '#E11D2E', paddingX: 2.4, paddingY: 1.1, radius: 0.6, shadow: { color: '#111', dx: 0.8, dy: 0.8 } }, rotate: -3, maxFontSize: 5.4,
          at: { wide: { x: 5, y: 50, w: 44, h: 9, align: 'left', rotate: -2 }, square: { x: 5, y: 82, w: 56, h: 8, align: 'left' }, tall: { y: 72, h: 4.6 } }, sample: '我的4个记账笨办法' }),
        { id: 'badge', type: 'badge', visible: true, binding: 'badge', shape: 'burst', points: 12, inner: 0.72, square: true, x: 1, y: 33, w: 21, h: 16,
          bg: '#111111', color: '#FFE14D', ...F_BLACK, fontSize: 9.4, rotate: -12, border: { color: '#FFFFFF', width: 0.5 },
          at: { wide: { x: 36, y: 66, w: 14, h: 24 }, square: { x: 4, y: 34, w: 22, h: 22 }, tall: { y: 30, h: 13 } }, sample: '真实' },
        { id: 'spark', type: 'shape', visible: true, shape: 'sparkle', square: true, x: 82, y: 32, w: 10, h: 8, fill: '#FFFFFF', hardShadow: { color: '#111', dx: 0.4, dy: 0.4 },
          at: { wide: { x: 92, y: 6, w: 5, h: 9 }, square: { x: 88, y: 28, w: 8, h: 8 }, tall: { y: 30, h: 5 } } },
      ],
    },

    /* 10 对比 VS：左灰右黄分屏 */
    {
      id: 'versus-split', name: '对比VS·前后', style: '对比VS',
      description: '左右分屏 before/after：左侧黑白人物（可另传「第二人物」），右侧彩色人物，中间 VS 爆炸贴，顶部大标题横幅',
      layers: [
        { id: 'bg', type: 'background', visible: true, fill: '#2B2F3A', pattern: { type: 'stripes', angle: 45, color: 'rgba(255,255,255,0.05)', size: 1.2, gap: 3 } },
        { id: 'right', type: 'shape', visible: true, shape: 'rect', x: 50, y: 0, w: 50, h: 100, fill: { type: 'linear', angle: 90, stops: [{ offset: 0, color: '#FFE14D' }, { offset: 1, color: '#FFB800' }] },
          pattern: { type: 'halftone', dir: 'down', color: 'rgba(225,29,46,0.18)', size: 1.6, gap: 2.4 } },
        { id: 'p-before', type: 'image', visible: true, binding: 'person2', x: 0, y: 36, w: 50, h: 66, fit: 'contain', align: 'bottom', filter: 'grayscale(1) contrast(0.9) brightness(0.9)',
          sticker: { width: 0.8, color: '#9CA3AF' }, at: { wide: { y: 26, h: 76 }, square: { y: 34, h: 68 }, tall: { y: 36, h: 66, scale: 1.75, clip: true } } },
        person({ x: 50, y: 32, w: 50, h: 70, at: { wide: { y: 22, h: 80 }, square: { y: 30, h: 72 }, tall: { y: 33, h: 69, scale: 1.75, clip: true } } }),
        { id: 'lbl-l', type: 'badge', visible: true, binding: 'static', shape: 'rect', x: 8, y: 30, w: 30, h: 5.5, radius: 0.8, bg: '#111', color: '#FFFFFF', ...F_BLACK, fontSize: 4.6, sample: '以前 ✗',
          at: { wide: { x: 14, y: 20, w: 22, h: 8 }, square: { x: 10, y: 27, w: 30, h: 7 }, tall: { y: 30, h: 3.5 } } },
        { id: 'lbl-r', type: 'badge', visible: true, binding: 'static', shape: 'rect', x: 62, y: 30, w: 30, h: 5.5, radius: 0.8, bg: '#E11D2E', color: '#FFFFFF', ...F_BLACK, fontSize: 4.6, sample: '现在 ✓',
          at: { wide: { x: 64, y: 20, w: 22, h: 8 }, square: { x: 60, y: 27, w: 30, h: 7 }, tall: { y: 30, h: 3.5 } } },
        { id: 'top', type: 'shape', visible: true, shape: 'rect', x: 0, y: 0, w: 100, h: 26, fill: '#111111',
          at: { wide: { h: 22 }, square: { h: 24 }, tall: { y: 0, h: 27 } } },
        title({ y: 4, h: 14, color: '#FFE14D', stroke: { color: '#111', ratio: 0.12 }, strokeOuter: { color: '#FFFFFF', ratio: 0.3 }, hardShadow: { color: '#E11D2E' }, highlight: { color: '#FFFFFF' },
          at: { wide: { x: 5, y: 1.5, w: 90, h: 13, maxFontSize: 12 }, square: { y: 3, h: 13 }, tall: { y: 12, h: 8.5 } }, sample: '剪辑前后对比' }),
        sub({ y: 18.5, h: 5, color: '#FFFFFF', maxFontSize: 4.4,
          at: { wide: { y: 15, h: 5 }, square: { y: 16.8, h: 5.5 }, tall: { y: 21, h: 4 } }, sample: '同一段素材，差距太大了' }),
        { id: 'vs', type: 'badge', visible: true, binding: 'static', shape: 'burst', points: 14, inner: 0.74, square: true, x: 38, y: 48, w: 24, h: 18,
          bg: '#E11D2E', color: '#FFFFFF', fontFamily: 'Smiley Sans', fontWeight: '400', fontSize: 7.5, border: { color: '#FFFFFF', width: 0.6 }, hardShadow: { color: '#111', dx: 0.6, dy: 0.6 }, stroke: { color: '#111', ratio: 0.1 }, rotate: -8, sample: 'VS',
          at: { wide: { x: 43, y: 42, w: 14, h: 26 }, square: { x: 39, y: 46, w: 22, h: 22 }, tall: { x: 40, y: 26, w: 20, h: 9 } } },
        { id: 'badge', type: 'badge', visible: true, binding: 'badge', shape: 'rect', x: 66, y: 88, w: 28, h: 5.5, radius: 3, bg: '#111', color: '#FFE14D', ...F_BLACK, fontSize: 5.4, rotate: -4,
          at: { wide: { x: 82, y: 88, w: 14, h: 8 }, square: { x: 70, y: 88, w: 26, h: 7 }, tall: { x: 60, y: 36, w: 34, h: 3.6 } }, sample: '调色思路' },
      ],
    },

    /* 11 贴纸拼贴：牛皮纸 + 拍立得 + 便利贴 + 胶带 */
    {
      id: 'sticker-collage', name: '贴纸拼贴', style: '贴纸拼贴',
      description: '方格手账底，圆角拍立得人物 + 胶带，黄色便利贴副标题，星星爱心贴纸，适合日常/手账/学习',
      layers: [
        { id: 'bg', type: 'background', visible: true, fill: '#FFF6E5', pattern: [{ type: 'grid', color: 'rgba(120,90,60,0.14)', size: 0.4, gap: 4.2 }, { type: 'noise', color: 'rgba(120,90,60,0.08)', size: 0.25, gap: 0.6 }] },
        { id: 'blob', type: 'shape', visible: true, shape: 'blob', x: 2, y: 28, w: 96, h: 60, fill: '#FFD6E0', points: 9,
          at: { wide: { x: 46, y: 4, w: 52, h: 92 }, square: { x: 30, y: 16, w: 70, h: 82 }, tall: { y: 30, h: 46 } } },
        person({ x: 14, y: 33, w: 72, h: 56, fit: 'cover', focusY: 0, radius: 4, clip: true, rotate: -3, bgFill: { type: 'linear', angle: 90, stops: [{ offset: 0, color: '#BDE7FF' }, { offset: 1, color: '#7CC4FF' }] },
          frame: { width: 2.4, color: '#FFFFFF', shadow: { color: 'rgba(59,36,22,0.85)', dx: 1, dy: 1.2 } }, sticker: null,
          at: { wide: { x: 54, y: 10, w: 38, h: 78 }, square: { x: 40, y: 21, w: 54, h: 68, rotate: 3 }, tall: { y: 34, h: 40 } } }),
        { id: 'tape1', type: 'shape', visible: true, shape: 'tape', x: 10, y: 30, w: 22, h: 5, fill: 'rgba(125,211,252,0.8)', rotate: -30,
          at: { wide: { x: 50, y: 6, w: 12, h: 8 }, square: { x: 56, y: 17, w: 20, h: 6, rotate: 8 }, tall: { y: 32, h: 3 } } },
        { id: 'tape2', type: 'shape', visible: true, shape: 'tape', x: 70, y: 84, w: 22, h: 5, fill: 'rgba(253,224,71,0.85)', rotate: -24,
          at: { wide: { x: 84, y: 82, w: 12, h: 8 }, square: { x: 80, y: 82, w: 18, h: 6 }, tall: { y: 71, h: 3 } } },
        title({ y: 5, h: 15, ...F_KL, color: '#3B2416', stroke: { color: '#FFFFFF', ratio: 0.2 }, strokeOuter: { color: '#3B2416', ratio: 0.34 }, hardShadow: { color: '#F472B6' }, highlight: { color: '#F43F5E' },
          at: { wide: { x: 4, y: 12, w: 46, h: 26 }, square: { y: 4, h: 14 }, tall: { y: 13, h: 9 } }, sample: '我的*学习*手账' }),
        { id: 'note', type: 'shape', visible: true, shape: 'rect', x: 8, y: 20.5, w: 84, h: 9, fill: '#FDE68A', rotate: 1.5, hardShadow: { color: 'rgba(80,50,30,0.25)', dx: 0.6, dy: 0.8 },
          at: { wide: { x: 5, y: 44, w: 42, h: 14 }, square: { x: 4, y: 24, w: 33, h: 26, rotate: -4 }, tall: { y: 23, h: 6 } } },
        sub({ x: 10, y: 21.5, w: 80, h: 7, color: '#3B2416', fontWeight: '900', maxFontSize: 5, rotate: 1.5,
          at: { wide: { x: 7, y: 46, w: 38, h: 10 }, square: { x: 6, y: 26, w: 29, h: 22, rotate: -4, fit: null, fontSize: 6, lineHeight: 1.3, align: 'left' }, tall: { y: 23.8, h: 4.4 } }, sample: '期末周也能稳住节奏' }),
        { id: 'badge', type: 'badge', visible: true, binding: 'badge', shape: 'ellipse', square: true, x: 74, y: 30, w: 20, h: 15, bg: '#F43F5E', color: '#FFFFFF', ...F_KL, fontSize: 10, rotate: 14, border: { color: '#FFFFFF', width: 0.6 }, hardShadow: { color: 'rgba(80,50,30,0.35)', dx: 0.4, dy: 0.5 },
          at: { wide: { x: 36, y: 66, w: 12, h: 21 }, square: { x: 6, y: 56, w: 22, h: 22 }, tall: { y: 31, h: 11 } }, sample: '新' },
        { id: 'bubble2', type: 'badge', visible: true, binding: 'static', shape: 'bubble', x: 22, y: 76, w: 26, h: 8, radius: 4, tail: { side: 'right', pos: 0.5, size: 2.5 }, bg: '#FFFFFF', color: '#3B2416', ...F_KL, fontSize: 4.4, border: { color: '#3B2416', width: 0.4 }, rotate: -3, sample: '一起打卡!',
          at: { wide: { x: 14, y: 76, w: 16, h: 9 }, portrait: { x: 4, y: 88, w: 28, h: 6 }, tall: { visible: false } } },
        { id: 'star', type: 'shape', visible: true, shape: 'star', square: true, x: 4, y: 74, w: 14, h: 10, fill: '#FACC15', border: { color: '#3B2416', width: 0.4 }, rotate: -10,
          at: { wide: { x: 6, y: 72, w: 8, h: 14 }, square: { x: 28, y: 52, w: 11, h: 11 }, tall: { y: 72, h: 7 } } },
        { id: 'heart', type: 'shape', visible: true, shape: 'heart', square: true, x: 84, y: 66, w: 10, h: 8, fill: '#F43F5E', rotate: 12, border: { color: '#FFFFFF', width: 0.5 },
          at: { wide: { x: 92, y: 40, w: 5, h: 9 }, square: { x: 90, y: 64, w: 8, h: 8 }, tall: { y: 64, h: 5 } } },
        { id: 'tagline', type: 'text', visible: true, binding: 'tagline', x: 5, y: 91, w: 90, h: 5, ...F_KL, fontSize: 4.4, color: '#3B2416', align: 'center', valign: 'middle',
          at: { wide: { x: 6, y: 88, w: 40, align: 'left' }, square: { x: 4, y: 88, w: 34, align: 'left' }, portrait: { x: 50, y: 91, w: 46, align: 'right' }, tall: { y: 74 } }, sample: '附我的作息表' },
      ],
    },

    /* 12 数字清单：大号数字 + 要点列表 + 人物 */
    {
      id: 'number-list', name: '数字清单', style: '数字清单',
      description: '标题数字自动高亮成红色色块，副标题用 | 或 ；分隔自动变成编号要点列表，人物站右侧',
      layers: [
        { id: 'bg', type: 'background', visible: true, fill: { type: 'linear', angle: 90, stops: [{ offset: 0, color: '#EAF4FF' }, { offset: 1, color: '#BFDBFE' }] },
          pattern: { type: 'halftone', dir: 'right', color: 'rgba(30,64,175,0.14)', size: 1.6, gap: 2.6 } },
        { id: 'circle', type: 'shape', visible: true, shape: 'ellipse', square: true, x: 40, y: 40, w: 70, h: 52, fill: '#2563EB',
          at: { wide: { x: 60, y: 8, w: 44, h: 80 }, square: { x: 48, y: 30, w: 58, h: 68 }, tall: { y: 42, h: 40 } } },
        person({ x: 36, y: 34, w: 68, h: 68, halign: 'right', at: { wide: { x: 56, y: 6, w: 46, h: 96 }, square: { x: 46, y: 26, w: 56, h: 76 }, tall: { x: 34, y: 40, w: 70, h: 62 } } }),
        title({ y: 5, h: 17, color: '#1E3A8A', stroke: { color: '#FFFFFF', ratio: 0.2 }, strokeOuter: { color: '#1E3A8A', ratio: 0.34 }, hardShadow: { color: '#1E3A8A' },
          highlight: { color: '#FFE14D', stroke: '#111111', block: { fill: '#EF4444', radius: 1.2, padX: 2.2, padY: 1.2, top: 0.02, height: 0.96 } },
          at: { wide: { x: 4, y: 6, w: 52, h: 24 }, square: { y: 4, h: 15 }, tall: { y: 13, h: 10 } }, sample: '5个剪辑技巧' }),
        { id: 'list', type: 'text', visible: true, binding: 'subtitle', x: 5, y: 26, w: 52, h: 46, ...F_BLACK, fontSize: 4.6, color: '#1E3A8A', align: 'left', valign: 'top', lineHeight: 1.75,
          splitOn: '[|｜;；]', listPrefix: ['① ', '② ', '③ ', '④ ', '⑤ ', '⑥ '],
          banner: { fill: '#FFFFFF', paddingX: 1.4, paddingY: 0.9, radius: 1.2, perLine: true, shadow: { color: '#1E3A8A', dx: 0.5, dy: 0.5 } },
          at: { wide: { x: 5, y: 36, w: 46, h: 56, fontSize: 5.6 }, square: { x: 5, y: 24, w: 48, h: 54, fontSize: 4.4 }, tall: { y: 27, w: 60, h: 30, fontSize: 4.8 } }, sample: 'J/K/L 快速预览|波纹删除|自动卡点|批量调色|字幕模板' },
        { id: 'badge', type: 'badge', visible: true, binding: 'badge', shape: 'rect', x: 5, y: 82, w: 30, h: 6, radius: 3, bg: '#FACC15', color: '#1E3A8A', ...F_BLACK, fontSize: 5.8, rotate: -4, hardShadow: { color: '#1E3A8A', dx: 0.5, dy: 0.5 },
          at: { wide: { x: 5, y: 88, w: 16, h: 8 }, square: { x: 5, y: 84, w: 26, h: 7 }, tall: { y: 64, h: 3.6 } }, sample: '建议收藏' },
        { id: 'spark', type: 'shape', visible: true, shape: 'sparkle', square: true, x: 84, y: 30, w: 10, h: 8, fill: '#FACC15', hardShadow: { color: '#1E3A8A', dx: 0.4, dy: 0.4 },
          at: { wide: { x: 92, y: 6, w: 5, h: 9 }, square: { x: 88, y: 24, w: 8, h: 8 }, tall: { y: 30, h: 5 } } },
      ],
    },

    /* ———————— v1.5 口播 / 小红书 真人照片系列（人物原照片整图当背景，可切换抠图贴纸） ———————— */

    /* A 照片夹击大字：参考「知识/榨菜」「全屋/智能」—— 两段大字上下夹住人物，头部可遮挡上方字 */
    {
      id: 'photo-sandwich', name: '照片夹击大字', style: '口播·照片夹击',
      description: '人物原照片铺满 + 荧光绿大字上下（横版左右）夹击人物，头部压住上方字形成层次；标题用 / 分成两段',
      preferredRatio: '3:4', series: 'talk',
      defaultPersonMode: 'photo', defaultOcclude: true, defaultScene: 'living', sceneDefaults: { blur: 6, bright: -5, tint: 20 },
      photo: { focusY: 22, shade: [{ from: 0, to: 30, c0: 'rgba(0,0,0,0.35)', c1: 'rgba(0,0,0,0)' }, { from: 62, to: 100, c0: 'rgba(0,0,0,0)', c1: 'rgba(0,0,0,0.6)' }],
        at: { wide: { fit: 'height', focusX: 50, zoom: 1 }, tall: { focusY: 30 } } },
      layers: [
        { id: 'bg', type: 'background', visible: true, fill: { type: 'linear', angle: 90, stops: [{ offset: 0, color: '#3A3F2A' }, { offset: 1, color: '#15170F' }] } },
        person({ onlySticker: true, x: 6, y: 18, w: 88, h: 84, at: { wide: { x: 28, y: 6, w: 44, h: 96 }, tall: { y: 24, h: 70 } } }),
        title({ id: 'title-top', part: 0, x: 3, y: 5, w: 94, h: 25, fontSize: 34, maxFontSize: 40, bleed: true, color: '#E6FF3D', stroke: null, strokeOuter: null, hardShadow: { color: 'rgba(0,0,0,0.38)', dx: 0.5, dy: 0.7 }, letterSpacing: 0.02, autoHighlight: null,
          at: { wide: { x: 2, y: 12, w: 30, h: 40, maxFontSize: 30 }, tall: { y: 6, h: 17 } }, sample: '剪辑/干货' }),
        { id: 'occ', type: 'occluder', clipY: 36, at: { wide: { clipY: 100 }, tall: { clipY: 30 } } },
        title({ id: 'title-bottom', part: 1, x: 3, y: 74, w: 94, h: 24, fontSize: 34, maxFontSize: 40, bleed: true, color: '#E6FF3D', stroke: null, strokeOuter: null, hardShadow: { color: 'rgba(0,0,0,0.38)', dx: 0.5, dy: 0.7 }, letterSpacing: 0.02, autoHighlight: null,
          at: { wide: { x: 68, y: 48, w: 30, h: 40, maxFontSize: 30 }, tall: { y: 76, h: 17 } }, sample: '剪辑/干货' }),
        sub({ x: 4, y: 44, w: 26, h: 12, align: 'left', fontSize: 3.6, maxFontSize: 3.8, fit: null, color: '#FFFFFF', lineHeight: 1.3, shadow: { color: 'rgba(0,0,0,0.6)', blur: 0.8 }, ignoreFace: true,
          at: { wide: { x: 3, y: 56, w: 26, h: 16 }, tall: { y: 46, h: 8 } }, sample: '新手也能看懂的3个思路' }),
        { id: 'badge', type: 'badge', visible: true, binding: 'badge', shape: 'rect', radius: 1.2, x: 72, y: 46, w: 24, h: 6, bg: '#15170F', color: '#E6FF3D', ...F_BLACK, fontSize: 3.6, ignoreFace: true,
          at: { wide: { x: 72, y: 32, w: 18, h: 9 }, tall: { y: 47, h: 4 } }, sample: '收藏备用' },
      ],
    },

    /* B 荧光黄绿大字报：参考「搞钱日常」「公司or行业」 */
    {
      id: 'neon-poster', name: '荧光大字报', style: '小红书·荧光大字',
      description: '人物照片铺满 + 左上荧光黄绿超大字（逐行堆叠）+ 右侧问题清单 + 底部紫色斜条，适合知识/副业/经验分享',
      preferredRatio: '3:4', series: 'talk',
      defaultPersonMode: 'photo', defaultOcclude: true, defaultScene: 'living', sceneDefaults: { blur: 6, bright: 0, tint: 15 },
      photo: { focusY: 35, focusX: 0, zoom: 1.28, shade: [{ from: 0, to: 45, c0: 'rgba(20,20,20,0.35)', c1: 'rgba(0,0,0,0)' }, { from: 70, to: 100, c0: 'rgba(0,0,0,0)', c1: 'rgba(0,0,0,0.35)' }],
        at: { wide: { fit: 'height', focusX: 70 } } },
      layers: [
        { id: 'bg', type: 'background', visible: true, fill: { type: 'linear', angle: 90, stops: [{ offset: 0, color: '#E9E4D8' }, { offset: 1, color: '#B9B09A' }] } },
        person({ onlySticker: true, x: 30, y: 30, w: 72, h: 72, at: { wide: { x: 50, y: 8, w: 50, h: 94 } } }),
        title({ x: 5, y: 4, w: 56, h: 40, fit: 'width', fontSize: 24, maxFontSize: 24, align: 'left', valign: 'top', lineHeight: 1.04, splitOn: '[/／]', color: '#DFFF3A', stroke: null, strokeOuter: null,
          hardShadow: { color: 'rgba(40,50,0,0.55)', dx: 0.5, dy: 0.7 }, autoHighlight: null,
          at: { wide: { x: 4, y: 8, w: 40, h: 54, maxFontSize: 26 }, tall: { y: 8, h: 30, w: 60 } }, sample: '副业/日常' }),
        { id: 'occ', type: 'occluder', clipY: 29, at: { wide: { clipY: 100 } } },
        sub({ x: 64, y: 8, w: 33, h: 18, align: 'left', valign: 'top', fit: null, fontSize: 3.6, maxFontSize: 3.6, color: '#FFFFFF', lineHeight: 1.5, splitOn: '[、,，]', listPrefix: ['● ', '● ', '● ', '● '], banner: { fill: 'rgba(0,0,0,0.42)', paddingX: 1.2, paddingY: 0.6, radius: 1.2, perLine: true },
          shadow: { color: 'rgba(0,0,0,0.65)', blur: 0.8 }, ignoreFace: true,
          at: { wide: { x: 4, y: 64, w: 40, h: 16 }, tall: { y: 11, h: 12 } }, sample: '时间怎么排、素材从哪来、怎么坚持' }),
                sub({ id: 'tagline', binding: 'tagline', x: 12, y: 83, w: 76, h: 8, fontSize: 5.4, maxFontSize: 5.6, color: '#FFFFFF', rotate: -3,
          banner: { fill: '#7C4DFF', paddingX: 3, paddingY: 1.2, radius: 1.2, shadow: { color: 'rgba(0,0,0,0.35)', dx: 0.5, dy: 0.6 } },
          at: { wide: { x: 4, y: 82, w: 42, h: 10 }, tall: { y: 84, h: 5 } }, sample: '下班后的2小时这样用' }),
        { id: 'badge', type: 'badge', visible: true, binding: 'badge', shape: 'rect', radius: 1, x: 5, y: 72, w: 18, h: 6, bg: '#DFFF3A', color: '#1A1A1A', ...F_BLACK, fontSize: 3.6, rotate: -4,
          at: { wide: { x: 4, y: 3, w: 12, h: 7 }, tall: { y: 76, h: 4 } }, sample: '口播' },
      ],
    },

    /* C 杂志宋体风：参考「DESIGNED BY MURANG」系列 */
    {
      id: 'magazine-serif', name: '杂志宋体', style: '小红书·杂志宋体',
      description: '人物照片铺满 + 思源宋体 Black 大字竖排 + 斜体英文小字 + 上下品牌条 + 底部黄字，黑白高级感',
      preferredRatio: '3:4', series: 'talk',
      defaultPersonMode: 'photo', defaultOcclude: true, defaultScene: 'studio', sceneDefaults: { blur: 4, bright: 0, tint: 10 },
      photo: { focusY: 25, focusX: 62, filter: 'saturate(0.92) contrast(1.04)', shade: [{ from: 0, to: 20, c0: 'rgba(0,0,0,0.4)', c1: 'rgba(0,0,0,0)' }, { from: 60, to: 100, c0: 'rgba(0,0,0,0)', c1: 'rgba(0,0,0,0.6)' }],
        at: { wide: { fit: 'height', focusX: 72 } } },
      layers: [
        { id: 'bg', type: 'background', visible: true, fill: { type: 'linear', angle: 90, stops: [{ offset: 0, color: '#D9D4CC' }, { offset: 1, color: '#8C857B' }] } },
        person({ onlySticker: true, x: 30, y: 14, w: 74, h: 88, sticker: { width: 0.5, color: '#FFFFFF', shadow: { color: 'rgba(0,0,0,0.3)', dx: 0, dy: 0, blur: 1.2 } }, at: { wide: { x: 46, y: 6, w: 54, h: 96 } } }),
        { id: 'brand-top', type: 'text', visible: true, binding: 'static', x: 0, y: 1.2, w: 100, h: 3.6, fontFamily: 'Noto Serif SC', fontWeight: '900', fontSize: 2.6, color: 'rgba(255,255,255,0.9)', align: 'center', valign: 'middle', letterSpacing: 0.5, ignoreFace: true, sample: 'DESIGNED BY COVER STUDIO' },
        title({ x: 5, y: 7, w: 34, h: 56, fit: null, fontFamily: 'Noto Serif SC', fontWeight: '900', fontSize: 24, align: 'left', valign: 'top', lineHeight: 1.0, splitOn: '[/／]', color: '#FFFFFF', stroke: null, strokeOuter: null,
          hardShadow: null, shadow: { color: 'rgba(0,0,0,0.45)', blur: 1.5, dy: 0.4 }, autoHighlight: null,
          at: { wide: { x: 5, y: 10, w: 38, h: 46, fontSize: 22, lineHeight: 1.05 }, tall: { y: 8, h: 36, fontSize: 21 }, square: { w: 34, h: 52, fontSize: 18 } }, sample: '剪辑/审美' }),
        { id: 'occ', type: 'occluder', clipY: 40, at: { wide: { clipY: 100 }, tall: { clipY: 36 } } },
        { id: 'en', type: 'text', visible: true, binding: 'tagline', x: 6, y: 62, w: 60, h: 4, fontFamily: 'Noto Serif SC', fontWeight: '900', italic: true, fontSize: 3.2, color: '#FFE14D', align: 'left', valign: 'middle', letterSpacing: 0.12, ignoreFace: true,
          at: { wide: { x: 5, y: 60, w: 40, h: 5 }, tall: { y: 66, h: 3 } }, sample: 'Editing Aesthetics' },
        { id: 'subtitle', type: 'text', visible: true, binding: 'subtitle', x: 5, y: 67, w: 90, h: 22, fontFamily: 'Noto Serif SC', fontWeight: '900', fontSize: 8.6, fit: null, color: '#FFE14D', align: 'left', valign: 'top', lineHeight: 1.15, splitOn: '[/／]',
          shadow: { color: 'rgba(0,0,0,0.55)', blur: 1.2, dy: 0.4 }, at: { wide: { x: 5, y: 66, w: 50, h: 24, fontSize: 8.6 }, tall: { y: 70, h: 18 } }, sample: '高手都在练的/基本功' },
        { id: 'badge', type: 'badge', visible: true, binding: 'badge', shape: 'rect', radius: 0.3, x: 86, y: 30, w: 8, h: 22, bg: '#111111', color: '#FFFFFF', fontFamily: 'Noto Serif SC', fontWeight: '900', fontSize: 3.6, vertical: true, ignoreFace: true,
          at: { wide: { x: 92, y: 20, w: 5, h: 36 }, tall: { y: 30, h: 16 } }, sample: '口播笔记' },
        { id: 'brand-bot', type: 'text', visible: true, binding: 'static', x: 0, y: 95.2, w: 100, h: 3.6, fontFamily: 'Noto Serif SC', fontWeight: '900', fontSize: 2.6, color: 'rgba(255,255,255,0.9)', align: 'center', valign: 'middle', letterSpacing: 0.5, ignoreFace: true, sample: 'DESIGNED BY COVER STUDIO' },
      ],
    },

    /* D 紫色便签手账：参考「我可以是任何人」小摊系列 */
    {
      id: 'purple-memo', name: '紫色便签手账', style: '小红书·便签手账',
      description: '薰衣草紫底 + 白边圆角照片 + 撕纸便签手写标题 + 胶带 + 小图标贴纸 + 手写落款，适合 Vlog/日常记录',
      preferredRatio: '3:4', series: 'talk',
      defaultPersonMode: 'photo', defaultOcclude: false, defaultScene: 'cafe', sceneDefaults: { blur: 3, bright: 0, tint: 10 },
      photo: { x: 5, y: 4, w: 90, h: 86, radius: 3, focusY: 30, frame: { width: 0.9, color: '#FFFFFF' },
        at: { wide: { x: 3, y: 5, w: 94, h: 82, fit: 'height', focusX: 62 }, tall: { y: 4, h: 85 } } },
      layers: [
        { id: 'bg', type: 'background', visible: true, fill: '#B9A9F5', pattern: { type: 'dots', color: 'rgba(255,255,255,0.35)', size: 0.5, gap: 3.2 } },
        person({ onlySticker: true, x: 10, y: 26, w: 80, h: 64, at: { wide: { x: 46, y: 8, w: 50, h: 80 } } }),
        { id: 'note', type: 'shape', visible: true, shape: 'rect', x: 9, y: 7, w: 74, h: 21, radius: 1, fill: '#FFFFFF', border: { color: '#3B2A7A', width: 0.45 }, hardShadow: { color: 'rgba(59,42,122,0.35)', dx: 0.6, dy: 0.8 }, rotate: -3,
          at: { wide: { x: 6, y: 10, w: 44, h: 30 }, tall: { y: 7, h: 15 } } },
        { id: 'tape1', type: 'shape', visible: true, shape: 'tape', x: 6, y: 5, w: 16, h: 4, fill: 'rgba(255,214,102,0.9)', rotate: -28, at: { wide: { x: 3, y: 7, w: 9, h: 6 }, tall: { y: 5, h: 3 } } },
        { id: 'tape2', type: 'shape', visible: true, shape: 'tape', x: 72, y: 5, w: 16, h: 4, fill: 'rgba(244,114,182,0.85)', rotate: 22, at: { wide: { x: 42, y: 7, w: 9, h: 6 }, tall: { y: 5, h: 3 } } },
        title({ x: 12, y: 9, w: 68, h: 17, ...F_KL, fontSize: 9, maxFontSize: 10, fit: 'width', color: '#4A2FC0', stroke: null, strokeOuter: null, hardShadow: null, rotate: -3, lineHeight: 1.12, splitOn: '[/／]', autoHighlight: null, highlight: { color: '#E8508C' },
          at: { wide: { x: 8, y: 12, w: 40, h: 26 }, tall: { y: 8.5, h: 12 } }, sample: '在街角小店/遇见*好咖啡*' }),
        { id: 'spark1', type: 'shape', visible: true, shape: 'sparkle', square: true, x: 84, y: 9, w: 7, h: 5, fill: '#FFFFFF', border: { color: '#3B2A7A', width: 0.35 }, at: { wide: { x: 53, y: 10, w: 4, h: 7 } } },
        { id: 'heart', type: 'shape', visible: true, shape: 'heart', x: 84, y: 80, w: 8, h: 6, fill: '#F472B6', border: { color: '#3B2A7A', width: 0.35 }, rotate: 10, at: { wide: { x: 92, y: 74, w: 4, h: 7 }, tall: { y: 82, h: 4 } } },
        { id: 'star', type: 'shape', visible: true, shape: 'star', square: true, x: 6, y: 78, w: 8, h: 6, fill: '#FFD166', border: { color: '#3B2A7A', width: 0.35 }, rotate: -8, at: { wide: { x: 3, y: 74, w: 4, h: 7 }, tall: { y: 82, h: 4 } } },
        sub({ id: 'tagline', binding: 'tagline', x: 20, y: 80, w: 60, h: 8, ...F_KL, fontSize: 6, maxFontSize: 6.4, color: '#FFFFFF', stroke: { color: '#3B2A7A', ratio: 0.16 }, ignoreFace: true,
          at: { wide: { x: 52, y: 76, w: 40, h: 10 }, tall: { y: 82, h: 5 } }, sample: '今天也在好好生活' }),
        sub({ x: 6, y: 92, w: 60, h: 5, align: 'left', fontSize: 2.8, maxFontSize: 2.8, color: '#3B2A7A', ...F_BLACK, ignoreFace: true,
          at: { wide: { x: 4, y: 90, w: 50, h: 7 }, tall: { y: 92, h: 4 } }, sample: '3月2日更新 · @你的账号' }),
        { id: 'badge', type: 'badge', visible: true, binding: 'badge', shape: 'rect', radius: 3, x: 74, y: 91.5, w: 20, h: 5.5, bg: '#E8508C', color: '#FFFFFF', ...F_BLACK, fontSize: 3, ignoreFace: true,
          at: { wide: { x: 84, y: 90, w: 12, h: 7 }, tall: { y: 92, h: 4 } }, sample: 'Vlog 更新' },
      ],
    },

    /* E 口播博主：黄字黑描边 + 气泡 + 绿色要点徽章（参考「用小加同学3分钟做爆款封面」） */
    {
      id: 'talk-yellow', name: '口播博主黄黑', style: '口播·黄黑描边',
      description: '人物大头照铺满 + 黄色超粗字黑描边 + 「零基础必看」气泡 + 绿色勾选要点 + 底部黑条，口播/教程首选',
      preferredRatio: '16:9', series: 'talk',
      defaultPersonMode: 'photo', defaultOcclude: true, defaultScene: 'desk', sceneDefaults: { blur: 6, bright: -10, tint: 25 },
      photo: { focusY: 28, offsetY: 11, shade: [{ from: 0, to: 34, c0: 'rgba(0,0,0,0.55)', c1: 'rgba(0,0,0,0)' }, { from: 70, to: 100, c0: 'rgba(0,0,0,0)', c1: 'rgba(0,0,0,0.5)' }],
        at: { wide: { fit: 'height', focusX: 50, zoom: 1, offsetY: 14 }, tall: { offsetY: 6 } } },
      layers: [
        { id: 'bg', type: 'background', visible: true, fill: { type: 'linear', angle: 90, stops: [{ offset: 0, color: '#3B3226' }, { offset: 1, color: '#14110C' }] } },
        person({ onlySticker: true, x: 14, y: 24, w: 72, h: 78, at: { wide: { x: 30, y: 16, w: 40, h: 86 } } }),
        title({ x: 4, y: 3, w: 92, h: 22, fontSize: 14, maxFontSize: 15.5, lineHeight: 1.08, splitOn: '[/／]', color: '#FFE14D', stroke: { color: '#111111', ratio: 0.2 }, strokeOuter: null, hardShadow: { color: '#111111', dx: 0.6, dy: 0.8 }, highlight: { color: '#FFFFFF' }, autoHighlight: null,
          at: { wide: { x: 3, y: 3, w: 94, h: 28, maxFontSize: 15 }, tall: { y: 6, h: 16 } }, sample: '用*3分钟*/讲清一个知识点' }),
        { id: 'occ', type: 'occluder', clipY: 27, at: { wide: { clipY: 31 }, tall: { clipY: 23 } } },
        { id: 'badge', type: 'badge', visible: true, binding: 'badge', shape: 'bubble', radius: 3, tail: { side: 'right', pos: 0.6, size: 2.2 }, x: 3, y: 42, w: 24, h: 8, bg: '#FFFFFF', color: '#111111', ...F_BLACK, fontSize: 4, border: { color: '#111111', width: 0.4 }, rotate: -6, ignoreFace: true,
          at: { wide: { x: 6, y: 46, w: 17, h: 12 }, tall: { y: 44, h: 5 } }, sample: '零基础必看' },
        sub({ x: 64, y: 44, w: 33, h: 24, align: 'left', valign: 'top', fit: null, fontSize: 4.2, maxFontSize: 4.2, lineHeight: 1.75, color: '#FFFFFF', splitOn: '[、,，]', listPrefix: ['✓ ', '✓ ', '✓ ', '✓ '],
          banner: { fill: '#16A34A', paddingX: 1.2, paddingY: 0.7, radius: 1.2, perLine: true, shadow: { color: '#0B3D1E', dx: 0.4, dy: 0.5 } }, ignoreFace: true,
          at: { wide: { x: 72, y: 40, w: 26, h: 34 }, tall: { y: 42, h: 15 } }, sample: '选题怎么定、开头怎么说、结尾怎么收' }),
        sub({ id: 'tagline', binding: 'tagline', x: 20, y: 89, w: 60, h: 7, fontSize: 4.4, maxFontSize: 4.6, color: '#FFE14D', ignoreFace: true,
          banner: { fill: '#111111', paddingX: 3, paddingY: 1, radius: 0.8 },
          at: { wide: { x: 30, y: 86, w: 40, h: 9 }, tall: { y: 88, h: 5 } }, sample: '口播新手 · 第12期' }),
        { id: 'spark', type: 'shape', visible: true, shape: 'sparkle', square: true, x: 86, y: 30, w: 7, h: 5, fill: '#FFE14D', at: { wide: { x: 88, y: 30, w: 4, h: 7 } } },
      ],
    },

    /* F 圆角卡片合集：参考「魔都/物价」万赞博主封面收集 */
    {
      id: 'card-feed', name: '圆角卡片', style: '小红书·圆角卡片',
      description: '白底圆角照片卡 + 卡片内上下两段粗体大字（字距拉开）+ 深色小标签 + 卡片下方笔记标题与账号，像信息流截图',
      preferredRatio: '3:4', series: 'talk',
      defaultPersonMode: 'photo', defaultOcclude: true, defaultScene: 'city-day', sceneDefaults: { blur: 4, bright: 0, tint: 10 },
      photo: { x: 4, y: 3, w: 92, h: 80, radius: 3.5, focusY: 28, filter: 'saturate(0.9)',
        shade: [{ from: 0, to: 30, c0: 'rgba(0,0,0,0.25)', c1: 'rgba(0,0,0,0)' }, { from: 65, to: 100, c0: 'rgba(0,0,0,0)', c1: 'rgba(0,0,0,0.45)' }],
        at: { wide: { x: 3, y: 4, w: 64, h: 92, fit: 'height', focusX: 50 }, tall: { y: 3, h: 82 } } },
      layers: [
        { id: 'bg', type: 'background', visible: true, fill: '#FFFFFF' },
        { id: 'card', type: 'shape', visible: true, shape: 'rect', onlySticker: true, x: 4, y: 3, w: 92, h: 80, radius: 3.5, fill: { type: 'linear', angle: 90, stops: [{ offset: 0, color: '#C9BBA6' }, { offset: 1, color: '#6E5E4B' }] },
          at: { wide: { x: 3, y: 4, w: 64, h: 92 }, tall: { y: 3, h: 82 } } },
        person({ onlySticker: true, x: 8, y: 16, w: 84, h: 67, sticker: { width: 0.6, color: '#FFFFFF' }, at: { wide: { x: 13, y: 12, w: 44, h: 84 }, tall: { y: 20, h: 65 } } }),
        title({ id: 'title-top', part: 0, x: 8, y: 5, w: 84, h: 16, fontSize: 22, maxFontSize: 24, color: '#C6B3FF', stroke: { color: '#2A1F4A', ratio: 0.12 }, strokeOuter: null, hardShadow: { color: '#2A1F4A', dx: 0.5, dy: 0.6 }, letterSpacing: 0.3, autoHighlight: null,
          at: { wide: { x: 6, y: 6, w: 58, h: 22 }, tall: { y: 6, h: 12 } }, sample: '城市/物价' }),
        { id: 'occ', type: 'occluder', clipY: 22, at: { wide: { clipY: 30 }, tall: { clipY: 19 } } },
        title({ id: 'title-bottom', part: 1, x: 8, y: 63, w: 84, h: 16, fontSize: 22, maxFontSize: 24, color: '#C6B3FF', stroke: { color: '#2A1F4A', ratio: 0.12 }, strokeOuter: null, hardShadow: { color: '#2A1F4A', dx: 0.5, dy: 0.6 }, letterSpacing: 0.3, autoHighlight: null,
          at: { wide: { x: 6, y: 70, w: 58, h: 22 }, tall: { y: 69, h: 12 } }, sample: '城市/物价' }),
        { id: 'badge', type: 'badge', visible: true, binding: 'badge', shape: 'rect', radius: 0.8, x: 8, y: 57, w: 20, h: 5, bg: '#4C2E8F', color: '#FFFFFF', ...F_BLACK, fontSize: 3.2, ignoreFace: true,
          at: { wide: { x: 6, y: 62, w: 14, h: 6 }, tall: { y: 64, h: 3.6 } }, sample: '真实记录' },
        sub({ x: 5, y: 85, w: 90, h: 8, align: 'left', valign: 'top', fit: null, fontSize: 4.2, maxFontSize: 4.2, color: '#1F1F1F', ...F_BLACK, lineHeight: 1.3, ignoreFace: true,
          at: { wide: { x: 70, y: 10, w: 27, h: 50, fontSize: 5.2 }, tall: { y: 87, h: 6 } }, sample: '一个人在上海生活一个月要花多少' }),
        sub({ id: 'tagline', binding: 'tagline', x: 5, y: 93.5, w: 60, h: 4, align: 'left', fontSize: 2.8, maxFontSize: 2.8, color: '#555555', ...F_BLACK, fontWeight: '500', ignoreFace: true,
          at: { wide: { x: 70, y: 86, w: 27, h: 6 }, tall: { y: 94, h: 3 } }, sample: '● @你的账号' }),
        { id: 'heart', type: 'shape', visible: true, shape: 'heart', x: 88, y: 94, w: 4, h: 3, fill: 'rgba(0,0,0,0)', border: { color: '#555555', width: 0.3 }, at: { wide: { x: 93, y: 87, w: 2.4, h: 4 }, tall: { y: 94.5, h: 2.2 } } },
      ],
    },

    /* G 数字清单口播：参考「求职全流程」粉色要点条 */
    {
      id: 'talk-list', name: '口播数字清单', style: '口播·数字清单',
      description: '人物照片铺满 + 顶部黄色粗字 + 右侧编号粉色要点条（逐条）+ 底部黄色高亮条，教程/流程/清单类口播',
      preferredRatio: '3:4', series: 'talk',
      defaultPersonMode: 'photo', defaultOcclude: true, defaultScene: 'studio', sceneDefaults: { blur: 5, bright: 0, tint: 15 },
      photo: { focusY: 30, focusX: 38, offsetY: 7, shade: [{ from: 0, to: 24, c0: 'rgba(0,0,0,0.35)', c1: 'rgba(0,0,0,0)' }],
        at: { wide: { fit: 'height', focusX: 32, offsetY: 10 }, tall: { offsetY: 4 } } },
      layers: [
        { id: 'bg', type: 'background', visible: true, fill: { type: 'linear', angle: 90, stops: [{ offset: 0, color: '#FDF2F8' }, { offset: 1, color: '#F9A8D4' }] } },
        person({ onlySticker: true, x: 0, y: 22, w: 70, h: 80, halign: 'left', at: { wide: { x: 6, y: 12, w: 50, h: 90 } } }),
        title({ x: 4, y: 3, w: 92, h: 13, fontSize: 15, maxFontSize: 15.5, color: '#FFE14D', stroke: { color: '#111111', ratio: 0.16 }, strokeOuter: null, hardShadow: { color: '#111111', dx: 0.5, dy: 0.7 },
          at: { wide: { x: 3, y: 4, w: 94, h: 18 }, tall: { y: 7, h: 9 } }, sample: '拍剪全流程' }),
        { id: 'occ', type: 'occluder', clipY: 17, at: { wide: { clipY: 23 }, tall: { clipY: 16 } } },
        sub({ x: 60, y: 44, w: 36, h: 36, align: 'left', valign: 'top', fit: null, fontSize: 4.4, maxFontSize: 4.4, lineHeight: 1.85, color: '#FFFFFF', splitOn: '[、,，]', listPrefix: ['① ', '② ', '③ ', '④ ', '⑤ ', '⑥ '],
          banner: { fill: '#EC4899', paddingX: 1.2, paddingY: 0.8, radius: 2, perLine: true }, ignoreFace: true,
          at: { wide: { x: 64, y: 30, w: 33, h: 50 }, tall: { y: 50, h: 24 } }, sample: '选题策划、脚本撰写、拍摄布光、剪辑复盘' }),
        { id: 'badge', type: 'badge', visible: true, binding: 'badge', shape: 'rect', radius: 1, x: 6, y: 22, w: 15, h: 6, bg: 'transparent', color: '#EC4899', ...F_BLACK, fontSize: 5, stroke: { color: '#FFFFFF', ratio: 0.28 }, rotate: -10, ignoreFace: true,
          at: { wide: { x: 50, y: 26, w: 10, h: 9 }, tall: { y: 20, h: 4 } }, sample: 'OK!' },
        sub({ id: 'tagline', binding: 'tagline', x: 0, y: 89, w: 100, h: 11, fontSize: 6.4, maxFontSize: 6.6, color: '#111111', highlight: { color: '#EC4899' }, ignoreFace: true,
          banner: { fill: '#FFE14D', paddingX: 10, paddingY: 2.2, radius: 0 },
          at: { wide: { x: 60, y: 84, w: 40, h: 12 }, tall: { y: 90, h: 7 } }, sample: '*小白*也能跟着做' }),
      ],
    },

    /* H 避雷 / 踩坑：参考「避雷」「都来避雷！」 */
    {
      id: 'avoid-pit', name: '避雷踩坑', style: '口播·避雷警示',
      description: '人物照片铺满 + 头两侧超大黄字「避/雷」+ 红叉 / 警示三角 + 蓝色坑点标签 + 底部白色粗字结论',
      preferredRatio: '3:4', series: 'talk',
      defaultPersonMode: 'photo', defaultOcclude: true, defaultScene: 'living', sceneDefaults: { blur: 6, bright: -10, tint: 25 },
      photo: { focusY: 30, shade: [{ from: 0, to: 30, c0: 'rgba(0,0,0,0.45)', c1: 'rgba(0,0,0,0)' }, { from: 62, to: 100, c0: 'rgba(0,0,0,0)', c1: 'rgba(0,0,0,0.7)' }],
        at: { wide: { fit: 'height', focusX: 50 } } },
      layers: [
        { id: 'bg', type: 'background', visible: true, fill: { type: 'linear', angle: 90, stops: [{ offset: 0, color: '#4B3A2A' }, { offset: 1, color: '#1A140E' }] } },
        person({ onlySticker: true, x: 14, y: 22, w: 72, h: 80, at: { wide: { x: 30, y: 12, w: 40, h: 90 } } }),
        title({ id: 'title-l', part: 0, x: 2, y: 2, w: 48, h: 26, fontSize: 30, maxFontSize: 34, color: '#FFE14D', stroke: null, strokeOuter: null, hardShadow: { color: 'rgba(0,0,0,0.5)', dx: 0.6, dy: 0.8 }, autoHighlight: null,
          at: { wide: { x: 2, y: 8, w: 30, h: 50 }, tall: { y: 6, h: 18 } }, sample: '避雷' }),
        title({ id: 'title-r', part: 1, x: 50, y: 2, w: 48, h: 26, fontSize: 30, maxFontSize: 34, color: '#FFE14D', stroke: null, strokeOuter: null, hardShadow: { color: 'rgba(0,0,0,0.5)', dx: 0.6, dy: 0.8 }, autoHighlight: null,
          at: { wide: { x: 68, y: 8, w: 30, h: 50 }, tall: { y: 6, h: 18 } }, sample: '避雷' }),
        { id: 'occ', type: 'occluder', clipY: 30, at: { wide: { clipY: 100 }, tall: { clipY: 25 } } },
        { id: 'cross', type: 'shape', visible: true, shape: 'cross', essential: true, thick: 0.24, x: 80, y: 24, w: 12, h: 9, fill: '#EF4444', hardShadow: { color: '#FFFFFF', dx: 0.4, dy: 0.4 }, rotate: 6,
          at: { wide: { x: 88, y: 5, w: 7, h: 12 }, tall: { y: 23, h: 6 } } },
        { id: 'warn', type: 'badge', visible: false, binding: 'static', shape: 'triangle', x: 6, y: 27, w: 11, h: 9, bg: '#FFE14D', color: '#111111', ...F_BLACK, fontSize: 5, border: { color: '#111111', width: 0.5 }, sample: '!', ignoreFace: true,
          at: { wide: { x: 6, y: 60, w: 6, h: 11 }, tall: { y: 25, h: 6 } } },
        sub({ x: 4, y: 40, w: 32, h: 24, align: 'left', valign: 'top', fit: null, fontSize: 4.2, maxFontSize: 4.2, lineHeight: 1.9, color: '#FFFFFF', splitOn: '[、,，]',
          banner: { fill: '#2563EB', paddingX: 1.2, paddingY: 0.7, radius: 2.4, perLine: true, shadow: { color: '#0B1F55', dx: 0.4, dy: 0.5 } }, ignoreFace: true,
          at: { wide: { x: 74, y: 60, w: 24, h: 24 }, tall: { y: 40, h: 14 } }, sample: '设备乱买、教程乱学、选题乱跟' }),
        { id: 'badge', type: 'badge', visible: true, binding: 'badge', shape: 'rect', radius: 1, x: 72, y: 46, w: 22, h: 6, bg: '#EF4444', color: '#FFFFFF', ...F_BLACK, fontSize: 4, rotate: 6, border: { color: '#FFFFFF', width: 0.35 }, ignoreFace: true,
          at: { wide: { x: 4, y: 74, w: 12, h: 8 }, tall: { y: 46, h: 4 } }, sample: '踩坑' },
        sub({ id: 'tagline', binding: 'tagline', x: 4, y: 82, w: 92, h: 12, fontSize: 8, maxFontSize: 8.4, color: '#FFFFFF', stroke: { color: '#111111', ratio: 0.14 }, hardShadow: { color: '#111111', dx: 0.5, dy: 0.6 }, highlight: { color: '#FFE14D' },
          at: { wide: { x: 30, y: 82, w: 40, h: 14 }, tall: { y: 84, h: 8 } }, sample: '新手做口播 *少走弯路*' }),
      ],
    },

  ];

  const STORAGE_KEY = 'cover-studio-custom-templates';

  function loadCustom() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function saveCustom(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function all() {
    return [...BUILTIN, ...loadCustom()];
  }

  function getById(id) {
    return all().find((t) => t.id === id) || null;
  }

  function addCustom(template) {
    const list = loadCustom();
    const idx = list.findIndex((t) => t.id === template.id);
    if (idx >= 0) list[idx] = template;
    else list.push(template);
    saveCustom(list);
    return template;
  }

  function removeCustom(id) {
    const list = loadCustom().filter((t) => t.id !== id);
    saveCustom(list);
  }

  function clone(template) {
    return JSON.parse(JSON.stringify(template));
  }

  return {
    BUILTIN,
    all,
    getById,
    addCustom,
    removeCustom,
    loadCustom,
    clone,
  };
})();
