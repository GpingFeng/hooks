import canUseDom from '../../../utils/canUseDom';
import isDocumentVisible from './isDocumentVisible';
// 1.维护一个事件队列。全局变量，存放订阅的事件
const listeners: any[] = [];
// 2.订阅事件
function subscribe(listener: () => void) {
  listeners.push(listener);
  // 3.返回取消订阅函数
  return function unsubscribe() {
    const index = listeners.indexOf(listener);
    listeners.splice(index, 1);
  };
}

if (canUseDom()) {
  const revalidate = () => {
    // dom 不可见
    if (!isDocumentVisible()) return;
    // dom 可见的时候，执行所有的事件
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      listener();
    }
  };
  // 4.监听 visibilitychange
  // 当其选项卡的内容变得可见或被隐藏时，会在文档上触发 visibilitychange (能见度更改)事件。
  // https://developer.mozilla.org/zh-CN/docs/Web/API/Document/visibilitychange_event
  window.addEventListener('visibilitychange', revalidate, false);
}

export default subscribe;
