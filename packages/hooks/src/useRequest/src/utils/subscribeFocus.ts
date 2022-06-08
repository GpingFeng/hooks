// from swr
import canUseDom from '../../../utils/canUseDom';
import isDocumentVisible from './isDocumentVisible';
import isOnline from './isOnline';

const listeners: any[] = [];

function subscribe(listener: () => void) {
  listeners.push(listener);
  return function unsubscribe() {
    const index = listeners.indexOf(listener);
    listeners.splice(index, 1);
  };
}

if (canUseDom()) {
  const revalidate = () => {
    // dom 不可见，或者断网的时候
    if (!isDocumentVisible() || !isOnline()) return;
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      listener();
    }
  };
  // 监听 visibilitychange 和 focus 事件
  window.addEventListener('visibilitychange', revalidate, false);
  window.addEventListener('focus', revalidate, false);
}

export default subscribe;
