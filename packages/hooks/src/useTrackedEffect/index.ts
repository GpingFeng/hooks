import type { DependencyList } from 'react';
import { useEffect, useRef } from 'react';

type Effect = (
  changes?: number[],
  previousDeps?: DependencyList,
  currentDeps?: DependencyList,
) => void | (() => void);

const diffTwoDeps = (deps1?: DependencyList, deps2?: DependencyList) => {
  //Let's do a reference equality check on 2 dependency list.
  // 让我们对2个依赖项列表做一个引用相等性检查。
  //If deps1 is defined, we iterate over deps1 and do comparison on each element with equivalent element from deps2
  // 如果定义了deps1，则遍历deps1并将每个元素与来自deps2的等效元素进行比较
  //As this func is used only in this hook, we assume 2 deps always have same length.
  // 因为这个func只在这个钩子中使用，所以我们假设2个deps的长度总是相同的。
  return deps1
    ? deps1
        .map((_ele, idx) => (!Object.is(deps1[idx], deps2?.[idx]) ? idx : -1))
        .filter((ele) => ele >= 0)
    : deps2
    ? deps2.map((_ele, idx) => idx)
    : [];
};

const useTrackedEffect = (effect: Effect, deps?: DependencyList) => {
  // 记录上次依赖
  const previousDepsRef = useRef<DependencyList>();

  useEffect(() => {
    // 判断依赖的 changes
    const changes = diffTwoDeps(previousDepsRef.current, deps);
    // 上次依赖
    const previousDeps = previousDepsRef.current;
    previousDepsRef.current = deps;
    return effect(changes, previousDeps, deps);
  }, deps);
};

export default useTrackedEffect;
