import type { DependencyList, EffectCallback, useEffect, useLayoutEffect } from 'react';
import { useRef } from 'react';
import useUnmount from '../useUnmount';
import depsAreSame from './depsAreSame';
import type { BasicTarget } from './domTarget';
import { getTargetElement } from './domTarget';

const createEffectWithTarget = (useEffectType: typeof useEffect | typeof useLayoutEffect) => {
  /**
   *
   * @param effect
   * @param deps
   * @param target target should compare ref.current vs ref.current, dom vs dom, ()=>dom vs ()=>dom
   * Target应该比较ref.current和ref.current, dom和dom， ()=>dom vs ()=>dom
   */
  const useEffectWithTarget = (
    effect: EffectCallback,
    deps: DependencyList,
    target: BasicTarget<any> | BasicTarget<any>[],
  ) => {
    const hasInitRef = useRef(false);

    const lastElementRef = useRef<(Element | null)[]>([]);
    const lastDepsRef = useRef<DependencyList>([]);

    const unLoadRef = useRef<any>();

    // useEffect 或者 useLayoutEffect
    useEffectType(() => {
      // 处理 DOM 目标元素
      const targets = Array.isArray(target) ? target : [target];
      const els = targets.map((item) => getTargetElement(item));

      // init run
      // 首次初始化的时候执行
      if (!hasInitRef.current) {
        hasInitRef.current = true;
        lastElementRef.current = els;
        lastDepsRef.current = deps;
        // 执行回调中的 effect 函数
        unLoadRef.current = effect();
        return;
      }
      // 非首次执行的逻辑
      if (
        // 目标元素或者依赖发生变化
        els.length !== lastElementRef.current.length ||
        !depsAreSame(els, lastElementRef.current) ||
        !depsAreSame(deps, lastDepsRef.current)
      ) {
        // 执行上次返回的结果
        unLoadRef.current?.();

        // 更新
        lastElementRef.current = els;
        lastDepsRef.current = deps;
        unLoadRef.current = effect();
      }
    });

    useUnmount(() => {
      // 卸载
      unLoadRef.current?.();
      // for react-refresh
      hasInitRef.current = false;
    });
  };

  return useEffectWithTarget;
};

export default createEffectWithTarget;
