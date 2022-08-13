import { useMemo, useRef } from 'react';
import type { SetStateAction } from 'react';
import { isFunction } from '../utils';
import useMemoizedFn from '../useMemoizedFn';
import useUpdate from '../useUpdate';

export interface Options<T> {
  defaultValue?: T;
  defaultValuePropName?: string;
  valuePropName?: string;
  trigger?: string;
}

export type Props = Record<string, any>;

export interface StandardProps<T> {
  value: T;
  defaultValue?: T;
  onChange: (val: T) => void;
}

function useControllableValue<T = any>(
  props: StandardProps<T>,
): [T, (v: SetStateAction<T>) => void];
function useControllableValue<T = any>(
  // props，组件的 props
  props?: Props,
  // 可选配置项
  options?: Options<T>,
): [T, (v: SetStateAction<T>, ...args: any[]) => void];
function useControllableValue<T = any>(props: Props = {}, options: Options<T> = {}) {
  const {
    // 默认值，会被 props.defaultValue 和 props.value 覆盖
    defaultValue,
    // 默认值的属性名
    defaultValuePropName = 'defaultValue',
    // 值的属性名
    valuePropName = 'value',
    // 修改值时，触发的函数
    trigger = 'onChange',
  } = options;

  const value = props[valuePropName] as T;
  // 如果有value，则是受控
  const isControlled = props.hasOwnProperty(valuePropName);

  const initialValue = useMemo(() => {
    // 如果是受控，则返回值
    if (isControlled) {
      return value;
    }
    // 处理默认值
    if (props.hasOwnProperty(defaultValuePropName)) {
      return props[defaultValuePropName];
    }
    return defaultValue;
  }, []);

  const stateRef = useRef(initialValue);
  // 受控组件，则由外部传入的 value 更新 state
  if (isControlled) {
    stateRef.current = value;
  }

  // 更新组件
  const update = useUpdate();

  // 设置值方法
  function setState(v: SetStateAction<T>, ...args: any[]) {
    const r = isFunction(v) ? v(stateRef.current) : v;
    // 非受控组件，则自己更新状态
    if (!isControlled) {
      stateRef.current = r;
      update();
    }
    // 传了 trigger 函数。则触发 trigger 函数，trigger 函数默认为 onChange 事件
    if (props[trigger]) {
      props[trigger](r, ...args);
    }
  }

  return [stateRef.current, useMemoizedFn(setState)] as const;
}

export default useControllableValue;
