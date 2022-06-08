import { useRef } from 'react';
import type { Plugin, Timeout } from '../types';

const useLoadingDelayPlugin: Plugin<any, any[]> = (
  fetchInstance,
  {
    // 通过设置 options.loadingDelay ，可以延迟 loading 变成 true 的时间，有效防止闪烁
    loadingDelay,
  },
) => {
  // 为了取到最新的值
  const timerRef = useRef<Timeout>();

  if (!loadingDelay) {
    return {};
  }

  // 清除定时器
  const cancelTimeout = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  return {
    // 在请求前调用
    onBefore: () => {
      // 清除定时器
      cancelTimeout();
      // 通过 setTimeout 实现延迟 loading 的时间
      timerRef.current = setTimeout(() => {
        fetchInstance.setState({
          loading: true,
        });
      }, loadingDelay);

      return {
        loading: false,
      };
    },
    onFinally: () => {
      cancelTimeout();
    },
    onCancel: () => {
      cancelTimeout();
    },
  };
};

export default useLoadingDelayPlugin;
