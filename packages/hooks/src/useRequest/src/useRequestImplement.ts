import useCreation from '../../useCreation';
import useLatest from '../../useLatest';
import useMemoizedFn from '../../useMemoizedFn';
import useMount from '../../useMount';
import useUnmount from '../../useUnmount';
import useUpdate from '../../useUpdate';

import Fetch from './Fetch';
import type { Options, Plugin, Result, Service } from './types';

function useRequestImplement<TData, TParams extends any[]>(
  service: Service<TData, TParams>,
  options: Options<TData, TParams> = {},
  plugins: Plugin<TData, TParams>[] = [],
) {
  // manual 设置为 true，则 useRequest 不会默认执行，需要通过 run 来触发执行
  const { manual = false, ...rest } = options;

  const fetchOptions = {
    manual,
    ...rest,
  };

  const serviceRef = useLatest(service);

  const update = useUpdate();

  // 保证请求实例都不会发生改变
  const fetchInstance = useCreation(() => {
    // 目前只有 useAutoRunPlugin 这个 plugin 有这个方法
    // 初始化状态，返回 { loading: xxx }，代表是否 loading
    const initState = plugins.map((p) => p?.onInit?.(fetchOptions)).filter(Boolean);
    // 返回请求实例
    return new Fetch<TData, TParams>(
      serviceRef,
      fetchOptions,
      // 可以更新父组件
      update,
      Object.assign({}, ...initState),
    );
  }, []);
  fetchInstance.options = fetchOptions;
  // run all plugins hooks
  // 执行所有的 plugin，拓展能力，每个 plugin 中都返回的方法，可以在特定时机执行
  fetchInstance.pluginImpls = plugins.map((p) => p(fetchInstance, fetchOptions));

  // 组件挂载时
  useMount(() => {
    if (!manual) {
      // useCachePlugin can set fetchInstance.state.params from cache when init
      // defaultParams，首次默认执行时，传递给 service 的参数
      const params = fetchInstance.state.params || options.defaultParams || [];
      // 运行一次
      // @ts-ignore
      fetchInstance.run(...params);
    }
  });

  // 在组件卸载（unmount）时执行 cancel
  useUnmount(() => {
    fetchInstance.cancel();
  });

  return {
    // service 是否正在执行
    loading: fetchInstance.state.loading,
    // service 返回的数据
    data: fetchInstance.state.data,
    // service 抛出的异常
    error: fetchInstance.state.error,
    // 当次执行的 service 的参数数组。比如你触发了 run(1, 2, 3)，则 params 等于 [1, 2, 3]
    params: fetchInstance.state.params || [],
    // 取消当前正在进行的请求
    cancel: useMemoizedFn(fetchInstance.cancel.bind(fetchInstance)),
    // 使用上一次的 params，重新调用 run
    refresh: useMemoizedFn(fetchInstance.refresh.bind(fetchInstance)),
    // 使用上一次的 params，重新调用 runAsync
    refreshAsync: useMemoizedFn(fetchInstance.refreshAsync.bind(fetchInstance)),
    // 手动触发 service 执行，参数会传递给 service
    // 异常自动处理，通过 onError 反馈
    run: useMemoizedFn(fetchInstance.run.bind(fetchInstance)),
    // 与 run 用法一致，但返回的是 Promise，需要自行处理异常。
    runAsync: useMemoizedFn(fetchInstance.runAsync.bind(fetchInstance)),
    // 直接修改 data
    mutate: useMemoizedFn(fetchInstance.mutate.bind(fetchInstance)),
  } as Result<TData, TParams>;
}

export default useRequestImplement;
