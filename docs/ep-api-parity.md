# Element Plus · API 对照

这份对照不是拿 Element Plus 的文档散文比出来的,是拿它**自己发布的两样东西**比出来的:

- `web-types.json` —— Element Plus 的文档构建为编辑器生成的元数据,逐个组件列出属性与插槽;
- 发布包里的 TypeScript 声明 —— `interface XxxProps`、`interface XxxOptions` 与 `declare const xxxEmits`,属性与事件都是声明,不是描述。

对照的是 **element-plus 2.14.9**,由 `node tools/ep-api-parity.mjs` 生成,由 `validate` 校验它没有过期。换一版 Element Plus 重新对照,改 `schemas/ep-parity.json` 里的 `source.version` 即可。

每一个 Element Plus 的属性有五种结论之一:

| 结论 | 意思 |
| --- | --- |
| 覆盖 | 本库声明了同名属性 |
| 改名 | 本库声明了它,只是换了名字,对照表里写了换成什么 |
| 等价 | 本库用另一个属性的某个取值表达了同一件事,对照表里写了是哪一个 |
| 跳过 | 本库不带它,并写明了为什么 |
| **差口** | 本库既不带它,也没写为什么 —— 这是待办,报告里逐条列出 |

「跳过」的理由只有七种,写在 `schemas/ep-parity.json` 的 `skipGroups` 里:

| 组 | 为什么跳过 |
| --- | --- |
| `script` | a JavaScript callback, a handler or a method — the library ships no script, so the host owns it |
| `value` | a value the host supplies — a number, a colour or a string. A stylesheet cannot paint a value the host chooses; the host writes it as an attribute or an inline style |
| `data` | rows, options or nodes for the host to render — the library paints the frame, not the data |
| `component` | a component to put in a slot — this library draws its own shapes in CSS and has no component to place |
| `dom` | where the panel lives or how it is torn down — a stylesheet has no DOM to move and no lifecycle to end |
| `timing` | a duration or a delay — a stylesheet cannot time anything |
| `native` | an attribute of the native element — the library states the element, and the attribute is the host's to write |
| `style` | a style string or a class the host passes — the library paints its own classes and lets the host's own CSS do the rest |

## 总数

| | 覆盖 | 改名 | 等价 | 跳过 | 差口 | 合计 |
| --- | --- | --- | --- | --- | --- | --- |
| 属性 | 149 | 1 | 12 | 996 | 378 | 1536 |
| 插槽 | 27 | 0 | 0 | 14 | 165 | 206 |
| 事件 | 25 | 0 | 0 | 81 | 22 | 128 |

## 逐组件

