import { useRef } from 'react';
import type { useEffect, useLayoutEffect } from 'react';

type effectHookType = typeof useEffect | typeof useLayoutEffect;

// 忽略首次执行
export const createUpdateEffect: (hook: effectHookType) => effectHookType =
  (hook) => (effect, deps) => {
    const isMounted = useRef(false);

    // for react-refresh
    hook(() => {
      return () => {
        isMounted.current = false;
      };
    }, []);

    hook(() => {
      // 首次执行完时候，设置为 true，从而下次依赖更新的时候可以执行逻辑
      if (!isMounted.current) {
        isMounted.current = true;
      } else {
        return effect();
      }
    }, deps);
  };
