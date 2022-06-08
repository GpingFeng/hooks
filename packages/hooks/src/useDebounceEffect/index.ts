import { useEffect, useState } from 'react';
import type { DependencyList, EffectCallback } from 'react';
import type { DebounceOptions } from '../useDebounce/debounceOptions';
import useDebounceFn from '../useDebounceFn';
import useUpdateEffect from '../useUpdateEffect';

// 为 useEffect 增加防抖的能力。
function useDebounceEffect(
  effect: EffectCallback,
  deps?: DependencyList,
  // 配置防抖的行为
  options?: DebounceOptions,
) {
  const [flag, setFlag] = useState({});

  // useDebounceFn，为函数设置防抖功能
  const { run } = useDebounceFn(() => {
    setFlag({});
  }, options);

  useEffect(() => {
    return run();
  }, deps);

  // 只有在 flag 变化的时候，才执行逻辑
  useUpdateEffect(effect, [flag]);
}

export default useDebounceEffect;
