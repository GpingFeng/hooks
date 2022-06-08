import throttle from 'lodash/throttle';
import { useMemo } from 'react';
import useLatest from '../useLatest';
import type { ThrottleOptions } from '../useThrottle/throttleOptions';
import useUnmount from '../useUnmount';
import { isFunction } from '../utils';

type noop = (...args: any) => any;

// 用来处理函数节流的 Hook。
function useThrottleFn<T extends noop>(fn: T, options?: ThrottleOptions) {
  if (process.env.NODE_ENV === 'development') {
    if (!isFunction(fn)) {
      console.error(`useThrottleFn expected parameter is a function, got ${typeof fn}`);
    }
  }

  const fnRef = useLatest(fn);

  const wait = options?.wait ?? 1000;

  const throttled = useMemo(
    () =>
      // 最终都是调用了 lodash 的节流函数
      throttle(
        (...args: Parameters<T>): ReturnType<T> => {
          return fnRef.current(...args);
        },
        wait,
        options,
      ),
    [],
  );

  useUnmount(() => {
    throttled.cancel();
  });

  return {
    run: throttled,
    cancel: throttled.cancel,
    flush: throttled.flush,
  };
}

export default useThrottleFn;
