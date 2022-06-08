import { isFunction } from '../../utils';
import type { MutableRefObject } from 'react';
import type { FetchState, Options, PluginReturn, Service, Subscribe } from './types';

export default class Fetch<TData, TParams extends any[]> {
  // 插件执行后返回的方法列表
  pluginImpls: PluginReturn<TData, TParams>[];
  count: number = 0;
  // 几个重要的返回值
  state: FetchState<TData, TParams> = {
    loading: false,
    params: undefined,
    data: undefined,
    error: undefined,
  };

  constructor(
    // React.MutableRefObject —— useRef创建的类型，可以修改
    public serviceRef: MutableRefObject<Service<TData, TParams>>,
    public options: Options<TData, TParams>,
    // 订阅-更新函数
    public subscribe: Subscribe,
    // 初始值
    public initState: Partial<FetchState<TData, TParams>> = {},
  ) {
    this.state = {
      ...this.state,
      loading: !options.manual, // 非手动，就loading
      ...initState,
    };
  }

  // 更新状态
  setState(s: Partial<FetchState<TData, TParams>> = {}) {
    this.state = {
      ...this.state,
      ...s,
    };
    this.subscribe();
  }

  // 执行插件中的某个事件（event），rest 为参数传入
  runPluginHandler(event: keyof PluginReturn<TData, TParams>, ...rest: any[]) {
    // @ts-ignore
    const r = this.pluginImpls.map((i) => i[event]?.(...rest)).filter(Boolean);
    return Object.assign({}, ...r);
  }

  // 如果设置了 options.manual = true，则 useRequest 不会默认执行，需要通过 run 或者 runAsync 来触发执行。
  // runAsync 是一个返回 Promise 的异步函数，如果使用 runAsync 来调用，则意味着你需要自己捕获异常。
  async runAsync(...params: TParams): Promise<TData> {
    this.count += 1;
    // 主要为了 cancel 请求
    const currentCount = this.count;

    const {
      stopNow = false,
      returnNow = false,
      ...state
      // 先执行每个插件的前置函数
    } = this.runPluginHandler('onBefore', params);

    // stop request
    if (stopNow) {
      return new Promise(() => {});
    }
    this.setState({
      // 开始 loading
      loading: true,
      // 请求参数
      params,
      ...state,
    });

    // return now
    // 立即返回，跟缓存策略有关
    if (returnNow) {
      return Promise.resolve(state.data);
    }

    // onBefore - 请求之前触发
    // 假如有缓存数据，则直接返回
    this.options.onBefore?.(params);

    try {
      // replace service
      // 如果有 cache 的实例，则使用缓存的实例
      let { servicePromise } = this.runPluginHandler('onRequest', this.serviceRef.current, params);

      if (!servicePromise) {
        servicePromise = this.serviceRef.current(...params);
      }

      const res = await servicePromise;

      // 假如不是同一个请求，则返回空的 promise
      if (currentCount !== this.count) {
        // prevent run.then when request is canceled
        return new Promise(() => {});
      }

      // const formattedResult = this.options.formatResultRef.current ? this.options.formatResultRef.current(res) : res;

      this.setState({
        // service 返回的数据
        data: res,
        // 已成功，error 为 undefined
        error: undefined,
        // loading 设置为 false
        loading: false,
      });

      // service resolve 时触发
      this.options.onSuccess?.(res, params);
      // plugin 中 onSuccess 事件
      this.runPluginHandler('onSuccess', res, params);
      // service 执行完成时触发
      this.options.onFinally?.(params, res, undefined);

      if (currentCount === this.count) {
        // plugin 中 onFinally 事件
        this.runPluginHandler('onFinally', params, res, undefined);
      }

      return res;
      // 捕获报错
    } catch (error) {
      if (currentCount !== this.count) {
        // prevent run.then when request is canceled
        return new Promise(() => {});
      }

      this.setState({
        // 设置错误
        error,
        loading: false,
      });
      // service reject 时触发
      this.options.onError?.(error, params);
      // 执行 plugin 中的 onError 事件
      this.runPluginHandler('onError', error, params);
      // service 执行完成时触发
      this.options.onFinally?.(params, undefined, error);

      if (currentCount === this.count) {
        // plugin 中 onFinally 事件
        this.runPluginHandler('onFinally', params, undefined, error);
      }

      // 抛出错误。
      // 让外部捕获感知错误
      throw error;
    }
  }
  // run 是一个普通的同步函数，其内部也是调用了 runAsync 方法
  run(...params: TParams) {
    // 自动捕获异常
    this.runAsync(...params).catch((error) => {
      // 你可以通过 options.onError 来处理异常时的行为
      if (!this.options.onError) {
        console.error(error);
      }
    });
  }

  // 取消当前正在进行的请求
  cancel() {
    // 设置 + 1，在执行 runAsync 的时候，就会发现 currentCount !== this.count，从而达到取消请求的目的
    this.count += 1;
    this.setState({
      loading: false,
    });

    // 执行 plugin 中所有的 onCancel 方法
    this.runPluginHandler('onCancel');
  }

  // 使用上一次的 params，重新调用 run
  refresh() {
    // @ts-ignore
    this.run(...(this.state.params || []));
  }

  // 使用上一次的 params，重新调用 runAsync
  refreshAsync() {
    // @ts-ignore
    return this.runAsync(...(this.state.params || []));
  }

  // 参数可以为函数，也可以是一个值
  mutate(data?: TData | ((oldData?: TData) => TData | undefined)) {
    let targetData: TData | undefined;
    // 为函数，则入参为旧值，返回新值
    if (isFunction(data)) {
      // @ts-ignore
      targetData = data(this.state.data);
    } else {
      // 直接覆盖旧值
      targetData = data;
    }

    // 执行 onMutate 事件
    this.runPluginHandler('onMutate', targetData);

    this.setState({
      data: targetData,
    });
  }
}
