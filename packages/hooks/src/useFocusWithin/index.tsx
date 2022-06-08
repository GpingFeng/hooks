import { useState } from 'react';
import useEventListener from '../useEventListener';
import type { BasicTarget } from '../utils/domTarget';

export interface Options {
  onFocus?: (e: FocusEvent) => void;
  onBlur?: (e: FocusEvent) => void;
  onChange?: (isFocusWithin: boolean) => void;
}

// 监听当前焦点是否在某个区域之内，同 css 属性 :focus-within。
export default function useFocusWithin(target: BasicTarget, options?: Options) {
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const { onFocus, onBlur, onChange } = options || {};

  // https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-within
  // 监听 focusin 和 focusout
  useEventListener(
    'focusin',
    (e: FocusEvent) => {
      if (!isFocusWithin) {
        // 获取焦点时触发
        onFocus?.(e);
        // 焦点变化时触发
        onChange?.(true);
        setIsFocusWithin(true);
      }
    },
    {
      target,
    },
  );

  useEventListener(
    'focusout',
    (e: FocusEvent) => {
      // @ts-ignore
      if (isFocusWithin && !e.currentTarget?.contains?.(e.relatedTarget)) {
        // 失去焦点时触发
        onBlur?.(e);
        onChange?.(false);
        setIsFocusWithin(false);
      }
    },
    {
      target,
    },
  );

  return isFocusWithin;
}
