# Element Plus 对标清单

本文把 Element Plus 的组件总览逐条列出,标注本仓库的覆盖状态,以及**在无 JavaScript 的前提下能不能做出来**。

依据是 Element Plus 官方 `component/overview`:7 类,共 **82 个组件**。

- 统计口径:Element Plus 把 `Input` 的多行形态算作 `Input` 的 `type="textarea"`,把 `Form` 与 `Form Item` 分开计数,把 `Virtualized *` 单独计数。
- 「可无 JS 实现」一列的判据:**能否用原生元素 + CSS 表达**(`<details>`、`<dialog>`、`:checked`、`:focus-within`、`scroll-snap`、`position: sticky`、`content-visibility`、`input[type=file]`、`input[type=color]`、`input[type=date]`)。
- 本仓库现状:**83 份清单,覆盖 Element Plus 全部 82 个组件**。多出来的两份是 EP 总览里没有单独列出的**分组形态**(`checkbox-group`、`radio-group`);`input` 一份清单同时描述 `Input` 与 `Select`。
- 「本仓库」一列给出的是**清单目录名**,不是类名——一个清单可能画出多个类(`input` 一份清单同时描述 `um-input`、`um-textarea`、`um-select`)。

## 总览

| 类别 | Element Plus | 本仓库 | 缺 |
| --- | --- | --- | --- |
| Basic 基础 | 12 | 12 | 0 |
| Configuration 配置 | 1 | 1 | 0 |
| Form 表单 | 25 | 25 | 0 |
| Data 数据展示 | 23 | 23 | 0 |
| Navigation 导航 | 9 | 9 | 0 |
| Feedback 反馈 | 10 | 10 | 0 |
| Others 其他 | 2 | 2 | 0 |
| **合计** | **82** | **82** | **0** |

## Basic 基础组件(12)

| Element Plus | 本仓库 | 可无 JS 实现 | 备注 |
| --- | --- | --- | --- |
| Button | ✅ `button` | 是 | |
| Border | ✅ `border` | 是 | |
| Color | ✅ `color` | 是 | |
| Layout Container | ✅ `container` | 是 | |
| Icon | ✅ `icon` | 是 | 仓库禁止图标字体与 emoji,图标全部用 CSS 形状绘制 |
| Layout | ✅ `layout` | 是 | |
| Link | ✅ `link` | 是 | 禁用态用 `aria-disabled`,不用类名 |
| Text | ✅ `text` | 是 | 与 `typography` 分工:这是行内的彩色文字原子,那是页面写的块 |
| Scrollbar | ✅ `scrollbar` | 部分 | WebKit 的拇指是伪元素,Firefox 的 `scrollbar-width` 没法主题化;组件自带 `--um-scrollbar-size` |
| Space | ✅ `space` | 是 | |
| Splitter | ✅ `splitter` | 部分 | 拖拽需要 JS;这里给的是不依赖脚本的两栏 |
| Typography | ✅ `typography` | 是 | 标题/副标题/正文/辅助文字/链接/引用 |

## Configuration 配置组件(1)

| Element Plus | 本仓库 | 可无 JS 实现 | 备注 |
| --- | --- | --- | --- |
| Config Provider | ✅ `config-provider` | 是 | EP 的是一个 Vue 上下文提供者;CSS 没有上下文,所以这里给的是**属性契约**:`data-um-size` 与 `data-um-radius` 写在包裹元素上,库按属性响应。它不能设语言、加命名空间或发 z-index,清单里写明了这一点 |

## Form 表单组件(25)

| Element Plus | 本仓库 | 可无 JS 实现 | 备注 |
| --- | --- | --- | --- |
| Autocomplete | ✅ `autocomplete` | 部分 | 建议列表是静态的,输入联动留给宿主 |
| Cascader | ✅ `cascader` | 是 | 嵌套 `<details>`,逐级展开 |
| Checkbox | ✅ `checkbox` | 是 | |
| Color Picker Panel | ✅ `color-picker-panel` | 是 | 预设色板 + 主题色相选择 + 十六进制值 |
| Color Picker | ✅ `color-picker` | 是 | 色板 + 预设 + 十六进制 |
| Date Picker Panel | ✅ `date-picker-panel` | 是 | 月份头 + 周网格 + 页脚 |
| Date Picker | ✅ `date-picker` | 是 | 真的 `<input type="date">` |
| DateTime Picker | ✅ `date-time-picker` | 是 | |
| Form | ✅ `field` | 是 | 表单本体与表单项 |
| Input | ✅ `input` | 是 | 与 `Select` 共用一份清单 |
| Input Number | ✅ `input-number` | 是 | |
| Input Tag | ✅ `input-tag` | 是 | |
| Input OTP | ✅ `input-otp` | 是 | |
| Mention | ✅ `mention` | 是 | |
| Radio | ✅ `radio` | 是 | |
| Rate | ✅ `rate` | 是 | |
| Select | ✅ `input` | 是 | 与 `Input` 共用一份清单 |
| Virtualized Select | ✅ `virtual-select` | 是 | `content-visibility: auto` 让视口外的行不参与布局——这就是虚拟化的原生等价物 |
| Slider | ✅ `slider` | 是 | |
| Switch | ✅ `switch` | 是 | 真的 checkbox + `:checked` |
| Time Picker | ✅ `time-picker` | 是 | |
| Time Select | ✅ `time-select` | 是 | |
| Transfer | ✅ `transfer` | 是 | |
| TreeSelect | ✅ `tree-select` | 是 | |
| Upload | ✅ `upload` | 是 | |

