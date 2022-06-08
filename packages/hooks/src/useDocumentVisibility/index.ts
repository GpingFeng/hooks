import { useState } from 'react';
import useEventListener from '../useEventListener';
import isBrowser from '../utils/isBrowser';

type VisibilityState = 'hidden' | 'visible' | 'prerender' | undefined;

const getVisibility = () => {
  if (!isBrowser) {
    return 'visible';
  }
  //  Document.visibilityState （只读属性）, 返回document的可见性， 即当前可见元素的上下文环境。由此可以知道当前文档 (即为页面) 是在背后， 或是不可见的隐藏的标签页，或者 (正在) 预渲染。可用的值如下：
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
