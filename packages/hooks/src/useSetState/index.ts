import { useCallback, useState } from 'react';
import { isFunction } from '../utils';

export type SetState<S extends Record<string, any>> = <K extends keyof S>(
  state: Pick<S, K> | null | ((prevState: Readonly<S>) => Pick<S, K> | S | null),
) => void;

// 管理 object 类型 state 的 Hooks，用法与 class 组件的 this.setState 基本一致。
const useSetState = <S extends Record<string, any>>(
  initialState: S | (() => S),
): [S, SetState<S>] => {
  const [state, setState] = useState<S>(initialState);

  // 合并操作，并返回一个全新的值
  const setMergeState = useCallback((patch) => {
    setState((prevState) => {
      // 新状态
      const newState = isFunction(patch) ? patch(prevState) : patch;
      // 也可以通过类似 Object.assign 的方式合并
      // 对象拓展运算符，返回新的对象，保证原有数据不可变
      return newState ? { ...prevState, ...newState } : prevState;
    });
  }, []);

  return [state, setMergeState];
};

export default useSetState;
