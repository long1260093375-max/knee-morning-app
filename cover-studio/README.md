# 封面工坊 Cover Studio（v1.1）

面向小红书 / 微信公众号 / B 站 / 抖音等平台的**结构化封面设计**工具。  
优先保证**稳定性**：模板为 JSON 图层（背景、图片槽、文字框），用 Canvas 2D **确定性渲染**，不是用 AI 直接出成品图。

## 如何本地运行

本项目为纯静态站点，相对路径，可直接用于后续 GitHub Pages。

```bash
cd /workspace/cover-studio
python3 -m http.server 8765
```

浏览器打开：<http://localhost:8765/>

也可直接用浏览器打开 `index.html`（部分浏览器对 `file://` 下的跨域图片 / 字体有限制，推荐用本地 HTTP）。内置 `refs/` 参考图在 `file://` 下可能无法加载。

## 功能一览

| 功能 | 状态 |
|------|------|
| 平台 / 尺寸预设切换 | ✅ 可用 |
| 内置结构化模板（8 套） | ✅ 可用 |
| 实时 Canvas 预览 | ✅ 可用 |
| 文案 / 背景色 / 图层显隐编辑 | ✅ 轻量可用 |
| 多图绑定 `bgImage` / `stickerImage` | ✅ v1.1 |
| 文字描边 / 斜体 / 阴影 / 胶囊底 / 下划线强调 | ✅ v1.1 |
| 从中文描述生成新模板（规则引擎） | ✅ 可用（启发式） |
| 批量粘贴 CSV/TSV → 预览列表 | ✅ 可用 |
| 单张 PNG 导出 | ✅ 可用 |
| 批量 ZIP 导出（JSZip） | ✅ 可用 |
| 自定义模板 localStorage | ✅ 可用 |
| 参考图上传 + 启发式套用模板 | ✅ v1.1（**非 ML**，见下） |
| 视觉 / LLM 解析描述或参考图 | ⏸ 代码中留有 TODO 钩子 |
| 用户上传商用字体文件 | ⏸ 预留说明，先用 Noto Sans SC |

## 尺寸与平台预设

| 预设 | 像素 | 比例 |
|------|------|------|
| 小红书 3:4 | 1080×1440 | 3:4 |
| 公众号封面 | 900×383 | 约 2.35:1 |
| 公众号次图 1:1 | 500×500 | 1:1 |
| B站封面 16:9 | 1920×1080 | 16:9 |
| 抖音竖版 9:16 | 1080×1920 | 9:16 |
| 通用 3:4 | 1080×1440 | 3:4 |
| 通用 16:9 | 1920×1080 | 16:9 |
| 通用 1:1 | 1080×1080 | 1:1 |

模板坐标为**相对百分比**，同一模板可适配上述任意尺寸。

## 内置模板（8）

1. **清爽健身** — 浅色底 + 左文右图  
2. **简约杂志** — 大图铺底 + 底部文字区  
3. **高对比标题** — 强色底 + 超大标题  
4. **卡片叠层** — 多层卡片，适合课程/知识  
5. **渐变活力** — 暖色渐变 + 居中排版  
6. **暗色科技** — 深色 + 霓虹强调  
7. **POV贴纸问答** — 全幅实景 + 黄字描边标题 + 白胶囊副标题（黄下划线）+ 左下贴纸槽 · 适合 3:4  
8. **人像双行钩子** — 全幅人像 + 下中双行描边钩子（白/黄、可斜体）· 适合 9:16，亦可 3:4  

「从描述生成」会按关键词（健身、科技、杂志、干货、课程、旅行、清爽…）映射到类似布局与色板，并写入本地模板库。

## 参考图解析（诚实说明）

v1.1 **不是**视觉模型，也不会 OCR 出标题。流程是：

1. 读取上传图（或 `refs/` 内置示例）的宽高比  
2. 可选：缩小后抽样上/下半区平均亮度  
3. 按分数建议「POV贴纸问答」或「人像双行钩子」  
4. 你可手动改选，一键套用：**对应模板 + 已知示例文案 + 该图作为 `bgImage`**

无法自动重建贴纸轮廓、真实字号描边或精确图层坐标；那些已固化在模板 JSON 里。

## 批量表格格式

支持 CSV / TSV，首行可为表头：

```text
title,subtitle,badge,image
30天居家训练计划,无需器械,健身,
秋日穿搭灵感,Minimal Style,时尚,
```

也支持中文表头（标题 / 副标题 / 标签 / 图片），或每行只贴一句标题。

## 字体说明（可商用）

- 当前使用 **Noto Sans SC**（Google Fonts CDN），许可证为 **SIL Open Font License (OFL)**，可商用。  
- **请勿盗用未授权字体。**  
- 你后续可自行上传已获授权的商用字体文件：将 `.woff2` / `.ttf` 放到例如 `fonts/`，在 CSS 中用 `@font-face` 声明，并在模板图层的 `fontFamily` 字段中填写字体名即可。

## 模板 JSON 结构（简述）

