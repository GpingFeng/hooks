import { useRef } from 'react';
import type { Plugin, Timeout } from '../types';

// 重试
const useRetryPlugin: Plugin<any, any[]> = (
  fetchInstance,
  {
    // 重试时间间隔，单位为毫秒。
    retryInterval,
    // retryCount-指定错误重试次数
    retryCount,
  },
) => {
  // 定时器
  const timerRef = useRef<Timeout>();
  // 重试的次数
  const countRef = useRef(0);

  const triggerByRetry = useRef(false);

  if (!retryCount) {
    return {};
  }

  return {
    onBefore: () => {
      // 假如还在重试中，则不会重置为0
      if (!triggerByRetry.current) {
        countRef.current = 0;
      }
      triggerByRetry.current = false;
      // 重新请求，则取消之前的重试
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    },
    onSuccess: () => {
      // 成功之后，重置
      countRef.current = 0;
    },
    onError: () => {
      countRef.current += 1;
      // 重试的次数小于设置的次数
      // 或者如果 retryCount 设置为 -1，则无限次重试。
      if (retryCount === -1 || countRef.current <= retryCount) {
        // Exponential backoff
        // 如果不设置，默认采用简易的指数退避算法，取 1000 * 2 ** retryCount，也就是第一次重试等待 2s，第二次重试等待 4s，以此类推，如果大于 30s，则取 30s
        const timeout = retryInterval ?? Math.min(1000 * 2 ** countRef.current, 30000);
        timerRef.current = setTimeout(() => {
          // 失败的时候置为 true，保证重试次数不重置
          triggerByRetry.current = true;
          // 重新请求
          fetchInstance.refresh();
        }, timeout);
      } else {
        // 重置为0，并且不再重试
        countRef.current = 0;
      }
    },
    // 取消重试
    onCancel: () => {
      countRef.current = 0;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    },
  };
};

export default useRetryPlugin;
