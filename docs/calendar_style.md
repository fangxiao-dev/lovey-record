结论：
日历采用 **Cycle Window（三周网格）为默认视图 + Month View（整月）辅助视图**。
默认以 **经期优先、预测期次之**为中心定位，使用 **3×7 网格（21 天）**，**上下滑动浏览时间**，每次滑动 **1 周**。
编辑模型采用 **tap 查看/单日编辑 + long press 进入多选态**，记录真相为 `day_record`，周期区块由连续 `period` days 派生。

下面是**收敛后的 UI 规格说明（可直接作为产品/设计文档）**。

---

# 1 日历整体结构

日历系统包含两种模式：

| 模式                 | 用途        | 交互   |
| ------------------ | --------- | ---- |
| Cycle Window（三周窗口） | 记录 / 追踪周期 | 上下滑动 |
| Month View（整月视图）   | 历史回顾      | 左右切月 |

默认进入：

```
Cycle Window
```

---

# 2 Cycle Window（三周窗口）

## 2.1 布局

固定网格：

```
7 columns × 3 rows
```

示例：

```
Mon Tue Wed Thu Fri Sat Sun
27  28  29  30  31   1   2
 3   4   5   6   7   8   9
10  11  12  13  14  15  16
```

特性：

* 日期连续
* 可跨月
* 不以月份为边界

---

# 3 滑动规则

浏览方向：

```
↑ 查看未来
↓ 查看过去
```

滑动步长：

```
1 week
```

示例：

初始窗口

```
May 27 – Jun 16
```

上滑一次

```
Jun 3 – Jun 23
```

---

# 4 窗口中心定位逻辑

中心日期由以下优先级决定：

```
1 当前经期
2 预测经期
3 今天
```

---

## 4.1 当前存在经期

中心：

```
period_middle
```

示例：

```
Jun 3 – Jun 8
```

中心：

```
Jun 5
```

窗口：

```
May 26 – Jun 15
```

---

## 4.2 当前无经期

中心：

```
predicted_period_middle
```

---

## 4.3 用户快捷跳转

顶部提供按钮：

```
Today
Last cycle
Next prediction
```

---

# 5 日期格子结构

每个格子包含：

```
Day number
Record marker
Period/prediction background
Today highlight
```

结构示例：

```
┌───────┐
   14
   •
└───────┘
```

---

# 6 日期状态设计

| 状态            | 表现   |
| ------------- | ---- |
| Today         | 外边框  |
| Record exists | 小圆点  |
| Period        | 深色背景 |
| Prediction    | 浅色背景 |

示例：

```
Period
[ 5 ]

Prediction
(24)

Record
14 •
```

---

# 7 经期区块设计

经期必须视觉连续。

例如：

```
Jun 3 – Jun 8
```

显示：

```
[3][4][5][6][7][8]
```

视觉规则：

| 日期     | 样式  |
| ------ | --- |
| start  | 左圆角 |
| middle | 连续块 |
| end    | 右圆角 |

示例：

```
◉ █ █ █ █ ◉
```

---

## 7.1 跨周情况

经期跨周时：

```
Mon Tue Wed Thu Fri Sat Sun
27  28  29  30  31 [1] [2]
[3] [4] [5]  6   7   8   9
```

规则：

* 周行断开
* 视觉仍然连续

---

# 8 预测区块

预测期用浅色背景。

例如：

```
Jun 24 – Jun 29
```

显示：

```
░ ░ ░ ░ ░
```

规则：

* 不与真实经期混淆
* 透明度更低

---

# 9 日期交互行为

## 9.1 默认态点击

轻点某天：

- 打开下方 `Day Detail`
- 展示当前日期状态
- 允许单日修改

单日主状态只保留：

```
none / period / spotting
```

若该日没有显式记录，则默认解释为：

```
none
```

## 9.2 长按进入多选态

长按某天后：

- 进入多选态
- 当前日期成为选择锚点
- 拖动或继续点选以扩展连续日期范围
- 点击保存后，选中范围统一写入默认 `period`
- 点击空白处或取消按钮退出多选态

说明：

- 这里不存在额外的“补录模型”
- 今天以及之前的任意日期，都只是日期编辑
- 多选保存的默认结果是批量创建 `day_record`

## 9.3 单日详情面板内容

内容：

```
Date
Derived cycle day
Bleeding state
Flow level
Pain level
Color
Notes
```

操作：

```
Set period
Set spotting
Clear record
Edit details
```

约束：

- 单日面板总是基于 `day_record` 当前显式状态渲染
- 没有显式记录的日期显示为 `none`
- 只有 `period` 会进入派生区块计算

---

# 10 Profile 关系

日历属于当前 Profile。

顶部显示：

```
Viewing: Alice
```

规则：

```
打开哪个 profile
日历数据就属于谁
```

---

# 11 Month View（整月）

布局：

```
7 × 6 网格
```

示例：

```
Mo Tu We Th Fr Sa Su
        1  2
3  4  5  6  7  8  9
...
```

交互：

```
← 上个月
→ 下个月
```

点击日期：

```
Day Detail
```

或：

```
Return to Cycle Window
```

---

# 12 数据与加载策略

数据真相：

```
day_record
```

解释规则：

```
无 day_record = none
连续 period = derived cycle block
spotting = day-level state only
```

Cycle Window：

```
center ± 30 days
```

Month View：

```
month ± 7 days
```

保证跨月区块完整。

---

# 13 性能策略

只渲染：

```
当前窗口 21 天
+ 上下缓存各 21 天
```

总计：

```
63 days
```

滚动时动态替换。

---

# 14 视觉层级

颜色优先级：

```
Period      highest
Prediction  medium
Today       border
Record      dot
```

避免冲突。

---

# 15 用户进入路径

用户进入 app：

```
Shared Dashboard
↓
Select Profile
↓
Calendar (Cycle Window)
```

---

# 16 设计原则总结

核心理念：

```
Focus on cycle, not month
```

优势：

1. 经期不会被月份切断
2. 用户操作集中在 2–3 周范围
3. 上下浏览时间更自然
4. 视觉信息密度更低
5. 交互简单，但底层仍支持拆分、补选、删除与周期重算

