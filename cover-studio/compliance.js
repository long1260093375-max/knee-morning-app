/**
 * 标题合规词提醒（仅提醒，不阻止导出）
 * 依据：《广告法》第九条（极限词）、第十七条（医疗用语）；小红书/抖音社区规范（站外导流）。
 * 维护：直接增删下面词表即可；tip 为替换建议。
 */
window.CoverCompliance = (function () {
  const RULES = [
    {
      cat: '极限词', level: 'warn',
      words: ['最', '第一', 'NO.1', 'No.1', 'TOP1', 'Top1', '顶级', '唯一', '首选', '首个', '100%', '百分百', '国家级', '世界级', '最高级', '最佳', '万能', '永久', '独家', '绝对', '史上', '全网最', '王牌', '王炸', '天花板'],
      tip: '广告法第九条禁用绝对化用语；可改为限定主观或时序表达，如“我用下来最顺手的”“这次第一次试”。',
      // 时序/限定用法（最近、第一次等）放行
      allow: ['最近', '最后', '最初', '最终', '第一次', '第一天', '第一步', '第一个月', '第一眼', '第一周', '第一期', '第一集'],
    },
    {
      cat: '医疗功效', level: 'warn',
      words: ['治疗', '治愈', '根治', '修复', '消炎', '止痛', '镇痛', '药效', '疗效', '康复', '抗炎', '杀菌', '祛病', '防癌', '降血压', '降血糖', '减肥药', '处方', '医用级'],
      tip: '非医疗/药品/器械内容不要宣称功效；可改为体感描述，如“用起来更安心”“支撑感更好”。',
    },
    {
      cat: '站外导流', level: 'warn',
      words: ['微信', '微 信', 'VX', 'vx', 'Vx', 'V信', 'wx', 'WX', '加我', '+V', '+v', '加V', '加v', '绿泡泡', '私信领取', '私我', '扣1', '扣 1', '看主页签名', '二维码', 'QQ群', '公众号搜', '手机号'],
      tip: '小红书/抖音不允许站外导流（含谐音变体）；改为“评论区聊”“收藏备用”。',
    },
    {
      cat: '收入/效果承诺', level: 'info',
      words: ['月入', '日入', '躺赚', '稳赚', '保本', '包过', '暴富', '轻松赚', '必赚', '瘦了', '掉秤', '斤'],
      tip: '避免收入或效果数值承诺；数字需真实可验证。',
    },
  ];

  function check(text) {
    const s = String(text || '');
    if (!s.trim()) return [];
    const hits = [];
    RULES.forEach((r) => {
      let masked = s;
      (r.allow || []).forEach((a) => { masked = masked.split(a).join('□'.repeat(a.length)); });
      r.words.forEach((w) => {
        if (masked.indexOf(w) >= 0 && !hits.some((h) => h.word === w)) hits.push({ word: w, cat: r.cat, tip: r.tip, level: r.level });
      });
    });
    return hits;
  }

  function summarize(text) {
    const hits = check(text);
    if (!hits.length) return '';
    const byCat = {};
    hits.forEach((h) => { (byCat[h.cat] = byCat[h.cat] || { words: [], tip: h.tip }).words.push(h.word); });
    return Object.keys(byCat).map((c) => `⚠ ${c}：「${byCat[c].words.join('」「')}」— ${byCat[c].tip}`).join('\n');
  }

  return { RULES, check, summarize };
})();
