import { useCallback, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import useUnmount from '../useUnmount';

function useRafState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
function useRafState<S = undefined>(): [S | undefined, Dispatch<SetStateAction<S | undefined>>];

function useRafState<S>(initialState?: S | (() => S)) {
  const ref = useRef(0);
  const [state, setState] = useState(initialState);

  const setRafState = useCallback((value: S | ((prevState: S) => S)) => {
    cancelAnimationFrame(ref.current);
    // 只在 requestAnimationFrame callback 时更新 state，一般用于性能优化。
    ref.current = requestAnimationFrame(() => {
      setState(value);
    });
  }, []);

  // unMount 的时候，去除监听
  useUnmount(() => {
    cancelAnimationFrame(ref.current);
  });

  return [state, setRafState] as const;
}

export default useRafState;