| 本库清单 | Element Plus | 来源 | 属性 | 覆盖 | 改名 | 等价 | 跳过 | 差口 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `affix` | el-affix | web-types | 6 | 1 | 0 | 0 | 5 | 0 |
| `alert` | el-alert | web-types | 8 | 0 | 0 | 1 | 3 | 4 |
| `anchor` | el-anchor, el-anchor-link | web-types | 0 | 0 | 0 | 0 | 0 | 0 |
| `autocomplete` | el-autocomplete | web-types | 52 | 5 | 0 | 0 | 36 | 11 |
| `avatar` | el-avatar, el-avatar-group | web-types | 16 | 2 | 0 | 1 | 10 | 3 |
| `backtop` | el-backtop | web-types | 4 | 1 | 0 | 0 | 2 | 1 |
| `badge` | el-badge | web-types | 10 | 0 | 0 | 1 | 6 | 3 |
| `border` | — | none | 0 | 0 | 0 | 0 | 0 | 0 |
| `breadcrumb` | el-breadcrumb, el-breadcrumb-item | web-types | 4 | 1 | 0 | 0 | 3 | 0 |
| `button` | el-button, el-button-group | web-types | 20 | 3 | 1 | 2 | 8 | 6 |
| `calendar` | el-calendar | web-types | 4 | 0 | 0 | 0 | 2 | 2 |
| `card` | el-card | web-types | 7 | 0 | 0 | 0 | 4 | 3 |
| `carousel` | el-carousel, el-carousel-item | web-types | 15 | 2 | 0 | 0 | 9 | 4 |
| `cascader` | el-cascader | web-types | 35 | 1 | 0 | 0 | 22 | 12 |
| `checkbox` | el-checkbox, el-checkbox-button | web-types | 19 | 6 | 0 | 0 | 11 | 2 |
| `checkbox-group` | el-checkbox-group | web-types | 14 | 3 | 0 | 0 | 8 | 3 |
| `collapse` | el-collapse, el-collapse-item | web-types | 8 | 1 | 0 | 0 | 3 | 4 |
| `color` | — | none | 0 | 0 | 0 | 0 | 0 | 0 |
| `color-picker` | el-color-picker | web-types | 19 | 4 | 0 | 0 | 13 | 2 |
| `color-picker-panel` | el-color-picker-panel | web-types | 9 | 1 | 0 | 0 | 4 | 4 |
| `config-provider` | el-config-provider | web-types | 12 | 1 | 0 | 0 | 8 | 3 |
| `container` | el-container, el-header, el-aside, el-main, el-footer | web-types | 3 | 0 | 0 | 0 | 3 | 0 |
| `date-picker` | el-date-picker | web-types | 37 | 4 | 0 | 0 | 23 | 10 |
| `date-picker-panel` | el-date-picker-panel | web-types | 19 | 2 | 0 | 0 | 8 | 9 |
| `date-time-picker` | el-date-picker | web-types | 37 | 4 | 0 | 0 | 23 | 10 |
| `descriptions` | el-descriptions, el-descriptions-item | web-types | 16 | 0 | 0 | 0 | 13 | 3 |
| `dialog` | el-dialog | web-types | 30 | 1 | 0 | 0 | 23 | 6 |
| `divider` | el-divider | web-types | 3 | 0 | 0 | 1 | 0 | 2 |
| `drawer` | el-drawer | web-types | 24 | 3 | 0 | 0 | 17 | 4 |
| `dropdown` | el-dropdown, el-dropdown-menu, el-dropdown-item | web-types | 27 | 1 | 0 | 0 | 19 | 7 |
| `empty` | el-empty | web-types | 3 | 0 | 0 | 0 | 3 | 0 |
| `field` | el-form, el-form-item | web-types | 22 | 1 | 0 | 0 | 16 | 5 |
| `icon` | el-icon | web-types | 2 | 1 | 0 | 0 | 1 | 0 |
| `image` | el-image, el-image-viewer | web-types | 22 | 3 | 0 | 0 | 17 | 2 |
| `infinite-scroll` | — | none | 0 | 0 | 0 | 0 | 0 | 0 |
| `input` | el-input, el-select, el-option, el-option-group | web-types | 75 | 4 | 0 | 0 | 54 | 17 |
| `input-number` | el-input-number | web-types | 24 | 6 | 0 | 0 | 13 | 5 |
| `input-otp` | el-input-otp | web-types | 13 | 3 | 0 | 0 | 6 | 4 |
| `input-tag` | el-input-tag | web-types | 26 | 2 | 0 | 0 | 16 | 8 |
| `layout` | el-row, el-col | web-types | 13 | 0 | 0 | 0 | 10 | 3 |
| `link` | el-link | web-types | 6 | 3 | 0 | 1 | 2 | 0 |
| `loading` | loading | declarations | 8 | 1 | 0 | 0 | 4 | 3 |
| `mention` | el-mention | web-types | 49 | 4 | 0 | 0 | 30 | 15 |
| `menu` | el-menu, el-sub-menu, el-menu-item, el-menu-item-group | web-types | 30 | 0 | 0 | 0 | 23 | 7 |
| `message` | message | declarations | 15 | 0 | 0 | 1 | 11 | 3 |
| `message-box` | message-box | declarations | 43 | 3 | 0 | 0 | 16 | 24 |
| `notification` | notification | declarations | 17 | 1 | 0 | 1 | 14 | 1 |
| `page-header` | el-page-header | web-types | 3 | 1 | 0 | 0 | 2 | 0 |
| `pagination` | el-pagination | web-types | 22 | 2 | 0 | 0 | 17 | 3 |
| `popconfirm` | el-popconfirm | web-types | 36 | 2 | 0 | 0 | 26 | 8 |
| `popover` | el-popover | web-types | 30 | 3 | 0 | 0 | 22 | 5 |
| `progress` | el-progress | web-types | 14 | 0 | 0 | 1 | 7 | 6 |
| `radio` | el-radio, el-radio-button | web-types | 7 | 4 | 0 | 0 | 1 | 2 |
| `radio-group` | el-radio-group | web-types | 13 | 4 | 0 | 0 | 6 | 3 |
| `rate` | el-rate | web-types | 22 | 4 | 0 | 0 | 14 | 4 |
| `result` | el-result | web-types | 3 | 1 | 0 | 0 | 2 | 0 |
| `scrollbar` | el-scrollbar | web-types | 18 | 1 | 0 | 0 | 14 | 3 |
| `segmented` | el-segmented | web-types | 10 | 3 | 0 | 0 | 5 | 2 |
| `skeleton` | el-skeleton, el-skeleton-item | web-types | 6 | 1 | 0 | 0 | 3 | 2 |
| `slider` | el-slider | web-types | 25 | 5 | 0 | 0 | 13 | 7 |
| `space` | el-space | web-types | 10 | 2 | 0 | 0 | 6 | 2 |
| `splitter` | el-splitter, el-splitter-panel | web-types | 7 | 2 | 0 | 0 | 4 | 1 |
| `statistic` | el-statistic, el-countdown | web-types | 0 | 0 | 0 | 0 | 0 | 0 |
| `steps` | el-steps, el-step | web-types | 11 | 2 | 0 | 0 | 4 | 5 |
| `switch` | el-switch | web-types | 24 | 3 | 0 | 0 | 18 | 3 |
| `table` | el-table, el-table-column | web-types | 72 | 0 | 0 | 0 | 53 | 19 |
| `tabs` | el-tabs, el-tab-pane | web-types | 14 | 2 | 0 | 0 | 5 | 7 |
| `tag` | el-tag, el-check-tag | web-types | 10 | 0 | 0 | 1 | 3 | 6 |
| `text` | el-text | web-types | 5 | 3 | 0 | 0 | 0 | 2 |
| `time-picker` | el-time-picker | web-types | 34 | 3 | 0 | 0 | 25 | 6 |
| `time-select` | el-time-select | web-types | 21 | 6 | 0 | 0 | 11 | 4 |
| `timeline` | el-timeline, el-timeline-item | web-types | 11 | 1 | 0 | 1 | 3 | 6 |
| `tooltip` | el-tooltip | web-types | 27 | 1 | 0 | 0 | 21 | 5 |
| `tour` | el-tour, el-tour-step | web-types | 0 | 0 | 0 | 0 | 0 | 0 |
| `transfer` | el-transfer | web-types | 15 | 0 | 0 | 0 | 12 | 3 |
| `tree` | el-tree | web-types | 25 | 0 | 0 | 0 | 18 | 7 |
| `tree-select` | el-select, el-tree | web-types | 76 | 4 | 0 | 0 | 53 | 19 |
| `typography` | — | none | 0 | 0 | 0 | 0 | 0 | 0 |
| `upload` | el-upload | web-types | 27 | 4 | 0 | 0 | 21 | 2 |
| `virtual-select` | el-virtualized-select | web-types | 55 | 3 | 0 | 0 | 37 | 15 |
| `virtual-table` | el-table-v2 | web-types | 31 | 2 | 0 | 0 | 27 | 2 |
| `virtual-tree` | el-tree-v2 | web-types | 17 | 1 | 0 | 0 | 12 | 4 |
| `watermark` | el-watermark | web-types | 9 | 0 | 0 | 0 | 9 | 0 |

