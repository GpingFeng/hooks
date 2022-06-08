/* eslint-disable no-empty */
import { useState } from 'react';
import useMemoizedFn from '../useMemoizedFn';
import useUpdateEffect from '../useUpdateEffect';
import { isFunction, isUndef } from '../utils';

export interface IFuncUpdater<T> {
  (previousState?: T): T;
}
export interface IFuncStorage {
  (): Storage;
}

export interface Options<T> {
  serializer?: (value: T) => string;
  deserializer?: (value: string) => T;
  defaultValue?: T | IFuncUpdater<T>;
}

export function createUseStorageState(getStorage: () => Storage | undefined) {
  function useStorageState<T>(key: string, options?: Options<T>) {
    let storage: Storage | undefined;

    // https://github.com/alibaba/hooks/issues/800
    try {
      storage = getStorage();
    } catch (err) {
      console.error(err);
    }
    // 自定义序列化方法
    const serializer = (value: T) => {
      if (options?.serializer) {
        return options?.serializer(value);
      }
      return JSON.stringify(value);
    };

    // 自定义反序列化方法
    const deserializer = (value: string) => {
      if (options?.deserializer) {
        return options?.deserializer(value);
      }
      return JSON.parse(value);
    };

    function getStoredValue() {
      try {
        const raw = storage?.getItem(key);
        if (raw) {
          return deserializer(raw);
        }
      } catch (e) {
        console.error(e);
      }
      // 默认值
      if (isFunction(options?.defaultValue)) {
        return options?.defaultValue();
      }
      return options?.defaultValue;
    }

    const [state, setState] = useState<T | undefined>(() => getStoredValue());

    // 当 key 更新的时候执行
    useUpdateEffect(() => {
      setState(getStoredValue());
    }, [key]);

    // 设置 State
    const updateState = (value?: T | IFuncUpdater<T>) => {
      // 如果是 undefined，则移除选项
      if (isUndef(value)) {
        setState(undefined);
        storage?.removeItem(key);
        // 如果是function，则用来吹 state
      } else if (isFunction(value)) {
        const currentState = value(state);
        try {
          setState(currentState);
          storage?.setItem(key, serializer(currentState));
        } catch (e) {
          console.error(e);
        }
      } else {
        // 设置值
        try {
          setState(value);
          storage?.setItem(key, serializer(value));
        } catch (e) {
          console.error(e);
        }
      }
    };

    return [state, useMemoizedFn(updateState)] as const;
  }
  return useStorageState;
}
