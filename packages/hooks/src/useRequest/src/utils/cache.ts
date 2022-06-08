type Timer = ReturnType<typeof setTimeout>;
type CachedKey = string | number;

export interface CachedData<TData = any, TParams = any> {
  data: TData;
  params: TParams;
  time: number;
}
interface RecordData extends CachedData {
  timer: Timer | undefined;
}
// 通过 map 数据结构进行缓存
const cache = new Map<CachedKey, RecordData>();
// 设置缓存
const setCache = (key: CachedKey, cacheTime: number, cachedData: CachedData) => {
  // 是否存在
  const currentCache = cache.get(key);
  // 假如存在，则先清除
  if (currentCache?.timer) {
    clearTimeout(currentCache.timer);
  }

  let timer: Timer | undefined = undefined;

  // 缓存时间，设置定时器
  if (cacheTime > -1) {
    // if cache out, clear it
    timer = setTimeout(() => {
      cache.delete(key);
    }, cacheTime);
  }

  // 设置缓存以及数据
  cache.set(key, {
    ...cachedData,
    timer,
  });
};

const getCache = (key: CachedKey) => {
  return cache.get(key);
};

const clearCache = (key?: string | string[]) => {
  if (key) {
    const cacheKeys = Array.isArray(key) ? key : [key];
    cacheKeys.forEach((cacheKey) => cache.delete(cacheKey));
  } else {
    cache.clear();
  }
};

export { getCache, setCache, clearCache };
