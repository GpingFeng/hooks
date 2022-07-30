import { useRef } from 'react';
import useUpdateEffect from '../../../useUpdateEffect';
import type { Plugin } from '../types';

// support refreshDeps & ready
const useAutoRunPlugin: Plugin<any, any[]> = (
  fetchInstance,
  // 支持依赖更新的时候，进行自动请求
  // refreshDeps 参数，当它的值变化后，会重新触发请求。
  { manual, ready = true, defaultParams = [], refreshDeps = [], refreshDepsAction },
) => {
  // 保证值是最新的
  const hasAutoRun = useRef(false);
  hasAutoRun.current = false;

  // useUpdateEffect 用法等同于 useEffect，但是会忽略首次执行，只在依赖更新时执行。
  useUpdateEffect(() => {
    // manual 值为 false
    if (!manual && ready) {
      hasAutoRun.current = true;
      fetchInstance.run(...defaultParams);
    }
    // ready 的变化执行
  }, [ready]);

  useUpdateEffect(() => {
    if (hasAutoRun.current) {
      return;
    }
    if (!manual) {
      hasAutoRun.current = true;
      // 这个参数只有在内部会用到，外部 API 中暂时没有提及，感觉可以暴露
      // 依赖变化的时候的处理逻辑，假如有传的话，就执行该逻辑，否则请求请求
      if (refreshDepsAction) {
        refreshDepsAction();
      } else {
        // 采用上次的参数进行执行
        fetchInstance.refresh();
      }
    }
    // 依赖项发生变化的时候执行
  }, [...refreshDeps]);

  return {
    onBefore: () => {
      if (!ready) {
        return {
          stopNow: true,
        };
      }
    },
  };
};

useAutoRunPlugin.onInit = ({ ready = true, manual }) => {
  return {
    // 假如为自动触发并且已经 ready
    loading: !manual && ready,
  };
};

export default useAutoRunPlugin;
