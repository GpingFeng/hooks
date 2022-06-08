import { useRef } from 'react';
import useUpdateEffect from '../../../useUpdateEffect';
import type { Plugin, Timeout } from '../types';
import isDocumentVisible from '../utils/isDocumentVisible';
import subscribeReVisible from '../utils/subscribeReVisible';

// 轮询
const usePollingPlugin: Plugin<any, any[]> = (
  fetchInstance,
  {
    // 轮询间隔，单位为毫秒。如果值大于 0，则启动轮询模式。
    pollingInterval,
    // 在页面隐藏时，是否继续轮询。如果设置为 false，在页面隐藏时会暂时停止轮询，页面重新显示时继续上次轮询。
    pollingWhenHidden = true,
  },
) => {
  const timerRef = useRef<Timeout>();
  const unsubscribeRef = useRef<() => void>();

  // 停止轮询
  const stopPolling = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    // 清楚原订阅的事件列表
    unsubscribeRef.current?.();
  };

  // useUpdateEffect 用法等同于 useEffect，但是会忽略首次执行，只在依赖更新时执行
  useUpdateEffect(() => {
    // 假如没有设置，则停止轮询
    if (!pollingInterval) {
      stopPolling();
    }
  }, [pollingInterval]);

  if (!pollingInterval) {
    return {};
  }

  return {
    onBefore: () => {
      stopPolling();
    },
    onFinally: () => {
      // 假如 pollingWhenHidden = false，在页面隐藏时会暂时停止轮询
      // if pollingWhenHidden = false && document is hidden, then stop polling and subscribe revisible
      if (!pollingWhenHidden && !isDocumentVisible()) {
        // 返回的是清楚订阅事件的列表
        unsubscribeRef.current = subscribeReVisible(() => {
          // 进行请求
          fetchInstance.refresh();
        });
        return;
      }

      // 通过 setTimeout 进行轮询
      timerRef.current = setTimeout(() => {
        fetchInstance.refresh();
      }, pollingInterval);
    },
    onCancel: () => {
      stopPolling();
    },
  };
};

export default usePollingPlugin;
