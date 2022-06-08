import { useRef } from 'react';
import useLatest from '../useLatest';
import type { BasicTarget } from '../utils/domTarget';
import { getTargetElement } from '../utils/domTarget';
import isBrowser from '../utils/isBrowser';
import useEffectWithTarget from '../utils/useEffectWithTarget';

type EventType = MouseEvent | TouchEvent;
export interface Options {
  delay?: number;
  onClick?: (event: EventType) => void;
  onLongPressEnd?: (event: EventType) => void;
}

// 判断是否支持 touch 事件
const touchSupported =
  isBrowser &&
  // @ts-ignore
  ('ontouchstart' in window || (window.DocumentTouch && document instanceof DocumentTouch));

function useLongPress(
  onLongPress: (event: EventType) => void,
  target: BasicTarget,
  { delay = 300, onClick, onLongPressEnd }: Options = {},
) {
  const onLongPressRef = useLatest(onLongPress);
  const onClickRef = useLatest(onClick);
  const onLongPressEndRef = useLatest(onLongPressEnd);

  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const isTriggeredRef = useRef(false);

  useEffectWithTarget(
    () => {
      const targetElement = getTargetElement(target);
      if (!targetElement?.addEventListener) {
        return;
      }
      // 开始
      const onStart = (event: TouchEvent | MouseEvent) => {
        timerRef.current = setTimeout(() => {
          onLongPressRef.current(event);
          isTriggeredRef.current = true;
          // delay - 	长按时间
        }, delay);
      };
      // 结束
      const onEnd = (event: TouchEvent | MouseEvent, shouldTriggerClick: boolean = false) => {
        // 先 clear 开始的定时器
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        // 有开始，才会触发长按事件
        if (isTriggeredRef.current) {
          onLongPressEndRef.current?.(event);
        }
        // 是否触发 onClick 事件
        if (shouldTriggerClick && !isTriggeredRef.current && onClickRef.current) {
          onClickRef.current(event);
        }
        isTriggeredRef.current = false;
      };

      // 结束
      const onEndWithClick = (event: TouchEvent | MouseEvent) => onEnd(event, true);

      // 看支不支持 touch 事件，不支持，则监听 mousedown 、mouseup、mouseleave
      if (!touchSupported) {
        targetElement.addEventListener('mousedown', onStart);
        targetElement.addEventListener('mouseup', onEndWithClick);
        targetElement.addEventListener('mouseleave', onEnd);
      } else {
        targetElement.addEventListener('touchstart', onStart);
        targetElement.addEventListener('touchend', onEndWithClick);
      }

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          isTriggeredRef.current = false;
        }
        if (!touchSupported) {
          targetElement.removeEventListener('mousedown', onStart);
          targetElement.removeEventListener('mouseup', onEndWithClick);
          targetElement.removeEventListener('mouseleave', onEnd);
        } else {
          targetElement.removeEventListener('touchstart', onStart);
          targetElement.removeEventListener('touchend', onEndWithClick);
        }
      };
    },
    [],
    target,
  );
}

export default useLongPress;
