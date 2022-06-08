import { useEffect } from 'react';
import { isFunction } from '../utils';

// 只在组件初始化时执行的 Hook。
const useMount = (fn: () => void) => {
  // 开发阶段不是函数会报错
  if (process.env.NODE_ENV === 'development') {
    if (!isFunction(fn)) {
      console.error(
        `useMount: parameter \`fn\` expected to be a function, but got "${typeof fn}".`,
      );
    }
  }

  // 单纯就在 useEffect 基础上封装了一层
  useEffect(() => {
    fn?.();
  }, []);
};

export default useMount;
