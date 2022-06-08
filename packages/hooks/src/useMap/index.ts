import { useState } from 'react';
import useMemoizedFn from '../useMemoizedFn';

function useMap<K, T>(
  // 传入默认的 Map 参数
  initialValue?: Iterable<readonly [K, T]>,
) {
  const getInitValue = () => {
    return initialValue === undefined ? new Map() : new Map(initialValue);
  };

  const [map, setMap] = useState<Map<K, T>>(() => getInitValue());

  // 添加 map
  const set = (key: K, entry: T) => {
    setMap((prev) => {
      const temp = new Map(prev);
      temp.set(key, entry);
      return temp;
    });
  };

  // 生成一个新的 Map 对象
  const setAll = (newMap: Iterable<readonly [K, T]>) => {
    setMap(new Map(newMap));
  };

  // 移除
  const remove = (key: K) => {
    setMap((prev) => {
      const temp = new Map(prev);
      temp.delete(key);
      return temp;
    });
  };

  // 重置
  const reset = () => setMap(getInitValue());
  // 获取
  const get = (key: K) => map.get(key);

  return [
    map,
    {
      set: useMemoizedFn(set),
      setAll: useMemoizedFn(setAll),
      remove: useMemoizedFn(remove),
      reset: useMemoizedFn(reset),
      get: useMemoizedFn(get),
    },
  ] as const;
}

export default useMap;
