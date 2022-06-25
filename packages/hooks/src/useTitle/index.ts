import { useEffect, useRef } from 'react';
import useUnmount from '../useUnmount';
import isBrowser from '../utils/isBrowser';

export interface Options {
  restoreOnUnmount?: boolean;
}

const DEFAULT_OPTIONS: Options = {
  restoreOnUnmount: false,
};

function useTitle(title: string, options: Options = DEFAULT_OPTIONS) {
  const titleRef = useRef(isBrowser ? document.title : '');
  useEffect(() => {
    document.title = title;
  }, [title]);

  useUnmount(() => {
    // 组件卸载后，恢复上一次的 title
    if (options.restoreOnUnmount) {
      document.title = titleRef.current;
    }
  });
}

export default useTitle;
