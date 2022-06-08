import { useCallback, useState } from 'react';
import useLatest from '../useLatest';
import { isFunction } from '../utils';

interface EventTarget<U> {
  target: {
    value: U;
  };
}

export interface Options<T, U> {
  initialValue?: T;
  transformer?: (value: U) => T;
}
// 常见表单控件(通过 e.target.value 获取表单值) 的 onChange 跟 value 逻辑封装，支持自定义值转换和重置功能。
function useEventTarget<T, U = T>(options?: Options<T, U>) {
  const { initialValue, transformer } = options || {};
  const [value, setValue] = useState(initialValue);
  // 自定义转换函数
  const transformerRef = useLatest(transformer);

  const reset = useCallback(() => setValue(initialValue), []);

  const onChange = useCallback((e: EventTarget<U>) => {
    // 获取 e.target.value 的值，并进行设置
    const _value = e.target.value;
    if (isFunction(transformerRef.current)) {
      return setValue(transformerRef.current(_value));
    }
    // no transformer => U and T should be the same
    return setValue(_value as unknown as T);
  }, []);

  return [
    value,
    {
      onChange,
      reset,
    },
  ] as const;
}

export default useEventTarget;
