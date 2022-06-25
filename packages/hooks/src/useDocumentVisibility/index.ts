import { useState } from 'react';
import useEventListener from '../useEventListener';
import isBrowser from '../utils/isBrowser';

type VisibilityState = 'hidden' | 'visible' | 'prerender' | undefined;

const getVisibility = () => {
  if (!isBrowser) {
    return 'visible';
  }
  //  Document.visibilityState （只读属性）, 返回document的可见性， 即当前可见元素的上下文环境。
  return document.visibilityState;
};

// 监听页面是否可见
// https://developer.mozilla.org/zh-CN/docs/Web/API/Document/visibilityState
function useDocumentVisibility(): VisibilityState {
  const [documentVisibility, setDocumentVisibility] = useState(() => getVisibility());

  useEventListener(
    // 监听该事件
    'visibilitychange',
    () => {
      setDocumentVisibility(getVisibility());
    },
    {
      target: () => document,
    },
  );

  return documentVisibility;
}

export default useDocumentVisibility;
