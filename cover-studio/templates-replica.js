/**
 * v1.7 参考图 1:1 复刻模板（ref10 起）。只复刻版式/字体风格/配色/装饰位置；
 * 文案为通用占位，人物用上传的抠图（样图用 AI 人像），背景为本地生成/内置图（无原图素材、无品牌水印）。
 * 规则：文字/贴纸/图标不遮挡人物（渲染层「文字避让人物」兜底）。
 */
(function () {
  const B = window.CoverTemplates.BUILTIN;
  const F_BLACK = { fontFamily: 'Noto Sans SC', fontWeight: '900' };
  const F_BOLD = { fontFamily: 'Noto Sans SC', fontWeight: '700' };
  const F_SMILEY = { fontFamily: 'Smiley Sans', fontWeight: '400' };
  const F_KL = { fontFamily: 'ZCOOL KuaiLe', fontWeight: '400' };
  const Y = '#FFE14D', K = '#111111';
  const bg = (fill, extra) => ({ id: 'bg', type: 'background', visible: true, fill, ...(extra || {}) });
  const IMG = (src, o) => ({ id: 'bgimg', type: 'image', binding: 'decor', src, visible: true, x: 0, y: 0, w: 100, h: 100, fit: 'cover', radius: 0, ...o });
  const T = (o) => ({ id: 'title', type: 'text', visible: true, binding: 'title', x: 5, y: 4, w: 90, h: 16, ...F_BLACK, fontSize: 12, fit: 'width', maxFontSize: 14, color: '#FFFFFF', align: 'center', valign: 'middle', lineHeight: 1.08, noRatio: true, ...o });
  const S = (o) => ({ id: 'subtitle', type: 'text', visible: true, binding: 'subtitle', x: 8, y: 22, w: 84, h: 6, ...F_BLACK, fontSize: 4.4, fit: 'width', maxFontSize: 4.6, color: '#FFFFFF', align: 'center', valign: 'middle', lineHeight: 1.2, noRatio: true, ...o });
  const TG = (o) => S({ id: 'tagline', binding: 'tagline', ...o });
  const ST = (id, sample, o) => S({ id, binding: 'static', sample, ...o });
  const BD = (o) => ({ id: 'badge', type: 'badge', visible: true, binding: 'badge', shape: 'rect', radius: 1, x: 6, y: 30, w: 20, h: 6, bg: K, color: '#FFFFFF', ...F_BLACK, fontSize: 3.6, ...o });
  const PERSON = (o) => ({ id: 'person', type: 'image', binding: 'person', visible: true, x: 10, y: 30, w: 80, h: 70, fit: 'contain', align: 'bottom', radius: 0,
    sticker: { width: 0.5, color: '#FFFFFF', shadow: { color: 'rgba(0,0,0,0.45)', dx: 0, dy: 0.6 }, soft: false }, ...o });
  const SLOT = (o) => ({ id: 'slot', type: 'photoSlot', visible: true, x: 10, y: 10, w: 40, h: 30, focusY: 25, radius: 1, ...o });
  const ICON = (id, icon, x, y, s, o) => ({ id, type: 'icon', visible: true, icon, x, y, w: s, h: s * 0.75, ...o });
  const YW = { color: Y, stroke: { color: K, ratio: 0.12 }, strokeOuter: { color: '#FFFFFF', ratio: 0.22 }, hardShadow: { color: K, dx: 0.5, dy: 0.7 } };
  const rep = (o) => ({ preferredRatio: '3:4', series: 'replica', group: 'ref10', allowScene: false, autoWide: 'left', ...o });

  const R = [
    /* ref10-r1c1 近景产品：左上三行橙白粗字 + 左下数据面板，人物在右 */
    rep({ id: 'ref10-r1c1', name: 'R10·刚试完有点意外', style: '复刻·产品近景', source: 'ref10-r1c1',
      description: '暗色科技空间，人物在右半，左上三行粗字（橙/白/橙，句末大号句点），左下半透明“实测体验”面板（3 行图标+进度条）',
      layers: [bg('#15171A'), IMG('assets/ref10/studio.jpg'),
        { id: 'shade', type: 'shape', visible: true, shape: 'rect', x: 0, y: 0, w: 100, h: 100, fill: { type: 'linear', angle: 0, stops: [{ offset: 0, color: 'rgba(0,0,0,0.55)' }, { offset: 0.6, color: 'rgba(0,0,0,0)' }] } },
        PERSON({ x: 30, y: 14, w: 76, h: 86, halign: 'right', sticker: null }),
        T({ x: 5, y: 13, w: 44, h: 38, splitOn: '[/／]', fit: null, fontSize: 13, maxFontSize: 13, align: 'left', valign: 'top', lineHeight: 1.1, color: '#FFFFFF', highlight: { color: '#FF8A1F' },
          hardShadow: { color: 'rgba(0,0,0,0.6)', dx: 0.3, dy: 0.5 }, sample: '*刚试完，*/有点/*意外。*' }),
        { id: 'panel', type: 'shape', visible: true, shape: 'rect', radius: 1.2, x: 3, y: 55, w: 32, h: 20, fill: 'rgba(40,42,46,0.72)', border: { color: 'rgba(255,255,255,0.25)', width: 0.15 } },
        ST('panelHead', 'REAL TEST EXPERIENCE', { x: 5, y: 56.2, w: 29, h: 2.6, ...F_BOLD, fontSize: 1.3, maxFontSize: 1.3, fit: null, align: 'left', color: 'rgba(255,255,255,0.75)' }),
        ...[0, 1, 2].map((i) => ({ id: 'bar' + i, type: 'shape', visible: true, shape: 'rect', radius: 0.4, x: 16, y: 61.2 + i * 4.6, w: [11, 9.5, 10.5][i], h: 0.9, fill: '#FF8A1F' })),
        TG({ x: 5, y: 59.5, w: 12, h: 13, splitOn: '[/／]', fit: null, fontSize: 2.2, maxFontSize: 2.2, align: 'left', valign: 'top', lineHeight: 2, color: '#FFFFFF', ...F_BOLD, listPrefix: ['◉ ', '▣ ', '✎ '], sample: '降噪/续航/轻巧' }),
        ST('pct', '92%\n88%\n95%', { x: 28.5, y: 59.6, w: 6, h: 14, fit: null, fontSize: 1.8, maxFontSize: 1.8, align: 'left', valign: 'top', lineHeight: 2.55, color: 'rgba(255,255,255,0.8)', ...F_BOLD }),
      ] }),

    /* ref10-r1c2 棕色测评拼贴：左上黑字白描边“测评”+黄字副标，右上年份卡，右下圆形“质感绝了” */
    rep({ id: 'ref10-r1c2', name: 'R10·测评好物', style: '复刻·测评拼贴', source: 'ref10-r1c2',
      description: '暖棕色桌面拼贴背景，左上超大“测评”黑字白描边 + 黄色斜体英文/关键词，黑色问句小条；右上白卡年份 + 黄色标签；右下白色圆形结论章',
      layers: [bg('#3B2A1C'), IMG('assets/ref10/desk.jpg'),
        PERSON({ x: 24, y: 24, w: 76, h: 76, sticker: { width: 0.9, color: '#FFFFFF', shadow: { color: 'rgba(0,0,0,0.5)', dx: 0.4, dy: 0.6 } } }),
        T({ x: 4, y: 3, w: 46, h: 15, fit: 'width', maxFontSize: 20, align: 'left', color: K, stroke: { color: '#FFFFFF', ratio: 0.2 }, hardShadow: { color: 'rgba(0,0,0,0.5)', dx: 0.5, dy: 0.6 }, rotate: -3, sample: '测评' }),
        S({ x: 4, y: 17, w: 44, h: 10, ...F_SMILEY, fit: 'width', maxFontSize: 14, align: 'left', color: Y, stroke: { color: K, ratio: 0.14 }, strokeOuter: { color: '#FFFFFF', ratio: 0.18 }, rotate: -3, sample: '好物清单' }),
        TG({ x: 6, y: 28, w: 34, h: 5, fit: null, fontSize: 3.4, maxFontSize: 3.4, align: 'left', color: '#FFFFFF', banner: { fill: K, paddingX: 1.2, paddingY: 0.5, radius: 0.4 }, rotate: -3, sample: '好用到离谱？？' }),
        { id: 'arrow1', type: 'shape', visible: true, shape: 'arrow', x: 46, y: 8, w: 12, h: 8, fill: '#FFFFFF', rotate: 160 },
        BD({ id: 'year', binding: 'static', x: 70, y: 3, w: 26, h: 8, bg: '#FFFFFF', color: K, fontSize: 5.6, border: { color: K, width: 0.35 }, radius: 0.6, sample: '2026' }),
        BD({ x: 70, y: 11.5, w: 26, h: 5, bg: Y, color: K, fontSize: 3.2, radius: 0.3, border: { color: K, width: 0.25 }, sample: '效率神器 ☑' }),
        BD({ id: 'seal', binding: 'static', shape: 'ellipse', square: true, x: 74, y: 76, w: 22, h: 17, bg: '#FFFFFF', color: K, fontSize: 4.8, border: { color: K, width: 0.4 }, hardShadow: { color: 'rgba(0,0,0,0.45)', dx: 0.4, dy: 0.6 }, rotate: -8, sample: '质感\n绝了' }),
      ] }),

    /* ref10-r1c3 双人对谈：黄字黑描边白外框两行 + 黑条对谈 + 左气泡右手写问句，绿荫背景 */
    rep({ id: 'ref10-r1c3', name: 'R10·双人对谈', style: '复刻·双人对谈', source: 'ref10-r1c3',
      description: '户外绿荫背景，顶部两行黄字（黑描边+白外框+硬投影）配闪光星和灯泡，黑色细条“A × B 对谈”，下方双人并排（第二人物可单独上传），左侧白色思考气泡，右侧白色手写问句',
      layers: [bg('#3E5233'), IMG('assets/backgrounds/park.jpg', { filter: 'brightness(0.85) saturate(1.1)' }),
        PERSON({ x: 0, y: 36, w: 100, h: 64, sticker: null, withP2: { x: -4, y: 38, w: 58, h: 62 } }),
        PERSON({ id: 'person2', binding: 'person2', needPerson2: true, x: 46, y: 37, w: 58, h: 63, sticker: null }),
        T({ x: 8, y: 2, w: 84, h: 27, splitOn: '[/／]', fit: 'width', maxFontSize: 16, lineHeight: 1.06, ...YW, sample: 'AI时代的/超级个体' }),
        { id: 'sp1', type: 'shape', visible: true, shape: 'sparkle', square: true, x: 3, y: 5, w: 7, h: 5, fill: '#FFFFFF' },
        { id: 'sp2', type: 'shape', visible: true, shape: 'sparkle', square: true, x: 91, y: 9, w: 6, h: 4.5, fill: '#FFFFFF' },
        ICON('bulb', 'bulb', 2, 16, 8, { tile: false, color: '#FFFFFF', accent: Y }),
        S({ x: 16, y: 29, w: 68, h: 5, fit: null, fontSize: 3.4, maxFontSize: 3.4, color: '#FFFFFF', banner: { fill: K, paddingX: 1.6, paddingY: 0.5, radius: 0.3 }, highlight: { color: Y }, sample: '主播来了 × 嘉宾 *对谈*' }),
        BD({ x: 3, y: 36, w: 17, h: 7, shape: 'bubble', radius: 3.4, tail: { side: 'bottom', pos: 0.7, size: 1.8 }, bg: '#FFFFFF', color: K, ...F_SMILEY, fontSize: 3.2, border: { color: K, width: 0.3 }, sample: '深度思考' }),
        TG({ x: 78, y: 33, w: 20, h: 8, ...F_SMILEY, splitOn: '[/／]', fit: null, fontSize: 2.8, maxFontSize: 2.8, lineHeight: 1.2, color: '#FFFFFF', rotate: 6, hardShadow: { color: 'rgba(0,0,0,0.6)', dx: 0.2, dy: 0.3 }, sample: '超级个体/如何打造?' }),
      ] }),

    /* ref10-r2c1 现场实录：上下两行黄字黑描边夹击，双人站立在中间 */
    rep({ id: 'ref10-r2c1', name: 'R10·现场实录', style: '复刻·上下夹字', source: 'ref10-r2c1',
      description: '明亮办公室实拍背景，顶部黄字黑描边“现场实录”，底部同款更大字，双人站在中间区域（上下夹击但不碰人物）',
      layers: [bg('#EDEDED'), IMG('assets/ref10/office.jpg'),
        PERSON({ x: 2, y: 19, w: 96, h: 62, sticker: null, withP2: { x: 6, y: 20, w: 50, h: 60 } }),
        PERSON({ id: 'person2', binding: 'person2', needPerson2: true, x: 44, y: 19, w: 52, h: 61, sticker: null }),
        T({ x: 4, y: 3, w: 92, h: 15, fit: 'width', maxFontSize: 20, color: Y, stroke: { color: K, ratio: 0.16 }, hardShadow: { color: K, dx: 0.4, dy: 0.6 }, sample: '现场实录' }),
        S({ x: 4, y: 82, w: 92, h: 15, fit: 'width', maxFontSize: 20, color: Y, letterSpacing: 0.06, stroke: { color: K, ratio: 0.16 }, hardShadow: { color: K, dx: 0.4, dy: 0.6 }, sample: '创业日记' }),
      ] }),

    /* ref10-r2c2 零基础必看：两行黄白大字 + 左白气泡 + 右绿色三项勾选卡 */
    rep({ id: 'ref10-r2c2', name: 'R10·3分钟做爆款', style: '复刻·气泡+要点', source: 'ref10-r2c2',
      description: '暗色工作室背景，顶部两行粗字（第一行黄，第二行白+黄关键词，黑描边），人物居中下方，左侧白色圆角气泡“零基础必看”，右侧浅绿圆角卡 3 条 ✓ 要点',
      layers: [bg('#1A1A1A'), IMG('assets/backgrounds/desk.jpg', { filter: 'brightness(0.55)' }),
        PERSON({ x: 16, y: 32, w: 68, h: 68, sticker: { width: 0.5, color: '#FFFFFF', shadow: null, soft: false } }),
        T({ x: 4, y: 3, w: 92, h: 14, fit: 'width', maxFontSize: 18, color: Y, stroke: { color: K, ratio: 0.14 }, strokeOuter: { color: '#FFFFFF', ratio: 0.1 }, sample: '跟着老师学' }),
        S({ x: 4, y: 17, w: 92, h: 13, fit: 'width', maxFontSize: 16, color: '#FFFFFF', highlight: { color: Y }, stroke: { color: K, ratio: 0.14 }, autoHighlight: null, sample: '3分钟*做爆款*封面' }),
        { id: 'sl1', type: 'shape', visible: true, shape: 'sparkle', square: true, x: 2, y: 3, w: 5, h: 4, fill: Y },
        BD({ x: 3, y: 42, w: 20, h: 12, shape: 'bubble', radius: 5, tail: { side: 'right', pos: 0.6, size: 2 }, bg: '#FFFFFF', color: K, fontSize: 3.8, border: { color: K, width: 0.4 }, sample: '零基础\n必看' }),
        { id: 'card', type: 'shape', visible: true, shape: 'rect', radius: 2, x: 72, y: 41, w: 26, h: 19, fill: '#BDF3B5', border: { color: K, width: 0.35 }, hardShadow: { color: K, dx: 0.5, dy: 0.6 }, rotate: -4 },
        TG({ x: 73.5, y: 42.5, w: 23, h: 16, splitOn: '[/／]', fit: null, fontSize: 3, maxFontSize: 3, align: 'left', valign: 'middle', lineHeight: 1.75, color: K, rotate: -4, listPrefix: ['✅ ', '✅ ', '✅ '], sample: '选题策划/视觉设计/数据复盘' }),
      ] }),

    /* ref10-r2c3 图标环绕：白字“1人顶1个团!”（数字黄）+ 人物周围 8 个圆角图标 + 底部黄条 */
    rep({ id: 'ref10-r2c3', name: 'R10·一人顶一个团', style: '复刻·图标环绕', source: 'ref10-r2c3',
      description: '暗色室内，顶部白色粗字（数字黄、感叹号），白色副标题，人物居中，周围 8 个白色圆角图标卡（机器人/流程/图表/齿轮/闪电/清单/靶心/灯泡）配小标签和手绘箭头，底部黄色横条（数字黑框高亮）',
      layers: [bg('#121212'), IMG('assets/ref10/studio.jpg', { filter: 'brightness(0.6)' }),
        PERSON({ x: 22, y: 30, w: 56, h: 60, sticker: { width: 0.4, color: '#FFFFFF', shadow: null, soft: false } }),
        T({ x: 3, y: 2.5, w: 94, h: 13, fit: 'width', maxFontSize: 18, color: '#FFFFFF', highlight: { color: Y }, autoHighlight: 'digits', hardShadow: { color: 'rgba(0,0,0,0.6)', dx: 0.3, dy: 0.5 }, sample: '1人顶1个团!' }),
        S({ x: 4, y: 15.5, w: 92, h: 6, fit: 'width', maxFontSize: 7, color: '#FFFFFF', sample: 'AI+流程 自动化全公开' }),
        ICON('i1', 'robot', 4, 26, 13, { label: 'AI助手' }),
        ICON('i2', 'flow', 43.5, 23, 13, { label: '工作流' }),
        ICON('i3', 'chart', 83, 25, 13, { label: '数据驱动' }),
        ICON('i4', 'gear', 3, 44, 13, { label: '自动化' }),
        ICON('i5', 'bolt', 3, 62, 13, { label: '高效执行' }),
        ICON('i6', 'list', 84, 46, 13, { label: '任务管理' }),
        ICON('i7', 'target', 84, 64, 13, { label: '目标达成' }),
        ICON('i8', 'bulb', 87, 81, 9, { tile: false, color: '#FFFFFF' }),
        { id: 'arr1', type: 'shape', visible: true, shape: 'arrow', x: 15, y: 39, w: 8, h: 5, fill: '#FFFFFF', rotate: 40 },
        { id: 'arr2', type: 'shape', visible: true, shape: 'arrow', x: 78, y: 40, w: 7, h: 5, fill: '#FFFFFF', rotate: 140 },
        BD({ x: 8, y: 89, w: 84, h: 7.5, bg: Y, color: K, fontSize: 4.6, radius: 0.4, border: { color: K, width: 0.3 }, rotate: -1.5, sample: '主理人 10 年经验总结' }),
        { id: 'sp', type: 'shape', visible: true, shape: 'star', square: true, x: 2, y: 88, w: 5, h: 4, fill: Y },
      ] }),

    /* ref10-r3c1 旅行手账拼贴：手写白色标题 + 多张人物小照片卡 + 牛皮纸便签 */
    rep({ id: 'ref10-r3c1', name: 'R10·一日漫游手账', style: '复刻·旅行手账', source: 'ref10-r3c1',
      description: '复古旅行拼贴底（古迹照片+旧地图+速写），顶部白色手写体大标题+小字地点，人物主图居中，左右 3 张白边小照片卡，牛皮纸小便签写碎碎念',
      layers: [bg('#D8C8A8'), IMG('assets/ref10/rome.jpg'),
        T({ x: 6, y: 3, w: 84, h: 13, ...F_SMILEY, fit: 'width', maxFontSize: 16, color: '#FFFFFF', align: 'left', rotate: -4, hardShadow: { color: 'rgba(0,0,0,0.45)', dx: 0.3, dy: 0.4 }, sample: '城市一日漫游' }),
        S({ x: 30, y: 14, w: 60, h: 3.6, ...F_SMILEY, fit: null, fontSize: 2.8, maxFontSize: 2.8, align: 'left', color: '#FFFFFF', rotate: -4, sample: '老街 · 博物馆 · 小酒馆' }),
        SLOT({ id: 'c1', x: 66, y: 22, w: 30, h: 18, rotate: 4, radius: 0.2, focusY: 20, zoom: 1.4, frame: { width: 0.8, color: '#FFFFFF', shadow: 'rgba(0,0,0,0.35)' } }),
        SLOT({ id: 'c2', x: 1, y: 46, w: 26, h: 22, rotate: -3, radius: 0.2, focusY: 20, zoom: 1.2, frame: { width: 0.8, color: '#FFFFFF', shadow: 'rgba(0,0,0,0.35)' } }),
        SLOT({ id: 'c3', x: 70, y: 58, w: 28, h: 18, rotate: 3, radius: 0.2, focusY: 20, zoom: 1.3, frame: { width: 0.8, color: '#FFFFFF', shadow: 'rgba(0,0,0,0.35)' } }),
        PERSON({ x: 20, y: 24, w: 56, h: 76, sticker: { width: 0.9, color: '#FFFFFF', shadow: { color: 'rgba(0,0,0,0.4)', dx: 0.4, dy: 0.6 } } }),
        ...[0, 1, 2].map((i) => BD({ id: 'note' + i, binding: 'static', x: [6, 70, 3][i], y: [24, 43, 82][i], w: 22, h: 6.5, bg: '#E9D9B8', color: '#3B2A1C', ...F_SMILEY, fontSize: 2.6, radius: 0.2, rotate: [-5, 4, -3][i], hardShadow: { color: 'rgba(0,0,0,0.25)', dx: 0.3, dy: 0.4 },
          sample: ['第一次来\n就爱上了', '许个愿吧\n下次再来', '在街角\n迷路了'][i] })),
        { id: 'tape1', type: 'shape', visible: true, shape: 'tape', x: 74, y: 20, w: 10, h: 3, fill: 'rgba(240,230,200,0.85)', rotate: -20 },
      ] }),

    /* ref10-r3c2 作品卡展示：暗红黑底 + 黄字黑描边标题 + 3 张倾斜金边卡片 + 左下人物 + 右下黄字 */
    rep({ id: 'ref10-r3c2', name: 'R10·做封面技能', style: '复刻·作品卡片', source: 'ref10-r3c2',
      description: '深红到黑的放射渐变，顶部黄色粗字黑描边，中部 3 张倾斜卡片（金色描边，放人物照片）叠放，人物抠图左下竖大拇指，右下黄字黑描边结论',
      layers: [bg({ type: 'radial', stops: [{ offset: 0, color: '#5A0F14' }, { offset: 1, color: '#120406' }] }, { pattern: { type: 'stripes', angle: 45, color: 'rgba(255,255,255,0.03)', size: 2, gap: 5 } }),
        T({ x: 4, y: 2.5, w: 92, h: 15, fit: 'width', maxFontSize: 20, color: Y, stroke: { color: K, ratio: 0.14 }, hardShadow: { color: K, dx: 0.5, dy: 0.7 }, sample: 'AI做封面' }),
        ...[0, 1, 2].map((i) => SLOT({ id: 'card' + i, x: [4, 35, 66][i], y: [21, 20, 21][i], w: 30, h: 38, rotate: [-6, 0, 6][i], radius: 1.2, focusY: [20, 25, 22][i], zoom: [1.1, 1.0, 1.15][i], filter: ['sepia(0.3)', 'saturate(1.2)', 'contrast(1.1)'][i],
          frame: { width: 0.6, color: '#E8B84A', shadow: 'rgba(0,0,0,0.6)' } })),
        PERSON({ x: 0, y: 58, w: 48, h: 42, sticker: { width: 0.4, color: '#FFFFFF', shadow: null, soft: false } }),
        S({ x: 44, y: 81, w: 54, h: 12, fit: 'width', maxFontSize: 14, color: Y, stroke: { color: K, ratio: 0.14 }, hardShadow: { color: K, dx: 0.4, dy: 0.6 }, sample: '技能大公开' }),
      ] }),

    /* ref10-r3c3 科幻太空：黄字黑描边“XX变天了”+白副标，人物居中，霓虹太空背景，右下绿色旗帜标签 */
    rep({ id: 'ref10-r3c3', name: 'R10·行业变天了', style: '复刻·霓虹科幻', source: 'ref10-r3c3',
      description: '深蓝太空背景（月面、火箭、霓虹光轨、全息面板），顶部黄色粗字黑描边+白色副标题，人物抠图居中，右下绿色旗帜标签',
      layers: [bg('#070B24'), IMG('assets/ref10/space.jpg'),
        PERSON({ x: 16, y: 26, w: 68, h: 70, sticker: { width: 0.6, color: '#9EE7FF', shadow: { color: 'rgba(80,160,255,0.6)', dx: 0, dy: 0 } } }),
        T({ x: 4, y: 2.5, w: 92, h: 15, fit: 'width', maxFontSize: 20, color: Y, stroke: { color: K, ratio: 0.14 }, hardShadow: { color: K, dx: 0.5, dy: 0.7 }, sample: '行业变天了' }),
        S({ x: 8, y: 17.5, w: 84, h: 8, fit: 'width', maxFontSize: 9, color: '#FFFFFF', stroke: { color: K, ratio: 0.12 }, sample: 'AI 创业新物种' }),
        ICON('flag', 'flag', 74, 79, 8, { tile: false, color: '#FFFFFF', accent: '#22C55E' }),
        BD({ x: 74, y: 87, w: 22, h: 6, bg: '#16A34A', color: '#FFFFFF', fontSize: 3, radius: 0.4, border: { color: '#BBF7D0', width: 0.25 }, sample: '创业新大陆' }),
      ] }),
  ];
  R.forEach((t) => { t.builtinRef = true; B.push(t); });
})();
