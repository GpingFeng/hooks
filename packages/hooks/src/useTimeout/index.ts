import { useEffect } from 'react';
import useLatest from '../useLatest';
import { isNumber } from '../utils';

// 一个可以处理 setTimeout 计时器函数的 Hook。
function useTimeout(fn: () => void, delay: number | undefined): void {
  const fnRef = useLatest(fn);

  useEffect(() => {
    // 动态修改 delay 以实现定时器间隔变化与暂停。
    if (!isNumber(delay) || delay < 0 || isNaN(delay)) {
      console.warn(`delay should be a valid number but get ${delay}`);
      return;
    }

    const timer = setTimeout(() => {
      fnRef.current();
    }, delay);
    return () => {
      clearTimeout(timer);
    };
  }, [delay]);
}

export default useTimeout;
