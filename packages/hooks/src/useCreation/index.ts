import type { DependencyList } from 'react';
import { useRef } from 'react';
import depsAreSame from '../utils/depsAreSame';

export default function useCreation<T>(factory: () => T, deps: DependencyList) {
  const { current } = useRef({
    deps,
    obj: undefined as undefined | T,
    initialized: false,
  });
  // 刚初始化或者依赖不相等的时候（通过 Object.is 进行判断）
  if (current.initialized === false || !depsAreSame(current.deps, deps)) {
    // 更新依赖
    current.deps = deps;
    // 执行工厂函数
    current.obj = factory();
    // 初始化标识位置为 true
    current.initialized = true;
  }
  return current.obj as T;
}
