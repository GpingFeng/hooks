import isEqual from 'lodash/isEqual';
import { useEffect, useRef } from 'react';
import type { DependencyList, EffectCallback } from 'react';

const depsEqual = (aDeps: DependencyList, bDeps: DependencyList = []) => {
  return isEqual(aDeps, bDeps);
};

const useDeepCompareEffect = (effect: EffectCallback, deps: DependencyList) => {
  // 通过 useRef 保存上一次的依赖的值
  const ref = useRef<DependencyList>();
  const signalRef = useRef<number>(0);

  // 判断最新的依赖和旧的区别
  // 如果相等，则变更 signalRef.current，从而触发 useEffect 中的回调
  if (!depsEqual(deps, ref.current)) {
    ref.current = deps;
    signalRef.current += 1;
  }

  useEffect(effect, [signalRef.current]);
};

export default useDeepCompareEffect;