## Data 数据展示组件(23)

| Element Plus | 本仓库 | 可无 JS 实现 | 备注 |
| --- | --- | --- | --- |
| Avatar | ✅ `avatar` | 是 | |
| Badge | ✅ `badge` | 是 | |
| Calendar | ✅ `calendar` | 是 | 一天都不可选的日子带 `aria-disabled`,读屏知道它选不了 |
| Card | ✅ `card` | 是 | |
| Carousel | ✅ `carousel` | 是 | 前后按钮是真的链接 |
| Collapse | ✅ `collapse` | 是 | |
| Descriptions | ✅ `descriptions` | 是 | |
| Empty | ✅ `empty` | 是 | |
| Image | ✅ `image` | 是 | |
| Infinite Scroll | ✅ `infinite-scroll` | 是 | 库不加载数据:它给容器、跳过的布局和状态哨兵,取数据是宿主的事 |
| Pagination | ✅ `pagination` | 是 | |
| Progress | ✅ `progress` | 是 | |
| Result | ✅ `result` | 是 | |
| Skeleton | ✅ `skeleton` | 是 | |
| Table | ✅ `table` | 是 | |
| Virtualized Table | ✅ `virtual-table` | 是 | |
| Tag | ✅ `tag` | 是 | |
| Timeline | ✅ `timeline` | 是 | |
| Tour | ✅ `tour` | 是 | |
| Tree | ✅ `tree` | 是 | |
| Virtualized Tree | ✅ `virtual-tree` | 是 | |
| Statistic | ✅ `statistic` | 是 | |
| Segmented | ✅ `segmented` | 是 | |

## Navigation 导航组件(9)

| Element Plus | 本仓库 | 可无 JS 实现 | 备注 |
| --- | --- | --- | --- |
| Affix | ✅ `affix` | 是 | |
| Anchor | ✅ `anchor` | 是 | |
| Backtop | ✅ `backtop` | 是 | |
| Breadcrumb | ✅ `breadcrumb` | 是 | 分隔符是用两条边框画出来的箭头 |
| Dropdown | ✅ `dropdown` | 是 | |
| Menu | ✅ `menu` | 是 | |
| Page Header | ✅ `page-header` | 是 | |
| Steps | ✅ `steps` | 是 | |
| Tabs | ✅ `tabs` | 是 | |

## Feedback 反馈组件(10)

| Element Plus | 本仓库 | 可无 JS 实现 | 备注 |
| --- | --- | --- | --- |
| Alert | ✅ `alert` | 是 | |
| Dialog | ✅ `dialog` | 是 | 真的 `<dialog>`,关闭靠 `form method="dialog"` |
| Drawer | ✅ `drawer` | 是 | |
| Loading | ✅ `loading` | 是 | |
| Message | ✅ `message` | 是 | |
| Message Box | ✅ `message-box` | 是 | 标题 + 正文 + 确认/取消,仍然是真 `<dialog>` |
| Notification | ✅ `notification` | 是 | |
| Popconfirm | ✅ `popconfirm` | 是 | 真 checkbox + `:checked` |
| Popover | ✅ `popover` | 是 | |
| Tooltip | ✅ `tooltip` | 是 | |

## Others 其他组件(2)

| Element Plus | 本仓库 | 可无 JS 实现 | 备注 |
| --- | --- | --- | --- |
| Divider | ✅ `divider` | 是 | |
| Watermark | ✅ `watermark` | 是 | 水印是真正的文字,不是渐变带 |

---

## 口径之外的东西

Element Plus 的总览没有列、但本仓库有的:

| 清单 | 说明 |
| --- | --- |
| `checkbox-group` | 多选框的分组形态。EP 的总览只列 `Checkbox` |
| `radio-group` | 单选框的分组形态。同上 |

## 三个 EP 组件在语义上被改写的地方

「能画出来」和「画成 EP 的样子」不是一回事。这三处是刻意的取舍,清单里也写了:

1. **Config Provider 变成了属性契约。** EP 的那个是 Vue 上下文;CSS 没有上下文。一个 CSS 库假装能提供上下文,比明说做不到更糟。
2. **Message Box 的确认按钮跟着类型走。** EP 里 `type` 只染图标,确认按钮永远是 primary。这里确认按钮取了该状态色。
3. **禁用的写法统一成 `aria-disabled`。** 一个只画了灰、却没告诉读屏的控件,对读屏用户来说不是禁用,是看不清。

## 没做到的

- **浮层没有遮罩。** 对话框、抽屉、导览都想要一层把后面的页面压下去的帘子,库里没有这个角色(`bg-overlay` 是面板自己的表面,不是帘子)。补它要给 32 套 mood 各加一个 token,那是改 mood 的观感,不是库能替宿主做的决定。现状与库内「浮层不带遮罩」的约定一致。
- **滚动条的拇指测不到。** WebKit 的拇指是伪元素,Firefox 的 `scrollbar-width` 没有主题化接口。组件自带尺寸变量,拇指的对比度不在契约里。
- **app 包不是用组件搭的。** `apps/` 仍然走 `templates/app/app.css`。类都在,迁过去是机械工作,但那是另一件事;在那之前两层会各自漂移。
