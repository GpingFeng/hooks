import { useEffect, useState } from 'react';
import useDebounceFn from '../useDebounceFn';
import type { DebounceOptions } from './debounceOptions';
// 用来处理防抖值的 Hook。
function useDebounce<T>(value: T, options?: DebounceOptions) {
  const [debounced, setDebounced] = useState(value);

  // 使用了处理防抖函数
  const { run } = useDebounceFn(() => {
    setDebounced(value);
  }, options);

  useEffect(() => {
    run();
  }, [value]);

  return debounced;
}

export default useDebounce;
