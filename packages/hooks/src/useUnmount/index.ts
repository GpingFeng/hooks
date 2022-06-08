import { useEffect } from 'react';
import useLatest from '../useLatest';
import { isFunction } from '../utils';

const useUnmount = (fn: () => void) => {
  if (process.env.NODE_ENV === 'development') {
    if (!isFunction(fn)) {
      console.error(`useUnmount expected parameter is a function, got ${typeof fn}`);
    }
  }

  const fnRef = useLatest(fn);

  useEffect(
    // 在组件卸载（unmount）时执行的 Hook。
    // useEffect 的返回值中执行函数
    () => () => {
      fnRef.current();
    },
    [],
  );
};

export default useUnmount;
