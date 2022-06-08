import useBoolean from '../useBoolean';
import useEventListener from '../useEventListener';
import type { BasicTarget } from '../utils/domTarget';

export interface Options {
  onEnter?: () => void;
  onLeave?: () => void;
}

// 监听 DOM 元素是否有鼠标悬停。
export default (target: BasicTarget, options?: Options): boolean => {
  const { onEnter, onLeave } = options || {};

  const [state, { setTrue, setFalse }] = useBoolean(false);
  // 通过监听 mouseenter 判断有鼠标悬停
  useEventListener(
    'mouseenter',
    () => {
      onEnter?.();
      setTrue();
    },
    {
      target,
    },
  );

  // mouseleave 没有鼠标悬停
  useEventListener(
    'mouseleave',
    () => {
      onLeave?.();
      setFalse();
    },
    {
      target,
    },
  );

  return state;
};