## 差口清单

这是本库接下来要补的属性、插槽与事件。

### `alert`

- prop · `center` —— whether content is placed in the center.
- prop · `closable` —— whether alert can be dismissed.
- prop · `effect` —— theme style.
- prop · `show-icon` —— whether a type icon is displayed.
- slot · `default`
- slot · `title`
- event · `close`

### `anchor`

- slot · `sub-link`

### `autocomplete`

- prop · `autosize` —— whether textarea has an adaptive height, only works when `type` is 'textarea'. Can accept an object, e.g. `{ minRows: 2, maxRows: 6 }`
- prop · `clearable` —— whether to show clear button
- prop · `fit-input-width` —— whether the width of the dropdown is the same as the input
- prop · `form` —— same as `form` in native input
- prop · `hide-loading` —— whether to hide the loading icon in remote search
- prop · `readonly` —— same as `readonly` in native input
- prop · `show-arrow` —— whether the dropdown has an arrow
- prop · `show-password` —— whether to show toggleable password input
- prop · `show-word-limit` —— whether show word count, only works when `type` is 'text' or 'textarea'
- prop · `trigger-on-focus` —— whether show suggestions when input focus
- prop · `type` —— type of input, see more in [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#Form_%3Cinput%3E_types)
- slot · `append`
- slot · `default`
- slot · `footer`
- slot · `header`
- slot · `loading`
- slot · `prefix`
- slot · `prepend`
- slot · `suffix`
- event · `clear`
- event · `select`

### `avatar`

- prop · `collapse-avatars` —— whether to collapse avatars
- prop · `effect` —— tooltip theme, built-in theme: `dark` / `light`
- prop · `fit` —— set how the image fit its container for an image avatar.
- slot · `default`

### `backtop`

- prop · `right` —— right distance.
- slot · `default`

### `badge`

- prop · `hidden` —— hidden badge.
- prop · `is-dot` —— if a little dot is displayed.
- prop · `show-zero` —— Whether to show badge when value is zero.
- slot · `content`
- slot · `default`

### `breadcrumb`

- slot · `default`

### `button`

- prop · `bg` —— determine whether the text button background color is always on
- prop · `circle` —— determine whether it's a circle button
- prop · `dark` —— dark mode, which automatically converts `color` to dark mode colors
- prop · `dashed` —— determine whether it's a dashed button
- prop · `link` —— determine whether it's a link button
- prop · `round` —— determine whether it's a round button
- slot · `default`
- slot · `loading`

### `calendar`

- prop · `model-value` —— binding value
- prop · `range` —— time range, including start time and end time. Start time must be start day of week, end time must be end day of week, the time span cannot exceed two months.
- slot · `date-cell`
- slot · `header`

### `card`

- prop · `footer` —— footer of the card. Also accepts a DOM passed by `slot#footer`
- prop · `header` —— title of the card. Also accepts a DOM passed by `slot#header`
- prop · `shadow` —— when to show card shadows
- slot · `default`
- slot · `footer`
- slot · `header`

### `carousel`

- prop · `arrow` —— when arrows are shown
- prop · `indicator-position` —— position of the indicators
- prop · `loop` —— display the items in loop
- prop · `type` —— type of the Carousel

### `cascader`

- prop · `clearable` —— whether selected value can be cleared
- prop · `collapse-tags` —— whether to collapse tags in multiple selection mode
- prop · `disabled` —— whether Cascader is disabled
- prop · `effect` —— tooltip theme, built-in theme: `dark` / `light`
- prop · `filterable` —— whether the options can be searched
- prop · `fit-input-width` —— whether the width of the suggestion panel is the same as the input, if the value is `number`, then the width is fixed
- prop · `model-value` —— binding value
- prop · `placeholder` —— placeholder of input
- prop · `show-all-levels` —— whether to display all levels of the selected value in the input
- prop · `tag-effect` —— tag effect
- prop · `tag-type` —— tag type
- prop · `virtual-scroll` —— whether to enable virtual scrolling for large data
- slot · `default`
- slot · `empty`
- slot · `footer`
- slot · `header`
- slot · `prefix`
- slot · `suggestion-item`
- slot · `tag`
- event · `clear`

### `checkbox`

- prop · `border` —— whether to add a border around Checkbox
- prop · `size` —— size of the Checkbox
- slot · `default`

### `checkbox-group`

- prop · `fill` —— border and background color when button is active
- prop · `size` —— size of checkbox
- prop · `type` —— component type to render options (e.g. `'button'`)
- slot · `default`

### `collapse`

- prop · `accordion` —— whether to activate accordion mode
- prop · `disabled` —— disable the collapse item
- prop · `expand-icon-position` —— set expand icon position
- prop · `model-value` —— currently active panel, the type is `string` in accordion mode, otherwise it is `array`

### `color-picker`

- prop · `clearable` —— whether to show clear button
- prop · `show-alpha` —— whether to display the alpha slider
- event · `clear`

### `color-picker-panel`

- prop · `border` —— whether the color picker panel is bordered
- prop · `disabled` —— whether to disable the color picker
- prop · `model-value` —— binding value
- prop · `show-alpha` —— whether to display the alpha slider
- slot · `footer`

### `config-provider`

- prop · `button` —— button related configuration, [see the following table](#button-attribute)
- prop · `dialog` —— dialog related configuration, [see the following table](#dialog-attribute)
- prop · `link` —— link related configuration, [see the following table](#link-attribute)

### `date-picker`

- prop · `automatic-dropdown` —— this prop decides if the date picker panel pops up when the input is focused. (The default value will be set to false in version 3.0)
- prop · `clearable` —— whether to show clear button
- prop · `editable` —— whether the input is editable
- prop · `placeholder` —— placeholder in non-range mode
- prop · `readonly` —— whether DatePicker is read only
- prop · `show-confirm` —— whether to show the confirm button
- prop · `show-footer` —— whether to show footer where the date picker is one ^[enum]`'dates' | 'months' | 'years' | 'quarters'`
- prop · `show-week-number` —— show the week number besides the week
- prop · `single-panel` —— show only one panel in range-picker
- prop · `unlink-panels` —— unlink two date-panels in range-picker
- slot · `default`
- slot · `next-month`
- slot · `next-year`
- slot · `prev-month`
- slot · `prev-year`
- slot · `range-separator`

### `date-picker-panel`

- prop · `border` —— whether the date picker is bordered
- prop · `clearable` —— whether to show clear button
- prop · `editable` —— whether the input is editable
- prop · `model-value` —— binding value, if it is an `range` picker, the length of the array should be 2
- prop · `show-confirm` —— whether to show the confirm button
- prop · `show-week-number` —— show the week number besides the week
- prop · `single-panel` —— show only one panel in range-picker
- prop · `type` —— type of the picker. `quarter`, `quarters`, and `quarterrange` are supported since
- prop · `unlink-panels` —— unlink two date-panels in range-picker
- slot · `default`
- slot · `next-month`
- slot · `next-year`
- slot · `prev-month`
- slot · `prev-year`

### `date-time-picker`

- prop · `automatic-dropdown` —— this prop decides if the date picker panel pops up when the input is focused. (The default value will be set to false in version 3.0)
- prop · `clearable` —— whether to show clear button
- prop · `editable` —— whether the input is editable
- prop · `placeholder` —— placeholder in non-range mode
- prop · `readonly` —— whether DatePicker is read only
- prop · `show-confirm` —— whether to show the confirm button
- prop · `show-footer` —— whether to show footer where the date picker is one ^[enum]`'dates' | 'months' | 'years' | 'quarters'`
- prop · `show-week-number` —— show the week number besides the week
- prop · `single-panel` —— show only one panel in range-picker
- prop · `unlink-panels` —— unlink two date-panels in range-picker
- slot · `default`
- slot · `next-month`
- slot · `next-year`
- slot · `prev-month`
- slot · `prev-year`
- slot · `range-separator`

### `descriptions`

- prop · `align` —— column content alignment (If no `border`, effective for both label and content)
- prop · `border` —— with or without border
- prop · `size` —— size of list
- slot · `default`
- slot · `extra`
- slot · `label`
- slot · `title`

### `dialog`

- prop · `align-center` —— whether to align the dialog both horizontally and vertically
- prop · `center` —— whether to align the header and footer in center
- prop · `fullscreen` —— whether the Dialog takes up full screen
- prop · `modal` —— whether a mask is displayed
- prop · `model-value` —— visibility of Dialog
- prop · `show-close` —— whether to show a close button
- slot · `footer`
- slot · `header`
- event · `close`
- event · `open`

### `divider`

- prop · `border-style` —— Set the style of divider
- prop · `content-position` —— The position of the customized content on the divider line
- slot · `default`

### `drawer`

- prop · `modal` —— Should show shadowing layer
- prop · `model-value` —— Should Drawer be displayed
- prop · `show-close` —— Should show close button at the top right of Drawer
- prop · `with-header` —— Flag that controls the header section's existence, default to true, when withHeader set to false, both `title attribute` and `title slot` won't work
- slot · `header`
- event · `open`

### `dropdown`

- prop · `disabled` —— whether to disable
- prop · `divided` —— whether a divider is displayed
- prop · `effect` —— Tooltip theme, built-in theme: `dark` / `light`
- prop · `show-arrow` —— whether the tooltip content has an arrow
- prop · `size` —— menu size, also works on the split button
- prop · `split-button` —— whether a button group is displayed
- prop · `type` —— menu button type, refer to `Button` Component, only works when `split-button` is true
- slot · `default`
- slot · `dropdown`

### `empty`

- slot · `default`
- slot · `description`
- slot · `image`

### `field`

- prop · `disabled` —— Whether to disable all components in this form. Before , if set to `true`, it will override the `disabled` prop of the inner component. After , the configuration of the internal components takes precedence.
- prop · `hide-required-asterisk` —— Whether to hide required fields should have a red asterisk (star) beside their labels.
- prop · `inline` —— Whether the form is inline.
- prop · `size` —— Control the size of components in this form.
- prop · `validate-status` —— Validation state of formItem.
- slot · `default`
- slot · `error`

### `icon`

- slot · `default`

### `image`

- prop · `loading` —— Indicates how the browser should load the image, same as [native](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attr-loading).
- prop · `show-progress` —— whether to display the preview image progress content.
- slot · `default`
- slot · `error`
- slot · `placeholder`
- slot · `progress`
- slot · `toolbar`
- event · `close`

### `input`

- prop · `automatic-dropdown` —— for non-filterable Select, this prop decides if the option menu pops up when the input is focused
- prop · `autosize` —— whether textarea has an adaptive height, only works when `type` is 'textarea'. Can accept an object, e.g. `{ minRows: 2, maxRows: 6 }`
- prop · `clearable` —— whether to show clear button, only works when `type` is not 'textarea'
- prop · `collapse-tags` —— whether to collapse tags to a text when multiple selecting
- prop · `default-first-option` —— select first matching option on enter key. Use with `filterable` or `remote`
- prop · `effect` —— tooltip theme, built-in theme: `dark` / `light`
- prop · `filterable` —— whether Select is filterable
- prop · `fit-input-width` —— whether the width of the dropdown is the same as the input
- prop · `form` —— same as `form` in native input
- prop · `loading` —— whether Select is loading data from server
- prop · `show-arrow` —— whether the dropdown has an arrow
- prop · `show-password` —— whether to show toggleable password input
- prop · `show-word-limit` —— whether show word count, only works when `type` is 'text' or 'textarea'
- prop · `size` —— size of Input, works when `type` is not 'textarea'
- prop · `tag-effect` —— tag effect
- prop · `tag-type` —— tag type
- prop · `type` —— type of input, see more in [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#Form_%3Cinput%3E_types)
- slot · `append`
- slot · `default`
- slot · `empty`
- slot · `footer`
- slot · `header`
- slot · `label`
- slot · `loading`
- slot · `prefix`
- slot · `prepend`
- slot · `suffix`
- slot · `tag`
- event · `clear`

### `input-number`

- prop · `align` —— alignment for the inner input text
- prop · `placeholder` —— same as `placeholder` in native input
- prop · `readonly` —— same as `readonly` in native input
- prop · `size` —— size of the component
- prop · `step-strictly` —— whether input value can only be multiple of step
- slot · `prefix`
- slot · `suffix`

### `input-otp`

- prop · `mask` —— Whether to enable password mode
- prop · `model-value` —— The value of the OTP fields. Since numbers must not have leading zeros, `modelValue` is allowed to be a number only during initialization.
- prop · `readonly` —— Same as `readonly` in native input
- prop · `type` —— The type of the OTP fields
- slot · `separator`

### `input-tag`

- prop · `clearable` —— whether to show clear button
- prop · `collapse-tags` —— whether to collapse tags to a text when multiple selecting
- prop · `disabled` —— whether to disable input-tag
- prop · `effect` —— tooltip theme, built-in theme: `dark` / `light`
- prop · `model-value` —— binding value
- prop · `readonly` —— same as `readonly` in native input
- prop · `tag-effect` —— tag effect
- prop · `tag-type` —— tag type
- slot · `prefix`
- slot · `suffix`
- slot · `tag`
- event · `clear`

### `layout`

- prop · `align` —— vertical alignment of flex layout
- prop · `pull` —— number of columns that grid moves to the left
- prop · `push` —— number of columns that grid moves to the right

### `loading`

- prop · `closed`
- prop · `fullscreen` —— same as the `fullscreen` modifier of `v-loading`
- prop · `lock` —— same as the `lock` modifier of `v-loading`

### `mention`

- prop · `autosize` —— whether textarea has an adaptive height, only works when `type` is 'textarea'. Can accept an object, e.g. `{ minRows: 2, maxRows: 6 }`
- prop · `check-is-whole` —— when backspace is pressed to delete, check if the mention is a whole
- prop · `clearable` —— whether to show clear button, only works when `type` is not 'textarea'
- prop · `disabled` —— whether Input is disabled
- prop · `filter-option` —— customize filter option logic
- prop · `form` —— same as `form` in native input
- prop · `loading` —— whether the dropdown panel of mentions is in a loading state
- prop · `prefix` —— prefix character to trigger mentions. The string length must be exactly 1
- prop · `readonly` —— same as `readonly` in native input
- prop · `show-arrow` —— whether the dropdown panel has an arrow
- prop · `show-password` —— whether to show toggleable password input
- prop · `show-word-limit` —— whether show word count, only works when `type` is 'text' or 'textarea'
- prop · `split` —— character to split mentions. The string length must be exactly 1
- prop · `type` —— type of input, see more in [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#Form_%3Cinput%3E_types)
- prop · `whole` —— when backspace is pressed to delete, whether the mention content is deleted as a whole
- slot · `footer`
- slot · `header`
- slot · `label`
- slot · `loading`
- event · `search`
- event · `select`

### `menu`

- prop · `collapse` —— whether the menu is collapsed (available only in vertical mode)
- prop · `disabled` —— whether the sub-menu is disabled
- prop · `ellipsis` —— whether the menu is ellipsis (available only in horizontal mode)
- prop · `menu-trigger` —— how sub-menus are triggered, only works when `mode` is 'horizontal'
- prop · `mode` —— menu display mode
- prop · `popper-effect` —— Tooltip theme, built-in theme: `dark` / `light` when menu is collapsed
- prop · `unique-opened` —— whether only one sub-menu can be active
- slot · `default`
- slot · `title`
- event · `close`
- event · `open`
- event · `select`

### `message`

- prop · `grouping` —— merge messages with the same content, type of VNode message is not supported
- prop · `plain` —— whether message is plain
- prop · `show-close` —— whether to show a close button

### `message-box`

- prop · `box-type`
- prop · `button-size`
- prop · `callback`
- prop · `cancel-button-class`
- prop · `cancel-button-loading-icon`
- prop · `cancel-button-type`
- prop · `center`
- prop · `close-on-hash-change`
- prop · `confirm-button-class`
- prop · `confirm-button-loading-icon`
- prop · `confirm-button-type`
- prop · `custom-style`
- prop · `distinguish-cancel-and-close`
- prop · `input-error-message`
- prop · `input-pattern`
- prop · `input-placeholder`
- prop · `input-type`
- prop · `input-validator`
- prop · `input-value`
- prop · `modal`
- prop · `round-button`
- prop · `show-cancel-button`
- prop · `show-confirm-button`
- prop · `show-input`

### `notification`

- prop · `show-close` —— whether to show a close button

### `page-header`

- slot · `breadcrumb`
- slot · `content`
- slot · `default`
- slot · `extra`

### `pagination`

- prop · `disabled` —— whether Pagination is disabled
- prop · `hide-on-single-page` —— whether to hide when there's only one page
- prop · `layout` —— layout of Pagination, elements separated with a comma
- slot · `default`

### `popconfirm`

- prop · `cancel-button-type` —— Cancel button type
- prop · `confirm-button-type` —— Confirm button type
- prop · `disabled` —— Whether Tooltip is disabled
- prop · `effect` —— Tooltip theme, built-in theme: `dark` / `light`
- prop · `enterable` —— Whether the mouse can enter the tooltip
- prop · `hide-icon` —— is hide Icon
- prop · `show-arrow` —— Whether the tooltip content has an arrow
- prop · `visible` —— Visibility of Tooltip
- slot · `actions`
- slot · `reference`

### `popover`

- prop · `disabled` —— whether Popover is disabled
- prop · `effect` —— Tooltip theme, built-in theme: `dark` / `light`
- prop · `enterable` —— Whether the mouse can enter the tooltip
- prop · `show-arrow` —— whether a tooltip arrow is displayed or not. For more info, please refer to [ElPopper](https://github.com/element-plus/element-plus/tree/dev/packages/components/popper)
- prop · `visible` —— whether popover is visible
- slot · `default`
- slot · `reference`

### `progress`

- prop · `indeterminate` —— set indeterminate progress
- prop · `show-text` —— whether to show percentage
- prop · `status` —— the current status of progress bar
- prop · `striped` —— stripe over the progress bar's color
- prop · `striped-flow` —— get the stripes to flow
- prop · `text-inside` —— whether to place the percentage inside progress bar, only works when `type` is 'line'
- slot · `default`

### `radio`

- prop · `border` —— whether to add a border around Radio
- prop · `size` —— size of the Radio
- slot · `default`

### `radio-group`

- prop · `fill` —— border and background color when button is active
- prop · `size` —— the size of radio buttons or bordered radios
- prop · `type` —— component type to render options (e.g. `'button'`)
- slot · `default`

### `rate`

- prop · `allow-half` —— whether picking half start is allowed
- prop · `clearable` —— whether value can be reset to `0`
- prop · `show-score` —— whether to display current score. show-score and show-text cannot be true at the same time
- prop · `show-text` —— whether to display texts

### `result`

- slot · `sub-title`

### `scrollbar`

- prop · `mask` —— Gradient masks: `true` for all edges, a direction for one edge, and `false` to disable
- prop · `native` —— whether to use the native scrollbar style
- prop · `noresize` —— do not respond to container size changes, if the container size does not change, it is better to set it to optimize performance

### `segmented`

- prop · `block` —— fit width of parent content
- prop · `model-value` —— binding value

### `skeleton`

- prop · `loading` —— whether showing the skeleton, the real DOM is rendered when `false`
- prop · `variant` —— the current rendering skeleton type
- slot · `default`

### `slider`

- prop · `range` —— whether to select a range
- prop · `show-input` —— whether to display an input box, works when `range` is false and `step` is not `'mark'`
- prop · `show-input-controls` —— whether to display control buttons when `show-input` is true
- prop · `show-stops` —— whether to display breakpoints
- prop · `show-tooltip` —— whether to display tooltip value
- prop · `size` —— size of the slider wrapper, will not work in vertical mode
- prop · `vertical` —— vertical mode

### `space`

- prop · `fill` —— Whether to fill the container
- prop · `wrap` —— Auto wrapping

### `splitter`

- prop · `collapsible` —— Whether the panel can be collapsed
- slot · `default`
- slot · `end-collapsible`
- slot · `start-collapsible`

### `statistic`

- slot · `title`

### `steps`

- prop · `active` —— current activation step
- prop · `align-center` —— center title and description
- prop · `finish-status` —— status of end step
- prop · `process-status` —— status of current step
- prop · `simple` —— whether to apply simple theme
- slot · `default`
- slot · `description`
- slot · `title`

### `switch`

- prop · `inline-prompt` —— whether icon or text is displayed inside dot, only the first character will be rendered for text
- prop · `loading` —— whether Switch is in loading state
- prop · `size` —— size of Switch
- slot · `active`
- slot · `active-action`
- slot · `inactive`
- slot · `inactive-action`

### `table`

- prop · `align` —— alignment
- prop · `allow-drag-last-column` —— whether to allow drag the last column
- prop · `border` —— whether Table has vertical border
- prop · `default-expand-all` —— whether expand all rows by default, works when the table has a column type="expand" or contains tree structure data
- prop · `fit` —— whether width of column automatically fits its container
- prop · `fixed` —— whether column is fixed at left / right. Will be fixed at left if `true`
- prop · `flexible` —— ensure main axis minimum-size doesn't follow the content
- prop · `highlight-current-row` —— whether current row is highlighted
- prop · `native-scrollbar` —— whether to use native scrollbars
- prop · `scrollbar-always-on` —— always show scrollbar
- prop · `select-on-indeterminate` —— controls the behavior of master checkbox in multi-select tables when only some rows are selected (but not all). If true, all rows will be selected, else deselected
- prop · `selectable` —— function that determines if a certain row can be selected, works when `type` is 'selection'
- prop · `show-header` —— whether Table header is visible
- prop · `show-summary` —— whether to display a summary row
- prop · `size` —— size of Table
- prop · `sortable` —— whether column can be sorted. Remote sorting can be done by setting this attribute to 'custom' and listening to the `sort-change` event of Table
- prop · `stripe` —— whether Table is striped
- prop · `tooltip-effect` —— the `effect` of the overflow tooltip
- prop · `type` —— type of the column. If set to `selection`, the column will display checkbox. If set to `index`, the column will display index of the row (staring from 1). If set to `expand`, the column will display expand icon
- slot · `append`
- slot · `default`
- slot · `empty`
- slot · `expand`
- slot · `header`

### `tabs`

- prop · `addable` —— whether Tab is addable
- prop · `closable` —— whether Tab is closable
- prop · `disabled` —— whether Tab is disabled
- prop · `editable` —— whether Tab is addable and closable
- prop · `model-value` —— binding value, name of the selected tab, the default value is the name of first tab
- prop · `stretch` —— whether width of tab automatically fits its container
- prop · `tab-position` —— position of tabs
- slot · `default`
- slot · `label`

### `tag`

- prop · `closable` —— whether Tag can be removed
- prop · `disabled` —— whether the check-tag is disabled
- prop · `effect` —— theme of Tag
- prop · `hit` —— whether Tag has a highlighted border
- prop · `round` —— whether Tag is rounded
- prop · `size` —— size of Tag
- slot · `default`
- event · `close`

### `text`

- prop · `line-clamp` —— maximum lines
- prop · `truncated` —— render ellipsis

### `time-picker`

- prop · `arrow-control` —— whether to pick time using arrow buttons
- prop · `clearable` —— whether to show clear button
- prop · `editable` —— whether the input is editable
- prop · `is-range` —— whether to pick a time range
- prop · `placeholder` —— placeholder in non-range mode
- prop · `readonly` —— whether TimePicker is read only

### `time-select`

- prop · `clearable` —— whether to show clear button
- prop · `editable` —— whether the input is editable
- prop · `effect` —— Tooltip theme, built-in theme: `dark` / `light`
- prop · `placeholder` —— placeholder in non-range mode

### `timeline`

- prop · `center` —— whether vertically centered
- prop · `hide-timestamp` —— whether to show timestamp
- prop · `hollow` —— icon is hollow
- prop · `mode` —— relative position of timeline and content
- prop · `reverse` —— whether reverse order
- prop · `size` —— node size
- slot · `default`
- slot · `dot`

### `tooltip`

- prop · `disabled` —— Whether Tooltip is disabled
- prop · `effect` —— Tooltip theme, built-in theme: `dark` / `light`
- prop · `enterable` —— Whether the mouse can enter the tooltip
- prop · `show-arrow` —— Whether the tooltip content has an arrow
- prop · `visible` —— Visibility of Tooltip
- slot · `default`

### `tour`

- event · `close`

### `transfer`

- prop · `filterable` —— whether Transfer is filterable
- prop · `model-value` —— binding value
- prop · `virtual-scroll` —— whether to enable virtual scrolling
- slot · `default`
- slot · `left-empty`
- slot · `left-footer`
- slot · `right-empty`
- slot · `right-footer`

### `tree`

- prop · `accordion` —— whether only one node among the same level can be expanded at one time
- prop · `auto-expand-parent` —— whether to expand father node when a child node is expanded
- prop · `check-strictly` —— whether checked state of a node not affects its father and child nodes when `show-checkbox` is `true`
- prop · `default-expand-all` —— whether to expand all nodes by default
- prop · `highlight-current` —— whether current node is highlighted
- prop · `render-after-expand` —— whether to render child nodes only after a parent node is expanded for the first time
- prop · `show-checkbox` —— whether node is selectable
- slot · `default`
- slot · `empty`
- event · `check`

### `tree-select`

- prop · `accordion` —— whether only one node among the same level can be expanded at one time
- prop · `auto-expand-parent` —— whether to expand father node when a child node is expanded
- prop · `automatic-dropdown` —— for non-filterable Select, this prop decides if the option menu pops up when the input is focused
- prop · `check-strictly` —— whether checked state of a node not affects its father and child nodes when `show-checkbox` is `true`
- prop · `clearable` —— whether select can be cleared
- prop · `collapse-tags` —— whether to collapse tags to a text when multiple selecting
- prop · `default-expand-all` —— whether to expand all nodes by default
- prop · `default-first-option` —— select first matching option on enter key. Use with `filterable` or `remote`
- prop · `effect` —— tooltip theme, built-in theme: `dark` / `light`
- prop · `filterable` —— whether Select is filterable
- prop · `fit-input-width` —— whether the width of the dropdown is the same as the input
- prop · `highlight-current` —— whether current node is highlighted
- prop · `loading` —— whether Select is loading data from server
- prop · `placeholder` —— placeholder, default is 'Select'
- prop · `render-after-expand` —— whether to render child nodes only after a parent node is expanded for the first time
- prop · `show-arrow` —— whether the dropdown has an arrow
- prop · `show-checkbox` —— whether node is selectable
- prop · `tag-effect` —— tag effect
- prop · `tag-type` —— tag type
- slot · `default`
- slot · `empty`
- slot · `footer`
- slot · `header`
- slot · `label`
- slot · `loading`
- slot · `prefix`
- slot · `tag`
- event · `check`
- event · `clear`

### `upload`

- prop · `list-type` —— type of file list.
- prop · `show-file-list` —— whether to show the uploaded file list.
- slot · `default`
- slot · `file`
- slot · `tip`

### `virtual-select`

- prop · `automatic-dropdown` —— for non-filterable Select, this prop decides if the option menu pops up when the input is focused
- prop · `clearable` —— whether select can be cleared
- prop · `collapse-tags` —— whether to collapse tags to a text when multiple selecting
- prop · `default-first-option` —— select first matching option on enter key. Use with `filterable` or `remote`
- prop · `disabled` —— is disabled
- prop · `effect` —— tooltip theme, built-in theme: `dark` / `light`
- prop · `filterable` —— whether Select is filterable
- prop · `fit-input-width` —— whether the width of the dropdown is the same as the input, if the value is `number`, then the width is fixed
- prop · `loading` —— whether Select is loading data from server
- prop · `model-value` —— binding value
- prop · `scrollbar-always-on` —— Controls whether the scrollbar is always displayed
- prop · `show-arrow` —— whether the dropdown has an arrow
- prop · `size` —— size of component
- prop · `tag-effect` —— tag effect
- prop · `tag-type` —— tag type
- slot · `default`
- slot · `empty`
- slot · `footer`
- slot · `header`
- slot · `label`
- slot · `loading`
- slot · `prefix`
- slot · `tag`

### `virtual-table`

- prop · `fixed` —— Flag indicates the table column's width to be fixed or flexible.
- prop · `scrollbar-always-on` —— If true, the scrollbar will always be shown instead of when mouse is placed above the table
- slot · `cell`
- slot · `empty`
- slot · `footer`
- slot · `header`
- slot · `header-cell`
- slot · `overlay`
- slot · `row`

### `virtual-tree`

- prop · `check-strictly` —— whether checked state of a node not affects its father and child nodes when `show-checkbox` is `true`
- prop · `highlight-current` —— whether current node is highlighted
- prop · `scrollbar-always-on` —— always show scrollbar
- prop · `show-checkbox` —— whether node is selectable
- slot · `default`
- slot · `empty`
- event · `check`

## 没有对应组件的地方

以下清单在 Element Plus 里没有单独的组件: `border`、`color`、`infinite-scroll`、`typography`。它们要么是 Element Plus 的辅助函数(`border`、`color`),要么是把两个 Element Plus 组件合成一份清单(`input` 同时画 `um-input`、`um-textarea`、`um-select`),要么是本库自己的编排层(`typography`)。

## 没有追进去的子表

Element Plus 的元数据里有几处用方括号指向一张子表,却没有说那张表属于哪个组件。这份对照不去猜它们:

- el-cascader [props]
- el-drawer [resizable]
- el-select [props]
- el-select [tag-tooltip]
- el-segmented [props]
- el-transfer [props]
- el-tree [props]
- el-virtualized-select [props]
- el-virtualized-select [tag-tooltip]
- el-tree-v2 [props]

