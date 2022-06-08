import Cookies from 'js-cookie';
import { useState } from 'react';
import useMemoizedFn from '../useMemoizedFn';
import { isFunction, isString } from '../utils';

export type State = string | undefined;

export interface Options extends Cookies.CookieAttributes {
  defaultValue?: State | (() => State);
}

function useCookieState(
  // Cookie 的 key 值
  cookieKey: string,
  // 配置 Cookie 属性
  options: Options = {},
) {
  const [state, setState] = useState<State>(() => {
    // 假如有值，则直接返回
    const cookieValue = Cookies.get(cookieKey);

    if (isString(cookieValue)) return cookieValue;
    // 定义 Cookie 默认值，但不同步到本地 Cookie
    // 可以自定义默认值
    if (isFunction(options.defaultValue)) {
      return options.defaultValue();
    }

    return options.defaultValue;
  });

  // 设置 Cookie 值
  // 更新 cookie options，会与 useCookieState 设置的 options 进行 merge 操作。
  const updateState = useMemoizedFn(
    (
      newValue: State | ((prevState: State) => State),
      newOptions: Cookies.CookieAttributes = {},
    ) => {
      const { defaultValue, ...restOptions } = { ...options, ...newOptions };
      setState((prevState) => {
        const value = isFunction(newValue) ? newValue(prevState) : newValue;
        // 值为 undefined 的时候，清除 cookie
        if (value === undefined) {
          Cookies.remove(cookieKey);
        } else {
          Cookies.set(cookieKey, value, restOptions);
        }
        return value;
      });
    },
  );

  return [state, updateState] as const;
}

export default useCookieState;
