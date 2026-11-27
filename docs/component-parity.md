# Element Plus 对标清单

本文把 Element Plus 的组件总览逐条列出,标注本仓库的覆盖状态,以及**在无 JavaScript 的前提下能不能做出来**。

依据是 Element Plus 官方 `component/overview`:7 类,共 **82 个组件**。

- 统计口径:Element Plus 把 `Input` 的多行形态算作 `Input` 的 `type="textarea"`,把 `Form` 与 `Form Item` 分开计数,把 `Virtualized *` 单独计数。
- 「可无 JS 实现」一列的判据:**能否用原生元素 + CSS 表达**(`<details>`、`<dialog>`、`:checked`、`:focus-within`、`scroll-snap`、`position: sticky`、`<input type="file">`、`<input type="color">`、`<input type="date">`)。
- 本仓库现状:**17 / 82 覆盖**,覆盖的是最高频的一批,不是一个完整面。

## 总览

| 类别 | Element Plus | 本仓库 | 缺 |
| --- | --- | --- | --- |
| Basic 基础 | 12 | 1 | 11 |
| Configuration 配置 | 1 | 0 | 1 |
| Form 表单 | 25 | 8 | 17 |
| Data 数据展示 | 23 | 6 | 17 |
| Navigation 导航 | 9 | 0 | 9 |
| Feedback 反馈 | 10 | 1 | 9 |
| Others 其他 | 2 | 1 | 1 |
| **合计** | **82** | **17** | **65** |

本仓库的 17 个对应关系:`Button`;`Checkbox` `Form` `FormItem` `Input`(含 textarea)`Radio`
`Select` `Slider` `Switch`;`Badge` `Card` `Empty` `Progress` `Skeleton` `Tag`;`Alert`;`Divider`。

## Basic 基础组件(12)

| Element Plus | 本仓库 | 可无 JS 实现 | 备注 |
| --- | --- | --- | --- |
| Button | ✅ `.um-button` | 是 | 变体比 EP 少:`plain` / `round` / `circle` / `dashed` / `link` 尚未拆出 |
| Border | ❌ | 是 | 纯样式,`--um-border-*` 已有角色 |
| Color | ❌ | 是 | 展示色板,仓库里 specimen 已有雏形 |
| Container | ❌ | 是 | 栅格容器 |
| Icon | ❌ | 是 | 仓库禁止图标字体与 emoji,须用 CSS 形状或内联 SVG |
| Layout | ❌ | 是 | 页面骨架 |
| Link | ❌ | 是 | |
| Text | ❌ | 是 | 排版原子 |
| Scrollbar | ❌ | 是 | `::-webkit-scrollbar` + `scrollbar-color` |
| Space | ❌ | 是 | 间距工具类 |
| Splitter | ❌ | 部分 | 拖拽需要 JS;可用 `input[type=range]` 做静态版本 |
| Typography | ❌ | 是 | 标题/段落/列表/引用 |

## Configuration 配置组件(1)

| Element Plus | 本仓库 | 可无 JS 实现 | 备注 |
| --- | --- | --- | --- |
| Config Provider | ❌ | **否** | 全局尺寸/语言/z-index,本质是 JS 上下文。纯 CSS 只能靠 `data-` 属性在根节点切换 |

## Form 表单组件(25)

| Element Plus | 本仓库 | 可无 JS 实现 | 备注 |
| --- | --- | --- | --- |
| Autocomplete | ❌ | 部分 | 静态建议列表可无 JS;输入联动需要 JS |
| Cascader | ❌ | 部分 | 多级 `<details>` 可静态 |
| Checkbox | ✅ `.um-checkbox` | 是 | |
| ColorPicker | ❌ | 是 | `input[type=color]` + 色板 |
| DatePicker | ❌ | 是 | `input[type=date]`;弹层日历需要 JS |
| DateTimePicker | ❌ | 是 | `input[type=datetime-local]` |
| Form | ✅ `.um-field` | 是 | 只有栅格与消息,还没有校验容器语义 |
| Form Item | ✅ `.um-field` | 是 | |
| Input | ✅ `.um-input` / `.um-textarea` | 是 | |
| InputNumber | ❌ | 是 | `input[type=number]` + 步进按钮 |
| InputTag | ❌ | 部分 | 静态展示可;增删需要 JS |
| InputOTP | ❌ | 是 | 一排 `input` |
| Mention | ❌ | 部分 | 静态提及列表可 |
| Radio | ✅ `.um-radio` | 是 | |
| Rate | ❌ | 是 | radio 伪装 |
| Select | ✅ `.um-select` | 是 | 原生 `select`;EP 的虚拟滚动版另计 |
| Slider | ✅ `.um-slider` | 是 | |
| Switch | ✅ `.um-switch` | 是 | |
| TimePicker | ❌ | 是 | `input[type=time]` |
| TimeSelect | ❌ | 是 | 原生 `select` |
| Transfer | ❌ | 部分 | 两栏静态可;移动需要 JS |
| TreeSelect | ❌ | 部分 | `<details>` 树可静态 |
| Upload | ❌ | 部分 | `input[type=file]` + 静态列表 |
| Virtualized Select | ❌ | **否** | 虚拟滚动本质是 JS |
| ColorPickerPanel / DatePickerPanel | ❌ | 部分 | 面板形态 |

