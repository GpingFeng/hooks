type CachedKey = string | number;
// 缓存 promise
const cachePromise = new Map<CachedKey, Promise<any>>();

// 获取 promise
const getCachePromise = (cacheKey: CachedKey) => {
  return cachePromise.get(cacheKey);
};

const setCachePromise = (cacheKey: CachedKey, promise: Promise<any>) => {
  // 应该缓存相同的 promise，不能是 promise.finally
  // Should cache the same promise, cannot be promise.finally
  // 因为 promise.finally 会改变 promise 的引用
  // Because the promise.finally will change the reference of the promise
  cachePromise.set(cacheKey, promise);

  // no use promise.finally for compatibility
  // 不使用 promise.finally 来兼容
  promise
    .then((res) => {
      cachePromise.delete(cacheKey);
      return res;
    })
    .catch(() => {
      cachePromise.delete(cacheKey);
    });
};

export { getCachePromise, setCachePromise };
