import type { Dispatch, SetStateAction } from 'react';
import { useState, useRef, useCallback } from 'react';

type GetStateAction<S> = () => S;
// 给 React.useState 增加了一个 getter 方法，以获取当前最新值。
// ts 函数重载
function useGetState<S>(
  initialState: S | (() => S),
): [S, Dispatch<SetStateAction<S>>, GetStateAction<S>];
function useGetState<S = undefined>(): [
  S | undefined,
  Dispatch<SetStateAction<S | undefined>>,
  GetStateAction<S | undefined>,
];
function useGetState<S>(initialState?: S) {
  const [state, setState] = useState(initialState);
  // useRef 返回一个可变的 ref 对象，其 .current 属性被初始化为传入的参数（initialValue）。返回的 ref 对象在组件的整个生命周期内持续存在。
  // 使用 useRef 处理 state
  const stateRef = useRef(state);
  stateRef.current = state;

  const getState = useCallback(() => stateRef.current, []);

  return [state, setState, getState];
}

export default useGetState;
