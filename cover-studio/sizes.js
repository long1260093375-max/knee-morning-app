/**
 * 尺寸与平台预设
 * 相对坐标模板可适配任意尺寸
 */

window.CoverSizes = (function () {
  const PRESETS = [
    {
      id: 'xhs-3-4',
      label: '小红书 3:4',
      platform: '小红书',
      width: 1080,
      height: 1440,
      ratio: '3:4',
    },
    {
      id: 'wechat-cover',
      label: '公众号封面',
      platform: '公众号',
      width: 900,
      height: 383,
      ratio: '约 2.35:1',
      note: '微信公众号文章首图常用尺寸',
    },
    {
      id: 'bilibili-16-9',
      label: 'B站封面 16:9',
      platform: 'B站',
      width: 1920,
      height: 1080,
      ratio: '16:9',
    },
    {
      id: 'douyin-9-16',
      label: '抖音竖版 9:16',
      platform: '抖音',
      width: 1080,
      height: 1920,
      ratio: '9:16',
    },
    {
      id: 'ratio-3-4',
      label: '通用 3:4 (1080×1440)',
      platform: '通用',
      width: 1080,
      height: 1440,
      ratio: '3:4',
    },
    {
      id: 'ratio-16-9',
      label: '通用 16:9 (1920×1080)',
      platform: '通用',
      width: 1920,
      height: 1080,
      ratio: '16:9',
    },
    {
      id: 'ratio-1-1',
      label: '通用 1:1 (1080×1080)',
      platform: '通用',
      width: 1080,
      height: 1080,
      ratio: '1:1',
    },
    {
      id: 'wechat-square',
      label: '公众号次图 1:1',
      platform: '公众号',
      width: 500,
      height: 500,
      ratio: '1:1',
    },
  ];

  function getById(id) {
    return PRESETS.find((p) => p.id === id) || PRESETS[0];
  }

  return { PRESETS, getById };
})();
