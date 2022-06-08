// https://developer.mozilla.org/zh-CN/docs/Web/API/Intersection_Observer_API
// https://www.npmjs.com/package/intersection-observer
import 'intersection-observer';
import { useState } from 'react';
import type { BasicTarget } from '../utils/domTarget';
import { getTargetElement } from '../utils/domTarget';
import useEffectWithTarget from '../utils/useEffectWithTarget';

export interface Options {
  rootMargin?: string;
  threshold?: number | number[];
  root?: BasicTarget<Element>;
}

function useInViewport(target: BasicTarget, options?: Options) {
  const [state, setState] = useState<boolean>();
  const [ratio, setRatio] = useState<number>();

  useEffectWithTarget(
    () => {
      const el = getTargetElement(target);
      if (!el) {
        return;
      }
      // Intersection Observer API 提供了一种异步检测目标元素与祖先元素或 viewport 相交情况变化的方法。
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            setRatio(entry.intersectionRatio);
            if (entry.isIntersecting) {
              setState(true);
            } else {
              setState(false);
            }
          }
        },
        {
          ...options,
          root: getTargetElement(options?.root),
        },
      );

      observer.observe(el);

      return () => {
        observer.disconnect();
      };
    },
    [],
    target,
  );

  return [state, ratio] as const;
}

export default useInViewport;
