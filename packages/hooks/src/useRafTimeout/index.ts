import { useEffect } from 'react';
import useLatest from '../useLatest';
import { isNumber } from '../utils';

interface Handle {
  id: number | NodeJS.Timeout;
}

const setRafTimeout = function (callback: () => void, delay: number = 0): Handle {
  if (typeof requestAnimationFrame === typeof undefined) {
    return {
      id: setTimeout(callback, delay),
    };
  }

  const handle: Handle = {
    id: 0,
  };

  const startTime = new Date().getTime();

  const loop = () => {
    const current = new Date().getTime();
    if (current - startTime >= delay) {
      callback();
    } else {
      handle.id = requestAnimationFrame(loop);
    }
  };
  handle.id = requestAnimationFrame(loop);
  return handle;
};

function cancelAnimationFrameIsNotDefined(t: any): t is NodeJS.Timer {
  return typeof cancelAnimationFrame === typeof undefined;
}

const clearRafTimeout = function (handle: Handle) {
  if (cancelAnimationFrameIsNotDefined(handle.id)) {
    return clearTimeout(handle.id);
  }
  cancelAnimationFrame(handle.id);
};

// 用 requestAnimationFrame 模拟实现 setTimeout，API 和 useTimeout 保持一致，好处是可以在页面不渲染的时候不触发函数执行，比如页面隐藏或最小化等。
// 跟 useRafInterval 类似
function useRafTimeout(fn: () => void, delay: number | undefined) {
  const fnRef = useLatest(fn);

  useEffect(() => {
    if (!isNumber(delay) || delay < 0) return;
    const timer = setRafTimeout(() => {
      fnRef.current();
    }, delay);
    return () => {
      clearRafTimeout(timer);
    };
  }, [delay]);
}

export default useRafTimeout;
