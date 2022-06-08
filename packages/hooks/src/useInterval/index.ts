import { useEffect } from 'react';
import useLatest from '../useLatest';
import { isNumber } from '../utils';

// 一个可以处理 setInterval 的 Hook。
function useInterval(
  fn: () => void,
  delay: number | undefined,
  options?: {
    immediate?: boolean;
  },
) {
  const immediate = options?.immediate;

  const fnRef = useLatest(fn);

  useEffect(() => {
    if (!isNumber(delay) || delay < 0 || isNaN(delay)) {
      console.warn(`delay should be a valid number but get ${delay}`);
      return;
    }

    // 立即执行
    if (immediate) {
      fnRef.current();
    }
    const timer = setInterval(() => {
      fnRef.current();
    }, delay);
    // 清除定时器
    return () => {
      clearInterval(timer);
    };
    // 动态修改 delay 以实现定时器间隔变化与暂停。
  }, [delay]);
}

export default useInterval;
