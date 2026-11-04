# 封面工坊 Cover Studio（v2.0）

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
| 自托管可商用字体（思源黑体 / 得意黑 / 站酷快乐体） | ✅ v1.4 |
| 爆款风装饰（贴纸字、人物白边、纹理、箭头星星徽章） | ✅ v1.4 |

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

## v1.7 新增（文字不遮挡人物 + 参考图 1:1 复刻）

- **文字避让人物（默认开，人物区开关）**：renderer 用抠图 alpha（96px 网格；无抠图时用估计人物区）与每个文字/徽章/装饰/图标的渲染框算覆盖率，>3% 或碰到脸部框即冲突；自动依次尝试：人物平移/缩放/上移（上移时半身切口底部羽化，整图背景用拉伸模糊补边）、文字挪到人物另一侧留白、小范围挪动文字、标题缩字 90%/80%、隐藏仍冲突的装饰。仍冲突时人物区显示红色提示；单张/多平台 ZIP/批量导出都会自检并在状态栏报告。照片格（photoSlot）里的人物也计入。
- **头部遮挡标题**默认关闭，仅在关闭避让时可勾选（旧版效果）。38 出血巨字、42 三条照片拼贴、50 荧光网格、59 上下前后对比 改为不压人物的并列分区版式。
- 新增图层：`icon`（内置矢量图标：robot/flow/chart/gear/bolt/list/target/bulb/check/flag，圆角方块底+标签）；`image` 支持 `src` 静态素材。
- 新增 `templates-replica.js`：ref10 九宫格 1:1 复刻（ref10-r1c1 … ref10-r3c3），背景为本地生成的无人物图（assets/ref10/*.jpg，约 750KB）。
- 检测报告：`cover-samples-v5/overlap-audit.md`（v1.6 审计）、`overlap-report.md`（v1.7 结果）。

### v1.7 文字特效重做（renderer.js `normFx` / `TEXT_FX`）
- 文字层改为离屏合成：外描边→内描边→填充 合成“字体本体”，阴影/挤出/发光都由本体轮廓派生（一次绘制，不再逐段叠 strokeText，避免半透明叠色、重影、阴影与描边错位）。
- 统一规范：lineJoin/lineCap=round、miterLimit=1；内描边 ≤ 字号 13%，外框比内描边至少宽 6%、最多宽 20%；硬阴影统一右下 45°、偏移 ≈ 字号 5%；柔影 blur ≤ 字号 8%、不透明度 ≤ 0.45；发光为 3 层递减模糊；自动拟合只改字号，不做非等比缩放。
- 预设（页面「文字效果」下拉，作用于标题层）：模板默认 / 粗白字黑描边黑硬影 / 黄字黑描边白外框 / 荧光发光 / 杂志宋体细描边轻投影 / 立体挤出 / 手写体白描边彩色投影。
### v1.7 人物特效重做（`drawStickerImage` / `PERSON_FX`）
- 抠图去色边（半透明边缘取内侧实色 + alpha 平滑收紧）；白描边 = 模糊后平滑阈值的真实膨胀轮廓（宽度夹在人物高度 0.6–1.2%，圆角无锯齿无断裂）；外发光 3 层低透明度、颜色取当前配色强调色；投影 = 接触阴影 + 右下 45° 柔和长阴影（与文字阴影同向），离屏留足边距不裁切。
- 预设（页面「人物特效」下拉）：模板默认 / 无 / 白色贴纸描边 / 彩色描边+硬阴影 / 柔光外发光 / 自然接触阴影。
- 素材许可见 `LICENSES.md`（AI 生成素材已标注）。

### v1.7 复刻第一批（ref1~ref4）与新增能力
- 36 个逐格独立模板：`ref1-r1c1 … ref4-r3c3`（文件 templates-replica-a.js，group=refN，名称前缀 R1·/R2·…）。原图里压在人物身上的底部大字，统一改为「人物裁在底部色带上沿（clipBox）+ 色带里放字」，文字不遮挡人物。
- **撕纸边**：shape `torn`（jag 锯齿大小、edges 选择撕哪几条边）；照片 `photo.torn`；任意图层 `clipBox: {x,y,w,h, torn:true}` 裁成撕纸形（手账相框）。
- **图层裁切 clipBox**：百分比裁切框（矩形/圆角/撕纸），避让检测同步按裁切区域计算人物遮罩。
- **手写字体**：龙藏体 Long Cang（OFL，自托管子集），字体切换里新增「手写」。
- **弧形字**：text 图层 `arc: { bend: 40 }`（正=拱形，负=笑脸），支持描边/外描边/硬阴影。
- **图标库**：Tabler Icons 68 个（MIT），`{ type:'icon', icon:'tb:coffee', tile:false, color, outline, fillIcon, weight }`。
- **物品贴纸**：assets/gen/cut/*.png（AI 生成物品的本地抠图）。
- **多行折行放大**：text `breakLines: N`（fit=width 时自动在 1/N 处断行，取字号最大的方案）；1:1 窄栏模板（templates-square.js）已启用。
- 人物图层 `align: 'top'`。

## v1.6 新增（设计规则落地 + 参考图全复刻 + 一键配色/字体）

学习笔记见 `/workspace/design-learning.md`，审计见 `cover-samples-v4/audit.md`，参考映射见 `cover-samples-v4/ref-inventory.md`。

### 渲染层通用设计规则（`renderer.js`，`data.design` 可逐项关闭）
| 规则 | 实现 |
|---|---|
| 标题自动断行 | `fit:'width'` 单行标题自动尝试 2 行断句（在标点/“的”后断，数字+单位不拆），字号大 18% 以上才采用 |
| 孤字回挤 | 自动换行时末行只剩 1 字 → 缩窄行宽重新均衡 |
| 标点避头尾 | 行首禁 `，。！？、；：”）》…—%` 等；行尾禁 `（《“「¥` 等 |
| 主副字号比 | 副标题 / tagline 字号 ≤ 主标题 ÷ 2.2（图层 `noRatio:true` 例外） |
| 小字下限 | 所有文字 ≥ 短边 2.6%（`tiny:true` 例外） |
| 统一安全边距 | 文字框自动夹进 4% 短边安全区（`bleed:true` 出血大字例外） |
| 描边规范 | 描边比例钳制 0.03–0.34×字号；双层描边（内深外白）+ 纯色无模糊硬阴影 |
| 自动对比度 | 采样文字下方底图亮度，WCAG 对比 < 3:1（有硬阴影 < 2.2:1）时自动加柔边半透明遮罩 |
| 次级元素上限 | 徽章 + 装饰（星/心/箭头/胶带等）≤ 3 个，超出自动隐藏（`essential:true` 例外） |
| 照片统一调色 | 对比 +6%、饱和 +10%、3×3 轻锐化、20% 暗角（可关） |
| 贴纸投影 | 抠图人物增加柔和接触投影（大模糊、42% 透明） |
| 颗粒质感 | 可选 6% overlay 噪点 |

### 一键换配色 / 字体风格（对全部模板生效）
- 配色：模板原色 / 荧光黄黑 / 奶油棕 / 紫白 / 蓝橙 / 红黄 / 黑金。算法：按色相分组统计模板彩色，最常用 → accent、第二 → accent2，深色 → dark，带色浅底 → paper，并保留原来的明暗关系（浅色变 accent 浅调、深色变 accent 深调），布局不变。
- 标题字体：模板默认 / 粗黑（思源黑体 Black）/ 宋体（思源宋体 Black）/ 圆润（站酷快乐体）/ 得意黑。只替换标题字族，副标题保持黑体（≤2 种字体）。
- 未新增字体文件（复用 v1.4/v1.5 已自托管的 OFL 字体），字体体积增量 0。

### 新渲染能力
- `photoSlot` 图层：把人物原照片按 focus/zoom 裁进任意框（照片条、缩略图扇形、网格、相框、前后对比）。
- 文字 `vertical:true` 竖排；`part/parts` 支持按 `/`、`、`、`，` 分段。
- 模板 `autoWide:'left'|'right'`：16:9 时自动把文字压到半边、人物移到另一半。

### 参考图模板（`templates-ref.js`，40 个，id 带来源）
84 个参考小封面 + 2 张早期参考全部归类，版式相同的合并（配色/字体切换覆盖差异），完整表见 `cover-samples-v4/ref-inventory.md`。

| 模板 id | 名称 | 来源 |
|---|---|---|
| ref1-r1c1-float-tags | 浮动问题标签 | ref1-r1c1, ref1-r3c3, ref9-r2c1 |
| ref1-r1c2-vs-words | 文字VS对比 | ref1-r1c2 |
| ref1-r1c3-bottom-band | 双色巨字+底条 | ref1-r1c3, ref2-r2c3 |
| ref1-r2c1-burst-rays | 放射线爆款 | ref1-r2c1, ref9-r2c2 |
| ref1-r3c1-blue-sticker | 蓝黄贴纸字 | ref1-r3c1 |
| ref1-r3c2-corner-chars | 四角大字 | ref1-r3c2, ref7-r2c1~c3 |
| ref2-r1c1-color-frame | 彩色边框金句 | ref2-r1c1 |
| ref2-r1c3-quote-serif | 引号金句 | ref2-r1c3, ref5-r3c2 |
| ref2-r3c1-story | 人物故事 | ref2-r3c1, ref2-r3c2 |
| ref2-r3c3-big-number | 巨型描边数字 | ref2-r3c3 |
| ref4-r1c3-gold-number | 黑金大数字 | ref4-r1c3, ref6-r2c2, ref5-r3c2 |
| ref4-r1c1-pink-ip | 粉白杂志混排 | ref4-r1c1, ref6-r1c3 |
| ref4-r2c2-cyan-lines | 青色分行叙述 | ref4-r2c2, ref6-r3c2 |
| ref4-r2c3-yellow-question | 黄底问句大字 | ref4-r2c3, ref6-r3c3 |
| ref4-r3c2-mixed-vertical | 宋体竖排混色 | ref4-r3c2, ref6-r2c3, ref6-r1c2, ref4-r3c1 |
| ref6-r3c1-vertical-x | 竖排警示+红叉 | ref6-r3c1 |
| ref5-r1c1-handwrite | 手写感错落白字 | ref5-r1c1, ref5-r1c2, ref8-r4c3 |
| ref5-r1c3-bleed-giant | 出血巨字 | ref5-r1c3 |
| ref5-r2c1-blue-slant | 蓝色斜条 | ref5-r2c1 |
| ref5-r2c2-plus-chips | 加号三标签 | ref5-r2c2 |
| ref5-r2c3-vignette | 暗角彩字Vlog | ref5-r2c3 |
| ref5-r3c1-photo-strips | 三条照片拼贴 | ref5-r3c1 |
| ref8-r1c1-cream | 奶油可爱 | ref8-r1c1, ref8-r4c1 |
| ref8-r1c2-item-list | 清单单品 | ref8-r1c2 |
| ref8-r1c4-purple-sparkle | 紫色闪光 | ref8-r1c4, ref8-r2c3 |
| ref8-r2c1-night-number | 夜景巨数字 | ref8-r2c1 |
| ref8-r2c2-peek | 底部探头 | ref8-r2c2 |
| ref8-r3c1-purple-vertical | 紫底竖排英文 | ref8-r3c1 |
| ref8-r3c2-moody | 暗调氛围 | ref8-r3c2, ref2-r3c2 |
| ref8-r3c3-neon-grid | 荧光网格 | ref8-r3c3, ref8-r3c4 |
| ref8-r4c2-chat | 聊天气泡 | ref8-r4c2 |
| ref8-r4c4-white-minimal | 白色极简 | ref8-r4c4 |
| ref9-r1c1-left-reveal | 左侧反转大字 | ref9-r1c1 |
| ref9-r1c3-duo-talk | 双人对谈 | ref9-r1c3 |
| ref9-r2c3-dark-network | 暗色节点网络 | ref9-r2c3, ref9-r3c3 |
| ref9-r3c2-thumb-fan | 作品扇形展示 | ref9-r3c2, ref9-r1c2 |
| ref9-r3c1-scrapbook | 旅行拼贴手账 | ref9-r3c1, ref3 系列纸感 |
| ref3-r3c2-signature | 紫框手写签名 | ref3-r3c2, ref3-r3c3, ref3-r2c3 |
| split-before-after | 上下前后对比 | 新增 |
| closeup-giant | 大头特写巨字 | 新增 |

承接到 v1.5 模板（v1.6 重做细节）：ref1-r2c2→13 照片夹击；ref1-r2c3 / ref2-r2c1 / ref2-r2c2→14 荧光大字报；ref4-r1c2 / ref4-r2c1→15 杂志宋体；ref3 系列→16 紫色便签；ref9-r2c2→17 口播黄黑；ref7 系列→18 圆角卡片；ref4-r3c3→19 口播数字清单；ref1-r3c3 / ref6-r1c1→20 避雷；ref8-r2c4→01；ref8-r1c3→11。

参考图只复刻版式，未拷贝参考图中的人物、logo 与原文案；示例文案为中性口播/拍剪类，已避开极限词与收入/医疗承诺。

## v1.5 新增（口播 / 小红书真人照片系列、背景图、安全区、合规词）

### 新模板 8 个（口播封面 16:9 / 9:16 + 小红书 3:4）
人物**原照片整图当背景**（不抠图也能用），左侧「人物照片 → 显示方式」可切到「抠图贴纸」（此时可叠背景图库）。
勾选「头部遮挡标题」时，会把抠图结果与原照片对齐、只在标题区域重画头部，形成“字被头挡住”的层次（需开启抠图）。

| id | 名称 | 风格要点 |
|---|---|---|
| photo-sandwich | 照片夹击大字 | 荧光绿大字上下（横版左右）夹击人物；标题用 `/` 分两段，如 `剪辑/干货` |
| neon-poster | 荧光大字报 | 左上逐行堆叠黄绿超大字 + 右侧问题清单（副标题用 、 分隔）+ 紫色斜条 |
| magazine-serif | 杂志宋体 | 思源宋体 Black 竖排大字 + 斜体英文（tagline）+ DESIGNED BY 品牌条 + 黄色宋体结论 |
| purple-memo | 紫色便签手账 | 薰衣草紫底 + 白边圆角照片 + 便签手写标题（站酷快乐体）+ 胶带 + 小图标 |
| talk-yellow | 口播博主黄黑 | 黄字黑描边 + 「零基础必看」气泡 + 绿色 ✓ 要点 + 底部黑条 |
| card-feed | 圆角卡片 | 信息流卡片：卡内上下两段大字 + 小标签 + 卡下笔记标题 / 账号 |
| talk-list | 口播数字清单 | 顶部黄字 + 编号粉色要点条（副标题用 、 分隔）+ 底部黄色高亮条 |
| avoid-pit | 避雷踩坑 | 头两侧超大黄字 + 红叉 / 警示三角 + 蓝色坑点标签 + 底部白色结论 |

模板字段：`photo:{x,y,w,h,radius,frame,focusX,focusY,zoom,offsetY,fit:'height',shade:[…],filter,at:{…}}`；图层 `type:'occluder'`（clipY）；`onlyPhoto/onlySticker`；文字 `part`（夹击分段）、`ignoreFace`；徽章 `vertical`；形状新增 `cross`、`triangle`。
横版用竖照时，照片按高度放置，两侧用照片边缘条拉伸 + 模糊补满（不会出现第二个模糊人像）。

### 脸部安全区提示（仅提示）
按抠图 alpha 包围盒估算头部 → 脸部椭圆；若某文字层覆盖脸部 >12%，在人物区域下方显示黄色提示。勾选「安全区」时预览上会画出脸部椭圆（红=被挡）。开启「头部遮挡标题」时不提示。估算较粗，侧脸 / 多人 / 非半身照可能不准。

### 背景图库（assets/backgrounds，13 张，约 2.0MB）
cafe 咖啡馆、city-day 城市白天、city-night 城市夜景、desk 书桌、living 客厅、gym 健身房、park 公园、beach 海边、studio 工作室、bokeh 光斑、graffiti 涂鸦墙、mall 商场、paper 纸张。
均为 2026-11-03 用 AI 生成（768×1024）后放大到 1080×1440 并压缩，各附 180×240 缩略图；元数据见 `index.json`（id / 名称 / 主色 / 明暗 / 适合模板）。
左侧「背景图」：缩略图选择 / 上传 / 「无」；模糊 0–20px、亮度、主色蒙层滑杆；可勾选后拖动预览调焦点。上传图先缩到 2048px 内；加载失败自动回退模板原背景。
批量表格可加 `bg` 列（库 id、图片 URL 或 `none`），空则用左侧当前背景。

### 其他
- **安全区参考线**（工具栏「安全区」）：小红书 / 抖音 / B站 / 公众号各自的遮挡区，仅预览，不进导出图。
- **合规词提示**：标题 / 副标题下方黄色提示（极限词、医疗功效、站外导流、收入/效果承诺），词表在 `compliance.js`，可自行增删；仅提示不拦截。
- **多平台一键 ZIP**：同一内容导出 3:4 / 9:16 / 16:9 / 1:1 四张。
- **第二人物**：「对比VS」左侧可单独上传。
- 新字体：Noto Serif SC Black 子集（OFL，约 1.2MB）。v1.5 总增量约 3.3MB（背景 2.0MB + 宋体 1.2MB + 脚本）。

## 内置模板（v1.4 的 12 个 + 上面 v1.5 的 8 个）

所有模板都带人物槽（`binding: "person"`），并为 3:4 / 16:9 / 1:1 / 9:16 分别给出版式（`layer.at`）。

1. **清爽健身** `fresh-fitness` — 薄荷渐变 + 网点 + 黄色色块托人物，深绿贴纸大字，红色爆炸角标
2. **简约杂志** `magazine-simple` — 奶油噪点底 + 红圆，刊头大字被人物头部压住（人物在标题之前）
3. **高对比标题** `high-contrast` — 红色放射线 + 黑色斜条上的黄字黑描边硬阴影大字
4. **卡片叠层** `card-stack` — 靛蓝方格 + 双层白/黄卡片硬阴影 + 胶带，关键词黄色高亮块
5. **渐变活力** `gradient-vitality` — 橙粉斜纹渐变，站酷快乐体大字，对话气泡副标题
6. **暗色科技** `dark-tech` — 深色网格 + 青色霓虹描边人物 + 品红错位硬阴影
7. **POV贴纸问答** `pov-sticker-qa` — 可选实景底图（自动模糊）+ 黄字黑描边白外描边 + 白胶囊问句黄笔触下划线 + 白边人物贴纸
8. **人像双行钩子** `portrait-dual-hook` — 大人像 + 胸前双行钩子（白/黄，得意黑）· 适合 9:16
9. **大字报·人物压标题** `big-poster`（新）— 黄底网点 + 警示斜纹，红黑超大标题，人物头顶压标题下沿
10. **对比VS·前后** `versus-split`（新）— 左灰右黄分屏，左侧黑白人物「以前」、右侧彩色「现在」，中间 VS 爆炸贴
11. **贴纸拼贴** `sticker-collage`（新）— 方格手账底 + 圆角拍立得人物 + 胶带 + 便利贴 + 星星爱心
12. **数字清单** `number-list`（新）— 标题数字自动红块高亮；副标题用 `|` 或 `；` 分隔自动变成 ①②③ 要点列表

**文案小技巧**：标题中用 `*关键词*` 包住的部分会换色/加高亮块；不加星号时，带数字的模板会自动高亮「3倍」「5个」「30天」这类数字词。

## 设计规范（v1.4，所有内置模板遵守）

1. **大标题**：主标题 `fit: "width"` 自动撑满文字框宽度（约画面 70–90%），建议单行 4–8 字；副标题小一档但 ≥ 短边 4%；关键词可换色或加色块。
2. **贴纸字**：填充 + 内描边 + 外描边（白/深色）+ **偏移硬阴影**（`hardShadow`，不是模糊阴影），黄/白/红高对比。
3. **人物贴纸**：抠图后对 alpha 外扩生成 6–14px 白边（`sticker.width`）+ 深色硬阴影；可通过图层顺序实现「人物在标题之前/之后」；人物通常占画面高度 60–100%，人物底边出画（不露底部切边）。
4. **配色**：每个模板 2–3 个主色；背景 = 渐变 + 大色块 + 纹理（网点/渐变网点/斜纹/放射线/方格/噪点之一），不留大片平涂空白。
5. **装饰**：箭头、星星、闪光、爆炸角标、圆/blob/波浪色块、对话气泡、胶带、笔触下划线、手绘圈，全部 Canvas 矢量绘制，随机量用图层 id 做种子 → 确定性输出。
6. **构图与安全区**：边缘留 5%；9:16 的文字放在 12%–76% 高度之间（避开抖音顶部状态栏与底部文案/按钮区）；文字块不压脸（人物脸部位于文字块之下或侧边）。

### 渲染器新能力（renderer.js）
| 能力 | 字段 |
|------|------|
| 比例版式覆盖 | `layer.at = { portrait / tall / square / wide: {...} }` |
| 背景纹理 | `background.pattern` 或 `type: "pattern"`：`dots / halftone / stripes / rays / grid / noise` |
| 矢量形状 | `shape: rect / ellipse / star / burst / sparkle / heart / blob / wave / bubble / tape / arrow / brush / ring`，支持 `rotate / border / hardShadow / opacity / square` |
| 文字 | `fit: "width"`、`maxFontSize`、`hardShadow`、`strokeOuter`、`highlight: { color, block }`、`autoHighlight: "digits"`、`banner.perLine`、`underline.brush`、`splitOn + listPrefix`、`letterSpacing`、`rotate` |
| 人物 / 图片 | `sticker: { width, color, shadow }`、`frame`（拍立得白框）、`filter`（如黑白）、`scale`、`halign`、`focusY`、`clip` |
| 角标 | `badge.shape: rect / ellipse / burst / star / bubble`，`binding: "static"` 用固定文字 |

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

## 字体说明（可商用，全部自托管）

字体全部放在 `vendor/fonts/`，由 `vendor/fonts/fonts.css` 声明，**不再请求 Google Fonts**（国内可用、可离线）。许可证与来源见 [`vendor/fonts/LICENSES.md`](vendor/fonts/LICENSES.md)。

| 字体 | 用途 | 许可 | 文件 |
|------|------|------|------|
| Noto Sans SC（思源黑体）Regular / Bold / Black | 默认正文与粗标题 | SIL OFL 1.1 | 3 个 woff2 子集，各约 0.6MB |
| 得意黑 Smiley Sans | 个性斜体标题（人像钩子、VS） | SIL OFL 1.1 | 约 0.5MB |
| 站酷快乐体 ZCOOL KuaiLe | 可爱圆润标题（渐变活力、贴纸拼贴） | SIL OFL 1.1 | 约 0.45MB |
| Noto Serif SC（思源宋体）Black | 杂志宋体模板（v1.5） | SIL OFL 1.1 | 约 1.2MB |

- 子集范围：GB2312 一级常用汉字 3755 + GB2312 符号区 + 常用中文标点 + ASCII（约 4540 字符）。罕见字会自动回退到系统黑体（PingFang SC / 微软雅黑 / 思源黑体），不会崩溃。
- 渲染前会 `document.fonts.load()` 对应字体（最多等 4 秒），加载失败也照常出图。
- 模板图层用 `fontFamily` 指定字体；想换自己的商用字体：把 woff2 放进 `vendor/fonts/`，在 `fonts.css` 加 `@font-face`，再在模板里写字体名。**请勿使用未授权字体。**

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
  segment.js      # 本地 MediaPipe 人像抠图
  vendor/         # 自托管依赖：fonts/（字体+许可）、mediapipe/、jszip/
  refs/           # 用户参考封面副本（预览默认）
    pov-sticker-qa.png
    portrait-dual-hook.png
  README.md
```

静态资源以 `?v=1.4` 查询串便于刷新缓存（无 Service Worker）。

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

- v1.4 起字体也已自托管（`vendor/fonts/`），页面正常使用不再请求任何外链；仅本地 MediaPipe 失败时才回退 CDN。
- 代码：`segment.js`（抠图与缓存）、`renderer.js`（人物层注入、contain/底部对齐、位移缩放）、`app.js`（界面与批量接入）。

### 已知局限

- 头发丝、半透明发梢、飘散碎发边缘较硬或略有残留；复杂背景、与背景颜色接近的衣服/头发可能被误切。
- 照片里已有的文字/贴纸若压在人物身上会被一起保留。
- 多人照片会把所有人一起抠出；非人像（宠物、物品）基本无法识别。

## v1.7 第二批
- 新模板 templates-replica-b.js：ref5/ref6(独立格)/ref7/ref8/ref0；ref6 的 5 个重复格以别名指向 ref4 模板。
- person.minScale：避让时人物最小缩放下限。
- 模板库：用途/风格筛选、搜索、分组、缩略图懒加载。


## v2.0 更新（2026-11-04）

- 新增模板分组 **「v3 · 20套（v2.0 新增）」**：20 套口播/知识类人物封面（id `b20-t01` ~ `b20-t20`），默认 3:4（1080×1440）。
- 来源：本地 Python/PIL 管线 `polish3/v3` 的 20 个模板 JSON（含上下安全边距规则：顶部 ≥100px、底部 ≥80px；先整体平移，标题撞脸则按模板 `min_title_scale` 缩放）。由 `templates-batch20.js`（数据）+ `renderer-batch20.js`（专用渲染器，`renderer.js` 中按 `engine:'batch20'` 分流）实现。
- 文字、标签、描边、阴影、渐变、羽化底均为 Canvas 代码实时渲染，未烘焙进图片；可改字（标题中用 `/` 分行，对应模板各行）、换人物（上传或批量人物图）、批量导出 ZIP。
- 人物示例图：`assets/batch20/`（14 张，复制自本机已有的 cover-studio-assets-gen 与 polish1 人物图）。
- 新增自托管字体：Noto Serif SC Bold/Regular、Noto Sans 拉丁子集（OFL，见 `vendor/fonts/LICENSES.md`）。
- 原 8 套基础模板及 v1.6/v1.7 模板未改动。

### 已知限制

- 与 Python 原版非像素级一致：字形抗锯齿、描边（Canvas strokeText，横向压缩时描边随之压缩）、羽化（Canvas blur 近似高斯）、调色存在细微差异；宋体标题网页版约宽 5%。
- 上传人物无人脸检测：头部框由抠图人物框按比例估计（无抠图时用画面上中部默认框），避脸为近似。
- 非 3:4 尺寸为 3:4 画布居中裁切，可能裁掉边缘文字。
- 沿用 v3 已知问题：t01/t14/t15/t18 在 390px 缩略图下小字可读性偏弱；t10 换人版顶部留白 96px（略低于 100）。
- 40 张批量 ZIP 约 47MB（PNG）。
