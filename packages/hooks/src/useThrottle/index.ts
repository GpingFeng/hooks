import { useEffect, useState } from 'react';
import useThrottleFn from '../useThrottleFn';
import type { ThrottleOptions } from './throttleOptions';

function useThrottle<T>(value: T, options?: ThrottleOptions) {
  const [throttled, setThrottled] = useState(value);
  // 使用了处理节流函数的 hook
  const { run } = useThrottleFn(() => {
    setThrottled(value);
  }, options);

  useEffect(() => {
    run();
  }, [value]);

  return throttled;
}

export default useThrottle;
