import { useMemo, useState } from 'react';
import useMemoizedFn from '../useMemoizedFn';

// 常见联动 Checkbox 逻辑封装，支持多选，单选，全选逻辑，还提供了是否选择，是否全选，是否半选的状态。
export default function useSelections<T>(
  // 原数据
  items: T[],
  // 默认选择的项
  defaultSelected: T[] = [],
) {
  // 选中的
  const [selected, setSelected] = useState<T[]>(defaultSelected);
  // 去重
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  // 判断是否选中
  const isSelected = (item: T) => selectedSet.has(item);

  // 添加到选中的
  const select = (item: T) => {
    selectedSet.add(item);
    return setSelected(Array.from(selectedSet));
  };

  // 从选中列表中山茶油
  const unSelect = (item: T) => {
    selectedSet.delete(item);
    return setSelected(Array.from(selectedSet));
  };

  // 切换选中态
  const toggle = (item: T) => {
    if (isSelected(item)) {
      unSelect(item);
    } else {
      select(item);
    }
  };

  // 选中所有
  const selectAll = () => {
    items.forEach((o) => {
      selectedSet.add(o);
    });
    setSelected(Array.from(selectedSet));
  };

  // 去除所有选中
  const unSelectAll = () => {
    items.forEach((o) => {
      selectedSet.delete(o);
    });
    setSelected(Array.from(selectedSet));
  };

  // 判断是否一个都没有选中
  const noneSelected = useMemo(() => items.every((o) => !selectedSet.has(o)), [items, selectedSet]);

  // 是否所有的都选中
  const allSelected = useMemo(
    () => items.every((o) => selectedSet.has(o)) && !noneSelected,
    [items, selectedSet, noneSelected],
  );

  // 是否部分选中
  const partiallySelected = useMemo(
    () => !noneSelected && !allSelected,
    [noneSelected, allSelected],
  );

  // 反转所有
  const toggleAll = () => (allSelected ? unSelectAll() : selectAll());

  return {
    selected,
    noneSelected,
    allSelected,
    partiallySelected,
    setSelected,
    isSelected,
    select: useMemoizedFn(select),
    unSelect: useMemoizedFn(unSelect),
    toggle: useMemoizedFn(toggle),
    selectAll: useMemoizedFn(selectAll),
    unSelectAll: useMemoizedFn(unSelectAll),
    toggleAll: useMemoizedFn(toggleAll),
  } as const;
}
