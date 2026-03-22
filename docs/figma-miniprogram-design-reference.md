# Figma 设计微信小程序参考

## 用途

这份文档只保留当前给 Pencil / Figma 设计使用的规则，不再承载迁移过程说明。

它解决三件事：

- 平台设计约束
- 本项目专项设计约束
- 外部权威资源入口

## 当前项目边界

- 当前只服务于微信小程序风格的 uni-app MVP
- 当前优先服务月经模块及其共享语义相关页面
- legacy UI 不是视觉参考源，只继承逻辑、交互契约、状态范围和信息架构

## 先看什么

设计前优先读取：

- [project-context.md](/D:/CodeSpace/hbuilder-projects/lovey-record/project-context.md)
- [tech-stack-investigate.md](/D:/CodeSpace/hbuilder-projects/lovey-record/tech-stack-investigate.md)
- [2026-03-22-pencil-mcp-first-batch-pages-brief.md](/D:/CodeSpace/hbuilder-projects/lovey-record/docs/design/2026-03-22-pencil-mcp-first-batch-pages-brief.md)

## 本地设计规则

### 结构与导航

- 单屏只保留一个主任务
- 信息流优先纵向展开
- 页面重点必须一眼可见
- 导航保持一致，不做复杂桌面式层级

### 信息层级

- 只保留少量稳定层级
- 文案短句、直接、低密度
- 重要信息优先靠结构和留白表达

### 状态表达

- `period / prediction / today / special` 必须一眼可分
- `period` 是最强主状态
- `prediction` 低于 `period`
- `today` 用轻提示表达
- `special` 是附加层，不升级为主背景状态

### 交互表达

- 单日编辑应直接在首页原地面板完成
- 长按滑动补录仍是主要批量编辑模型
- 对未来日期要给出轻提示，不伪装成可写成功
- 不引入重 H5 化流程或复杂浮层系统

### 视觉气质

- 基底使用暖白、浅暖色、灰棕系
- 卡片系统轻量、柔和、留白充足
- 避免深色重卡片、厚描边、强阴影
- 整体更像克制、温和、微信原生感较强的工具产品

## 本项目专项约束

- 首页优先展示状态卡、周期日历和原地编辑面板
- 月历浏览是辅助视图，不替代首页编辑
- 不把首页改造成传统经期 App 的重分析页
- 共享语义始终是同一模块实例访问，不是复制数据

## 外部资源

- [微信小程序设计指南](https://developers.weixin.qq.com/miniprogram/design/)
- [WeUI Design Kit - Official](https://www.figma.com/community/file/868338208253640717)
- [WeUI 小程序组件库](https://developers.weixin.qq.com/miniprogram/dev/extended/weui/)
- [Tencent/weui-wxss](https://github.com/Tencent/weui-wxss)
- [Figma Dev Mode](https://www.figma.com/dev-mode/)
- [Guide to the Figma MCP server](https://help.figma.com/hc/en-us/articles/32132100833559-Guide-to-the-Figma-MCP-server)
- [Figma MCP server docs](https://developers.figma.com/docs/figma-mcp-server/)

## 给 AI 的直接指令

当需要 AI 参与设计时，至少说明：

1. 本项目是微信小程序风格的 uni-app，不是 Web 或 React App
2. shared/private 指向同一模块实例，不是复制数据
3. 首页优先状态卡、周期日历和原地编辑
4. legacy UI 不是视觉参考源
5. 输出优先给页面结构、组件树、状态页和视觉方向
