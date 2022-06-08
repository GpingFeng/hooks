import { useEffect, useState } from 'react';
import type { DependencyList, EffectCallback } from 'react';
import type { ThrottleOptions } from '../useThrottle/throttleOptions';
import useThrottleFn from '../useThrottleFn';
import useUpdateEffect from '../useUpdateEffect';

function useThrottleEffect(
  effect: EffectCallback,
  deps?: DependencyList,
  options?: ThrottleOptions,
) {
  const [flag, setFlag] = useState({});

  // 用来处理函数节流的 Hook。
  const { run } = useThrottleFn(() => {
    setFlag({});
  }, options);

  useEffect(() => {
    return run();
  }, deps);

  // 只有在 flag 变化的时候，才执行 effect 函数
  useUpdateEffect(effect, [flag]);
}

export default useThrottleEffect;
