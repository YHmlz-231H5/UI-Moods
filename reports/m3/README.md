# M3 · 定性对照报告：纯文字 vs Bundle 引用 vs 仓库引用

- 日期：2026-08-10
- 依据：`UI-Moods-前置规划-v0.2.html` M3（3 场景定性对照，非重型双盲）
- 产物：本报告 + `scenario-1-text.html` / `scenario-2-bundle.html` / `scenario-3-repo.html`

## 1. 目的

验证「风格引用」协议是否真的降低实现失真：同一功能需求，分别用
① 纯文字描述、② `ui-moods bundle` 提示包、③ 仓库内 `style: mood/…@1.0.0`
三种方式交给 agent，对比观感、token 越界次数与返工点。

## 2. 方法与局限

- 需求：设置页（资料表单 / 保存·取消·删除按钮 / Active 徽章 / 62% 进度条 / 提示信息），见 `requirement.md`。
- Mood：`glass@1.0.0`（深色 + effects，最考验参数化的主题）。
- 实现者：同一 agent（本实现方）。**局限声明**：非双盲，实现方对 tokens 有先验知识，真实场景下「纯文字」的失真通常更大；本报告的数值是下界估计。
- 量化口径：**越界颜色 = 产物色值集合 − tokens 内出现过的色值集合**（剥离 HTML/CSS 注释后提取，tokens 含 shadows/effects 中的 rgba）；另记录 `border-radius` 与 `backdrop-filter`。
- 免责声明（对外引用时固定措辞）：*Illustrative qualitative comparison by
  the same agent (not double-blind). Numbers are a lower bound on text-only
  drift. Not a published benchmark.*

## 3. 场景定义

| 场景 | 输入 | 依据文件 |
| --- | --- | --- |
| ① text-only | 一段 90 字文字描述（深色、毛玻璃、紫色高光、圆角现代感） | `scenario-1-text.html` |
| ② bundle | `ui-moods bundle glass` 输出（引用头 + prompt + tokens + checklist） | `scenario-2-bundle.html` |
| ③ repo reference | `style: mood/glass@1.0.0` + AGENTS.md + moods/glass/ 四件套 | `scenario-3-repo.html` |

## 4. 量化结果

| 指标 | ① text-only | ② bundle | ③ repo |
| --- | --- | --- | --- |
| 越界颜色数（不在 tokens 内） | **15** | 0 | 0 |
| 卡片圆角 | 16px（tokens: 20px） | 20px ✓ | 20px ✓ |
| 毛玻璃模糊 | blur(12px)（tokens: 16px） | blur(16px) ✓ | blur(16px) ✓ |
| 背景色 | #0e0e1f（偏蓝偏暗） | #0f1023 ✓ | #0f1023 ✓ |
| 额外引入色相 | #6c63ff / #38bdf8 渐变 | 无 | 无 |

② 与 ③ 渲染逐像素一致（产物字节数相同，差异仅在注释与自检说明）。

## 5. 定性观察

### ① 纯文字（15 处越界）

- 观感：整体「像玻璃」但色相漂移（背景更蓝、强调色偏冷），圆角与模糊参数凭感觉取值。
- 返工点：背景色、强调渐变、卡片圆角、模糊强度至少 4 处需人工逐项纠正；「紫色高光」被实现为青紫渐变，属自由发挥。
- 结论：文字只能传达气质，无法传达参数；这正是项目痛点 P1–P4 的直接复现。

### ② bundle（0 越界）

- 观感：与 tokens 严格一致；agent 无需访问仓库即可拿到全部参数与验收清单。
- 优点：一次性、上下文自包含、版本头明确（`mood/glass@1.0.0`）。
- 局限：无 `AGENTS.md`/validate 环境，只能靠 agent 自律遵守 checklist。

### ③ repo reference（0 越界）

- 观感：与 ② 一致；额外获得 AGENTS.md 规则与 `ui-moods validate` 可复验。
- 优点：可复现、可版本追溯、长期项目友好（v0.2 §8.2-B）。

## 6. 对协议的关键发现

1. **参数引用有效**：只要把 tokens 喂给 agent，颜色/圆角/模糊全部零偏差；纯文字场景的 15 处越界全部消失。
2. **tokens 覆盖度是下一个瓶颈**：实验初稿中，② 场景曾出现从 token 色相派生的透明变体（如 `rgba(139,123,255,0.28)` 徽章底、青色渐变），经 checklist 收敛后移除——说明 **token-only 检查有效**，但徽章/告警等**组件级状态色**未被 tokens 显式覆盖（v1.1 建议通过 `components` 层补 badge/alert 定义）。
3. **bundle 与仓库引用收敛**：严格遵循 tokens 时两条路径产出一致；差异在工作流（一次性 vs 可复验），而非视觉结果。
4. **checklist 的价值在「事后可查」**：② 场景的 checklist 在包内，③ 场景可跑 validate；两者都能约束结果，但 ③ 把「声称」变成「可验证」。

## 7. 结论

M3 达成预期：协议能把「凭感觉」变成「按参数」，且 3 场景下 bundle/仓库路径零越界。剩余主题补全不改变本结论；建议把 ① 场景的失败样例与 15 处越界清单作为 README 的开源叙事素材。
