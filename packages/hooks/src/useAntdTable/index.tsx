import { useEffect, useRef, useState } from 'react';
import useMemoizedFn from '../useMemoizedFn';
import usePagination from '../usePagination';
import useUpdateEffect from '../useUpdateEffect';

import type {
  Antd4ValidateFields,
  AntdTableOptions,
  Data,
  Params,
  Service,
  AntdTableResult,
} from './types';

const useAntdTable = <TData extends Data, TParams extends Params>(
  service: Service<TData, TParams>,
  options: AntdTableOptions<TData, TParams> = {},
) => {
  const {
    // form 实例
    form,
    // 默认表单选项
    defaultType = 'simple',
    // 默认参数，第一项为分页数据，第二项为表单数据。[pagination, formData]
    defaultParams,
    manual = false,
    // refreshDeps 变化，会重置 current 到第一页，并重新发起请求。
    refreshDeps = [],
    ready = true,
    ...rest
  } = options;

  // 对分页的逻辑进行处理
  // 分页也是对 useRequest 的再封装
  const result = usePagination<TData, TParams>(service, {
    manual: true,
    ...rest,
  });

  // params - 请求的参数
  // run - 用来执行请求
  const { params = [], run } = result;

  // TODO:缓存？
  const cacheFormTableData = params[2] || ({} as any);

  const [type, setType] = useState(cacheFormTableData?.type || defaultType);

  const allFormDataRef = useRef<Record<string, any>>({});
  const defaultDataSourceRef = useRef([]);

  // 判断是否为 Antd 的第四版本
  const isAntdV4 = !!form?.getInternalHooks;

  // get current active field values
  // 获取当前的 from 值
  const getActivetFieldValues = () => {
    if (!form) {
      return {};
    }

    // antd 4
    if (isAntdV4) {
      return form.getFieldsValue(null, () => true);
    }

    // antd 3
    const allFieldsValue = form.getFieldsValue();
    const activeFieldsValue = {};
    Object.keys(allFieldsValue).forEach((key: string) => {
      if (form.getFieldInstance ? form.getFieldInstance(key) : true) {
        activeFieldsValue[key] = allFieldsValue[key];
      }
    });

    return activeFieldsValue;
  };

  // 校验逻辑
  const validateFields = (): Promise<Record<string, any>> => {
    if (!form) {
      return Promise.resolve({});
    }
    const activeFieldsValue = getActivetFieldValues();
    const fields = Object.keys(activeFieldsValue);

    // antd 4
    if (isAntdV4) {
      return (form.validateFields as Antd4ValidateFields)(fields);
    }
    // antd 3
    return new Promise((resolve, reject) => {
      form.validateFields(fields, (errors, values) => {
        if (errors) {
          reject(errors);
        } else {
          resolve(values);
        }
      });
    });
  };

  // 重置表单
  const restoreForm = () => {
    if (!form) {
      return;
    }

    // antd v4
    if (isAntdV4) {
      return form.setFieldsValue(allFormDataRef.current);
    }

    // antd v3
    const activeFieldsValue = {};
    Object.keys(allFormDataRef.current).forEach((key) => {
      if (form.getFieldInstance ? form.getFieldInstance(key) : true) {
        activeFieldsValue[key] = allFormDataRef.current[key];
      }
    });
    form.setFieldsValue(activeFieldsValue);
  };

  const changeType = () => {
    // 获取当前表单值
    const activeFieldsValue = getActivetFieldValues();
    // 修改表单值
    allFormDataRef.current = {
      ...allFormDataRef.current,
      ...activeFieldsValue,
    };
    // 设置表单类型
    setType((t) => (t === 'simple' ? 'advance' : 'simple'));
  };

  const _submit = (initPagination?: TParams[0]) => {
    if (!ready) {
      return;
    }
    // TODO:这里为什么要 setTimeout?
    setTimeout(() => {
      // 先进行校验
      validateFields()
        .then((values = {}) => {
          // 分页的逻辑
          const pagination = initPagination || {
            pageSize: options.defaultPageSize || 10,
            ...(params?.[0] || {}),
            current: 1,
          };
          // 假如没有 form，则直接根据分页的逻辑进行请求
          if (!form) {
            // @ts-ignore
            run(pagination);
            return;
          }
          // 获取到当前所有 form 的 Data 参数
          // record all form data
          allFormDataRef.current = {
            ...allFormDataRef.current,
            ...values,
          };

          // @ts-ignore
          run(pagination, values, {
            allFormData: allFormDataRef.current,
            type,
          });
        })
        .catch((err) => err);
    });
  };

  // 重置表单
  const reset = () => {
    if (form) {
      form.resetFields();
    }
    _submit();
  };

  // 提交
  const submit = (e?: any) => {
    e?.preventDefault?.();
    _submit();
  };

  // Table 组件的 onChange 事件
  const onTableChange = (pagination: any, filters: any, sorter: any) => {
    const [oldPaginationParams, ...restParams] = params || [];
    run(
      // @ts-ignore
      {
        ...oldPaginationParams,
        current: pagination.current,
        pageSize: pagination.pageSize,
        filters,
        sorter,
      },
      ...restParams,
    );
  };
  // 初始化逻辑
  // init
  useEffect(() => {
    // if has cache, use cached params. ignore manual and ready.
    // params.length > 0，则说明有缓存
    if (params.length > 0) {
      // 使用缓存的数据
      allFormDataRef.current = cacheFormTableData?.allFormData || {};
      // 重置表单后执行请求
      restoreForm();
      // @ts-ignore
      run(...params);
      return;
    }
    // 非手动并且已经 ready，则执行 _submit
    if (!manual && ready) {
      allFormDataRef.current = defaultParams?.[1] || {};
      restoreForm();
      _submit(defaultParams?.[0]);
    }
  }, []);

  // change search type, restore form data
  // 修改 type，则重置 form 表单数据
  useUpdateEffect(() => {
    if (!ready) {
      return;
    }
    restoreForm();
  }, [type]);

  // refresh & ready change on the same time
  const hasAutoRun = useRef(false);
  hasAutoRun.current = false;

  useUpdateEffect(() => {
    if (!manual && ready) {
      hasAutoRun.current = true;
      if (form) {
        form.resetFields();
      }
      allFormDataRef.current = defaultParams?.[1] || {};
      restoreForm();
      _submit(defaultParams?.[0]);
    }
  }, [ready]);

  // 当依赖发生变更的时候，会重置 current 到第一页，并重新发起请求。
  useUpdateEffect(() => {
    if (hasAutoRun.current) {
      return;
    }
    if (!ready) {
      return;
    }
    if (!manual) {
      hasAutoRun.current = true;
      result.pagination.changeCurrent(1);
    }
  }, [...refreshDeps]);

  return {
    ...result,
    // Table 组件需要的数据，直接透传给 Table 组件即可
    tableProps: {
      dataSource: result.data?.list || defaultDataSourceRef.current,
      loading: result.loading,
      onChange: useMemoizedFn(onTableChange),
      pagination: {
        current: result.pagination.current,
        pageSize: result.pagination.pageSize,
        total: result.pagination.total,
      },
    },
    search: {
      // 提交表单
      submit: useMemoizedFn(submit),
      // 当前表单类型， simple | advance
      type,
      // 切换表单类型
      changeType: useMemoizedFn(changeType),
      // 重置当前表单
      reset: useMemoizedFn(reset),
    },
  } as AntdTableResult<TData, TParams>;
};

export default useAntdTable;
