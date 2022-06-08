// https://www.npmjs.com/package/resize-observer-polyfill
// https://github.com/que-etc/resize-observer-polyfill/blob/master/src/ResizeObserverController.js#L12
import ResizeObserver from 'resize-observer-polyfill';
import useRafState from '../useRafState';
import type { BasicTarget } from '../utils/domTarget';
import { getTargetElement } from '../utils/domTarget';
import useIsomorphicLayoutEffectWithTarget from '../utils/useIsomorphicLayoutEffectWithTarget';

type Size = { width: number; height: number };
// 监听 DOM 节点尺寸变化的 Hook。
function useSize(
  // 目标 DOM
  target: BasicTarget,
): Size | undefined {
  const [state, setState] = useRafState<Size>();

  useIsomorphicLayoutEffectWithTarget(
    () => {
      // 获取到当前目标元素
      const el = getTargetElement(target);

      if (!el) {
        return;
      }

      const resizeObserver = new ResizeObserver((entries) => {
        // 监听的 DOM 大小发生变化的时候，则获取到最新的值
        entries.forEach((entry) => {
          // DOM 节点的尺寸
          const { clientWidth, clientHeight } = entry.target;
          setState({
            width: clientWidth,
            height: clientHeight,
          });
        });
      });
      // 监听目标的元素
      resizeObserver.observe(el);
      // 销毁相应的事件，防止造成内存泄露
      return () => {
        resizeObserver.disconnect();
      };
    },
    // 依赖项
    [],
    // 目标元素
    target,
  );

  return state;
}

export default useSize;
