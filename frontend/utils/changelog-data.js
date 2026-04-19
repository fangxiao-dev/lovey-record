// Changelog entries, ordered newest-first.
// Add a new entry here when cutting a GitHub release tag.
// version format: vMAJOR.MINOR.PATCH
export default [
  {
    "version": "v0.5.1",
    "title": "优化日历浏览体验",
    "date": "2026-04-19",
    "anchorCommit": "ad90f4a6a269a5b18f6c76c10adf0a61988a56bf",
    "changes": [
      "3 周视图现在可以按前一次和后一次经期连续浏览，不用再只靠固定快捷跳转",
      "浏览到下次预测后，会直接提示“暂无更后的月经记录”，不会再打断当前页面",
      "日历头部的月份显示和翻页按钮更清晰，跨年时也更容易看懂",
    ],
  },
  {
    "version": "v0.5.0",
    "title": "新增周期阶段提示",
    "date": "2026-04-16",
    "anchorCommit": "3f03eff330ea35fa996d0fdeb7917cc7bd65a31a",
    "changes": [
      "首页会直接显示当前周期阶段：卵泡期、排卵期、黄体期、经期",
      "需要注意时会补充“月经可能临近”的提示",
    ],
  },
  {
    "version": "v0.4.0",
    "title": "新增月经报告页",
    "date": "2026-04-11",
    "anchorCommit": "b55fa0047ce971f78dd727f852211d1373d57f6c",
    "changes": [
      "可以从首页进入月经报告页查看周期概览",
      "报告页补上了趋势图和摘要信息",
    ],
  },
  {
    "version": "v0.3.0",
    "title": "支持模块共享",
    "date": "2026-04-13",
    "anchorCommit": "23cd99bd9b2c803492699c4603e7cade8dae7c83",
    "changes": [
      "分享时可以选择让对方只读或一起编辑",
      "加入了更清晰的共享确认流程",
    ],
  },
  {
    "version": "v0.2.1",
    "title": "提升反馈速度",
    "date": "2026-04-04",
    "anchorCommit": "b03825362b7530856f8479a2f9af00d88285b24d",
    "changes": [
      "记录经期后页面反馈更快",
      "预测区间展示更稳定",
    ],
  },
  {
    "version": "v0.2.0",
    "title": "支持单日编辑",
    "date": "2026-04-02",
    "anchorCommit": "1aa429ff5af83f3d2d3f616c6f6b472d31bd74f3",
    "changes": [
      "可以直接修改某一天的经期记录",
      "补记和调整会更顺手",
    ],
  },
  {
    "version": "v0.1.1",
    "title": "提升页面稳定性",
    "date": "2026-04-01",
    "anchorCommit": "216dc4e7653a583bdfc6056f50b57d1f77c399ac",
    "changes": [
      "页面打开和加载更稳定",
    ],
  },
  {
    "version": "v0.1.0",
    "title": "优化日历与日期状态",
    "date": "2026-03-28",
    "anchorCommit": "09f94839fa6892b0d507c4a99c877c8e9a9f3a04",
    "changes": [
      "日历里的日期状态和颜色更统一",
      "预测期、经期和普通日期更容易区分",
    ],
  },
  {
    "version": "v0.0.1",
    "title": "新建月经记录首页",
    "date": "2026-03-22",
    "anchorCommit": "73671fe9a1805f7c95252b91aec26854628acade",
    "changes": [
      "完成了第一版月经记录首页和基础交互",
    ],
  },
];
