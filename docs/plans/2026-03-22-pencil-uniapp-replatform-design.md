# Pencil + uni-app Replatform Design

**日期：** 2026-03-22

## 结论

- Pencil 是新的界面真相源
- uni-app 是新的运行时实现层
- legacy 原生小程序代码仅是逻辑与交互参考
- 页面重构优先于页面复刻

## 不变的产品约束

- 月经模块仍是当前唯一完整实现模块
- 单人可用优先于共享
- shared/private 指向同一模块实例
- `day_record` 是记录真相，`cycle` 是派生结果
- 首页优先回答“当前状态”

## 设计阶段职责分工

### Pencil

负责：

- 页面结构
- 组件拆解与命名
- 状态页补全
- 设计 token 与视觉语言

不负责：

- 业务实现
- 页面状态管理设计
- 可上线代码

### uni-app

负责：

- 页面实现
- 组件实现
- 路由
- 状态管理与平台封装

### legacy

负责：

- 业务逻辑参考
- 交互流程参考
- 信息架构参考

不负责：

- 视觉 baseline
- 新组件组织方式
- 新页面结构约束

## 当前设计原则

### 1. 迁移业务，不迁移页面代码

优先迁移：

- 日期规则
- 周期推导规则
- 单日状态规则
- 批量编辑规则
- 模块实例与共享边界

不直接迁移：

- WXML 结构
- WXSS 布局
- `Page({})`
- 散落页面中的 `wx.*`

### 2. 截图用于识别结构，不用于复刻视觉

截图只用于：

- 识别页面目的
- 拆解组件树
- 校验状态范围
- 核对交互线索

截图不用于：

- 继承 legacy UI 视觉语言
- 做逐像素还原
- 反向约束新设计表达

### 3. 设计先冻结结构，再进入实现

当前阶段优先冻结：

- 页面清单
- 组件清单
- 首页核心交互契约
- 状态页覆盖清单

详细清单见：

- [2026-03-22-pencil-uniapp-migration-inventory.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/plans/2026-03-22-pencil-uniapp-migration-inventory.md)
- [design/README.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/README.md)
- [design/menstrual/Design-Overview.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/menstrual/Design-Overview.md)
