import useLatest from '../useLatest';
import type { BasicTarget } from '../utils/domTarget';
import { getTargetElement } from '../utils/domTarget';
import useEffectWithTarget from '../utils/useEffectWithTarget';

// 监听目标元素外的点击事件。
export default function useClickAway<T extends Event = Event>(
  // 触发函数
  onClickAway: (event: T) => void,
  // DOM 节点或者 Ref，支持数组
  target: BasicTarget | BasicTarget[],
  // 指定需要监听的事件，支持数组
  eventName: string | string[] = 'click',
) {
  const onClickAwayRef = useLatest(onClickAway);

  useEffectWithTarget(
    () => {
      const handler = (event: any) => {
        const targets = Array.isArray(target) ? target : [target];
        if (
          // 判断点击的 DOM Target 是否在定义的 DOM 元素（列表）中
          targets.some((item) => {
            const targetElement = getTargetElement(item);
            return !targetElement || targetElement.contains(event.target);
          })
        ) {
          return;
        }
        // 触发点击事件
        onClickAwayRef.current(event);
      };

      // 事件列表
      const eventNames = Array.isArray(eventName) ? eventName : [eventName];
      // document.addEventListener 监听事件，通过事件代理的方式知道目标节点
      eventNames.forEach((event) => document.addEventListener(event, handler));

      return () => {
        eventNames.forEach((event) => document.removeEventListener(event, handler));
      };
    },
    Array.isArray(eventName) ? eventName : [eventName],
    target,
  );
}
