const SHOWCASE_BOARD = Object.freeze({
  title: 'Primitive/DateStates',
  intro: '基础态在这里定义：依次为普通态、带详情标记态、预测态、月经态、今天、未来态',
  selectedIntro: '“被选中后”的变体在这里定义，比如“选中+月经”变体',
  groups: [
    {
      id: 'base',
      emphasis: 'base',
      items: [
        { variant: 'default', label: '普通态' },
        { variant: 'detail', label: '详情态' },
        { variant: 'prediction', label: '预测态' },
        { variant: 'period', label: '月经态' },
        { variant: 'today', label: '今天态' },
        { variant: 'futureMuted', label: '未来态' }
      ]
    },
    {
      id: 'selected',
      emphasis: 'selected',
      items: [
        { variant: 'selectedPeriodDetail', label: '选中+月经+详情' },
        { variant: 'selectedPredictionDetail', label: '选中+预测+详情' },
        { variant: 'selectedDetail', label: '选中+详情' },
        { variant: 'selected', label: '选中态' },
        { variant: 'selectedTodayDetail', label: '选中+今天+详情' }
      ]
    },
    {
      id: 'today',
      emphasis: 'today',
      items: [
        { variant: 'todayDetail', label: '今天+详情' },
        { variant: 'todayPeriod', label: '今天+月经' }
      ]
    }
  ]
});

export function createDateCellShowcaseBoard() {
  return {
    ...SHOWCASE_BOARD,
    groups: SHOWCASE_BOARD.groups.map((group) => ({
      ...group,
      items: group.items.map((item) => ({ ...item }))
    }))
  };
}
