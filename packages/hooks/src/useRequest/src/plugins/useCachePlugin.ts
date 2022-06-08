import { useRef } from 'react';
import useCreation from '../../../useCreation';
import useUnmount from '../../../useUnmount';
import type { Plugin } from '../types';
import * as cache from '../utils/cache';
import type { CachedData } from '../utils/cache';
import * as cachePromise from '../utils/cachePromise';
import * as cacheSubscribe from '../utils/cacheSubscribe';

const useCachePlugin: Plugin<any, any[]> = (
  fetchInstance,
  {
    // 请求唯一标识。如果设置了 cacheKey，我们会启用缓存机制。同一个 cacheKey 的数据全局同步。
    // useRequest 会将当前请求成功的数据缓存起来。下次组件初始化时，如果有缓存数据，我们会优先返回缓存数据，然后在背后发送新请求，也就是 SWR 的能力。
    cacheKey,
    // 设置数据缓存时间，超过该时间，我们会清空该条缓存数据。
    cacheTime = 5 * 60 * 1000,
    // 设置数据保持新鲜时间，在该时间内，我们认为数据是新鲜的，不会重新发起请求。
    staleTime = 0,
    // 通过配置 setCache 和 getCache，可以自定义数据缓存，比如可以将数据存储到 localStorage、IndexDB 等。
    setCache: customSetCache,
    getCache: customGetCache,
  },
) => {
  const unSubscribeRef = useRef<() => void>();

  const currentPromiseRef = useRef<Promise<any>>();

  // key - 缓存键值
  // cacheData 缓存数据
  const _setCache = (key: string, cachedData: CachedData) => {
    // 假如有传入自定义的设置缓存，则优先使用自定义缓存
    if (customSetCache) {
      customSetCache(cachedData);
    } else {
      cache.setCache(key, cacheTime, cachedData);
    }
    // 触发 key 的所有事件
    cacheSubscribe.trigger(key, cachedData.data);
  };

  // 获取缓存值
  const _getCache = (key: string, params: any[] = []) => {
    if (customGetCache) {
      return customGetCache(params);
    }
    return cache.getCache(key);
  };

  // useCreation 是 useMemo 或 useRef 的替代品。
  // useMemo 不能保证被 memo 的值一定不会被重计算，而 useCreation 可以保证这一点。
  // 而相比于 useRef，你可以使用 useCreation 创建一些常量，这些常量和 useRef 创建出来的 ref 有很多使用场景上的相似，但对于复杂常量的创建，useRef 却容易出现潜在的性能隐患。
  useCreation(() => {
    if (!cacheKey) {
      return;
    }
    // 初始化的时候看有没有值
    // get data from cache when init
    const cacheData = _getCache(cacheKey);
    if (cacheData && Object.hasOwnProperty.call(cacheData, 'data')) {
      // 直接使用缓存中 data 和 params 进行替代
      fetchInstance.state.data = cacheData.data;
      fetchInstance.state.params = cacheData.params;
      // staleTime为-1，或者还存在于新鲜时间内，则设置 loading 为 false
      if (staleTime === -1 || new Date().getTime() - cacheData.time <= staleTime) {
        fetchInstance.state.loading = false;
      }
    }
    // 订阅同一个 cacheKey 的请求事件列表
    // subscribe same cachekey update, trigger update
    unSubscribeRef.current = cacheSubscribe.subscribe(cacheKey, (data) => {
      fetchInstance.setState({ data });
    });
  }, []);

  useUnmount(() => {
    // 清除
    unSubscribeRef.current?.();
  });

  if (!cacheKey) {
    return {};
  }

  return {
    // 请求开始前
    onBefore: (params) => {
      // 获取缓存数据
      const cacheData = _getCache(cacheKey, params);

      if (!cacheData || !Object.hasOwnProperty.call(cacheData, 'data')) {
        return {};
      }

      // 如果还存于新鲜时间内，则不用请求
      // If the data is fresh, stop request
      if (staleTime === -1 || new Date().getTime() - cacheData.time <= staleTime) {
        return {
          loading: false,
          data: cacheData?.data,
          returnNow: true, // 控制直接返回
        };
      } else {
        // If the data is stale, return data, and request continue
        return {
          data: cacheData?.data,
        };
      }
    },
    // 请求阶段
    onRequest: (service, args) => {
      // 看 promise 有没有缓存
      let servicePromise = cachePromise.getCachePromise(cacheKey);

      // If has servicePromise, and is not trigger by self, then use it
      // 如果有servicePromise，并且不是自己触发的，那么就使用它
      if (servicePromise && servicePromise !== currentPromiseRef.current) {
        return { servicePromise };
      }

      servicePromise = service(...args);
      currentPromiseRef.current = servicePromise;
      // 设置 promise 缓存
      cachePromise.setCachePromise(cacheKey, servicePromise);
      return { servicePromise };
    },
    // 请求成功之后
    onSuccess: (data, params) => {
      if (cacheKey) {
        // 清除缓存事件列表
        // cancel subscribe, avoid trgger self
        unSubscribeRef.current?.();
        // 设置缓存
        _setCache(cacheKey, {
          data,
          params,
          time: new Date().getTime(),
        });
        // resubscribe
        // 重新订阅
        unSubscribeRef.current = cacheSubscribe.subscribe(cacheKey, (d) => {
          fetchInstance.setState({ data: d });
        });
      }
    },
    onMutate: (data) => {
      if (cacheKey) {
        // cancel subscribe, avoid trgger self
        unSubscribeRef.current?.();
        _setCache(cacheKey, {
          data,
          params: fetchInstance.state.params,
          time: new Date().getTime(),
        });
        // resubscribe
        unSubscribeRef.current = cacheSubscribe.subscribe(cacheKey, (d) => {
          fetchInstance.setState({ data: d });
        });
      }
    },
  };
};

export default useCachePlugin;
