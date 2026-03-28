const SHOWCASE_SECTIONS = Object.freeze([
  {
    id: 'base',
    title: '基础态',
    caption: '默认、未来弱化、特殊标记',
    items: [
      { variant: 'default', label: '默认', day: 8 },
      { variant: 'futureMuted', label: '未来', day: 18 },
      { variant: 'special', label: '特殊', day: 11 }
    ]
  },
  {
    id: 'selected',
    title: '选中态',
    caption: '普通选中、经期、预测与特殊',
    items: [
      { variant: 'selected', label: '选中', day: 12 },
      { variant: 'selectedPeriod', label: '选中-经期', day: 13 },
      { variant: 'selectedPrediction', label: '选中-预测', day: 14 },
      { variant: 'selectedSpecial', label: '选中-特殊', day: 15 }
    ]
  },
  {
    id: 'today',
    title: '今天态',
    caption: 'today outline 与派生强状态',
    items: [
      { variant: 'today', label: '今天', day: 22 },
      { variant: 'todayPeriod', label: '今天-经期', day: 23 },
      { variant: 'todaySpecial', label: '今天-特殊', day: 24 }
    ]
  }
]);

export function createDateCellShowcaseSections() {
  return SHOWCASE_SECTIONS.map((section) => ({
    ...section,
    items: section.items.map((item) => ({ ...item }))
  }));
}
