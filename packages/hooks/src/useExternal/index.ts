import { useEffect, useRef, useState } from 'react';

export interface Options {
  type?: 'js' | 'css';
  js?: Partial<HTMLScriptElement>;
  css?: Partial<HTMLStyleElement>;
}

// {[path]: count}
// remove external when no used
const EXTERNAL_USED_COUNT: Record<string, number> = {};

export type Status = 'unset' | 'loading' | 'ready' | 'error';

interface loadResult {
  ref: Element;
  status: Status;
}

// 加载 Script
const loadScript = (path: string, props = {}): loadResult => {
  // 看是否已经加载
  const script = document.querySelector(`script[src="${path}"]`);

  if (!script) {
    // 创建标签
    const newScript = document.createElement('script');
    // 设置 src
    newScript.src = path;
    // 设置属性值
    Object.keys(props).forEach((key) => {
      newScript[key] = props[key];
    });

    // 设置 loading 状态
    newScript.setAttribute('data-status', 'loading');
    // 加到 document.body 中
    document.body.appendChild(newScript);

    return {
      ref: newScript,
      status: 'loading',
    };
  }

  return {
    ref: script,
    // 状态
    status: (script.getAttribute('data-status') as Status) || 'ready',
  };
};

// 加载 CSS
const loadCss = (path: string, props = {}): loadResult => {
  const css = document.querySelector(`link[href="${path}"]`);
  // 没有，则创建
  if (!css) {
    const newCss = document.createElement('link');

    newCss.rel = 'stylesheet';
    newCss.href = path;
    // 设置相应的属性
    Object.keys(props).forEach((key) => {
      newCss[key] = props[key];
    });
    // IE9+
    const isLegacyIECss = 'hideFocus' in newCss;
    // use preload in IE Edge (to detect load errors)
    // preload 预加载
    if (isLegacyIECss && newCss.relList) {
      newCss.rel = 'preload';
      newCss.as = 'style';
    }
    // 正在加载中
    newCss.setAttribute('data-status', 'loading');
    // 在 head 标签中插入
    document.head.appendChild(newCss);

    return {
      // 返回
      ref: newCss,
      status: 'loading',
    };
  }

  // 有则直接返回，并取 data-status 中的值
  return {
    ref: css,
    status: (css.getAttribute('data-status') as Status) || 'ready',
  };
};

const useExternal = (path?: string, options?: Options) => {
  const [status, setStatus] = useState<Status>(path ? 'loading' : 'unset');

  const ref = useRef<Element>();

  useEffect(() => {
    if (!path) {
      // 未设置
      setStatus('unset');
      return;
    }
    // 处理 |个
    const pathname = path.replace(/[|#].*$/, '');
    // 判断是 CSS 类型
    if (options?.type === 'css' || (!options?.type && /(^css!|\.css$)/.test(pathname))) {
      const result = loadCss(path, options?.css);
      ref.current = result.ref;
      setStatus(result.status);
      // 判断是是 JavaScript 类型
    } else if (options?.type === 'js' || (!options?.type && /(^js!|\.js$)/.test(pathname))) {
      const result = loadScript(path, options?.js);
      ref.current = result.ref;
      setStatus(result.status);
    } else {
      // do nothing
      console.error(
        "Cannot infer the type of external resource, and please provide a type ('js' | 'css'). " +
          'Refer to the https://ahooks.js.org/hooks/dom/use-external/#options',
      );
    }

    if (!ref.current) {
      return;
    }

    // 每个 path 加载的次数
    if (EXTERNAL_USED_COUNT[path] === undefined) {
      EXTERNAL_USED_COUNT[path] = 1;
    } else {
      EXTERNAL_USED_COUNT[path] += 1;
    }

    const handler = (event: Event) => {
      // 判断和设置加载状态
      const targetStatus = event.type === 'load' ? 'ready' : 'error';
      ref.current?.setAttribute('data-status', targetStatus);
      setStatus(targetStatus);
    };

    // 监听文件下载的情况
    ref.current.addEventListener('load', handler);
    ref.current.addEventListener('error', handler);
    return () => {
      ref.current?.removeEventListener('load', handler);
      ref.current?.removeEventListener('error', handler);
      // 卸载的时候 - 1
      EXTERNAL_USED_COUNT[path] -= 1;

      if (EXTERNAL_USED_COUNT[path] === 0) {
        ref.current?.remove();
      }

      ref.current = undefined;
    };
  }, [path]);

  return status;
};

export default useExternal;
