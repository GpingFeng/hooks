import { useCallback, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import useUnmountedRef from '../useUnmountedRef';

function useSafeState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];

function useSafeState<S = undefined>(): [S | undefined, Dispatch<SetStateAction<S | undefined>>];

function useSafeState<S>(initialState?: S | (() => S)) {
  // 判断是否卸载
  const unmountedRef = useUnmountedRef();
  const [state, setState] = useState(initialState);
  const setCurrentState = useCallback((currentState) => {
    /** if component is unmounted, stop update */
    // 如果组件卸载，则停止更新
    if (unmountedRef.current) return;
    setState(currentState);
  }, []);

  return [state, setCurrentState] as const;
}

export default useSafeState;
