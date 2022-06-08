import { useMemo, useState } from 'react';

export interface Actions<T> {
  setLeft: () => void;
  setRight: () => void;
  set: (value: T) => void;
  toggle: () => void;
}

// TS 函数重载的使用
function useToggle<T = boolean>(): [boolean, Actions<T>];

function useToggle<T>(defaultValue: T): [T, Actions<T>];

function useToggle<T, U>(defaultValue: T, reverseValue: U): [T | U, Actions<T | U>];

function useToggle<D, R>(
  // 默认值
  defaultValue: D = false as unknown as D,
  // 取反
  reverseValue?: R,
) {
  const [state, setState] = useState<D | R>(defaultValue);

  const actions = useMemo(() => {
    const reverseValueOrigin = (reverseValue === undefined ? !defaultValue : reverseValue) as D | R;

    // 切换 state
    const toggle = () => setState((s) => (s === defaultValue ? reverseValueOrigin : defaultValue));
    // 修改 state
    const set = (value: D | R) => setState(value);
    // 设置为 defaultValue
    const setLeft = () => setState(defaultValue);
    // 如果传入了 reverseValue, 则设置为 reverseValue。 否则设置为 defautValue 的反值
    const setRight = () => setState(reverseValueOrigin);

    return {
      toggle,
      set,
      setLeft,
      setRight,
    };
    // useToggle ignore value change
    // }, [defaultValue, reverseValue]);
  }, []);

  return [state, actions];
}

export default useToggle;
