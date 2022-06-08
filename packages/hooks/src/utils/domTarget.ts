import type { MutableRefObject } from 'react';
import { isFunction } from './index';
import isBrowser from './isBrowser';

type TargetValue<T> = T | undefined | null;

type TargetType = HTMLElement | Element | Window | Document;

export type BasicTarget<T extends TargetType = Element> =
  | (() => TargetValue<T>)
  | TargetValue<T>
  | MutableRefObject<TargetValue<T>>;

export function getTargetElement<T extends TargetType>(target: BasicTarget<T>, defaultElement?: T) {
  if (!isBrowser) {
    return undefined;
  }

  if (!target) {
    return defaultElement;
  }

  let targetElement: TargetValue<T>;

  if (isFunction(target)) {
    // 支持函数获取
    targetElement = target();
    // 假如 ref，则返回 current
  } else if ('current' in target) {
    targetElement = target.current;
    // 支持 DOM
  } else {
    targetElement = target;
  }

  return targetElement;
}
