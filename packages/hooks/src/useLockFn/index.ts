import { useRef, useCallback } from 'react';

// 用于给一个异步函数增加竞态锁，防止并发执行。
function useLockFn<P extends any[] = any[], V extends any = any>(fn: (...args: P) => Promise<V>) {
  // 是否现在处于一个锁中
  const lockRef = useRef(false);

  // 返回的是增加了竞态锁的函数
  return useCallback(
    async (...args: P) => {
      // 判断请求是否正在进行
      if (lockRef.current) return;
      // 请求中
      lockRef.current = true;
      try {
        // 执行原有请求
        const ret = await fn(...args);
        // 请求完成，状态锁设置为 false
        lockRef.current = false;
        return ret;
      } catch (e) {
        // 请求失败，状态锁设置为 false
        lockRef.current = false;
        throw e;
      }
    },
    [fn],
  );
}

export default useLockFn;
