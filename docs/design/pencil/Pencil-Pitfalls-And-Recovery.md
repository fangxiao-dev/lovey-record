# Pencil 常见坑与恢复手册

## 目的

这份文档只记录已经在当前实践中踩过、并且确实影响协作效率的 Pencil 问题。重点不是泛泛提醒，而是给出恢复顺序。

## 恢复总原则

一旦 live 编辑出现异常，恢复优先级固定为：

`先恢复可见 -> 再恢复语义 -> 最后恢复 token`

不要在异常状态下继续做“顺便整理”。

## 坑 1：token ref 被错误转义，导致渲染异常

### 症状

- 节点 JSON 看起来像 token ref
- 实际截图却出现大面积白字、黑块、不可见
- `batch_get` 与视觉结果不一致

### 处理方式

1. 先用 screenshot 判断是结构坏了，还是只是文字/颜色不可读。
2. 抽样关键节点，用 `batch_get` 确认异常发生在：
   - fill
   - text fill
   - stroke
   - variable value
3. 若 live 已经不可读，先回 concrete color，不要立刻继续挂 token。
4. 可见状态恢复后，再用定点 `U()` 回挂 token。

## 坑 2：批量替换误伤 text/fill

### 症状

- 本来只想替换某一类 fill
- 实际很多文字颜色一起被改掉
- 某些 section 看起来还活着，但阅读已经失效

### 处理方式

- `replace_all_matching_properties` 只适合窄范围、强约束的替换
- 不要用它做“全页 token 化”
- 一旦误伤：
  1. 先停
  2. 先恢复关键标题、说明文字、tile label 的可读性
  3. 再恢复容器层级
  4. 最后回 token

## 坑 3：live editor 与磁盘文件可能不同步

### 症状

- 磁盘 diff 看起来已经改了
- live 截图却没有反映
- 重新打开文件后仍然和预期不完全一致

### 处理方式

- 以 live editor 的 screenshot 为准判断当前效果
- 以 `batch_get` 为准判断 live 节点当前属性
- 磁盘文件只能说明“记录了什么”，不能单独证明“当前 live 看见什么”

## 坑 4：中间层背景语义被滥用

### 症状

- foundations board 铺满某个中间层背景
- 真正的 `bg.base / bg.subtle / bg.card` 层级被冲淡
- 色彩板、text token、state card 都像浮在一层不必要的板子上

### 当前结论

- foundations 主层级只保留：
  - `bg.base`
  - `bg.subtle`
  - `bg.card`
- 类似 `bg.panel` 的中间层只在明确需要时使用，不能默认铺满展示板

## 坑 5：ramp 中间档会“消失”

### 症状

- `100 / 300 / 700 / 900` 都看得见
- 唯独 `500` 不明显，像没填一样
- 浅色系尤其容易出现这个问题

### 处理方式

- `500` 不一定非要机械地取某个自动中间值
- 要以“作为工作锚点是否可见”为准
- 必要时单独校正 `500` 的 fill 与文字颜色

## 坑 6：浅色块文字不能默认白色

### 症状

- tile 结构没问题
- 但浅粉、浅米、浅绿、浅蓝块上的数字或标签完全看不清

### 当前结论

- 浅色块的文字必须按可读性单独校正
- 不允许一律白字
- 尤其是：
  - palette ramp
  - prediction tile
  - date state 中的 pale fill

## 标准恢复 SOP

1. 停止广泛修改。
2. 截图，确认问题是结构还是可读性。
3. 抽样关键节点做 `batch_get`。
4. 若变量值被污染，先 `set_variables` 收正为单值。
5. 若页面大面积不可读，先恢复 concrete color。
6. 对关键标题、说明、tile label、state 数字做定点修复。
7. 对容器层级做定点修复。
8. 最后再回挂 token。
9. screenshot 再验一遍，确认后才继续正常设计工作。
