# 自托管字体许可说明

本目录字体均为 **SIL Open Font License 1.1（OFL）**，允许免费商用、嵌入网页、修改与再分发（不得单独售卖字体本身；修改版不得使用保留字体名）。
为减小体积，我们用 fontTools `pyftsubset` 做了子集化并转为 woff2（属于 OFL 允许的修改；文件名带 `.subset` 以示区分）。
子集字符：GB2312 一级常用汉字 3755 + GB2312 符号区 + 常用中文标点 + ASCII，共约 4540 字符。

| 文件 | 字体 | 版权 | 许可 | 来源 |
|------|------|------|------|------|
| NotoSansSC-Regular.subset.woff2 / -Bold / -Black | Noto Sans SC（思源黑体，可变字体实例化为 400/700/900） | © 2014-2021 Adobe，Reserved Font Name 'Source' | OFL 1.1，全文见 `OFL-NotoSansSC.txt` | https://github.com/google/fonts/tree/main/ofl/notosanssc |
| NotoSerifSC-Black.subset.woff2 | Noto Serif SC Black（思源宋体 Black，子集化，用于杂志宋体风模板） | © 2017-2021 Adobe，Reserved Font Name 'Source' | OFL 1.1，全文见 `OFL-NotoSerifSC.txt` | https://github.com/notofonts/noto-cjk/tree/main/Serif |
| SmileySans-Oblique.subset.woff2 | 得意黑 Smiley Sans v2.0.1 | © 2022–2024 atelierAnchor，Reserved Font Name Smiley / 得意黑 | OFL 1.1，全文见 `OFL-SmileySans.txt` | https://github.com/atelier-anchor/smiley-sans/releases/tag/v2.0.1 |
| ZCOOLKuaiLe-Regular.subset.woff2 | 站酷快乐体 ZCOOL KuaiLe | © 2018 The ZCOOL KuaiLe Project Authors | OFL 1.1，全文见 `OFL-ZCOOLKuaiLe.txt`（取自 google/fonts 仓库同目录） | https://github.com/google/fonts/tree/main/ofl/zcoolkuaile |
| NotoSerifSC-Bold.subset.woff2 / NotoSerifSC-Regular.subset.woff2（v2.0 新增） | Noto Serif SC Bold / Regular（思源宋体 SC，取自本机 `/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc` / `-Regular.ttc` 第 2 号子字体 SC，未下载） | © 2017-2021 Adobe，Reserved Font Name 'Source' | OFL 1.1（系统 copyright 文件标注 SIL-1.1），全文见 `OFL-NotoSerifSC.txt` | 本机 Debian 包 fonts-noto-cjk |
| NotoSans-SemiCondExtraBold.subset.woff2（v2.0 新增） | Noto Sans（本机可变字体实例化为 wdth 85 / wght 800，仅 ASCII + 少量标点，用于 batch20 竖排/英文小字） | Copyright 2022 The Noto Project Authors | OFL 1.1，全文见 `OFL-NotoSans.txt` | 本机 Debian 包 fonts-noto-core |

注意：子集外的罕见字会回退系统字体；需要更多字时，用同样命令对原字体重新子集化：

```bash
pyftsubset 原字体.ttf --text-file=chars.txt --flavor=woff2 --layout-features='*' --output-file=xxx.subset.woff2
```
