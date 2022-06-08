import { useMemoizedFn, useUpdate } from 'ahooks';
import { parse, stringify } from 'query-string';
import type { ParseOptions, StringifyOptions } from 'query-string';
import { useMemo, useRef } from 'react';
import type * as React from 'react';
// react router
import * as tmp from 'react-router';

// 通过 url query 来管理 state 的 Hook。
// ignore waring `"export 'useNavigate' (imported as 'rc') was not found in 'react-router'`
const rc = tmp as any;

export interface Options {
  navigateMode?: 'push' | 'replace';
  parseOptions?: ParseOptions;
  stringifyOptions?: StringifyOptions;
}

const baseParseConfig: ParseOptions = {
  parseNumbers: false,
  parseBooleans: false,
};

const baseStringifyConfig: StringifyOptions = {
  skipNull: false,
  skipEmptyString: false,
};

type UrlState = Record<string, any>;

const useUrlState = <S extends UrlState = UrlState>(
  // 初始状态
  initialState?: S | (() => S),
  // url 配置
  options?: Options,
) => {
  type State = Partial<{ [key in keyof S]: any }>;
  const {
    // 状态变更时切换 history 的方式
    navigateMode = 'push',
    // query-string parse 的配置
    parseOptions,
    // query-string stringify 的配置
    stringifyOptions,
  } = options || {};

  const mergedParseOptions = { ...baseParseConfig, ...parseOptions };
  const mergedStringifyOptions = { ...baseStringifyConfig, ...stringifyOptions };

  // useLocation钩子返回表示当前URL的location对象。您可以将它想象成一个useState，它在URL更改时返回一个新位置。
  const location = rc.useLocation();

  // https://v5.reactrouter.com/web/api/Hooks/usehistory
  // useHistory 钩子可以访问用来导航的历史实例。
  // react-router v5
  const history = rc.useHistory?.();
  // react-router v6
  const navigate = rc.useNavigate?.();

  const update = useUpdate();

  const initialStateRef = useRef(
    typeof initialState === 'function' ? (initialState as () => S)() : initialState || {},
  );

  // 根据 url query
  const queryFromUrl = useMemo(() => {
    return parse(location.search, mergedParseOptions);
  }, [location.search]);

  const targetQuery: State = useMemo(
    () => ({
      ...initialStateRef.current,
      ...queryFromUrl,
    }),
    [queryFromUrl],
  );

  // 用法同 useState，但 state 需要是 object
  // 设置 url 状态
  const setState = (s: React.SetStateAction<State>) => {
    const newQuery = typeof s === 'function' ? s(targetQuery) : s;

    // 1. 如果 setState 后，search 没变化，就需要 update 来触发一次更新。比如 demo1 直接点击 clear，就需要 update 来触发更新。
    // 2. update 和 history 的更新会合并，不会造成多次更新
    update();
    if (history) {
      history[navigateMode]({
        hash: location.hash,
        search: stringify({ ...queryFromUrl, ...newQuery }, mergedStringifyOptions) || '?',
      });
    }
    if (navigate) {
      navigate(
        {
          hash: location.hash,
          search: stringify({ ...queryFromUrl, ...newQuery }, mergedStringifyOptions) || '?',
        },
        {
          replace: navigateMode === 'replace',
        },
      );
    }
  };

  return [targetQuery, useMemoizedFn(setState)] as const;
};

export default useUrlState;
