/** v1.7：1:1 方图左右分区版式（人物右侧，文字/徽章/装饰收进左侧 38% 栏），让文字不压人物 */
(function () {
  const B = window.CoverTemplates.BUILTIN;
  const IDS = ['sticker-collage', 'neon-poster', 'ref2-r3c1-story', 'ref5-r2c3-vignette', 'ref8-r1c4-purple-sparkle', 'closeup-giant'];
  const squeeze = (l) => {
    const sq = { x: 4 + (l.x || 0) * 0.36, w: Math.max(8, (l.w || 10) * 0.38) };
    if (l.type === 'text') Object.assign(sq, { align: l.align === 'right' ? 'left' : l.align || 'center' });
    // 窄栏：标题/副标题允许折成多行并放大字号（盒高放大，字号由宽度决定）
    if (l.type === 'text' && (l.binding === 'title' || l.binding === 'subtitle' || l.binding === 'tagline') && l.part == null) {
      const isT = l.binding === 'title';
      Object.assign(sq, { fit: 'width', breakLines: isT ? 3 : 2, h: isT ? Math.min(26, (l.h || 8) * 1.15) : l.h, maxFontSize: l.maxFontSize || l.fontSize || 8, autoBreak: false });
    }
    return sq;
  };
  B.filter((t) => IDS.includes(t.id)).forEach((t) => {
    t.squareSplit = true;
    if (t.photo) t.photo = { ...t.photo, at: { ...(t.photo.at || {}), square: { x: 42, y: 0, w: 58, h: 100, fit: 'cover', focusX: 50, zoom: 1 } } };
    t.layers = t.layers.map((l) => {
      if (l.type === 'background' || l.type === 'occluder' || l.x == null) return l;
      if (l.binding === 'person') return { ...l, at: { ...(l.at || {}), square: { x: 42, y: 10, w: 58, h: 90, rotate: 0 } } };
      if (l.type === 'shape' && (l.w || 0) >= 90) return l;
      if (l.type === 'text' || l.type === 'badge' || l.type === 'shape' || l.type === 'icon') return { ...l, at: { ...(l.at || {}), square: { ...((l.at && l.at.square) || {}), ...squeeze(l) } } };
      return l;
    });
  });
})();
