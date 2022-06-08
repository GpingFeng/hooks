import type { DebouncedFunc, ThrottleSettings } from 'lodash';
import throttle from 'lodash/throttle';
import { useEffect, useRef } from 'react';
import type { Plugin } from '../types';

const useThrottlePlugin: Plugin<any, any[]> = (
  fetchInstance,
  {
    // throttleWait-进入节流模式，此时如果频繁触发 run 或者 runAsync，则会以节流策略进行请求。
    throttleWait,
    // throttleLeading - 在节流开始前执行调用
    throttleLeading,
    // throttleTrailing - 在节流结束后执行调用
    throttleTrailing,
  },
) => {
  const throttledRef = useRef<DebouncedFunc<any>>();
  // 相应的 options 设置
  // https://www.lodashjs.com/docs/lodash.throttle
  const options: ThrottleSettings = {};
  if (throttleLeading !== undefined) {
    options.leading = throttleLeading;
  }
  if (throttleTrailing !== undefined) {
    options.trailing = throttleTrailing;
  }

  useEffect(() => {
    if (throttleWait) {
      // 函数劫持
      // 1 - 保留原函数
      const _originRunAsync = fetchInstance.runAsync.bind(fetchInstance);

      // 创建节流函数，该函数提供一个 cancel 方法取消延迟的函数调用以及 flush 方法立即调用。
      throttledRef.current = throttle(
        (callback) => {
          callback();
        },
        throttleWait,
        options,
      );

      // 2 - 改写原有的函数
      // throttle runAsync should be promise
      // https://github.com/lodash/lodash/issues/4400#issuecomment-834800398
      fetchInstance.runAsync = (...args) => {
        return new Promise((resolve, reject) => {
          // 节流函数，对原有函数进行节流
          throttledRef.current?.(() => {
            // 3 - 执行原有函数
            _originRunAsync(...args)
              .then(resolve)
              .catch(reject);
          });
        });
      };
      // 清除上一次 effect
      return () => {
        // 还原函数
        fetchInstance.runAsync = _originRunAsync;
        // 取消节流
        throttledRef.current?.cancel();
      };
    }
  }, [throttleWait, throttleLeading, throttleTrailing]);

  if (!throttleWait) {
    return {};
  }

  return {
    onCancel: () => {
      // 取消节流
      throttledRef.current?.cancel();
    },
  };
};

export default useThrottlePlugin;
