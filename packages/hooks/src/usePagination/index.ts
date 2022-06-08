import { useMemo } from 'react';
import useMemoizedFn from '../useMemoizedFn';
import useRequest from '../useRequest';

import type { Data, PaginationOptions, Params, Service, PaginationResult } from './types';

// usePagination 基于 useRequest 实现，封装了常见的分页逻辑。
const usePagination = <TData extends Data, TParams extends Params>(
  service: Service<TData, TParams>,
  options: PaginationOptions<TData, TParams> = {},
) => {
  const { defaultPageSize = 10, ...rest } = options;

  // service 返回的数据结构为 { total: number, list: Item[] }
  const result = useRequest(service, {
    // service 的第一个参数为 { current: number, pageSize: number }
    defaultParams: [{ current: 1, pageSize: defaultPageSize }],
    // refreshDeps 变化，会重置 current 到第一页，并重新发起请求，一般你可以把 pagination 依赖的条件放这里
    refreshDepsAction: () => {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      changeCurrent(1);
    },
    ...rest,
  });

  // 取到相关的请求参数
  const { current = 1, pageSize = defaultPageSize } = result.params[0] || {};

  // 获取请求结果，total 总梳理
  const total = result.data?.total || 0;
  // 获取到总的页面
  const totalPage = useMemo(() => Math.ceil(total / pageSize), [pageSize, total]);

  // 分页 onChange 方法
  // c，代表 current page
  // p，代表 page size
  const onChange = (c: number, p: number) => {
    let toCurrent = c <= 0 ? 1 : c;
    const toPageSize = p <= 0 ? 1 : p;
    // 根据 total 算出总页数
    const tempTotalPage = Math.ceil(total / toPageSize);
    // 假如此时总页面小于当前页面，需要将当前页面赋值为总页数
    if (toCurrent > tempTotalPage) {
      toCurrent = Math.max(1, tempTotalPage);
    }

    const [oldPaginationParams = {}, ...restParams] = result.params || [];

    // 重新执行请求
    result.run(
      // 留意参数变化，主要是当前页数和每页的总数量发生变化
      {
        ...oldPaginationParams,
        current: toCurrent,
        pageSize: toPageSize,
      },
      ...restParams,
    );
  };

  const changeCurrent = (c: number) => {
    onChange(c, pageSize);
  };

  const changePageSize = (p: number) => {
    onChange(current, p);
  };

  return {
    ...result,
    // 会额外返回 pagination 字段，包含所有分页信息，及操作分页的函数。
    pagination: {
      current,
      pageSize,
      total,
      totalPage,
      onChange: useMemoizedFn(onChange),
      changeCurrent: useMemoizedFn(changeCurrent),
      changePageSize: useMemoizedFn(changePageSize),
    },
  } as PaginationResult<TData, TParams>;
};

export default usePagination;
