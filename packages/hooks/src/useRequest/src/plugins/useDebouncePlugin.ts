import type { DebouncedFunc, DebounceSettings } from 'lodash';
import debounce from 'lodash/debounce';
import { useEffect, useMemo, useRef } from 'react';
import type { Plugin } from '../types';

const useDebouncePlugin: Plugin<any, any[]> = (
  fetchInstance,
  // 第二次参数也是 useRequest 的第二个参数中读取的
  {
    // 防抖等待时间, 单位为毫秒，设置后，进入防抖模式
    debounceWait,
    // debounceLeading，在延迟开始前执行调用
    debounceLeading,
    // debounceTrailing - 指定在延迟结束后调用。
    debounceTrailing,
    // debounceMaxWait-设置 func 允许被延迟的最大值。
    debounceMaxWait,
  },
) => {
  const debouncedRef = useRef<DebouncedFunc<any>>();

  const options = useMemo(() => {
    // 设置 options，都是 lodash debounce 的参数
    // https://www.lodashjs.com/docs/lodash.debounce
    const ret: DebounceSettings = {};
    if (debounceLeading !== undefined) {
      ret.leading = debounceLeading;
    }
    if (debounceTrailing !== undefined) {
      ret.trailing = debounceTrailing;
    }
    if (debounceMaxWait !== undefined) {
      ret.maxWait = debounceMaxWait;
    }
    return ret;
  }, [debounceLeading, debounceTrailing, debounceMaxWait]);

  useEffect(() => {
    if (debounceWait) {
      // 保存异步执行的结果
      const _originRunAsync = fetchInstance.runAsync.bind(fetchInstance);

      // 使用 lodash 的防抖
      // 该函数提供一个 cancel 方法取消延迟的函数调用
      debouncedRef.current = debounce(
        (callback) => {
          callback();
        },
        debounceWait,
        options,
      );

      // debounce runAsync should be promise
      // https://github.com/lodash/lodash/issues/4400#issuecomment-834800398
      // 函数劫持，改写了 runAsync 方法，使其具有防抖能力
      fetchInstance.runAsync = (...args) => {
        return new Promise((resolve, reject) => {
          debouncedRef.current?.(() => {
            // 执行原函数
            _originRunAsync(...args)
              .then(resolve)
              .catch(reject);
          });
        });
      };

      // React 会在执行当前 effect 之前对上一个 effect 进行清除
      return () => {
        debouncedRef.current?.cancel();
        // 还原最开始的函数
        fetchInstance.runAsync = _originRunAsync;
      };
    }
  }, [debounceWait, options]);

  if (!debounceWait) {
    return {};
  }

  return {
    // 在请求取消的时候，取消函数调用
    onCancel: () => {
      debouncedRef.current?.cancel();
    },
  };
};

export default useDebouncePlugin;