## Data 数据展示(23)

| Element Plus | 本仓库 | 可无 JS 实现 | 备注 |
| --- | --- | --- | --- |
| Avatar | ❌ | 是 | 头像 / 首字母 / 兜底图形 |
| Badge | ✅ `.um-badge` | 是 | |
| Calendar | ❌ | 是 | 纯 CSS 月历可做 |
| Card | ✅ `.um-card` | 是 | |
| Carousel | ❌ | 是 | `scroll-snap` + 滚动按钮 |
| Collapse | ❌ | 是 | `<details>` |
| Descriptions | ❌ | 是 | 描述列表 |
| Empty | ✅ `.um-empty` | 是 | |
| Image | ❌ | 是 | |
| Infinite Scroll | ❌ | **否** | 需要 JS 监听滚动 |
| Pagination | ❌ | 是 | 链接列表 |
| Progress | ✅ `.um-progress` | 是 | |
| Result | ❌ | 是 | 结果页块 |
| Skeleton | ✅ `.um-skeleton` | 是 | |
| Table | ❌ | 是 | 静态表格;排序/筛选需要 JS |
| Tag | ✅ `.um-tag` | 是 | |
| Timeline | ❌ | 是 | |
| Tour | ❌ | 部分 | 静态步骤可 |
| Tree | ❌ | 是 | `<details>` |
| Statistic | ❌ | 是 | 数值展示 |
| Segmented | ❌ | 是 | radio 伪装 |
| Virtualized Table / Tree | ❌ | **否** | 虚拟滚动本质是 JS |

## Navigation 导航(9)

| Element Plus | 本仓库 | 可无 JS 实现 | 备注 |
| --- | --- | --- | --- |
| Affix | ❌ | 是 | `position: sticky` |
| Anchor | ❌ | 是 | 锚点链接 |
| Backtop | ❌ | 是 | 锚点 + 滚动 |
| Breadcrumb | ❌ | 是 | |
| Dropdown | ❌ | 部分 | `<details>` 可做静态浮层 |
| Menu | ❌ | 部分 | `<details>` 嵌套菜单 |
| PageHeader | ❌ | 是 | |
| Steps | ❌ | 是 | |
| Tabs | ❌ | 部分 | radio + `:checked` 可做无 JS 标签页 |

## Feedback 反馈(10)

| Element Plus | 本仓库 | 可无 JS 实现 | 备注 |
| --- | --- | --- | --- |
| Alert | ✅ `.um-alert` | 是 | |
| Dialog | ❌ | 部分 | `<dialog open>` 静态可;`showModal()` 需要 JS |
| Drawer | ❌ | 部分 | 同上 |
| Loading | ❌ | 是 | CSS 动画 |
| Message | ❌ | **否** | 命令式 API,本质是 JS |
| MessageBox | ❌ | **否** | 同上 |
| Notification | ❌ | **否** | 同上 |
| Popconfirm | ❌ | 部分 | `<details>` 静态可 |
| Popover | ❌ | 部分 | `<details>` 静态可 |
| Tooltip | ❌ | 是 | CSS `:hover` / `:focus-visible` |

## Others 其他(2)

| Element Plus | 本仓库 | 可无 JS 实现 | 备注 |
| --- | --- | --- | --- |
| Divider | ✅ `.um-divider` | 是 | |
| Watermark | ❌ | 是 | 重复背景 |

## 结论

- **组件覆盖**:17 / 82。缺 65 个,集中在导航(9)、数据展示(16)、反馈(9)与基础(12)。
- **无 JS 的可行性**:**82 个里有 75 个可以用原生元素 + CSS 表达**。真正必须依赖 JS 的只有 7 个:
  `Message`、`MessageBox`、`Notification`(命令式 API)、`Config Provider`(全局上下文)、
  `Virtualized Select` / `Virtualized Table` / `Virtualized Tree`(虚拟滚动)。
  这 7 个里 `Message` / `MessageBox` / `Notification` 可以降级为「静态容器 + 由宿主控制显隐」,
  代价是失去命令式调用。
- **本仓库已经比 Element Plus 多出来的东西**,不应该在追平数量的过程中丢掉:
  - 32 套主题,而不是 EP 的 1 浅 + 1 深;
  - 每一套主题里 46 组对比度保证都被实测(1472 次测量),EP 靠人工校验;
  - 主题变量与组件变量分层,组件层零字面量;
  - 无构建步骤、无运行时依赖。
