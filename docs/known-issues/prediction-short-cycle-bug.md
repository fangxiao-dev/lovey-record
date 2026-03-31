# Bug：Batch 标记经期后触发不合理的预测窗口

**发现时间：** 2026-03-30
**影响范围：** 后端预测逻辑 + 前端日历显示

---

## 现象

用 batch selection 选中 3/23–3/24 并保存为经期状态后，日历上 3/25–3/29 变成了 prediction（预测）状态。

## 根因

`backend/src/services/dayRecord.service.ts` 的 `derivePrediction` 函数使用**所有 cycle 起始日的间距平均值**来推算下一次周期。

复现场景中的数据状态：
- 已有 3/19 标记为经期（单独一天，被识别为 cycle 1 start）
- 新增 3/23–3/24 标记为经期（被识别为 cycle 2 start）

计算过程：
```
intervals = [23 - 19] = [4 天]
average   = 4 天
predicted = 3/23 + 4 = 3/27
window    = 3/25 ~ 3/29   ← 出现在日历上的 prediction 状态
```

## 问题所在

4 天的周期在生理上不合理。3/19 和 3/23–3/24 很可能属于同一次月经，但 `deriveCycles` 因为日期不连续（中间有 3/20–3/22 未标记）而将它们分成了两个独立 cycle，导致推算出超短周期。

## 修复方向

在 `derivePrediction` 中过滤掉不合理的 interval：

```ts
// 建议：排除 < 15 天的 interval，避免用同一次月经内的碎片数据推算周期
const validIntervals = intervals.filter(i => i >= 15);
if (validIntervals.length === 0) return null;
const average = Math.round(validIntervals.reduce(...) / validIntervals.length) || 28;
```

或者更根本的修法：`deriveCycles` 在拆分 cycle 时应考虑"同一个月经期内允许有空洞"，用间距阈值（如 ≤ 3 天的空洞视为同一次月经）来合并相邻 period 段。

## 当前状态

- [x] 后端 `dayRecord.service.ts` 已修复（2026-03-31）
  - 在 `derivePrediction` 中添加 interval 过滤，排除 < 15 天的周期
- [x] 修复后回归完成
  - backend unit/integration tests: 67/69 通过
  - Playwright 前后端集成测试：7/7 通过
