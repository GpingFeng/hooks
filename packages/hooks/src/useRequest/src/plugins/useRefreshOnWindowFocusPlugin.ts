import { useEffect, useRef } from 'react';
import useUnmount from '../../../useUnmount';
import type { Plugin } from '../types';
import limit from '../utils/limit';
import subscribeFocus from '../utils/subscribeFocus';

const useRefreshOnWindowFocusPlugin: Plugin<any, any[]> = (
  fetchInstance,
  {
    // refreshOnWindowFocus- 在浏览器窗口 refocus 和 revisible 时，会重新发起请求
    refreshOnWindowFocus,
    // 重新请求间隔，单位为毫秒
    focusTimespan = 5000,
  },
) => {
  const unsubscribeRef = useRef<() => void>();

  // 清除订阅事件列表
  const stopSubscribe = () => {
    unsubscribeRef.current?.();
  };

  useEffect(() => {
    // 只有为 true 的时候，这个功能才生效
    if (refreshOnWindowFocus) {
      // 根据 focusTimespan，判断是否进行请求
      const limitRefresh = limit(fetchInstance.refresh.bind(fetchInstance), focusTimespan);
      // 存放在事件订阅列表中
      unsubscribeRef.current = subscribeFocus(() => {
        limitRefresh();
      });
    }
    return () => {
      stopSubscribe();
    };
  }, [refreshOnWindowFocus, focusTimespan]);

  useUnmount(() => {
    stopSubscribe();
  });

  return {};
};

export default useRefreshOnWindowFocusPlugin;
