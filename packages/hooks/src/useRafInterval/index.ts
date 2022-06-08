import { useEffect } from 'react';
import useLatest from '../useLatest';
import { isNumber } from '../utils';

interface Handle {
  id: number | NodeJS.Timer;
}

const setRafInterval = function (callback: () => void, delay: number = 0): Handle {
  // window.requestAnimationFrame() 告诉浏览器——你希望执行一个动画，并且要求浏览器在下次重绘之前调用指定的回调函数更新动画。该方法需要传入一个回调函数作为参数，该回调函数会在浏览器下一次重绘之前执行
  if (typeof requestAnimationFrame === typeof undefined) {
    // 如果不支持，还是使用 setInterval
    return {
      id: setInterval(callback, delay),
    };
  }
  // 开始时间
  let start = new Date().getTime();
  const handle: Handle = {
    id: 0,
  };
  const loop = () => {
    const current = new Date().getTime();
    // 当前时间 - 开始时间，大于设置的间隔，则执行，并重置开始时间
    if (current - start >= delay) {
      callback();
      start = new Date().getTime();
    }
    handle.id = requestAnimationFrame(loop);
  };
  handle.id = requestAnimationFrame(loop);
  return handle;
};

function cancelAnimationFrameIsNotDefined(t: any): t is NodeJS.Timer {
  return typeof cancelAnimationFrame === typeof undefined;
}

// 清除定时器
const clearRafInterval = function (handle: Handle) {
  if (cancelAnimationFrameIsNotDefined(handle.id)) {
    return clearInterval(handle.id);
  }
  cancelAnimationFrame(handle.id);
};

// 用 requestAnimationFrame 模拟实现 setInterval，API 和 useInterval 保持一致，好处是可以在页面不渲染的时候停止执行定时器，比如页面隐藏或最小化等。
function useRafInterval(
  fn: () => void,
  delay: number | undefined,
  options?: {
    immediate?: boolean;
  },
) {
  const immediate = options?.immediate;

  const fnRef = useLatest(fn);

  useEffect(() => {
    if (!isNumber(delay) || delay < 0) return;
    if (immediate) {
      fnRef.current();
    }
    const timer = setRafInterval(() => {
      fnRef.current();
    }, delay);
    return () => {
      clearRafInterval(timer);
    };
  }, [delay]);
}

export default useRafInterval;
