/**
 * v1.6 参考图复刻模板（只复刻版式，不含参考图素材/文案）
 * id 里带来源：refN-rRcC = /workspace/refs2/refN.jpg 第 R 行第 C 列；对应关系见 README「参考图 → 模板映射」
 * 坐标为百分比；字号为短边百分比；标题/副标题用 / 或 、 分段（part 图层按段取字）
 */
(function () {
  const B = window.CoverTemplates.BUILTIN;
  const F_BLACK = { fontFamily: 'Noto Sans SC', fontWeight: '900' };
  const F_BOLD = { fontFamily: 'Noto Sans SC', fontWeight: '700' };
  const F_SERIF = { fontFamily: 'Noto Serif SC', fontWeight: '900' };
  const F_SMILEY = { fontFamily: 'Smiley Sans', fontWeight: '400' };
  const F_KL = { fontFamily: 'ZCOOL KuaiLe', fontWeight: '400' };
  const SH = (a = 0.35) => [{ from: 0, to: 32, c0: `rgba(0,0,0,${a})`, c1: 'rgba(0,0,0,0)' }, { from: 62, to: 100, c0: 'rgba(0,0,0,0)', c1: `rgba(0,0,0,${a + 0.2})` }];
  const bg = (fill, extra) => ({ id: 'bg', type: 'background', visible: true, fill, ...(extra || {}) });
  const T = (o) => ({ id: 'title', type: 'text', visible: true, binding: 'title', x: 5, y: 5, w: 90, h: 18, ...F_BLACK, fontSize: 14, fit: 'width', maxFontSize: 18, color: '#FFFFFF', align: 'center', valign: 'middle', lineHeight: 1.06, ...o });
  const S = (o) => ({ id: 'subtitle', type: 'text', visible: true, binding: 'subtitle', x: 8, y: 26, w: 84, h: 7, ...F_BLACK, fontSize: 5, fit: 'width', maxFontSize: 5.6, color: '#FFFFFF', align: 'center', valign: 'middle', lineHeight: 1.2, ...o });
  const TG = (o) => S({ id: 'tagline', binding: 'tagline', ...o });
  const BD = (o) => ({ id: 'badge', type: 'badge', visible: true, binding: 'badge', shape: 'rect', radius: 1, x: 6, y: 30, w: 20, h: 6, bg: '#111111', color: '#FFFFFF', ...F_BLACK, fontSize: 3.6, ignoreFace: true, ...o });
  const PERSON = (o) => ({ id: 'person', type: 'image', binding: 'person', visible: true, x: 10, y: 30, w: 80, h: 72, fit: 'contain', align: 'bottom', radius: 0,
    sticker: { width: 1.1, color: '#FFFFFF', shadow: { color: 'rgba(0,0,0,0.55)', dx: 0.6, dy: 0.8 } }, ...o });
  const OCC = (y, at) => ({ id: 'occ', type: 'occluder', clipY: y, at: at || { wide: { clipY: 100 } } });
  const photoT = (o) => ({ preferredRatio: '3:4', series: 'talk', defaultPersonMode: 'photo', defaultOcclude: true, defaultScene: 'living', sceneDefaults: { blur: 5, bright: 0, tint: 15 }, autoWide: 'left', ...o });
  const stickerT = (o) => ({ preferredRatio: '3:4', series: 'xhs', autoWide: 'left', ...o });
  const SLOT = (o) => ({ id: 'slot', type: 'photoSlot', visible: true, x: 10, y: 10, w: 40, h: 30, focusY: 30, radius: 1, ...o });

  const R = [
    /* ref1-r1c1 面试逆袭：顶部黄字黑描边 + 头周围 3 个倾斜问题标签 + 底部白色巨字（关键词黄） */
    photoT({ id: 'ref1-r1c1-float-tags', name: '浮动问题标签', style: '口播·问题标签', source: 'ref1-r1c1, ref1-r3c3, ref9-r2c1',
      description: '人物照铺满，顶部黄字黑描边大标题，头部两侧 3 个倾斜黄色问题标签（副标题用 / 分 3 段），底部白色巨字结论',
      photo: { focusY: 28, offsetY: 6, shade: SH(0.35) },
      layers: [bg('#2A2A2A'), PERSON({ onlySticker: true }),
        T({ y: 3.5, h: 17, color: '#FFE14D', stroke: { color: '#111111', ratio: 0.14 }, strokeOuter: { color: '#FFFFFF', ratio: 0.26 }, hardShadow: { color: '#111111' }, maxFontSize: 19, sample: '口播*逆袭*', highlight: { color: '#FFFFFF' } }),
        OCC(20),
        ...[0, 1, 2].map((i) => S({ id: 'tag' + i, part: i, parts: 3, x: [4, 64, 62][i], y: [30, 27, 38][i], w: 34, h: 6.5, fit: null, fontSize: 4.4, maxFontSize: 4.4, color: '#111111', rotate: [-8, 7, -5][i],
          banner: { fill: '#FFE14D', paddingX: 1.4, paddingY: 0.8, radius: 0.6, shadow: { color: '#111', dx: 0.4, dy: 0.5 } }, ignoreFace: true, bleed: true, align: i ? 'left' : 'left',
          sample: '3个开场雷区/语速怎么控/镜头感技巧', noRatio: true })),
        TG({ x: 4, y: 82, w: 92, h: 13, fontSize: 11, maxFontSize: 12, color: '#FFFFFF', stroke: { color: '#111111', ratio: 0.12 }, hardShadow: { color: '#111111', dx: 0.5, dy: 0.6 }, highlight: { color: '#FFE14D' }, sample: '新手口播 *干货*', noRatio: true }),
      ] }),

    /* ref1-r1c2 低情商 VS 高教养：浅色照片 + 左上深色粗字两行 + 强调色 VS + 小字盒 + 手写尾注 */
    photoT({ id: 'ref1-r1c2-vs-words', name: '文字VS对比', style: '小红书·文字对比', source: 'ref1-r1c2',
      description: '浅色生活照，左上两行深色粗字，中间强调色 VS；小字说明框 + 底部得意黑手写感尾注',
      photo: { focusY: 30, focusX: 30, shade: [{ from: 0, to: 40, c0: 'rgba(255,255,255,0.45)', c1: 'rgba(255,255,255,0)' }] }, defaultOcclude: false, autoWide: 'right',
      layers: [bg('#EDE7DD'), PERSON({ onlySticker: true, x: 0, w: 70, halign: 'left' }),
        T({ x: 44, y: 4, w: 52, h: 34, align: 'left', valign: 'top', splitOn: '[/／]', color: '#1A1A1A', maxFontSize: 15, lineHeight: 1.12, highlight: { color: '#E0A100' }, stroke: { color: '#FFFFFF', ratio: 0.04 }, sample: '新手剪辑*VS*/老手剪辑' }),
        BD({ x: 62, y: 40, w: 32, h: 6, bg: '#FFFFFF', color: '#1A1A1A', ...F_SERIF, fontSize: 3.4, border: { color: '#1A1A1A', width: 0.3 }, sample: '10个审美细节' }),
        TG({ x: 6, y: 86, w: 88, h: 8, ...F_SMILEY, fontSize: 7, maxFontSize: 7, color: '#FFFFFF', shadow: { color: 'rgba(0,0,0,0.5)', blur: 1 }, sample: '悄悄提升你的成片质感' }),
      ] }),

    /* ref1-r1c3 自由职业：黄+蓝双色巨字 + 底部深色横条（英文小标 + 黄红大字） */
    photoT({ id: 'ref1-r1c3-bottom-band', name: '双色巨字+底条', style: '口播·底部横条', source: 'ref1-r1c3, ref2-r2c3',
      description: '顶部双色巨字（*强调词*换色），右侧小竖注；底部深色横条放结论大字，适合观点/经验类口播',
      photo: { focusY: 26, offsetY: 4, shade: [{ from: 0, to: 30, c0: 'rgba(0,0,0,0.3)', c1: 'rgba(0,0,0,0)' }] },
      layers: [bg('#3A2E22'), PERSON({ onlySticker: true }),
        T({ y: 3, h: 18, color: '#FFE14D', highlight: { color: '#3B82F6' }, stroke: { color: '#111', ratio: 0.06 }, hardShadow: { color: 'rgba(0,0,0,0.45)', dx: 0.5, dy: 0.6 }, maxFontSize: 20, sample: '自由*口播*' }),
        OCC(18),
        BD({ x: 80, y: 24, w: 14, h: 7, bg: '#FFFFFF', color: '#111', fontSize: 2.8, sample: '只聊干货' }),
        { id: 'band', type: 'shape', visible: true, shape: 'rect', x: 0, y: 82, w: 100, h: 18, fill: '#1F1A14', at: { wide: { x: 0, y: 80, w: 100, h: 20 } } },
        TG({ x: 6, y: 80.5, w: 88, h: 3.2, ...F_BOLD, fontSize: 2.8, maxFontSize: 2.8, color: '#FFE14D', align: 'left', fit: null, sample: 'PASSION · SKILL · INCOME', letterSpacing: 0.2, tiny: true, noRatio: true, at: { wide: { x: 4, w: 40 } } }),
        S({ x: 5, y: 85, w: 90, h: 12, fontSize: 8, maxFontSize: 8.4, color: '#FFFFFF', highlight: { color: '#FFE14D' }, sample: '把爱好变成*作品*', at: { wide: { x: 4, y: 84, w: 92 } } }),
      ] }),

    /* ref1-r2c1 万赞封面：放射线背景 + 抠图人物 + 顶/底黄白大字 + 五边形标签 */
    stickerT({ id: 'ref1-r2c1-burst-rays', name: '放射线爆款', style: '口播·放射线', source: 'ref1-r2c1, ref9-r2c2',
      description: '黄白放射线背景，人物抠图白边居中，顶部黑描边黄字，底部白字黑描边，两侧星形标签（副标题 / 分段）',
      layers: [bg({ type: 'radial', stops: [{ offset: 0, color: '#FFF8D6' }, { offset: 1, color: '#FFD23F' }] }, { pattern: { type: 'rays', color: 'rgba(255,255,255,0.55)', count: 28 } }),
        PERSON({ x: 12, y: 22, w: 76, h: 66 }),
        T({ y: 3.5, h: 16, color: '#FFE14D', stroke: { color: '#111111', ratio: 0.14 }, strokeOuter: { color: '#FFFFFF', ratio: 0.28 }, hardShadow: { color: '#111111' }, maxFontSize: 18, sample: '万赞口播' }),
        ...[0, 1].map((i) => S({ id: 'tag' + i, part: i, parts: 2, x: i ? 70 : 3, y: i ? 46 : 38, w: 27, h: 12, fit: null, fontSize: 4.4, maxFontSize: 4.4, color: '#111', lineHeight: 1.15, rotate: i ? 8 : -8, bleed: true, noRatio: true,
          banner: { fill: '#FFE14D', paddingX: 1.4, paddingY: 1.2, radius: 2, border: { color: '#111', width: 0.4 }, shadow: { color: '#111', dx: 0.5, dy: 0.6 } }, ignoreFace: true, sample: '踩准热点/高频句式' })),
        BD({ x: 6, y: 24, w: 18, h: 8, shape: 'burst', points: 12, inner: 0.8, bg: '#E11D2E', color: '#FFF', fontSize: 3.4, rotate: -10, sample: '必看' }),
        TG({ x: 4, y: 84, w: 92, h: 12, fontSize: 11, maxFontSize: 12, color: '#FFFFFF', stroke: { color: '#111', ratio: 0.14 }, hardShadow: { color: '#111' }, sample: '防踩坑指南', noRatio: true }),
      ] }),

    /* ref1-r3c1 无脑营销套路：蓝字黄描边 + 白边抠图 + 蓝色小标签 */
    stickerT({ id: 'ref1-r3c1-blue-sticker', name: '蓝黄贴纸字', style: '口播·蓝黄贴纸', source: 'ref1-r3c1',
      description: '室内背景虚化 + 白边抠图人物；顶部蓝字黄外描边，底部同款结论大字，3 个蓝色小标签环绕',
      defaultScene: 'living',
      layers: [bg({ type: 'linear', angle: 90, stops: [{ offset: 0, color: '#DCE7F5' }, { offset: 1, color: '#9DB4D3' }] }),
        PERSON({ x: 14, y: 22, w: 72, h: 68 }),
        T({ y: 3.5, h: 15, color: '#1D4ED8', stroke: { color: '#FFFFFF', ratio: 0.1 }, strokeOuter: { color: '#FFE14D', ratio: 0.28 }, hardShadow: { color: '#0B1F55' }, maxFontSize: 16, sample: '口播开场套路' }),
        ...[0, 1, 2].map((i) => S({ id: 'tag' + i, part: i, parts: 3, x: [4, 72, 72][i], y: [58, 52, 60][i], w: 24, h: 5, fit: null, fontSize: 3.4, maxFontSize: 3.4, color: '#FFFFFF', rotate: [-6, 6, -4][i], bleed: true, noRatio: true,
          banner: { fill: '#1D4ED8', paddingX: 1.2, paddingY: 0.7, radius: 2.4, border: { color: '#FFE14D', width: 0.3 } }, ignoreFace: true, sample: '反套路/抓注意力/制造期待' })),
        TG({ x: 4, y: 84, w: 92, h: 12, fontSize: 11, maxFontSize: 12, color: '#1D4ED8', stroke: { color: '#FFFFFF', ratio: 0.1 }, strokeOuter: { color: '#FFE14D', ratio: 0.28 }, hardShadow: { color: '#0B1F55' }, sample: '都来学！', noRatio: true }),
      ] }),

    /* ref1-r3c2 全屋/智能：四角大白字 + 中间黄色横幅 */
    photoT({ id: 'ref1-r3c2-corner-chars', name: '四角大字', style: '口播·四角大字', source: 'ref1-r3c2, ref7-r2c1, ref7-r2c2, ref7-r2c3',
      description: '人物照铺满，标题 4 个字分到四角（白色超大），中部黄色横幅放副标题，头部压住上方字',
      photo: { focusY: 30, shade: SH(0.4) },
      layers: [bg('#2E2E2E'), PERSON({ onlySticker: true }),
        ...[0, 1].map((i) => T({ id: 'title-' + i, part: i, parts: 4, x: i ? 64 : 3, y: 3, w: 33, h: 22, fontSize: 26, maxFontSize: 30, bleed: true, hardShadow: { color: 'rgba(0,0,0,0.4)', dx: 0.5, dy: 0.7 }, sample: '拍剪/口播/干货/合集' })),
        OCC(24),
        S({ x: 14, y: 56, w: 72, h: 12, fontSize: 7, maxFontSize: 7.4, color: '#111111', splitOn: '[/／]', lineHeight: 1.12,
          banner: { fill: '#FFE14D', paddingX: 2.4, paddingY: 1.2, radius: 0.6, shadow: { color: '#111', dx: 0.6, dy: 0.6 } }, sample: '新手做口播/一步到位', at: { wide: { x: 30, y: 60, w: 40 } } }),
        ...[2, 3].map((i) => T({ id: 'title-' + i, part: i, parts: 4, x: i === 2 ? 3 : 64, y: 76, w: 33, h: 22, fontSize: 26, maxFontSize: 30, bleed: true, hardShadow: { color: 'rgba(0,0,0,0.4)', dx: 0.5, dy: 0.7 }, sample: '拍剪/口播/干货/合集' })),
      ] }),

    /* ref2-r1c1 彩色粗边框 + 底部宋体两行 + 花括号强调 */
    photoT({ id: 'ref2-r1c1-color-frame', name: '彩色边框金句', style: '小红书·彩框', source: 'ref2-r1c1',
      description: '洋红粗边框包住照片，底部两行宋体粗字（*强调*用黄色），适合观点/金句',
      photo: { x: 3.5, y: 2.6, w: 93, h: 94.8, focusY: 24, shade: [{ from: 60, to: 100, c0: 'rgba(0,0,0,0)', c1: 'rgba(0,0,0,0.6)' }] },
      layers: [bg('#E11D8C'), PERSON({ onlySticker: true }),
        T({ x: 6, y: 70, w: 88, h: 24, ...F_SERIF, splitOn: '[/／]', maxFontSize: 11, lineHeight: 1.15, highlight: { color: '#FFE14D' }, shadow: { color: 'rgba(0,0,0,0.5)', blur: 1 }, sample: '建议所有人/{*少想多做*}直接开拍' }),
      ] }),

    /* ref2-r1c3 引号金句：底部黄色宋体 + 大引号 */
    photoT({ id: 'ref2-r1c3-quote-serif', name: '引号金句', style: '小红书·引号宋体', source: 'ref2-r1c3, ref5-r3c2',
      description: '照片铺满，底部「“ ”」大引号包住黄色宋体关键词，上方一行小字引子',
      photo: { focusY: 22, shade: [{ from: 58, to: 100, c0: 'rgba(0,0,0,0)', c1: 'rgba(0,0,0,0.6)' }] }, defaultOcclude: false,
      layers: [bg('#3A3A3A'), PERSON({ onlySticker: true }),
        S({ x: 10, y: 74, w: 80, h: 5, ...F_SERIF, fontSize: 3.6, maxFontSize: 3.6, color: '#FFFFFF', sample: '打破你的拍摄瓶颈' }),
        { id: 'q1', type: 'text', visible: true, binding: 'static', x: 3, y: 76, w: 12, h: 14, ...F_SERIF, fontSize: 14, color: '#E11D2E', align: 'left', valign: 'top', sample: '“', bleed: true, ignoreFace: true },
        T({ x: 12, y: 79, w: 76, h: 12, ...F_SERIF, maxFontSize: 11, color: '#FFE14D', shadow: { color: 'rgba(0,0,0,0.5)', blur: 1 }, sample: '进阶·破局·提升' }),
        { id: 'q2', type: 'text', visible: true, binding: 'static', x: 85, y: 76, w: 12, h: 14, ...F_SERIF, fontSize: 14, color: '#E11D2E', align: 'right', valign: 'top', sample: '”', bleed: true, ignoreFace: true },
      ] }),

    /* ref2-r3c1 文艺故事：左侧三层不等大字（小-中-大），柔绿色 */
    photoT({ id: 'ref2-r3c1-story', name: '人物故事', style: '小红书·文艺故事', source: 'ref2-r3c1, ref2-r3c2',
      description: '风景/人物照，左侧三层字号递增（地点小字 → 人物中字 → 故事大字），柔和绿白配色，纪录片感',
      photo: { focusY: 30, focusX: 62, shade: [{ from: 30, to: 100, c0: 'rgba(0,0,0,0)', c1: 'rgba(0,0,0,0.45)' }] }, defaultOcclude: false,
      layers: [bg('#5C6B4E'), PERSON({ onlySticker: true }),
        TG({ x: 6, y: 44, w: 50, h: 9, align: 'left', ...F_SERIF, fontSize: 8, maxFontSize: 8, color: '#C9F27A', shadow: { color: 'rgba(0,0,0,0.4)', blur: 1 }, sample: '城市角落', noRatio: true }),
        S({ x: 6, y: 54, w: 60, h: 7, align: 'left', ...F_BOLD, fontSize: 5, maxFontSize: 5, color: '#C9F27A', shadow: { color: 'rgba(0,0,0,0.4)', blur: 1 }, sample: '一个剪辑师的' }),
        T({ x: 6, y: 62, w: 60, h: 20, align: 'left', ...F_SERIF, maxFontSize: 18, color: '#FFFFFF', shadow: { color: 'rgba(0,0,0,0.45)', blur: 1.2 }, sample: '故事' }),
        BD({ x: 80, y: 4, w: 14, h: 4, bg: 'transparent', color: '#FFFFFF', ...F_SERIF, fontSize: 2.8, sample: '—— 第3期' }),
      ] }),

    /* ref2-r3c3 巨型描边数字 */
    photoT({ id: 'ref2-r3c3-big-number', name: '巨型描边数字', style: '小红书·巨型数字', source: 'ref2-r3c3',
      description: '人物在左，右侧超大荧光绿空心数字（标题），旁边小字单位；底部一行说明',
      photo: { focusY: 30, focusX: 30, shade: [{ from: 70, to: 100, c0: 'rgba(0,0,0,0)', c1: 'rgba(0,0,0,0.5)' }] }, defaultOcclude: false, autoWide: 'right',
      layers: [bg('#B9A88F'), PERSON({ onlySticker: true }),
        T({ x: 54, y: 8, w: 40, h: 30, fit: 'width', maxFontSize: 32, lineHeight: 0.92, color: 'rgba(0,0,0,0)', stroke: { color: '#7CFF3A', ratio: 0.07 }, hardShadow: null, shadow: { color: 'rgba(0,0,0,0.35)', blur: 1 }, bleed: true, autoHighlight: null, sample: '30' }),
        BD({ x: 82, y: 36, w: 14, h: 8, bg: 'transparent', color: '#FFFFFF', ...F_SMILEY, fontSize: 7, sample: '天' }),
        S({ x: 5, y: 86, w: 90, h: 8, fontSize: 5.6, maxFontSize: 5.6, color: '#FFFFFF', shadow: { color: 'rgba(0,0,0,0.5)', blur: 1 }, sample: '坚持日更口播的变化' }),
      ] }),

    /* ref4-r1c3 金色斜体大数字（黑金） */
    photoT({ id: 'ref4-r1c3-gold-number', name: '黑金大数字', style: '小红书·黑金数字', source: 'ref4-r1c3, ref6-r2c2, ref5-r3c2',
      description: '暗调照片，顶部白色宋体一行，左侧金色斜体超大数字+硬阴影，小字资历标签，底部金色问句',
      photo: { focusY: 26, focusX: 60, shade: SH(0.45) }, defaultScene: 'studio', defaultOcclude: false,
      layers: [bg('#1A1612'), PERSON({ onlySticker: true }),
        S({ x: 5, y: 3, w: 90, h: 9, ...F_SERIF, fontSize: 7, maxFontSize: 7.4, color: '#FFFFFF', shadow: { color: 'rgba(0,0,0,0.5)', blur: 1 }, sample: '观众留存率', noRatio: true }),
        T({ x: 4, y: 12, w: 40, h: 16, align: 'left', ...F_SERIF, italic: true, maxFontSize: 20, color: { type: 'linear', angle: 90, stops: [{ offset: 0, color: '#FFE7A3' }, { offset: 1, color: '#C99A2E' }] }, hardShadow: { color: '#2A1E08', dx: 0.6, dy: 0.8 }, autoHighlight: null, sample: '85%' }),
        OCC(24),
        BD({ x: 5, y: 48, w: 26, h: 5, bg: 'transparent', color: '#FFFFFF', ...F_SERIF, fontSize: 2.8, sample: '剪辑经验 8 年' }),
        TG({ x: 4, y: 82, w: 92, h: 12, ...F_SERIF, italic: true, fontSize: 9, maxFontSize: 9.4, color: '#E9C25A', hardShadow: { color: '#2A1E08', dx: 0.4, dy: 0.6 }, sample: '我做对了什么？', noRatio: true }),
      ] }),

    /* ref4-r1c1 粉白混排杂志 IP */
    photoT({ id: 'ref4-r1c1-pink-ip', name: '粉白杂志混排', style: '小红书·粉白杂志', source: 'ref4-r1c1, ref6-r1c3',
      description: '顶部粉+白粗字一行，右侧大号衬线数字+小字资历，底部超大白字（*关键词*粉色），杂志访谈感',
      photo: { focusY: 22, shade: SH(0.3) },
      layers: [bg('#8A8F96'), PERSON({ onlySticker: true }),
        T({ y: 3, h: 13, align: 'left', x: 5, w: 80, maxFontSize: 13, color: '#FFFFFF', highlight: { color: '#FF4D8D' }, hardShadow: { color: 'rgba(0,0,0,0.3)', dx: 0.4, dy: 0.5 }, sample: '*为什么*你的' }),
        BD({ x: 68, y: 52, w: 28, h: 10, bg: 'transparent', color: '#FFFFFF', ...F_SERIF, fontSize: 9, sample: '8年' }),
        S({ x: 4, y: 50, w: 34, h: 6, align: 'left', ...F_SERIF, fontSize: 3, maxFontSize: 3, color: '#FFFFFF', splitOn: '[/／]', lineHeight: 1.3, sample: '拍剪博主/口播陪练' }),
        TG({ x: 4, y: 80, w: 92, h: 14, fontSize: 12, maxFontSize: 13, color: '#FFFFFF', highlight: { color: '#FF4D8D' }, hardShadow: { color: 'rgba(0,0,0,0.35)', dx: 0.5, dy: 0.6 }, sample: '口播没人看*原因*', noRatio: true }),
      ] }),

    /* ref4-r2c2 沉浸式：顶部青色一行 + 底部三行白字青色关键词 */
    photoT({ id: 'ref4-r2c2-cyan-lines', name: '青色分行叙述', style: '小红书·青色分行', source: 'ref4-r2c2, ref6-r3c2',
      description: '顶部青色粗字一行，底部三行白色粗字逐行错落（*关键词*青色），叙事型口播',
      photo: { focusY: 22, shade: SH(0.35) },
      layers: [bg('#5E6B73'), PERSON({ onlySticker: true }),
        T({ y: 3, h: 11, maxFontSize: 11, color: '#3FD0F0', hardShadow: { color: 'rgba(0,0,0,0.4)', dx: 0.4, dy: 0.5 }, sample: '沉浸式剪辑' }),
        S({ x: 6, y: 66, w: 88, h: 28, align: 'left', valign: 'top', fit: null, fontSize: 8, maxFontSize: 8, lineHeight: 1.25, splitOn: '[/／]', color: '#FFFFFF', highlight: { color: '#3FD0F0' }, hardShadow: { color: 'rgba(0,0,0,0.45)', dx: 0.4, dy: 0.5 },
          sample: '早上*五点*起床/一天能剪/多少条视频…', noRatio: true }),
      ] }),

    /* ref4-r2c3 黄底问题大字 + 小人物 */
    stickerT({ id: 'ref4-r2c3-yellow-question', name: '黄底问句大字', style: '小红书·黄底问句', source: 'ref4-r2c3, ref6-r3c3',
      description: '暖黄渐变底，上半三行白色粗字问句（深色硬阴影），下方小尺寸人物抠图，红色竖排小章',
      layers: [bg({ type: 'linear', angle: 90, stops: [{ offset: 0, color: '#F7C948' }, { offset: 1, color: '#E89A2C' }] }),
        PERSON({ x: 20, y: 46, w: 60, h: 54, sticker: { width: 0.8, color: '#FFFFFF', shadow: { color: 'rgba(0,0,0,0.3)', dx: 0, dy: 0.6 } } }),
        T({ x: 6, y: 5, w: 88, h: 38, splitOn: '[/／]', align: 'left', valign: 'top', maxFontSize: 13, lineHeight: 1.1, hardShadow: { color: '#7A4A10', dx: 0.6, dy: 0.8 }, sample: '口播建议：/新手怎么/开口不慌？' }),
        BD({ x: 30, y: 58, w: 6, h: 12, vertical: true, bg: '#FFF6E0', color: '#C2261F', ...F_SERIF, fontSize: 3, border: { color: '#C2261F', width: 0.3 }, sample: '对话' }),
      ] }),

    /* ref4-r3c2 宋体竖排混色 */
    photoT({ id: 'ref4-r3c2-mixed-vertical', name: '宋体竖排混色', style: '小红书·竖排宋体', source: 'ref4-r3c2, ref6-r2c3, ref6-r1c2, ref4-r3c1',
      description: '左侧竖排宋体大字（红/蓝两色），右侧竖排深色小标签 3 个，底部大号白色宋体结论',
      photo: { focusY: 24, focusX: 62, shade: [{ from: 70, to: 100, c0: 'rgba(0,0,0,0)', c1: 'rgba(0,0,0,0.55)' }] }, defaultOcclude: false,
      layers: [bg('#E8E2DA'), PERSON({ onlySticker: true }),
        T({ x: 4, y: 6, w: 20, h: 60, vertical: true, ...F_SERIF, maxFontSize: 18, lineHeight: 1.0, color: '#C2261F', highlight: { color: '#1F3A8A' }, autoHighlight: null, sample: '口播*和我*学' }),
        ...[0, 1, 2].map((i) => S({ id: 'tag' + i, part: i, parts: 3, vertical: true, x: 88, y: 6 + i * 19, w: 8, h: 17, fit: null, ...F_SERIF, fontSize: 3, maxFontSize: 3, color: '#FFFFFF', lineHeight: 1.1, noRatio: true, bleed: true,
          banner: { fill: 'rgba(30,30,30,0.7)', paddingX: 0.8, paddingY: 0.8, radius: 0.3 }, ignoreFace: true, sample: '镜头感/语气/表情' })),
        TG({ x: 4, y: 82, w: 92, h: 12, ...F_SERIF, fontSize: 10, maxFontSize: 10.4, color: '#FFFFFF', shadow: { color: 'rgba(0,0,0,0.5)', blur: 1.2 }, sample: '一步到位', noRatio: true }),
      ] }),

    /* ref6-r3c1 竖排黄字 + 相框小人 + 红叉 */
    photoT({ id: 'ref6-r3c1-vertical-x', name: '竖排警示+红叉', style: '口播·竖排警示', source: 'ref6-r3c1',
      description: '人脸特写铺满，左侧竖排黄色大字，右下白框小照片（同一人物），底部白字+红叉划掉错误做法',
      photo: { focusY: 22, focusX: 66, zoom: 1.25, shade: SH(0.3) }, defaultOcclude: false,
      layers: [bg('#E3E3E3'), PERSON({ onlySticker: true }),
        T({ x: 4, y: 4, w: 18, h: 56, vertical: true, maxFontSize: 16, lineHeight: 1.0, color: '#FFE14D', stroke: { color: '#111', ratio: 0.05 }, hardShadow: { color: 'rgba(0,0,0,0.35)', dx: 0.4, dy: 0.6 }, sample: '这种开头' }),
        SLOT({ x: 60, y: 52, w: 34, h: 30, focusY: 25, zoom: 1, rotate: 4, frame: { width: 1, color: '#FFFFFF', shadow: 'rgba(0,0,0,0.35)' } }),
        S({ x: 4, y: 64, w: 54, h: 8, fontSize: 6, maxFontSize: 6, color: '#FFFFFF', align: 'left', shadow: { color: 'rgba(0,0,0,0.5)', blur: 1 }, sample: '千万！不能！' }),
        TG({ x: 4, y: 74, w: 54, h: 14, fontSize: 11, maxFontSize: 11, color: '#C2261F', align: 'left', stroke: { color: '#FFFFFF', ratio: 0.1 }, sample: '照着念', noRatio: true }),
        { id: 'cross', type: 'shape', visible: true, essential: true, shape: 'cross', thick: 0.16, x: 30, y: 74, w: 20, h: 14, fill: '#E11D2E' },
      ] }),

    /* ref5-r1c1 手写白字错落 */
    photoT({ id: 'ref5-r1c1-handwrite', name: '手写感错落白字', style: '小红书·手写错落', source: 'ref5-r1c1, ref5-r1c2, ref8-r4c3',
      description: '生活照铺满，得意黑白色大字分行错落（左/右交替），黄色笔刷底线，情绪/日常类',
      photo: { focusY: 30, focusX: 40, shade: SH(0.3) }, defaultOcclude: false,
      layers: [bg('#6E7C5A'), PERSON({ onlySticker: true }),
        T({ id: 'title-0', part: 0, parts: 2, x: 5, y: 4, w: 70, h: 16, ...F_SMILEY, align: 'left', maxFontSize: 16, color: '#FFFFFF', stroke: { color: '#1A1A1A', ratio: 0.06 }, hardShadow: { color: 'rgba(0,0,0,0.35)', dx: 0.4, dy: 0.6 }, sample: '允许自己/慢一点' }),
        T({ id: 'title-1', part: 1, parts: 2, x: 30, y: 19, w: 65, h: 16, ...F_SMILEY, align: 'right', maxFontSize: 16, color: '#FFFFFF', stroke: { color: '#1A1A1A', ratio: 0.06 }, hardShadow: { color: 'rgba(0,0,0,0.35)', dx: 0.4, dy: 0.6 },
          underline: { brush: true, color: '#FFD23F', height: 1.6, widthRatio: 0.7 }, sample: '允许自己/慢一点' }),
        TG({ x: 5, y: 88, w: 60, h: 6, ...F_SMILEY, align: 'left', fontSize: 4.4, maxFontSize: 4.4, color: '#FFFFFF', shadow: { color: 'rgba(0,0,0,0.5)', blur: 1 }, sample: '我的拍摄日常', noRatio: true }),
      ] }),

    /* ref5-r1c3 出血巨字 + 绿色横幅 */
    photoT({ id: 'ref5-r1c3-bleed-giant', name: '出血巨字', style: '口播·出血巨字', source: 'ref5-r1c3',
      description: '标题 4 字超大出血到画面边缘（黄/橙交替），中部绿色横幅放副标题，白字问句，冲击力最强',
      photo: { focusY: 28, shade: SH(0.25) },
      layers: [bg('#7FA0C8'), PERSON({ onlySticker: true }),
        ...[0, 1].map((i) => T({ id: 'title-' + i, part: i, parts: 2, x: i ? 52 : 2, y: 2, w: 46, h: 22, fontSize: 24, maxFontSize: 26, align: i ? 'right' : 'left', bleed: true, color: i ? '#FF9F1C' : '#FFE14D', hardShadow: null, stroke: { color: '#111', ratio: 0.06 }, shadow: { color: 'rgba(0,0,0,0.3)', blur: 1 }, autoHighlight: null, sample: '一年/百条',
          at: { wide: { x: i ? 50 : 2, y: 3, w: 46, h: 30 } } })),
        S({ x: 14, y: 80, w: 72, h: 6, fontSize: 4.2, maxFontSize: 4.4, color: '#FFFFFF', banner: { fill: '#16A34A', paddingX: 2, paddingY: 0.8, radius: 0.4 }, sample: '聊了100位拍剪新手' }),
        TG({ x: 6, y: 87, w: 88, h: 9, fontSize: 6.4, maxFontSize: 6.6, color: '#FFFFFF', stroke: { color: '#111', ratio: 0.1 }, sample: '他们到底做对了什么？', noRatio: true }),
      ] }),

    /* ref5-r2c1 蓝色斜条 */
    photoT({ id: 'ref5-r2c1-blue-slant', name: '蓝色斜条', style: '小红书·蓝色斜条', source: 'ref5-r2c1',
      description: '左上蓝色竖排小章 + 斜体白字蓝色斜条两条（标题、副标题），英文小字，课程/训练营类',
      photo: { focusY: 30, focusX: 40, shade: SH(0.2) }, defaultOcclude: false,
      layers: [bg('#9DB4D3'), PERSON({ onlySticker: true }),
        BD({ x: 4, y: 4, w: 8, h: 12, vertical: true, bg: '#1E4FFF', color: '#FFFFFF', fontSize: 3.4, sample: '实战' }),
        S({ x: 14, y: 5, w: 80, h: 6, ...F_SMILEY, fontSize: 4.6, maxFontSize: 4.6, color: '#FFFFFF', rotate: -3, banner: { fill: '#1E4FFF', paddingX: 2, paddingY: 0.8, radius: 0.3 }, sample: '口播实战小班课', noRatio: true }),
        T({ x: 4, y: 72, w: 92, h: 12, ...F_SMILEY, maxFontSize: 11, color: '#FFFFFF', rotate: -4, banner: { fill: '#1E4FFF', paddingX: 2.4, paddingY: 1, radius: 0.3, shadow: { color: '#0B1F55', dx: 0.6, dy: 0.6 } }, sample: '3天2夜拍剪营' }),
        TG({ x: 6, y: 86, w: 88, h: 6, ...F_SMILEY, fontSize: 4.6, maxFontSize: 4.6, color: '#FFFFFF', rotate: -4, stroke: { color: '#1E4FFF', ratio: 0.18 }, sample: '为什么大家收获满满？', noRatio: true }),
      ] }),

    /* ref5-r2c2 加号标签 */
    photoT({ id: 'ref5-r2c2-plus-chips', name: '加号三标签', style: '小红书·加号标签', source: 'ref5-r2c2',
      description: '浅色照片，顶部深色粗字（*关键词*红底白字），底部三个白色胶囊用 + 连接（副标题 / 分 3 段），选择/攻略类',
      photo: { focusY: 30, shade: [{ from: 0, to: 26, c0: 'rgba(255,255,255,0.5)', c1: 'rgba(255,255,255,0)' }] }, defaultOcclude: false,
      layers: [bg('#EFEAE4'), PERSON({ onlySticker: true }),
        T({ y: 3.5, h: 12, ...F_SERIF, maxFontSize: 11, color: '#1A1A1A', highlight: { color: '#FFFFFF', block: { fill: '#E11D2E', radius: 0.4 } }, sample: '口播*视频*形式选择' }),
        ...[0, 1, 2].map((i) => S({ id: 'chip' + i, part: i, parts: 3, x: 4 + i * 32, y: 86, w: 28, h: 6, fit: 'width', fontSize: 4, maxFontSize: 4, color: '#C2261F', noRatio: true, bleed: true,
          banner: { fill: '#FFFFFF', paddingX: 1, paddingY: 0.7, radius: 0.4, border: { color: '#C2261F', width: 0.2 } }, sample: '内容方向/设备投入/成长路径' })),
        ...[0, 1].map((i) => ({ id: 'plus' + i, type: 'text', visible: true, binding: 'static', x: 31 + i * 32, y: 86, w: 6, h: 6, ...F_BLACK, fontSize: 5, color: '#E11D2E', align: 'center', valign: 'middle', sample: '+', ignoreFace: true, bleed: true })),
      ] }),

    /* ref5-r2c3 暗角环绕彩字 */
    photoT({ id: 'ref5-r2c3-vignette', name: '暗角彩字Vlog', style: '小红书·暗角彩字', source: 'ref5-r2c3',
      description: '圆形暗角聚焦人脸，上方白色倾斜大字，下方彩色字母 tagline（得意黑），Vlog/个人IP',
      photo: { focusY: 30, zoom: 1.1, shade: [], vignette: false },
      layers: [bg('#111111'), PERSON({ onlySticker: true }),
        { id: 'vig', type: 'shape', visible: true, shape: 'rect', x: 0, y: 0, w: 100, h: 100, fill: { type: 'radial', stops: [{ offset: 0.45, color: 'rgba(0,0,0,0)' }, { offset: 1, color: 'rgba(0,0,0,0.85)' }] } },
        T({ x: 5, y: 4, w: 90, h: 20, ...F_SMILEY, maxFontSize: 16, rotate: -8, hardShadow: { color: 'rgba(0,0,0,0.5)', dx: 0.4, dy: 0.6 }, sample: '一个人如何' }),
        TG({ x: 8, y: 78, w: 84, h: 14, ...F_SMILEY, fontSize: 12, maxFontSize: 13, color: '#FF7AC6', highlight: { color: '#7CFF3A' }, rotate: -6, stroke: { color: '#FFFFFF', ratio: 0.08 }, sample: '拍*VLOG*', noRatio: true }),
      ] }),

    /* ref5-r3c1 照片条拼贴 */
    stickerT({ id: 'ref5-r3c1-photo-strips', name: '三条照片拼贴', style: '小红书·照片条', source: 'ref5-r3c1',
      description: '同一人物照片裁成 3 条（不同取景）放左侧，右侧白底栏逐条对应黑色笔刷大字（标题 / 分 3 段），文字与照片并列不重叠，旅行/城市记录',
      layers: [bg('#FFFFFF'),
        ...[0, 1, 2].map((i) => SLOT({ id: 's' + i, x: 0, y: i * 33.5, w: 56, h: 33, focusY: [12, 40, 80][i], zoom: [1.3, 1.1, 1.2][i], radius: 0,
          at: { wide: { x: 0, y: 0, w: 33, h: 62, zoom: 1, focusY: 24, ...[{ x: 0 }, { x: 33.5 }, { x: 67 }][i] } } })),
        ...[0, 1, 2].map((i) => T({ id: 'title-' + i, part: i, parts: 3, x: 60, y: 6 + i * 33.5, w: 36, h: 22, ...F_SMILEY, align: 'left', valign: 'middle', maxFontSize: 15, color: '#111111', highlight: { color: '#2563EB' }, hardShadow: null, sample: '城市/漫游/记录',
          at: { wide: { x: 2 + i * 33.5, y: 66, w: 30, h: 24, align: 'center' } } })),
        TG({ x: 60, y: 2, w: 36, h: 4, ...F_SMILEY, align: 'left', fontSize: 3.4, maxFontSize: 3.4, color: '#2563EB', sample: 'city walk', noRatio: true, at: { wide: { x: 2, y: 92, w: 30 } } }),
        { id: 'rule', type: 'shape', visible: true, shape: 'rect', x: 60, y: 97, w: 36, h: 0.6, fill: '#111111', at: { wide: { x: 40, y: 94, w: 58 } } },
      ] }),

    /* ref8-r1c1 奶油插画风 */
    stickerT({ id: 'ref8-r1c1-cream', name: '奶油可爱', style: '小红书·奶油可爱', source: 'ref8-r1c1, ref8-r4c1',
      description: '奶油底 + 圆体棕色大标题（*强调*橙色）+ 圆形英文小章 + 底部描边圆角条，人物抠图可选',
      layers: [bg('#FBEBD3', { pattern: { type: 'dots', color: 'rgba(160,100,45,0.12)', size: 0.6, gap: 3 } }),
        PERSON({ x: 16, y: 32, w: 68, h: 56, sticker: { width: 1, color: '#FFFFFF', shadow: { color: 'rgba(120,70,20,0.35)', dx: 0, dy: 0.8 } } }),
        T({ x: 6, y: 5, w: 72, h: 22, ...F_KL, splitOn: '[/／]', align: 'left', maxFontSize: 14, lineHeight: 1.1, color: '#8B5A2B', highlight: { color: '#F08A24' }, sample: '口播*不累*/计划' }),
        BD({ x: 76, y: 8, w: 18, h: 14, shape: 'ellipse', bg: '#FFFFFF', color: '#8B5A2B', ...F_KL, fontSize: 3, border: { color: '#8B5A2B', width: 0.35, dash: null }, sample: 'DAILY' }),
        S({ x: 18, y: 26, w: 50, h: 4, ...F_KL, fontSize: 3.2, maxFontSize: 3.2, color: '#8B5A2B', align: 'left', sample: '9.21 — 10.30' }),
        TG({ x: 12, y: 89, w: 76, h: 6, ...F_KL, fontSize: 4.2, maxFontSize: 4.2, color: '#8B5A2B', banner: { fill: '#FFF8EE', paddingX: 2.4, paddingY: 0.8, radius: 3, border: { color: '#8B5A2B', width: 0.25 } }, sample: '分享你的拍摄日常', noRatio: true }),
      ] }),

    /* ref8-r1c2 OOTD 清单 */
    stickerT({ id: 'ref8-r1c2-item-list', name: '清单单品', style: '小红书·清单单品', source: 'ref8-r1c2',
      description: '白底杂志感：左上英文大标题+中文副标题，左侧 3 行编号清单（浅紫方块），右侧全身人物抠图',
      autoWide: 'left',
      layers: [bg('#FFFFFF'),
        PERSON({ x: 44, y: 14, w: 56, h: 86, sticker: { width: 0, color: '#FFFFFF', shadow: null } }),
        T({ x: 6, y: 5, w: 50, h: 10, align: 'left', ...F_BLACK, maxFontSize: 8, color: '#6D4AFF', sample: 'GEAR LIST' }),
        S({ x: 6, y: 15, w: 50, h: 4, align: 'left', ...F_BOLD, fontSize: 3, maxFontSize: 3, color: '#333', sample: '口播入门设备清单' }),
        ...[0, 1, 2].map((i) => SLOT({ id: 'box' + i, x: 6, y: 24 + i * 23, w: 32, h: 17, radius: 1.2, focusY: [15, 45, 80][i], zoom: 1.8, frame: { width: 0.5, color: '#EEE8FF' } })),
        ...[0, 1, 2].map((i) => TG({ id: 'item' + i, part: i, parts: 3, x: 6, y: 41.6 + i * 23, w: 32, h: 4, ...F_BOLD, fontSize: 3.2, maxFontSize: 3.2, color: '#6D4AFF', align: 'left', fit: null, tiny: true, noRatio: true, sample: '01 麦克风/02 补光灯/03 三脚架' })),
      ] }),

    /* ref8-r1c4 紫色闪光 */
    stickerT({ id: 'ref8-r1c4-purple-sparkle', name: '紫色闪光', style: '小红书·紫色闪光', source: 'ref8-r1c4, ref8-r2c3',
      description: '紫粉渐变 + 闪光星，人物白边抠图，底部粉色圆体大字白描边两行，左上英文名签',
      layers: [bg({ type: 'linear', angle: 90, stops: [{ offset: 0, color: '#E9D5FF' }, { offset: 1, color: '#A78BFA' }] }, { pattern: { type: 'dots', color: 'rgba(255,255,255,0.35)', size: 0.5, gap: 3 } }),
        PERSON({ x: 8, y: 8, w: 84, h: 74 }),
        { id: 'sp1', type: 'shape', visible: true, shape: 'sparkle', square: true, x: 80, y: 10, w: 10, h: 8, fill: '#FFFFFF' },
        { id: 'sp2', type: 'shape', visible: true, shape: 'heart', square: true, x: 8, y: 30, w: 7, h: 5, fill: '#FF4D8D' },
        BD({ x: 5, y: 4, w: 22, h: 6, bg: 'transparent', color: '#FFFFFF', ...F_SMILEY, fontSize: 5, stroke: { color: '#7C3AED', ratio: 0.2 }, sample: 'Daily' }),
        T({ x: 5, y: 70, w: 90, h: 12, ...F_KL, maxFontSize: 12, color: '#FF4D8D', stroke: { color: '#7C3AED', ratio: 0.06 }, strokeOuter: { color: '#FFFFFF', ratio: 0.26 }, sample: '口播小技巧' }),
        S({ x: 8, y: 82, w: 84, h: 8, ...F_KL, fontSize: 5.4, maxFontSize: 5.6, color: '#3B0764', strokeOuter: { color: '#FFFFFF', ratio: 0.28 }, sample: '办公室也能拍' }),
        TG({ x: 56, y: 92, w: 40, h: 4, fontSize: 2.8, maxFontSize: 2.8, color: '#FFFFFF', banner: { fill: '#7C3AED', paddingX: 1.2, paddingY: 0.5, radius: 2 }, sample: '口播组合技巧', noRatio: true, tiny: true }),
      ] }),

    /* ref8-r2c1 夜景巨数字 */
    stickerT({ id: 'ref8-r2c1-night-number', name: '夜景巨数字', style: '口播·夜景数字', source: 'ref8-r2c1',
      description: '城市夜景背景，顶部白色粗字，中间超大紫色渐变数字（*数字*自动放大），红色印章标签，人物抠图右下',
      defaultScene: 'city-night',
      layers: [bg({ type: 'linear', angle: 90, stops: [{ offset: 0, color: '#1E1B4B' }, { offset: 1, color: '#0B0A1F' }] }),
        PERSON({ x: 40, y: 34, w: 60, h: 66, sticker: { width: 0.6, color: '#FFFFFF', shadow: { color: 'rgba(0,0,0,0.5)', dx: 0, dy: 0.6 } } }),
        T({ x: 5, y: 4, w: 70, h: 10, align: 'left', maxFontSize: 10, sample: '熬夜研究' }),
        S({ id: 'num', binding: 'badge', x: 5, y: 14, w: 60, h: 18, align: 'left', fontSize: 18, maxFontSize: 18, color: { type: 'linear', angle: 90, stops: [{ offset: 0, color: '#E9D5FF' }, { offset: 1, color: '#8B5CF6' }] }, hardShadow: { color: '#2E1065', dx: 0.6, dy: 0.8 }, sample: '500条', noRatio: true }),
        S({ x: 5, y: 32, w: 40, h: 10, align: 'left', fontSize: 9, maxFontSize: 9, color: '#FFFFFF', sample: '口播' }),
        { id: 'stamp', type: 'badge', visible: true, binding: 'static', shape: 'ellipse', square: true, x: 70, y: 16, w: 18, h: 14, bg: '#E11D2E', color: '#FFFFFF', ...F_BLACK, fontSize: 3.4, rotate: 12, sample: '亲测', border: { color: '#FFFFFF', width: 0.4 } },
        TG({ x: 5, y: 88, w: 60, h: 7, align: 'left', fontSize: 5, maxFontSize: 5, color: '#FFFFFF', sample: '只需替换文案', noRatio: true }),
      ] }),

    /* ref8-r2c2 底部探头 */
    stickerT({ id: 'ref8-r2c2-peek', name: '底部探头', style: '小红书·底部探头', source: 'ref8-r2c2',
      description: '白底四角浅紫大字（标题 4 字），人物只露头部从底部探出，中间放小卡片标签，干净留白',
      layers: [bg('#FFFFFF'),
        PERSON({ x: 12, y: 56, w: 76, h: 90, align: 'top', clip: true, sticker: { width: 0, color: '#FFFFFF', shadow: null } }),
        ...[0, 1, 2, 3].map((i) => T({ id: 'title-' + i, part: i, parts: 4, x: i % 2 ? 70 : 6, y: i < 2 ? 6 : 34, w: 24, h: 22, fontSize: 18, maxFontSize: 20, color: '#8B6CF0', autoHighlight: null, sample: '口播/秘籍/大全/收藏' })),
        ...[0, 1, 2].map((i) => S({ id: 'note' + i, part: i, parts: 3, x: [34, 52, 36][i], y: [20, 30, 42][i], w: 24, h: 4, fit: null, fontSize: 2.8, maxFontSize: 2.8, color: '#6D4AFF', noRatio: true, tiny: true,
          banner: { fill: '#FFFFFF', paddingX: 1, paddingY: 0.5, radius: 0.3, border: { color: '#C4B5FD', width: 0.2 } }, sample: '开场3秒/情绪节奏/收尾引导' })),
      ] }),

    /* ref8-r3c1 紫底竖排英文 */
    stickerT({ id: 'ref8-r3c1-purple-vertical', name: '紫底竖排英文', style: '小红书·紫底竖排', source: 'ref8-r3c1',
      description: '高饱和紫底，顶部白色粗字，右侧竖排超大英文（tagline），白边人物抠图，左下白底黑字数字框',
      layers: [bg('#7C3AED'),
        PERSON({ x: 8, y: 16, w: 70, h: 84 }),
        T({ x: 5, y: 3, w: 80, h: 10, align: 'left', maxFontSize: 10, sample: '入职第一周' }),
        S({ x: 5, y: 12.5, w: 40, h: 4, align: 'left', fontSize: 3.2, maxFontSize: 3.2, color: '#FFFFFF', sample: '口播新人必看' }),
        TG({ x: 80, y: 18, w: 16, h: 76, vertical: true, fit: 'width', fontSize: 12, maxFontSize: 12, lineHeight: 0.9, color: '#111111', sample: 'NEW', noRatio: true }),
        BD({ x: 5, y: 78, w: 24, h: 14, bg: '#FFFFFF', color: '#111111', fontSize: 7, radius: 0, sample: '10个' }),
      ] }),

    /* ref8-r3c2 暗调氛围 */
    photoT({ id: 'ref8-r3c2-moody', name: '暗调氛围', style: '小红书·暗调氛围', source: 'ref8-r3c2, ref2-r3c2',
      description: '暖暗调照片 + 强暗角，左上白色两行粗字 + 小段说明，克制高级，适合 Vlog/居家/记录',
      photo: { focusY: 40, filter: 'brightness(0.8) saturate(0.9)', shade: SH(0.45) }, defaultOcclude: false,
      layers: [bg('#1C140E'), PERSON({ onlySticker: true }),
        T({ x: 6, y: 5, w: 56, h: 20, splitOn: '[/／]', align: 'left', maxFontSize: 10, lineHeight: 1.15, sample: '我的小窝/剪辑中' }),
        S({ x: 6, y: 26, w: 46, h: 8, align: 'left', fit: null, ...F_BOLD, fontSize: 3, maxFontSize: 3, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, sample: '下班后的两小时，是我安静创作的时间' }),
        TG({ x: 60, y: 92, w: 36, h: 4, align: 'right', ...F_BOLD, fontSize: 2.6, maxFontSize: 2.6, color: 'rgba(255,255,255,0.8)', sample: 'HOME STUDIO', letterSpacing: 0.2, noRatio: true, tiny: true }),
      ] }),

    /* ref8-r3c3 荧光网格 */
    stickerT({ id: 'ref8-r3c3-neon-grid', name: '荧光网格', style: '口播·荧光网格', source: 'ref8-r3c3, ref8-r3c4',
      description: '黑底，左右各 2 个照片小格（荧光绿边框+标签），中间人物抠图，顶部白字+荧光绿数字',
      layers: [bg('#0E0E0E', { pattern: { type: 'grid', color: 'rgba(163,255,18,0.08)', size: 0.15, gap: 6 } }),
        ...[0, 1, 2, 3].map((i) => SLOT({ id: 'g' + i, x: i % 2 ? 70 : 4, y: 24 + Math.floor(i / 2) * 26, w: 26, h: 19, focusY: [20, 40, 60, 80][i], zoom: 1.6, radius: 1, border: { color: '#A3FF12', width: 0.4 } })),
        ...[0, 1, 2, 3].map((i) => S({ id: 'gl' + i, part: i, parts: 4, x: i % 2 ? 70 : 4, y: 43.8 + Math.floor(i / 2) * 26, w: 26, h: 3.5, fit: null, fontSize: 2.6, maxFontSize: 2.6, color: '#111', noRatio: true, tiny: true, bleed: true,
          banner: { fill: '#A3FF12', paddingX: 0.6, paddingY: 0.3, radius: 0.2 }, sample: '开场/节奏/字幕/收尾' })),
        PERSON({ x: 24, y: 24, w: 52, h: 76 }),
        T({ x: 5, y: 4, w: 90, h: 10, maxFontSize: 9, highlight: { color: '#A3FF12' }, autoHighlight: 'digits', sample: '6种口播风格' }),
        TG({ x: 10, y: 14, w: 80, h: 4, fontSize: 3, maxFontSize: 3, color: '#A3FF12', sample: '一篇讲透 · 实用 · 好上手', noRatio: true }),
      ] }),

    /* ref8-r4c2 对话气泡 / 聊天截图 */
    stickerT({ id: 'ref8-r4c2-chat', name: '聊天气泡', style: '小红书·聊天气泡', source: 'ref8-r4c2 + 新增对话气泡风',
      description: '深红底+代码小符号，顶部白色大标题，左侧 3 条白色对话气泡（副标题 / 分段，左右交替），人物抠图右下',
      layers: [bg({ type: 'linear', angle: 90, stops: [{ offset: 0, color: '#3B0A0A' }, { offset: 1, color: '#160404' }] }),
        PERSON({ x: 40, y: 32, w: 60, h: 68 }),
        T({ x: 5, y: 4, w: 90, h: 12, maxFontSize: 10, banner: { fill: '#E11D2E', paddingX: 2, paddingY: 0.8, radius: 0.4 }, sample: '口播常见问题' }),
        BD({ x: 70, y: 17, w: 24, h: 6, bg: 'transparent', color: '#FFFFFF', fontSize: 6, sample: '答疑！' }),
        ...[0, 1, 2].map((i) => S({ id: 'msg' + i, part: i, parts: 3, x: i % 2 ? 14 : 4, y: 30 + i * 12, w: 48, h: 7, fit: null, fontSize: 3.6, maxFontSize: 3.6, color: '#1A1A1A', align: 'left', noRatio: true, bleed: true,
          banner: { fill: i % 2 ? '#B6F09C' : '#FFFFFF', paddingX: 1.6, paddingY: 1.1, radius: 2 }, sample: '紧张怎么办？/先对着手机练三遍/真的有用吗？' })),
        TG({ x: 4, y: 90, w: 40, h: 4, align: 'left', ...F_BOLD, fontSize: 2.6, maxFontSize: 2.6, color: 'rgba(255,255,255,0.6)', sample: '</> Q&A', noRatio: true, tiny: true }),
      ] }),

    /* ref8-r4c4 白色极简 + 屏幕卡片 */
    stickerT({ id: 'ref8-r4c4-white-minimal', name: '白色极简', style: '小红书·白色极简', source: 'ref8-r4c4',
      description: '白底黑色粗字两行（数字自动强调），小字副标题，黄色小标签，下方圆角“屏幕卡片”放照片',
      layers: [bg('#F5F5F2'),
        T({ x: 6, y: 5, w: 88, h: 22, splitOn: '[/／]', align: 'left', maxFontSize: 11, lineHeight: 1.1, color: '#111111', autoHighlight: 'digits', highlight: { color: '#111111' }, sample: '10分钟/剪完一条口播' }),
        S({ x: 6, y: 28, w: 60, h: 4, align: 'left', ...F_BOLD, fontSize: 3.4, maxFontSize: 3.4, color: '#555', sample: '新手省时间的流程' }),
        BD({ x: 6, y: 34, w: 16, h: 4.6, bg: '#FFE14D', color: '#111', fontSize: 2.8, radius: 0.3, sample: '可以套用' }),
        SLOT({ x: 16, y: 46, w: 76, h: 46, radius: 3, focusY: 30, frame: { width: 1.6, color: '#1A1A1A', shadow: 'rgba(0,0,0,0.25)' }, rotate: -3 }),
      ] }),

    /* ref9-r1c1 左侧反转大字 */
    photoT({ id: 'ref9-r1c1-left-reveal', name: '左侧反转大字', style: '口播·反转大字', source: 'ref9-r1c1',
      description: '近景照片，左上三行粗字（白-白-橙）黑色硬阴影，左下半透明数据面板（副标题分条），测评/开箱',
      photo: { focusY: 30, focusX: 70, shade: [{ from: 0, to: 100, c0: 'rgba(0,0,0,0.25)', c1: 'rgba(0,0,0,0.35)' }] }, defaultOcclude: false,
      layers: [bg('#2B2B2B'), PERSON({ onlySticker: true }),
        T({ x: 5, y: 8, w: 52, h: 34, splitOn: '[/／]', align: 'left', valign: 'top', maxFontSize: 12, lineHeight: 1.12, color: '#FFFFFF', highlight: { color: '#FF8A1F' }, hardShadow: { color: '#111111', dx: 0.6, dy: 0.8 }, stroke: { color: '#111', ratio: 0.06 }, sample: '刚拍完，/有点/*意外*。' }),
        S({ x: 5, y: 62, w: 34, h: 16, align: 'left', valign: 'top', fit: null, fontSize: 3, maxFontSize: 3, color: '#FFFFFF', lineHeight: 1.7, splitOn: '[、,，/]', listPrefix: ['▍', '▍', '▍', '▍'],
          banner: { fill: 'rgba(20,20,20,0.6)', paddingX: 1.4, paddingY: 1, radius: 1 }, sample: '收音 清晰/画质 稳定/续航 够用' }),
      ] }),

    /* ref9-r1c3 双人访谈 */
    photoT({ id: 'ref9-r1c3-duo-talk', name: '双人对谈', style: '口播·双人对谈', source: 'ref9-r1c3',
      description: '顶部黄色大字黑描边白外框两行，下方深色小条“A × B 对谈”，人物照（适合双人）铺满，侧边白色思考气泡',
      photo: { focusY: 55, shade: [{ from: 0, to: 36, c0: 'rgba(0,0,0,0.25)', c1: 'rgba(0,0,0,0)' }] }, defaultOcclude: false,
      layers: [bg('#5A6B4A'), PERSON({ onlySticker: true }),
        T({ x: 5, y: 3, w: 90, h: 24, splitOn: '[/／]', maxFontSize: 13, lineHeight: 1.08, color: '#FFE14D', stroke: { color: '#111', ratio: 0.14 }, strokeOuter: { color: '#FFFFFF', ratio: 0.26 }, hardShadow: { color: '#111' }, sample: 'AI时代的/口播新玩法' }),
        S({ x: 14, y: 28, w: 72, h: 5, fontSize: 3.6, maxFontSize: 3.6, color: '#FFE14D', banner: { fill: '#111111', paddingX: 2, paddingY: 0.6, radius: 0.4 }, sample: '主播 × 剪辑师 对谈' }),
        BD({ x: 4, y: 40, w: 18, h: 7, shape: 'bubble', radius: 3, tail: { side: 'bottom', pos: 0.7, size: 2 }, bg: '#FFFFFF', color: '#111', fontSize: 3, border: { color: '#111', width: 0.3 }, sample: '深度思考' }),
      ] }),

    /* ref9-r2c3 暗色节点网络 */
    stickerT({ id: 'ref9-r2c3-dark-network', name: '暗色节点网络', style: '口播·节点网络', source: 'ref9-r2c3, ref9-r3c3',
      description: '深蓝黑底+网格，人物抠图居中，四周 4 个圆角节点标签（副标题分段），顶部白黄大字，底部黄色横条',
      layers: [bg({ type: 'radial', stops: [{ offset: 0, color: '#1E2A4A' }, { offset: 1, color: '#05070F' }] }, { pattern: { type: 'grid', color: 'rgba(120,160,255,0.08)', size: 0.12, gap: 5 } }),
        PERSON({ x: 20, y: 26, w: 60, h: 66, sticker: { width: 0.6, color: '#FFFFFF', shadow: { color: 'rgba(0,0,0,0.6)', dx: 0, dy: 0.6 } } }),
        T({ x: 5, y: 4, w: 90, h: 12, maxFontSize: 12, highlight: { color: '#FFE14D' }, autoHighlight: 'digits', hardShadow: { color: '#000', dx: 0.4, dy: 0.6 }, sample: '1人顶1个团队' }),
        S({ x: 8, y: 16, w: 84, h: 5, fontSize: 3.8, maxFontSize: 3.8, color: '#FFFFFF', sample: 'AI + 口播 自动化流程公开' }),
        ...[0, 1, 2, 3].map((i) => TG({ id: 'node' + i, part: i, parts: 4, x: i % 2 ? 74 : 4, y: 34 + Math.floor(i / 2) * 20, w: 22, h: 5, fit: null, fontSize: 3, maxFontSize: 3, color: '#FFFFFF', noRatio: true, bleed: true,
          banner: { fill: 'rgba(59,130,246,0.85)', paddingX: 1, paddingY: 0.8, radius: 1.2, border: { color: '#93C5FD', width: 0.2 } }, sample: '选题库/脚本/剪辑/分发' })),
        BD({ x: 10, y: 88, w: 80, h: 7, bg: '#FFE14D', color: '#111', fontSize: 4, radius: 0.4, sample: '10年经验总结' }),
      ] }),

    /* ref9-r3c2 封面缩略图扇形 */
    stickerT({ id: 'ref9-r3c2-thumb-fan', name: '作品扇形展示', style: '口播·作品展示', source: 'ref9-r3c2, ref9-r1c2',
      description: '黑黄底，3 张照片卡片扇形展开（像作品集），人物抠图左下，底部黄色大字，适合教程/作品复盘',
      layers: [bg('#141414', { pattern: { type: 'stripes', angle: 45, color: 'rgba(255,225,77,0.06)', size: 2, gap: 6 } }),
        T({ x: 5, y: 3, w: 90, h: 11, maxFontSize: 11, color: '#FFE14D', stroke: { color: '#111', ratio: 0.1 }, sample: 'AI做封面' }),
        SLOT({ id: 'c0', x: 6, y: 18, w: 30, h: 40, focusY: 20, rotate: -10, frame: { width: 0.8, color: '#FFFFFF', shadow: 'rgba(0,0,0,0.5)' } }),
        SLOT({ id: 'c2', x: 64, y: 18, w: 30, h: 40, focusY: 50, rotate: 10, frame: { width: 0.8, color: '#FFFFFF', shadow: 'rgba(0,0,0,0.5)' } }),
        SLOT({ id: 'c1', x: 34, y: 15, w: 32, h: 43, focusY: 35, frame: { width: 0.8, color: '#FFE14D', shadow: 'rgba(0,0,0,0.5)' } }),
        PERSON({ x: 0, y: 52, w: 54, h: 48, halign: 'left' }),
        TG({ x: 46, y: 70, w: 50, h: 12, fontSize: 9, maxFontSize: 9, color: '#FFE14D', stroke: { color: '#111', ratio: 0.12 }, splitOn: '[/／]', lineHeight: 1.1, sample: '技能/大公开', noRatio: true }),
        S({ x: 46, y: 84, w: 50, h: 5, fontSize: 3.4, maxFontSize: 3.4, color: '#FFFFFF', sample: '附完整提示词' }),
      ] }),

    /* ref9-r3c1 旅行拼贴手账 */
    stickerT({ id: 'ref9-r3c1-scrapbook', name: '旅行拼贴手账', style: '小红书·拼贴手账', source: 'ref9-r3c1, ref3-r1c1~r3c3（纸感变体）',
      description: '米色纸底，3 张白边照片错落倾斜 + 胶带，人物抠图居前，顶部手写体大标题+小字路线',
      layers: [bg('#EFE6D6', { pattern: { type: 'noise', color: 'rgba(120,90,50,0.08)' } }),
        SLOT({ id: 'p0', x: 52, y: 14, w: 42, h: 28, focusY: 20, rotate: 6, frame: { width: 1, color: '#FFFFFF', shadow: 'rgba(0,0,0,0.25)' } }),
        SLOT({ id: 'p1', x: 4, y: 40, w: 36, h: 26, focusY: 60, zoom: 1.4, rotate: -7, frame: { width: 1, color: '#FFFFFF', shadow: 'rgba(0,0,0,0.25)' } }),
        { id: 'tape', type: 'shape', visible: true, shape: 'tape', x: 62, y: 12, w: 16, h: 4, fill: 'rgba(255,214,102,0.85)', rotate: -8 },
        PERSON({ x: 22, y: 36, w: 64, h: 64 }),
        T({ x: 5, y: 3, w: 70, h: 12, ...F_SMILEY, align: 'left', maxFontSize: 12, color: '#3B2A1E', sample: '城市一日拍摄' }),
        S({ x: 6, y: 15, w: 44, h: 4, ...F_SMILEY, align: 'left', fontSize: 3.2, maxFontSize: 3.2, color: '#6B4E2E', sample: '机位 · 路线 · 光线' }),
        TG({ x: 52, y: 88, w: 44, h: 6, ...F_SMILEY, fontSize: 4.4, maxFontSize: 4.4, color: '#FFFFFF', banner: { fill: '#3B2A1E', paddingX: 1.6, paddingY: 0.6, radius: 0.4 }, rotate: -3, sample: '附拍摄清单', noRatio: true }),
      ] }),

    /* ref3-r3c2 紫框手写签名（便签手账变体） */
    photoT({ id: 'ref3-r3c2-signature', name: '紫框手写签名', style: '小红书·紫框签名', source: 'ref3-r3c2, ref3-r3c3, ref3-r2c3',
      description: '淡紫边框包住照片，顶部白色便签斜贴手写大标题，底部白色手写体签名（tagline）+ 小星星',
      photo: { x: 4, y: 3, w: 92, h: 94, radius: 2, focusY: 30, shade: [{ from: 70, to: 100, c0: 'rgba(0,0,0,0)', c1: 'rgba(40,20,80,0.55)' }] }, defaultOcclude: false,
      layers: [bg('#C4B5FD', { pattern: { type: 'dots', color: 'rgba(255,255,255,0.35)', size: 0.5, gap: 3 } }), PERSON({ onlySticker: true }),
        { id: 'note', type: 'shape', visible: true, shape: 'rect', x: 12, y: 6, w: 76, h: 15, radius: 0.6, fill: '#FFFFFF', border: { color: '#3B2A7A', width: 0.35 }, rotate: -3, hardShadow: { color: 'rgba(59,42,122,0.3)', dx: 0.5, dy: 0.7 } },
        T({ x: 15, y: 7.5, w: 70, h: 12, ...F_SMILEY, maxFontSize: 9, color: '#2A1F4A', rotate: -3, sample: '口播文案出炉 欢迎来评' }),
        TG({ x: 10, y: 82, w: 80, h: 10, ...F_SMILEY, fontSize: 8, maxFontSize: 8, color: '#FFFFFF', shadow: { color: 'rgba(40,20,80,0.6)', blur: 1 }, sample: '我可以是任何人', noRatio: true }),
        { id: 'star', type: 'shape', visible: true, shape: 'sparkle', square: true, x: 84, y: 80, w: 6, h: 5, fill: '#FFFFFF' },
      ] }),

    /* 新增：前后对比上下分栏（不含医疗/收入承诺） */
    photoT({ id: 'split-before-after', name: '上下前后对比', style: '口播·前后对比', source: '新增（参考 cover-research 对比结构）',
      description: '上下两栏同一照片（上半去色=之前，下半调色=之后），中线黄色 VS 条，左上角“之前/之后”标签，剪辑调色/改稿前后对比',
      photo: { x: 0, y: 60, w: 100, h: 40, focusY: 26, shade: [] }, defaultOcclude: false, autoWide: false,
      layers: [bg('#111111'), PERSON({ onlySticker: true }),
        SLOT({ id: 'before', x: 0, y: 0, w: 100, h: 40, focusY: 26, radius: 0, filter: 'grayscale(0.9) brightness(0.85) contrast(0.9)' }),
        { id: 'mid', type: 'shape', visible: true, shape: 'rect', x: 0, y: 40, w: 100, h: 20, fill: '#FFE14D' },
        T({ x: 5, y: 41.5, w: 90, h: 10, maxFontSize: 8.4, color: '#111111', sample: '调色前 VS 调色后' }),
        BD({ x: 4, y: 52.5, w: 14, h: 5.5, bg: '#111111', color: '#FFE14D', fontSize: 3.2, sample: '之前' }),
        TG({ x: 21, y: 52.5, w: 74, h: 5.5, align: 'left', fontSize: 4.6, maxFontSize: 4.6, color: '#FFFFFF', banner: { fill: '#E11D2E', paddingX: 1.2, paddingY: 0.4, radius: 0.4 }, sample: '只改了3个参数', noRatio: true }),
      ] }),

    /* 新增：大头特写 + 巨型对比色字 */
    photoT({ id: 'closeup-giant', name: '大头特写巨字', style: '口播·大头巨字', source: '新增（参考 ref1-r2c2 / ref6-r3c1 特写）',
      description: '人脸放大特写占 60%，底部一行巨型对比色字（橙/青等配色可换）+ 白色细副标题，最强 3 秒冲击',
      photo: { focusY: 24, zoom: 1.35, shade: [{ from: 55, to: 100, c0: 'rgba(0,0,0,0)', c1: 'rgba(0,0,0,0.75)' }] }, defaultOcclude: false,
      layers: [bg('#222'), PERSON({ onlySticker: true }),
        T({ x: 3, y: 70, w: 94, h: 18, maxFontSize: 22, color: '#FF7A1A', stroke: { color: '#111', ratio: 0.06 }, hardShadow: { color: '#111', dx: 0.6, dy: 0.8 }, sample: '别再硬背' }),
        S({ x: 8, y: 89, w: 84, h: 6, fontSize: 4.6, maxFontSize: 4.6, color: '#FFFFFF', sample: '口播稿这样写才自然' }),
        BD({ x: 74, y: 4, w: 22, h: 6, bg: '#FF7A1A', color: '#111', fontSize: 3.4, sample: '实测有效' }),
      ] }),
  ];
  R.forEach((t) => { t.builtinRef = true; B.push(t); });
})();
