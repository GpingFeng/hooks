import { useMemo, useState } from 'react';
import useEventListener from '../useEventListener';
import useMemoizedFn from '../useMemoizedFn';
import useRequest from '../useRequest';
import useUpdateEffect from '../useUpdateEffect';
import { getTargetElement } from '../utils/domTarget';
import { getClientHeight, getScrollHeight, getScrollTop } from '../utils/rect';
import type { Data, InfiniteScrollOptions, Service } from './types';

// 常见无限滚动逻辑
const useInfiniteScroll = <TData extends Data>(
  // 请求服务
  service: Service<TData>,
  options: InfiniteScrollOptions<TData> = {},
) => {
  const {
    // 父级容器，如果存在，则在滚动到底部时，自动触发 loadMore。需要配合 isNoMore 使用，以便知道什么时候到最后一页了。
    target,
    // 是否有最后一页的判断逻辑，入参为当前聚合后的 data
    isNoMore,
    // 下拉自动加载，距离底部距离阈值
    threshold = 100,
    // 变化后，会自动触发 reload
    reloadDeps = [],
    // 默认 false。 即在初始化时自动执行 service。
    // 如果设置为 true，则需要手动调用 reload 或 reloadAsync 触发执行。
    manual,
    // service 执行前触发
    onBefore,
    // 执行后
    onSuccess,
    // service reject 时触发
    onError,
    // service 执行完成时触发
    onFinally,
  } = options;

  // 最终的数据
  const [finalData, setFinalData] = useState<TData>();
  // 是否loading more
  const [loadingMore, setLoadingMore] = useState(false);

  // 判断是否还有数据
  const noMore = useMemo(() => {
    if (!isNoMore) return false;
    return isNoMore(finalData);
  }, [finalData]);

  // 通过 useRequest 处理请求
  const { loading, run, runAsync, cancel } = useRequest(
    // 入参，将上次请求返回的数据整合到新的参数中
    async (lastData?: TData) => {
      const currentData = await service(lastData);
      // 首次请求，则直接设置
      if (!lastData) {
        setFinalData(currentData);
      } else {
        setFinalData({
          ...currentData,
          // service 返回的数据必须包含 list 数组，类型为 { list: any[], ...rest }
          // @ts-ignore
          list: [...lastData.list, ...currentData.list],
        });
      }
      return currentData;
    },
    {
      // 是否手动控制
      manual,
      // 请求结束
      onFinally: (_, d, e) => {
        // 设置 loading 为 false
        setLoadingMore(false);
        onFinally?.(d, e);
      },
      // 请求前
      onBefore: () => onBefore?.(),
      // 请求成功之后
      onSuccess: (d) => {
        setTimeout(() => {
          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          scrollMethod();
        });
        onSuccess?.(d);
      },
      onError: (e) => onError?.(e),
    },
  );

  // 同步加载更多
  const loadMore = () => {
    // 假如没有更多，直接返回
    if (noMore) return;
    setLoadingMore(true);
    // 执行 useRequest
    run(finalData);
  };

  // 异步加载更多，返回的值是 Promise，需要自行处理异常
  const loadMoreAsync = () => {
    if (noMore) return Promise.reject();
    setLoadingMore(true);
    return runAsync(finalData);
  };

  const reload = () => run();
  const reloadAsync = () => runAsync();

  // 滚动方法
  const scrollMethod = () => {
    const el = getTargetElement(target);
    if (!el) {
      return;
    }
    // Element.scrollTop 属性可以获取或设置一个元素的内容垂直滚动的像素数。
    const scrollTop = getScrollTop(el);
    // Element.scrollHeight 这个只读属性是一个元素内容高度的度量，包括由于溢出导致的视图中不可见内容。
    const scrollHeight = getScrollHeight(el);
    // 这个属性是只读属性，对于没有定义CSS或者内联布局盒子的元素为0，否则，它是元素内部的高度(单位像素)，包含内边距，但不包括水平滚动条、边框和外边距。
    const clientHeight = getClientHeight(el);

    // 根据上面三个值以及 threshold 判断是否进行加载更多
    if (scrollHeight - scrollTop <= clientHeight + threshold) {
      loadMore();
    }
  };

  // 监听滚动事件
  useEventListener(
    'scroll',
    () => {
      if (loading || loadingMore) {
        return;
      }
      scrollMethod();
    },
    { target },
  );

  useUpdateEffect(() => {
    run();
  }, [...reloadDeps]);

  return {
    // service 返回的数据，其中的 list 属性为聚合后数据
    data: finalData,
    // 是否正在进行首次请求
    loading: !loadingMore && loading,
    // 是否正在进行更多数据请求
    loadingMore,
    // 是否没有更多数据了，配置 options.isNoMore 后生效
    noMore,
    // 加载更多数据，会自动捕获异常，通过 options.onError 处理
    loadMore: useMemoizedFn(loadMore),
    // 加载更多数据，与 loadMore 行为一致，但返回的是 Promise，需要自行处理异常
    loadMoreAsync: useMemoizedFn(loadMoreAsync),
    // 加载第一页数据，会自动捕获异常，通过 options.onError 处理
    reload: useMemoizedFn(reload),
    // 加载第一页数据，与 reload 行为一致，但返回的是 Promise，需要自行处理异常
    reloadAsync: useMemoizedFn(reloadAsync),
    // 直接修改 data
    mutate: setFinalData,
    // 取消当前请求
    cancel,
  };
};

export default useInfiniteScroll;
