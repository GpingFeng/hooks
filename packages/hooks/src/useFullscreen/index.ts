import { useState } from 'react';
// https://www.npmjs.com/package/screenfull
import screenfull from 'screenfull';
import useLatest from '../useLatest';
import useMemoizedFn from '../useMemoizedFn';
import useUnmount from '../useUnmount';
import type { BasicTarget } from '../utils/domTarget';
import { getTargetElement } from '../utils/domTarget';

export interface Options {
  onExit?: () => void;
  onEnter?: () => void;
}

const useFullscreen = (target: BasicTarget, options?: Options) => {
  const { onExit, onEnter } = options || {};

  // 退出全屏触发
  const onExitRef = useLatest(onExit);
  // 全屏触发
  const onEnterRef = useLatest(onEnter);

  const [state, setState] = useState(false);

  const onChange = () => {
    if (screenfull.isEnabled) {
      const { isFullscreen } = screenfull;
      if (isFullscreen) {
        onEnterRef.current?.();
      } else {
        screenfull.off('change', onChange);
        onExitRef.current?.();
      }
      setState(isFullscreen);
    }
  };

  // 进入全屏
  const enterFullscreen = () => {
    const el = getTargetElement(target);
    if (!el) {
      return;
    }

    if (screenfull.isEnabled) {
      try {
        screenfull.request(el);
        screenfull.on('change', onChange);
      } catch (error) {
        console.error(error);
      }
    }
  };

  // 退出全屏
  const exitFullscreen = () => {
    if (!state) {
      return;
    }
    if (screenfull.isEnabled) {
      screenfull.exit();
    }
  };

  // 切换模式
  const toggleFullscreen = () => {
    if (state) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  };

  useUnmount(() => {
    if (screenfull.isEnabled) {
      screenfull.off('change', onChange);
    }
  });

  return [
    state,
    {
      enterFullscreen: useMemoizedFn(enterFullscreen),
      exitFullscreen: useMemoizedFn(exitFullscreen),
      toggleFullscreen: useMemoizedFn(toggleFullscreen),
      isEnabled: screenfull.isEnabled,
    },
  ] as const;
};

export default useFullscreen;