```json
{
  "id": "pov-sticker-qa",
  "name": "POV贴纸问答",
  "layers": [
    { "id": "bg-image", "type": "image", "binding": "bgImage", "x": 0, "y": 0, "w": 100, "h": 100, "fit": "cover" },
    { "id": "title", "type": "text", "binding": "title",
      "strokeOuter": { "color": "#FFFFFF", "width": 1.35 },
      "stroke": { "color": "#111111", "width": 0.55 },
      "shadow": { "color": "rgba(0,0,0,0.35)", "blur": 1.2 } }
  ]
}
```

`x/y/w/h/fontSize/stroke.width` 等为相对画布宽高或较短边的百分比（见 `renderer.js`），保证跨尺寸稳定。

## 目录结构

```text
cover-studio/
  index.html      # 单页入口
  style.css       # 界面样式
  app.js          # 主逻辑（含参考图启发式）
  sizes.js        # 尺寸 / 平台预设
  templates.js    # 内置模板 + localStorage
  generator.js    # 中文描述 → 模板（规则引擎）
  renderer.js     # Canvas 2D 渲染与 PNG 导出
  refs/           # 用户参考封面副本（预览默认）
    pov-sticker-qa.png
    portrait-dual-hook.png
  README.md
```

静态资源以 `?v=1.1` 查询串便于刷新缓存（无 Service Worker）。

## 后续计划（钩子）

- `generator.js` 顶部 TODO：接入 LLM / 视觉模型增强「从描述生成」  
- 参考图 Tab：若接入真视觉解析，仍应输出同样结构的 layers JSON  
- 字体：用户上传商用字体并绑定到模板  

---

自用优先，无登录。导出即最终封面；预览与导出共用同一渲染路径，保证所见即所得。

## 人物照片自动抠图（v1.2）

- 位置：左侧「内容」区 →「人物照片（自动抠图）」。上传人像后**默认自动去背景**，透明人物层自动放进封面（模板若有 `binding: "person"` 的图片图层则放入该槽，否则放在默认人物槽：画布右侧、底部对齐、contain 缩放，位于文字层下方）。
- 「抠图」开关：关闭即用原图。抠图失败（模型加载失败、没检测到人物等）会自动回退原图，并在下方显示一行中文提示，不影响其它功能。
- 「收边」滑条：0～6，数值越大边缘越柔和（羽化）。「缩放」滑条 / 预览图上滚轮：缩放人物；在预览图上**拖动**可移动人物；「复位」恢复默认位置，「移除」去掉人物。
- 缓存：同一张图（按 文件名+大小+修改时间）只算一次分割，调整收边只重新合成，不重复推理。
- 批量：右侧批量区可一次选多张「人物照片」，按文件名（自然排序，如 01.jpg、02.jpg…）依次对应第 1、2、3… 行；导出 ZIP 时每行自动抠图并使用默认位置。没有对应照片的行使用左侧当前人物（含你拖动后的位置）。
- 导出 PNG：人物层以透明 PNG 合成到画布，与其它图层正确叠加。

### 技术与依赖（v1.3 起随站自托管）

- 库：MediaPipe Tasks Vision `@mediapipe/tasks-vision@0.10.14` 的 `ImageSegmenter`（Apache-2.0），未使用任何 AGPL 库。
- **所有抠图依赖都放在 `vendor/` 目录，随站点一起发布，用相对路径加载，不依赖外网**（国内可用）。照片全程在浏览器本地处理，不上传。
- 加载顺序：本地 `vendor/` → 本地失败才回退 CDN（jsdelivr + storage.googleapis.com）→ 再失败则回退原图并提示。
- `vendor/` 内容（合计约 35MB）：

| 路径 | 大小 | 说明 |
|---|---|---|
| `vendor/mediapipe/vision_bundle.mjs` | 134KB | JS 运行库 |
| `vendor/mediapipe/wasm/vision_wasm_internal.{js,wasm}` | 0.2MB + 9.0MB | WASM（SIMD） |
| `vendor/mediapipe/wasm/vision_wasm_nosimd_internal.{js,wasm}` | 0.2MB + 8.9MB | WASM（旧浏览器无 SIMD 时用） |
| `vendor/mediapipe/models/selfie_multiclass_256x256.tflite` | 15.6MB | 主模型（float32） |
| `vendor/mediapipe/models/selfie_segmenter.tflite` | 0.24MB | 备用模型（float16） |
| `vendor/mediapipe/LICENSE`、`NOTICE` | — | Apache-2.0 许可与来源说明 |
| `vendor/jszip/jszip.min.js`、`LICENSE.markdown` | 95KB | JSZip 3.10.1（选用 MIT 授权），本地优先，失败回退 CDN |

- 用户实际只下载一套 WASM（约 9MB）+ 主模型（约 16MB），首次抠图需从本站加载约 25MB，之后浏览器缓存。单文件均远小于 GitHub 的 100MB 限制。
- 仍为外链的只有 Google Fonts 字体（打不开时自动用系统字体，不影响功能）。
- 代码：`segment.js`（抠图与缓存）、`renderer.js`（人物层注入、contain/底部对齐、位移缩放）、`app.js`（界面与批量接入）。

### 已知局限

- 头发丝、半透明发梢、飘散碎发边缘较硬或略有残留；复杂背景、与背景颜色接近的衣服/头发可能被误切。
- 照片里已有的文字/贴纸若压在人物身上会被一起保留。
- 多人照片会把所有人一起抠出；非人像（宠物、物品）基本无法识别。
