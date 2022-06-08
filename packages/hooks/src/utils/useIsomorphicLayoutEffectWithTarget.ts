import isBrowser from './isBrowser';
import useEffectWithTarget from './useEffectWithTarget';
import useLayoutEffectWithTarget from './useLayoutEffectWithTarget';

const useIsomorphicLayoutEffectWithTarget = isBrowser
  ? // 浏览器使用的方法
    useLayoutEffectWithTarget
  : // 非浏览器使用的方法
    useEffectWithTarget;

export default useIsomorphicLayoutEffectWithTarget;
